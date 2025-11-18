# ETAPA 1: Construcción (The Builder)
FROM node:20-alpine as builder

# Definir variables de entorno para la construcción
# IMPORTANTE: Vite requiere que las variables empiecen con VITE_ o usarlas via process.env en config
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
# Pasamos la variable también como GEMINI_API_KEY para compatibilidad
ENV GEMINI_API_KEY=$VITE_API_KEY 

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación (Crea la carpeta /dist)
RUN npm run build

# ETAPA 2: Servidor de Producción (The Server)
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración para que React Router funcione bien (redirige todo a index.html)
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

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]