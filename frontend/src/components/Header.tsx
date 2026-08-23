import { useEffect, useState } from "react";
import { API_URLS } from "../services/api";

type RentCar = {
  id: number;
  nombre: string;
  ciudad: string;
};

function Header() {
  const [rentCar, setRentCar] = useState<RentCar | null>(null);

  useEffect(() => {
    // Cargar la información del Rent Car actual (ID: 1 por defecto)
    fetch(`${API_URLS.backup.replace("/backup", "/rentcars")}/1`)
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

      <div className="topbar-user">
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