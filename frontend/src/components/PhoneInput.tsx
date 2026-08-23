import { useEffect, useState } from "react";

export const PAISES_PREFIJOS = [
  { codigo: "+1", pais: "República Dominicana", bandera: "🇩🇴", placeholder: "809-555-0123" },
  { codigo: "+1-US", pais: "Estados Unidos", bandera: "🇺🇸", placeholder: "305-555-0123" },
  { codigo: "+1-CA", pais: "Canadá", bandera: "🇨🇦", placeholder: "416-555-0123" },
  { codigo: "+1-PR", pais: "Puerto Rico", bandera: "🇵🇷", placeholder: "787-555-0123" },
  { codigo: "+34", pais: "España", bandera: "🇪🇸", placeholder: "612 345 678" },
  { codigo: "+52", pais: "México", bandera: "🇲🇽", placeholder: "55 1234 5678" },
  { codigo: "+57", pais: "Colombia", bandera: "🇨🇴", placeholder: "300 123 4567" },
  { codigo: "+507", pais: "Panamá", bandera: "🇵🇦", placeholder: "6123-4567" },
  { codigo: "+58", pais: "Venezuela", bandera: "🇻🇪", placeholder: "412 123 4567" },
  { codigo: "+33", pais: "Francia", bandera: "🇫🇷", placeholder: "6 12 34 56 78" },
  { codigo: "+39", pais: "Italia", bandera: "🇮🇹", placeholder: "312 345 6789" },
  { codigo: "+49", pais: "Alemania", bandera: "🇩🇪", placeholder: "151 23456789" },
];

type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (valorCompleto: string) => void;
  required?: boolean;
  placeholder?: string;
};

export default function PhoneInput({
  id = "telefono",
  value,
  onChange,
  required = false,
  placeholder,
}: PhoneInputProps) {
  const [prefijo, setPrefijo] = useState("+1");
  const [numero, setNumero] = useState("");

  // Separar prefijo y número al cargar
  useEffect(() => {
    if (!value) {
      setNumero("");
      return;
    }

    const matchPais = PAISES_PREFIJOS.find((p) => {
      const codLimpio = p.codigo.split("-")[0];
      return value.startsWith(codLimpio);
    });

    if (matchPais) {
      const codLimpio = matchPais.codigo.split("-")[0];
      setPrefijo(matchPais.codigo);
      setNumero(value.replace(codLimpio, "").trim());
    } else {
      setNumero(value);
    }
  }, []);

  const handlePrefijoChange = (nuevoPrefijo: string) => {
    setPrefijo(nuevoPrefijo);
    const codLimpio = nuevoPrefijo.split("-")[0];
    const valorFinal = numero.trim() ? `${codLimpio} ${numero.trim()}` : "";
    onChange(valorFinal);
  };

  const handleNumeroChange = (nuevoNumero: string) => {
    setNumero(nuevoNumero);
    const codLimpio = prefijo.split("-")[0];
    const valorFinal = nuevoNumero.trim() ? `${codLimpio} ${nuevoNumero.trim()}` : "";
    onChange(valorFinal);
  };

  const placeholderActual =
    placeholder ||
    PAISES_PREFIJOS.find((p) => p.codigo === prefijo)?.placeholder ||
    "809-555-0123";

  return (
    <div style={{ display: "flex", gap: "6px", width: "100%" }}>
      <select
        value={prefijo}
        onChange={(e) => handlePrefijoChange(e.target.value)}
        style={{
          width: "120px",
          padding: "8px 6px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {PAISES_PREFIJOS.map((p) => (
          <option key={p.codigo} value={p.codigo}>
            {p.bandera} {p.codigo.split("-")[0]} ({p.pais.substring(0, 3).toUpperCase()})
          </option>
        ))}
      </select>

      <input
        id={id}
        type="tel"
        placeholder={placeholderActual}
        value={numero}
        onChange={(e) => handleNumeroChange(e.target.value)}
        required={required}
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: "13px",
        }}
      />
    </div>
  );
}
