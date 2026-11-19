FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=America/Fortaleza
RUN ln -snf /usr/share/zoneinfo/America/Fortaleza /etc/localtime \
    && echo "America/Fortaleza" > /etc/timezone

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY migrations ./migrations
COPY src ./src
COPY main.py .
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

# Executa as migrations antes de iniciar o servidor.
CMD ["./docker-entrypoint.sh"]
