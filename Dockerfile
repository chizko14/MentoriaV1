# Etapa 1: Construcción (Builder)
FROM node:20-alpine as builder

# Argumentos de construcción para pasar variables de entorno (si las usas)
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
ENV GEMINI_API_KEY=$VITE_API_KEY

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la aplicación (genera la carpeta /dist)
RUN npm run build

# Etapa 2: Servidor de Producción (Runner)
FROM nginx:alpine

# Copiamos los archivos construidos al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos archivos estáticos adicionales si es necesario
# Asegúrate de que estos archivos existan en tu proyecto local
COPY manifest.json /usr/share/nginx/html/
# COPY sw.js /usr/share/nginx/html/  <-- Comentado si no tienes un sw.js válido para producción aún
# COPY icon-192.png /usr/share/nginx/html/ <-- Asegúrate de tener el icono o coméntalo

# Configuración de Nginx para SPA (Single Page Application)
# Esto es vital para que React Router funcione y no de 404 al recargar
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Puerto requerido por Cloud Run
EXPOSE 8080

# Iniciamos Nginx
CMD ["nginx", "-g", "daemon off;"]
