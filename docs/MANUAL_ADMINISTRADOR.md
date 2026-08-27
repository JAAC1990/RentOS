# 📘 MANUAL INTEGRAL DE FUNCIONALIDADES & PROCEDIMIENTOS OPERATIVOS (SOP)
# PARA ADMINISTRADORES DE RENT A CAR — RentOS v2.0

**Código del Documento:** `MAN-ADM-RENTOS-V2`  
**Destinatarios:** Dueños de Negocio, Gerentes Generales, Encargados de Operaciones y Agentes de Mostrador.  
**Sistema:** RentOS Multi-Tenant Enterprise SaaS  
**Ámbito Normativo:** República Dominicana (DGII, DIGESETT, Ley No. 483 y Ley No. 63-17) y Estándares Internacionales.  
**Estado:** Documento Vivo, Modular y Ajustable.

---

## 📑 CONTROL DE VERSIONES & REGISTRO DE CAMBIOS (CHANGELOG)

*Este manual debe actualizarse obligatoriamente cada vez que se agregue, modifique o elimine una funcionalidad en RentOS.*

| Versión | Fecha | Sección / Módulos Actualizados | Descripción de la Modificación | Responsable |
| :---: | :---: | :--- | :--- | :---: |
| **1.0** | 2026-08-20 | Módulos Base | Publicación inicial del manual operativo de agencia. | Depto. Tecnología |
| **1.5** | 2026-08-23 | Contratos & Facturación | Integración de Comprobantes Fiscales NCF (DGII) y firmas digitales. | Asesoría Legal / IT |
| **2.0** | 2026-08-24 | Todos los Módulos (1 al 15) | Guía exhaustiva de funcionalidades y llenado campo por campo, fotos clicables, QR inmutable y reservas web. | Dirección RentOS |
| **2.1** | 2026-08-24 | Flota & Vehículos | Validación estricta de Placa (hasta 8 caracteres con guion), Año (exacto 4 dígitos) y Switch conversor USD ⇄ DOP en tiempo real. | Operaciones RentOS |
| **2.2** | 2026-08-25 | Global / Todos los Módulos | Estandarización obligatoria del formato de fechas a **Día / Mes / Año (DD/MM/AAAA)** en todas las vistas, tablas, contratos, reportes de inspección, WhatsApp y exportaciones. | Dirección RentOS |
| **2.3** | 2026-08-26 | Clientes & Teléfonos | Validación estricta de teléfonos por país: límite máximo de **10 dígitos para República Dominicana (809/829/849)** con máscara de guiones automática e impedimento de números incompletos. | Seguridad & Datos |
| **2.4** | 2026-08-26 | Pagos, Contratos & Monedas | Conmutador universal de moneda **Dólares (US$) ⇄ Pesos Dominicanos (RD$)** con cálculo en tiempo real en todos los cobros, contratos, depósitos y tarifas. Teléfono de referencia familiar con formato y guiones automáticos. | Operaciones & Finanzas |
| **2.5** | 2026-08-27 | Módulo de Contabilidad & Finanzas | Lanzamiento del **Módulo Integral de Contabilidad (`/contabilidad`)**: Estado de Resultados (P&L), análisis financiero por cliente (cuánto gastó y en qué), ROI de flota por vehículo, registro de egresos operativos y emisión de Estados de Cuenta imprimibles en PDF. | Dirección Financiera / IT |

---

## 🧭 ÍNDICE GENERAL DEL MANUAL DE ADMINISTRADOR

### PARTE I: MANUAL DE FUNCIONALIDADES (¿Cómo funciona y para qué sirve cada cosa?)
1. [Arquitectura & Flujo General de RentOS](#1-arquitectura--flujo-general-de-rentos)
2. [Módulo 01: Panel de Control & Métricas Clave (Dashboard)](#módulo-01-panel-de-control--métricas-clave-dashboard)
3. [Módulo 02: Gestión de Flota & Fichas Técnicas](#módulo-02-gestión-de-flota--fichas-técnicas)
4. [Módulo 03: Calendario de Flota & Disponibilidad Gantt](#módulo-03-calendario-de-flota--disponibilidad-gantt)
5. [Módulo 04: Gestión de Clientes, Documentos & Buró](#módulo-04-gestión-de-clientes-documentos--buró)
6. [Módulo 05: Contratos, Firma Digital & QR de Autenticidad](#módulo-05-contratos-firma-digital--qr-de-autenticidad)
7. [Módulo 06: Entregas, Devoluciones & Protocolo Check-In / Check-Out](#módulo-06-entregas-devoluciones--protocolo-check-in--check-out)
8. [Módulo 07: Caja, Facturación con NCF Dominicano & Control de Pagos](#módulo-07-caja-facturación-con-ncf-dominicano--control-de-pagos)
9. [Módulo 08: Contabilidad, Finanzas & Estado de Resultados (P&L)](#módulo-08-contabilidad-finanzas--estado-de-resultados-pl)
10. [Módulo 09: Taller, Mantenimiento Preventivo & Correctivo](#módulo-09-taller-mantenimiento-preventivo--correctivo)
11. [Módulo 10: Monitoreo GPS Satelital, Telemetría & Corte de Motor](#módulo-10-monitoreo-gps-satelital-telemetría--corte-de-motor)
12. [Módulo 11: Equipo, Usuarios & Matriz de Permisos](#módulo-11-equipo-usuarios--matriz-de-permisos)
13. [Módulo 12: Red de Aliados & Subarrendamiento B2B](#módulo-12-red-de-aliados--subarrendamiento-b2b)
14. [Módulo 13: Configuración de Marca White-Label](#módulo-13-configuración-de-marca-white-label)
15. [Módulo 14: Portal Público de Reservas Web para Clientes](#módulo-14-portal-público-de-reservas-web-para-clientes)
16. [Módulo 15: Portal Público de Verificación de Contratos QR](#módulo-15-portal-público-de-verificación-de-contratos-qr)

### PARTE II: MANUAL DE PROCEDIMIENTOS OPERATIVOS (Guía de Llenado Campo por Campo)
* [Guía de Llenado de Vehículos](#guía-de-llenado-de-vehículos)
* [Guía de Llenado de Clientes](#guía-de-llenado-de-clientes)
* [Guía de Llenado de Contratos](#guía-de-llenado-de-contratos)
* [Guía de Llenado de Pagos y Comprobantes Fiscales NCF](#guía-de-llenado-de-pagos-y-comprobantes-fiscales-ncf)
* [Guía de Llenado de Mantenimientos](#guía-de-llenado-de-mantenimientos)
* [Guía de Configuración de Empresa](#guía-de-configuración-de-empresa)

---

# PARTE I: MANUAL DE FUNCIONALIDADES

## 1. ARQUITECTURA & FLUJO GENERAL DE RENTOS
RentOS es una plataforma integral diseñada para optimizar todas las fases operativas de un Rent a Car moderno:
1. **Captación:** A través del catálogo web público (`/reservar?rentcar=:id`).
2. **Validación:** Registro de cliente, documentos de identidad y consulta de solvencia en buró.
3. **Formalización:** Emisión de contrato con marco legal dominicano (Ley 483 / 63-17), odómetros, checklist de 24 accesorios, medidor de combustible, firma digital en pantalla y código QR criptográfico inmutable.
4. **Operación:** Despacho físico con inspección 360°, monitoreo por GPS satelital con apagado de motor remoto ante robo.
5. **Cobro & Facturación:** Registro de abonos, retención de depósitos y emisión de Comprobantes Fiscales NCF (B01, B02, B14, B15).
6. **Mantenimiento:** Programación de servicios de taller cada 5,000 km y auditoría de vencimiento de seguros y marbetes DGII.

---

## MÓDULO 01: PANEL DE CONTROL & MÉTRICAS CLAVE (DASHBOARD)
* **¿Para qué sirve?** Ofrece al administrador una visión panorámica instantánea del estado de su negocio en tiempo real.
* **¿Cómo funciona?**
  * **Tarjetas de KPI:** Muestra la Flota Total, Unidades Disponibles, Unidades Alquiladas y Unidades en Mantenimiento.
  * **Tasa de Ocupación:** Calcula automáticamente el porcentaje de rentabilidad de la flota (`Alquilados / Total * 100`).
  * **Ingresos Mensuales:** Agrega la totalidad de cobros por conceptos de tarifas, delivery, coberturas y cargos por demora.
  * **Alertas Preventivas de Telegram:** Envía reportes matutinos con vehículos cuyos seguros o marbetes expiran en menos de 30 días.

---

## MÓDULO 02: GESTIÓN DE FLOTA & FICHAS TÉCNICAS
* **¿Para qué sirve?** Administrar el inventario vehicular, almacenar especificaciones técnicas de cara al cliente y monitorear la salud jurídica del vehículo.
* **¿Cómo funciona?**
  * **Ficha Técnica Interactiva:** Al hacer clic sobre cualquier vehículo, se abre un modal con fotos ampliadas, especificaciones mecánicas (*pasajeros, maletas, transmisión, combustible, aire acondicionado*) y tarifas.
  * **Subida de Fotografías:** Permite cargar fotos reales desde la computadora o el celular, comprimiéndolas automáticamente para visualización ultrarrápida.
  * **Auditoría Legal de Pólizas y Marbetes:** Monitorea la vigencia de seguros de compañías dominicanas (Universal, Mapfre, Banreservas, etc.) y marbetes DGII, mostrando insignias de color: 🟢 Al día, 🟡 Por vencer (≤30 días), 🔴 Vencido.
  * **Exportación CSV:** Permite descargar el inventario completo en formato Excel para balances contables.

---

## MÓDULO 03: CALENDARIO DE FLOTA & DISPONIBILIDAD GANTT
* **¿Para qué sirve?** Planificar gráficamente el uso de cada unidad en el tiempo para evitar la sobreventa (*overbooking*) y coordinar retornos.
* **¿Cómo funciona?**
  * Presenta un Diagrama de Gantt mensual con una fila por cada vehículo y una columna por cada día del mes.
  * **Código de Colores:**
    * 🔵 **Azul (Contrato Activo):** Auto actualmente rentado.
    * 🟡 **Amarillo (Reserva Futura):** Auto reservado para entrega en los próximos días.
    * 🛠️ **Gris / Naranja (Mantenimiento):** Unidad en taller.
    * ⚪ **Espacio Libre (Disponible):** Auto libre para asignación inmediata.

---

## MÓDULO 04: GESTIÓN DE CLIENTES, DOCUMENTOS & BURÓ
* **¿Para qué sirve?** Registrar la base de datos de arrendatarios nacionales y extranjeros, validar licencias de conducir y prevenir fraudes.
* **¿Cómo funciona?**
  * Almacena datos personales, teléfonos con código internacional y referencias de familiares para emergencias.
  * **Archivo Digital de Documentos:** Permite adjuntar imágenes nítidas de la Cédula/Pasaporte y de la Licencia de Conducir.
  * **Consulta de Buró de Crédito:** Permite registrar calificaciones de riesgo crediticio (A, B, C) o alertas de conductores problemáticos.

---

## MÓDULO 05: CONTRATOS, FIRMA DIGITAL & QR DE AUTENTICIDAD
* **¿Para qué sirve?** Formalizar el arrendamiento con total respaldo jurídico bajo la **Ley No. 483** de Ventas Condicionales y Alquileres Muebles y la **Ley No. 63-17** de Movilidad y Tránsito.
* **¿Cómo funciona?**
  * **Auto-Rellenado Inteligente:** Al seleccionar el cliente y el auto, el sistema calcula automáticamente días de renta, totales, seguros y fechas.
  * **Checklist de 24 Accesorios:** Permite verificar herramientas, gato, repuesto, micas, radio, alfombras y documentos.
  * **Medidor Gráfico de Combustible:** Estampa el nivel de salida `[E ▰▰▰▰ F]`.
  * **Firma Digital Táctil:** El cliente y el inspector firman directamente en la pantalla con el dedo, lápiz óptico o ratón.
  * **Código QR Criptográfico Inmutable:** Genera un enlace firmado con algoritmo SHA-256 para validación por la Policía o DIGESETT.
  * **Impresión Limpia en 1 Sola Hoja:** Diseñado con aislamiento `@media print` para imprimir un documento físico impecable o enviarlo por WhatsApp.

---

## MÓDULO 06: ENTREGAS, DEVOLUCIONES & PROTOCOLO CHECK-IN / CHECK-OUT
* **¿Para qué sirve?** Registrar el estado físico del auto al salir (Check-Out) y al retornar (Check-In) para cobrar daños o gasolina faltante.
* **¿Cómo funciona?**
  * Registra el odómetro inicial y final para verificar si hubo exceso de kilometraje.
  * Compara el combustible devuelto con el de salida para facturar el galón faltante.
  * Registra cualquier nuevo rayón o golpe en el diagrama 360° para deducirlo del depósito en garantía.

---

## MÓDULO 07: CAJA, FACTURACIÓN CON NCF DOMINICANO & CONTROL DE PAGOS
* **¿Para qué sirve?** Cobrar rentas, retener y liquidar depósitos en garantía y emitir facturas con Comprobante Fiscal NCF de la DGII.
* **¿Cómo funciona?**
  * Soporta pagos en Efectivo, Tarjetas de Crédito/Débito, Transferencia Bancaria y pasarela digital Stripe.
  * **Tipos de NCF soportados:**
    * **B01 (Crédito Fiscal):** Para empresas registradas que deducen ITBIS y gastos.
    * **B02 (Consumidor Final):** Para personas físicas y turistas.
    * **B14 (Regímenes Especiales):** Para empresas en Zonas Francas.
    * **B15 (Gubernamental):** Para entidades del Estado.

---

## MÓDULO 08: CONTABILIDAD, FINANZAS & ESTADO DE RESULTADOS (P&L)
* **¿Para qué sirve?** Obtener el balance financiero integral de la empresa en cualquier período de tiempo, auditar los gastos y consumos exactos de cada cliente, analizar la rentabilidad por vehículo y controlar todos los costos operativos.
* **¿Cómo funciona?**
  * **Estado de Resultados (P&L):** Consolida en tiempo real los ingresos cobrados (rentas, extras, delivery, penalidades), resta los costos de taller y gastos operativos, calculando la **Utilidad Neta (Ganancia Real)** y el **Margen de Rentabilidad (%)**.
  * **Análisis Financiero por Cliente:** Permite saber con exactitud **cuánto gastó el cliente y en qué** (desglose por contrato, auto, días, extras, delivery y seguro), con su saldo liquidado vs saldo pendiente, permitiendo emitir en 1 clic su **Estado de Cuenta Oficial en PDF**.
  * **Rentabilidad por Vehículo (ROI de Flota):** Compara los ingresos producidos por cada auto contra sus gastos de taller y costos directos para identificar los vehículos más rentables.
  * **Gestión de Egresos:** Registro categorizado de compras, combustible, lavado, nómina, alquileres y repuestos con `MonedaInput` (switch USD ⇄ DOP en vivo).
  * **Exportación:** Permite descargar el informe en **Excel / CSV** o imprimir el balance oficial.

---

## MÓDULO 09: TALLER, MANTENIMIENTO PREVENTIVO & CORRECTIVO
* **¿Para qué sirve?** Controlar los servicios mecánicos periódicos, cambios de aceite y reparaciones de choque.
* **¿Cómo funciona?**
  * Bloquea automáticamente el vehículo en el calendario de flota mientras está en taller.
  * Registra odómetros objetivo para avisar cuando falten menos de 500 km para el próximo cambio de aceite.
  * Almacena el historial de gastos mecánicos de cada chasis para calcular la rentabilidad neta de la unidad.

---

## MÓDULO 10: MONITOREO GPS SATELITAL, TELEMETRÍA & CORTE DE MOTOR
* **¿Para qué sirve?** Rastrear en tiempo real la ubicación de cada vehículo, supervisar excesos de velocidad e inmovilizar el motor ante robo o mora grave.
* **¿Cómo funciona?**
  * Muestra el mapa satelital con velocímetro, estado de ignición y nivel de batería del GPS.
  * **Inmovilización Remota:** Permite al administrador enviar la orden satelital de corte de motor. (Requiere confirmación de seguridad y que el vehículo circule a baja velocidad).

---

## MÓDULO 11: EQUIPO, USUARIOS & MATRIZ DE PERMISOS
* **¿Para qué sirve?** Crear las cuentas de los empleados de la agencia y definir sus privilegios de acceso.
* **¿Cómo funciona?**
  * **Administrador:** Acceso total a configuración, finanzas, corte de motor y contratos.
  * **Asesor de Ventas:** Puede registrar clientes, emitir contratos, recibir cobros y hacer entregas.
  * **Encargado de Flota / Mecánico:** Puede registrar mantenimientos, inspeccionar vehículos y actualizar odómetros.
  * **Chofer / Delivery:** Solo visualiza las rutas de entrega y recepción asignadas.

---

## MÓDULO 12: RED DE ALIADOS & SUBARRENDAMIENTO B2B
* **¿Para qué sirve?** Intercambiar vehículos entre agencias Rent a Car afiliadas a RentOS cuando no hay disponibilidad de una categoría solicitada.
* **¿Cómo funciona?**
  * Permite solicitar en préstamo un vehículo de otra agencia pagando una tarifa inter-empresa acordada y generando comisiones compartidas.

---

## MÓDULO 13: CONFIGURACIÓN DE MARCA WHITE-LABEL
* **¿Para qué sirve?** Personalizar la identidad visual de la agencia en contratos, facturas y portal web.
* **¿Cómo funciona?**
  * Permite subir el logotipo oficial, seleccionar el color corporativo, definir el número de WhatsApp para reservas, elegir la moneda por defecto (`USD` / `DOP`) y seleccionar entre la **Plantilla de Contrato Oficial Dominicana** o una **Plantilla Personalizada con Cláusulas Propias**.

---

## MÓDULO 14: PORTAL PÚBLICO DE RESERVAS WEB PARA CLIENTES
* **¿Para qué sirve?** Sitio web abierto para que los clientes finales y turistas puedan explorar la flota, cotizar por fechas y reservar.
* **¿Cómo funciona?**
  * Los clientes pueden ver fotografías en alta resolución, filtrar por categoría (*Sedán, SUV, 4x4, Van, Lujo*), abrir la ficha técnica interactiva al hacer clic en cualquier auto y enviar la reserva directamente por WhatsApp al Rent a Car.

---

## MÓDULO 14: PORTAL PÚBLICO DE VERIFICACIÓN DE CONTRATOS QR
* **¿Para qué sirve?** Página pública (`/verificar/:codigo`) donde cualquier persona, agente de la DIGESETT o Policía Nacional puede escanear el QR del contrato y certificar su legitimidad en tiempo real mediante un hash SHA-256 inmutable.

---

# PARTE II: MANUAL DE PROCEDIMIENTOS OPERATIVOS (GUÍA DE LLENADO CAMPO POR CAMPO)

---

## GUÍA DE LLENADO DE VEHÍCULOS (`/vehiculos`)

Al hacer clic en **`+ Nuevo Vehículo`** o **`✏️ Editar`**, completar cada campo según la siguiente tabla:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Fotografía Principal** | Recomendado | Imagen PNG/JPG o URL | Subir foto nítida y limpia del auto. Se mostrará en el catálogo web y en la ficha interactiva. |
| **Marca** | **Sí** | `Toyota`, `Hyundai`, `Kia` | Fabricante del vehículo según matrícula oficial. |
| **Modelo** | **Sí** | `Corolla LE`, `Tucson`, `Sportage` | Versión comercial exacta. |
| **Año** | **Sí** | `2024` (4 números) | Año de fabricación (Exactamente 4 dígitos, rango permitido: 1990 a Año actual + 2). |
| **Color** | No | `Blanco Perlado`, `Gris Plata` | Color exterior predominante. |
| **Placa / Matrícula** | **Sí** | `A-123456`, `G-771144` o `A123456` | Matrícula oficial dominicana (Hasta 8 caracteres incluyendo el guion, única en el sistema). |
| **No. Chasis / VIN** | No | 17 caracteres | Número grabado en el chasis. Crucial para pólizas y reporte de robo. |
| **Categoría** | **Sí** | `SEDAN`, `SUV`, `COMPACTO`, `CAMIONETA`, `VAN`, `LUJO` | Segmento vehicular. Filtro principal en la web de reservas. |
| **Transmisión** | **Sí** | `AUTOMATICA` o `MANUAL` | Tipo de caja de cambios. |
| **Combustible** | **Sí** | `GASOLINA`, `DIESEL`, `HIBRIDO`, `ELECTRICO` | Tipo de carburante que debe suministrarse. |
| **Pasajeros** | **Sí** | `5`, `7`, `12` | Número máximo de ocupantes con cinturón. |
| **Capacidad Maletas** | **Sí** | `2`, `3`, `5` | Capacidad de maletas grandes de viaje en el maletero. |
| **Puertas** | **Sí** | `4`, `5`, `2` | Cantidad de puertas de acceso. |
| **Aire Acondicionado** | **Sí** | `Sí (Con Climatizador A/C)` | Estado operativo del A/C. |
| **Odómetro Inicial (km)** | **Sí** | `15420` | Kilometraje real que marca el tablero al ingresar la unidad. |
| **Tarifa Diaria (USD / DOP)** | **Sí** | `45.00` US$ o `2,700.00` RD$ | Precio base por día. Incluye **Switch Convertidor en vivo** según la tasa de cambio establecida (ej. 1 USD = 60.00 DOP). |
| **Estado Operativo** | **Sí** | `DISPONIBLE`, `ALQUILADO`, `MANTENIMIENTO`, `INACTIVO` | Estado inicial del auto (por defecto `DISPONIBLE`). |
| **Póliza de Seguro** | Recomendado | `Seguros Universal #UN-992288` | Aseguradora y número de contrato de seguro. |
| **Vencimiento Seguro** | Recomendado | `DD/MM/AAAA` (ej. 25/08/2027) | Fecha de expiración de la póliza. Alerta preventiva a 30 días. |
| **Vencimiento Marbete** | Recomendado | `DD/MM/AAAA` (ej. 31/12/2026) | Fecha límite del impuesto de circulación DGII. |

---

## GUÍA DE LLENADO DE CLIENTES (`/clientes`)

Al hacer clic en **`+ Nuevo Cliente`**, completar:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre** | **Sí** | `Juan Carlos` | Primer y segundo nombre según cédula o pasaporte. |
| **Apellido** | **Sí** | `Pérez Morales` | Apellidos completos del cliente. |
| **Teléfono / WhatsApp** | **Sí** | `+1 809-555-0199` | **Validación estricta:** Para Rep. Dom. no permite más ni menos de **10 dígitos** sin contar guiones (iniciando en 809, 829 o 849). Para otros países aplica el límite internacional exacto. Se autoplaza con guiones automáticos. |
| **Correo Electrónico** | No | `juan.perez@email.com` | Correo para facturación y confirmaciones. |
| **Dirección Residencial** | Recomendado | `Calle Las Palmas #12, Santo Domingo` | Dirección física donde reside el cliente (o nombre de hotel si es turista). |
| **No. Cédula / Pasaporte** | **Sí** | `402-1234567-8` o `P8472910` | Documento de identidad oficial y vigente. |
| **No. Licencia Conducir** | **Sí** | `DO-40212345678` | Licencia de conducir válida para el tipo de vehículo a rentar. |
| **Vencimiento Licencia** | **Sí** | `DD/MM/AAAA` | No se puede rentar si la licencia vence durante el transcurso del contrato. |
| **Referencia Familiar** | Recomendado | `María Pérez - 809-555-0144` | Contacto de emergencia en caso de demora o accidente. |

---

## GUÍA DE LLENADO DE CONTRATOS (`/contratos`)

Al hacer clic en **`+ Nuevo Contrato`**, completar:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Cliente** | **Sí** | Selector | Arrendatario previamente registrado y activo en el sistema. |
| **Vehículo** | **Sí** | Selector | Unidad en estado `DISPONIBLE`. |
| **Fecha/Hora de Inicio** | **Sí** | `DD/MM/AAAA HH:MM` | Momento exacto de entrega de la llave al cliente. |
| **Fecha/Hora de Retorno** | **Sí** | `DD/MM/AAAA HH:MM` | Momento pactado de devolución en base a períodos de 24 horas. |
| **Tarifa Diaria** | **Sí** | `50.00` US$ o `3,000.00` RD$ | Monto diario por día de renta. Incluye **Switch Moneda USD ⇄ DOP** y equivalencia en tiempo real. |
| **Depósito en Garantía** | **Sí** | `200.00` US$ o `12,000.00` RD$ | Fianza reembolsable. Incluye **Switch Moneda USD ⇄ DOP**. |
| **Cobros Extra / Servicios** | No | `20.00` US$ / `1,200.00` RD$ | Cargos adicionales (Conductor adicional, GPS, Silla de bebé) con **Switch USD ⇄ DOP**. |
| **Monto de Delivery** | No | `15.00` US$ / `900.00` RD$ | Cargo por entrega fuera de oficina con **Switch USD ⇄ DOP**. |
| **Teléfono Referencia Familiar** | Recomendado | `+1 809-555-0199` | Teléfono con código de país y **guiones automáticos** para contacto de emergencia. |
| **Tipo de Seguro** | **Sí** | `FULL_COVER`, `FULL`, `LEY` | Grado de cobertura ante colisión, vuelco, robo o daños a terceros. |
| **Nivel Combustible Salida** | **Sí** | `100% (Lleno)`, `75% (3/4)`, `50% (1/2)` | Nivel exacto de combustible que marca el tablero al salir. |
| **Checklist 24 Accesorios** | **Sí** | 24 Casillas de verificación | Verificación física de herramientas, repuesto, micas, alfombras y documentos. |
| **Firma Digital Cliente** | **Sí** | Trazo manuscrito en Canvas | Firma táctil capturada en pantalla o tableta con valor legal vinculante. |

---

## GUÍA DE LLENADO DE PAGOS Y COMPROBANTES FISCALES NCF (`/pagos`)

Al hacer clic en **`+ Registrar Pago`**, completar:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Contrato Asociado** | **Sí** | Selector | Número de contrato que sustenta el cobro. |
| **Monto a Cobrar** | **Sí** | `150.00` US$ o `9,000.00` RD$ | Cantidad exacta a ingresar en caja. Permite **Switch Moneda USD ⇄ DOP** y conversión en vivo. |
| **Método de Pago** | **Sí** | `EFECTIVO`, `TARJETA`, `TRANSFERENCIA`, `PAYPAL` | Medio de pago utilizado por el arrendatario. |
| **Tipo de Comprobante NCF** | **Sí** | `B01`, `B02`, `B14`, `B15` | Tipo de comprobante fiscal requerido por el cliente. |
| **RNC / Cédula Fiscal** | Obligatorio si es B01 | `1-31-88992-1` | RNC de la empresa receptora de la factura con crédito fiscal. |
| **Concepto de Pago** | **Sí** | `Pago Renta Contrato #12 + Seguro Full Cover` | Detalle claro para el recibo y auditoría contable. |

---

## GUÍA DE LLENADO DE MANTENIMIENTOS (`/mantenimiento`)

Al hacer clic en **`+ Registrar Servicio`**, completar:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Vehículo** | **Sí** | Selector | Vehículo que ingresa a taller. Pasará a estado `MANTENIMIENTO`. |
| **Tipo de Servicio** | **Sí** | Selector + Campo "Otros" | Opciones: `Aceite & Filtro`, `Frenos`, `Neumáticos`, `Suspensión`, `Batería`, `Inspección` u **`Otros (Mantenimiento Personalizado)`** que despliega un campo de texto para especificar el trabajo exacto. |
| **Descripción de Trabajos** | **Sí** | `Cambio de aceite sintético 5W30, filtro de aceite y pastillas de freno` | Detalle exhaustivo de las labores mecánicas realizadas. |
| **Costo Total** | **Sí** | `4,500.00 DOP` o `85.00 USD` | Monto facturado por el taller o repuestos comprados. |
| **Odómetro del Servicio** | **Sí** | `45,200 km` | Kilometraje en el que se realizó el trabajo. |
| **Próximo Servicio (km)** | **Sí** | `50,200 km` | Kilometraje objetivo para el siguiente mantenimiento (+5,000 km). |

---

## GUÍA DE REGISTRO DE GASTOS & CONTABILIDAD (`/contabilidad`)

Al hacer clic en **`+ Registrar Gasto`** o consultar reportes:

| Nombre del Campo / Filtro | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Categoría Contable** | **Sí** | Selector oficial | `MANTENIMIENTO_TALLER`, `COMBUSTIBLE_LAVADO`, `SEGUROS_MARBETES`, `NOMINA_PERSONAL`, `ALQUILER_LOCAL_SERVICIOS`, `REPUESTOS_ACCESORIOS`, `PUBLICIDAD_MARKETING`, `IMPUESTOS_LEGALES`, `OTROS_GASTOS`. |
| **Descripción del Gasto** | **Sí** | `Compra de 4 neumáticos nuevos para Kia Seltos` | Motivo detallado del egreso de caja o cuenta bancaria. |
| **Monto del Gasto** | **Sí** | `150.00` US$ o `9,000.00` RD$ | Cantidad egresada con **Switch Moneda USD ⇄ DOP**. |
| **Fecha de Realización** | **Sí** | `DD/MM/AAAA` | Momento exacto del desembolso o factura. |
| **Comprobante / NCF / Factura #** | Opcional | `B0100000492` o `Voucher #882` | Número de comprobante fiscal para conciliación contable. |
| **Proveedor / Taller** | Opcional | `Centro Gomas Dominicana, SRL` | Nombre de la entidad o suplidor receptor del pago. |
| **Método de Pago** | **Sí** | `EFECTIVO`, `TRANSFERENCIA`, `TARJETA`, `OTRO` | Vía por la que salió el dinero. |
| **Vehículo Asociado** | Opcional | Selector de Vehículo | Si el gasto corresponde a un auto específico, permite calcular su **ROI Unitario**. |
| **Filtro de Período** | **Sí** | Presets o Rango `DD/MM/AAAA` | Filtra el P&L, consumos por cliente y balance de caja por fechas. |
| **Estado de Cuenta de Cliente** | **Sí** | Botón `📄 Imprimir / Emitir` | Genera y descarga el PDF oficial con el desglose pormenorizado de consumos del cliente. |

---

## GUÍA DE CONFIGURACIÓN DE EMPRESA (`/configuracion`)

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre Comercial** | **Sí** | `Caribe Car Rental, SRL` | Razón social o nombre público del Rent a Car. |
| **RNC** | **Sí** | `1-31-99283-1` | Registro Nacional de Contribuyentes para encabezados legales. |
| **Teléfono & WhatsApp** | **Sí** | `8095550199` | Número directo al que los clientes escribirán para reservar autos. |
| **Logotipo Oficial** | Recomendado | Archivo PNG/JPG o URL | Logotipo que aparecerá arriba a la izquierda en los contratos impresos y catálogo web. |
| **Color Primario** | **Sí** | Selector de color `#1e3a8a` | Color predominante en botones, encabezados y catálogo web. |
| **Moneda Predeterminada** | **Sí** | `USD` o `DOP` | Moneda estándar utilizada para cotizaciones y cobros. |
| **Plantilla de Contrato** | **Sí** | `OFICIAL_DOMINICANA` o `PERSONALIZADA` | Permite elegir entre el marco estándar dominicano bajo Ley 483 / 63-17 o cláusulas redactadas a medida por la empresa. |

---

## 🔧 REGLA PERMANENTE DE ACTUALIZACIÓN ANTE MEJORAS
Cada vez que el equipo de desarrollo agregue, modifique o elimine un campo o módulo:
1. Actualizar la sección correspondiente en este documento (`docs/MANUAL_ADMINISTRADOR.md`).
2. Registrar el cambio en la tabla de **Control de Versiones** con fecha y número de versión actualizado.
3. Generar la versión PDF correspondiente.
