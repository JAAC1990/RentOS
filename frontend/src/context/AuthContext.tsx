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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    const guardado = localStorage.getItem("rentos_auth_user");
    return guardado ? JSON.parse(guardado) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("rentos_auth_token");
  });

  const [tenantActivoId, setTenantActivoId] = useState<number>(() => {
    const guardadoTenant = localStorage.getItem("rentos_active_tenant");
    return guardadoTenant ? Number(guardadoTenant) : 1;
  });

  const [cargando, setCargando] = useState(false);

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
