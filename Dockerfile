# Use a specific version of node
FROM node:18.20 as build
WORKDIR /app

# Install dependencies using npm
COPY package*.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build your application
RUN npm run build

# Use nginx to serve the built application
FROM nginx:alpine 
COPY --from=build /app/build /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Expose port 80 and run nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
