FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm install

# Copy the ENTIRE project
COPY . .

# Create uploads folder if it doesn't exist
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "run", "dev"]