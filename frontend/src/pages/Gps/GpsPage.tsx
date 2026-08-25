/**
 * ============================================================================
 * RentOS - Monitoreo GPS Satelital y Control Anti-Robo (GpsPage)
 * ============================================================================
 * Centro de control y telemetría de vehículos en vivo:
 * - Mapa interactivo con Leaflet y OpenStreetMap centrado en República Dominicana.
 * - Marcadores en tiempo real con estado de ignición, velocidad y geocerca.
 * - Comando remoto de inmovilización y corte de corriente de motor.
 * - Historial de ruta y trazo de recorridos sobre el mapa.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_URLS } from "../../services/api";

type TelemetriaGPS = {
  id: number;
  vehiculoId: number;
  latitud: number;
  longitud: number;
  velocidad: number;
  rumbo: number | null;
  nivelBateria: number | null;
  ignicion: boolean;
  bloqueoMotor: boolean;
  geocerca: string | null;
  direccionAprox: string | null;
  fechaHora: string;
};

type VehiculoGPS = {
  vehiculoId: number;
  marca: string;
  modelo: string;
  placa: string;
  color: string | null;
  anio: number;
  estadoVehiculo: string;
  gps: TelemetriaGPS;
};

// Configuración de iconos SVG personalizados para Leaflet
const crearIconoVehiculo = (enMovimiento: boolean, bloqueado: boolean) => {
  const colorFondo = bloqueado ? "#ef4444" : enMovimiento ? "#10b981" : "#3b82f6";
  const textoIcono = bloqueado ? "🔒" : "🚗";

  return L.divIcon({
    className: "custom-gps-marker",
    html: `
      <div style="
        background-color: ${colorFondo};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
        transform: translate(-50%, -50%);
        transition: transform 0.3s ease;
      ">
        ${textoIcono}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

export default function GpsPage() {
  const [flotaGps, setFlotaGps] = useState<VehiculoGPS[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  const API_GPS = API_URLS.gps;

  const cargarTelemetria = async () => {
    try {
      setError("");
      const res = await fetch(API_GPS);
      if (!res.ok) throw new Error("No fue posible obtener la telemetría GPS.");
      const datos: VehiculoGPS[] = await res.json();
      setFlotaGps(datos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor satelital GPS.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTelemetria();
    const interval = setInterval(cargarTelemetria, 15000); // Polling cada 15s
    return () => clearInterval(interval);
  }, []);

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centro inicial: Santo Domingo, República Dominicana
    const map = L.map(mapContainerRef.current).setView([18.47186, -69.93922], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores en el mapa cuando cambie la flota
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    flotaGps.forEach((v) => {
      if (!v.gps?.latitud || !v.gps?.longitud) return;

      const enMovimiento = v.gps.velocidad > 0;
      const icono = crearIconoVehiculo(enMovimiento, v.gps.bloqueoMotor);

      const marker = L.marker([v.gps.latitud, v.gps.longitud], { icon: icono }).addTo(map);

      const contenidoPopup = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #1e293b;">
            ${v.marca} ${v.modelo} (${v.anio})
          </h3>
          <div style="margin-bottom: 8px;">
            <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0284c7;">
              ${v.placa}
            </code>
            <span style="font-size: 11px; margin-left: 6px; color: #64748b;">
              ${v.estadoVehiculo}
            </span>
          </div>

          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            <div>⚡ <b>Velocidad:</b> ${v.gps.velocidad.toFixed(1)} km/h</div>
            <div>🔋 <b>Batería GPS:</b> ${v.gps.nivelBateria || 100}%</div>
            <div>🔑 <b>Ignición:</b> ${v.gps.ignicion ? '<span style="color:#10b981;">Encendido</span>' : '<span style="color:#64748b;">Apagado</span>'}</div>
            <div>📍 <b>Geocerca:</b> ${v.gps.geocerca || "Zona Urbana"}</div>
            <div>📌 <b>Ubicación:</b> ${v.gps.direccionAprox || "Coordenadas fijadas"}</div>
          </div>

          <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: center;">
            <button 
              id="btn-inmovilizar-${v.vehiculoId}" 
              style="
                background: ${v.gps.bloqueoMotor ? '#10b981' : '#ef4444'};
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                width: 100%;
              "
            >
              ${v.gps.bloqueoMotor ? '🔓 Desbloquear Motor' : '🔒 Inmovilizar Motor'}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(contenidoPopup);

      // Event listener en el popup para inmovilizar
      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-inmovilizar-${v.vehiculoId}`);
        if (btn) {
          btn.onclick = () => alternarInmovilizacion(v.vehiculoId, !v.gps.bloqueoMotor);
        }
      });

      markersRef.current[v.vehiculoId] = marker;
      bounds.extend([v.gps.latitud, v.gps.longitud]);
    });

    if (flotaGps.length > 0 && !vehiculoSeleccionado) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [flotaGps]);

  const enfocarVehiculo = (vehiculo: VehiculoGPS) => {
    setVehiculoSeleccionado(vehiculo.vehiculoId);
    const map = mapInstanceRef.current;
    const marker = markersRef.current[vehiculo.vehiculoId];

    if (map && vehiculo.gps?.latitud && vehiculo.gps?.longitud) {
      map.setView([vehiculo.gps.latitud, vehiculo.gps.longitud], 15, { animate: true });
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const alternarInmovilizacion = async (vehiculoId: number, nuevoEstado: boolean) => {
    try {
      setMensaje("");
      const res = await fetch(`${API_GPS}/inmovilizar/${vehiculoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueoMotor: nuevoEstado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al inmovilizar.");

      setMensaje(data.mensaje);
      await cargarTelemetria();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al ejecutar inmovilización.");
    }
  };

  const simularPingGPS = async () => {
    if (flotaGps.length === 0) return;
    try {
      // Tomar el primer vehículo y simular un desplazamiento de 0.002 grados
      const target = flotaGps[0];
      const nuevaLat = target.gps.latitud + (Math.random() - 0.5) * 0.005;
      const nuevaLng = target.gps.longitud + (Math.random() - 0.5) * 0.005;
      const nuevaVel = Math.floor(Math.random() * 45) + 20;

      await fetch(`${API_GPS}/telemetria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehiculoId: target.vehiculoId,
          latitud: nuevaLat,
          longitud: nuevaLng,
          velocidad: nuevaVel,
          ignicion: true,
          nivelBateria: 95.0,
          geocerca: target.gps.geocerca,
          direccionAprox: target.gps.direccionAprox,
        }),
      });

      setMensaje(`📡 Telemetría actualizada en tiempo real para ${target.marca} ${target.modelo}.`);
      await cargarTelemetria();
    } catch (err) {
      console.error(err);
    }
  };

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const total = flotaGps.length;
    const enMovimiento = flotaGps.filter((v) => v.gps?.velocidad > 0 && !v.gps?.bloqueoMotor).length;
    const detenidos = flotaGps.filter((v) => v.gps?.velocidad === 0 && !v.gps?.bloqueoMotor).length;
    const bloqueados = flotaGps.filter((v) => v.gps?.bloqueoMotor).length;

    return { total, enMovimiento, detenidos, bloqueados };
  }, [flotaGps]);

  const flotaFiltrada = useMemo(() => {
    return flotaGps.filter((v) => {
      const texto = `${v.marca} ${v.modelo} ${v.placa} ${v.gps?.geocerca || ""}`.toLowerCase();
      return texto.includes(busqueda.toLowerCase());
    });
  }, [flotaGps, busqueda]);

  return (
    <div className="gps-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Monitoreo Satelital GPS & Geocercas</h1>
          <p>Rastreo en tiempo real, velocímetro, geocercas y corte remoto de ignición anti-robo.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-button" onClick={simularPingGPS}>
            📡 Simular Ping GPS
          </button>
          <button className="primary-button" onClick={cargarTelemetria}>
            🔄 Actualizar Radar
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛰️</div>
          <div className="stat-info">
            <span className="stat-label">Flota Rastreada</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">🟢</div>
          <div className="stat-info">
            <span className="stat-label">En Movimiento</span>
            <strong className="stat-value" style={{ color: "var(--success)" }}>
              {stats.enMovimiento}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🅿️</div>
          <div className="stat-info">
            <span className="stat-label">Estacionados</span>
            <strong className="stat-value">{stats.detenidos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">🔒</div>
          <div className="stat-info">
            <span className="stat-label">Motores Inmovilizados</span>
            <strong className="stat-value" style={{ color: stats.bloqueados > 0 ? "var(--danger)" : "inherit" }}>
              {stats.bloqueados}
            </strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Layout del Centro de Control GPS: Mapa + Lista Lateral */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", height: "580px" }}>
        {/* Panel del Mapa Interactivo */}
        <div
          className="content-panel"
          style={{ padding: "0", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}
        >
          {cargando && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.7)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              ⏳ Conectando con satélites GPS...
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
        </div>

        {/* Panel Lateral: Lista de Vehículos y Telemetría */}
        <div className="content-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>Unidades Rastreadas</h3>
            <input
              type="text"
              placeholder="Buscar auto o placa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {flotaFiltrada.map((v) => {
              const enMovimiento = v.gps?.velocidad > 0;
              const estaSeleccionado = vehiculoSeleccionado === v.vehiculoId;

              return (
                <div
                  key={v.vehiculoId}
                  onClick={() => enfocarVehiculo(v)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: estaSeleccionado ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: estaSeleccionado ? "var(--primary-soft)" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>
                      {v.marca} {v.modelo}
                    </strong>
                    <span
                      className={`badge ${
                        v.gps?.bloqueoMotor
                          ? "badge-inactivo"
                          : enMovimiento
                          ? "badge-disponible"
                          : "badge-alquilado"
                      }`}
                      style={{ fontSize: "10px", padding: "2px 6px" }}
                    >
                      {v.gps?.bloqueoMotor ? "BLOQUEADO" : enMovimiento ? `${v.gps.velocidad.toFixed(0)} km/h` : "DETENIDO"}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Placa: <code>{v.placa}</code> • Batería: {v.gps?.nivelBateria || 100}%
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--text-light)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    📍 {v.gps?.direccionAprox || "Ubicación en mapa"}
                  </div>

                  <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "#f8fafc",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        enfocarVehiculo(v);
                      }}
                    >
                      🎯 Enfocar
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "5px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "none",
                        background: v.gps?.bloqueoMotor ? "var(--success)" : "var(--danger)",
                        color: "white",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarInmovilizacion(v.vehiculoId, !v.gps?.bloqueoMotor);
                      }}
                    >
                      {v.gps?.bloqueoMotor ? "🔓 Desbloquear" : "🔒 Inmovilizar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
