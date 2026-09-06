/**
 * ============================================================================
 * RentOS - Plantilla Maestra de la Aplicación (MainLayout)
 * ============================================================================
 * Estructura visual de los módulos autenticados:
 * - Sidebar lateral izquierda con menús y accesos directos.
 * - Header superior con campana de notificaciones, tenant switch y perfil.
 * - Contenedor principal dinámico (Outlet) donde se renderizan las páginas.
 */

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { esImpersonado, usuario, volverASuperadmin } = useAuth();
  const [anuncio, setAnuncio] = useState<{
    activo: boolean;
    mensaje: string;
    tipo: string;
    nombrePlataforma?: string;
  } | null>(null);
  const [anuncioOculto, setAnuncioOculto] = useState(false);

  useEffect(() => {
    const consultarAnuncio = async () => {
      try {
        const res = await fetch("/api/superadmin/configuracion/anuncio");
        if (res.ok) {
          const data = await res.json();
          if (data && data.activo && data.mensaje) {
            setAnuncio(data);
          } else {
            setAnuncio(null);
          }
        }
      } catch {
        // silente
      }
    };
    consultarAnuncio();
    const interval = setInterval(consultarAnuncio, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      {/* Fondo oscuro traslúcido en móviles cuando el menú lateral está abierto */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Barra de Navegación Lateral (Drawer en móviles / Fijo en escritorio) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        {/* Barra Informativa de Modo Impersonación (Control SuperAdmin) */}
        {esImpersonado && (
          <div
            style={{
              backgroundColor: "#7c2d12",
              color: "#ffedd5",
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>👁️</span>
              <span>
                Acceso SuperAdmin activo: Estás navegando como <strong>{usuario?.nombre}</strong> ({usuario?.rol === "ADMIN_RENTCAR" ? "Administrador de RentCar" : "Empleado"} • <code>{usuario?.email}</code>).
              </span>
            </div>
            <button
              type="button"
              onClick={volverASuperadmin}
              style={{
                backgroundColor: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>←</span> Regresar a SuperAdmin (rentosrd@gmail.com)
            </button>
          </div>
        )}

        {/* Barra Superior con botón Hamburguesa en móviles */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Megáfono / Anuncio Global Broadcast de SuperAdmin para Toda la Red */}
        {anuncio && !anuncioOculto && (
          <div
            style={{
              backgroundColor:
                anuncio.tipo === "DANGER"
                  ? "#991b1b"
                  : anuncio.tipo === "WARNING"
                  ? "#92400e"
                  : anuncio.tipo === "SUCCESS"
                  ? "#166534"
                  : "#0369a1",
              color: "#ffffff",
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              zIndex: 90,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>
                {anuncio.tipo === "DANGER"
                  ? "🚨"
                  : anuncio.tipo === "WARNING"
                  ? "⚠️"
                  : anuncio.tipo === "SUCCESS"
                  ? "🎉"
                  : "📢"}
              </span>
              <span>
                <strong>{anuncio.nombrePlataforma || "RentOS Global"}:</strong> {anuncio.mensaje}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAnuncioOculto(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "4px",
                color: "#ffffff",
                cursor: "pointer",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
              }}
              title="Ocultar para esta sesión"
            >
              ✕ Cerrar
            </button>
          </div>
        )}

        {/* Área de Contenido Principal Dinámico */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;