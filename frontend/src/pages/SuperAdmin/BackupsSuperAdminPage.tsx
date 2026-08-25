/**
 * ============================================================================
 * RentOS - Centro de Respaldos y Restauración SuperAdmin (BackupsSuperAdminPage)
 * ============================================================================
 * Herramienta de alta seguridad para el SuperAdministrador:
 * - Pestaña 1: Restauración Aislada por Empresa (Exportación e importación segura de JSON sin tocar otras agencias).
 * - Pestaña 2: Respaldos Globales de Base de Datos PostgreSQL (.SQL, descarga, subida manual y restauración con confirmación 'RESTAURAR').
 */

import { useEffect, useState } from "react";
import { API_URLS } from "../../services/api";

type BackupGlobal = {
  archivo: string;
  tamaño: number;
  fecha: string;
};

type RentCar = {
  id: number;
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string;
  estadoRegistro: string;
  activo: boolean;
};

type PaqueteTenant = {
  tipo: string;
  empresa: RentCar;
  datos: {
    vehiculos: any[];
    clientes: any[];
    contratos: any[];
    mantenimientos: any[];
  };
  metricas?: {
    totalVehiculos: number;
    totalClientes: number;
    totalContratos: number;
    totalMantenimientos: number;
  };
};

export default function BackupsSuperAdminPage() {
  const [pestaña, setPestaña] = useState<"TENANT" | "GLOBAL">("TENANT");
  const [backupsGlobales, setBackupsGlobales] = useState<BackupGlobal[]>([]);
  const [empresas, setEmpresas] = useState<RentCar[]>([]);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string>("");

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Modal de confirmación para restaurar global
  const [backupARestaurar, setBackupARestaurar] = useState<string | null>(null);

  // Archivo JSON cargado para restaurar empresa
  const [paqueteCargado, setPaqueteCargado] = useState<PaqueteTenant | null>(null);
  const [nombreArchivoCargado, setNombreArchivoCargado] = useState("");

  const API_BACKUPS = `${API_URLS.vehiculos.replace("/vehiculos", "/backups")}`;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resBackups, resEmpresas] = await Promise.all([
        fetch(API_BACKUPS),
        fetch(API_URLS.rentcars),
      ]);

      if (!resBackups.ok || !resEmpresas.ok) {
        throw new Error("No fue posible cargar la información de respaldos.");
      }

      const [datosBackups, datosEmpresas] = await Promise.all([
        resBackups.json(),
        resEmpresas.json(),
      ]);

      setBackupsGlobales(datosBackups);
      setEmpresas(datosEmpresas);

      if (datosEmpresas.length > 0 && !empresaSeleccionadaId) {
        setEmpresaSeleccionadaId(String(datosEmpresas[0].id));
      }
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor de respaldos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empresaActiva = empresas.find((e) => String(e.id) === empresaSeleccionadaId);

  // 1. Exportar Respaldo de Empresa (JSON)
  const exportarRespaldoEmpresa = async () => {
    if (!empresaSeleccionadaId) return;
    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_BACKUPS}/tenant/${empresaSeleccionadaId}/export`);
      if (!res.ok) throw new Error("No se pudo generar la exportación de la empresa.");

      const paquete = await res.json();
      const jsonStr = JSON.stringify(paquete, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `respaldo_rentcar_${empresaActiva?.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMensaje(`✅ Paquete de respaldo descargado para ${empresaActiva?.nombre}.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al exportar empresa.");
    } finally {
      setProcesando(false);
    }
  };

  // 2. Leer archivo JSON seleccionado para restaurar
  const handleCargarArchivoEmpresa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivoCargado(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const contenido = JSON.parse(event.target?.result as string);
        if (!contenido.datos) {
          throw new Error("El archivo no contiene un formato de respaldo válido de RentOS.");
        }
        setPaqueteCargado(contenido);
      } catch (err) {
        setError("El archivo seleccionado no es un JSON de respaldo válido.");
        setPaqueteCargado(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Ejecutar Restauración de Empresa
  const ejecutarRestauracionEmpresa = async () => {
    if (!empresaSeleccionadaId || !paqueteCargado) return;
    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_BACKUPS}/tenant/${empresaSeleccionadaId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paquete: paqueteCargado }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al restaurar los datos de la empresa.");
      }

      const respuesta = await res.json();
      setMensaje(`✅ ¡Éxito! ${respuesta.mensaje} (${respuesta.resultado.vehiculosRestaurados} vehículos, ${respuesta.resultado.clientesRestaurados} clientes, ${respuesta.resultado.contratosRestaurados} contratos recuperados).`);
      setPaqueteCargado(null);
      setNombreArchivoCargado("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar la restauración.");
    } finally {
      setProcesando(false);
    }
  };

  // 4. Crear Backup Global
  const crearBackupGlobal = async () => {
    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const res = await fetch(API_BACKUPS, { method: "POST" });
      if (!res.ok) throw new Error("No fue posible generar el respaldo global.");

      const data = await res.json();
      setMensaje(`✅ Copia de seguridad generada con éxito: ${data.archivo}`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al crear backup.");
    } finally {
      setProcesando(false);
    }
  };

  // 5. Restaurar Backup Global
  const ejecutarRestauracionGlobal = async () => {
    if (!backupARestaurar) return;
    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_BACKUPS}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivo: backupARestaurar }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "No se pudo restaurar la base de datos.");
      }

      setMensaje(`✅ Base de datos global restaurada con éxito desde ${backupARestaurar}.`);
      setBackupARestaurar(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al restaurar base de datos.");
    } finally {
      setProcesando(false);
    }
  };

  // 6. Subir archivo SQL externo
  const handleSubirSql = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setProcesando(true);
        const contenidoSql = event.target?.result as string;

        const res = await fetch(`${API_BACKUPS}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreArchivo: file.name,
            contenidoSql,
          }),
        });

        if (!res.ok) throw new Error("No se pudo cargar el archivo SQL en el servidor.");

        const data = await res.json();
        setMensaje(`✅ Archivo ${data.archivo} subido correctamente al servidor.`);
        await cargarDatos();
      } catch (err) {
        console.error(err);
        setError("Error al subir el archivo SQL al servidor.");
      } finally {
        setProcesando(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="backups-superadmin-container">
      {/* Encabezado */}
      <div className="page-heading">
        <div>
          <h1>👑 Centro de Respaldos & Restauración (SuperAdmin)</h1>
          <p>
            Recupera y restaura datos para empresas clientes que hayan perdido su información o gestiona respaldos globales del servidor.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`secondary-button ${pestaña === "TENANT" ? "active" : ""}`}
            style={{
              backgroundColor: pestaña === "TENANT" ? "var(--primary-soft)" : "transparent",
              borderColor: pestaña === "TENANT" ? "var(--primary)" : "var(--border)",
              fontWeight: 700,
            }}
            onClick={() => setPestaña("TENANT")}
          >
            🏢 Restauración por Empresa
          </button>

          <button
            className={`secondary-button ${pestaña === "GLOBAL" ? "active" : ""}`}
            style={{
              backgroundColor: pestaña === "GLOBAL" ? "var(--primary-soft)" : "transparent",
              borderColor: pestaña === "GLOBAL" ? "var(--primary)" : "var(--border)",
              fontWeight: 700,
            }}
            onClick={() => setPestaña("GLOBAL")}
          >
            🗄️ Respaldos Globales (.SQL)
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* PESTAÑA 1: RESTAURACIÓN AISLADA POR EMPRESA (TENANT RESTORE) */}
      {pestaña === "TENANT" && (
        <div>
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>1. Seleccionar Empresa Cliente a Respaldar / Restaurar</h2>
            </div>

            <div style={{ padding: "20px" }}>
              <div className="form-field" style={{ maxWidth: "500px", marginBottom: "16px" }}>
                <label>Empresa Rent a Car Registrada</label>
                <select
                  value={empresaSeleccionadaId}
                  onChange={(e) => {
                    setEmpresaSeleccionadaId(e.target.value);
                    setPaqueteCargado(null);
                    setNombreArchivoCargado("");
                  }}
                  style={{ padding: "10px", fontSize: "14px" }}
                >
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} (ID #{emp.id}) — {emp.ciudad} [{emp.estadoRegistro}]
                    </option>
                  ))}
                </select>
              </div>

              {empresaActiva && (
                <div
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "16px", color: "var(--primary)", display: "block" }}>
                      {empresaActiva.nombre}
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      RNC: {empresaActiva.rnc || "N/D"} • Tel: {empresaActiva.telefono || "N/D"} • Ciudad: {empresaActiva.ciudad}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={exportarRespaldoEmpresa}
                    disabled={procesando}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    📥 Descargar Respaldo Actual (JSON)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Restauración para la Empresa Seleccionada */}
          <div className="content-panel">
            <div className="panel-header">
              <h2>2. Restaurar Datos para {empresaActiva?.nombre || "la Empresa"}</h2>
            </div>

            <div style={{ padding: "24px" }}>
              <div
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "12px",
                  padding: "30px",
                  textAlign: "center",
                  backgroundColor: "var(--background)",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>📤</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>
                  Selecciona el archivo de respaldo de la empresa (.json)
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                  Sube el archivo que el cliente te envió o un respaldo previo para restablecer sus vehículos, clientes y contratos.
                </p>

                <input
                  id="input-archivo-tenant"
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleCargarArchivoEmpresa}
                />

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => document.getElementById("input-archivo-tenant")?.click()}
                >
                  📁 {nombreArchivoCargado ? `Cambiar Archivo (${nombreArchivoCargado})` : "Seleccionar Archivo JSON"}
                </button>
              </div>

              {/* Vista previa del paquete cargado */}
              {paqueteCargado && (
                <div
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--primary)",
                    borderRadius: "10px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", color: "var(--primary)", fontSize: "15px" }}>
                    📋 Contenido del Respaldo Listo para Restaurar:
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ background: "var(--background)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Vehículos</span>
                      <strong style={{ fontSize: "18px" }}>{paqueteCargado.datos.vehiculos?.length || 0}</strong>
                    </div>

                    <div style={{ background: "var(--background)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Clientes</span>
                      <strong style={{ fontSize: "18px" }}>{paqueteCargado.datos.clientes?.length || 0}</strong>
                    </div>

                    <div style={{ background: "var(--background)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Contratos</span>
                      <strong style={{ fontSize: "18px" }}>{paqueteCargado.datos.contratos?.length || 0}</strong>
                    </div>

                    <div style={{ background: "var(--background)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Mantenimientos</span>
                      <strong style={{ fontSize: "18px" }}>{paqueteCargado.datos.mantenimientos?.length || 0}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setPaqueteCargado(null);
                        setNombreArchivoCargado("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={ejecutarRestauracionEmpresa}
                      disabled={procesando}
                      style={{ backgroundColor: "#15803d" }}
                    >
                      {procesando ? "Restaurando Datos..." : `✓ Restaurar en ${empresaActiva?.nombre}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: RESPALDOS GLOBALES DEL SERVIDOR (.SQL) */}
      {pestaña === "GLOBAL" && (
        <div className="content-panel">
          <div className="panel-header">
            <h2>Copias de Seguridad Globales de la Base de Datos</h2>
            <div className="panel-actions" style={{ display: "flex", gap: "10px" }}>
              <input
                id="input-sql-externo"
                type="file"
                accept=".sql"
                style={{ display: "none" }}
                onChange={handleSubirSql}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => document.getElementById("input-sql-externo")?.click()}
                disabled={procesando}
              >
                📁 Subir Archivo .SQL
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={crearBackupGlobal}
                disabled={procesando}
              >
                {procesando ? "Generando..." : "+ Generar Backup Ahora"}
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              <div className="empty-state-icon">⏳</div>
              <strong>Cargando copias de seguridad...</strong>
            </div>
          ) : backupsGlobales.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              <div className="empty-state-icon">🗄️</div>
              <strong>No se encontraron archivos de respaldo en el servidor.</strong>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Archivo de Respaldo</th>
                    <th>Fecha y Hora</th>
                    <th>Tamaño</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backupsGlobales.map((b) => (
                    <tr key={b.archivo}>
                      <td>
                        <strong><code>{b.archivo}</code></strong>
                      </td>
                      <td>{new Date(b.fecha).toLocaleString("es-DO")}</td>
                      <td>{(b.tamaño / 1024).toFixed(2)} KB</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                          <a
                            href={`${API_BACKUPS}/download/${b.archivo}`}
                            download
                            className="btn-action-edit"
                            style={{ background: "#f1f5f9", color: "#334155", textDecoration: "none" }}
                            title="Descargar archivo .sql a mi PC"
                          >
                            📥 Descargar
                          </a>

                          <button
                            type="button"
                            className="btn-action-delete"
                            style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}
                            onClick={() => setBackupARestaurar(b.archivo)}
                          >
                            🔄 Restaurar Servidor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Restauración Global */}
      {backupARestaurar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "14px",
              maxWidth: "480px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "40px" }}>⚠️</span>
              <h3 style={{ margin: "8px 0 4px 0", fontSize: "18px", color: "var(--danger)" }}>
                ¿Confirmar Restauración Global?
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                Estás a punto de sobreescribir la base de datos de <b>RentOS</b> con el archivo:
              </p>
              <code style={{ display: "block", marginTop: "8px", background: "var(--background)", padding: "6px", borderRadius: "6px" }}>
                {backupARestaurar}
              </code>
            </div>

            <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)", padding: "12px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "20px" }}>
              Esta acción reemplazará toda la información existente por la versión del respaldo.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setBackupARestaurar(null)}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ backgroundColor: "var(--danger)" }}
                onClick={ejecutarRestauracionGlobal}
                disabled={procesando}
              >
                {procesando ? "Restaurando..." : "Sí, Restaurar Base de Datos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
