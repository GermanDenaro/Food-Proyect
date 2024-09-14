# Usar la imagen oficial de Node.js
FROM node:20

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Si bcrypt está ya instalado localmente, elimina sus binarios para forzar la recompilación en el contenedor
RUN npm rebuild bcrypt --build-from-source

# Copiar el resto de la aplicación al contenedor
COPY . .

# Exponer el puerto que utiliza tu aplicación (cambia si usas otro puerto)
EXPOSE 4000

# Definir el comando que se ejecutará cuando se inicie el contenedor
CMD ["node", "server.js"]
