/**
 * ============================================================================
 * RentOS - Plantilla Maestra de la Aplicación (MainLayout)
 * ============================================================================
 * Estructura visual de los módulos autenticados:
 * - Sidebar lateral izquierda con menús y accesos directos.
 * - Header superior con campana de notificaciones, tenant switch y perfil.
 * - Contenedor principal dinámico (Outlet) donde se renderizan las páginas.
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { esImpersonado, usuario, volverASuperadmin } = useAuth();

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

        {/* Área de Contenido Principal Dinámico */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;