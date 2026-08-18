import express from "express";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    mensaje: "RentOS iniciado correctamente",
    estado: "activo"
  });
});

app.listen(PORT, () => {
  console.log(`RentOS ejecutándose en http://localhost:${PORT}`);
});