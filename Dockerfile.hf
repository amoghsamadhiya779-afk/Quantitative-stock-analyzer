# Dockerfile for Hugging Face Spaces
FROM python:3.9-slim

# Create user to avoid running as root (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONPATH=$HOME/app \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

COPY --chown=user requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy backend specific files
COPY --chown=user api/ ./api/
COPY --chown=user src/ ./src/
COPY --chown=user data/ ./data/
COPY --chown=user mlops_artifacts/ ./mlops_artifacts/

# Hugging Face Spaces expose port 7860 by default
EXPOSE 7860

# Run FastAPI backend using Uvicorn on port 7860
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860", "--proxy-headers"]
