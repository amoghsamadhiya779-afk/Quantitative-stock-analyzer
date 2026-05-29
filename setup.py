import os
from pathlib import Path

def create_project_structure(base_dir_name="sp500-mlops-project"):
    """
    Creates the complete directory and file structure for the S&P 500 MLOps project.
    """
    base_path = Path(base_dir_name)

    # 1. Define all the directories needed
    directories = [
        ".github/workflows",
        "configs",
        "data/raw",
        "data/processed",
        "mlops_artifacts/logs",
        "mlops_artifacts/models",
        "mlops_artifacts/plots",
        "notebooks",
        "src",
        "tests"
    ]

    # 2. Define all the files with some basic boilerplate content
    files = {
        # CI/CD
        ".github/workflows/train_pipeline.yml": "name: Train Pipeline\n# TODO: Add GitHub Actions steps for training",
        ".github/workflows/deploy_model.yml": "name: Deploy Model\n# TODO: Add GitHub Actions steps for deployment",
        
        # Configs
        "configs/default_config.yaml": "# Default configuration settings\nticker: '^GSPC'\nseq_length: 60\nbatch_size: 32\nepochs: 50",
        "configs/prod_config.yaml": "# Production overrides\nepochs: 100",
        
        # Notebooks
        "notebooks/01_data_exploration.ipynb": '{"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}',
        "notebooks/02_model_prototyping.ipynb": '{"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}',
        
        # Source Code (src)
        "src/__init__.py": "",
        "src/config.py": '"""Parses YAML configurations."""\n',
        "src/data_ingestion.py": '"""Handles downloading raw data."""\n',
        "src/feature_engineering.py": '"""Generates technical indicators."""\n',
        "src/preprocessing.py": '"""Scales and sequences data for LSTM."""\n',
        "src/model.py": '"""Defines the Bidirectional LSTM architecture."""\n',
        "src/train.py": '"""Training loop and callbacks."""\n',
        "src/evaluate.py": '"""Calculates metrics and generates plots."""\n',
        "src/predict.py": '"""Inference script for live data."""\n',
        
        # Tests
        "tests/__init__.py": "",
        "tests/test_data.py": '"""Pytest checks for data integrity."""\n',
        "tests/test_features.py": '"""Pytest checks for feature engineering logic."""\n',
        "tests/test_model.py": '"""Pytest checks for model architecture."""\n',
        
        # Root Files
        ".gitignore": "venv/\n__pycache__/\n.ipynb_checkpoints/\nmlops_artifacts/\ndata/\n.env",
        "Dockerfile": "FROM python:3.9-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"python\", \"run_pipeline.py\"]",
        "Makefile": "train:\n\tpython run_pipeline.py\n\ntest:\n\tpytest tests/\n\nclean:\n\trm -rf mlops_artifacts/logs/* mlops_artifacts/models/*",
        "requirements.txt": "yfinance\npandas\nnumpy\nscikit-learn\ntensorflow\nmatplotlib\nseaborn\njoblib\npytest\npyyaml",
        "run_pipeline.py": '"""Main entry point for the MLOps pipeline."""\n\nif __name__ == "__main__":\n    print("Pipeline starting...")\n',
        "README.md": "# S&P 500 MLOps Project\n\nProfessional MLOps pipeline for predicting the S&P 500 using an Advanced Bidirectional LSTM."
    }

    print(f"🚀 Initializing project structure in '{base_dir_name}'...")

    # Create base directory
    base_path.mkdir(parents=True, exist_ok=True)

    # Create all subdirectories
    for dir_path in directories:
        target_dir = base_path / dir_path
        target_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created folder: {dir_path}")

    # Create all files
    for file_path, content in files.items():
        target_file = base_path / file_path
        with open(target_file, "w") as f:
            f.write(content)
        print(f"📄 Created file:   {file_path}")

    print("\n✅ Project structure successfully generated!")
    print(f"Navigate to your project using: cd {base_dir_name}")

if __name__ == "__main__":
    create_project_structure()