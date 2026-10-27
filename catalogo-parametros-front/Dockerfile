# El contexto security_ui lo proporciona docker-compose.yml del backend.
FROM node:22-alpine AS security-ui-build
WORKDIR /security-ui
RUN chown node:node /security-ui
USER node
COPY --from=security_ui --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --from=security_ui --chown=node:node . .
# Resolver tambien NODE_ENV al consumir una revision externa anterior del bundle.
COPY --chown=node:node security-ui.build.mjs ./build-browser.mjs
RUN npm run typecheck && node build-browser.mjs

# Compilar Angular con las dependencias fijadas en package-lock.json.
FROM node:22-alpine AS build
WORKDIR /app
# Compilar también sin privilegios y con un directorio escribible por node.
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build -- --configuration production && npm run build:microfrontend

# Servir los archivos compilados y redirigir la API al backend.
FROM nginxinc/nginx-unprivileged:stable-alpine
# Actualizar PCRE2 antes de volver al usuario sin privilegios.
# CVE-2026-103111: versión corregida mínima según el reporte de Trivy.
USER root
RUN apk add --upgrade --no-cache 'pcre2>=10.49-r0'
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/catalogo-parametros-front/browser/ /usr/share/nginx/html/
COPY --from=build /app/dist/parametros-ui/ /usr/share/nginx/html/parametros-ui/
COPY --from=security-ui-build /security-ui/dist/ /usr/share/nginx/html/security-ui/
COPY security-config.docker.json /usr/share/nginx/html/assets/security-config.json
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
