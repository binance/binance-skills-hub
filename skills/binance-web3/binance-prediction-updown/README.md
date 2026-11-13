# Backtest helper tests

From this skill directory, run:

```sh
python3 -m unittest discover -s scripts/tests -v
```

The tests use Python's standard library and mock the public kline endpoint.
They need no network access, wallet, login or trading session. They check that
`resolve_outcome` (used by `backtest.py pricedin`) selects the boundary candles of a
completed, minute-aligned `[start_ms, close_ms)` window, including daily windows
longer than the API's 1000-candle page limit. Missing boundary candles and
unfinished windows remain unresolved. This tests the existing Binance spot
estimate; it does not validate settlement against other feeds.
