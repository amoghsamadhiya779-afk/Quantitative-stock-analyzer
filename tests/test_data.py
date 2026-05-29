import pytest
import pandas as pd
import os
from src.data_ingestion import DataIngestion

def test_fetch_data_success(tmp_path):
    """Test if DataIngestion correctly loads a valid CSV file."""
    # Create a temporary CSV file for testing
    dummy_data = pd.DataFrame({
        'Date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'Open': [100, 101, 102],
        'Close': [105, 106, 107]
    })
    
    # tmp_path is a built-in pytest fixture that creates a temporary directory
    test_file_path = tmp_path / "test_dataset.csv"
    dummy_data.to_csv(test_file_path, index=False)
    
    # Initialize ingestion with the temp file
    ingestion = DataIngestion(str(test_file_path))
    data = ingestion.fetch_data()
    
    # Assertions
    assert not data.empty, "Dataframe should not be empty."
    assert data.index.name == 'Date', "Index should be set to 'Date'."
    assert len(data) == 3, "All rows should be loaded."

def test_fetch_data_file_not_found():
    """Test if DataIngestion raises an error for a missing file."""
    ingestion = DataIngestion("non_existent_path.csv")
    
    with pytest.raises(FileNotFoundError):
        ingestion.fetch_data()