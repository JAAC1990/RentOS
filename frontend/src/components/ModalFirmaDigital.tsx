/**
 * ============================================================================
 * RentOS - Modal de Captura de Firma Digital Táctil (ModalFirmaDigital)
 * ============================================================================
 * Permite al arrendatario o inspector firmar directamente sobre la pantalla
 * táctil de un celular, tablet o laptop usando un lienzo Canvas interactivo.
 * La firma se exporta en formato Base64 para incrustarse en el contrato PDF/impreso.
 */

import { useRef, useState, useEffect } from "react";

type ModalFirmaDigitalProps = {
  titulo: string;
  subtitulo?: string;
  firmaExistente?: string | null;
  onGuardar: (firmaBase64: string) => void;
  onCerrar: () => void;
};

export default function ModalFirmaDigital({
  titulo,
  subtitulo = "Firme dentro del recuadro usando su dedo, lápiz óptico o cursor.",
  firmaExistente,
  onGuardar,
  onCerrar,
}: ModalFirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazos, setTieneTrazos] = useState(Boolean(firmaExistente));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configuración del trazo de firma
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Si ya existía firma previa, cargarla
    if (firmaExistente) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = firmaExistente;
    }
  }, [firmaExistente]);

  // Funciones para dibujo con mouse y touch (pantalla táctil)
  const obtenerCoordenadas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const iniciarDibujo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = obtenerCoordenadas(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDibujando(true);
    setTieneTrazos(true);
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = obtenerCoordenadas(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finalizarDibujo = () => {
    setDibujando(false);
  };

  const limpiarLienzo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazos(false);
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas || !tieneTrazos) return;
    const dataUrl = canvas.toDataURL("image/png");
    onGuardar(dataUrl);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--surface, #ffffff)",
          borderRadius: "16px",
          maxWidth: "520px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
          color: "var(--text, #1e293b)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>✍️ {titulo}</h3>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--text-secondary, #64748b)",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-secondary, #64748b)" }}>
          {subtitulo}
        </p>

        {/* Lienzo de Firma Digital */}
        <div
          style={{
            border: "2px dashed #94a3b8",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
            touchAction: "none", // Evita scroll en pantallas táctiles mientras se firma
          }}
        >
          <canvas
            ref={canvasRef}
            width={460}
            height={200}
            style={{ width: "100%", height: "200px", cursor: "crosshair" }}
            onMouseDown={iniciarDibujo}
            onMouseMove={dibujar}
            onMouseUp={finalizarDibujo}
            onMouseLeave={finalizarDibujo}
            onTouchStart={iniciarDibujo}
            onTouchMove={dibujar}
            onTouchEnd={finalizarDibujo}
          />
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "20px",
              right: "20px",
              borderBottom: "1px solid #cbd5e1",
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
              Línea de Firma
            </span>
          </div>
        </div>

        {/* Botonera de Control */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={limpiarLienzo}
            style={{
              background: "none",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            🗑️ Limpiar Lienzo
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px" }}
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-button"
              style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}
              disabled={!tieneTrazos}
              onClick={guardarFirma}
            >
              💾 Estampar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
