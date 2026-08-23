import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URLS } from "../services/api";

type RentCar = {
  id: number;
  nombre: string;
  ciudad: string;
};

type AlertaNotificacion = {
  id: string;
  tipo: "mantenimiento" | "seguro" | "solicitud";
  titulo: string;
  detalle: string;
  link: string;
  urgencia: "alta" | "media";
};

function Header() {
  const { usuario, logout, tenantActivoId, cambiarTenantSuperadmin } = useAuth();
  const [rentCar, setRentCar] = useState<RentCar | null>(null);
  const [listaRentCars, setListaRentCars] = useState<RentCar[]>([]);

  // Notificaciones
  const [notificaciones, setNotificaciones] = useState<AlertaNotificacion[]>([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Cargar alertas en segundo plano para la campana de notificaciones
  useEffect(() => {
    const cargarAlertas = async () => {
      const lista: AlertaNotificacion[] = [];

      try {
        // 1. Alertas de Mantenimiento
        const resMant = await fetch(`${API_URLS.mantenimientos}/alertas`);
        if (resMant.ok) {
          const dataMant = await resMant.json();
          if (dataMant.sobregirados?.length > 0) {
            dataMant.sobregirados.slice(0, 3).forEach((v: { id: number; marca: string; modelo: string; placa: string; kmExceso: number }) => {
              lista.push({
                id: `mant-sob-${v.id}`,
                tipo: "mantenimiento",
                titulo: `🚨 Taller Urgente: ${v.marca} ${v.modelo} (${v.placa})`,
                detalle: `Sobregirado por +${v.kmExceso} km del cambio de aceite.`,
                link: "/mantenimiento",
                urgencia: "alta",
              });
            });
          }
          if (dataMant.proximos?.length > 0) {
            dataMant.proximos.slice(0, 2).forEach((v: { id: number; marca: string; modelo: string; placa: string; kmRestantes: number }) => {
              lista.push({
                id: `mant-prox-${v.id}`,
                tipo: "mantenimiento",
                titulo: `🛠️ Próximo Servicio: ${v.marca} ${v.modelo}`,
                detalle: `Quedan ${v.kmRestantes} km para mantenimiento preventivo.`,
                link: "/mantenimiento",
                urgencia: "media",
              });
            });
          }
        }

        // 2. Alertas de Vencimiento de Seguros / Marbetes
        const resVenc = await fetch(`${API_URLS.vehiculos}/vencimientos`);
        if (resVenc.ok) {
          const dataVenc = await resVenc.json();
          if (dataVenc.vencidos?.length > 0) {
            dataVenc.vencidos.slice(0, 2).forEach((v: { id: number; marca: string; modelo: string; seguroVencimiento: string }) => {
              lista.push({
                id: `seg-venc-${v.id}`,
                tipo: "seguro",
                titulo: `🛡️ Seguro Vencido: ${v.marca} ${v.modelo}`,
                detalle: `Póliza vencida el ${new Date(v.seguroVencimiento).toLocaleDateString("es-DO")}.`,
                link: "/vehiculos",
                urgencia: "alta",
              });
            });
          }
        }

        // 3. Alertas de Solicitudes de Rent Cars (Para SuperAdmin)
        if (usuario?.rol === "SUPERADMIN") {
          const resSol = await fetch(API_URLS.solicitudes || "http://localhost:3000/api/solicitudes");
          if (resSol.ok) {
            const dataSol = await resSol.json();
            const pendientes = dataSol.filter((s: { estadoRegistro: string; activo: boolean }) => s.estadoRegistro === "PENDIENTE" || !s.activo);
            if (pendientes.length > 0) {
              lista.unshift({
                id: "sol-pendientes",
                tipo: "solicitud",
                titulo: `👑 ${pendientes.length} Nuevas Solicitudes de Rent Cars`,
                detalle: "Hay empresas esperando tu aprobación para entrar al sistema.",
                link: "/solicitudes",
                urgencia: "alta",
              });
            }
          }
        }

        setNotificaciones(lista);
      } catch (err) {
        console.warn("Error cargando notificaciones:", err);
      }
    };

    cargarAlertas();
    const interval = setInterval(cargarAlertas, 60000); // Refresco cada 60s
    return () => clearInterval(interval);
  }, [usuario]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setMostrarNotificaciones(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Campana de Notificaciones Inteligentes */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
            title="Centro de Alertas & Notificaciones"
            style={{
              position: "relative",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "15px",
              cursor: "pointer",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔔
            {notificaciones.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 900,
                  borderRadius: "10px",
                  padding: "1px 5px",
                  lineHeight: "1",
                }}
              >
                {notificaciones.length}
              </span>
            )}
          </button>

          {/* Menú Desplegable de Notificaciones */}
          {mostrarNotificaciones && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "38px",
                width: "320px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                zIndex: 9999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--primary-soft)",
                }}
              >
                <strong style={{ fontSize: "13px" }}>🔔 Notificaciones del Sistema</strong>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {notificaciones.length} activas
                </span>
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notificaciones.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                    ✨ Todo está al día. No hay alertas pendientes.
                  </div>
                ) : (
                  notificaciones.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link}
                      onClick={() => setMostrarNotificaciones(false)}
                      style={{
                        display: "block",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border)",
                        textDecoration: "none",
                        color: "var(--text)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-soft)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "2px" }}>
                        {n.titulo}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        {n.detalle}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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