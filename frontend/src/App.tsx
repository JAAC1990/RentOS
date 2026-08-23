import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import VehiculosPage from "./pages/Vehiculos/VehiculosPage";
import ClientrePage from "./pages/Clientes/ClientrePage";
import ContratosPage from "./pages/Contratos/ContratosPage";
import EntregasPage from "./pages/Entregas/EntregasPage";
import PagosPage from "./pages/Pagos/PagosPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
          <Route path="/clientes" element={<ClientrePage />} />
          <Route path="/contratos" element={<ContratosPage />} />
          <Route path="/entregas" element={<EntregasPage />} />
          <Route path="/pagos" element={<PagosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;