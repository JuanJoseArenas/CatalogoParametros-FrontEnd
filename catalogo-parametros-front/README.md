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
