/**
 * ============================================================================
 * RentOS - Enrutador Principal y Protección de Rutas (Frontend)
 * ============================================================================
 * Define la estructura de navegación de React Router: rutas públicas (/login,
 * /registro, /reservar) y rutas administrativas protegidas por sesión dentro
 * del diseño maestro MainLayout.
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TasaCambioProvider } from "./context/TasaCambioContext";
import MainLayout from "./layouts/MainLayout";

// Importación de Páginas Operativas
import DashboardPage from "./pages/Dashboard/DashboardPage";
import VehiculosPage from "./pages/Vehiculos/VehiculosPage";
import CalendarioFlotaPage from "./pages/Calendario/CalendarioFlotaPage";
import ClientesPage from "./pages/Clientes/ClientesPage";
import ContratosPage from "./pages/Contratos/ContratosPage";
import EntregasPage from "./pages/Entregas/EntregasPage";
import PagosPage from "./pages/Pagos/PagosPage";
import ContabilidadPage from "./pages/Contabilidad/ContabilidadPage";
import MantenimientoPage from "./pages/Mantenimiento/MantenimientoPage";
import GpsPage from "./pages/Gps/GpsPage";
import UsuariosPage from "./pages/Usuarios/UsuariosPage";
import ConfiguracionPage from "./pages/Configuracion/ConfiguracionPage";
import RedAliadaPage from "./pages/RedAliada/RedAliadaPage";
import ReservasPublicasPage from "./pages/Publico/ReservasPublicasPage";
import PortalEmpresaPage from "./pages/Publico/PortalEmpresaPage";
import SolicitudesPage from "./pages/SuperAdmin/SolicitudesPage";
import BackupsSuperAdminPage from "./pages/SuperAdmin/BackupsSuperAdminPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegistroRentCarPage from "./pages/Auth/RegistroRentCarPage";
import VerificarContratoPage from "./pages/Publico/VerificarContratoPage";
import "./App.css";

/**
 * Componente Guardián de Rutas Protegidas:
 * Si no existe una sesión activa de usuario, redirige automáticamente a /login.
 * Si el usuario está autenticado, renderiza el MainLayout con barra lateral y cabecera.
 */
function RutaProtegida() {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
}

/**
 * Mapeo de Rutas de la Aplicación
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Redirección inicial obligatoria al Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroRentCarPage />} />

      {/* Catálogo Público de Reservas para Arrendatarios y Turistas */}
      <Route path="/reservar" element={<ReservasPublicasPage />} />

      {/* Páginas Web Independientes e Interactivas por Empresa Rent a Car */}
      <Route path="/portal/:slug" element={<PortalEmpresaPage />} />
      <Route path="/empresa/:slug" element={<PortalEmpresaPage />} />

      {/* Portal Público de Verificación de Autenticidad de Contrato QR */}
      <Route path="/verificar/:codigo" element={<VerificarContratoPage />} />

      {/* Módulos Administrativos Protegidos por Autenticación */}
      <Route element={<RutaProtegida />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/backups" element={<BackupsSuperAdminPage />} />
        <Route path="/vehiculos" element={<VehiculosPage />} />
        <Route path="/calendario" element={<CalendarioFlotaPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/contratos" element={<ContratosPage />} />
        <Route path="/entregas" element={<EntregasPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/contabilidad" element={<ContabilidadPage />} />
        <Route path="/mantenimiento" element={<MantenimientoPage />} />
        <Route path="/gps" element={<GpsPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/red" element={<RedAliadaPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
      </Route>
    </Routes>
  );
}

/**
 * Punto de Entrada de la Aplicación con Proveedores Globales de Autenticación y Tasa BCRD
 */
function App() {
  return (
    <AuthProvider>
      <TasaCambioProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TasaCambioProvider>
    </AuthProvider>
  );
}

export default App;