FROM node:18.20 as build
WORKDIR /app
# Change the permissions so the directory is accessible
RUN chmod -R 777 /root/.npm

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine 
COPY --from=build /app/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
