import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    path: "/vehiculos",
    label: "Vehículos",
    icon: "🚗",
  },
  {
    path: "/calendario",
    label: "Calendario de Flota",
    icon: "📅",
  },
  {
    path: "/clientes",
    label: "Clientes",
    icon: "👥",
  },
  {
    path: "/contratos",
    label: "Contratos",
    icon: "📄",
  },
  {
    path: "/entregas",
    label: "Entregas",
    icon: "🔑",
  },
  {
    path: "/pagos",
    label: "Pagos",
    icon: "💳",
  },
  {
    path: "/mantenimiento",
    label: "Mantenimiento",
    icon: "🛠️",
  },
  {
    path: "/gps",
    label: "GPS Satelital",
    icon: "🛰️",
  },
  {
    path: "/usuarios",
    label: "Equipo y Usuarios",
    icon: "👤",
  },
  {
    path: "/red",
    label: "Red de Aliados",
    icon: "🌐",
  },
  {
    path: "/configuracion",
    label: "Configuración",
    icon: "⚙️",
  },
];

function Sidebar() {
  const { usuario } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">R</div>

        <div>
          <div className="brand-name">RentOS</div>
          <div className="brand-subtitle">
            Rent Operating System
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {usuario?.rol === "SUPERADMIN" && (
          <>
            <div className="nav-section-title" style={{ color: "#a855f7" }}>SUPERADMIN</div>
            <NavLink
              to="/solicitudes"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              style={{ color: "#c084fc" }}
            >
              <span className="nav-icon">👑</span>
              <span>Solicitudes de Rent Cars</span>
            </NavLink>
          </>
        )}

        <div className="nav-section-title">GESTIÓN</div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-section-title" style={{ marginTop: "16px" }}>PORTAL CLIENTES</div>
        <a
          href="/reservar"
          target="_blank"
          rel="noreferrer"
          className="nav-item"
          style={{ color: "#38bdf8" }}
        >
          <span className="nav-icon">🌐</span>
          <span>Catálogo Web Online ↗</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot" />
          <span>Sistema operativo</span>
        </div>

        <div className="sidebar-version">
          RentOS v1.0
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;