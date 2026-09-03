// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// FREEFORM hook scaffold. In freeform mode the deploy-uni-hook skill rewrites the
// HOOK:BODY region with callbacks generated from the user's prompt.
//
// Rules the generator MUST keep:
//   - Contract name stays `Hook` and constructor stays `constructor(IPoolManager)`
//     (the deploy script imports `Hook` by name).
//   - Every callback uses the EXACT IHooks signature, carries `onlyPoolManager`,
//     and returns the right selector (e.g. `IHooks.beforeSwap.selector`).
//   - Flags are AUTO-DERIVED from which callbacks exist (see hook-deploy.sh).
//     For a return-delta callback, also list it in hook.env HOOK_RETURNS_DELTA.
//   - A dynamic-fee hook sets HOOK_POOL_FEE=dynamic in hook.env and returns
//     `fee | LPFeeLibrary.OVERRIDE_FEE_FLAG` from beforeSwap.
//
// All commonly-needed imports/usings are here so generated bodies compile as-is.

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

contract Hook {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using BalanceDeltaLibrary for BalanceDelta;
    using CurrencyLibrary for Currency;

    IPoolManager public immutable poolManager;

    error NotPoolManager();

    constructor(IPoolManager _pm) {
        poolManager = _pm;
    }

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    // --- HOOK:BODY START (freeform: replace with callbacks from the prompt) ---
    // Default scaffold = a no-op afterSwap counter, so the file compiles and is a
    // working example. Auto-derived flags for this default: AFTER_SWAP (0x40).
    mapping(PoolId => uint256) public swapCount;

    event SwapCounted(PoolId indexed id, uint256 count);

    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, int128) {
        PoolId id = key.toId();
        swapCount[id] += 1;
        emit SwapCounted(id, swapCount[id]);
        return (IHooks.afterSwap.selector, int128(0));
    }
    // --- HOOK:BODY END ---
}
