# El contexto security_ui lo proporciona docker-compose.yml del backend.
FROM node:22-alpine AS security-ui-build
WORKDIR /security-ui
COPY --from=security_ui package.json package-lock.json ./
RUN npm ci
COPY --from=security_ui . .
# Resolver tambien NODE_ENV al consumir una revision externa anterior del bundle.
COPY security-ui.build.mjs ./build-browser.mjs
RUN npm run typecheck && node build-browser.mjs

# Compilar Angular con las dependencias fijadas en package-lock.json.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Servir los archivos compilados y redirigir la API al backend.
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/catalogo-parametros-front/browser/ /usr/share/nginx/html/
COPY --from=security-ui-build /security-ui/dist/ /usr/share/nginx/html/security-ui/
COPY security-config.docker.json /usr/share/nginx/html/assets/security-config.json
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
