FROM node:18

WORKDIR /app

# Copy API package files
COPY api/package*.json ./
RUN npm install

# Copy API source code
COPY api/ .

# Build the API
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"] 