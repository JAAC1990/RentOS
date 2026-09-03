/**
 * ============================================================================
 * RentOS - Componente de Entrada Monetaria con Conversión USD ⇄ DOP (MonedaInput)
 * ============================================================================
 * Proporciona un campo numérico con conmutador instantáneo entre Dólares (US$)
 * y Pesos Dominicanos (RD$), recalculando automáticamente según la tasa de cambio:
 * - Botones interactivos [ 💵 US$ ] y [ 🇩🇴 RD$ ].
 * - Equivalencia visual en vivo debajo del campo.
 * - Soporte para tarifas, depósitos, cobros extra, pagos y costos de taller.
 */

import React from "react";
import { useTasaCambio } from "../context/TasaCambioContext";

export const TASA_CAMBIO_DEFAULT = 60.0;

interface MonedaInputProps {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (nuevoValor: string) => void;
  moneda: "USD" | "DOP";
  onMonedaChange: (nuevaMoneda: "USD" | "DOP") => void;
  tasaCambio?: number;
  min?: number | string;
  step?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function MonedaInput({
  id,
  name,
  label,
  value,
  onChange,
  moneda,
  onMonedaChange,
  tasaCambio: tasaProp,
  min = "0",
  step = "0.01",
  placeholder,
  required = false,
  disabled = false,
  className = "",
  style = {},
}: MonedaInputProps) {
  const { tasaCambio: tasaContexto } = useTasaCambio();
  const tasaCambio = tasaProp !== undefined ? tasaProp : (tasaContexto || TASA_CAMBIO_DEFAULT);

  const alternarMoneda = (nuevaMoneda: "USD" | "DOP") => {
    if (nuevaMoneda === moneda || disabled) return;

    const valorNum = parseFloat(value);
    if (!isNaN(valorNum) && valorNum > 0) {
      if (nuevaMoneda === "DOP") {
        // USD -> DOP: multiplicar por tasa BCRD
        const convertido = (valorNum * tasaCambio).toFixed(2);
        onChange(convertido);
      } else {
        // DOP -> USD: dividir entre tasa BCRD
        const convertido = (valorNum / tasaCambio).toFixed(2);
        onChange(convertido);
      }
    }
    onMonedaChange(nuevaMoneda);
  };

  const valorNum = parseFloat(value);
  const placeholderActual =
    placeholder || (moneda === "USD" ? "50.00" : "3000.00");

  return (
    <div className={`form-field ${className}`} style={{ ...style }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <label htmlFor={id} style={{ margin: 0, fontWeight: 600 }}>
          {label} {required ? "*" : ""}{" "}
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            ({moneda === "USD" ? "Dólares US$" : "Pesos RD$"})
          </span>
        </label>

        {/* Botones Switch Moneda USD / DOP */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--background)",
            borderRadius: "6px",
            padding: "2px",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            disabled={disabled}
            style={{
              border: "none",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              backgroundColor:
                moneda === "USD" ? "var(--primary)" : "transparent",
              color: moneda === "USD" ? "#ffffff" : "var(--text)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onClick={() => alternarMoneda("USD")}
          >
            💵 US$
          </button>
          <button
            type="button"
            disabled={disabled}
            style={{
              border: "none",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              backgroundColor:
                moneda === "DOP" ? "var(--primary)" : "transparent",
              color: moneda === "DOP" ? "#ffffff" : "var(--text)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onClick={() => alternarMoneda("DOP")}
          >
            🇩🇴 RD$
          </button>
        </div>
      </div>

      <input
        id={id}
        name={name}
        type="number"
        min={min}
        step={step}
        placeholder={placeholderActual}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
        }}
      />

      {/* Equivalencia en tiempo real */}
      {!isNaN(valorNum) && valorNum > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--primary)",
            marginTop: "4px",
            fontWeight: 600,
          }}
        >
          {moneda === "USD" ? (
            <span>
              ≈ RD${" "}
              {(valorNum * tasaCambio).toLocaleString("es-DO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              DOP (Tasa BCRD: {tasaCambio.toFixed(2)})
            </span>
          ) : (
            <span>
              ≈ ${" "}
              {(valorNum / tasaCambio).toFixed(2)}{" "}
              USD (Tasa BCRD: {tasaCambio.toFixed(2)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
