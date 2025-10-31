FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy Poetry files first (for better caching)
COPY pyproject.toml poetry.lock* ./

# Install dependencies (main only, skip dev for production)
RUN poetry install --no-root --only main

# Copy the rest of the project
COPY . .

# Ensure Poetry doesn't create a virtual environment inside container
ENV POETRY_VIRTUALENVS_CREATE=false

CMD ["poetry", "run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
