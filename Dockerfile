# Usa la imagen oficial de Node.js como base
FROM node:18 AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json y el package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Compila la aplicación
RUN npm run build

# Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app
# Install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

# Copy build files
COPY --from=builder /app/dist ./dist

# Expone el puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
