# ---------- Stage 1: Build Node App ----------
FROM node:20-alpine AS node-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build


# ---------- Stage 2: Python ETL Runtime ----------
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ETL code
COPY . .

# Copy built Node app from previous stage
COPY --from=node-builder /app/build ./frontend-build

# Expose Node port if needed
EXPOSE 3000

# Default command
CMD ["python", "app.py"]
