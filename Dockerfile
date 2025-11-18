# ETAPA 1: Construcción (Builder)
FROM node:20-alpine as builder

# Argumentos de construcción (para pasar la API Key si es necesario en build time)
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
# Este comando usa Vite para crear los archivos HTML, JS y CSS optimizados
RUN npm run build

# ETAPA 2: Servidor de Producción (Runner)
FROM nginx:alpine

# Copiamos los archivos construidos al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos archivos estáticos adicionales si es necesario y existen en la raíz
# El "|| true" evita que falle si no existen, pero es mejor tenerlos
COPY manifest.json /usr/share/nginx/html/ || true
COPY icon-192.png /usr/share/nginx/html/ || true

# Configuración de Nginx para SPA (Single Page Application)
# Esto es CRUCIAL para que React Router funcione y no de 404 al recargar
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
