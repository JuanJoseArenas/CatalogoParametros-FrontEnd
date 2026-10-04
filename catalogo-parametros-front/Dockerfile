# Compilar Angular con las dependencias fijadas en package-lock.json.
FROM node:22-alpine AS build
WORKDIR /app
# Compilar también sin privilegios y con un directorio escribible por node.
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build -- --configuration production

# Servir los archivos compilados y redirigir la API al backend.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/catalogo-parametros-front/browser/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
