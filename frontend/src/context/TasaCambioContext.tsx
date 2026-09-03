/**
 * ============================================================================
 * RentOS - Contexto Global de Tasa de Cambio Oficial (BCRD)
 * ============================================================================
 * Provee en tiempo real la cotización oficial del Dólar (USD) frente al
 * Peso Dominicano (DOP) según el Banco Central de la República Dominicana:
 * - Carga automática al iniciar la app.
 * - Sincronización transparente con MonedaInput, contratos, facturas y P&L.
 * - Función de refresco y modo manual para administradores.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_URLS } from "../services/api";

export type InfoTasaCambio = {
  monedaBase: string;
  monedaDestino: string;
  tasa: number;
  tasaCompra: number;
  tasaVenta: number;
  fuente: string;
  fechaActualizacion: string;
  esDinamica: boolean;
  modoManual?: boolean;
};

interface TasaCambioContextType {
  tasaCambio: number;
  tasaCompra: number;
  tasaVenta: number;
  fuente: string;
  fechaActualizacion: string;
  esDinamica: boolean;
  cargandoTasa: boolean;
  refrescarTasa: (forzar?: boolean) => Promise<void>;
  fijarTasaManual: (nuevaTasa: number, motivo?: string) => Promise<void>;
  restaurarModoDinamico: () => Promise<void>;
}

const TasaCambioContext = createContext<TasaCambioContextType>({
  tasaCambio: 60.0,
  tasaCompra: 59.8,
  tasaVenta: 60.25,
  fuente: "Banco Central de la República Dominicana (BCRD)",
  fechaActualizacion: new Date().toISOString(),
  esDinamica: true,
  cargandoTasa: false,
  refrescarTasa: async () => {},
  fijarTasaManual: async () => {},
  restaurarModoDinamico: async () => {},
});

export function TasaCambioProvider({ children }: { children: React.ReactNode }) {
  const [infoTasa, setInfoTasa] = useState<InfoTasaCambio>({
    monedaBase: "USD",
    monedaDestino: "DOP",
    tasa: 60.0,
    tasaCompra: 59.8,
    tasaVenta: 60.25,
    fuente: "Banco Central de la República Dominicana (BCRD)",
    fechaActualizacion: new Date().toISOString(),
    esDinamica: true,
    modoManual: false,
  });
  const [cargandoTasa, setCargandoTasa] = useState(true);

  const cargarTasa = useCallback(async (forzar = false) => {
    try {
      setCargandoTasa(true);
      const url = forzar ? `${API_URLS.tasaCambio}?forzar=true` : API_URLS.tasaCambio;
      const res = await fetch(url);
      if (res.ok) {
        const data: InfoTasaCambio = await res.json();
        if (data && typeof data.tasa === "number" && data.tasa > 0) {
          setInfoTasa(data);
        }
      }
    } catch (err) {
      console.warn("No fue posible cargar la tasa dinámica de cambio del BCRD:", err);
    } finally {
      setCargandoTasa(false);
    }
  }, []);

  useEffect(() => {
    cargarTasa();
  }, [cargarTasa]);

  const fijarTasaManual = async (nuevaTasa: number, motivo?: string) => {
    try {
      const res = await fetch(`${API_URLS.tasaCambio}/fijar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasa: nuevaTasa, motivo }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasa) {
          setInfoTasa(data.tasa);
        }
      }
    } catch (err) {
      console.error("Error al fijar tasa manual:", err);
    }
  };

  const restaurarModoDinamico = async () => {
    try {
      const res = await fetch(`${API_URLS.tasaCambio}/restaurar`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasa) {
          setInfoTasa(data.tasa);
        }
      }
    } catch (err) {
      console.error("Error al restaurar tasa dinámica:", err);
    }
  };

  return (
    <TasaCambioContext.Provider
      value={{
        tasaCambio: infoTasa.tasa,
        tasaCompra: infoTasa.tasaCompra,
        tasaVenta: infoTasa.tasaVenta,
        fuente: infoTasa.fuente,
        fechaActualizacion: infoTasa.fechaActualizacion,
        esDinamica: infoTasa.esDinamica,
        cargandoTasa,
        refrescarTasa: cargarTasa,
        fijarTasaManual,
        restaurarModoDinamico,
      }}
    >
      {children}
    </TasaCambioContext.Provider>
  );
}

export function useTasaCambio() {
  return useContext(TasaCambioContext);
}
