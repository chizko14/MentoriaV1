# Usamos Python porque tiene un servidor web simple integrado
FROM python:3.11-slim

# Carpeta de trabajo
WORKDIR /app

# Copiamos TODOS tus archivos (index.html, .tsx, .ts, etc.)
COPY . .

# Exponemos el puerto 8080
EXPOSE 8080

# Comando mágico: Inicia un servidor web simple que entrega los archivos tal cual
CMD ["python", "-m", "http.server", "8080"]
