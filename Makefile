.PHONY: install api ui test lint train validate report report-quick

install:
	pip install -r requirements-dev.txt
	cd frontend && npm ci

api:
	uvicorn api.main:app --reload --port 7860

ui:
	cd frontend && npm run dev

test:
	pytest

lint:
	ruff check .

train:
	pip install -r requirements-train.txt
	python run_pipeline.py

validate:
	python validate_strategy.py

report:
	python build_report_card.py

report-quick:
	python build_report_card.py --baselines-only
