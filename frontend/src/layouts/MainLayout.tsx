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

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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