import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URLS } from "../services/api";

type RentCar = {
  id: number;
  nombre: string;
  ciudad: string;
};

function Header() {
  const { usuario, logout, tenantActivoId, cambiarTenantSuperadmin } = useAuth();
  const [rentCar, setRentCar] = useState<RentCar | null>(null);
  const [listaRentCars, setListaRentCars] = useState<RentCar[]>([]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("rentos_theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("rentos_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [darkMode]);

  // Cargar lista de RentCars (para switch de SuperAdmin)
  useEffect(() => {
    fetch(API_URLS.rentcars)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setListaRentCars(data);
        const match = data.find((r: RentCar) => r.id === tenantActivoId);
        if (match) setRentCar(match);
      })
      .catch(() => null);
  }, [tenantActivoId]);

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">
          {rentCar ? rentCar.nombre : "RentOS"}
        </div>

        <div className="topbar-subtitle">
          {usuario?.rol === "SUPERADMIN"
            ? "👑 Modo SuperAdministrador Global (Vista Multitenant)"
            : rentCar
            ? `Plataforma SaaS • ${rentCar.ciudad}`
            : "Sistema de gestión para Rent Cars"}
        </div>
      </div>

      <div className="topbar-user" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Switcher de Sucursal para SUPERADMIN */}
        {usuario?.rol === "SUPERADMIN" && listaRentCars.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
              🏢 EMPRESA:
            </span>
            <select
              value={tenantActivoId}
              onChange={(e) => cambiarTenantSuperadmin(Number(e.target.value))}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {listaRentCars.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({r.ciudad})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggle Modo Oscuro / Claro */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "6px 10px",
            fontSize: "13px",
            cursor: "pointer",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {darkMode ? "☀️ Claro" : "🌙 Oscuro"}
        </button>

        {/* Perfil del Usuario Logueado */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "6px", borderLeft: "1px solid var(--border)" }}>
          <div
            className="user-avatar"
            style={{
              backgroundColor: usuario?.rol === "SUPERADMIN" ? "#8b5cf6" : "var(--primary)",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {usuario ? usuario.nombre.charAt(0).toUpperCase() : "A"}
          </div>

          <div className="user-info">
            <strong style={{ fontSize: "13px" }}>{usuario ? usuario.nombre : "Usuario"}</strong>
            <span
              className={`badge ${
                usuario?.rol === "SUPERADMIN"
                  ? "badge-alquilado"
                  : usuario?.rol === "ADMIN_RENTCAR"
                  ? "badge-disponible"
                  : "badge-mantenimiento"
              }`}
              style={{ fontSize: "9px", padding: "1px 6px", display: "inline-block", marginTop: "2px" }}
            >
              {usuario?.rol || "ADMIN_RENTCAR"}
            </span>
          </div>

          {/* Botón Salir */}
          <button
            type="button"
            onClick={logout}
            title="Cerrar Sesión"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "14px",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            🚪 Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;