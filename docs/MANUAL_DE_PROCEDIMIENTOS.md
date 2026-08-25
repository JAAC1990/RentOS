# 📘 MANUAL DE PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (POE / SOP)
# SISTEMA DE GESTIÓN INTEGRAL RentOS (Multi-Tenant SaaS)

**Código del Documento:** `MPO-RENTOS-2026-V2`  
**Versión del Manual:** 2.0 (Estructura Modular Ajustable)  
**Última Actualización:** Agosto 2026  
**Ámbito de Aplicación:** Todas las Sucursales y Rent a Cars Operativos en la Plataforma  
**Aprobado por:** Dirección General de Operaciones, Cumplimiento Legal y Tecnología  

---

## 📑 CONTROL DE VERSIONES & REGISTRO DE CAMBIOS (CHANGELOG)

Este manual es un documento vivo y **ajustable**. Cada vez que se incorpore una nueva función o mejora en RentOS, debe actualizarse la tabla inferior y la sección correspondiente del módulo.

| Versión | Fecha | Módulos Actualizados / Incorporados | Descripción de la Modificación | Responsable |
| :---: | :---: | :--- | :--- | :---: |
| **1.0** | 2026-08-20 | Módulos 1 al 10 | Creación inicial del manual operativo estándar. | Depto. Tecnología |
| **1.5** | 2026-08-23 | Contratos & Facturación | Integración de Comprobantes Fiscales NCF dominicanos y firmas digitales. | Asesoría Legal / IT |
| **2.0** | 2026-08-24 | Todos los Módulos (1 al 15) | Guía exhaustiva campo por campo, contrato oficial con QR inmutable, fotos clicables y catálogo web. | Operaciones RentOS |

---

## 🧭 ÍNDICE GENERAL DE MÓDULOS

1. [MÓDULO 01: Inicio de Sesión, Autenticación & Perfiles de Usuario](#módulo-01-inicio-de-sesión-autenticación--perfiles-de-usuario)
2. [MÓDULO 02: Panel de Control & Métricas en Tiempo Real (Dashboard)](#módulo-02-panel-de-control--métricas-en-tiempo-real-dashboard)
3. [MÓDULO 03: Gestión de Flota, Fichas Técnicas & Auditoría Legal](#módulo-03-gestión-de-flota-fichas-técnicas--auditoría-legal)
4. [MÓDULO 04: Calendario de Flota & Control de Disponibilidad Gantt](#módulo-04-calendario-de-flota--control-de-disponibilidad-gantt)
5. [MÓDULO 05: Gestión de Clientes, Documentos & Consultas de Crédito](#módulo-05-gestión-de-clientes-documentos--consultas-de-crédito)
6. [MÓDULO 06: Contratos, Firma Digital, QR de Autenticidad & Legal](#módulo-06-contratos-firma-digital-qr-de-autenticidad--legal)
7. [MÓDULO 07: Entregas, Devoluciones & Protocolo Check-In / Check-Out](#módulo-07-entregas-devoluciones--protocolo-check-in--check-out)
8. [MÓDULO 08: Caja, Facturación con NCF Dominicano & Control de Pagos](#módulo-08-caja-facturación-con-ncf-dominicano--control-de-pagos)
9. [MÓDULO 09: Taller, Mantenimiento Preventivo & Correctivo](#módulo-09-taller-mantenimiento-preventivo--correctivo)
10. [MÓDULO 10: Monitoreo GPS Satelital, Telemetría & Corte de Motor](#módulo-10-monitoreo-gps-satelital-telemetría--corte-de-motor)
11. [MÓDULO 11: Equipo, Usuarios & Matriz de Permisos](#módulo-11-equipo-usuarios--matriz-de-permisos)
12. [MÓDULO 12: Red de Aliados & Subarrendamiento B2B](#módulo-12-red-de-aliados--subarrendamiento-b2b)
13. [MÓDULO 13: Configuración de la Empresa & Personalización de Marca](#módulo-13-configuración-de-la-empresa--personalización-de-marca)
14. [MÓDULO 14: Catálogo Público de Reservas Web para Clientes Finales](#módulo-14-catálogo-público-de-reservas-web-para-clientes-finales)
15. [MÓDULO 15: Portal Público de Verificación de Contratos QR](#módulo-15-portal-público-de-verificación-de-contratos-qr)

---

# MÓDULO 01: INICIO DE SESIÓN, AUTENTICACIÓN & PERFILES DE USUARIO

### 1.1 Objetivo del Módulo
Garantizar el acceso seguro, controlado y restringido de cada colaborador a la sucursal o tenant asignado, protegiendo los datos corporativos de la empresa.

### 1.2 Roles Autorizados
* SuperAdministrador, Administrador de Rent a Car, Agente de Ventas/Cajero, Mecánico, Chofer.

### 1.3 Procedimiento de Operación
1. Abrir el navegador e ingresar a la URL del sistema (ej. `http://localhost:5173/login` o dominio de producción).
2. RentOS siempre solicitará credenciales antes de mostrar cualquier información.
3. Ingresar las credenciales proporcionadas por la gerencia y presionar **Iniciar Sesión**.

### 1.4 Guía de Llenado de Campos (Login)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Correo Electrónico** | Sí | `admin@rentos.com` | Correo corporativo registrado en el sistema. No distingue entre mayúsculas y minúsculas. |
| **Contraseña** | Sí | Mínimo 6 caracteres | Clave confidencial. En caso de olvido, debe ser restablecida por el Administrador. |
| **Cambio de Tema (Claro/Oscuro)** | No | Selector en encabezado | Permite adaptar la interfaz para trabajo diurno o nocturno según preferencia del operador. |

---

# MÓDULO 02: PANEL DE CONTROL & MÉTRICAS EN TIEMPO REAL (DASHBOARD)

### 2.1 Objetivo del Módulo
Ofrecer a la gerencia y personal de operaciones una vista panorámica instantánea del rendimiento comercial, estado de la flota e ingresos financieros.

### 2.2 Roles Autorizados
* Administrador, Gerente de Operaciones, Encargado de Flota.

### 2.3 Interpretación de Métricas & Indicadores
* **Total Flota:** Suma total de unidades registradas bajo la empresa.
* **Tasa de Ocupación (%):** Porcentaje de vehículos rentados en relación con la flota total disponible. (Meta óptima: >75%).
* **Ingresos del Mes:** Total recaudado por concepto de rentas, seguros, cargos por demora y delivery.
* **Vehículos en Taller:** Conteo de unidades bloqueadas por servicio técnico o reparaciones de choque.
* **Alertas Preventivas:** Notificaciones sobre pólizas de seguros por vencer (≤30 días) o contratos próximos a vencer en el día.

---

# MÓDULO 03: GESTIÓN DE FLOTA, FICHAS TÉCNICAS & AUDITORÍA LEGAL

### 3.1 Objetivo del Módulo
Administrar el catálogo completo de vehículos, sus especificaciones técnicas de cara al cliente final y la auditoría de documentos legales exigidos por la Dirección General de Impuestos Internos (DGII) y la DIGESETT en República Dominicana.

### 3.2 Procedimiento de Alta de un Nuevo Vehículo
1. Ingresar a la sección **Vehículos** (`/vehiculos`).
2. Hacer clic en el botón superior **`+ Nuevo Vehículo`**.
3. Completar todos los campos del formulario según la tabla inferior.
4. Subir la fotografía representativa del vehículo o ingresar el enlace URL.
5. Hacer clic en **`Registrar Vehículo`**.

### 3.3 Guía de Llenado Campo por Campo (Vehículos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Fotografía Principal** | Recomendado | Imagen PNG/JPG o URL | Foto real y limpia del vehículo. Se mostrará en el catálogo web público y en la ficha técnica. |
| **Marca** | **Sí** | `Toyota`, `Hyundai`, `Kia`, `Ford` | Fabricante del vehículo. Escribir con mayúscula inicial. |
| **Modelo** | **Sí** | `Corolla LE`, `Tucson 4WD`, `Sportage` | Versión comercial exacta del automóvil. |
| **Año** | **Sí** | `2024`, `2025` | Año de fabricación según matrícula/título de propiedad. Rango permitido: 1990 a Año actual + 2. |
| **Color** | No | `Blanco Perlado`, `Gris Plata`, `Negro` | Color exterior predominante. |
| **Placa / Matrícula** | **Sí** | `A123456`, `G771144` | Placa oficial dominicana (Única e irrepetible en el sistema). |
| **No. de Chasis / VIN** | No | 17 caracteres alfanuméricos | Número de identificación vehicular grabado en el chasis. Fundamental para reclamos de seguro y reporte de robo. |
| **Categoría** | **Sí** | `SEDAN`, `SUV`, `COMPACTO`, `CAMIONETA`, `VAN`, `LUJO` | Segmento vehicular. Determina los filtros en la web de reservas. |
| **Transmisión** | **Sí** | `AUTOMATICA` o `MANUAL` | Tipo de caja de cambios del automóvil. |
| **Combustible** | **Sí** | `GASOLINA`, `DIESEL`, `HIBRIDO`, `ELECTRICO` | Tipo de carburante que debe suministrarse al vehículo. |
| **Pasajeros** | **Sí** | `5`, `7`, `12` | Número máximo de ocupantes autorizados con cinturón. |
| **Capacidad Maletas** | **Sí** | `2`, `3`, `5` | Número de maletas grandes de viaje que caben en el maletero. |
| **Puertas** | **Sí** | `4`, `5`, `2` | Cantidad de puertas de acceso. |
| **Aire Acondicionado** | **Sí** | `Sí (Con Climatizador A/C)` | Estado operativo del compresor de aire acondicionado. |
| **Odómetro Inicial (km)** | **Sí** | `15420` | Kilometraje real que marca el tablero al momento del ingreso a la flota. |
| **Tarifa Diaria** | **Sí** | `45.00`, `60.00` | Precio base de renta por cada 24 horas (en la moneda de la empresa, ej. USD o DOP). |
| **Estado Operativo** | **Sí** | `DISPONIBLE`, `ALQUILADO`, `MANTENIMIENTO`, `INACTIVO` | Estado inicial del auto (por defecto siempre `DISPONIBLE`). |
| **Póliza de Seguro** | Recomendado | `Seguros Universal #UN-992288` | Nombre de la aseguradora y número de póliza contratada. |
| **Vencimiento Seguro** | Recomendado | `YYYY-MM-DD` (ej. `2027-02-15`) | Fecha de expiración de la póliza. El sistema alertará a los 30 días restantes. |
| **Vencimiento Marbete** | Recomendado | `YYYY-MM-DD` | Fecha límite del impuesto de circulación vehicular anual emitido por DGII. |

### 3.4 Procedimiento de Verificación en Mostrador
* Al hacer **clic sobre cualquier vehículo de la tabla**, se desplegará una **Ficha Técnica en Gran Formato** con las fotos y especificaciones completas para mostrárselas al cliente en mostrador o enviárselas por WhatsApp.

---

# MÓDULO 04: CALENDARIO DE FLOTA & CONTROL DE DISPONIBILIDAD GANTT

### 4.1 Objetivo del Módulo
Visualizar de forma gráfica e interactiva la ocupación de toda la flota en una línea de tiempo (Diagrama de Gantt), coordinar entregas futuras y evitar el *overbooking* (sobreventa).

### 4.2 Código de Colores del Calendario
* 🔵 **Azul Sólido (Contrato Activo):** Vehículo en posesión del cliente.
* 🟡 **Amarillo (Reserva Confirmada):** Vehículo comprometido para retiro en fechas futuras.
* 🛠️ **Gris / Naranja (Mantenimiento Programado):** Unidad bloqueada para servicio en taller.
* ⚪ **Espacio en Blanco (Disponible):** Vehículo 100% libre para alquiler inmediato o reserva.

### 4.3 Procedimiento de Consulta de Disponibilidad
1. Ingresar a **Calendario de Flota** (`/calendario`).
2. Seleccionar el mes a consultar utilizando los botones de navegación `⬅️ Mes Anterior` / `Mes Siguiente ➡️`.
3. Filtrar por categoría o marca según el requerimiento del cliente.
4. Identificar las unidades que tengan la barra temporal libre durante el rango de fechas solicitado.

---

# MÓDULO 05: GESTIÓN DE CLIENTES, DOCUMENTOS & CONSULTAS DE CRÉDITO

### 5.1 Objetivo del Módulo
Registrar la identidad completa de arrendatarios nacionales y extranjeros, validar su historial crediticio/conductual y archivar copias digitales de licencias y pasaportes.

### 5.2 Procedimiento de Registro de Arrendatario
1. Ingresar a **Clientes** (`/clientes`) y presionar **`+ Nuevo Cliente`**.
2. Ingresar nombre, apellido, teléfono con código de país y correo electrónico.
3. Subir las fotografías legibles de la **Cédula de Identidad / Pasaporte** y de la **Licencia de Conducir Vigente**.
4. Realizar la consulta preventiva de crédito si las políticas de la empresa lo requieren.
5. Presionar **`Guardar Cliente`**.

### 5.3 Guía de Llenado Campo por Campo (Clientes)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre** | **Sí** | `Juan Carlos` | Primer y segundo nombre del cliente según documento oficial. |
| **Apellido** | **Sí** | `Pérez Morales` | Apellidos completos del cliente. |
| **Teléfono / WhatsApp** | **Sí** | `+1 (809) 555-0199` | Teléfono directo con código de país. Utilizado para el envío automático del contrato vía WhatsApp. |
| **Correo Electrónico** | No | `juan.perez@email.com` | Correo electrónico para facturación y copia digital. |
| **Dirección Residencial** | Recomendado | `Calle Las Palmas #12, Santo Domingo` | Dirección física donde reside el cliente (o dirección de hotel si es turista). |
| **No. de Cédula / Pasaporte** | **Sí** | `402-1234567-8` o `P8472910` | Documento de identidad oficial y vigente. |
| **No. Licencia de Conducir** | **Sí** | `DO-40212345678` | Licencia de conducir válida para el tipo de vehículo a rentar. |
| **Fecha de Vencimiento Licencia** | **Sí** | `YYYY-MM-DD` | Debe verificarse que la licencia no venza durante el transcurso del alquiler. |
| **Referencia Familiar / Teléfono** | Recomendado | `María Pérez - 809-555-0144` | Contacto de emergencia en caso de retraso no notificado o siniestro. |

---

# MÓDULO 06: CONTRATOS, FIRMA DIGITAL, QR DE AUTENTICIDAD & LEGAL

### 6.1 Objetivo del Módulo
Formalizar el arrendamiento bajo el marco legal de la **Ley No. 483** de Ventas Condicionales y Alquileres Muebles y la **Ley No. 63-17** de Movilidad y Tránsito de la República Dominicana, incorporando un código QR criptográfico SHA-256 inmutable de verificación.

### 6.2 Procedimiento de Emisión y Firma del Contrato
1. Ingresar a **Contratos** (`/contratos`) y hacer clic en **`+ Nuevo Contrato`**.
2. Seleccionar el **Cliente** y el **Vehículo Disponible**.
3. Definir la **Fecha y Hora de Salida** y la **Fecha y Hora de Retorno**.
4. Seleccionar el **Tipo de Seguro** (`Full Cover`, `Full`, `De Ley`).
5. Configurar el **Checklist de Inventario** (24 accesorios: A/C, radio, gato, goma de repuesto, micas, etc.).
6. Registrar el nivel de combustible de salida (ej. `100% (Lleno)`).
7. Marcar sobre el **Diagrama 360°** si el auto presenta rayones o abolladuras previas.
8. Presionar **`✍️ Firmar`** para abrir el lienzo táctil en pantalla y solicitar la firma digital manuscrita al cliente y al inspector.
9. Presionar **`📄 Contrato QR`** para abrir el documento oficial.
10. Presionar **`🖨️ Imprimir / Guardar PDF`** para obtener la **hoja física limpia de 1 sola página** o presionar **`💬 WhatsApp`** para despachar el enlace de verificación QR directo al teléfono del cliente.

### 6.3 Guía de Llenado Campo por Campo (Contratos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Cliente** | **Sí** | Selector | Debe estar previamente registrado y activo en el sistema. |
| **Vehículo** | **Sí** | Selector | Solo se listarán unidades en estado `DISPONIBLE`. |
| **Fecha/Hora de Inicio** | **Sí** | `YYYY-MM-DD HH:MM` | Momento exacto de entrega de la llave al cliente. |
| **Fecha/Hora de Retorno** | **Sí** | `YYYY-MM-DD HH:MM` | Momento pactado de devolución en base a períodos de 24 horas. |
| **Tarifa Diaria** | **Sí** | `50.00` | Monto diario por día de renta. Auto-cargado desde el vehículo. |
| **Depósito en Garantía** | **Sí** | `200.00`, `500.00` | Monto de fianza reembolsable que se retiene en tarjeta o efectivo. |
| **Cobros Extra / Servicios** | No | `20.00` | Cargos adicionales (ej. Conductor adicional, GPS portátil, Silla de bebé). |
| **Monto de Delivery** | No | `15.00` | Cargo por entrega en aeropuerto, hotel o domicilio fuera de la oficina. |
| **Tipo de Seguro** | **Sí** | `FULL_COVER`, `FULL`, `LEY` | Grado de cobertura ante colisión, vuelco, robo o daños a terceros. |
| **Nivel Combustible Salida** | **Sí** | `100% (Lleno)`, `75% (3/4)`, `50% (1/2)` | Nivel exacto de gasolina/diésel registrado en el tablero al salir. |
| **Checklist de Accesorios** | **Sí** | 24 Casillas de verificación | Verificación física de herramientas, repuesto, alfombras, micas y documentos. |
| **Firma Digital Cliente** | **Sí** | Trazo manuscrito en Canvas | Firma táctil capturada en pantalla o tableta con valor probatorio legal. |

---

# MÓDULO 07: ENTREGAS, DEVOLUCIONES & PROTOCOLO CHECK-IN / CHECK-OUT

### 7.1 Objetivo del Módulo
Supervisar el estado físico, mecánico y de limpieza del vehículo tanto al momento de salir de la agencia (Check-Out) como al retornar (Check-In), garantizando el cobro de penalizaciones justas ante faltantes o demoras.

### 7.2 Protocolo de Salida (Check-Out)
1. Llevar al cliente alrededor del vehículo para inspección visual conjunta.
2. Confirmar que el odómetro coincida con el contrato.
3. Verificar que el combustible coincida con el medidor gráfico.
4. Marcar en la tableta cualquier detalle estético previo (rayones o golpes menores).
5. Entregar la llave y desearle un excelente viaje.

### 7.3 Protocolo de Recepción (Check-In & Liquidación)
1. Recibir el automóvil y registrar el **Kilometraje Final (KM Llegada)**.
2. Inspeccionar el **Nivel de Combustible**:
   * *Si entrega con el mismo nivel:* No hay cargo de combustible.
   * *Si entrega con menos nivel:* Se cobra la reposición según tarifa de combustible del Rent a Car.
3. Revisar el estado de la carrocería comparando con el diagrama de salida:
   * *Si hay daños nuevos:* Se cuantifica la reparación y se retiene del depósito en garantía.
4. Verificar la **Hora de Entrega**:
   * Más de 3 horas de retraso no autorizadas: Se factura un día adicional completo.
5. Proceder a la devolución del remanente del depósito y cerrar la entrega.

---

# MÓDULO 08: CAJA, FACTURACIÓN CON NCF DOMINICANO & CONTROL DE PAGOS

### 8.1 Objetivo del Módulo
Registrar cada transacción monetaria, cobro de rentas, abonos, retención de depósitos y emisión de Comprobantes Fiscales autorizados por la DGII.

### 8.2 Estructura de Comprobantes Fiscales (NCF)
* **B01 (Crédito Fiscal):** Para empresas registradas que deducen ITBIS y gastos de ISR. (Requiere RNC válido).
* **B02 (Consumidor Final):** Para personas físicas, turistas y clientes particulares sin crédito fiscal.
* **B14 (Regímenes Especiales):** Para empresas en Zonas Francas exentas de ITBIS.
* **B15 (Gubernamental):** Para instituciones del Estado dominicano.

### 8.3 Guía de Llenado Campo por Campo (Pagos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Contrato Asociado** | **Sí** | Selector | Número de contrato que sustenta el cobro. |
| **Monto a Cobrar** | **Sí** | `150.00` | Cantidad exacta a ingresar en caja. |
| **Método de Pago** | **Sí** | `EFECTIVO`, `TARJETA`, `TRANSFERENCIA`, `STRIPE` | Medio de pago utilizado por el arrendatario. |
| **Tipo de Comprobante NCF** | **Sí** | `B01`, `B02`, `B14`, `B15` | Tipo de comprobante fiscal requerido por el cliente. |
| **RNC / Cédula Fiscal** | Obligatorio si es B01 | `1-31-88992-1` | RNC de la empresa receptora de la factura con crédito fiscal. |
| **Concepto de Pago** | **Sí** | `Pago Renta Contrato #12 + Seguro Full Cover` | Detalle claro para el recibo y auditoría contable. |

---

# MÓDULO 09: TALLER, MANTENIMIENTO PREVENTIVO & CORRECTIVO

### 9.1 Objetivo del Módulo
Controlar la vida útil de los componentes mecánicos (cambios de aceite, pastillas de freno, neumáticos, amortiguadores), planificar mantenimientos preventivos cada 5,000 km y evitar que un vehículo en mal estado sea rentado.

### 9.2 Procedimiento de Registro de Mantenimiento
1. Ingresar a **Mantenimiento** (`/mantenimiento`) y presionar **`+ Registrar Servicio`**.
2. Seleccionar el vehículo y tipo de mantenimiento (`PREVENTIVO` o `CORRECTIVO`).
3. Ingresar la descripción de los trabajos y repuestos instalados.
4. Establecer el costo total y el odómetro objetivo para el próximo servicio.
5. Al guardar, el vehículo pasará automáticamente a estado `MANTENIMIENTO` bloqueando su disponibilidad en el calendario hasta que sea finalizado.

---

# MÓDULO 10: MONITOREO GPS SATELITAL, TELEMETRÍA & CORTE DE MOTOR

### 10.1 Objetivo del Módulo
Rastrear en tiempo real la ubicación geográfica de toda la flota, supervisar velocidades, nivel de batería, estado de ignición y ejecutar el inmovilizador satelital (corte de motor remoto) ante sospecha de robo o apropiación indebida.

### 10.2 Protocolo de Apagado de Motor Remoto (Inmovilizador)
> [!CAUTION]
> El corte de motor solo debe ejecutarse con el vehículo detenido o a muy baja velocidad (<20 km/h) para evitar accidentes en autopistas, y bajo estricta autorización de la gerencia o en coordinación con la Policía Nacional / DIGESETT.

1. Ingresar a **GPS Satelital** (`/gps`).
2. Localizar el vehículo en el mapa satelital interactivo.
3. Verificar estado de ignición y velocidad actual.
4. Presionar el botón rojo **`🔒 Cortar Motor / Inmovilizar`**.
5. Confirmar el diálogo de seguridad. El sistema enviará la trama de corte al dispositivo GPS y notificará por Telegram la confirmación de inmovilización.
6. Una vez resuelto el incidente, presionar **`🔓 Reactivar Motor`** para habilitar el encendido.

---

# MÓDULO 11: EQUIPO, USUARIOS & MATRIZ DE PERMISOS

### 11.1 Objetivo del Módulo
Gestionar el personal interno de la empresa, asignando roles con permisos diferenciados para proteger la información sensible.

### 11.2 Matriz de Roles y Permisos (RBAC)
| Módulo / Acción | Administrador | Agente de Ventas | Encargado Flota | Chofer |
| :--- | :---: | :---: | :---: | :---: |
| **Configuración de Empresa** | ✅ Total | ❌ No | ❌ No | ❌ No |
| **Crear y Modificar Vehículos** | ✅ Total | 👁️ Solo Lectura | ✅ Total | ❌ No |
| **Emitir y Cobrar Contratos** | ✅ Total | ✅ Total | 👁️ Solo Lectura | ❌ No |
| **Check-In / Check-Out de Flota** | ✅ Total | ✅ Total | ✅ Total | ✅ Solo Check-Out |
| **Corte de Motor GPS** | ✅ Total | ❌ No | ❌ No | ❌ No |
| **Auditoría Legal y Vencimientos** | ✅ Total | 👁️ Solo Lectura | ✅ Total | ❌ No |

---

# MÓDULO 12: RED DE ALIADOS & SUBARRENDAMIENTO B2B

### 12.1 Objetivo del Módulo
Permitir el intercambio colaborativo de flota entre agencias Rent a Car afiliadas a RentOS cuando una sucursal tiene sobredemanda de una categoría específica (ej. Jeeps 4x4 o Vans de 12 pasajeros).

### 12.2 Procedimiento de Solicitud B2B
1. Ingresar a **Red de Aliados** (`/red-aliados`).
2. Explorar las unidades compartidas por agencias aliadas en la misma ciudad.
3. Presionar **`Solicitar Intercambio / Subarrendamiento`**.
4. La agencia propietaria recibirá la solicitud y al aprobarla, la unidad se integrará temporalmente a la flota disponible con su tarifa inter-empresa acordada.

---

# MÓDULO 13: CONFIGURACIÓN DE LA EMPRESA & PERSONALIZACIÓN DE MARCA

### 13.1 Objetivo del Módulo
Configurar la identidad visual corporativa (White-Label) de la empresa para que todos los contratos, facturas NCF y el portal web público lleven su logotipo, colores, eslogan y datos de contacto.

### 13.2 Guía de Llenado Campo por Campo (Configuración)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre Comercial** | **Sí** | `Caribe Car Rental, SRL` | Razón social o nombre público del Rent a Car. |
| **RNC** | **Sí** | `1-31-99283-1` | Registro Nacional de Contribuyentes para encabezados legales. |
| **Teléfono & WhatsApp** | **Sí** | `8095550199` | Número directo al que los clientes escribirán para reservar autos. |
| **Logotipo Oficial** | Recomendado | Archivo PNG/JPG o URL | Logotipo que aparecerá arriba a la izquierda en los contratos impresos y catálogo web. |
| **Color Primario** | **Sí** | Selector de color `#1e3a8a` | Color predominante en botones, encabezados y catálogo web. |
| **Moneda Predeterminada** | **Sí** | `USD` o `DOP` | Moneda estándar utilizada para cotizaciones y cobros. |
| **Plantilla de Contrato** | **Sí** | `OFICIAL_DOMINICANA` o `PERSONALIZADA` | Permite elegir entre el marco estándar dominicano bajo Ley 483 / 63-17 o cláusulas redactadas a medida por la empresa. |

---

# MÓDULO 14: CATÁLOGO PÚBLICO DE RESERVAS WEB PARA CLIENTES FINALES

### 14.1 Objetivo del Módulo
Canal público de captación en línea (`/reservar?rentcar=:id`) que permite a turistas y clientes locales explorar la flota con fotos en alta calidad, consultar especificaciones mecánicas detalladas al dar clic en los vehículos, cotizar por fechas y reservar directamente con despacho a WhatsApp.

### 14.2 Flujo de Experiencia del Cliente Final
1. El cliente ingresa al enlace público proporcionado por la agencia (o escaneado de publicidad/redes).
2. Selecciona las **Fechas de Retiro y Devolución** en el buscador superior.
3. Puede filtrar por marca o categoría (*Sedán, SUV, Compacto, 4x4, Van, Lujo*).
4. **Al hacer clic en cualquier vehículo**, se abre la **Ficha Técnica & Galería** con:
   * Foto en gran formato.
   * Insignias de Asientos, Maletas, Transmisión, Combustible y A/C.
   * Lista de equipamiento (Bluetooth, Pantalla, Cámara de reversa, Airbags, etc.).
   * Desglose del costo total estimado en la moneda de la empresa.
5. El cliente puede presionar **`⚡ Reservar Este Auto`** para completar su nombre, teléfono y extras opcionales (*Seguro Full Cover, Silla para bebé, Conductor adicional*), o presionar **`💬 Consultar por WhatsApp`** para chatear directamente con el Rent a Car.

---

# MÓDULO 15: PORTAL PÚBLICO DE VERIFICACIÓN DE CONTRATOS QR

### 15.1 Objetivo del Módulo
Portal de validación pública accesible sin necesidad de iniciar sesión (`/verificar/:codigo`), permitiendo a las autoridades de tránsito (DIGESETT, Policía Nacional), aseguradoras o a los propios clientes escanear con la cámara del celular el código QR impreso en el contrato y certificar su legitimidad en tiempo real.

### 15.2 Elementos de Seguridad del Portal de Verificación
* **Sello Verde de Autenticidad:** Confirma que el contrato está formalmente registrado en la base de datos de RentOS.
* **Hash Criptográfico SHA-256 Inmutable:** Certifica que los datos del cliente, vehículo y fechas no han sido alterados ni falsificados en papel.
* **Datos Mostrados:**
  * Número de Contrato oficial.
  * Empresa Rent a Car emisora.
  * Arrendatario y documento de identidad enmascarado.
  * Vehículo, marca, modelo, año y placa oficial.
  * Período de vigencia de la renta.
  * Estado operativo actual del contrato.

---

## 📌 GUÍA PARA INCORPORAR NUEVAS MEJORAS AL MANUAL

Cuando el equipo desarrolle una nueva funcionalidad o modifique un flujo existente:
1. Localizar el módulo afectado en este archivo (`docs/MANUAL_DE_PROCEDIMIENTOS.md`).
2. Si se agregaron nuevos campos en la base de datos o pantalla, agregarlos a la **Tabla de Llenado Campo por Campo** indicando: Nombre, Obligatoriedad, Formato y Regla de Negocio.
3. Actualizar la tabla de **Control de Versiones** en el encabezado con el nuevo número de versión, fecha y resumen de cambios.
