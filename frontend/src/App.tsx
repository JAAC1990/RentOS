import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import VehiculosPage from "./pages/Vehiculos/VehiculosPage";
import ClientesPage from "./pages/Clientes/ClientesPage";
import ContratosPage from "./pages/Contratos/ContratosPage";
import EntregasPage from "./pages/Entregas/EntregasPage";
import PagosPage from "./pages/Pagos/PagosPage";
import MantenimientoPage from "./pages/Mantenimiento/MantenimientoPage";
import GpsPage from "./pages/Gps/GpsPage";
import UsuariosPage from "./pages/Usuarios/UsuariosPage";
import ConfiguracionPage from "./pages/Configuracion/ConfiguracionPage";
import RedAliadaPage from "./pages/RedAliada/RedAliadaPage";
import ReservasPublicasPage from "./pages/Publico/ReservasPublicasPage";
import SolicitudesPage from "./pages/SuperAdmin/SolicitudesPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegistroRentCarPage from "./pages/Auth/RegistroRentCarPage";
import "./App.css";

function RutaProtegida() {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroRentCarPage />} />
      {/* Catálogo Público de Reservas para Clientes */}
      <Route path="/reservar" element={<ReservasPublicasPage />} />

      {/* Rutas Administrativas Protegidas */}
      <Route element={<RutaProtegida />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/vehiculos" element={<VehiculosPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/contratos" element={<ContratosPage />} />
        <Route path="/entregas" element={<EntregasPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/mantenimiento" element={<MantenimientoPage />} />
        <Route path="/gps" element={<GpsPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/red" element={<RedAliadaPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;