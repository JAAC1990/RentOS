import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    sistema: "RentOS",
    estado: "activo",
    mensaje: "La API de RentOS está funcionando correctamente"
  });
});

export default router;