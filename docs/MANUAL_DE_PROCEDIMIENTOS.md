# 📘 MANUAL DE PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (POE / SOP)
# SISTEMA DE GESTIÓN INTEGRAL RentOS

**Versión del Documento:** 1.0  
**Fecha de Emisión:** Agosto 2026  
**Sistema:** RentOS Multi-Tenant Enterprise SaaS  
**Aprobado por:** Dirección General de Operaciones & Tecnología  

---

## 📑 ÍNDICE GENERAL

1. [Marco Operativo & Matriz de Responsabilidades (RACI)](#1-marco-operativo--matriz-de-responsabilidades-raci)
2. [PR-01: Procedimiento de Alta y Aprobación de Nuevas Empresas (Onboarding)](#pr-01-alta-y-aprobación-de-nuevas-empresas)
3. [PR-02: Procedimiento de Configuración de Identidad White-Label y Marca](#pr-02-configuración-de-identidad-white-label-y-marca)
4. [PR-03: Procedimiento de Inventario y Auditoría Legal de Flota](#pr-03-inventario-y-auditoría-legal-de-flota)
5. [PR-04: Procedimiento de Planificación de Flota y Control de Overbooking](#pr-04-planificación-de-flota-y-control-de-overbooking)
6. [PR-05: Procedimiento de Registro y Verificación de Arrendatarios](#pr-05-registro-y-verificación-de-arrendatarios)
7. [PR-06: Procedimiento de Emisión de Contratos y Firma Digital](#pr-06-emisión-de-contratos-y-firma-digital)
8. [PR-07: Protocolo de Entrega de Vehículo al Cliente (Check-Out)](#pr-07-protocolo-de-entrega-de-vehículo-al-cliente-check-out)
9. [PR-08: Protocolo de Recepción, Inspección 360° y Liquidación de Depósito (Check-In)](#pr-08-protocolo-de-recepción-inspección-360-y-liquidación-de-depósito-check-in)
10. [PR-09: Procedimiento de Cobros, Facturación Fiscal con NCF y Cierre de Caja](#pr-09-cobros-facturación-fiscal-con-ncf-y-cierre-de-caja)
11. [PR-10: Procedimiento de Extensión de Renta y Recordatorios Automatizados](#pr-10-extensión-de-renta-y-recordatorios-automatizados)
12. [PR-11: Procedimiento de Mantenimiento Preventivo y Alertas de Taller](#pr-11-mantenimiento-preventivo-y-alertas-de-taller)
13. [PR-12: Protocolo de Monitoreo GPS Satelital e Inmovilización Remota](#pr-12-monitoreo-gps-satelital-e-inmovilización-remota)
14. [PR-13: Plan de Continuidad, Respaldos y Restauración Ante Desastres](#pr-13-plan-de-continuidad-respaldos-y-restauración-ante-desastres)
15. [Checklists Operativos de Mostrador (Anexos)](#15-checklists-operativos-de-mostrador-anexos)

---

## 1. MARCO OPERATIVO & MATRIZ DE RESPONSABILIDADES (RACI)

| Proceso Operativo | SuperAdmin | Admin RentCar | Empleado / Despacho |
| :--- | :---: | :---: | :---: |
| **Aprobación de Empresas** | **R / A** | I | I |
| **Configuración de Marca y Políticas** | I | **R / A** | C |
| **Ingreso y Auditoría de Vehículos** | I | **A** | **R** |
| **Control de Disponibilidad y Timeline** | I | **A** | **R** |
| **Alta y Verificación de Clientes** | I | A | **R** |
| **Firma y Emisión de Contratos** | I | A | **R** |
| **Inspección 360° y Fotos de Daños** | I | A | **R** |
| **Cobro y Facturación con NCF** | I | **A** | **R** |
| **Mantenimiento y Alertas de Taller** | I | **R / A** | C |
| **Corte de Motor GPS Remoto** | **A** | **R** | C |
| **Respaldos y Restauración de Datos** | **R / A** | C | I |

*(R = Responsable de Ejecutar, A = Aprueba / Autoriza, C = Consultado, I = Informado)*

---

## PR-01: ALTA Y APROBACIÓN DE NUEVAS EMPRESAS
* **Objetivo:** Garantizar la legitimidad legal de las empresas Rent a Car que ingresan a la plataforma.
* **Responsable:** SuperAdministrador.
* **Pasos:**
  1. Ingresar a `/solicitudes` en la barra lateral.
  2. Verificar RNC, Nombre Comercial, Ciudad, Teléfono y Correo del solicitante.
  3. Validar estado fiscal de la empresa.
  4. Presionar `✅ Autorizar` para habilitar el tenant con su base de datos aislada, o `🔴 Rechazar` si no cumple los requisitos.

---

## PR-02: CONFIGURACIÓN DE IDENTIDAD WHITE-LABEL Y MARCA
* **Objetivo:** Personalizar la marca gráfica del Rent a Car en contratos, facturas y portal web.
* **Responsable:** Administrador del Rent a Car.
* **Pasos:**
  1. Dirigirse a `/configuracion`.
  2. Subir el **Logotipo Oficial** mediante `📁 Buscar en mi Dispositivo` (el sistema lo comprime automáticamente) o `🔗 Usar Enlace Web`.
  3. Seleccionar el **Color Primario Corporativo** y configurar el **Eslogan Oficial**.
  4. Ingresar el número de **WhatsApp de Atención al Cliente** (con código de país) y la moneda predeterminada.
  5. Redactar las cláusulas legales y límites de kilometraje diario.
  6. Presionar `💾 Guardar Configuración General`.

---

## PR-03: INVENTARIO Y AUDITORÍA LEGAL DE FLOTA
* **Objetivo:** Mantener el parque vehicular al día con la documentación legal vigente.
* **Responsable:** Administrador / Encargado de Flota.
* **Pasos:**
  1. Ingresar a `/vehiculos` y hacer clic en `+ Nuevo Vehículo`.
  2. Registrar: Marca, Modelo, Año, Color, Placa, VIN, Kilometraje inicial y Tarifa diaria.
  3. **Auditoría de Vencimientos:**
     * Registrar número de Póliza y Fecha de Vencimiento del Seguro.
     * Registrar Fecha de Expiración del Marbete / Impuesto de Circulación.
     * Registrar Fecha de Revista / Inspección Técnica Vehicular.
  4. Guardar la unidad. El sistema notificará con insignias rojas y amarillas cuando un documento esté a 30 días o menos de expirar.

---

## PR-04: PLANIFICACIÓN DE FLOTA Y CONTROL DE OVERBOOKING
* **Objetivo:** Maximizar la tasa de ocupación de vehículos y evitar sobreventas.
* **Responsable:** Agente de Mostrador / Administrador.
* **Pasos:**
  1. Ingresar a `/calendario` (Vista Gantt / Timeline).
  2. Seleccionar el mes correspondiente.
  3. Consultar la barra de estado de cada auto:
     * 🔵 **Azul (Alquilado):** Unidad en contrato activo.
     * 🟡 **Amarillo (Reserva):** Compromiso futuro.
     * ⚪ **Disponible:** Unidad lista para asignar.
  4. Verificar que el período solicitado no se solape con reservas existentes antes de confirmar al cliente.

---

## PR-05: REGISTRO Y VERIFICACIÓN DE ARRENDATARIOS
* **Objetivo:** Mitigar riesgos de fraude, impago o apropiación indebida.
* **Responsable:** Agente de Mostrador.
* **Pasos:**
  1. Ingresar a `/clientes` y pulsar `+ Nuevo Cliente`.
  2. Seleccionar el código internacional de país telefónico con bandera e ingresar el número de WhatsApp.
  3. Solicitar Cédula/Pasaporte y Licencia de Conducir física vigente.
  4. Verificar que el cliente no se encuentre en estado `BLOQUEADO` (Lista Negra).
  5. Registrar los datos completos y guardar.

---

## PR-06: EMISIÓN DE CONTRATOS Y FIRMA DIGITAL
* **Objetivo:** Formalizar el contrato de arrendamiento legal sin uso de papel físico.
* **Responsable:** Agente de Despacho.
* **Pasos:**
  1. Ingresar a `/contratos` y presionar `+ Nuevo Contrato`.
  2. Seleccionar el Cliente, Vehículo disponible, Fechas de Inicio y Fin, y Depósito de Garantía.
  3. Presionar `Guardar Contrato` (El vehículo pasa automáticamente a estado `ALQUILADO`).
  4. Abrir la vista `🖨️ Contrato`:
     * Verificar membrete con logotipo oficial y desglose tarifario.
     * Solicitar al cliente que estampe su **Firma Digital Táctil** en el recuadro interactivo (con dedo o mouse).
  5. Si el cliente requiere copia física, presionar `🖨️ Imprimir / Guardar PDF` (formato limpio a 1 página).
  6. Presionar `💬 Enviar a WhatsApp` para despachar el contrato digital al cliente.

---

## PR-07: PROTOCOLO DE ENTREGA DE VEHÍCULO (CHECK-OUT)
* **Objetivo:** Entregar la unidad en condiciones óptimas documentadas.
* **Responsable:** Agente de Despacho.
* **Checklist de Salida:**
  1. Verificar que el odómetro físico coincida con el contrato.
  2. Constatar que el combustible esté en **100% (Lleno)**.
  3. Verificar presencia de rueda de repuesto, llave de cruz, gato hidráulico, triángulo de seguridad y botiquín.
  4. Entregar llaves y desear un excelente viaje al cliente.

---

## PR-08: PROTOCOLO DE RECEPCIÓN, INSPECCIÓN 360° Y LIQUIDACIÓN DE DEPÓSITO (CHECK-IN)
* **Objetivo:** Auditar el estado de retorno de la unidad y liquidar el depósito de garantía justamente.
* **Responsable:** Inspector de Patio / Agente de Devolución.
* **Pasos:**
  1. Ingresar a `/entregas` y presionar `🔑 Nueva Recepción / Check-in`.
  2. Seleccionar el Contrato Activo e ingresar el **Kilometraje Final (Odómetro)**.
  3. Seleccionar el **Nivel de Combustible** retornado (*Reserva, 1/4, 1/2, 3/4, Full*).
  4. **Inspección Visual de Carrocería 360°:**
     * Revisar el contorno del vehículo. Si hay daños nuevos, hacer clic en la silueta interactiva para colocar un pin indicando la zona (*Frente, Lateral, Trasera, Techo*), tipo (*Rayón, Abolladura, Golpe, Cristal, Llanta*) y severidad (*Leve, Medio, Grave*).
  5. **Captura de Fotos:** Pulsar `📷 Tomar / Subir Fotos` y fotografiar daños, odómetro y nivel de combustible.
  6. **Liquidación de Depósito de Garantía:**
     * `✓ Reembolsar Completo`: Si el auto retorna sin novedades.
     * `⚠️ Deducir por Daños / Combustible`: Indicar el monto a deducir ($) y el motivo detallado.
     * `🔒 Retener Depósito`: Si requiere cotización en taller externo.
  7. Presionar `✓ Completar Check-in & Liberar Auto`. El vehículo vuelve automáticamente a estado `DISPONIBLE`.

---

## PR-09: COBROS, FACTURACIÓN FISCAL CON NCF Y CIERRE DE CAJA
* **Objetivo:** Garantizar la transparencia fiscal y el cuadre financiero diario.
* **Responsable:** Cajero / Administrador.
* **Pasos:**
  1. Ingresar a `/pagos` y pulsar `+ Registrar Cobro / Factura`.
  2. Seleccionar el contrato y el monto cobrado.
  3. Seleccionar la forma de pago: `💵 Efectivo`, `💳 Tarjeta`, `🏦 Transferencia` o `🌐 PayPal`.
  4. Ingresar el **Número de Comprobante Fiscal (NCF)** o número de voucher bancario.
  5. Guardar el cobro.
  6. Presionar `🧾 Recibo / NCF` para ver el recibo membretado con logo y presionar `💬 Enviar a WhatsApp` para remitir el comprobante al cliente.
  7. Al finalizar el día, verificar el panel de **Cierre de Caja** en `/dashboard` cuadrando los totales por método de pago.

---

## PR-10: EXTENSIÓN DE RENTA Y RECORDATORIOS AUTOMATIZADOS
* **Objetivo:** Prevenir retrasos y facilitar renovaciones de contrato a clientes activos.
* **Responsable:** Asesor de Servicio al Cliente.
* **Pasos:**
  1. Ingresar a `/contratos`.
  2. Identificar contratos próximos a vencer (24-48 horas).
  3. Presionar el botón `🔔 Recordar`: Se abrirá un mensaje de WhatsApp prediseñado recordando la fecha de retorno e invitando al cliente a extender si lo desea.
  4. Si el cliente solicita días adicionales:
     * Presionar el botón `➕ Extender`.
     * Seleccionar los días extra (*+1, +2, +3, +5, +7 días*).
     * El sistema recalcula la nueva fecha de devolución y el monto adicional a cobrar.
     * Presionar `✓ Confirmar Extensión`.

---

## PR-11: MANTENIMIENTO PREVENTIVO Y ALERTAS DE TALLER
* **Objetivo:** Asegurar la vida útil mecánica de la flota y la seguridad del usuario.
* **Responsable:** Encargado de Mantenimiento.
* **Pasos:**
  1. Ingresar a `/mantenimiento`.
  2. Registrar servicios ejecutados: Cambio de Aceite y Filtro, Frenos, Neumáticos, etc.
  3. Indicar el kilometraje del servicio y el kilometraje sugerido para el próximo mantenimiento.
  4. Monitorear la **Campana de Notificaciones (`🔔`)** en la cabecera del sistema, la cual alertará en vivo cuando un vehículo esté a 500 km o menos de su próximo servicio de taller.

---

## PR-12: MONITOREO GPS SATELITAL E INMOVILIZACIÓN REMOTA
* **Objetivo:** Proteger los activos vehiculares contra robo o uso indebido.
* **Responsable:** Oficial de Seguridad / SuperAdmin.
* **Pasos:**
  1. Ingresar a `/gps`.
  2. Visualizar la flota en el mapa interactivo satelital con velocidad y estado de ignición en tiempo real.
  3. **Protocolo de Inmovilización Remota:**
     * En caso de impago grave, salida no autorizada del país o sospecha de hurto:
     * Seleccionar el vehículo y activar `🛑 Bloqueo de Motor`.
     * Notificar a las autoridades competentes y al equipo de recuperación.

---

## PR-13: PLAN DE CONTINUIDAD, RESPALDOS Y RESTAURACIÓN ANTE DESASTRES
* **Objetivo:** Salvaguardar la información operativa y financiera ante cualquier contingencia.
* **Responsable:** SuperAdministrador Global.
* **Pasos:**
  1. Ingresar a `/backups`.
  2. **Respaldo Periódico de Empresa:**
     * Seleccionar la empresa en el menú desplegable.
     * Presionar `📥 Descargar Respaldo Actual (JSON)`.
  3. **Restauración Aislada de Empresa (Cliente con pérdida de datos):**
     * Subir el archivo `.json` de la empresa.
     * Validar el conteo de registros en la vista previa.
     * Presionar `✓ Restaurar en [Empresa]`.
  4. **Respaldo Global del Servidor:**
     * Presionar `+ Generar Backup Ahora` para crear un snapshot `.sql` en el servidor PostgreSQL.

---

## 15. CHECKLISTS OPERATIVOS DE MOSTRADOR (ANEXOS)

### Checklist de Turno de Mostrador:
- [ ] Iniciar sesión en RentOS y revisar la campana de notificaciones `🔔`.
- [ ] Revisar el `/calendario` de flota para entregas y recepciones del día.
- [ ] Verificar contratos que vencen hoy y enviar recordatorio `🔔` por WhatsApp.
- [ ] Realizar arqueo de caja en `/dashboard` al finalizar la jornada.

### Checklist de Recepción de Auto (Check-in):
- [ ] Verificar odómetro final vs contrato.
- [ ] Validar nivel de combustible con el marcador digital de 5 niveles.
- [ ] Realizar inspección 360° y colocar pines de daños si existen rayones.
- [ ] Tomar fotos de evidencia y adjuntarlas en `/entregas`.
- [ ] Liquidar el depósito de garantía (Reembolso o Deducción).
- [ ] Liberar el vehículo a `DISPONIBLE`.
