/**
 * ============================================================================
 * RentOS - Contexto Global de Autenticación, Control Multi-Tenant e Impersonación
 * ============================================================================
 * Maneja el estado global del usuario logueado, roles (SUPERADMIN, ADMIN_RENTCAR,
 * EMPLEADO), tokens JWT, cambio dinámico de tenant activo y la capacidad de que
 * el SuperAdmin (rentosrd@gmail.com) ingrese temporalmente como cualquier usuario
 * y regrese a su sesión original con un solo clic.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_URLS } from "../services/api";

// Roles del sistema
export type Rol = "SUPERADMIN" | "ADMIN_RENTCAR" | "EMPLEADO";

// Estructura del usuario autenticado
export type UsuarioAuth = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  rentCarId: number | null;
  rentCarNombre?: string;
  impersonadoPor?: {
    id: number;
    nombre: string;
    email: string;
  };
};

// Métodos y propiedades expuestas por el contexto
type AuthContextType = {
  usuario: UsuarioAuth | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  cambiarTenantSuperadmin: (tenantId: number) => void;
  tenantActivoId: number;
  impersonarUsuario: (targetUserId: number) => Promise<void>;
  volverASuperadmin: () => Promise<void>;
  esImpersonado: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    localStorage.removeItem("rentos_auth_user");
    localStorage.removeItem("rentos_auth_token");

    const guardado = sessionStorage.getItem("rentos_auth_user");
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("rentos_auth_token") || null;
  });

  const [tenantActivoId, setTenantActivoId] = useState<number>(() => {
    const guardadoTenant = sessionStorage.getItem("rentos_active_tenant") || localStorage.getItem("rentos_active_tenant");
    return guardadoTenant ? Number(guardadoTenant) : 1;
  });

  const [cargando, setCargando] = useState(false);

  // Determinar si actualmente se está navegando en modo impersonación
  const esImpersonado = Boolean(
    usuario?.impersonadoPor || sessionStorage.getItem("rentos_original_token")
  );

  useEffect(() => {
    if (usuario) {
      sessionStorage.setItem("rentos_auth_user", JSON.stringify(usuario));
      if (usuario.rentCarId) {
        setTenantActivoId(usuario.rentCarId);
      }
    } else {
      sessionStorage.removeItem("rentos_auth_user");
    }
  }, [usuario]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("rentos_auth_token", token);
    } else {
      sessionStorage.removeItem("rentos_auth_token");
    }
  }, [token]);

  useEffect(() => {
    const verificarSesion = async () => {
      const savedToken = sessionStorage.getItem("rentos_auth_token");
      if (!savedToken) return;

      try {
        const res = await fetch(`${API_URLS.auth}/perfil`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.ok) {
          const perfil = await res.json();
          setUsuario((prev) => ({
            id: perfil.id,
            nombre: perfil.nombre,
            email: perfil.email,
            rol: perfil.rol,
            rentCarId: perfil.rentCarId,
            rentCarNombre: perfil.rentCar?.nombre || (perfil.rol === "SUPERADMIN" ? "RentOS SaaS Global" : "RentOS"),
            impersonadoPor: prev?.impersonadoPor,
          }));
        }
      } catch (err) {
        console.warn("Error al verificar perfil de sesión:", err);
      }
    };

    verificarSesion();
  }, []);

  /**
   * Realiza la petición de login al backend.
   */
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
        sessionStorage.setItem("rentos_active_tenant", String(data.usuario.rentCarId));
      }
    } finally {
      setCargando(false);
    }
  };

  /**
   * Permite al SuperAdmin ingresar como cualquier usuario (Admin o Empleado).
   */
  const impersonarUsuario = async (targetUserId: number) => {
    if (!token) throw new Error("No hay sesión activa.");

    setCargando(true);
    try {
      const res = await fetch(`${API_URLS.auth}/impersonar/${targetUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No fue posible acceder como este usuario.");
      }

      // Guardar sesión original de SuperAdmin para poder regresar
      if (!sessionStorage.getItem("rentos_original_token")) {
        sessionStorage.setItem("rentos_original_token", token);
        sessionStorage.setItem("rentos_original_user", JSON.stringify(usuario));
      }

      setToken(data.token);
      setUsuario(data.usuario);
      if (data.usuario.rentCarId) {
        setTenantActivoId(data.usuario.rentCarId);
        sessionStorage.setItem("rentos_active_tenant", String(data.usuario.rentCarId));
      }
    } finally {
      setCargando(false);
    }
  };

  /**
   * Restaura la sesión original del SuperAdmin (rentosrd@gmail.com).
   */
  const volverASuperadmin = async () => {
    setCargando(true);
    try {
      const originalToken = sessionStorage.getItem("rentos_original_token");
      const originalUser = sessionStorage.getItem("rentos_original_user");

      if (originalToken && originalUser) {
        sessionStorage.removeItem("rentos_original_token");
        sessionStorage.removeItem("rentos_original_user");

        setToken(originalToken);
        setUsuario(JSON.parse(originalUser));
        setTenantActivoId(1);
        return;
      }

      // Si no estuviera en storage, solicitar token fresco al backend
      const res = await fetch(`${API_URLS.auth}/revertir-impersonacion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.removeItem("rentos_original_token");
        sessionStorage.removeItem("rentos_original_user");
        setToken(data.token);
        setUsuario(data.usuario);
        setTenantActivoId(1);
      }
    } finally {
      setCargando(false);
    }
  };

  /**
   * Cierra la sesión activa y purga datos de autenticación.
   */
  const logout = () => {
    setUsuario(null);
    setToken(null);
    sessionStorage.removeItem("rentos_auth_user");
    sessionStorage.removeItem("rentos_auth_token");
    sessionStorage.removeItem("rentos_active_tenant");
    sessionStorage.removeItem("rentos_original_token");
    sessionStorage.removeItem("rentos_original_user");
    localStorage.removeItem("rentos_auth_user");
    localStorage.removeItem("rentos_auth_token");
  };

  /**
   * Permite al SuperAdmin cambiar la vista operativa a cualquier empresa de la red.
   */
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
        impersonarUsuario,
        volverASuperadmin,
        esImpersonado,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para consumir el contexto de autenticación en componentes.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
