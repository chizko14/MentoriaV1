# Usamos una base ligera
FROM python:3.11-slim

# Carpeta de trabajo
WORKDIR /app

# Copiamos todos tus archivos (html, css, tsx)
COPY . .

# Abrimos el puerto
EXPOSE 8080

# Lanzamos un servidor web simple para mostrar tu HTML
CMD ["python", "-m", "http.server", "8080"]