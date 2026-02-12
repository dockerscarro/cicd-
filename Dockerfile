############################################################
# 1️⃣ NODE BUILD STAGE
############################################################
FROM node:20-alpine AS node-build

WORKDIR /node-app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build


############################################################
# 2️⃣ NODE PRODUCTION IMAGE
############################################################
FROM node:20-alpine AS node-runtime

WORKDIR /app

COPY --from=node-build /node-app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]


############################################################
# 3️⃣ PYTHON ETL IMAGE
############################################################
FROM python:3.11-slim AS hubspot-etl

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

CMD ["python", "app.py"]
