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
