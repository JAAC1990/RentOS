# 📘 MANUAL DE PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (POE / SOP)
# SISTEMA DE GESTIÓN INTEGRAL RentOS (Multi-Tenant Enterprise SaaS)
## 👑 GUÍA DE OPERACIÓN, SUPERVISIÓN & GOBERNANZA PARA ADMINISTRADORES Y SUPERADMINISTRADORES

**Código del Documento:** `MPO-RENTOS-2026-ADM-V2`  
**Versión del Manual:** 2.0 (Edición Directiva y Gerencial - Ajustable)  
**Destinatarios Principales:** 
* 🌐 **SuperAdministrador:** Dirección General de la Plataforma SaaS RentOS.
* 🏢 **Administrador de Rent a Car:** Dueños de Negocio, Gerentes Generales y Encargados de Operaciones de cada Agencia.  
**Ámbito Legal:** República Dominicana (DGII, DIGESETT, Ley No. 483 y Ley No. 63-17) y Estándares Internacionales de Arrendamiento.  
**Estado:** Activo, Modular y Ajustable ante Nuevas Mejoras.

---

## 📑 CONTROL DE VERSIONES & REGISTRO DE CAMBIOS (CHANGELOG)

Este manual es un documento vivo y **ajustable**. Cada vez que se incorpore una nueva función, módulo o mejora en RentOS, debe actualizarse la tabla inferior y la sección correspondiente.

| Versión | Fecha | Módulos Modificados | Descripción de la Modificación | Autorización |
| :---: | :---: | :--- | :--- | :---: |
| **1.0** | 2026-08-20 | Módulos 1 al 10 | Creación inicial del manual operativo estándar. | Depto. Tecnología |
| **1.5** | 2026-08-23 | Contratos & Facturación | Integración de Comprobantes Fiscales NCF dominicanos y firmas digitales táctiles. | Asesoría Legal / IT |
| **2.0** | 2026-08-24 | Todos los Módulos (1 al 15) | Guía exhaustiva campo por campo, matriz de gobernanza para Administrador y SuperAdministrador, contrato oficial con QR inmutable, fotos clicables y catálogo web. | Dirección RentOS |

---

## 👑 MARCO DE GOBERNANZA & MATRIZ DE RESPONSABILIDADES (RACI)

```
                       ┌─────────────────────────────────────┐
                       │        SUPERADMINISTRADOR           │
                       │  (Control Global Plataforma SaaS)   │
                       └──────────────────┬──────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │  ADMINISTRADOR RENTCAR │                      │  ADMINISTRADOR RENTCAR │
     │  (Agencia Santo Dgo)   │                      │  (Agencia Punta Cana)  │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
     ┌────────────┴───────────┐                      ┌────────────┴───────────┐
     ▼                        ▼                      ▼                        ▼
┌─────────┐              ┌─────────┐            ┌─────────┐              ┌─────────┐
│ ASESOR  │              │ MECÁNICO│            │ ASESOR  │              │ MECÁNICO│
│ VENTAS  │              │ / TALLER│            │ VENTAS  │              │ / TALLER│
└─────────┘              └─────────┘            └─────────┘              └─────────┘
```

| Módulo / Proceso Operativo | SuperAdministrador (SaaS) | Administrador de RentCar (Agencia) | Personal Operativo (Ventas/Taller) |
| :--- | :---: | :---: | :---: |
| **Aprobación de Nuevas Empresas / Tenants** | **R / A (Exclusivo)** | I | I |
| **Configuración de Marca (Logo, Moneda, WhatsApp)** | I | **R / A (Exclusivo)** | C |
| **Definición de Plantilla de Contrato & Cláusulas** | C | **R / A (Exclusivo)** | I |
| **Alta y Edición de Flota (Fichas Técnicas & Fotos)** | I | **A** | **R** |
| **Auditoría Legal (Seguros, Marbetes, Revistas)** | I | **R / A** | C |
| **Planificación de Flota y Control de Overbooking** | I | **A** | **R** |
| **Alta de Clientes y Buró de Crédito** | I | **A** | **R** |
| **Emisión, Firma Digital y Verificación QR Contratos** | I | **A** | **R** |
| **Check-In / Check-Out e Inspección de Daños** | I | **A** | **R** |
| **Facturación Fiscal con NCF (B01, B02, B14, B15)** | I | **R / A** | **R** |
| **Liquidación y Devolución de Depósitos en Garantía** | I | **R / A (Exclusivo)** | C |
| **Aprobación de Trabajos de Taller y Costos** | I | **R / A (Exclusivo)** | **R** |
| **Corte de Motor GPS Remoto (Inmovilizador)** | **A (Auditoría)** | **R / A (Exclusivo)** | ❌ No Autorizado |
| **Creación de Usuarios y Asignación de Roles** | **R (Creación Admins)** | **R (Creación Empleados)**| ❌ No Autorizado |
| **Subarrendamiento en Red de Aliados B2B** | I | **R / A (Exclusivo)** | C |

*(**R**: Responsable de Ejecutar | **A**: Aprueba y Autoriza | **C**: Consultado | **I**: Informado)*

---

# MÓDULO 00: PROCEDIMIENTOS EXCLUSIVOS DEL SUPERADMINISTRADOR

### 0.1 Objetivo del SuperAdministrador
Gobernar la infraestructura global de la plataforma, verificar la autenticidad jurídica de las empresas solicitantes, asegurar el aislamiento de datos multi-tenant y monitorizar la salud del servidor.

### 0.2 Procedimiento de Onboarding y Aprobación de Empresas
1. Ingresar a la consola en `/solicitudes` o `/empresas`.
2. **Auditoría Jurídica y Fiscal:**
   * Verificar en el portal de la DGII que el RNC ingresado pertenezca a la razón social declarada.
   * Confirmar teléfono comercial y correo institucional del representante legal.
3. Presionar **`✅ Autorizar Empresa`**:
   * El sistema genera automáticamente el espacio aislado (Tenant ID).
   * Se crea la cuenta del **Administrador de Rent a Car** con rol directivo.
   * Se habilitan los módulos contratados y se envía el correo de bienvenida.
4. En caso de inconsistencias o sospecha de fraude, presionar **`🔴 Rechazar Solicitud`** especificando el motivo.

### 0.3 Supervisión de Seguridad y Respaldo de Base de Datos
* **Aislamiento Multi-Tenant:** Ninguna agencia puede acceder a vehículos, clientes ni contratos de otra empresa.
* **Respaldos Automáticos:** Verificar que las copias de seguridad de PostgreSQL se ejecuten diariamente.

---

# MÓDULO 01: INICIO DE SESIÓN & CONTROL DE ACCESO DIRECTIVO

### 1.1 Objetivo del Módulo
Garantizar el acceso seguro y autenticado a la administración de la sucursal.

### 1.2 Responsabilidad del Administrador
* Gestionar las contraseñas de su equipo de colaboradores.
* Forzar el cierre de sesión inmediato ante desvinculación de un empleado.

### 1.3 Guía de Llenado de Campos (Login)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Correo Electrónico** | **Sí** | `admin@miempresa.com` | Correo asignado por la gerencia. |
| **Contraseña** | **Sí** | Mínimo 6 caracteres | Clave confidencial. No debe compartirse entre turnos. |
| **Selector de Tema** | No | `Claro` / `Oscuro` | Ajuste ergonómico para uso en mostrador diurno o nocturno. |

---

# MÓDULO 02: PANEL DE CONTROL GERENCIAL (DASHBOARD)

### 2.1 Objetivo del Módulo
Monitorear las métricas clave de rendimiento (KPI), ingresos diarios/mensuales, tasa de ocupación de la flota y alertas legales preventivas.

### 2.2 Indicadores Clave de Gestión (KPIs)
* **Tasa de Ocupación Flota (%):** `(Vehículos Alquilados / Flota Total) * 100`. (Meta gerencial: > 75%).
* **Ingresos Brutos del Mes:** Recaudación acumulada por tarifas, cobros extra, delivery y seguros.
* **Unidades en Mantenimiento:** Autos detenidos que generan costo de oportunidad.
* **Monitor Preventivo de Seguros:** Lista de pólizas y marbetes con menos de 30 días para su vencimiento.

---

# MÓDULO 03: GESTIÓN DE FLOTA, FICHAS TÉCNICAS & AUDITORÍA LEGAL

### 3.1 Objetivo del Módulo
Administrar el catálogo de automóviles, garantizando que cada vehículo cuente con su ficha técnica para el cliente final y su documentación legal al día (Seguro y Marbete DGII).

### 3.2 Procedimiento de Alta y Modificación de Vehículos
1. Ingresar a **Vehículos** (`/vehiculos`) y hacer clic en **`+ Nuevo Vehículo`**.
2. Llenar cada uno de los campos obligatorios y técnicos.
3. Subir la **Fotografía del Vehículo** (PNG/JPG desde el PC o enlace web).
4. Registrar los datos del seguro y marbete.
5. Hacer clic en **`Registrar Vehículo`**.

### 3.3 Guía de Llenado Campo por Campo (Vehículos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Fotografía Principal** | **Recomendado** | Imagen PNG/JPG o URL | Foto real del vehículo que se mostrará al cliente en el catálogo público web y en la ficha interactiva. |
| **Marca** | **Sí** | `Toyota`, `Hyundai`, `Kia`, `Ford` | Fabricante del vehículo según matrícula oficial. |
| **Modelo** | **Sí** | `Corolla LE`, `Tucson 4WD`, `Sportage` | Versión comercial exacta. |
| **Año** | **Sí** | `2024`, `2025` | Año de fabricación (Rango: 1990 a Año actual + 2). |
| **Color** | No | `Blanco Perlado`, `Gris Plata`, `Negro` | Color exterior predominante. |
| **Placa / Matrícula** | **Sí** | `A123456`, `G771144` | Matrícula oficial dominicana. Es única en el sistema. |
| **No. Chasis / VIN** | No | 17 caracteres | Número de serie grabado. Imprescindible para reclamos de seguro y reporte de robo. |
| **Categoría** | **Sí** | `SEDAN`, `SUV`, `COMPACTO`, `CAMIONETA`, `VAN`, `LUJO` | Segmento vehicular. Filtro principal en la web de reservas. |
| **Transmisión** | **Sí** | `AUTOMATICA` o `MANUAL` | Tipo de caja de cambios. |
| **Combustible** | **Sí** | `GASOLINA`, `DIESEL`, `HIBRIDO`, `ELECTRICO` | Carburante que debe suministrarse. |
| **Pasajeros** | **Sí** | `5`, `7`, `12` | Número máximo de ocupantes con cinturón de seguridad. |
| **Capacidad Maletas** | **Sí** | `2`, `3`, `5` | Número de maletas grandes de viaje. |
| **Puertas** | **Sí** | `4`, `5`, `2` | Cantidad de puertas de acceso. |
| **Aire Acondicionado** | **Sí** | `Sí (Con Climatizador A/C)` | Estado operativo del A/C. |
| **Odómetro Inicial (km)** | **Sí** | `15420` | Kilometraje real que marca el tablero al ingresar la unidad. |
| **Tarifa Diaria** | **Sí** | `45.00`, `60.00` | Precio base por día de 24 horas (en moneda corporativa). |
| **Estado Operativo** | **Sí** | `DISPONIBLE`, `ALQUILADO`, `MANTENIMIENTO`, `INACTIVO` | Estado inicial del auto (por defecto `DISPONIBLE`). |
| **Póliza de Seguro** | **Recomendado** | `Seguros Universal #UN-992288` | Aseguradora y número de contrato de seguro. |
| **Vencimiento Seguro** | **Recomendado** | `YYYY-MM-DD` | Fecha de expiración de la póliza. Alerta preventiva a 30 días. |
| **Vencimiento Marbete** | **Recomendado** | `YYYY-MM-DD` | Fecha límite del impuesto de circulación DGII. |

---

# MÓDULO 04: CALENDARIO DE FLOTA & CONTROL DE DISPONIBILIDAD GANTT

### 4.1 Objetivo del Módulo
Planificar el uso de la flota en el tiempo, evitar la doble reserva (*overbooking*) y coordinar salidas y llegadas de vehículos.

### 4.2 Supervisión Gerencial del Calendario
* Verificar que no existan huecos de inactividad prolongada entre contratos consecutivos.
* Coordinar con el taller los días de mantenimiento preventivo para que se reflejen como bloqueos en color gris.

---

# MÓDULO 05: GESTIÓN DE CLIENTES, DOCUMENTOS & BURÓ DE CRÉDITO

### 5.1 Objetivo del Módulo
Registrar y calificar a los arrendatarios nacionales y extranjeros, validando su historial crediticio y archivando copias digitales de sus documentos oficiales.

### 5.2 Guía de Llenado Campo por Campo (Clientes)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre** | **Sí** | `Juan Carlos` | Primer y segundo nombre según cédula o pasaporte. |
| **Apellido** | **Sí** | `Pérez Morales` | Apellidos completos del cliente. |
| **Teléfono / WhatsApp** | **Sí** | `+1 (809) 555-0199` | Teléfono directo con código de país para envío del contrato digital. |
| **Correo Electrónico** | No | `juan.perez@email.com` | Correo para envío de factura NCF y confirmaciones. |
| **Dirección Residencial** | **Recomendado** | `Calle Las Palmas #12, Santo Domingo` | Dirección donde reside (o nombre de hotel si es turista). |
| **No. Cédula / Pasaporte** | **Sí** | `402-1234567-8` o `P8472910` | Documento de identidad oficial y vigente. |
| **No. Licencia Conducir** | **Sí** | `DO-40212345678` | Licencia vigente para la categoría del vehículo rentado. |
| **Vencimiento Licencia** | **Sí** | `YYYY-MM-DD` | No se puede rentar si la licencia vence durante el contrato. |
| **Referencia Familiar** | **Recomendado** | `María Pérez - 809-555-0144` | Contacto de emergencia en caso de demora o siniestro. |

---

# MÓDULO 06: CONTRATOS, FIRMA DIGITAL, QR DE AUTENTICIDAD & LEGAL

### 6.1 Objetivo del Módulo
Formalizar el contrato de alquiler bajo el marco legal de la **Ley No. 483** y **Ley No. 63-17** de la República Dominicana, asegurando la validez jurídica, el cobro del depósito de garantía y la autenticidad inmutable mediante código QR SHA-256.

### 6.2 Procedimiento de Emisión y Firma del Contrato
1. Ingresar a **Contratos** (`/contratos`) y presionar **`+ Nuevo Contrato`**.
2. Seleccionar el **Cliente** y el **Vehículo Disponible**.
3. Definir las **Fechas y Horas de Salida y Retorno** (calcula días exactos de 24h).
4. Seleccionar el **Tipo de Seguro** (`Full Cover`, `Full`, `De Ley`).
5. Completar el **Checklist de Inventario** (24 accesorios de seguridad y confort).
6. Indicar el **Nivel de Combustible de Salida** (ej. `100% (Lleno)`).
7. Marcar daños previos en el **Diagrama 360°** si los hubiere.
8. Presionar **`✍️ Firmar`** para capturar la firma táctil digital del cliente y del inspector en pantalla.
9. Presionar **`📄 Contrato QR`** para abrir el documento oficial.
10. Presionar **`🖨️ Imprimir / Guardar PDF`** para imprimir la **hoja física limpia de 1 sola página** o **`💬 WhatsApp`** para enviar el enlace de verificación al cliente.

### 6.3 Guía de Llenado Campo por Campo (Contratos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Cliente & Vehículo** | **Sí** | Selectores | Vinculación del cliente activo y vehículo disponible. |
| **Fecha/Hora Salida & Retorno** | **Sí** | `YYYY-MM-DD HH:MM` | Período pactado de arrendamiento (bloques de 24h). |
| **Tarifa Diaria** | **Sí** | `50.00` | Monto diario por día de renta. |
| **Depósito en Garantía** | **Sí** | `200.00`, `500.00` | Fianza reembolsable que se retiene en tarjeta o efectivo. |
| **Cobros Extra / Servicios** | No | `20.00` | Extras (Conductor adicional, Silla de bebé, GPS portátil). |
| **Monto de Delivery** | No | `15.00` | Cargo por entrega en aeropuerto o domicilio fuera de sucursal. |
| **Tipo de Seguro** | **Sí** | `FULL_COVER`, `FULL`, `LEY` | Nivel de protección ante colisión, robo o daños a terceros. |
| **Nivel Combustible Salida** | **Sí** | `100% (Lleno)`, `75% (3/4)` | Nivel registrado al salir. El cliente debe devolver con el mismo nivel. |
| **Checklist 24 Accesorios** | **Sí** | Casillas | Verificación física de herramientas, gato, repuesto, micas y documentos. |
| **Firma Digital Cliente** | **Sí** | Trazo manuscrito | Firma táctil capturada en pantalla con valor legal vinculante. |

---

# MÓDULO 07: ENTREGAS, DEVOLUCIONES & PROTOCOLO CHECK-IN / CHECK-OUT

### 7.1 Objetivo del Módulo
Supervisar el estado físico, mecánico y de limpieza del vehículo en el Check-Out (Salida) y Check-In (Retorno), liquidando daños, faltante de combustible o demoras de entrega.

### 7.2 Reglas de Liquidación en Recepción (Check-In)
* **Faltante de Combustible:** Si el auto retorna con menor nivel al de salida, se cobra el galón faltante con el recargo administrativo de la agencia.
* **Exceso de Kilometraje:** Si el contrato no incluye kilometraje ilimitado, se cobra el excedente según la tarifa por km pactada.
* **Tolerancia de Retraso:** Hasta 59 minutos sin recargo; de 1 a 3 horas se cobra tarifa por hora extra; más de 3 horas genera el cobro de 1 día completo adicional.

---

# MÓDULO 08: CAJA, FACTURACIÓN CON NCF DOMINICANO & CONTROL DE PAGOS

### 8.1 Objetivo del Módulo
Registrar cada cobro de renta, depósito y emitir Comprobantes Fiscales autorizados por la Dirección General de Impuestos Internos (DGII).

### 8.2 Estructura de Comprobantes Fiscales (NCF)
* **B01 (Crédito Fiscal):** Para empresas registradas en DGII que deducen ITBIS y gastos de ISR (Requiere RNC válido).
* **B02 (Consumidor Final):** Para personas físicas, turistas y clientes particulares sin crédito fiscal.
* **B14 (Regímenes Especiales):** Para empresas en Zonas Francas exentas de ITBIS.
* **B15 (Gubernamental):** Para entidades del Estado dominicano.

### 8.3 Guía de Llenado Campo por Campo (Pagos)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Contrato Asociado** | **Sí** | Selector | Número de contrato que origina el cobro. |
| **Monto a Cobrar** | **Sí** | `150.00` | Importe exacto ingresado en caja. |
| **Método de Pago** | **Sí** | `EFECTIVO`, `TARJETA`, `TRANSFERENCIA`, `STRIPE` | Medio de pago utilizado por el cliente. |
| **Tipo de NCF** | **Sí** | `B01`, `B02`, `B14`, `B15` | Tipo de comprobante solicitado por el cliente. |
| **RNC / Cédula Fiscal** | **Obligatorio si es B01** | `1-31-88992-1` | RNC de la empresa receptora con crédito fiscal. |
| **Concepto de Pago** | **Sí** | `Pago Renta Contrato #12 + Seguro Full Cover` | Detalle claro para el recibo y auditoría contable. |

---

# MÓDULO 09: TALLER, MANTENIMIENTO PREVENTIVO & CORRECTIVO

### 9.1 Objetivo del Módulo
Controlar la vida útil de los componentes mecánicos, planificar cambios de aceite cada 5,000 km y registrar los costos de reparación para calcular el costo operativo por kilómetro.

### 9.2 Procedimiento de Aprobación de Taller
1. El mecánico o encargado de flota ingresa el presupuesto y repuestos en `/mantenimiento`.
2. El **Administrador de Rent a Car** revisa el costo estimado y autoriza la orden de trabajo.
3. El vehículo pasa a estado `MANTENIMIENTO` quedando bloqueado en el calendario.
4. Al finalizar la reparación, se registra la factura del taller y el auto vuelve a estado `DISPONIBLE`.

---

# MÓDULO 10: MONITOREO GPS SATELITAL, TELEMETRÍA & CORTE DE MOTOR

### 10.1 Objetivo del Módulo
Supervisar la ubicación geográfica en tiempo real, velocímetro, estado de ignición y ejecutar la inmovilización satelital remota ante hurto, apropiación indebida o falta de pago no justificada.

### 10.2 Protocolo de Seguridad para Corte de Motor Remoto
> [!CAUTION]
> **AUTORIZACIÓN EXCLUSIVA DE GERENCIA / ADMINISTRADOR:**
> 1. Verificar en el mapa satelital que el vehículo se encuentre **DETENIDO o a velocidad inferior a 20 km/h** para evitar accidentes de tránsito en carreteras o autopistas.
> 2. Presionar el botón rojo **`🔒 Cortar Motor / Inmovilizar`** e ingresar la confirmación.
> 3. El sistema transmitirá la trama de inmovilización al dispositivo GPS satelital y enviará una alerta automática al canal de Telegram de la gerencia.
> 4. Coordinar la recuperación física con las autoridades competentes (DIGESETT / Policía Nacional).
> 5. Tras la recuperación, presionar **`🔓 Reactivar Motor`** para habilitar el encendido del vehículo.

---

# MÓDULO 11: EQUIPO, USUARIOS & MATRIZ DE PERMISOS (RBAC)

### 11.1 Objetivo del Módulo
Administrar el personal de la empresa y definir sus privilegios de acceso al sistema.

### 11.2 Matriz de Roles y Privilegios
* **SuperAdministrador (Plataforma):** Acceso total a todos los tenants, base de datos y auditoría global.
* **Administrador de Rent a Car:** Control total de su propia empresa, configuración de marca, finanzas, corte de motor GPS y usuarios.
* **Asesor de Ventas / Cajero:** Registro de clientes, emisión de contratos, cobro de pagos y check-out de vehículos.
* **Encargado de Flota / Mecánico:** Registro de mantenimientos, inspección de daños y actualización de odómetros.
* **Chofer / Delivery:** Visualización de entregas asignadas y recepción de firmas en entrega.

---

# MÓDULO 12: RED DE ALIADOS & SUBARRENDAMIENTO B2B

### 12.1 Objetivo del Módulo
Intercambiar flota entre agencias afiliadas a RentOS cuando una sucursal carece de disponibilidad para atender a un cliente, generando comisiones de subarrendamiento inter-empresas.

### 12.2 Procedimiento de Aprobación B2B
* El Administrador de la agencia solicitante envía el requerimiento a la agencia proveedora con la tarifa pactada.
* Al ser aceptada, el vehículo se integra a la flota disponible temporal con liquidación financiera automática entre ambas empresas.

---

# MÓDULO 13: CONFIGURACIÓN DE LA EMPRESA & PERSONALIZACIÓN WHITE-LABEL

### 13.1 Objetivo del Módulo
Configurar la identidad visual y legal de la empresa para que todos los contratos, facturas y portal público de reservas reflejen su marca corporativa.

### 13.2 Guía de Llenado Campo por Campo (Configuración)
| Campo | Obligatorio | Formato / Ejemplo | Explicación & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre Comercial** | **Sí** | `Caribe Car Rental, SRL` | Razón social o nombre público del Rent a Car. |
| **RNC** | **Sí** | `1-31-99283-1` | RNC de la empresa registrado en la DGII. |
| **Teléfono & WhatsApp** | **Sí** | `8095550199` | Número directo al que los clientes escribirán para reservar autos. |
| **Logotipo Oficial** | **Recomendado** | Archivo PNG/JPG o URL | Logotipo que aparecerá arriba a la izquierda en los contratos impresos y catálogo web. |
| **Color Primario** | **Sí** | Selector `#1e3a8a` | Color predominante en botones, encabezados y catálogo web. |
| **Moneda Predeterminada** | **Sí** | `USD` o `DOP` | Moneda estándar utilizada para cotizaciones y cobros. |
| **Plantilla de Contrato** | **Sí** | `OFICIAL_DOMINICANA` o `PERSONALIZADA` | Permite elegir entre el marco estándar dominicano bajo Ley 483 / 63-17 o cláusulas redactadas a medida por la empresa. |

---

# MÓDULO 14: CATÁLOGO PÚBLICO DE RESERVAS WEB PARA CLIENTES FINALES

### 14.1 Objetivo del Módulo
Portal de autoservicio para turistas y clientes en línea (`/reservar?rentcar=:id`).

### 14.2 Características Principales
* **Fotos Clicables:** Al hacer clic en cualquier vehículo, se despliega la **Ficha Técnica en Gran Formato** con especificaciones mecánicas (*Pasajeros, Maletas, Transmisión, Combustible, A/C, Seguridad*).
* **Cotizador en Vivo:** Calcula automáticamente el importe total de renta según las fechas seleccionadas.
* **Despacho a WhatsApp:** Los clientes pueden enviar su reserva directa al número corporativo configurado por la gerencia.

---

# MÓDULO 15: PORTAL PÚBLICO DE VERIFICACIÓN DE CONTRATOS QR

### 15.1 Objetivo del Módulo
Portal público de validación inmediata (`/verificar/:codigo`) accesible desde cualquier teléfono inteligente.

### 15.2 Mecanismo de Seguridad Criptográfica
* Al escanear el código QR impreso en el contrato, el sistema consulta el registro original y valida el **Hash Criptográfico SHA-256**.
* Muestra el **Sello Verde de Contrato Auténtico**, garantizando a la Policía Nacional, DIGESETT y aseguradoras que el documento en papel no ha sido adulterado.

---

## 🔧 PROCEDIMIENTO PARA AJUSTAR Y ACTUALIZAR ESTE MANUAL
1. Abrir [`docs/MANUAL_DE_PROCEDIMIENTOS.md`](file:///c:/Users/J.Gabriel/Documents/RentOS/docs/MANUAL_DE_PROCEDIMIENTOS.md).
2. Ubicar el módulo que ha recibido la nueva funcionalidad o campo.
3. Actualizar la tabla de diccionario de campos correspondiente.
4. Incrementar el número de versión en el encabezado (ej. `v2.1`) y registrar la fecha y descripción del cambio en la tabla de **Control de Versiones**.
