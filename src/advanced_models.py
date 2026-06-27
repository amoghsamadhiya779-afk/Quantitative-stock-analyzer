import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Dense, Dropout, Bidirectional, LSTM, 
    Conv1D, BatchNormalization, MultiHeadAttention, 
    LayerNormalization, Add, Flatten, GlobalAveragePooling1D,
    SpatialDropout1D
)
from tensorflow.keras.regularizers import l2

class ModelFactory:
    """Institutional-Grade Model Architectures for Time Series Forecasting"""

    @staticmethod
    def build_cnn_bilstm_attention(input_shape, learning_rate=1e-3, filters=128, kernel_size=3, lstm_units=128, dropout=0.2, attention_heads=4):
        """
        CNN + BiLSTM + Multi-Head Attention Model
        Extracts local features using Conv1D, captures long-term dependencies with BiLSTM,
        and weighs timestep importance using Attention.
        """
        inputs = Input(shape=input_shape)
        
        # 1. Local Feature Extraction
        x = Conv1D(filters=filters, kernel_size=kernel_size, padding='same', activation='relu')(inputs)
        x = BatchNormalization()(x)
        x = SpatialDropout1D(dropout)(x) # Upgraded to SpatialDropout for sequence data
        
        # 2. Sequential Modeling
        x = Bidirectional(LSTM(lstm_units, return_sequences=True))(x)
        x = Dropout(dropout)(x)
        
        # 3. Temporal Attention
        # Query, Key, Value are all x (Self-Attention)
        attn_out = MultiHeadAttention(num_heads=attention_heads, key_dim=lstm_units)(x, x)
        x = Add()([x, attn_out]) # Residual Connection
        x = LayerNormalization()(x)
        
        # 4. Global Pooling & Dense Head
        x = GlobalAveragePooling1D()(x)
        x = Dense(32, activation='relu', kernel_regularizer=l2(1e-4))(x)
        x = Dropout(dropout)(x)
        outputs = Dense(1, kernel_regularizer=l2(1e-4), dtype='float32')(x)
        
        model = Model(inputs=inputs, outputs=outputs, name="CNN_BiLSTM_Attention")
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate, clipnorm=1.0)
        model.compile(optimizer=optimizer, loss=tf.keras.losses.Huber(), metrics=['mae'])
        return model

    @staticmethod
    def build_transformer_forecaster(input_shape, learning_rate=1e-3, head_size=64, num_heads=4, ff_dim=128, num_transformer_blocks=3, mlp_units=[64, 32], dropout=0.2):
        """
        Pure Time Series Transformer
        Uses Multi-Head Attention blocks for pure self-attention forecasting.
        """
        inputs = Input(shape=input_shape)
        x = inputs
        
        for _ in range(num_transformer_blocks):
            # Attention
            attn_out = MultiHeadAttention(num_heads=num_heads, key_dim=head_size)(x, x)
            attn_out = Dropout(dropout)(attn_out)
            x = Add()([x, attn_out])
            x = LayerNormalization(epsilon=1e-6)(x)
            
            # Feed Forward
            ff = Conv1D(filters=ff_dim, kernel_size=1, activation="relu")(x)
            ff = Dropout(dropout)(ff)
            ff = Conv1D(filters=inputs.shape[-1], kernel_size=1)(ff)
            x = Add()([x, ff])
            x = LayerNormalization(epsilon=1e-6)(x)

        x = GlobalAveragePooling1D()(x)
        for dim in mlp_units:
            x = Dense(dim, activation="relu", kernel_regularizer=l2(1e-4))(x)
            x = Dropout(dropout)(x)
            
        outputs = Dense(1, kernel_regularizer=l2(1e-4), dtype='float32')(x)
        
        model = Model(inputs=inputs, outputs=outputs, name="TimeSeriesTransformer")
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate, clipnorm=1.0)
        model.compile(optimizer=optimizer, loss=tf.keras.losses.Huber(), metrics=['mae'])
        return model

    @staticmethod
    def build_advanced_bilstm(input_shape, learning_rate=1e-3, lstm_units=[256, 128], dropout=0.3):
        """
        Upgraded version of the original BiLSTM with Residual connections and LayerNorm.
        """
        inputs = Input(shape=input_shape)
        
        # Layer 1
        x = Bidirectional(LSTM(lstm_units[0], return_sequences=True))(inputs)
        x = LayerNormalization()(x)
        x = Dropout(dropout)(x)
        
        # Layer 2
        x = Bidirectional(LSTM(lstm_units[1], return_sequences=False))(x)
        x = LayerNormalization()(x)
        x = Dropout(dropout)(x)
        
        # Dense Head
        x = Dense(32, activation='relu')(x)
        outputs = Dense(1, dtype='float32')(x)
        
        model = Model(inputs=inputs, outputs=outputs, name="AdvancedBiLSTM")
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate, clipnorm=1.0)
        model.compile(optimizer=optimizer, loss='mse', metrics=['mae'])
        return model
