/**
 * ============================================================================
 * RentOS - Plantilla Maestra de la Aplicación (MainLayout)
 * ============================================================================
 * Estructura visual de los módulos autenticados:
 * - Sidebar lateral izquierda con menús y accesos directos.
 * - Header superior con campana de notificaciones, tenant switch y perfil.
 * - Contenedor principal dinámico (Outlet) donde se renderizan las páginas.
 */

import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function MainLayout() {
  return (
    <div className="app-shell">
      {/* Barra de Navegación Lateral */}
      <Sidebar />

      <div className="app-main">
        {/* Barra Superior con Notificaciones y Perfil */}
        <Header />

        {/* Área de Contenido Principal Dinámico */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;