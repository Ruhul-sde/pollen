FROM node:20-alpine
WORKDIR /app

# Copy server package definitions and install production dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server application code and seed data
COPY server/src ./src
COPY server/DataBase\ Seed ./DataBase\ Seed

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose all ports Easypanel might check or route to
EXPOSE 80
EXPOSE 3000
EXPOSE 5000

ENV NODE_ENV=production

# Start Express server directly with node
CMD ["node", "src/server.js"]
