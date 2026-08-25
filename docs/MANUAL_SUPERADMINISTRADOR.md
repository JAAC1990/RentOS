# 🌐 MANUAL MAESTRO DE FUNCIONALIDADES & PROCEDIMIENTOS OPERATIVOS (SOP)
# PARA EL SUPERADMINISTRADOR DE LA PLATAFORMA SAAS — RentOS v2.0

**Código del Documento:** `MAN-SUPERADM-RENTOS-V2`  
**Destinatarios:** SuperAdministradores, Dirección de Tecnología (CTO), Ingenieros de Soporte y Administradores de Infraestructura.  
**Sistema:** RentOS Multi-Tenant Enterprise Cloud SaaS  
**Ámbito:** Gestión Global de Empresas (Tenants), Seguridad Multi-Inquilino, Gobernanza de Base de Datos y Planes.  
**Estado:** Documento Vivo, Modular y Ajustable.

---

## 📑 CONTROL DE VERSIONES & REGISTRO DE CAMBIOS (CHANGELOG)

*Este manual debe actualizarse obligatoriamente cada vez que se agregue una nueva funcionalidad de plataforma, pasarela de pago o procedimiento de infraestructura en RentOS.*

| Versión | Fecha | Sección / Proceso Modificado | Descripción de la Modificación | Autorizado por |
| :---: | :---: | :--- | :--- | :---: |
| **1.0** | 2026-08-20 | Infraestructura Base | Publicación inicial del manual maestro del SuperAdmin. | Dirección IT |
| **1.5** | 2026-08-23 | Multi-Tenant & Fiscal | Monitoreo de NCF y firmas criptográficas SHA-256 de contratos. | Seguridad / Legal |
| **2.0** | 2026-08-24 | Todos los Módulos Maestros | Protocolo de onboarding de empresas, gestión de cuotas, DRP y diccionario de campos. | Dirección RentOS |

---

## 🧭 ÍNDICE GENERAL DEL MANUAL DE SUPERADMINISTRADOR

### PARTE I: MANUAL DE FUNCIONALIDADES MAESTRAS (¿Cómo funciona y para qué sirve cada cosa?)
1. [Arquitectura Multi-Tenant & Aislamiento de Datos](#1-arquitectura-multi-tenant--aislamiento-de-datos)
2. [Módulo Maestro 01: Consola de Solicitudes de Nuevas Empresas (`/solicitudes`)](#módulo-maestro-01-consola-de-solicitudes-de-nuevas-empresas)
3. [Módulo Maestro 02: Directorio Global de Empresas & Tenants (`/rentcars`)](#módulo-maestro-02-directorio-global-de-empresas--tenants)
4. [Módulo Maestro 03: Gestión de Planes, Límites de Flota & Suscripciones](#módulo-maestro-03-gestión-de-planes-límites-de-flota--suscripciones)
5. [Módulo Maestro 04: Pasarelas de Pago Maestras & Facturación SaaS](#módulo-maestro-04-pasarelas-de-pago-maestras--facturación-saas)
6. [Módulo Maestro 05: Seguridad Criptográfica & Autoridad de Verificación QR](#módulo-maestro-05-seguridad-criptográfica--autoridad-de-verificación-qr)
7. [Módulo Maestro 06: Monitoreo de Infraestructura, Logs & Base de Datos PostgreSQL](#módulo-maestro-06-monitoreo-de-infraestructura-logs--base-de-datos-postgresql)
8. [Módulo Maestro 07: Plan de Continuidad & Recuperación ante Desastres (DRP)](#módulo-maestro-07-plan-de-continuidad--recuperación-ante-desastres-drp)

### PARTE II: PROCEDIMIENTOS OPERATIVOS DEL SUPERADMINISTRADOR (Paso a Paso & Llenado Campo por Campo)
* [PR-SA-01: Procedimiento de Verificación y Aprobación de una Nueva Empresa](#pr-sa-01-procedimiento-de-verificación-y-aprobación-de-una-nueva-empresa)
* [PR-SA-02: Procedimiento de Creación Manual de Tenant y Cuenta de Administrador](#pr-sa-02-procedimiento-de-creación-manual-de-tenant-y-cuenta-de-administrador)
* [PR-SA-03: Procedimiento de Suspensión Temporal o Cancelación de Empresa por Mora](#pr-sa-03-procedimiento-de-suspensión-temporal-o-cancelación-de-empresa-por-mora)
* [PR-SA-04: Procedimiento de Actualización de Esquema de Base de Datos (Prisma Migrations)](#pr-sa-04-procedimiento-de-actualización-de-esquema-de-base-de-datos-prisma-migrations)
* [PR-SA-05: Procedimiento de Respaldo Diario y Restauración de Base de Datos](#pr-sa-05-procedimiento-de-respaldo-diario-y-restauración-de-base-de-datos)

---

# PARTE I: MANUAL DE FUNCIONALIDADES MAESTRAS

## 1. ARQUITECTURA MULTI-TENANT & AISLAMIENTO DE DATOS
* **¿Qué es?** RentOS opera bajo una arquitectura Multi-Tenant lógica y relacional de alto rendimiento, donde múltiples agencias Rent a Car conviven en la misma infraestructura pero con un **aislamiento estricto de datos** mediante `rentCarId`.
* **¿Cómo funciona?**
  * Cada tabla de la base de datos (`Vehiculo`, `Cliente`, `Contrato`, `Pago`, `Mantenimiento`, `Usuario`) posee una clave foránea `rentCarId`.
  * Los endpoints del backend filtran automáticamente cada consulta según el `rentCarId` del usuario autenticado en su token JWT.
  * Una empresa **NUNCA** puede ver, modificar ni acceder a los registros, contratos ni clientes de otra empresa de la plataforma.

---

## MÓDULO MAESTRO 01: CONSOLA DE SOLICITUDES DE NUEVAS EMPRESAS (`/solicitudes`)
* **¿Para qué sirve?** Recibir, auditar y autorizar a nuevas empresas Rent a Car que solicitan unirse a la plataforma RentOS.
* **¿Cómo funciona?**
  * Presenta un listado de solicitudes pendientes con: Nombre Comercial, RNC dominicano, Ciudad, Teléfono, Correo del representante y cantidad estimada de flota.
  * El SuperAdmin cuenta con los botones de acción directiva:
    * **`✅ Autorizar`:** Desencadena la creación del Tenant, asigna el ID único, genera el usuario Administrador y habilita el catálogo web público de la agencia.
    * **`🔴 Rechazar`:** Descarta la solicitud y notifica por correo electrónico el motivo del rechazo.

---

## MÓDULO MAESTRO 02: DIRECTORIO GLOBAL DE EMPRESAS & TENANTS (`/rentcars`)
* **¿Para qué sirve?** Monitorear la actividad de todas las empresas afiliadas, cantidad de vehículos activos por empresa, estado de su suscripción y acceso a métricas consolidadas.
* **¿Cómo funciona?**
  * Muestra la tabla de todos los Rent a Cars registrados con su estado (`ACTIVO`, `SUSPENDIDO`, `EN_REVISION`).
  * Permite al SuperAdmin inspeccionar la configuración de cada agencia, resolver problemas técnicos o modificar límites operativos.

---

## MÓDULO MAESTRO 03: GESTIÓN DE PLANES, LÍMITES DE FLOTA & SUSCRIPCIONES
* **¿Para qué sirve?** Controlar las cuotas de vehículos permitidas según el plan contratado por cada Rent a Car.
* **¿Cómo funciona?**
  * **Plan Básico / Starter:** Hasta 15 vehículos.
  * **Plan Profesional / Pro:** Hasta 50 vehículos + Monitoreo GPS.
  * **Plan Enterprise / Ilimitado:** Flota ilimitada + Multi-Sucursal + Facturación NCF automatizada.
  * Si una agencia alcanza el límite de su plan, el sistema le impedirá registrar más autos e invitará al Administrador a actualizar su suscripción.

---

## MÓDULO MAESTRO 04: PASARELAS DE PAGO MAESTRAS & FACTURACIÓN SAAS
* **¿Para qué sirve?** Administrar las credenciales de cobro de suscripciones recurrentes del SaaS (vía Stripe o transferencias bancarias directas) y supervisar las transacciones de las agencias.
* **¿Cómo funciona?**
  * Mantiene las llaves maestras de API y webhooks para procesar la recaudación mensual del software y generar las facturas de servicio B2B.

---

## MÓDULO MAESTRO 05: SEGURIDAD CRIPTOGRÁFICA & AUTORIDAD DE VERIFICACIÓN QR
* **¿Para qué sirve?** Garantizar la inmutabilidad de los contratos emitidos por todas las agencias mediante firma criptográfica SHA-256.
* **¿Cómo funciona?**
  * Cada vez que se crea un contrato en cualquier Rent a Car, el backend calcula un hash criptográfico inmutable basado en: `ID + TenantID + CédulaCliente + Placa + Fechas + MontoTotal`.
  * La URL pública de verificación `/verificar/:codigo` consulta el backend maestro y compara el hash en tiempo real para estampar el **Sello Verde de Legitimidad**.

---

## MÓDULO MAESTRO 06: MONITOREO DE INFRAESTRUCTURA, LOGS & BASE DE DATOS POSTGRESQL
* **¿Para qué sirve?** Supervisar la disponibilidad del servidor (Node.js Express), latencia de consultas en PostgreSQL y consumo de memoria.
* **¿Cómo funciona?**
  * Los logs de eventos y errores críticos se registran en tiempo real y se emiten alertas preventivas ante caídas de servicio o sobrecarga de conexiones.

---

## MÓDULO MAESTRO 07: PLAN DE CONTINUIDAD & RECUPERACIÓN ANTE DESASTRES (DRP)
* **¿Para qué sirve?** Salvaguardar la integridad de los datos de todos los clientes y vehículos ante fallos de hardware o desastres.
* **¿Cómo funciona?**
  * Copias de seguridad automáticas diarias de la base de datos PostgreSQL.
  * Capacidad de restauración total en menos de 15 minutos (RTO < 15 min, RPO < 24 horas).

---

# PARTE II: PROCEDIMIENTOS OPERATIVOS DEL SUPERADMINISTRADOR (GUÍA PASO A PASO)

---

## PR-SA-01: PROCEDIMIENTO DE VERIFICACIÓN Y APROBACIÓN DE UNA NUEVA EMPRESA

* **Objetivo:** Asegurar que únicamente agencias legalmente constituidas operen en la plataforma.
* **Frecuencia:** Cada vez que ingrese una solicitud en `/solicitudes`.

### Paso a Paso Operativo:
1. Ingresar a la consola de SuperAdmin (`/solicitudes`).
2. Abrir la solicitud pendiente de revisión.
3. **Auditoría Fiscal en DGII:**
   * Ingresar al portal oficial de consulta de RNC de la DGII (República Dominicana).
   * Digitar el RNC proporcionado y validar que el estado sea **ACTIVO** y que la actividad económica corresponda a *Alquiler de Vehículos de Motor*.
4. **Verificación de Contacto:**
   * Realizar una llamada de validación al número telefónico del representante legal o enviar un correo de confirmación.
5. **Decisión:**
   * Si todo es correcto: Presionar **`✅ Autorizar Empresa`**. El sistema provisionará el nuevo tenant y enviará las credenciales maestras de la agencia.
   * Si no cumple los requisitos: Presionar **`🔴 Rechazar Solicitud`** e ingresar el motivo (ej. *RNC inactivo en DGII*).

---

## PR-SA-02: PROCEDIMIENTO DE CREACIÓN MANUAL DE TENANT Y CUENTA DE ADMINISTRADOR

Si una empresa es registrada directamente por la gerencia de ventas del SaaS:

| Nombre del Campo | ¿Obligatorio? | Formato / Ejemplo | Instrucción & Regla de Negocio |
| :--- | :---: | :--- | :--- |
| **Nombre Comercial** | **Sí** | `Punta Cana Rent a Car, SRL` | Razón social oficial de la agencia. |
| **RNC** | **Sí** | `1-31-88992-1` | Número de RNC registrado en la DGII. |
| **Ciudad / Sucursal** | **Sí** | `Punta Cana`, `Santo Domingo` | Ubicación geográfica principal de operación. |
| **Teléfono Oficial** | **Sí** | `8095550199` | Teléfono corporativo principal. |
| **Correo del Administrador** | **Sí** | `gerencia@puntacanarentacar.com` | Correo donde se enviará el acceso administrativo. |
| **Contraseña Inicial** | **Sí** | Mínimo 8 caracteres alfanuméricos | Clave temporal que deberá cambiarse al primer inicio. |
| **Plan Asignado** | **Sí** | `STARTER`, `PRO`, `ENTERPRISE` | Define la cuota máxima de vehículos y módulos habilitados. |

---

## PR-SA-03: PROCEDIMIENTO DE SUSPENSIÓN TEMPORAL O CANCELACIÓN POR MORA

* **Objetivo:** Inhabilitar el acceso a un Rent a Car que presente más de 15 días de mora en su cuota de servicio SaaS o incurra en prácticas fraudulentas.

### Paso a Paso Operativo:
1. Ingresar a **Directorio de Empresas** (`/rentcars`).
2. Localizar la empresa morosa.
3. Cambiar su estado operativo a **`SUSPENDIDO`**.
4. Al ejecutarse este cambio:
   * Los usuarios de esa empresa no podrán iniciar sesión (el sistema mostrará un aviso de *Cuenta Temporalmente Inactiva - Contacte a Soporte*).
   * El catálogo público web mostrará temporalmente el mensaje *Catálogo en Mantenimiento*.
   * **IMPORTANTE:** Los datos de vehículos, clientes y contratos **NO SE ELIMINAN**, quedan congelados hasta que la empresa regularice su pago.
5. Una vez recibido el pago, cambiar el estado a **`ACTIVO`** para restaurar el servicio en segundos.

---

## PR-SA-04: PROCEDIMIENTO DE ACTUALIZACIÓN DE ESQUEMA DE BASE DE DATOS (PRISMA MIGRATIONS)

* **Objetivo:** Aplicar nuevas tablas, columnas o índices en PostgreSQL sin interrumpir el servicio.

### Paso a Paso Técnico:
1. Realizar un respaldo preventivo de la base de datos antes de cualquier cambio.
2. En la terminal del servidor, ejecutar:
   ```bash
   npx prisma db push --schema prisma/schema.prisma
   npx prisma generate --schema prisma/schema.prisma
   ```
3. Compilar el backend TypeScript:
   ```bash
   npx tsc -p backend/tsconfig.json
   ```
4. Reiniciar el demonio de producción de Node.js:
   ```bash
   pm2 restart rentos-backend  # o node backend/dist/index.js
   ```
5. Comprobar en los logs que el backend responda exitosamente en `http://localhost:3000`.

---

## PR-SA-05: PROCEDIMIENTO DE RESPALDO DIARIO Y RESTAURACIÓN DE BASE DE DATOS

### Respaldo Diario (Backup):
El script automatizado de cron ejecuta diariamente:
```bash
pg_dump -U postgres -h localhost -d rentos -F c -b -v -f "backups/rentos_backup_$(date +%Y%m%d).dump"
```

### Procedimiento de Restauración ante Emergencias:
1. Detener el servicio backend temporalmente.
2. Restaurar la base de datos desde el archivo de volcado:
   ```bash
   pg_restore -U postgres -h localhost -d rentos -v "backups/rentos_backup_ULTIMO.dump"
   ```
3. Iniciar el servicio backend y validar la integridad de los contratos y vehículos.

---

## 🔧 REGLA PERMANENTE DE ACTUALIZACIÓN ANTE MEJORAS
Cada vez que el equipo de arquitectura o desarrollo implemente nuevos módulos maestros o políticas de infraestructura:
1. Actualizar este documento (`docs/MANUAL_SUPERADMINISTRADOR.md`).
2. Actualizar el **Control de Versiones** con la nueva versión y fecha.
3. Exportar la versión PDF correspondiente.
