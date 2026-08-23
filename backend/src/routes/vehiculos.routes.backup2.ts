import { Router } from "express";
import { EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

function convertirEstado(estado: unknown): EstadoVehiculo | null {
  if (typeof estado !== "string") {
    return null;
  }

  const valor = estado.toUpperCase();

  if (valor in EstadoVehiculo) {
    return EstadoVehiculo[valor as keyof typeof EstadoVehiculo];
  }

  return null;
}

router.get("/", async (_req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(vehiculos);
  } catch (error) {
    console.error("Error al obtener veh�culos:", error);

    res.status(500).json({
      error: "No fue posible obtener los veh�culos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del veh�culo no es v�lido.",
      });
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        id,
      },
    });

    if (!vehiculo) {
      return res.status(404).json({
        error: "Veh�culo no encontrado.",
      });
    }

    res.json(vehiculo);
  } catch (error) {
    console.error("Error al obtener veh�culo:", error);

    res.status(500).json({
      error: "No fue posible obtener el veh�culo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      marca,
      modelo,
      anio,
      color,
      placa,
      vin,
      kilometraje,
      tarifaDiaria,
      estado,
    } = req.body;

    if (
      !marca ||
      !modelo ||
      anio === undefined ||
      !placa ||
      tarifaDiaria === undefined
    ) {
      return res.status(400).json({
        error:
          "Marca, modelo, a�o, placa y tarifa diaria son obligatorios.",
      });
    }

    const anioNumero = Number(anio);

    const kilometrajeNumero =
      kilometraje === undefined ? 0 : Number(kilometraje);

    const tarifaNumero = Number(tarifaDiaria);

    if (!Number.isInteger(anioNumero)) {
      return res.status(400).json({
        error: "El a�o del veh�culo no es v�lido.",
      });
    }

    if (!Number.isInteger(kilometrajeNumero) || kilometrajeNumero < 0) {
      return res.status(400).json({
        error: "El kilometraje no es v�lido.",
      });
    }

    if (!Number.isFinite(tarifaNumero) || tarifaNumero < 0) {
      return res.status(400).json({
        error: "La tarifa diaria no es v�lida.",
      });
    }

    let estadoVehiculo: EstadoVehiculo = EstadoVehiculo.DISPONIBLE;

    if (estado !== undefined) {
      const estadoConvertido = convertirEstado(estado);

      if (!estadoConvertido) {
        return res.status(400).json({
          error: "El estado del veh�culo no es v�lido.",
        });
      }

      estadoVehiculo = estadoConvertido;
    }

    const vehiculo = await prisma.vehiculo.create({
      data: {
        marca: String(marca).trim(),
        modelo: String(modelo).trim(),
        anio: anioNumero,
        color: color ? String(color).trim() : undefined,
        placa: String(placa).trim().toUpperCase(),
        vin: vin ? String(vin).trim().toUpperCase() : undefined,
        kilometraje: kilometrajeNumero,
        tarifaDiaria: tarifaNumero,
        estado: estadoVehiculo,
      },
    });

    res.status(201).json(vehiculo);
  } catch (error) {
    console.error("Error al crear veh�culo:", error);

    res.status(500).json({
      error: "No fue posible crear el veh�culo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del veh�culo no es v�lido.",
      });
    }

    const existente = await prisma.vehiculo.findUnique({
      where: {
        id,
      },
    });

    if (!existente) {
      return res.status(404).json({
        error: "Veh�culo no encontrado.",
      });
    }

    const {
      marca,
      modelo,
      anio,
      color,
      placa,
      vin,
      kilometraje,
      tarifaDiaria,
      estado,
    } = req.body;

    const data: {
      marca?: string;
      modelo?: string;
      anio?: number;
      color?: string | null;
      placa?: string;
      vin?: string | null;
      kilometraje?: number;
      tarifaDiaria?: number;
      estado?: EstadoVehiculo;
    } = {};

    if (marca !== undefined) {
      data.marca = String(marca).trim();
    }

    if (modelo !== undefined) {
      data.modelo = String(modelo).trim();
    }

    if (anio !== undefined) {
      const valor = Number(anio);

      if (!Number.isInteger(valor)) {
        return res.status(400).json({
          error: "El a�o del veh�culo no es v�lido.",
        });
      }

      data.anio = valor;
    }

    if (color !== undefined) {
      data.color = color ? String(color).trim() : null;
    }

    if (placa !== undefined) {
      data.placa = String(placa).trim().toUpperCase();
    }

    if (vin !== undefined) {
      data.vin = vin ? String(vin).trim().toUpperCase() : null;
    }

    if (kilometraje !== undefined) {
      const valor = Number(kilometraje);

      if (!Number.isInteger(valor) || valor < 0) {
        return res.status(400).json({
          error: "El kilometraje no es v�lido.",
        });
      }

      if (valor < existente.kilometraje) {
        return res.status(400).json({
          error:
            "El nuevo kilometraje no puede ser menor que el kilometraje actual.",
        });
      }

      data.kilometraje = valor;
    }

    if (tarifaDiaria !== undefined) {
      const valor = Number(tarifaDiaria);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error: "La tarifa diaria no es v�lida.",
        });
      }

      data.tarifaDiaria = valor;
    }

    if (estado !== undefined) {
      const estadoConvertido = convertirEstado(estado);

      if (!estadoConvertido) {
        return res.status(400).json({
          error: "El estado del veh�culo no es v�lido.",
        });
      }

      data.estado = estadoConvertido;
    }

    const vehiculo = await prisma.vehiculo.update({
      where: {
        id,
      },
      data,
    });

    res.json(vehiculo);
  } catch (error) {
    console.error("Error al actualizar veh�culo:", error);

    res.status(500).json({
      error: "No fue posible actualizar el veh�culo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

router.patch("/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del veh�culo no es v�lido.",
      });
    }

    if (estado === undefined || estado === null || estado === "") {
      return res.status(400).json({
        error: "El estado es obligatorio.",
      });
    }

    const estadoConvertido = convertirEstado(estado);

    if (!estadoConvertido) {
      return res.status(400).json({
        error: "El estado del veh�culo no es v�lido.",
      });
    }

    const existente = await prisma.vehiculo.findUnique({
      where: {
        id,
      },
    });

    if (!existente) {
      return res.status(404).json({
        error: "Veh�culo no encontrado.",
      });
    }

    const vehiculo = await prisma.vehiculo.update({
      where: {
        id,
      },
      data: {
        estado: estadoConvertido,
      },
    });

    res.json(vehiculo);
  } catch (error) {
    console.error("Error al cambiar estado del veh�culo:", error);

    res.status(500).json({
      error: "No fue posible cambiar el estado del veh�culo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

router.patch("/:id/kilometraje", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { kilometraje } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del veh�culo no es v�lido.",
      });
    }

    const kilometrajeNumero = Number(kilometraje);

    if (
      !Number.isInteger(kilometrajeNumero) ||
      kilometrajeNumero < 0
    ) {
      return res.status(400).json({
        error: "El kilometraje no es v�lido.",
      });
    }

    const existente = await prisma.vehiculo.findUnique({
      where: {
        id,
      },
    });

    if (!existente) {
      return res.status(404).json({
        error: "Veh�culo no encontrado.",
      });
    }

    if (kilometrajeNumero < existente.kilometraje) {
      return res.status(400).json({
        error:
          "El nuevo kilometraje no puede ser menor que el kilometraje actual.",
      });
    }

    const vehiculo = await prisma.vehiculo.update({
      where: {
        id,
      },
      data: {
        kilometraje: kilometrajeNumero,
      },
    });

    res.json(vehiculo);
  } catch (error) {
    console.error("Error al actualizar kilometraje:", error);

    res.status(500).json({
      error: "No fue posible actualizar el kilometraje.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;