# Catalogo de Parametros - Frontend

Frontend desarrollado en Angular 17 para el sistema de catalogo de parametros.

## Caracteristicas

- **Dashboard**: Panel principal con acceso rapido a todas las secciones
- **Organizaciones**: Gestion completa de organizaciones (CRUD)
- **Aplicaciones**: Administracion de aplicaciones por organizacion
- **Modulos**: Gestion de modulos por aplicacion
- **Funcionalidades**: Administracion de funcionalidades por modulo (CRUD)
- **Parametros**: Gestion de parametros por funcionalidad (CRUD)

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── api.service.ts          # Servicio de comunicacion con el backend
│   ├── features/
│   │   ├── organizaciones/
│   │   ├── aplicaciones/
│   │   ├── modulos/
│   │   ├── funcionalidades/
│   │   └── parametros/
│   ├── layout/
│   │   └── components/
│   │       ├── sidebar/                # Menu lateral de navegacion
│   │       └── dashboard/              # Panel principal
│   └── shared/
│       └── models/                     # Interfaces TypeScript
├── assets/
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── index.html
├── main.ts
└── styles.css
```

## Requisitos

- Node.js 18+
- Angular CLI 17+
- Backend corriendo en `http://localhost:8080`

## Instalacion

```bash
cd catalogo-parametros-front
npm install
```

## Ejecucion

```bash
ng serve
```

La aplicacion estara disponible en `http://localhost:4200`

## Configuracion

### Docker Compose (frontend y backend)

Desde la carpeta `CatalogoParametros/CatalogoParametrosUcoLab` del workspace:

```bash
docker compose up --build -d
```

El frontend queda disponible en `http://localhost:4200` y el backend en
`http://localhost:8080`. El Compose incluye los servicios de infraestructura
existentes y requiere las variables de Azure del backend previamente configuradas.
Conservar la estructura de carpetas del workspace: el contexto de construccion
del frontend es `../../CatalogoParametrosFrontend/CatalogoParametros-FrontEnd/catalogo-parametros-front`,
relativo al Compose.

El Dockerfile compila Angular en modo produccion y sirve el resultado con Nginx.
`environment.production.ts` usa una URL relativa y Nginx redirige
`/catalogo-parametros/` a `app:8080` dentro de la red Docker, incluidos los eventos
SSE. Las rutas de Angular pueden abrirse directamente o recargarse.

Para reconstruir solo el frontend con el backend ya levantado:

```bash
docker compose up --build -d --no-deps frontend
```

### Desarrollo local

La URL del backend se configura en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/catalogo-parametros/api/v1'
};
```

## API Endpoints

El frontend consume los siguientes endpoints del backend:

| Recurso | Endpoint | Metodos |
|---------|----------|---------|
| Organizaciones | `/catalogo-parametros/api/v1/organizaciones` | GET, POST, PUT, DELETE |
| Aplicaciones | `/catalogo-parametros/api/v1/aplicaciones` | GET, POST |
| Modulos | `/catalogo-parametros/api/v1/modulos` | GET, POST |
| Funcionalidades | `/catalogo-parametros/api/v1/funcionalidades` | GET, POST, PUT, DELETE |
| Parametros | `/catalogo-parametros/api/v1/parametros` | GET, POST, PUT, DELETE |

## Tecnologias

- Angular 17
- TypeScript 5.4
- RxJS 7.8
- CSS3 (sin frameworks adicionales)
