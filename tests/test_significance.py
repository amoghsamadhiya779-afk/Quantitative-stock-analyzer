import numpy as np
import pytest

from src import significance as sig


def test_directional_accuracy_perfect_and_excludes_zeros():
    actual = np.array([0.01, -0.02, 0.03, -0.01, 0.0] * 20)
    acc, n, p = sig.directional_accuracy(actual, actual)
    assert acc == 1.0
    assert n == 80  # zero-return bars carry no directional call
    assert p < 1e-10


def test_directional_accuracy_coin_flip_is_not_significant():
    rng = np.random.default_rng(0)
    acc, _, p = sig.directional_accuracy(rng.normal(size=2000), rng.normal(size=2000))
    assert abs(acc - 0.5) < 0.03
    assert p > 0.05


def test_oos_r2_reference_points():
    actual = np.array([0.01, -0.02, 0.005, 0.0])
    assert sig.oos_r2(actual, actual, np.zeros(4)) == 1.0
    assert sig.oos_r2(actual, np.zeros(4), np.zeros(4)) == 0.0


def test_diebold_mariano_detects_a_better_forecast():
    rng = np.random.default_rng(1)
    actual = rng.normal(0, 0.01, 1000)
    good = actual + rng.normal(0, 0.005, 1000)
    stat, p = sig.diebold_mariano(actual, good, np.zeros(1000))
    assert stat > 0 and p < 0.001

    stat, p = sig.diebold_mariano(actual, np.zeros(1000), np.zeros(1000))
    assert p == 0.5


def test_psr_is_one_half_at_the_observed_sharpe():
    r = np.random.default_rng(2).normal(0.001, 0.01, 500)
    observed = r.mean() / r.std(ddof=1)
    assert sig.probabilistic_sharpe_ratio(r, sr_benchmark=observed) == pytest.approx(0.5)


def test_deflation_raises_the_bar_with_more_trials():
    assert sig.expected_max_sharpe(1, 0.05) == 0.0
    assert sig.expected_max_sharpe(10, 0.05) < sig.expected_max_sharpe(100, 0.05)

    r = np.random.default_rng(3).normal(0.0008, 0.01, 750)
    assert sig.deflated_sharpe_ratio(r, 20, 0.03) < sig.probabilistic_sharpe_ratio(r)


def test_bootstrap_ci_brackets_point_estimate_and_is_reproducible():
    r = np.random.default_rng(4).normal(0.0005, 0.01, 1000)
    lo, hi = sig.block_bootstrap_sharpe_ci(r, seed=7)
    assert lo < sig.sharpe_ratio(r) < hi
    assert (lo, hi) == sig.block_bootstrap_sharpe_ci(r, seed=7)


def test_max_drawdown():
    assert sig.max_drawdown([0.1, -0.5, 0.2]) == pytest.approx(-0.5)
    assert sig.max_drawdown([0.01, 0.02]) == 0.0
