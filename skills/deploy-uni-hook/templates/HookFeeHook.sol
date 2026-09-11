// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// TEMPLATE: hook-fee skim (Tier 2, return-delta).
// Flags required in the address: AFTER_SWAP + AFTER_SWAP_RETURNS_DELTA (0x44).
// Takes FEE_BPS of the swap's unspecified (usually output) currency for the hook.
// The owner can withdraw the collected fees.
//
// WARNING: a return-delta hook moves the token ledger. A wrong delta or a failed
// take() reverts every swap and bricks the pool. Always simulate before deploy.

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";

contract HookFeeHook {
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    IPoolManager public immutable poolManager;
    address public immutable owner;

    // hook fee in basis points of the unspecified amount (100 = 1.00%)
    uint256 public constant FEE_BPS = 100;

    event HookFeeTaken(Currency indexed currency, uint256 amount);

    error NotPoolManager();
    error NotOwner();

    constructor(IPoolManager _pm) {
        poolManager = _pm;
        owner = msg.sender;
    }

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) external onlyPoolManager returns (bytes4, int128) {
        // --- HOOK:LOGIC START ---
        // pick the unspecified currency + the swapper's delta on it
        (Currency feeCurrency, int128 unspecifiedAmount) = (params.amountSpecified < 0 == params.zeroForOne)
            ? (key.currency1, delta.amount1())
            : (key.currency0, delta.amount0());

        // only skim when the swapper RECEIVES the unspecified currency (positive)
        if (unspecifiedAmount <= 0) return (IHooks.afterSwap.selector, int128(0));

        uint256 feeAmount = (uint256(uint128(unspecifiedAmount)) * FEE_BPS) / 10_000;
        if (feeAmount == 0) return (IHooks.afterSwap.selector, int128(0));
        require(feeAmount <= uint256(uint128(type(int128).max)), "fee overflow");

        poolManager.take(feeCurrency, address(this), feeAmount);
        emit HookFeeTaken(feeCurrency, feeAmount);
        return (IHooks.afterSwap.selector, int128(uint128(feeAmount)));
        // --- HOOK:LOGIC END ---
    }

    /// @notice Withdraw collected fees for one currency to a recipient.
    function withdraw(Currency currency, address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        currency.transfer(to, amount);
    }
}
