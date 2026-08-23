# BITÁCORA DEL PROYECTO RENTOS
**Rent Operating System — Sistema de gestión para Rent Cars**

---

## 1. Propósito
Registrar de forma continua las decisiones, configuraciones, comandos, cambios técnicos, avances, pruebas y pendientes de RentOS, conservando el porqué de cada decisión, qué se hizo, para qué se hizo y hacia dónde va el proyecto.

---

## 2. Visión del Proyecto
- **Plataforma para múltiples Rent Cars:** Arquitectura multi-empresa (multi-tenant).
- **Capacidad objetivo:** Hasta 50 vehículos por Rent Car.
- **Enfoque inicial:** Santo Domingo, República Dominicana, con posibilidad de expansión a otras localidades.
- **Desarrollo por etapas:** Primero consolidar backend, base de datos y arquitectura; luego consolidar y pulir el frontend.
- **Administración de vehículos:** Alta, edición, eliminación y gestión de estados.
- **Estados contemplados:** `DISPONIBLE`, `ALQUILADO` y `MANTENIMIENTO`.
- **Monitoreo futuro:** Integración con dispositivos GPS.
- **Personalización por Rent Car:** Nombre, logo y ajustes comerciales propios.
- **Interconexión entre Rent Cars:** Operaciones colaborativas entre localidades como funcionalidad a futuro.

---

## 3. Stack y Entorno Registrado

| Tecnología | Uso | Versión / Estado |
| :--- | :--- | :--- |
| **Node.js** | Runtime del backend | 22.23.2 |
| **npm** | Gestor de paquetes y scripts | 10.9.8 |
| **TypeScript** | Tipado y compilación estricta | Configurado |
| **Express** | Framework API HTTP | Instalado |
| **PostgreSQL** | Base de datos relacional principal | 18 |
| **pgAdmin 4** | Herramienta de administración DB | Instalado |
| **Prisma** | ORM (Node.js → PostgreSQL) | Seleccionado / Configurado |
| **React + Vite** | Frontend SPA | Configurado |
| **Git & GitHub** | Control de versiones y respaldo | Configurado (`JAAC1990/RentOS`) |
| **VS Code / IDE** | Entorno de desarrollo | Configurado |

---

## 4. Git y Estructura Inicial
- Repositorio inicializado en `C:/Users/J.Gabriel/Documents/RentOS/.git/`.
- Repositorio remoto vinculado en GitHub: `https://github.com/JAAC1990/RentOS.git`.
- Configuración de `.gitignore` para excluir `node_modules/`, variables `.env`, logs y bases de datos locales.
- Estructura modular separada en `/backend`, `/frontend`, `/prisma` y `/docs`.

---

## 5. Backend y API de Vehículos
El frontend de vehículos se comunica contra el endpoint de vehículos contemplando las operaciones CRUD:
- `GET /api/vehiculos` — Listar todos los vehículos.
- `POST /api/vehiculos` — Registrar un nuevo vehículo.
- `PUT /api/vehiculos/:id` — Actualizar información de un vehículo.
- `DELETE /api/vehiculos/:id` — Eliminar vehículo (con `AbortController` y timeout de 10s).

---

## 6. VehiculosPage.tsx — Estado del Módulo
- Carga de datos inicial mediante `useEffect`.
- Formulario modal reutilizable para operaciones de creación y edición.
- Validaciones completas: marca, modelo, año, placa, kilometraje y tarifa diaria.
- Búsqueda en tiempo real por: marca, modelo, color, placa, VIN, año y kilometraje.
- Filtros por estado (`DISPONIBLE`, `ALQUILADO`, `MANTENIMIENTO`) y botón para limpiar filtros.
- Indicador visual de vehículos filtrados vs. total.
- Alertas y mensajes claros de éxito y error.
- Diálogo de confirmación antes de eliminar un registro.
- Bloqueo de acciones y estados de carga durante guardado o eliminación.

---

## 7. Roadmap General de Desarrollo
1. **Consolidar backend y endpoints:** Estandarización de respuestas y manejo de errores.
2. **Consolidar PostgreSQL + Prisma:** Modelado relacional robusto y migraciones.
3. **Separación de datos por Rent Car:** Soporte multi-tenant para aislar la información de cada negocio.
4. **Completar gestión de vehículos:** Historial, especificaciones y fotos.
5. **Módulo de Clientes:** Registro, historial de rentas y validación de documentos (cédula/pasaporte/licencia).
6. **Módulo de Contratos y Reservas:** Creación de rentas, cálculo de tarifas, fechas de entrega y devolución.
7. **Módulo de Pagos y Facturación:** Depósitos de garantía, cobros, balances y recibos.
8. **Mantenimiento e Historial:** Registro de servicios, cambios de aceite, reparaciones y alertas de kilometraje.
9. **Integración con GPS:** Rastreo en tiempo real, geocercas y alertas de velocidad.
10. **Autenticación y Autorización:** Roles de usuario (SuperAdmin, Administrador de Rent Car, Empleado).
11. **Personalización de Marca:** Configuración de logo, colores y datos fiscales por Rent Car.
12. **Interconexión entre Rent Cars:** Préstamos y transferencias de vehículos entre agencias.

---

## 8. Estándares de Documentación y Código
- **Comentarios con propósito:** Explicar el *porqué* de las decisiones y reglas de negocio, evitando comentarios redundantes.
- **Tipado estricto:** Modelos TypeScript alineados entre frontend y backend.
- **Variables de entorno:** Centralizar URLs y credenciales en `.env`.
- **Commits descriptivos:** Cada cambio debe tener un mensaje claro que describa la mejora o corrección.

---

## 9. Historial de Entradas y Cambios

### [2026-08-22] - Inicialización y Vinculación
- **Acción:** Creación de bitácora oficial del proyecto en `docs/BITACORA.md`.
- **Git:** Vinculación exitosa con repositorio remoto de GitHub (`JAAC1990/RentOS`).

### [2026-08-22] - Arquitectura SaaS Multi-Tenant (Rent Car)
- **Problema/Necesidad:** Habilitar a RentOS como plataforma SaaS donde múltiples empresas de alquiler de vehículos puedan gestionar su flota de forma completamente aislada e independiente.
- **Decisión técnica:** Creación del modelo `RentCar` en Prisma/PostgreSQL, vinculando `Vehiculo`, `Cliente`, `Contrato` y `Usuario` mediante claves foráneas y relaciones indexadas.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/rentcars.routes.ts`, `backend/src/index.ts`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Creación del Rent Car principal ID 1 sin pérdida de los 8 vehículos iniciales.
  - Creación de empresa de prueba `AutoRent Bávaro` (ID 2) y vehículo de prueba (Hyundai Santa Fe).
  - Consulta de aislamiento comprobando que la flota del Rent Car 1 (8 vehículos) y Rent Car 2 (1 vehículo) operan con total independencia.
- **Resultado:** Base de datos sincronizada (`prisma db push`), frontend y backend compilando al 100% con cero errores de TypeScript.

### [2026-08-22] - Módulo Completo de Gestión de Clientes
- **Problema/Necesidad:** Desarrollar el módulo de Clientes (Paso 5 del Roadmap) para permitir el registro de clientes, gestión de estados (`ACTIVO`, `INACTIVO`, `BLOQUEADO`), historial de rentas y búsqueda rápida.
- **Decisión técnica:** Creación de `ClientesPage.tsx` con tarjetas de métricas en tiempo real, tabla responsiva con avatares de iniciales, formulario modal/desplegable con validación de teléfono/email y soporte de eliminación protegida con preservación de historial de contratos.
- **Archivos afectados:** `backend/src/routes/clientes.routes.ts`, `frontend/src/pages/Clientes/ClientesPage.tsx`, `prisma/seed_clientes.ts`.
- **Pruebas realizadas:**
  - Inserción y consulta de clientes en PostgreSQL mediante Prisma.
  - Verificación de respuestas en endpoint `GET /api/clientes` (HTTP 200 OK).
  - Compilación de TypeScript en frontend y backend con 0 errores.
- **Resultado:** Módulo de Clientes 100% operativo y conectado en `http://localhost:5173/clientes`.



