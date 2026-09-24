"""Architecture checks for the models the API actually serves."""
import os

import pytest

from src.advanced_models import ModelFactory
from src.config import MARKET_CONFIG

SEQ_LENGTH = 60
N_FEATURES = 12
MODEL_TYPES = {
    "CNN_BiLSTM_Attention": ModelFactory.build_cnn_bilstm_attention,
    "TimeSeriesTransformer": ModelFactory.build_transformer_forecaster,
    "AdvancedBiLSTM": ModelFactory.build_advanced_bilstm,
}
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "mlops_artifacts", "models")


@pytest.mark.parametrize("name", MODEL_TYPES)
def test_builder_outputs_single_regression_value(name):
    model = MODEL_TYPES[name]((SEQ_LENGTH, N_FEATURES))
    assert model.output_shape == (None, 1)
    assert model.optimizer is not None


@pytest.mark.parametrize("market", MARKET_CONFIG)
def test_every_market_has_deployed_artifacts(market):
    """The API looks these files up by name; a missing one silently drops the market to
    the linear fallback, so fail loudly here instead."""
    key = MARKET_CONFIG[market]["index_key"]
    expected = [f"{key}_{t}.keras" for t in MODEL_TYPES] + [
        f"{key}_feature_scaler.pkl",
        f"{key}_target_scaler.pkl",
        f"{key}_features_list.pkl",
    ]
    missing = [f for f in expected if not os.path.exists(os.path.join(MODEL_DIR, f))]
    assert not missing, f"{market} is missing artifacts: {missing}"
