import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from datetime import datetime
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse


MINUTE = 60_000
START = 1_748_131_200_000
NOW = START + 2 * 24 * 60 * MINUTE


class FrozenDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls.fromtimestamp(NOW / 1000, tz)


def candle(open_ms, open_price=100, close_price=101):
    return [open_ms, str(open_price), "102", "98", str(close_price), "1",
            open_ms + MINUTE - 1, "100", 1, "0", "0", "0"]


class ResolveOutcomeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.home.cleanup)
        spec = importlib.util.spec_from_file_location(
            "backtest", Path(__file__).resolve().parents[1] / "backtest.py")
        cls.backtest = importlib.util.module_from_spec(spec)
        with patch.dict(os.environ, {"UPDOWN_HOME": cls.home.name}):
            spec.loader.exec_module(cls.backtest)

    def resolve(self, rows, close_ms):
        def request(url, timeout):
            query = parse_qs(urlparse(url).query)
            self.assertEqual(query["symbol"], ["BTCUSDT"])
            self.assertEqual(query["interval"], ["1m"])
            first, last = int(query["startTime"][0]), int(query["endTime"][0])
            limit = min(int(query["limit"][0]), 1000)
            # The public API filters candle open times inclusively and caps rows.
            selected = [row for row in rows if first <= row[0] <= last][:limit]
            return io.StringIO(json.dumps(selected))

        with patch.object(self.backtest, "datetime", FrozenDatetime), \
                patch("urllib.request.urlopen", side_effect=request):
            return self.backtest.resolve_outcome("BTCUSDT", START, close_ms)

    def test_daily_outcome_uses_the_last_minute_beyond_the_first_page(self):
        rows = [candle(START + i * MINUTE) for i in range(1440)]
        rows[-1][4] = "99"
        self.assertEqual(self.resolve(rows, START + 1440 * MINUTE), 0)

    def test_hourly_outcome_excludes_the_following_round(self):
        rows = [candle(START + i * MINUTE) for i in range(61)]
        rows[-1][4] = "99"
        self.assertEqual(self.resolve(rows, START + 60 * MINUTE), 1)

    def test_missing_first_minute_is_unresolved(self):
        self.assertIsNone(self.resolve([candle(START + MINUTE)], START + 2 * MINUTE))

    def test_missing_last_minute_is_unresolved(self):
        self.assertIsNone(self.resolve([candle(START)], START + 2 * MINUTE))

    def test_wrong_minute_response_is_unresolved(self):
        with patch.object(self.backtest, "datetime", FrozenDatetime), \
                patch("urllib.request.urlopen", return_value=io.StringIO(
                    json.dumps([candle(START + MINUTE)]))):
            self.assertIsNone(self.backtest.resolve_outcome("BTCUSDT", START, START + MINUTE))

    def test_unclosed_or_invalid_window_is_unresolved_without_fetching(self):
        for start, close in ((START, NOW + MINUTE), (START, START),
                             (START + MINUTE, START), (START + 1, START + MINUTE),
                             (START, START + MINUTE - 1)):
            with self.subTest(start=start, close=close), \
                    patch.object(self.backtest, "datetime", FrozenDatetime), \
                    patch("urllib.request.urlopen", return_value=io.StringIO(
                        json.dumps([candle(START)]))) as request:
                self.assertIsNone(self.backtest.resolve_outcome("BTCUSDT", start, close))
                request.assert_not_called()

    def test_one_minute_window_and_ties(self):
        for price, expected in ((101, 1), (99, 0), (100, 0)):
            with self.subTest(price=price):
                self.assertEqual(self.resolve([candle(START, close_price=price)],
                                              START + MINUTE), expected)

    def test_network_failure_is_unresolved(self):
        with patch.object(self.backtest, "datetime", FrozenDatetime), \
                patch("urllib.request.urlopen", side_effect=OSError("unavailable")):
            self.assertIsNone(self.backtest.resolve_outcome("BTCUSDT", START, START + MINUTE))


if __name__ == "__main__":
    unittest.main()
