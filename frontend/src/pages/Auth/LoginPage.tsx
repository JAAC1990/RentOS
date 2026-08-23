import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";

type CuentaDemo = {
  rol: string;
  etiqueta: string;
  email: string;
  password: string;
  descripcion: string;
};

export default function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [iniciando, setIniciando] = useState(false);
  const [cuentasDemo, setCuentasDemo] = useState<CuentaDemo[]>([]);

  useEffect(() => {
    if (usuario) {
      navigate("/");
    }
  }, [usuario, navigate]);

  useEffect(() => {
    const cargarCuentasDemo = async () => {
      try {
        const res = await fetch(`${API_URLS.auth}/cuentas-demo`);
        if (res.ok) {
          const data = await res.json();
          setCuentasDemo(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    cargarCuentasDemo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setIniciando(true);
      setError("");
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setIniciando(false);
    }
  };

  const usarCuentaDemo = async (cuenta: CuentaDemo) => {
    setEmail(cuenta.email);
    setPassword(cuenta.password);
    try {
      setIniciando(true);
      setError("");
      await login(cuenta.email, cuenta.password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error con cuenta demo.");
    } finally {
      setIniciando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "880px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          backgroundColor: "var(--surface)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Lado Izquierdo: Formulario de Inicio de Sesión */}
        <div style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "var(--primary)",
                color: "white",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "20px",
              }}
            >
              R
            </div>
            <div>
              <h1 style={{ fontSize: "20px", margin: 0, fontWeight: 800 }}>RentOS</h1>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Rent Operating System • Acceso Seguro
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: "18px", margin: "0 0 6px 0" }}>Iniciar Sesión</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
            Ingresa tus credenciales para acceder a tu panel de control.
          </p>

          {error && <div className="alert-box error" style={{ marginBottom: "16px" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field" style={{ marginBottom: "14px" }}>
              <label htmlFor="loginEmail">Correo Electrónico *</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="admin@rentos.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field" style={{ marginBottom: "20px" }}>
              <label htmlFor="loginPass">Contraseña *</label>
              <input
                id="loginPass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700 }}
              disabled={iniciando}
            >
              {iniciando ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>

          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
            <Link
              to="/registro"
              style={{ fontSize: "13px", color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}
            >
              🚀 ¿Eres dueño de un Rent a Car? Solicita tu cuenta aquí ↗
            </Link>

            <a
              href="/reservar"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none" }}
            >
              🌐 Ver Catálogo Público de Reservas ↗
            </a>
          </div>
        </div>

        {/* Lado Derecho: Selector Rápido de Roles (SuperAdmin vs RentCars) */}
        <div
          style={{
            backgroundColor: "var(--primary-soft)",
            borderLeft: "1px solid var(--border)",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h3 style={{ fontSize: "15px", margin: "0 0 4px 0", color: "var(--primary)" }}>
            ⚡ Acceso Rápido por Rol
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
            Haz clic en un perfil para ingresar automáticamente con sus permisos:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {cuentasDemo.map((c) => (
              <div
                key={c.email}
                onClick={() => usarCuentaDemo(c)}
                style={{
                  backgroundColor: "var(--surface)",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <strong style={{ fontSize: "13px" }}>{c.etiqueta}</strong>
                  <span
                    className={`badge ${
                      c.rol === "SUPERADMIN"
                        ? "badge-alquilado"
                        : c.rol === "ADMIN_RENTCAR"
                        ? "badge-disponible"
                        : "badge-mantenimiento"
                    }`}
                    style={{ fontSize: "10px" }}
                  >
                    {c.rol}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{c.descripcion}</div>
                <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", fontWeight: 600 }}>
                  {c.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
