import numpy as np
import pytest

from src.walkforward import (
    create_sequences, expanding_folds, feature_columns, make_forecaster, prepare_frame,
)


def test_sequences_are_labelled_with_their_last_rows_target():
    data = np.arange(100).reshape(-1, 1)
    target = np.arange(100) * 10
    X, y = create_sequences(data, target, seq_length=5)
    assert len(X) == 96
    for j in (0, 17, 95):
        assert X[j][-1, 0] == j + 4
        assert y[j] == target[j + 4]


def test_target_is_next_bar_log_return(prices):
    frame = prepare_frame(prices)
    close = prices["Close"].values
    assert len(frame) == len(prices) - 1
    np.testing.assert_allclose(frame["Target_Return"].values, np.log(close[1:] / close[:-1]))


def test_scoring_columns_are_never_features(prices):
    features = feature_columns(prepare_frame(prices))
    assert "Target_Return" not in features
    assert not [f for f in features if f.startswith("_")]


def test_features_do_not_look_ahead(prices):
    """Rewriting the future must leave every earlier row's features unchanged."""
    cut = 800
    altered = prices.copy()
    altered.loc[cut:, ["Open", "High", "Low", "Close"]] *= 1.5
    altered.loc[cut:, "Volume"] *= 3

    a, b = prepare_frame(prices), prepare_frame(altered)
    features = feature_columns(a)
    np.testing.assert_allclose(a[features].values[:cut], b[features].values[:cut])


def test_folds_are_contiguous_and_cover_the_second_half():
    folds = expanding_folds(1001, 4)
    assert folds[0][0] == 500
    assert folds[-1][1] == 1001
    for (_, end), (start, _) in zip(folds, folds[1:]):
        assert end == start


@pytest.mark.parametrize("name", ["RandomWalk", "HistoricalMean", "Momentum20", "Ridge", "GradientBoosting"])
def test_forecasts_do_not_look_ahead(prices, name):
    """Forecasts for rows before a cut must not change when data from the cut onward
    changes. Row cut-1 is included: its target uses Close[cut], so a forecaster that
    peeks even one bar ahead fails here."""
    train_end, cut = 600, 900
    altered = prices.copy()
    altered.loc[cut:, "Close"] *= 0.5

    a, b = prepare_frame(prices), prepare_frame(altered)
    features = feature_columns(a)
    rows = np.arange(train_end, cut)

    fa = make_forecaster(name).fit(a, features, train_end).predict(a, features, rows)
    fb = make_forecaster(name).fit(b, features, train_end).predict(b, features, rows)
    np.testing.assert_allclose(fa, fb)


def test_deep_forecaster_windows_do_not_look_ahead(prices):
    train_end, cut = 600, 900
    altered = prices.copy()
    altered.loc[cut:, "Close"] *= 0.5
    a, b = prepare_frame(prices), prepare_frame(altered)
    features = feature_columns(a)
    rows = np.arange(train_end, cut)

    model = make_forecaster("AdvancedBiLSTM", seq_length=20, epochs=1).fit(a, features, train_end)
    np.testing.assert_allclose(model.predict(a, features, rows), model.predict(b, features, rows), rtol=1e-5)
