import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/contratos" element={<ContratosPage />} />
          <Route path="/entregas" element={<EntregasPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/mantenimiento" element={<MantenimientoPage />} />
          <Route path="/gps" element={<GpsPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;