"""Smoke tests for the FastAPI app that need no network or trained models."""
from fastapi.testclient import TestClient

from api.main import app
from src.config import MARKET_CONFIG

client = TestClient(app)


def test_health():
    r = client.get("/")
    assert r.status_code == 200


def test_markets_match_registry():
    r = client.get("/api/v1/markets")
    assert r.status_code == 200
    assert set(r.json()["markets"]) == set(MARKET_CONFIG)


def test_unknown_market_tickers_is_404():
    r = client.get("/api/v1/tickers/Atlantis")
    assert r.status_code == 404


def test_debug_endpoint_disabled_by_default(monkeypatch):
    monkeypatch.delenv("ENABLE_DEBUG_ENDPOINT", raising=False)
    r = client.get("/api/v1/debug")
    assert r.status_code == 404


def test_report_card_endpoint(tmp_path, monkeypatch):
    import api.main as main

    monkeypatch.setattr(main, "REPORT_CARD_PATH", str(tmp_path / "missing.json"))
    assert client.get("/api/v1/report-card").status_code == 404

    path = tmp_path / "report_card.json"
    path.write_text('{"version": 1, "markets": {}}')
    monkeypatch.setattr(main, "REPORT_CARD_PATH", str(path))
    r = client.get("/api/v1/report-card")
    assert r.status_code == 200 and r.json()["version"] == 1


def test_commodities_endpoint(monkeypatch):
    import numpy as np
    import pandas as pd

    import api.main as main

    dates = pd.bdate_range("2025-01-01", periods=5)
    symbols = list(main.COMMODITY_SYMBOLS.values())
    closes = pd.DataFrame({s: np.linspace(10, 14, 5) for s in symbols}, index=dates)
    fake = pd.concat({"Close": closes}, axis=1)  # MultiIndex columns, like yf.download

    main.COMMODITIES_CACHE.clear()
    monkeypatch.setattr(main.yf, "download", lambda *a, **k: fake)
    r = client.get("/api/v1/commodities")
    assert r.status_code == 200
    gold = r.json()["commodities"]["Gold"]
    assert gold["price"] == 14.0
    assert round(gold["pct_change"], 2) == round((14 / 13 - 1) * 100, 2)
    assert len(gold["closes"]) == 5

    main.COMMODITIES_CACHE.clear()
    monkeypatch.setattr(main.yf, "download", lambda *a, **k: pd.DataFrame())
    assert client.get("/api/v1/commodities").status_code == 503
    main.COMMODITIES_CACHE.clear()
