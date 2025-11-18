# ETAPA 1: CONSTRUCCIÓN (The Kitchen)
FROM node:20-alpine as builder

# Definir variables de entorno para la construcción
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación (Esto crea la carpeta /dist con index.html y .js)
RUN npm run build

# ETAPA 2: SERVIDOR (The Waiter)
FROM nginx:alpine

# Copiar los archivos ya cocinados al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración para que la navegación (Rutas) funcione bien
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
