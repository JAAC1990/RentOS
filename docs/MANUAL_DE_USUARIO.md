# 📖 Manual Oficial de Usuario - RentOS

> **RentOS (Rent Operating System)** es una plataforma SaaS multi-tenant diseñada para la administración integral, operativa y financiera de empresas de alquiler de vehículos (*Rent a Car*).

---

## 📑 Índice de Contenidos

1. [Arquitectura del Sistema & Roles de Usuario](#1-arquitectura-del-sistema--roles-de-usuario)
2. [Inicio de Sesión, Seguridad & Cierre de Sesión](#2-inicio-de-sesión-seguridad--cierre-de-sesión)
3. [Personalización de Marca & Logotipo White-Label](#3-personalización-de-marca--logotipo-white-label)
4. [Catálogo Web Público de Reservas](#4-catálogo-web-público-de-reservas)
5. [Dashboard Financiero & Operativo](#5-dashboard-financiero--operativo)
6. [Gestión de Flota de Vehículos](#6-gestión-de-flota-de-vehículos)
7. [Calendario de Flota & Disponibilidad Timeline / Gantt](#7-calendario-de-flota--disponibilidad-timeline--gantt)
8. [Directorio de Clientes](#8-directorio-de-clientes)
9. [Contratos, Firma Digital & Envío por WhatsApp](#9-contratos-firma-digital--envío-por-whatsapp)
10. [Recepción, Inspección 360° & Fotos de Daños](#10-recepción-inspección-360--fotos-de-daños)
11. [Facturación, Recibos Fiscales & NCF](#11-facturación-recibos-fiscales--ncf)
12. [Mantenimiento Preventivo & Alertas de Taller](#12-mantenimiento-preventivo--alertas-de-taller)
13. [Rastreo GPS Satelital en Tiempo Real](#13-rastreo-gps-satelital-en-tiempo-real)
14. [Red de Aliados & Transferencias de Flota](#14-red-de-aliados--transferencias-de-flota)
15. [Panel de SuperAdmin & Aprobación de Empresas](#15-panel-de-superadmin--aprobación-de-empresas)
16. [Centro de Respaldos & Restauración para SuperAdmin](#16-centro-de-respaldos--restauración-para-superadmin)

---

## 1. Arquitectura del Sistema & Roles de Usuario

RentOS funciona bajo una arquitectura **Multi-Tenant Aislada**, lo que significa que cada empresa Rent a Car opera con sus propios datos, clientes, flota, contratos e identidad visual de forma totalmente independiente y confidencial.

### Roles de Acceso:
* **👑 SuperAdmin (Administrador Global):** Gestiona la plataforma, aprueba o rechaza solicitudes de nuevas empresas Rent a Car, modera suscripciones y supervisa la red.
* **🏢 Admin RentCar (Dueño / Administrador de Empresa):** Control total de su propio Rent a Car: configuración de marca, tarifas, empleados, reportes financieros y caja.
* **👤 Empleado (Agente de Operaciones / Despacho):** Emisión de contratos, recepción de vehículos, registro de pagos y consultas operativas.

---

## 2. Inicio de Sesión, Seguridad & Cierre de Sesión

### Acceso a la Plataforma (`/login`):
1. Ingrese su **Correo Electrónico** y **Contraseña**.
2. Puede marcar la casilla **`Recordar sesión`** para mantener su usuario activo sin tener que iniciar sesión repetidamente.
3. Utilice el botón del ojo `👁️` para ver u ocultar la contraseña mientras la escribe.

### Salida Segura:
* Al presionar el botón **`🚪 Salir`** en la cabecera superior, el sistema despliega un **modal de confirmación** para evitar cierres de sesión accidentales mientras se redacta un contrato o factura.

---

## 3. Personalización de Marca & Logotipo White-Label (`/configuracion`)

Cada Rent a Car puede personalizar su identidad visual completa:

1. **Logotipo de la Empresa:**
   * **📁 Buscar en mi Dispositivo:** Suba directamente una imagen desde su celular o PC. El sistema incluye un *compresor automático Canvas* que optimiza imágenes pesadas sin perder nitidez.
   * **🔗 Usar Enlace / URL Web:** Inserte un link directo a su logotipo en internet.
2. **Color Corporativo Primario:**
   * Elija entre la paleta de colores preestablecidos (*Azul Real, Verde Esmeralda, Púrpura, Rojo Deportivo, Naranja o Negro Ejecutivo*) o use el selector `#Hex` personalizado.
3. **Eslogan & WhatsApp Oficial:**
   * Configure su lema comercial y el número de WhatsApp con código de país para que los clientes se comuniquen directamente.
4. **Términos y Cláusulas del Contrato:**
   * Redacte las políticas de uso, límites de kilometraje diario y cargos por km extra.

---

## 4. Catálogo Web Público de Reservas (`/reservar?rentcar=ID`)

Un portal web público y responsive para que los clientes finales puedan cotizar y reservar vehículos:

* Muestra el logotipo, color corporativo y eslogan configurados por la empresa.
* Filtro por categoría de vehículo (*Sedán, SUV, Camioneta, Económico, Premium*).
* Botón **`💬 Reservar por WhatsApp`**: Calcula el precio total estimado y abre un chat directo con el Rent a Car con todos los datos prellenados.

---

## 5. Dashboard Financiero & Operativo (`/dashboard`)

El centro de mando para la toma de decisiones gerenciales:

* **Tarjetas KPI en Vivo:** Ingresos acumulados en caja, tasa de ocupación actual, alquileres vigentes y flota disponible.
* **Distribución de Estado de Flota (Donut Gauge):** Gráfico circular interactivo del porcentaje de vehículos alquilados, disponibles y en taller.
* **Cierre de Caja por Forma de Pago:** Desglose en barras de recaudaciones en *Efectivo, Tarjeta de Crédito/Débito, Transferencia Bancaria y PayPal/Otros*.
* **🏆 Top 5 Vehículos Más Rentables:** Ranking ordenado por facturación total y frecuencia de alquiler.

---

## 6. Gestión de Flota de Vehículos (`/vehiculos`)

Control de inventario vehicular:

* **Registro de Unidades:** Marca, Modelo, Año, Placa, VIN, Color, Kilometraje y Tarifa Diaria.
* **Auditoría de Vencimientos Legales:**
  * Alertas visuales de vencimiento de **Póliza de Seguro**.
  * Control de fecha de expiración de **Marbete / Impuesto de Circulación**.
  * Vencimiento de **Inspección Técnica / Revista**.

---

## 7. Calendario de Flota & Disponibilidad Timeline / Gantt (`/calendario`)

Planificador visual de ocupación de vehículos para evitar sobreventas (*overbooking*):

* **Malla Mensual:** Cada vehículo tiene su fila y las columnas corresponden a los días del mes.
* **Barras de Ocupación:** Identificación de días alquilados (*azul*), reservas futuras (*amarillo*) y días disponibles.
* **Tasa de Ocupación Mensual:** Cálculo automático del % de días en que la flota estuvo produciendo ingresos.
* **Navegación Temporal:** Botones para desplazarse entre meses anteriores y futuros con un solo clic.

---

## 8. Directorio de Clientes (`/clientes`)

Base de datos de arrendatarios:

* **Selector Internacional de Teléfonos:** Soporte para códigos de área internacionales con banderas (`+1-809`, `+1-829`, `+1-849`, `+1`, etc.).
* **Documentación:** Registro de Cédula, Licencia de Conducir o Pasaporte con fecha de expiración.
* **Historial Crediticio & Estatus:** Clasificación de clientes (*Activo, Inactivo, Lista Negra / Bloqueado*).

---

## 9. Contratos, Firma Digital & Envío por WhatsApp (`/contratos`)

El motor de formalización de alquileres:

1. **Emisión en 3 Clics:** Selección de cliente, vehículo, fechas, tarifa y depósito de garantía.
2. **Membrete Corporativo:** El contrato adopta automáticamente el logotipo oficial y color de marca del Rent a Car.
3. **✍️ Firma Digital Táctil:** Lienzo interactivo en pantalla para que el cliente firme con el dedo (en tablets o celulares) o con el mouse.
4. **🖨️ Impresión Impecable en 1 Sola Página (`@media print`):** Aislamiento de estilos que oculta menús y botones, dejando un documento legal formal listo para imprimir o guardar en PDF.
5. **💬 Despacho por WhatsApp:** Envío del resumen del contrato y enlace directo al cliente.
6. **🔔 Recordatorio de Retorno:** Aviso cordial automático por WhatsApp antes de que venza el contrato.
7. **➕ Extensión Rápida de Días:** Modal emergente para sumar extra (+1, +2, +3, +5, +7 días) recalculando el total sin crear un nuevo contrato.

---

## 10. Recepción, Inspección 360° & Fotos de Daños (`/entregas`)

Protocolo de entrega y devolución de unidades (Check-in / Check-out):

* **🎨 Diagrama Interactivo de Carrocería:** Toque sobre la silueta del vehículo para colocar pines numerados indicando rayones, abolladuras, roturas o raspaduras de rin con nivel de severidad (*Leve, Medio, Grave*).
* **📸 Captura & Subida de Fotos:** Tome fotos en vivo con la cámara del celular de la carrocería, odómetro y tapicería, optimizadas automáticamente en Canvas.
* **⛽ Marcador Visual de Combustible:** Selector táctil de nivel (*Reserva/Vacío, 1/4, 1/2, 3/4, Full 100%*).
* **💰 Liquidación de Depósito de Garantía:**
  * `✓ Reembolsar Completo`: Cuando el auto retorna intacto.
  * `⚠️ Deducir por Daños / Combustible`: Con desglose de monto y motivo.
  * `🔒 Retener Depósito`: Para revisiones mecánicas pendientes.

---

## 11. Facturación, Recibos Fiscales & NCF (`/pagos`)

Módulo de cobros y cuentas por cobrar:

* **Emisión de Recibos y Facturas:** Registro de Número de Comprobante Fiscal (**NCF**) o número de voucher bancario.
* **Membrete Oficial:** Recibo formateado con logo de la empresa, RNC, fecha y desglose de pago.
* **💬 Enviar Recibo por WhatsApp:** Notificación formal de pago al cliente en un clic.
* **🖨️ Impresión de Comprobante:** Formato limpio a 1 hoja para archivo de caja y firma.

---

## 12. Mantenimiento Preventivo & Alertas de Taller (`/mantenimiento`)

Gestión técnica de la flota:

* **Registro de Servicios:** Cambios de aceite y filtro, frenos, neumáticos, alineación y balanceo.
* **Alertas por Kilometraje:** Notificación automática cuando un vehículo se acerca a su próximo cambio de lubricante o mantenimiento mayor.
* **🔔 Notificaciones en Cabecera & Telegram:** Alertas instantáneas en la campana del sistema y despachos a grupos de Telegram.

---

## 13. Rastreo GPS Satelital en Tiempo Real (`/gps`)

Seguridad y telemetría de flota:

* **Mapa Interactivo:** Ubicación geográfica de cada unidad en vivo.
* **Telemetría:** Monitoreo de velocidad actual, estado de ignición (encendido/apagado) y nivel de batería.
* **Inmovilización Remota:** Bloqueo de motor en caso de impago o intento de robo.

---

## 14. Red de Aliados & Transferencias de Flota (`/red`)

Colaboración entre empresas de Rent a Car:

* Si una empresa no cuenta con un vehículo disponible solicitado por un cliente, puede solicitar el préstamo o transferencia de flota a un Rent a Car aliado de la red pactando una tarifa inter-empresarial.

---

## 15. Panel de SuperAdmin & Aprobación de Empresas (`/solicitudes`)

Exclusivo para el rol `SUPERADMIN`:

* **Solicitudes Entrantes:** Listado de nuevas empresas de Rent a Car registradas en la plataforma.
* **Moderación:** Verificación de RNC, ciudad, teléfono y correo del negocio.
* **Acciones:** `Aprobar Empresa`, `Poner en Revisión`, `Rechazar` o `Eliminar en Cascada` de forma segura.

---

## 16. Centro de Respaldos & Restauración para SuperAdmin (`/backups`)

Herramienta de recuperación ante desastres y soporte técnico exclusivo para el `SUPERADMIN`:

### A. 🔄 Restauración Aislada por Empresa (Tenant Restore):
* **Propósito:** Si una empresa cliente borró por error sus datos o requiere restablecer su inventario sin tocar ni alterar las demás empresas de RentOS.
* **Flujo de Uso:**
  1. Diríjase a **`💾 Centro de Backups`** en el menú de SuperAdmin (o haga clic en el botón `💾 Backups` dentro de `/solicitudes`).
  2. Seleccione la empresa en el menú desplegable.
  3. **Exportar:** Presione **`📥 Descargar Respaldo Actual (JSON)`** para guardar un paquete seguro con sus vehículos, clientes, contratos, pagos y mantenimientos.
  4. **Restaurar:** Arrastre o seleccione el archivo `.json` de respaldo y pulse **`✓ Restaurar en [Empresa]`**. El sistema restablecerá sus registros de forma limpia y transparente.

### B. 🗄️ Respaldos Globales del Servidor (.SQL Snapshots):
* **Propósito:** Copias completas de la base de datos PostgreSQL de todo el sistema.
* **Flujo de Uso:**
  1. Presione **`+ Generar Backup Ahora`** para crear un snapshot instantáneo en el servidor.
  2. Descargue cualquier respaldo a su computadora con **`📥 Descargar`**.
  3. Si necesita subir un archivo externo, use **`📁 Subir Archivo .SQL`**.
  4. Para recuperar todo el servidor, presione **`🔄 Restaurar Servidor`** y confirme en el modal de advertencia de seguridad.

---

*Manual generado y actualizado automáticamente con cada actualización de versión de RentOS.*
