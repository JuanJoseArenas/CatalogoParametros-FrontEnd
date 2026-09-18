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
src/app/
├── core/                     # Infraestructura transversal de la aplicacion
│   ├── http/                 # Tratamiento comun de errores HTTP
│   └── realtime/             # Transporte Server-Sent Events
├── features/                 # Modulos verticales e independientes
│   └── <feature>/
│       ├── domain/           # Entidades y puertos; no conoce Angular HTTP
│       ├── data/             # Adaptadores HTTP que implementan los puertos
│       ├── components/       # Capa de presentacion
│       └── <feature>.routes.ts # Composicion y proveedores de la feature
├── layout/                   # Estructura visual global
└── shared/                   # Contratos y utilidades sin logica de negocio
```

Las rutas de cada feature se cargan de forma diferida. La presentacion depende de
abstracciones del dominio y las implementaciones HTTP se conectan exclusivamente
en el archivo de rutas de cada feature. De esta manera, cambiar el origen de datos
o probar una pantalla con un repositorio falso no exige modificar el componente.

### Regla de dependencias

`presentation -> domain <- data`

- `domain` contiene reglas, entidades y contratos; nunca importa desde `data`.
- `data` conoce HTTP y el backend, e implementa contratos de `domain`.
- `components` coordina estado de UI y consume únicamente contratos de `domain`.
- `core` no contiene lógica propia de una feature.
- `shared` solo aloja piezas reutilizadas por más de una feature.

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
