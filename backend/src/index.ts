/**
 * ============================================================================
 * RentOS Enterprise SaaS - Servidor Principal Backend (Entry Point)
 * ============================================================================
 * Este archivo inicializa el servidor Express, configura los middlewares globales
 * de seguridad y parseo de peticiones (CORS, límites de payload para fotos Canvas),
 * y enlaza todas las rutas de la API REST del sistema multi-tenant.
 */

import cors from "cors";
import express from "express";

// Importación de módulos de rutas del sistema
import authRoutes from "./routes/auth.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import contratosRoutes from "./routes/contratos.routes.js";
import creditoRoutes from "./routes/credito.routes.js";
import entregasRoutes from "./routes/entregas.routes.js";
import gpsRoutes from "./routes/gps.routes.js";
import healthRoutes from "./routes/health.routes.js";
import mantenimientoRoutes from "./routes/mantenimiento.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import redRoutes from "./routes/red.routes.js";
import rentcarsRoutes from "./routes/rentcars.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import usersRoutes from "./routes/users.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";

// Instancia de la aplicación Express
const app = express();

// Puerto de escucha del servidor
const PORT = 3000;

// ----------------------------------------------------------------------------
// Middlewares Globales
// ----------------------------------------------------------------------------
// Permite peticiones de orígenes cruzados (Frontend en Vite / Portales externos)
app.use(cors());

// Parseo de cuerpos JSON con límite ampliado de 50mb para recibir fotos de evidencias y diagramas 360°
app.use(express.json({ limit: "50mb" }));

// Parseo de formularios URL-encoded
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ----------------------------------------------------------------------------
// Registro de Rutas de la API REST
// ----------------------------------------------------------------------------
// Autenticación de usuarios, login, JWT y cuentas demo
app.use("/api/auth", authRoutes);

// Centro de copias de seguridad globales (.sql) y respaldos aislados por empresa (JSON)
app.use("/api/backups", backupRoutes);

// Directorio y gestión de clientes / arrendatarios
app.use("/api/clientes", clientesRoutes);

// Emisión, consulta, firma digital y extensión de contratos de renta
app.use("/api/contratos", contratosRoutes);

// Consultas de buró de crédito e historial de clientes
app.use("/api/credito", creditoRoutes);

// Inspecciones 360° de carrocería, fotos de daños y liquidación de depósitos (Check-in / Check-out)
app.use("/api/entregas", entregasRoutes);

// Rastreo satelital GPS en tiempo real y comando de corte de motor remoto
app.use("/api/gps", gpsRoutes);

// Monitoreo de estado de salud del servidor y conectividad con la base de datos
app.use("/api/health", healthRoutes);

// Control de mantenimientos preventivos, servicios de taller y alertas de odómetro
app.use("/api/mantenimientos", mantenimientoRoutes);

// Facturación, recibos con NCF y cierre de caja financiero
app.use("/api/pagos", pagosRoutes);

// Red de alianzas inter-empresas y transferencias de vehículos entre Rent a Cars
app.use("/api/red", redRoutes);

// Configuración de marca blanca (White-Label), logotipo, eslogan y datos de empresas RentCar
app.use("/api/rentcars", rentcarsRoutes);

// Panel SuperAdmin para aprobar o rechazar nuevas empresas solicitantes
app.use("/api/solicitudes", solicitudesRoutes);

// Gestión de empleados, roles y accesos de cada empresa
app.use("/api/users", usersRoutes);

// Inventario de vehículos, tarifas y auditoría de pólizas de seguro, marbetes y revistas
app.use("/api/vehiculos", vehiculosRoutes);

// ----------------------------------------------------------------------------
// Arranque del Servidor HTTP
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`RentOS ejecutándose en http://localhost:${PORT}`);
});