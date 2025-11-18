# Usamos una imagen ligera de Python para servir archivos estáticos
# Esto es perfecto para el método "sin build"
FROM python:3.11-slim

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos TODOS los archivos al contenedor
COPY . .

# Exponemos el puerto 8080 (obligatorio para Cloud Run)
EXPOSE 8080

# Iniciamos un servidor web simple que entrega los archivos tal cual
CMD ["python", "-m", "http.server", "8080"]
