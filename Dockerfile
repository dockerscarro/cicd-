FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]
