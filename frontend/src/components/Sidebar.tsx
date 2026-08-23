import { NavLink } from "react-router-dom";

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
];

function Sidebar() {
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