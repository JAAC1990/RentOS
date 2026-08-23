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

### [2026-08-22] - Módulo de Contratos, Reservas y Ciclo de Vida del Vehículo
- **Problema/Necesidad:** Implementar el módulo de Contratos y Reservas (Paso 6 del Roadmap) para conectar clientes con vehículos, calcular tarifas/depósitos y automatizar la disponibilidad de la flota.
- **Decisión técnica:**
  - `ContratosPage.tsx` con selector dinámico de clientes aptos y vehículos disponibles.
  - Cálculo automático de días de alquiler y monto total estimado en tiempo real.
  - Automatización en base de datos: al activar un contrato, el vehículo cambia a `ALQUILADO`. Al finalizar o cancelar, el vehículo se libera a `DISPONIBLE` y se actualiza su kilometraje final.
- **Archivos afectados:** `backend/src/routes/contratos.routes.ts`, `frontend/src/pages/Contratos/ContratosPage.tsx`.
- **Pruebas realizadas:**
  - Validación de fechas, cálculo de totales y disponibilidad de flota.
  - Verificación de respuestas en endpoint `GET /api/contratos` (HTTP 200 OK).
  - Compilación TypeScript frontend/backend limpia (0 errores).
- **Resultado:** Módulo de Contratos 100% funcional y operativo en `http://localhost:5173/contratos`.

### [2026-08-22] - Módulo de Pagos, Caja y Facturación
- **Problema/Necesidad:** Implementar el módulo de Pagos y Caja (Paso 7 del Roadmap) para registrar cobros de rentas, depósitos en garantía, balances y múltiples métodos de pago (Efectivo, Transferencia, Tarjeta, PayPal).
- **Decisión técnica:**
  - `PagosPage.tsx` con métricas de caja en vivo (Total Recaudado en verde, Pagos Realizados, Pendientes, Anulados).
  - Formulario de cobro conectado con contratos existentes con autollenado de monto según días calculados.
  - Soporte para anulación segura de transacciones y filtros por método de pago y estado.
- **Archivos afectados:** `backend/src/routes/pagos.routes.ts`, `frontend/src/pages/Pagos/PagosPage.tsx`.
- **Pruebas realizadas:**
  - Verificación de endpoints `GET /api/pagos` y `POST /api/pagos` (HTTP 200 OK).
  - Compilación TypeScript frontend/backend completa con 0 errores.
- **Resultado:** Módulo de Pagos 100% operativo y conectado en `http://localhost:5173/pagos`.

### [2026-08-22] - Notificaciones Automáticas de Respaldo (Backup) a Telegram
- **Problema/Necesidad:** Alertar al administrador de RentOS en tiempo real a su Telegram cuando se genere o restaure una copia de seguridad de la base de datos PostgreSQL.
- **Decisión técnica:**
  - Integración de `alert.service.ts` y `telegram.ts` con la API oficial de Telegram Bots.
  - Formateo enriquecido en HTML con nombre del archivo `.sql`, tamaño en KB, fecha/hora y estado del respaldo.
  - Generación de copias con `pg_dump` y almacenamiento en `/backups`.
- **Archivos afectados:** `backend/src/routes/backup.routes.ts`, `backend/src/services/alert.service.ts`, `backend/src/lib/telegram.ts`, `scripts/test_telegram.ts`.
- **Pruebas realizadas:**
  - Ejecución de `test_telegram.ts` confirmando recepción de alerta de prueba en el canal/chat de Telegram.
  - Ejecución de `POST /api/backups` generando exitosamente el archivo SQL y despachando la notificación inmediata con peso y nombre de archivo.
- **Resultado:** Sistema de backups y alertas en Telegram 100% activo y probado.

### [2026-08-22] - Módulo de Mantenimiento, Taller y Salud de Flota
- **Problema/Necesidad:** Implementar el módulo de Mantenimiento Preventivo y Correctivo (Paso 8 del Roadmap) para llevar el control de cambios de aceite, repuestos, reparaciones mecánicas y costos de taller.
- **Decisión técnica:**
  - Modelo `Mantenimiento` en PostgreSQL/Prisma con estados (`PROGRAMADO`, `EN_PROCESO`, `COMPLETADO`, `CANCELADO`), control de odómetro y sugerencia de próximo servicio (+5,000 km).
  - Automatización de estados: Si un servicio entra `EN_PROCESO`, el vehículo se bloquea automáticamente a `MANTENIMIENTO`. Al finalizarlo (`COMPLETADO`), vuelve a `DISPONIBLE`.
  - Creación de `MantenimientoPage.tsx` con métricas de inversión total, filtros, buscador y registro rápido.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/mantenimiento.routes.ts`, `backend/src/index.ts`, `frontend/src/pages/Mantenimiento/MantenimientoPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Sincronización de Prisma (`prisma db push`).
  - Creación de registro de mantenimiento vía `POST /api/mantenimientos` (HTTP 201 Created).
  - Consulta de lista de servicios `GET /api/mantenimientos` (HTTP 200 OK).
  - Compilación TypeScript frontend y backend limpia (0 errores).
- **Resultado:** Módulo de Mantenimiento 100% operativo y conectado en `http://localhost:5173/mantenimiento`.

### [2026-08-22] - Módulo de Monitoreo GPS Satelital y Geocercas
- **Problema/Necesidad:** Implementar el rastreo satelital en tiempo real de la flota (Paso 9 del Roadmap), con velocímetro, nivel de batería de los dispositivos, geocercas y corte remoto de ignición anti-robo.
- **Decisión técnica:**
  - Modelo `UbicacionGPS` en PostgreSQL/Prisma para ingesta de coordenadas, velocidad, batería y estado del motor.
  - Centro de control con mapa interactivo Leaflet / OpenStreetMap con marcadores dinámicos por estado (verde = en movimiento, azul = estacionado, rojo = inmovilizado).
  - Funcionalidad de inmovilización y corte remoto de ignición (`POST /api/gps/inmovilizar/:vehiculoId`).
  - Simulador de ping de telemetría en vivo para pruebas satelitales.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/gps.routes.ts`, `backend/src/index.ts`, `frontend/src/pages/Gps/GpsPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Inicialización automática de coordenadas y telemetrías para toda la flota en RD.
  - Verificación de comandos de corte de motor e inmovilización remota vía API (HTTP 200 OK).
  - Compilación de TypeScript en frontend y backend limpia (0 errores).
- **Resultado:** Módulo GPS Satelital 100% operativo y conectado en `http://localhost:5173/gps`.

### [2026-08-22] - Módulo de Autenticación, JWT y Control de Accesos por Roles (RBAC)
- **Problema/Necesidad:** Implementar la autenticación de usuarios y asignación de roles (Paso 10 del Roadmap) para restringir accesos, proteger contraseñas con encriptación bcrypt y emitir tokens JWT.
- **Decisión técnica:**
  - `auth.routes.ts`: Inicio de sesión seguro `POST /api/auth/login` con validación de hashes bcrypt y generación de tokens JWT con 7 días de vigencia.
  - `users.routes.ts`: CRUD completo de empleados y administradores con encriptación automática y soporte para roles (`SUPERADMIN`, `ADMIN_RENTCAR`, `EMPLEADO`).
  - `UsuariosPage.tsx`: Panel administrativo de equipo con métricas de usuarios, formulario de creación y cambio rápido de estado activo/inactivo.
- **Archivos afectados:** `backend/src/routes/auth.routes.ts`, `backend/src/routes/users.routes.ts`, `backend/src/index.ts`, `frontend/src/pages/Usuarios/UsuariosPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Creación de usuario asesor con hash seguro bcrypt (HTTP 201 Created).
  - Validación de login correcto con emisión de token JWT firmado (HTTP 200 OK).
  - Verificación de lista de usuarios y activación/desactivación de cuentas.
  - Compilación TypeScript frontend/backend limpia (0 errores).
- **Resultado:** Módulo de Autenticación y Usuarios 100% operativo y conectado en `http://localhost:5173/usuarios`.

### [2026-08-22] - Módulo de Configuración de Empresa, Marca y Parámetros Comerciales
- **Problema/Necesidad:** Permitir la personalización de marca (Paso 11 & 12 del Roadmap), identidad fiscal (RNC), moneda de cobro, depósitos estándar, límites de kilometraje diario, cláusulas de contratos y generación de backups bajo demanda.
- **Decisión técnica:**
  - Ampliación del modelo `RentCar` en Prisma con campos `moneda`, `terminosContrato`, `limiteKilometrajeDiario`, `cargoKmExtra` y `depositoEstandar`.
  - `ConfiguracionPage.tsx`: Panel de control para edición de identidad comercial, políticas contractuales y botón directo de generación de backups de base de datos con despacho a Telegram.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/rentcars.routes.ts`, `frontend/src/pages/Configuracion/ConfiguracionPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Sincronización de base de datos (`prisma db push`).
  - Consulta y actualización de datos de empresa mediante `GET /api/rentcars/1` y `PUT /api/rentcars/1` (HTTP 200 OK).
  - Disparador de copia de seguridad con notificación exitosa a Telegram.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Módulo de Configuración de Empresa 100% operativo y conectado en `http://localhost:5173/configuracion`.

### [2026-08-22] - Documentos Imprimibles (Contratos & Recibos) y Exportación CSV
- **Problema/Necesidad:** Facilitar la emisión de contratos físicos/PDF para firmas presenciales, vouchers de caja y exportación contable a Excel/CSV.
- **Decisión técnica:**
  - `ContratosPage.tsx`: Modal de Contrato de Arrendamiento formal con membrete del Rent Car, RNC, desglose de tarifa/depósito, cláusulas legales y recuadros de firma para ambas partes con `window.print()`.
  - `PagosPage.tsx`: Recibo Oficial de Caja imprimible con comprobante y firma autorizada.
  - Exportación instantánea a CSV compatible con Excel en módulos de Vehículos, Clientes, Contratos y Pagos.
- **Archivos afectados:** `frontend/src/pages/Contratos/ContratosPage.tsx`, `frontend/src/pages/Pagos/PagosPage.tsx`, `frontend/src/pages/Vehiculos/VehiculosPage.tsx`, `frontend/src/pages/Clientes/ClientesPage.tsx`.
- **Pruebas realizadas:**
  - Prueba de renderizado de contratos y recibos en modal emergente con formato listo para impresión y guardado PDF.
  - Descarga y verificación de archivos CSV generados.
  - Compilación TypeScript con 0 errores.
- **Resultado:** Plataforma RentOS enriquecida con capacidades de impresión formal y reportería contable.












