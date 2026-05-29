"""Pytest checks for model architecture."""
import pytest
from src.model import TimeSeriesModel

def test_model_build_and_architecture():
    """Test if the Bidirectional LSTM model compiles with the correct shapes."""
    
    # Mock input shape: (sequence_length, number_of_features)
    # Our pipeline uses SEQ_LENGTH=60 and 9 features
    mock_input_shape = (60, 9)
    
    # Instantiate the model
    model_runner = TimeSeriesModel(input_shape=mock_input_shape)
    
    # 1. Check if the model instance was created successfully
    assert model_runner.model is not None, "Model should be successfully instantiated."
    
    # 2. Verify the output shape
    # Since we are predicting a single future value (regression), the output should be (None, 1)
    # 'None' represents the variable batch size.
    output_shape = model_runner.model.output_shape
    assert output_shape == (None, 1), f"Expected output shape (None, 1), but got {output_shape}"
    
    # 3. Verify compiling
    # Ensure the optimizer and loss functions were attached properly
    assert model_runner.model.optimizer is not None, "Model optimizer should be configured."
    assert model_runner.model.loss == 'mean_squared_error', "Loss function should be MSE."