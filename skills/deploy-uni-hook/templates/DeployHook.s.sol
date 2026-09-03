// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// TEMPLATE: deploy one hook + a fresh test pool, then run one swap.
// Env:
//   POOL_MANAGER  (required) - the v4 PoolManager for the target chain
//   HOOK_KIND     (optional) - "dynamic" | "noop" | "skim"  (default "dynamic")
//
// Run WITHOUT --broadcast to simulate (the dry-run gate).
// Run WITH --broadcast to deploy for real (armed).
//
// NOTE (funds): the pool is seeded with MockERC20 tokens this script mints to
// itself (free) — a mainnet broadcast risks GAS ONLY, never real capital. The
// deployed pool is a MockA/MockB demo; the hook contract is the real deliverable.

import {Script, console2} from "forge-std/Script.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {HookMiner} from "v4-periphery/test/shared/HookMiner.sol";

import {MockERC20} from "../src/MockERC20.sol";
import {DynamicFeeHook} from "../src/DynamicFeeHook.sol";
import {NoOpHook} from "../src/NoOpHook.sol";
import {HookFeeHook} from "../src/HookFeeHook.sol";
import {Hook} from "../src/Hook.sol"; // freeform (agent-generated)

contract DeployHook is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    PoolKey key;
    PoolSwapTest swapRouter;

    // First CREATE2 address whose low 14 bits match `flags`, IGNORING existing code
    // (HookMiner.find additionally requires empty code, so it skips this once occupied).
    // Mirrors HookMiner constants: deployer 0x4e59…, mask Hooks.ALL_HOOK_MASK, 160_444 loop.
    function _canonicalAddr(uint160 flags, bytes memory initCode, bytes memory ctorArgs)
        internal
        pure
        returns (address)
    {
        uint160 mask = Hooks.ALL_HOOK_MASK;
        bytes32 ich = keccak256(abi.encodePacked(initCode, ctorArgs));
        flags = flags & mask;
        for (uint256 salt; salt < 160_444; salt++) {
            address a = address(
                uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), CREATE2_DEPLOYER, salt, ich))))
            );
            if (uint160(a) & mask == flags) return a;
        }
        revert("no canonical salt");
    }

    function run() external {
        IPoolManager pm = IPoolManager(vm.envAddress("POOL_MANAGER"));
        string memory kind = vm.envOr("HOOK_KIND", string("dynamic"));
        bytes32 k = keccak256(bytes(kind));

        // choose flags + init code + fee by kind (pure selection — no broadcast yet)
        uint160 flags;
        bytes memory initCode;
        uint24 poolFee;
        if (k == keccak256("dynamic")) {
            flags = uint160(Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
            initCode = type(DynamicFeeHook).creationCode;
            poolFee = LPFeeLibrary.DYNAMIC_FEE_FLAG;
        } else if (k == keccak256("noop")) {
            flags = uint160(Hooks.BEFORE_SWAP_FLAG);
            initCode = type(NoOpHook).creationCode;
            poolFee = 3000;
        } else if (k == keccak256("skim")) {
            flags = uint160(Hooks.AFTER_SWAP_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG);
            initCode = type(HookFeeHook).creationCode;
            poolFee = 3000;
        } else if (k == keccak256("freeform")) {
            // flags auto-derived by hook-deploy.sh and passed in; fee from the manifest
            flags = uint160(vm.envUint("HOOK_FLAGS"));
            initCode = type(Hook).creationCode;
            string memory pf = vm.envOr("HOOK_POOL_FEE", string("3000"));
            poolFee = keccak256(bytes(pf)) == keccak256("dynamic")
                ? LPFeeLibrary.DYNAMIC_FEE_FLAG
                : uint24(vm.parseUint(pf));
        } else {
            revert("unknown HOOK_KIND");
        }

        // idempotency: the CANONICAL address is the first flag-matching CREATE2 salt
        // IGNORING code. The first deploy of this exact (creationCode, flags, pm) lands
        // there; HookMiner skips occupied addresses, so a later identical deploy would
        // land elsewhere. Thus if the canonical address already holds code, an identical
        // hook is already live — report it and stop (never a silent duplicate instance).
        address canonical = _canonicalAddr(flags, initCode, abi.encode(pm));
        if (canonical.code.length > 0) {
            console2.log("ALREADY_DEPLOYED", canonical);
            return;
        }

        // mine the CREATE2 salt so the hook address carries the right flag bits. The
        // canonical address is empty here, so HookMiner returns exactly it (stable).
        (address expected, bytes32 salt) = HookMiner.find(CREATE2_DEPLOYER, flags, initCode, abi.encode(pm));

        address me = msg.sender;
        vm.startBroadcast();

        // tokens (minted to self — no real value; the pool is a demo)
        MockERC20 tA = new MockERC20("Hook Test A", "HTA");
        MockERC20 tB = new MockERC20("Hook Test B", "HTB");
        tA.mint(me, 1e27);
        tB.mint(me, 1e27);
        (Currency c0, Currency c1) = address(tA) < address(tB)
            ? (Currency.wrap(address(tA)), Currency.wrap(address(tB)))
            : (Currency.wrap(address(tB)), Currency.wrap(address(tA)));

        // deploy the hook at the mined address
        address hookAddr;
        if (k == keccak256("dynamic")) {
            hookAddr = address(new DynamicFeeHook{salt: salt}(pm));
        } else if (k == keccak256("noop")) {
            hookAddr = address(new NoOpHook{salt: salt}(pm));
        } else if (k == keccak256("skim")) {
            hookAddr = address(new HookFeeHook{salt: salt}(pm));
        } else {
            hookAddr = address(new Hook{salt: salt}(pm));
        }
        require(hookAddr == expected, "hook addr mismatch");
        require(uint160(hookAddr) & Hooks.ALL_HOOK_MASK == flags, "flag bits wrong");

        // pool + init at 1:1
        key = PoolKey({currency0: c0, currency1: c1, fee: poolFee, tickSpacing: 60, hooks: IHooks(hookAddr)});
        pm.initialize(key, 79228162514264337593543950336);

        // routers + liquidity
        PoolModifyLiquidityTest lpRouter = new PoolModifyLiquidityTest(pm);
        swapRouter = new PoolSwapTest(pm);
        tA.approve(address(lpRouter), type(uint256).max);
        tB.approve(address(lpRouter), type(uint256).max);
        tA.approve(address(swapRouter), type(uint256).max);
        tB.approve(address(swapRouter), type(uint256).max);
        lpRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(60),
                tickUpper: TickMath.maxUsableTick(60),
                liquidityDelta: 1e21,
                salt: bytes32(0)
            }),
            ""
        );

        // one test swap - proves the hook callback path does not revert
        swapRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true,
                amountSpecified: -1e15,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        vm.stopBroadcast();

        console2.log("kind        ", kind);
        console2.log("hook        ", hookAddr);
        console2.log("token0      ", Currency.unwrap(c0));
        console2.log("token1      ", Currency.unwrap(c1));
        console2.log("swapRouter  ", address(swapRouter));
        console2.log("poolManager ", address(pm));
    }
}
