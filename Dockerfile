FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
COPY .env .env

ENV NODE_ENV=development

EXPOSE 3000

# Run exactly what works locally
CMD ["npm", "run", "dev"]
