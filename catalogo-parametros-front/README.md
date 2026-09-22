# Catalogo de Parametros - Frontend

Frontend desarrollado en Angular 22 para el sistema de catalogo de parametros.

## Caracteristicas

- **Dashboard**: Panel principal con acceso rapido a todas las secciones
- **Organizaciones**: Gestion completa de organizaciones (CRUD)
- **Aplicaciones**: Administracion de aplicaciones por organizacion
- **Modulos**: Gestion de modulos por aplicacion
- **Funcionalidades**: Administracion de funcionalidades por modulo (CRUD)
- **Parametros**: Gestion de parametros por funcionalidad (CRUD)

## Estructura del Proyecto

```
src/app/
├── core/                     # Infraestructura transversal de la aplicacion
│   ├── http/                 # Tratamiento comun de errores HTTP
│   └── realtime/             # Transporte Server-Sent Events
├── features/                 # Modulos verticales e independientes
│   └── <feature>/
│       ├── domain/           # Entidades y puertos; no conoce Angular HTTP
│       ├── infrastructure/   # Adaptadores HTTP que implementan los puertos
│       ├── presentation/     # Paginas y componentes de la feature
│       │   └── components/   # UI especifica y desacoplada de la pagina
│       └── <feature>.routes.ts # Composicion y proveedores de la feature
├── layout/                   # Estructura visual global
└── shared/                   # Contratos y utilidades sin logica de negocio
```

Las rutas de cada feature se cargan de forma diferida. La presentacion depende de
abstracciones del dominio y las implementaciones HTTP se conectan exclusivamente
en el archivo de rutas de cada feature. De esta manera, cambiar el origen de datos
o probar una pantalla con un repositorio falso no exige modificar el componente.

### Regla de dependencias

`presentation -> domain <- infrastructure`

- `domain` contiene reglas, entidades y contratos; nunca importa desde `infrastructure`.
- `infrastructure` conoce HTTP y el backend, e implementa contratos de `domain`.
- `presentation` coordina estado de UI y consume únicamente contratos de `domain`.
- Las paginas viven en `presentation/pages`; formularios u otras piezas propias de
  una feature viven en `presentation/components`.
- `core` no contiene lógica propia de una feature.
- `shared` solo aloja piezas reutilizadas por más de una feature, como mensajes,
  paginacion, estado de conexion y el formulario comun de entidades relacionadas.

## Requisitos

- Node.js 22.22.3+
- Angular CLI 22+
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

- Angular 22
- TypeScript 6.0
- RxJS 7.8
- CSS3 (sin frameworks adicionales)
