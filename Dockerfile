# Etapa 1: Construcción
FROM node:20-alpine as builder

# Argumentos de construcción
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
ENV GEMINI_API_KEY=$VITE_API_KEY

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalación limpia
RUN npm install

# Copiar resto del código
COPY . .

# Construcción
RUN npm run build

# Etapa 2: Servidor
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar archivos estáticos (si existen)
COPY manifest.json /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/

# Configuración Nginx
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
