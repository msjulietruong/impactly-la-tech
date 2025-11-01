FROM python:3.12-slim

ENV PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 \
    \
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python -

WORKDIR $PYSETUP_PATH
COPY pyproject.toml poetry.lock ./

RUN poetry install --no-root

COPY . /app/
WORKDIR /app
CMD ["poetry", "run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
