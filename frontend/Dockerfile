# Etapa 1: Construcción de la aplicación
FROM node:20 AS build

# Establecer directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente de la app
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa 2: Servir la aplicación utilizando un servidor web
FROM nginx:stable-alpine

# Copiar los archivos estáticos generados en la etapa de build al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80 para acceder a la aplicación
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
