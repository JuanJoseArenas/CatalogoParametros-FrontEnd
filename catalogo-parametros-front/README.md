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
docker compose -f docker-compose.yml up --build -d
```

El frontend queda disponible en `http://localhost:4200` y el backend en
`http://localhost:8080`. El Compose incluye los servicios de infraestructura
existentes y requiere las variables de Azure del backend previamente configuradas.
Conservar la estructura de carpetas del workspace: el contexto de construccion
del frontend es `../../CatalogoParametros-FrontEnd/catalogo-parametros-front`,
relativo al Compose.

El Dockerfile compila Angular en modo produccion y sirve el resultado con Nginx.
`environment.production.ts` usa una URL relativa y Nginx redirige
`/catalogo-parametros/` a `app:8080` dentro de la red Docker, incluidos los eventos
SSE. Las rutas de Angular pueden abrirse directamente o recargarse.

Para reconstruir solo el frontend con el backend ya levantado:

```bash
docker compose -f docker-compose.yml up --build -d --no-deps frontend
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

## Integración con Security Baseline

El host consulta la sesión BFF antes de renderizar. Un 401 redirige al login central
con la URL actual en `return_to`; un error de red o del BFF detiene el arranque y
ofrece reintentar. Las llamadas HTTP al catálogo y los eventos SSE incluyen cookies.
La ruta `/seguridad`, accesible desde la barra lateral, monta la API pública ESM
`mount` de Security UI y ejecuta `unmount` al salir.

Configure `src/assets/security-config.json`: `pdpUrl`, `securityUiUrl`,
`applicationName` y, opcionalmente, `applicationId` (preferido si conoce su UUID).
El nombre debe coincidir exactamente con el registro en Seguridad y con
`SECURITY_APPLICATION_NAME` del backend. Se usa `Catalogo`, nombre registrado en Seguridad. Este JSON es público: no contiene tokens ni secretos.
Se carga en cada arranque. El destino del BFF debe pertenecer a `TRUSTED_PDP_URLS`
en `src/app/core/security/security-config.ts`; el laboratorio permite
`http://localhost:18080`. El JSON no puede autorizar servidores nuevos para recibir
cookies o iniciar el login. El retorno del login debe pertenecer al origen del host.

En desarrollo, inicie Security UI desde `../../Seguridad/security-ui` con
`npm run build` y `npm run preview`: publica el bundle en el puerto 5175.
El host sigue usando `http://localhost:4200`; el BFF debe permitir ese origen en
`PDP_SECURITY_CORS_ALLOWED_ORIGINS` y `PDP_LOGIN_ALLOWED_RETURN_ORIGINS`.
El Compose local de Seguridad ya incluye ese origen.

Docker Compose compila también Security UI mediante el contexto `security_ui` y
lo sirve desde `/security-ui/`. `security-config.docker.json` configura este montaje.
Para construir directamente con Docker, agregue
`--build-context security_ui=../../Seguridad/security-ui` al comando de build. El pipeline usa el contexto Git de Security UI fijado por
`SECURITY_UI_COMMIT`; actualice ese commit al adoptar una nueva versión validada.
En producción, agregue el origen HTTPS del BFF a la lista de confianza antes de
compilar y sustituya el JSON por las URLs HTTPS de su despliegue; configure
CSP para permitir el bundle en `script-src` y el BFF en `connect-src`.

El alta de aplicación, administrador adicional y la cadena recurso → rol → perfil
→ usuario se realizan en Seguridad. Consulte la guía del backend en
`docs/SEGURIDAD-INTEGRACION.md` para el arranque y la matriz de verificación.
