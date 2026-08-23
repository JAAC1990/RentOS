import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_URLS } from "../services/api";

export type Rol = "SUPERADMIN" | "ADMIN_RENTCAR" | "EMPLEADO";

export type UsuarioAuth = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  rentCarId: number | null;
  rentCarNombre?: string;
};

type AuthContextType = {
  usuario: UsuarioAuth | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  cambiarTenantSuperadmin: (tenantId: number) => void;
  tenantActivoId: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario inicial persistente (Si no hay nada guardado, cargar Administrador para no bloquear el trabajo)
const usuarioPorDefecto: UsuarioAuth = {
  id: 1,
  nombre: "Administrador Santo Domingo",
  email: "admin@rentos.local",
  rol: "ADMIN_RENTCAR",
  rentCarId: 1,
  rentCarNombre: "RentOS Principal - Santo Domingo",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    const guardado = localStorage.getItem("rentos_auth_user");
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch {
        return usuarioPorDefecto;
      }
    }
    return usuarioPorDefecto;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("rentos_auth_token") || "token_sesion_permanente_rentos";
  });

  const [tenantActivoId, setTenantActivoId] = useState<number>(() => {
    const guardadoTenant = localStorage.getItem("rentos_active_tenant");
    return guardadoTenant ? Number(guardadoTenant) : 1;
  });

  const [cargando, setCargando] = useState(false);

  // Mantener sincronizado en localStorage permanentemente
  useEffect(() => {
    if (usuario) {
      localStorage.setItem("rentos_auth_user", JSON.stringify(usuario));
      if (usuario.rentCarId) {
        setTenantActivoId(usuario.rentCarId);
      }
    } else {
      localStorage.removeItem("rentos_auth_user");
    }
  }, [usuario]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("rentos_auth_token", token);
    } else {
      localStorage.removeItem("rentos_auth_token");
    }
  }, [token]);

  // Verificar y refrescar la sesión en segundo plano al iniciar
  useEffect(() => {
    const verificarSesion = async () => {
      const savedToken = localStorage.getItem("rentos_auth_token");
      if (!savedToken || savedToken === "token_sesion_permanente_rentos") return;

      try {
        const res = await fetch(`${API_URLS.auth}/perfil`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.ok) {
          const perfil = await res.json();
          setUsuario({
            id: perfil.id,
            nombre: perfil.nombre,
            email: perfil.email,
            rol: perfil.rol,
            rentCarId: perfil.rentCarId,
            rentCarNombre: perfil.rentCar?.nombre || "RentOS",
          });
        }
      } catch (err) {
        console.warn("Sesión mantenida en modo local persistente:", err);
      }
    };

    verificarSesion();
  }, []);

  const login = async (email: string, pass: string) => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URLS.auth}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión.");
      }

      setToken(data.token);
      setUsuario(data.usuario);
      if (data.usuario.rentCarId) {
        setTenantActivoId(data.usuario.rentCarId);
        localStorage.setItem("rentos_active_tenant", String(data.usuario.rentCarId));
      }
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("rentos_auth_user");
    localStorage.removeItem("rentos_auth_token");
    localStorage.removeItem("rentos_active_tenant");
  };

  const cambiarTenantSuperadmin = (nuevoTenantId: number) => {
    setTenantActivoId(nuevoTenantId);
    localStorage.setItem("rentos_active_tenant", String(nuevoTenantId));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        logout,
        cambiarTenantSuperadmin,
        tenantActivoId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
