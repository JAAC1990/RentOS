import { useEffect, useState } from "react";
import { API_URLS } from "../services/api";

type RentCar = {
  id: number;
  nombre: string;
  ciudad: string;
};

function Header() {
  const [rentCar, setRentCar] = useState<RentCar | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("rentos_theme");
    return saved === "dark";
  });

  useEffect(() => {
    // Aplicar tema en el elemento raíz
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("rentos_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("rentos_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    // Cargar la información del Rent Car actual (ID: 1 por defecto)
    fetch(`${API_URLS.rentcars}/1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRentCar(data);
      })
      .catch(() => null);
  }, []);

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">
          {rentCar ? rentCar.nombre : "RentOS"}
        </div>

        <div className="topbar-subtitle">
          {rentCar
            ? `Plataforma SaaS • ${rentCar.ciudad}`
            : "Sistema de gestión para Rent Cars"}
        </div>
      </div>

      <div className="topbar-user" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
            fontSize: "14px",
            cursor: "pointer",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {darkMode ? "☀️ Claro" : "🌙 Oscuro"}
        </button>

        {rentCar && (
          <div className="tenant-badge">
            <span>🏢</span>
            <span>{rentCar.nombre}</span>
          </div>
        )}

        <div className="user-avatar">A</div>

        <div className="user-info">
          <strong>Administrador</strong>
          <span>Admin de Flota</span>
        </div>
      </div>
    </header>
  );
}

export default Header;