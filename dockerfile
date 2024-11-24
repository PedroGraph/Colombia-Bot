# Usa una imagen base de Node.js
FROM node:18

# Instala FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Crea un directorio de trabajo
WORKDIR /app

# Copia el código fuente al contenedor
COPY . .

# Instala las dependencias
RUN npm install

# Expone un puerto (si es necesario)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start"]
