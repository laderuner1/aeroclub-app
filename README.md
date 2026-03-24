# ✈️ Sistema de Vuelos - Aeroclub

App web fullstack para gestión de vuelos, pilotos y aeronaves de un aeroclub.  
Stack: **Node.js + Express + SQLite (better-sqlite3) + Vanilla JS**

## 📁 Estructura del Proyecto

```
aeroclub-app/
├── server.js              # Servidor Express principal
├── package.json
├── db/
│   └── database.js        # SQLite: schema + seed data
├── routes/
│   ├── vuelos.js          # CRUD vuelos + stats
│   ├── pilotos.js         # CRUD pilotos
│   └── aeronaves.js       # CRUD aeronaves
└── public/                # Frontend (SPA vanilla JS)
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## 🚀 Instalación y Uso

```bash
npm install
npm start
# → http://localhost:3000
```

## 🗄️ Base de Datos (SQLite)

Se crea automáticamente en `db/aeroclub.db`.  
Tablas: `pilotos`, `aeronaves`, `vuelos`.

## 🔌 API REST

| Método | Ruta                  | Descripción            |
|--------|-----------------------|------------------------|
| GET    | /api/vuelos           | Listar vuelos          |
| GET    | /api/vuelos/stats     | Estadísticas dashboard |
| POST   | /api/vuelos           | Crear vuelo            |
| PUT    | /api/vuelos/:id       | Actualizar vuelo       |
| DELETE | /api/vuelos/:id       | Eliminar vuelo         |
| GET    | /api/pilotos          | Listar pilotos         |
| POST   | /api/pilotos          | Crear piloto           |
| PUT    | /api/pilotos/:id      | Actualizar piloto      |
| DELETE | /api/pilotos/:id      | Eliminar piloto        |
| GET    | /api/aeronaves        | Listar aeronaves       |
| POST   | /api/aeronaves        | Crear aeronave         |
| PUT    | /api/aeronaves/:id    | Actualizar aeronave    |
| DELETE | /api/aeronaves/:id    | Eliminar aeronave      |
| GET    | /api/health           | Health check           |

## 📋 Funcionalidades

- **Dashboard** con 6 métricas en tiempo real
- **CRUD completo** de Vuelos, Pilotos y Aeronaves
- Filtros por estado y fecha en vuelos
- Datos de ejemplo pre-cargados (Villa Dolores → Córdoba)
- Interfaz responsive, modales, notificaciones toast

## 🛠️ Para producción

Para migrar a Oracle: reemplazar `better-sqlite3` por `oracledb`  
y adaptar las queries SQL (sintaxis Oracle).
