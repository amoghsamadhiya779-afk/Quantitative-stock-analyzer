train:
	python run_pipeline.py

test:
	pytest tests/

clean:
	rm -rf mlops_artifacts/logs/* mlops_artifacts/models/*