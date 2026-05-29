"""Training loop and callbacks."""
import os
import matplotlib.pyplot as plt
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, CSVLogger
import logging
from src.config import PipelineConfig

logger = logging.getLogger("SP500_MLOps")

class ModelTrainer:
    @staticmethod
    def train(model_obj, X_train, y_train, X_val, y_val):
        logger.info("Starting training...")
        model_path = os.path.join(PipelineConfig.MODEL_DIR, 'best_sp500_model.h5')
        csv_log_path = os.path.join(PipelineConfig.LOG_DIR, 'training_history.csv')

        callbacks = [
            EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1),
            ModelCheckpoint(filepath=model_path, monitor='val_loss', save_best_only=True, verbose=1),
            CSVLogger(csv_log_path)
        ]

        history = model_obj.model.fit(
            X_train, y_train,
            epochs=PipelineConfig.EPOCHS,
            batch_size=PipelineConfig.BATCH_SIZE,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        plt.figure(figsize=(10, 6))
        plt.plot(history.history['loss'], label='Training Loss')
        plt.plot(history.history['val_loss'], label='Validation Loss')
        plt.title('Model Training & Validation Loss')
        plt.xlabel('Epochs')
        plt.ylabel('Loss (MSE)')
        plt.legend()
        plt.grid(True)
        plt.savefig(os.path.join(PipelineConfig.PLOT_DIR, 'training_loss.png'))
        plt.close()
        return history