/**
 * ============================================================================
 * RentOS - Componente de Entrada de Fecha Día/Mes/Año (FechaInput)
 * ============================================================================
 * Permite introducir fechas garantizando SIEMPRE el formato dominicano DD/MM/AAAA:
 * - Placeholder explícito "DD/MM/AAAA" (Día/Mes/Año).
 * - Máscara de tipeo automática (agrega las barras '/' automáticamente al escribir).
 * - Botón con icono de calendario 📅 para seleccionar con selector gráfico si se prefiere.
 * - Sincronización transparente con el estado del formulario en formato ISO (YYYY-MM-DD).
 */

import React, { useEffect, useRef, useState } from "react";

interface FechaInputProps {
  id?: string;
  name?: string;
  value?: string; // Formato interno: "YYYY-MM-DD" o ""
  onChange: (isoDate: string) => void;
  min?: string; // "YYYY-MM-DD"
  max?: string; // "YYYY-MM-DD"
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function FechaInput({
  id,
  name,
  value = "",
  onChange,
  min,
  max,
  placeholder = "DD/MM/AAAA",
  required = false,
  disabled = false,
  className = "",
  style = {},
}: FechaInputProps) {
  // Convertir "YYYY-MM-DD" a "DD/MM/AAAA" para la vista del usuario
  const isoADisplay = (iso: string): string => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
    const partes = iso.split("T")[0].split("-");
    if (partes.length === 3) {
      const [a, m, d] = partes;
      return `${d}/${m}/${a}`;
    }
    return "";
  };

  // Convertir "DD/MM/AAAA" a "YYYY-MM-DD" para el backend / estado
  const displayAIso = (disp: string): string => {
    const partes = disp.split("/");
    if (partes.length === 3) {
      const [d, m, a] = partes;
      if (d.length === 2 && m.length === 2 && a.length === 4) {
        const dia = parseInt(d, 10);
        const mes = parseInt(m, 10);
        const anio = parseInt(a, 10);
        if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && anio >= 1900 && anio <= 2100) {
          return `${a}-${m}-${d}`;
        }
      }
    }
    return "";
  };

  const [textoDisplay, setTextoDisplay] = useState<string>(() => isoADisplay(value));
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Sincronizar si cambia el prop value externamente
  useEffect(() => {
    setTextoDisplay(isoADisplay(value));
  }, [value]);

  // Manejar tipeo con máscara DD/MM/AAAA
  const handleChangeTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ""); // Sólo dígitos
    if (input.length > 8) input = input.slice(0, 8);

    let formateado = "";
    if (input.length > 0) {
      formateado = input.slice(0, 2);
      if (input.length >= 3) {
        formateado += "/" + input.slice(2, 4);
      }
      if (input.length >= 5) {
        formateado += "/" + input.slice(4, 8);
      }
    }

    setTextoDisplay(formateado);

    // Si completó los 10 caracteres (DD/MM/AAAA), emitir ISO
    if (formateado.length === 10) {
      const iso = displayAIso(formateado);
      if (iso) {
        onChange(iso);
      }
    } else if (formateado.length === 0) {
      onChange("");
    }
  };

  // Manejar selección desde el selector de calendario nativo
  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoIso = e.target.value;
    setTextoDisplay(isoADisplay(nuevoIso));
    onChange(nuevoIso);
  };

  const abrirCalendario = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      }
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        ...style,
      }}
    >
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={textoDisplay}
        onChange={handleChangeTexto}
        required={required}
        disabled={disabled}
        className={className}
        maxLength={10}
        style={{
          width: "100%",
          paddingRight: "38px",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.5px",
        }}
      />

      {/* Botón con Icono de Calendario */}
      <button
        type="button"
        onClick={abrirCalendario}
        disabled={disabled}
        tabIndex={-1}
        title="Abrir selector de calendario"
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "16px",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : 0.8,
        }}
      >
        📅
      </button>

      {/* Input de fecha nativo oculto para el popup de calendario */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value ? value.split("T")[0] : ""}
        min={min}
        max={max}
        onChange={handleCalendarChange}
        disabled={disabled}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
          border: "none",
          padding: 0,
          margin: 0,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
