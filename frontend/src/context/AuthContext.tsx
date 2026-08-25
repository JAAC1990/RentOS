/**
 * ============================================================================
 * RentOS - Contexto Global de Autenticación y Control Multi-Tenant
 * ============================================================================
 * Maneja el estado global del usuario logueado, roles (SUPERADMIN, ADMIN_RENTCAR,
 * EMPLEADO), tokens JWT en sessionStorage para garantizar inicio de sesión en
 * cada arranque y cambio dinámico de tenant activo para el SuperAdministrador.
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de Autenticación:
 * Almacena el usuario y el token exclusivamente en sessionStorage para exigir
 * login cada vez que el usuario inicia la aplicación o abre una nueva ventana.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    // Limpiar restos antiguos de localStorage para forzar inicio de sesión limpio
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

  // Mantener sincronizado en sessionStorage durante la sesión activa
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

  // Verificar y refrescar la sesión en segundo plano al iniciar
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
        console.warn("Error al verificar perfil de sesión:", err);
      }
    };

    verificarSesion();
  }, []);

  /**
   * Realiza la petición de login al backend y almacena credenciales activas.
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
   * Cierra la sesión activa y purga cualquier dato de autenticación.
   */
  const logout = () => {
    setUsuario(null);
    setToken(null);
    sessionStorage.removeItem("rentos_auth_user");
    sessionStorage.removeItem("rentos_auth_token");
    sessionStorage.removeItem("rentos_active_tenant");
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
