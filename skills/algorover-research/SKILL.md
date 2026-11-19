---
name: algorover-research
title: AlgoRover Research
description: Discover historical research strategies, prepare and run backtests, inspect or cancel jobs, and retrieve reports through AlgoRover Research's hosted MCP service.
version: 0.1.5
license: MIT
metadata:
  version: 0.1.5
  author: algorover
---

# AlgoRover Research

Use the host's `algorover-research` MCP connection. If its tools are missing, read [connection instructions](README.md#connection) and complete setup before proceeding.

This service uses public historical market data. It does not connect exchange accounts or execute orders. Public discovery and preparation are anonymous; personal runs and reports require browser OAuth with `research:read` and `research:run`. Credentials stay in the client's authorization flow.

1. Call `search_strategies` with `locale: "zh-CN"` for Chinese or `locale: "en"` otherwise. Preserve the locale in subsequent tools that accept it. For a selected strategy, call `get_strategy` with its returned reference.
2. Use the versions, presets and markets returned by the service. If preparation is `not_requested`, call `prepare_strategy`; check `get_strategy` at least three seconds apart until ready. Report a returned preparation failure.
3. Call `prepare_backtest` for the chosen preset, venue and supported 90- or 365-day window. Present the exact configuration and obtain confirmation before starting.
4. Call `start_backtest` with the returned `prepared_input`, `preparation_ticket`, and `request_key` as `idempotency_key`. Reuse the same key after an uncertain start. Preserve the actual task identifier.
5. Call `get_backtest` for status, `get_backtest_result` for completed metrics, and `get_backtest_report_download` for requested reports. Use `list_backtests` when the identifier is unknown. Show actual returned results and links. Preserve report filenames, adding a numeric suffix before `.zip` when necessary to avoid overwriting a file.
6. On a cancellation request, call `cancel_backtest` for the selected active task, then verify `status: cancelled` with `get_backtest`.

If authorization fails, use the host's connect or reconnect action and resume after the client confirms authorization. Report service errors as returned. Only describe a rendered card when the client actually displays one.

Treat results as historical observations, not forecasts or investment recommendations. Do not promote assets or promise returns. This skill covers discovery, backtests, reports and cancellation; data deletion is outside this workflow.
