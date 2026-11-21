# Imagen del backend (FastAPI)
FROM python:3.13-slim

# hora de Costa Rica 
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=America/Costa_Rica

RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# El servidor no corre como administrador
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Render define PORT, localmente 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]