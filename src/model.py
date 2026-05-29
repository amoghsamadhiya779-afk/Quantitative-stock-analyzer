from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout, Bidirectional
from tensorflow.keras.optimizers import Adam
import logging
from src.config import PipelineConfig

logger = logging.getLogger("SP500_MLOps")

class TimeSeriesModel:
    def __init__(self, input_shape):
        self.input_shape = input_shape
        self.model = self._build_model()

    def _build_model(self):
        logger.info("Building Bidirectional LSTM Model...")
        model = Sequential()
        
        # Layer 1
        model.add(Bidirectional(LSTM(units=128, return_sequences=True), input_shape=self.input_shape))
        model.add(Dropout(0.3))
        
        # Layer 2
        model.add(Bidirectional(LSTM(units=64, return_sequences=False)))
        model.add(Dropout(0.3))
        
        # Dense Layers
        model.add(Dense(units=32, activation='relu'))
        model.add(Dense(units=1))

        # Compilation
        optimizer = Adam(learning_rate=PipelineConfig.LEARNING_RATE)
        model.compile(optimizer=optimizer, loss='mean_squared_error')
        
        return model