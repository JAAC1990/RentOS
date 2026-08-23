import cors from "cors";
import express from "express";
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
import usersRoutes from "./routes/users.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/contratos", contratosRoutes);
app.use("/api/credito", creditoRoutes);
app.use("/api/entregas", entregasRoutes);
app.use("/api/gps", gpsRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/mantenimientos", mantenimientoRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/red", redRoutes);
app.use("/api/rentcars", rentcarsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vehiculos", vehiculosRoutes);

app.listen(PORT, () => {
  console.log(`RentOS ejecutándose en http://localhost:${PORT}`);
});