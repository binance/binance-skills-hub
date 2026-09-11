// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// TEMPLATE: minimal base hook.
// Flags required in the address: BEFORE_SWAP (0x80).
// Does nothing but emit an event so you can prove the hook fired. Use this as a
// clean starting point: add callbacks + flags, then fill the HOOK:LOGIC region.

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";

contract NoOpHook {
    IPoolManager public immutable poolManager;

    event BeforeSwapFired(address indexed sender, bool zeroForOne, int256 amountSpecified);

    error NotPoolManager();

    constructor(IPoolManager _pm) {
        poolManager = _pm;
    }

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata params, bytes calldata)
        external
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // --- HOOK:LOGIC START ---
        emit BeforeSwapFired(sender, params.zeroForOne, params.amountSpecified);
        // --- HOOK:LOGIC END ---
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
