import cors from "cors";
import express from "express";
import backupRoutes from "./routes/backup.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import contratosRoutes from "./routes/contratos.routes.js";
import entregasRoutes from "./routes/entregas.routes.js";
import healthRoutes from "./routes/health.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import rentcarsRoutes from "./routes/rentcars.routes.js";
import usersRoutes from "./routes/users.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/backups", backupRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/contratos", contratosRoutes);
app.use("/api/entregas", entregasRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/rentcars", rentcarsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vehiculos", vehiculosRoutes);

app.listen(PORT, () => {
  console.log(`RentOS ejecutándose en http://localhost:${PORT}`);
});