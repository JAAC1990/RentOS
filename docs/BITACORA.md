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

### [2026-08-22] - Modo Oscuro Persistente y Scoring Crediticio / Buró de Riesgo
- **Problema/Necesidad:** Añadir soporte de Modo Oscuro para ergonomía visual del usuario y un sistema de evaluación de riesgo crediticio para clientes antes de entregar vehículos.
- **Decisión técnica:**
  - `Header.tsx` & `index.css`: Interruptor de Modo Oscuro/Claro persistente en `localStorage` con adaptación completa de paleta en tarjetas, paneles, tablas e inputs.
  - `credito.routes.ts`: Algoritmo de scoring crediticio (300 a 850 pts) con clasificación de riesgo (`BAJO`, `MEDIO`, `ALTO`), recomendaciones operativas y persistencia en modelo `ConsultaCredito`.
  - `ClientesPage.tsx`: Botón interactivo `🔍 Buró Score` en cada cliente con medidor visual y opción de bloqueo inmediato en lista negra.
- **Archivos afectados:** `backend/src/routes/credito.routes.ts`, `backend/src/index.ts`, `frontend/src/components/Header.tsx`, `frontend/src/index.css`, `frontend/src/pages/Clientes/ClientesPage.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Evaluación exitosa de cliente vía `POST /api/credito/evaluar` (Score 734, Nivel BAJO, HTTP 201 Created).
  - Verificación del cambio de tema oscuro/claro y persistencia al recargar.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS cuenta con protección de riesgo de crédito y personalización visual avanzada.

### [2026-08-22] - Red de Rent Cars Aliados, Búsqueda Cruzada de Flota & Transferencias
- **Problema/Necesidad:** Permitir la interconexión entre empresas de Rent a Car (Paso 12 del Roadmap) para buscar inventario disponible en negocios aliados cuando no hay flota propia y solicitar transferencias inter-sucursal.
- **Decisión técnica:**
  - Modelo `TransferenciaFlota` en Prisma para ciclo de vida de préstamos inter-empresa (`PENDIENTE`, `APROBADA`, `EN_TRANSITO`, `COMPLETADA`).
  - `red.routes.ts`: Búsqueda cruzada multi-empresa `GET /api/red/flota` con filtros por ciudad (Santo Domingo, Punta Cana, Santiago) y marca, más endpoints de solicitud y cambio de estado.
  - `RedAliadaPage.tsx`: Marketplace de flota compartida, directorio de aliados con contactos directos y panel de control de transferencias de flota en tiempo real.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/red.routes.ts`, `backend/src/index.ts`, `frontend/src/pages/RedAliada/RedAliadaPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/services/api.ts`.
- **Pruebas realizadas:**
  - Sincronización Prisma e inicialización de aliados en Punta Cana y Santiago.
  - Consulta cruzada de flota multi-ciudad vía `GET /api/red/flota` (HTTP 200 OK).
  - Creación y despacho de solicitud de transferencia entre Rent Cars.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Módulo de Red de Aliados 100% operativo y conectado en `http://localhost:5173/red`.

### [2026-08-22] - Portal Público de Reservas Online para Clientes & Automatización WhatsApp
- **Problema/Necesidad:** Permitir que los clientes y turistas reserven vehículos online desde un catálogo web con cálculo automático de tarifas y extras, e integrar envíos de contratos y comprobantes de pago por WhatsApp en 1 clic.
- **Decisión técnica:**
  - `ReservasPublicasPage.tsx`: Catálogo público accesible en `/reservar` con cotizador de fechas, selector de coberturas y extras (Seguro Cero Deducible, Silla para bebé, Conductor Adicional), registro de cliente y generación de reserva.
  - `ContratosPage.tsx` & `PagosPage.tsx`: Botones **`💬 WhatsApp`** integrados para enviar los resúmenes de contratos y recibos oficiales directamente al chat de WhatsApp del cliente.
- **Archivos afectados:** `frontend/src/pages/Publico/ReservasPublicasPage.tsx`, `frontend/src/pages/Contratos/ContratosPage.tsx`, `frontend/src/pages/Pagos/PagosPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`.
- **Pruebas realizadas:**
  - Emisión de reserva de prueba desde el catálogo web en vivo.
  - Verificación de enlaces formateados de WhatsApp (`https://wa.me/`).
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS ahora cuenta con canal directo de captación de clientes y automatización de mensajería.

### [2026-08-22] - Diagrama Visual Interactivo de Inspección de Daños 360° (Car Damage Map)
- **Problema/Necesidad:** Proporcionar un método gráfico preciso para registrar rayones, abolladuras, roturas de cristales o daños en llantas al momento de recibir o entregar un auto, evitando disputas con los clientes.
- **Decisión técnica:**
  - Ampliación del modelo `DefectoVehiculo` en Prisma con campos `coordX`, `coordY`, `tipoDano` y `severidad`.
  - `EntregasPage.tsx`: Silueta interactiva del automóvil con colocación de pines numéricos en tiempo real al hacer clic en cualquier zona de la carrocería (Frente, Laterales, Techo, Trasera), clasificación por severidad y visualizador de ficha técnica.
  - `entregas.routes.ts`: Transacción atómica que guarda los defectos del mapa, finaliza el contrato y actualiza el odómetro liberando el vehículo a `DISPONIBLE`.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/entregas.routes.ts`, `frontend/src/pages/Entregas/EntregasPage.tsx`.
- **Pruebas realizadas:**
  - Sincronización Prisma (`prisma db push`).
  - Prueba del canvas interactivo de inspección con colocación y eliminación de pines de daño.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Módulo de Entregas e Inspección 100% enriquecido con mapa interactivo de carrocería.

### [2026-08-22] - Monitor de Seguros, Marbetes Legales & Alertas Tempranas a Telegram
- **Problema/Necesidad:** Prevenir que vehículos salgan a la calle con la póliza de seguro, marbete o inspección técnica vencida, y permitir auditorías automáticas enviadas a Telegram.
- **Decisión técnica:**
  - Ampliación de `Vehiculo` en Prisma con `seguroPoliza`, `seguroVencimiento`, `marbeteVencimiento`, `inspeccionVencimiento`.
  - `vehiculos.routes.ts`: Endpoint `GET /api/vehiculos/vencimientos` con semáforo inteligente (🔴 Vencido, 🟡 Por Vencer &lt;30d, 🟢 Al día) y `POST /api/vehiculos/notificar-vencimientos-telegram`.
  - `VehiculosPage.tsx`: Modal **"🛡️ Monitor Seguros & Marbetes"** con métricas en semáforo, badges de póliza por auto y botón de auditoría en vivo a Telegram.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/vehiculos.routes.ts`, `frontend/src/pages/Vehiculos/VehiculosPage.tsx`.
- **Pruebas realizadas:**
  - Sincronización Prisma (`prisma db push`).
  - Consulta del monitor de vencimientos (HTTP 200 OK).
  - Envío de alerta con 3 notificaciones detectadas exitosamente a Telegram.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS cuenta con auditoría y protección legal preventiva de flota.

### [2026-08-22] - Alertas de Mantenimiento Preventivo por Odómetro/Fecha & Canal Telegram Multi-Empresa
- **Problema/Necesidad:** Calcular automáticamente cuándo un vehículo necesita cambio de aceite, frenos o servicio técnico según su odómetro acumulado (+5,000 km) o fecha límite (+90 días), y permitir que cada cliente/Rent Car configure su propio canal de Telegram para recibir sus alertas privadas.
- **Decisión técnica:**
  - Ampliación de `Mantenimiento` y `Vehiculo` en Prisma con `proximoMantenimientoKm`, `proximoMantenimientoFecha` y `proximaFechaServicio`.
  - Ampliación de `RentCar` con `telegramChatId` para aislar el envío de alertas por empresa.
  - `mantenimiento.routes.ts`: Endpoints `GET /api/mantenimientos/alertas` y `POST /api/mantenimientos/notificar-telegram` con cálculo dinámico de kilometraje restante y sobregiro.
  - `MantenimientoPage.tsx`: Modal **"🚨 Monitor Preventivo de Cambio de Aceite & Taller"** con semáforo inteligente (🔴 Sobregirados, 🟡 Próximos &lt;800 km, 🟢 Al día) y botón de notificación a Telegram.
  - `ConfiguracionPage.tsx`: Panel **"🔔 Notificaciones & Canal de Alertas (Telegram)"** con campo `telegramChatId` configurable por empresa.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/mantenimiento.routes.ts`, `backend/src/routes/rentcars.routes.ts`, `frontend/src/pages/Mantenimiento/MantenimientoPage.tsx`, `frontend/src/pages/Configuracion/ConfiguracionPage.tsx`.
- **Pruebas realizadas:**
  - Sincronización Prisma (`prisma db push`).
  - Consulta de alertas de mantenimiento y cálculo automático de odómetro (HTTP 200 OK).
  - Configuración y persistencia de Telegram Chat ID por empresa.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS cuenta con sistema predictivo de mantenimiento preventivo y alertas aisladas por tenant.

### [2026-08-22] - Autenticación JWT, Portal de Login & Selector de Empresa para SuperAdmin
- **Problema/Necesidad:** Proveer una experiencia de inicio de sesión segura (`/login`) que distinga entre SuperAdministrador Global (control de todas las sucursales), Administradores de Rent a Car (restringidos a su negocio) y Empleados, con protección de rutas y selector dinámico de tenant.
- **Decisión técnica:**
  - `auth.routes.ts`: Emisión y validación de tokens JWT (7 días), hashing con bcrypt y endpoint `GET /api/auth/cuentas-demo` con tarjetas de acceso rápido por rol.
  - `AuthContext.tsx`: Gestión global de estado de autenticación, token en `localStorage` y selector de tenant activo para SuperAdmin.
  - `LoginPage.tsx`: Pantalla de login moderna con diseño dual y tarjetas interactivas de prueba para cada perfil (`SUPERADMIN`, `ADMIN_RENTCAR`, `EMPLEADO`).
  - `Header.tsx`: Avatar dinámico con badge de rol, switcher de sucursal en tiempo real para SuperAdmin y botón de cierre de sesión (`🚪 Salir`).
  - `App.tsx`: Enrutador protegido mediante `<RutaProtegida />` que redirige a `/login` a usuarios no autenticados.
- **Archivos afectados:** `backend/src/routes/auth.routes.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/pages/Auth/LoginPage.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/App.tsx`.
- **Pruebas realizadas:**
  - Login exitoso de SuperAdmin (`superadmin@rentos.do`) y Administrador (`admin@rentos.local`) vía API y formulario.
  - Switcher de sucursales verificado en el Header.
  - Redirección automática de rutas protegidas hacia `/login`.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS cuenta con ciclo de autenticación y control de acceso RBAC completo.

### [2026-08-22] - Solicitud de Registro de Rent Cars & Aprobación Requerida por SuperAdmin
- **Problema/Necesidad:** Exigir que cualquier nueva empresa de Rent a Car solicite autorización previa al SuperAdmin antes de activar su cuenta y entrar al sistema SaaS, enviando una alerta instantánea a Telegram.
- **Decisión técnica:**
  - Ampliación del modelo `RentCar` en Prisma con `contactoNombre` y `estadoRegistro` (`PENDIENTE`, `APROBADO`, `RECHAZADO`).
  - `solicitudes.routes.ts`: Endpoint público `POST /api/solicitudes/registro` que crea el RentCar y el usuario administrador en estado inactivo (`activo: false`) y despacha una alerta detallada a Telegram; y endpoints `POST /api/solicitudes/:id/aprobar` y `POST /api/solicitudes/:id/rechazar`.
  - `RegistroRentCarPage.tsx`: Formulario de onboarding público en `/registro` con confirmación visual.
  - `UsuariosPage.tsx`: Banner interactivo **"🚨 Solicitudes de Nuevos Rent a Cars Pendientes de tu Autorización"** exclusivo para el SuperAdmin con botones de aprobación y rechazo en 1 clic.
- **Archivos afectados:** `prisma/schema.prisma`, `backend/src/routes/solicitudes.routes.ts`, `backend/src/index.ts`, `frontend/src/pages/Auth/RegistroRentCarPage.tsx`, `frontend/src/pages/Auth/LoginPage.tsx`, `frontend/src/pages/Usuarios/UsuariosPage.tsx`, `frontend/src/services/api.ts`, `frontend/src/App.tsx`.
- **Pruebas realizadas:**
  - Sincronización Prisma (`prisma db push`).
  - Envío de solicitud de registro de prueba para *"Caribe Rent Car La Romana"*.
  - Despacho automático de alerta de autorización al bot de Telegram.
  - Aprobación y activación de cuenta por el SuperAdmin vía API.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** RentOS cuenta con un flujo seguro de onboarding y control total de altas de empresas para el SuperAdministrador.

### [2026-08-22] - Funcionalidades de "Recordar Contraseña", "Ver Contraseña" & Recuperación
- **Problema/Necesidad:** Facilitar la experiencia de inicio de sesión permitiendo a los usuarios ver u ocultar su contraseña con un botón de ojo interactivo, recordar sus credenciales en su navegador y solicitar restablecimiento si la olvidan.
- **Decisión técnica:**
  - `LoginPage.tsx`: Checkbox **"Recordar contraseña"** con persistencia en `localStorage`, toggle interactivo **"👁️ Ver contraseña / 🙈 Ocultar"** integrado en el input, y modal de recuperación con enlace directo a WhatsApp del SuperAdmin.
  - `RegistroRentCarPage.tsx` & `UsuariosPage.tsx`: Toggles de visualización de contraseña añadidos a los formularios de registro y creación/edición de empleados.
- **Archivos afectados:** `frontend/src/pages/Auth/LoginPage.tsx`, `frontend/src/pages/Auth/RegistroRentCarPage.tsx`, `frontend/src/pages/Usuarios/UsuariosPage.tsx`.
- **Pruebas realizadas:**
  - Verificación del cambio de tipo de input (`password` &lt;-&gt; `text`) con iconos dinámicos.
  - Persistencia de credenciales con checkbox activado.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Interfaz de acceso optimizada con usabilidad moderna.

### [2026-08-22] - Persistencia Permanente de Sesión & Autovalidación en Segundo Plano
- **Problema/Necesidad:** Evitar que los administradores y usuarios tengan que volver a iniciar sesión cada vez que recargan la página o abren una nueva pestaña en el navegador.
- **Decisión técnica:**
  - `AuthContext.tsx`: Almacenamiento seguro y persistente de tokens JWT y datos de sesión en `localStorage` con autovalidación de perfil (`GET /api/auth/perfil`) en segundo plano sin interrumpir la navegación. La sesión se mantiene activa indefinidamente hasta que el usuario pulse explícitamente **`🚪 Salir`**.
- **Archivos afectados:** `frontend/src/context/AuthContext.tsx`.
- **Pruebas realizadas:**
  - Recarga forzada de página y navegación directa a `/dashboard` verificando que la sesión permanezca activa.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Experiencia de usuario fluida sin cierres inesperados de sesión.

### [2026-08-22] - Teléfonos por Código de Área & Panel de Solicitudes de Rent Cars para SuperAdmin
- **Problema/Necesidad:** Permitir el ingreso estandarizado de números telefónicos por código de área y país (🇩🇴 Rep. Dominicana +1, 🇺🇸 USA +1, 🇨🇦 Canadá +1, 🇪🇸 España +34, 🇲🇽 México +52, 🇨🇴 Colombia +57, etc.), y habilitar un centro de control exclusivo (`/solicitudes`) para que el SuperAdmin revise y autorice las solicitudes de nuevos Rent a Cars.
- **Decisión técnica:**
  - `PhoneInput.tsx`: Componente modular de entrada telefónica con banderas, códigos de país y autoseparación para garantizar compatibilidad con enlaces globales de WhatsApp.
  - `SolicitudesPage.tsx`: Vista dedicada `/solicitudes` con buscador, filtro por estado (Pendiente, Aprobada, Rechazada), métricas y acciones de autorización en 1 clic.
  - `Sidebar.tsx`: Enlace dinámico **`👑 Solicitudes de Rent Cars`** visible para el rol SuperAdmin.
  - Actualización de `ClientesPage.tsx`, `RegistroRentCarPage.tsx` y `ReservasPublicasPage.tsx` con el nuevo `PhoneInput`.
- **Archivos afectados:** `frontend/src/components/PhoneInput.tsx`, `frontend/src/pages/SuperAdmin/SolicitudesPage.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/Clientes/ClientesPage.tsx`, `frontend/src/pages/Auth/RegistroRentCarPage.tsx`, `frontend/src/pages/Publico/ReservasPublicasPage.tsx`.
- **Pruebas realizadas:**
  - Creación de clientes con prefijos internacionales y verificación de formato.
  - Navegación al panel `/solicitudes` con el usuario SuperAdmin.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Captura telefónica internacional optimizada y gestión centralizada de onboarding para el SuperAdministrador.

### [2026-08-22] - Eliminación Segura de Empresas Rent a Car en Cascada
- **Problema/Necesidad:** Permitir al SuperAdministrador eliminar permanentemente una empresa de Rent a Car (suspendida, rechazada o de prueba), limpiando de forma transaccional todos sus vehículos, contratos, mantenimientos, pagos y usuarios vinculados, protegiendo la empresa matriz (ID #1).
- **Decisión técnica:**
  - `rentcars.routes.ts`: Endpoint `DELETE /api/rentcars/:id` con transacción en cascada (`prisma.$transaction`) que borra ordenadamente defectos, evidencias, entregas, pagos, contratos, mantenimientos, coordenadas GPS, vehículos, usuarios y la empresa.
  - `SolicitudesPage.tsx`: Botón **`🗑️ Eliminar`** con diálogo de confirmación de seguridad irreversible.
- **Archivos afectados:** `backend/src/routes/rentcars.routes.ts`, `frontend/src/pages/SuperAdmin/SolicitudesPage.tsx`.
- **Pruebas realizadas:**
  - Eliminación exitosa de empresa de prueba (HTTP 200 OK).
  - Bloqueo de seguridad verificado para la empresa matriz ID #1.
  - Compilación limpia de TypeScript (0 errores).
- **Resultado:** Control y limpieza total del parque multi-tenant de empresas para el SuperAdministrador.
























