# Use a specific version of node
FROM node:18 as build
WORKDIR /app

# Install dependencies using npm with a retry mechanism
COPY package*.json ./
RUN npm install --no-audit --no-fund --prefer-offline || \
    npm install --no-audit --no-fund --prefer-offline || \
    npm install --no-audit --no-fund --prefer-offline

# Copy the rest of your app's source code
COPY . .

# Build your application
RUN npm run build

# Use nginx to serve the built application
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Expose port 80 and run nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
