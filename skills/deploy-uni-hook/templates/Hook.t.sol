// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// FREEFORM behavioral test. In freeform mode the deploy-uni-hook skill rewrites the
// HOOK:ASSERT region with `test_*` functions that assert the hook's SPECIFIC
// intended behavior (a swap that should revert reverts; a state getter returns the
// right value; a fee is skimmed; etc.). hook-deploy.sh runs
//   forge test --fork-url <chain> --match-contract HookBehaviorTest
// as a GATE before it will simulate or broadcast. A failing (or non-compiling) test
// blocks the deploy (DEPLOY_HOOK_TEST_FAILED). This proves the hook does what the
// prompt asked, not just that it does not revert.
//
// setUp() below is fixed scaffolding: it forks the target chain, mines + deploys the
// generated Hook with its auto-derived flags, opens a fresh pool, and adds deep
// liquidity. The generator MUST NOT edit setUp() or the helpers — only HOOK:ASSERT.

import {Test} from "forge-std/Test.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {HookMiner} from "v4-periphery/test/shared/HookMiner.sol";

import {MockERC20} from "../src/MockERC20.sol";
import {Hook} from "../src/Hook.sol";

contract HookBehaviorTest is Test {
    using PoolIdLibrary for PoolKey;

    IPoolManager internal pm;
    Hook internal hook;
    PoolKey internal key;
    PoolModifyLiquidityTest internal lpRouter;
    PoolSwapTest internal swapRouter;
    MockERC20 internal tA;
    MockERC20 internal tB;

    function setUp() public {
        pm = IPoolManager(vm.envAddress("POOL_MANAGER"));
        uint160 flags = uint160(vm.envUint("HOOK_FLAGS"));
        string memory pf = vm.envOr("HOOK_POOL_FEE", string("3000"));
        uint24 poolFee =
            keccak256(bytes(pf)) == keccak256("dynamic") ? LPFeeLibrary.DYNAMIC_FEE_FLAG : uint24(vm.parseUint(pf));

        // tokens
        tA = new MockERC20("Hook Test A", "HTA");
        tB = new MockERC20("Hook Test B", "HTB");
        tA.mint(address(this), 1e30);
        tB.mint(address(this), 1e30);
        (Currency c0, Currency c1) = address(tA) < address(tB)
            ? (Currency.wrap(address(tA)), Currency.wrap(address(tB)))
            : (Currency.wrap(address(tB)), Currency.wrap(address(tA)));

        // mine + deploy the generated hook at an address carrying its flag bits.
        // Mine with THIS contract as the CREATE2 deployer so `new Hook{salt}` matches.
        (address expected, bytes32 salt) = HookMiner.find(address(this), flags, type(Hook).creationCode, abi.encode(pm));
        hook = new Hook{salt: salt}(pm);
        require(address(hook) == expected, "hook addr mismatch");
        require(uint160(address(hook)) & Hooks.ALL_HOOK_MASK == flags, "flag bits wrong");

        // pool at 1:1 + deep full-range liquidity so multi-1e18 swaps do not run dry
        key = PoolKey({currency0: c0, currency1: c1, fee: poolFee, tickSpacing: 60, hooks: IHooks(address(hook))});
        pm.initialize(key, 79228162514264337593543950336);

        lpRouter = new PoolModifyLiquidityTest(pm);
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
                liquidityDelta: 1e23,
                salt: bytes32(0)
            }),
            ""
        );
    }

    /// @dev Run one swap. amountSpecified < 0 = exact-input of that size.
    function _swap(bool zeroForOne, int256 amountSpecified) internal returns (BalanceDelta) {
        return swapRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );
    }

    /// @dev Assert a swap reverts AND the hook's own error is the cause. v4 wraps a
    /// hook revert in CustomRevert.WrappedError, so we scan the revert bytes for the
    /// hook error's 4-byte selector rather than matching the outer wrapper.
    /// Use for negative cases: _expectSwapRevert(true, -6e18, Hook.SomeError.selector).
    function _expectSwapRevert(bool zeroForOne, int256 amountSpecified, bytes4 hookErrorSelector) internal {
        try swapRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        ) {
            revert("expected swap to revert but it succeeded");
        } catch (bytes memory err) {
            assertTrue(_containsSelector(err, hookErrorSelector), "reverted with the wrong error");
        }
    }

    function _containsSelector(bytes memory data, bytes4 sel) internal pure returns (bool) {
        if (data.length < 4) return false;
        for (uint256 i = 0; i + 4 <= data.length; i++) {
            if (data[i] == sel[0] && data[i + 1] == sel[1] && data[i + 2] == sel[2] && data[i + 3] == sel[3]) {
                return true;
            }
        }
        return false;
    }

    // --- HOOK:ASSERT START (freeform: replace with behavioral tests for the prompt) ---
    // Default scaffold matches the default Hook body (an afterSwap swap counter).
    // The generator MUST replace this with assertions specific to the generated hook:
    //   - a swap the hook is meant to REJECT -> vm.expectRevert(...) then _swap(...)
    //   - a swap the hook is meant to ALLOW  -> _swap(...) with no revert
    //   - any getter / accounting -> assertEq(hook.someGetter(...), expected)
    function test_defaultCounterIncrements() public {
        _swap(true, -1e15);
        assertEq(hook.swapCount(key.toId()), 1, "counter did not increment");
        _swap(true, -1e15);
        assertEq(hook.swapCount(key.toId()), 2, "counter did not increment twice");
    }
    // --- HOOK:ASSERT END ---
}
