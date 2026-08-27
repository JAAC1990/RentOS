/**
 * ============================================================================
 * RentOS - Componente de Entrada Telefónica Internacional (PhoneInput)
 * ============================================================================
 * Proporciona un selector visual de prefijos de país con banderas (RD 🇩🇴, USA 🇺🇸,
 * España 🇪🇸, etc.) y campo de número con formateo y validación estricta de dígitos:
 * - Para Rep. Dom. (+1): límite estricto de 10 dígitos (ej. 809-555-0123).
 * - Máscara visual con guiones automáticos según el estándar del país.
 * - Validación para impedir registrar teléfonos incompletos o con exceso de números.
 */

import { useEffect, useState } from "react";

export interface ReglaPais {
  codigo: string;       // Identificador único (ej: "+1", "+1-US", "+34")
  prefijoReal: string;  // Código de llamada internacional (ej: "+1", "+34")
  pais: string;         // Nombre del país
  bandera: string;      // Emoji de bandera
  placeholder: string;  // Placeholder visual
  minDigitos: number;   // Cantidad mínima de dígitos requeridos
  maxDigitos: number;   // Cantidad máxima de dígitos permitidos
  formatear: (digitos: string) => string;
}

export const PAISES_PREFIJOS: ReglaPais[] = [
  {
    codigo: "+1",
    prefijoReal: "+1",
    pais: "República Dominicana",
    bandera: "🇩🇴",
    placeholder: "809-555-0123",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      // Formato: 809-555-0123 (10 dígitos exactos)
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+1-US",
    prefijoReal: "+1",
    pais: "Estados Unidos",
    bandera: "🇺🇸",
    placeholder: "305-555-0123",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+1-CA",
    prefijoReal: "+1",
    pais: "Canadá",
    bandera: "🇨🇦",
    placeholder: "416-555-0123",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+1-PR",
    prefijoReal: "+1",
    pais: "Puerto Rico",
    bandera: "🇵🇷",
    placeholder: "787-555-0123",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+34",
    prefijoReal: "+34",
    pais: "España",
    bandera: "🇪🇸",
    placeholder: "612 34 56 78",
    minDigitos: 9,
    maxDigitos: 9,
    formatear: (d) => {
      // Formato: 612 34 56 78 (9 dígitos)
      if (d.length <= 3) return d;
      if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
      if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    },
  },
  {
    codigo: "+52",
    prefijoReal: "+52",
    pais: "México",
    bandera: "🇲🇽",
    placeholder: "55 1234 5678",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+57",
    prefijoReal: "+57",
    pais: "Colombia",
    bandera: "🇨🇴",
    placeholder: "300 123 4567",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+507",
    prefijoReal: "+507",
    pais: "Panamá",
    bandera: "🇵🇦",
    placeholder: "6123-4567",
    minDigitos: 8,
    maxDigitos: 8,
    formatear: (d) => {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)}-${d.slice(4, 8)}`;
    },
  },
  {
    codigo: "+58",
    prefijoReal: "+58",
    pais: "Venezuela",
    bandera: "🇻🇪",
    placeholder: "412 123 4567",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+33",
    prefijoReal: "+33",
    pais: "Francia",
    bandera: "🇫🇷",
    placeholder: "6 12 34 56 78",
    minDigitos: 9,
    maxDigitos: 9,
    formatear: (d) => {
      if (d.length <= 1) return d;
      if (d.length <= 3) return `${d.slice(0, 1)} ${d.slice(1)}`;
      if (d.length <= 5) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3)}`;
      if (d.length <= 7) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    },
  },
  {
    codigo: "+39",
    prefijoReal: "+39",
    pais: "Italia",
    bandera: "🇮🇹",
    placeholder: "312 345 6789",
    minDigitos: 10,
    maxDigitos: 10,
    formatear: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
  },
  {
    codigo: "+49",
    prefijoReal: "+49",
    pais: "Alemania",
    bandera: "🇩🇪",
    placeholder: "151 23456789",
    minDigitos: 10,
    maxDigitos: 11,
    formatear: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${d.slice(3, 11)}`;
    },
  },
];

/**
 * Validador estricto de teléfono según país y código de área
 */
export function validarTelefono(telefono: string): { valido: boolean; mensajeError?: string } {
  if (!telefono || !telefono.trim()) {
    return { valido: false, mensajeError: "El teléfono es obligatorio." };
  }

  const limpio = telefono.trim();

  // Buscar coincidencia de prefijo
  const pais = PAISES_PREFIJOS.find((p) => limpio.startsWith(p.prefijoReal)) || PAISES_PREFIJOS[0];
  const soloNumero = limpio.replace(pais.prefijoReal, "").trim();
  const digitos = soloNumero.replace(/\D/g, "");

  if (digitos.length < pais.minDigitos) {
    if (pais.minDigitos === pais.maxDigitos) {
      return {
        valido: false,
        mensajeError: `El teléfono para ${pais.pais} debe tener exactamente ${pais.maxDigitos} dígitos (actualmente tiene ${digitos.length}). Ejemplo: ${pais.placeholder}`,
      };
    }
    return {
      valido: false,
      mensajeError: `El teléfono para ${pais.pais} debe tener al menos ${pais.minDigitos} dígitos (actualmente tiene ${digitos.length}).`,
    };
  }

  if (digitos.length > pais.maxDigitos) {
    return {
      valido: false,
      mensajeError: `El teléfono para ${pais.pais} no puede tener más de ${pais.maxDigitos} dígitos sin contar guiones (actualmente tiene ${digitos.length}).`,
    };
  }

  // Validación de código de área para República Dominicana (+1)
  if (pais.codigo === "+1" && digitos.length === 10) {
    const areaCode = digitos.slice(0, 3);
    const validosRD = ["809", "829", "849"];
    if (!validosRD.includes(areaCode)) {
      return {
        valido: false,
        mensajeError: `El código de área "${areaCode}" no es válido para República Dominicana. Debe iniciar con 809, 829 o 849.`,
      };
    }
  }

  return { valido: true };
}

type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (valorCompleto: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

export default function PhoneInput({
  id = "telefono",
  value,
  onChange,
  required = false,
  placeholder,
  disabled = false,
}: PhoneInputProps) {
  const [prefijo, setPrefijo] = useState<string>("+1");
  const [numeroDisplay, setNumeroDisplay] = useState<string>("");

  const reglaActual = PAISES_PREFIJOS.find((p) => p.codigo === prefijo) || PAISES_PREFIJOS[0];

  // Separar prefijo y número formateado al recibir nuevo valor externo
  useEffect(() => {
    if (!value) {
      setNumeroDisplay("");
      return;
    }

    const valorTrim = value.trim();
    // Encontrar si coincide con un prefijo registrado
    const matchPais = PAISES_PREFIJOS.find((p) => valorTrim.startsWith(p.prefijoReal));

    if (matchPais) {
      setPrefijo(matchPais.codigo);
      const sinPrefijo = valorTrim.slice(matchPais.prefijoReal.length).trim();
      const digitos = sinPrefijo.replace(/\D/g, "").slice(0, matchPais.maxDigitos);
      setNumeroDisplay(matchPais.formatear(digitos));
    } else {
      const digitos = valorTrim.replace(/\D/g, "").slice(0, reglaActual.maxDigitos);
      setNumeroDisplay(reglaActual.formatear(digitos));
    }
  }, [value]);

  const handlePrefijoChange = (nuevoCodigo: string) => {
    setPrefijo(nuevoCodigo);
    const nuevaRegla = PAISES_PREFIJOS.find((p) => p.codigo === nuevoCodigo) || PAISES_PREFIJOS[0];
    
    // Truncar si los dígitos existentes exceden el nuevo maxDigitos
    const digitosActuales = numeroDisplay.replace(/\D/g, "").slice(0, nuevaRegla.maxDigitos);
    const formateado = nuevaRegla.formatear(digitosActuales);
    setNumeroDisplay(formateado);

    const valorFinal = formateado.trim() ? `${nuevaRegla.prefijoReal} ${formateado.trim()}` : "";
    onChange(valorFinal);
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Extraer solo números
    const soloDigitos = e.target.value.replace(/\D/g, "");
    
    // 2. Limitar estrictamente a la cantidad máxima de dígitos permitida según el país
    const digitosTruncados = soloDigitos.slice(0, reglaActual.maxDigitos);

    // 3. Aplicar máscara del país (ej. 809-555-0123)
    const formateado = reglaActual.formatear(digitosTruncados);
    setNumeroDisplay(formateado);

    // 4. Emitir con prefijo
    const valorFinal = formateado.trim() ? `${reglaActual.prefijoReal} ${formateado.trim()}` : "";
    onChange(valorFinal);
  };

  const placeholderActual = placeholder || reglaActual.placeholder;
  const digitosActuales = numeroDisplay.replace(/\D/g, "").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      <div style={{ display: "flex", gap: "6px", width: "100%" }}>
        <select
          value={prefijo}
          onChange={(e) => handlePrefijoChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "135px",
            padding: "8px 6px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {PAISES_PREFIJOS.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.bandera} {p.prefijoReal} ({p.pais.length > 12 ? p.pais.slice(0, 11) + "…" : p.pais})
            </option>
          ))}
        </select>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder={placeholderActual}
          value={numeroDisplay}
          onChange={handleNumeroChange}
          required={required}
          disabled={disabled}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: "13px",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.5px",
          }}
        />
      </div>

      {/* Indicador sutil de conteo de dígitos */}
      {digitosActuales > 0 && (
        <div style={{ fontSize: "11px", color: digitosActuales === reglaActual.maxDigitos ? "var(--success)" : "var(--text-secondary)", display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
          <span>{reglaActual.pais} ({reglaActual.prefijoReal})</span>
          <span>
            {digitosActuales} / {reglaActual.maxDigitos} dígitos {digitosActuales === reglaActual.maxDigitos ? "✓" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
