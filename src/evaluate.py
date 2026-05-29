"""Calculates metrics and generates plots."""
import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import logging
from src.config import PipelineConfig

logger = logging.getLogger("SP500_MLOps")

class ModelEvaluator:
    @staticmethod
    def evaluate(model_obj, X_test, y_test, test_dates, target_scaler):
        logger.info("Evaluating model...")
        predictions = model_obj.model.predict(X_test)
        
        predictions_inv = target_scaler.inverse_transform(predictions)
        y_test_inv = target_scaler.inverse_transform(y_test.reshape(-1, 1))
        
        rmse = np.sqrt(mean_squared_error(y_test_inv, predictions_inv))
        mae = mean_absolute_error(y_test_inv, predictions_inv)
        r2 = r2_score(y_test_inv, predictions_inv)
        
        logger.info(f"RMSE: {rmse:.2f} | MAE: {mae:.2f} | R2: {r2:.4f}")
        
        plt.figure(figsize=(14, 6))
        plt.plot(test_dates, y_test_inv, color='blue', label='Actual')
        plt.plot(test_dates, predictions_inv, color='red', linestyle='dashed', label='Predicted')
        plt.title('S&P 500 Price Prediction')
        plt.legend()
        plt.grid(True)
        plt.savefig(os.path.join(PipelineConfig.PLOT_DIR, 'prediction_results.png'))
        plt.close()