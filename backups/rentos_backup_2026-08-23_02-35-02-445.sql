--
-- PostgreSQL database dump
--

\restrict kXCzWVqBFcx8JlZ6gmV3HAqXjy2BfCdog9nA12d4Oq2q15jN0U4m3gVQnOi3nJp

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoCliente; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoCliente" AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'BLOQUEADO'
);


ALTER TYPE public."EstadoCliente" OWNER TO postgres;

--
-- Name: EstadoContrato; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoContrato" AS ENUM (
    'BORRADOR',
    'ACTIVO',
    'FINALIZADO',
    'CANCELADO'
);


ALTER TYPE public."EstadoContrato" OWNER TO postgres;

--
-- Name: EstadoPago; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoPago" AS ENUM (
    'PENDIENTE',
    'PAGADO',
    'ANULADO'
);


ALTER TYPE public."EstadoPago" OWNER TO postgres;

--
-- Name: EstadoVehiculo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoVehiculo" AS ENUM (
    'DISPONIBLE',
    'ALQUILADO',
    'MANTENIMIENTO',
    'INACTIVO'
);


ALTER TYPE public."EstadoVehiculo" OWNER TO postgres;

--
-- Name: RolUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RolUsuario" AS ENUM (
    'SUPERADMIN',
    'ADMIN_RENTCAR',
    'EMPLEADO'
);


ALTER TYPE public."RolUsuario" OWNER TO postgres;

--
-- Name: TipoDocumento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoDocumento" AS ENUM (
    'CEDULA',
    'LICENCIA',
    'PASAPORTE'
);


ALTER TYPE public."TipoDocumento" OWNER TO postgres;

--
-- Name: TipoEvidencia; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoEvidencia" AS ENUM (
    'FOTO_CLIENTE',
    'FOTO_VEHICULO_SALIDA',
    'FOTO_DEFECTO_SALIDA',
    'FOTO_VEHICULO_DEVOLUCION',
    'FOTO_DEFECTO_DEVOLUCION',
    'AUDIO_CONFIRMACION'
);


ALTER TYPE public."TipoEvidencia" OWNER TO postgres;

--
-- Name: TipoPago; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoPago" AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'TARJETA',
    'OTRO',
    'PAYPAL'
);


ALTER TYPE public."TipoPago" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cliente" (
    id integer NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    telefono text NOT NULL,
    email text,
    direccion text,
    "fechaNacimiento" timestamp(3) without time zone,
    estado public."EstadoCliente" DEFAULT 'ACTIVO'::public."EstadoCliente" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentCarId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Cliente" OWNER TO postgres;

--
-- Name: Cliente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Cliente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Cliente_id_seq" OWNER TO postgres;

--
-- Name: Cliente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Cliente_id_seq" OWNED BY public."Cliente".id;


--
-- Name: ConsultaCredito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConsultaCredito" (
    id integer NOT NULL,
    "clienteId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    "fechaHora" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referencia text,
    resultado text,
    observacion text
);


ALTER TABLE public."ConsultaCredito" OWNER TO postgres;

--
-- Name: ConsultaCredito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ConsultaCredito_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConsultaCredito_id_seq" OWNER TO postgres;

--
-- Name: ConsultaCredito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ConsultaCredito_id_seq" OWNED BY public."ConsultaCredito".id;


--
-- Name: Contrato; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contrato" (
    id integer NOT NULL,
    "clienteId" integer NOT NULL,
    "vehiculoId" integer NOT NULL,
    "fechaInicio" timestamp(3) without time zone NOT NULL,
    "fechaFin" timestamp(3) without time zone NOT NULL,
    "tarifaDiaria" numeric(10,2) NOT NULL,
    deposito numeric(10,2) NOT NULL,
    "kilometrajeInicial" integer NOT NULL,
    "kilometrajeFinal" integer,
    estado public."EstadoContrato" DEFAULT 'BORRADOR'::public."EstadoContrato" NOT NULL,
    observaciones text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentCarId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Contrato" OWNER TO postgres;

--
-- Name: Contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Contrato_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Contrato_id_seq" OWNER TO postgres;

--
-- Name: Contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Contrato_id_seq" OWNED BY public."Contrato".id;


--
-- Name: DefectoVehiculo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DefectoVehiculo" (
    id integer NOT NULL,
    "entregaId" integer NOT NULL,
    descripcion text NOT NULL,
    ubicacion text,
    severidad text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DefectoVehiculo" OWNER TO postgres;

--
-- Name: DefectoVehiculo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DefectoVehiculo_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DefectoVehiculo_id_seq" OWNER TO postgres;

--
-- Name: DefectoVehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DefectoVehiculo_id_seq" OWNED BY public."DefectoVehiculo".id;


--
-- Name: DocumentoCliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DocumentoCliente" (
    id integer NOT NULL,
    "clienteId" integer NOT NULL,
    tipo public."TipoDocumento" NOT NULL,
    numero text,
    "archivoUrl" text NOT NULL,
    "nombreArchivo" text NOT NULL,
    "fechaVencimiento" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cargadoPorId" integer NOT NULL
);


ALTER TABLE public."DocumentoCliente" OWNER TO postgres;

--
-- Name: DocumentoCliente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DocumentoCliente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DocumentoCliente_id_seq" OWNER TO postgres;

--
-- Name: DocumentoCliente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DocumentoCliente_id_seq" OWNED BY public."DocumentoCliente".id;


--
-- Name: Entrega; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Entrega" (
    id integer NOT NULL,
    "contratoId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    "fechaHora" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    kilometraje integer NOT NULL,
    "nivelCombustible" text,
    "tieneDefectos" boolean DEFAULT false NOT NULL,
    observaciones text
);


ALTER TABLE public."Entrega" OWNER TO postgres;

--
-- Name: Entrega_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Entrega_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Entrega_id_seq" OWNER TO postgres;

--
-- Name: Entrega_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Entrega_id_seq" OWNED BY public."Entrega".id;


--
-- Name: Evidencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Evidencia" (
    id integer NOT NULL,
    "entregaId" integer NOT NULL,
    tipo public."TipoEvidencia" NOT NULL,
    "archivoUrl" text NOT NULL,
    "nombreArchivo" text NOT NULL,
    descripcion text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "defectoId" integer,
    "mimeType" text
);


ALTER TABLE public."Evidencia" OWNER TO postgres;

--
-- Name: Evidencia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Evidencia_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Evidencia_id_seq" OWNER TO postgres;

--
-- Name: Evidencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Evidencia_id_seq" OWNED BY public."Evidencia".id;


--
-- Name: Pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Pago" (
    id integer NOT NULL,
    "contratoId" integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tipo public."TipoPago" NOT NULL,
    referencia text,
    estado public."EstadoPago" DEFAULT 'PAGADO'::public."EstadoPago" NOT NULL,
    "usuarioId" integer NOT NULL
);


ALTER TABLE public."Pago" OWNER TO postgres;

--
-- Name: Pago_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Pago_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Pago_id_seq" OWNER TO postgres;

--
-- Name: Pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Pago_id_seq" OWNED BY public."Pago".id;


--
-- Name: RentCar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RentCar" (
    id integer NOT NULL,
    nombre text NOT NULL,
    rnc text,
    telefono text,
    email text,
    direccion text,
    ciudad text DEFAULT 'Santo Domingo'::text NOT NULL,
    "logoUrl" text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RentCar" OWNER TO postgres;

--
-- Name: RentCar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RentCar_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RentCar_id_seq" OWNER TO postgres;

--
-- Name: RentCar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RentCar_id_seq" OWNED BY public."RentCar".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentCarId" integer,
    rol public."RolUsuario" DEFAULT 'ADMIN_RENTCAR'::public."RolUsuario" NOT NULL
);


ALTER TABLE public."Usuario" OWNER TO postgres;

--
-- Name: UsuarioCliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsuarioCliente" (
    "usuarioId" integer NOT NULL,
    "clienteId" integer NOT NULL
);


ALTER TABLE public."UsuarioCliente" OWNER TO postgres;

--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Usuario_id_seq" OWNER TO postgres;

--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: Vehiculo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vehiculo" (
    id integer NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    anio integer NOT NULL,
    color text,
    placa text NOT NULL,
    vin text,
    kilometraje integer DEFAULT 0 NOT NULL,
    estado public."EstadoVehiculo" DEFAULT 'DISPONIBLE'::public."EstadoVehiculo" NOT NULL,
    "tarifaDiaria" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentCarId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Vehiculo" OWNER TO postgres;

--
-- Name: Vehiculo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Vehiculo_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Vehiculo_id_seq" OWNER TO postgres;

--
-- Name: Vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Vehiculo_id_seq" OWNED BY public."Vehiculo".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Cliente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cliente" ALTER COLUMN id SET DEFAULT nextval('public."Cliente_id_seq"'::regclass);


--
-- Name: ConsultaCredito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsultaCredito" ALTER COLUMN id SET DEFAULT nextval('public."ConsultaCredito_id_seq"'::regclass);


--
-- Name: Contrato id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contrato" ALTER COLUMN id SET DEFAULT nextval('public."Contrato_id_seq"'::regclass);


--
-- Name: DefectoVehiculo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DefectoVehiculo" ALTER COLUMN id SET DEFAULT nextval('public."DefectoVehiculo_id_seq"'::regclass);


--
-- Name: DocumentoCliente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentoCliente" ALTER COLUMN id SET DEFAULT nextval('public."DocumentoCliente_id_seq"'::regclass);


--
-- Name: Entrega id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrega" ALTER COLUMN id SET DEFAULT nextval('public."Entrega_id_seq"'::regclass);


--
-- Name: Evidencia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia" ALTER COLUMN id SET DEFAULT nextval('public."Evidencia_id_seq"'::regclass);


--
-- Name: Pago id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pago" ALTER COLUMN id SET DEFAULT nextval('public."Pago_id_seq"'::regclass);


--
-- Name: RentCar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RentCar" ALTER COLUMN id SET DEFAULT nextval('public."RentCar_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Name: Vehiculo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehiculo" ALTER COLUMN id SET DEFAULT nextval('public."Vehiculo_id_seq"'::regclass);


--
-- Data for Name: Cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cliente" (id, nombre, apellido, telefono, email, direccion, "fechaNacimiento", estado, "createdAt", "updatedAt", "rentCarId") FROM stdin;
1	Juan	Prueba	8095551234	juan.prueba@rentos.local	Santo Domingo	\N	ACTIVO	2026-08-18 23:19:03.55	2026-08-18 23:19:03.55	1
2	Carlos	García Martínez	809-555-1001	carlos.garcia@gmail.com	Piantini, Santo Domingo	\N	ACTIVO	2026-08-23 02:18:46.925	2026-08-23 02:18:46.925	1
3	María	Fernández Santos	829-555-2002	maria.fernandez@outlook.com	Bella Vista, Santo Domingo	\N	ACTIVO	2026-08-23 02:18:46.935	2026-08-23 02:18:46.935	1
4	Alejandro	Rodríguez Peña	849-555-3003	arodriguez@empresa.do	Naco, Santo Domingo	\N	BLOQUEADO	2026-08-23 02:18:46.938	2026-08-23 02:18:46.938	1
\.


--
-- Data for Name: ConsultaCredito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConsultaCredito" (id, "clienteId", "usuarioId", "fechaHora", referencia, resultado, observacion) FROM stdin;
\.


--
-- Data for Name: Contrato; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contrato" (id, "clienteId", "vehiculoId", "fechaInicio", "fechaFin", "tarifaDiaria", deposito, "kilometrajeInicial", "kilometrajeFinal", estado, observaciones, "createdAt", "updatedAt", "rentCarId") FROM stdin;
1	1	1	2026-08-19 10:00:00	2026-08-22 10:00:00	45.00	200.00	15000	\N	ACTIVO	Contrato de prueba	2026-08-19 00:47:06.803	2026-08-19 00:51:02.764	1
2	1	3	2026-08-21 10:00:00	2026-08-24 10:00:00	60.00	200.00	8000	8350	FINALIZADO	Prueba completa del ciclo de alquiler	2026-08-21 05:34:23.141	2026-08-21 05:38:05.945	1
3	1	4	2026-08-21 10:00:00	2026-08-24 10:00:00	70.00	200.00	12000	12350	FINALIZADO	Prueba autom�tica de finalizaci�n	2026-08-21 05:39:49.75	2026-08-21 05:49:47.73	1
\.


--
-- Data for Name: DefectoVehiculo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DefectoVehiculo" (id, "entregaId", descripcion, ubicacion, severidad, "createdAt") FROM stdin;
\.


--
-- Data for Name: DocumentoCliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DocumentoCliente" (id, "clienteId", tipo, numero, "archivoUrl", "nombreArchivo", "fechaVencimiento", "createdAt", "updatedAt", "cargadoPorId") FROM stdin;
\.


--
-- Data for Name: Entrega; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Entrega" (id, "contratoId", "usuarioId", "fechaHora", kilometraje, "nivelCombustible", "tieneDefectos", observaciones) FROM stdin;
1	1	1	2026-08-19 01:34:24.565	15000	LLENO	f	Entrega inicial del vehículo
2	2	1	2026-08-21 05:35:28.596	8350	LLENO	f	Devoluci�n de prueba del ciclo completo
3	3	1	2026-08-21 05:47:20.252	12350	LLENO	f	Devoluci�n autom�tica de prueba
\.


--
-- Data for Name: Evidencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Evidencia" (id, "entregaId", tipo, "archivoUrl", "nombreArchivo", descripcion, "createdAt", "defectoId", "mimeType") FROM stdin;
\.


--
-- Data for Name: Pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Pago" (id, "contratoId", monto, fecha, tipo, referencia, estado, "usuarioId") FROM stdin;
2	1	45.00	2026-08-19 02:00:39.718	PAYPAL	PAYPAL-PRUEBA-001	PAGADO	1
3	3	70.00	2026-08-21 05:54:52.589	EFECTIVO	EFECTIVO-PRUEBA-001	PAGADO	1
\.


--
-- Data for Name: RentCar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RentCar" (id, nombre, rnc, telefono, email, direccion, ciudad, "logoUrl", activo, "createdAt", "updatedAt") FROM stdin;
1	RentOS Principal - Santo Domingo	132-00000-1	809-555-0199	contacto@rentos.do	Av. 27 de Febrero #100, Santo Domingo	Santo Domingo	\N	t	2026-08-22 22:08:52.335	2026-08-22 22:08:52.335
2	AutoRent Bávaro	132-99999-2	809-555-0200	contacto@autorentbavaro.do	\N	Punta Cana / Bávaro	\N	t	2026-08-23 02:10:09.015	2026-08-23 02:10:09.015
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Usuario" (id, nombre, email, password, activo, "createdAt", "updatedAt", "rentCarId", rol) FROM stdin;
1	Administrador	admin@rentos.local	123456	t	2026-08-19 01:30:33.067	2026-08-19 01:30:33.067	\N	ADMIN_RENTCAR
\.


--
-- Data for Name: UsuarioCliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsuarioCliente" ("usuarioId", "clienteId") FROM stdin;
\.


--
-- Data for Name: Vehiculo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vehiculo" (id, marca, modelo, anio, color, placa, vin, kilometraje, estado, "tarifaDiaria", "createdAt", "updatedAt", "rentCarId") FROM stdin;
2	Kia	Sportage	2025	Negro	B987654	KNABC987654321	5500	ALQUILADO	65.00	2026-08-19 00:15:30.726	2026-08-19 00:16:47.285	1
1	Toyota	Corolla	2024	Blanco	A123456	JTDB123456789	15000	ALQUILADO	45.00	2026-08-19 00:13:40.691	2026-08-19 00:47:06.811	1
3	Hyundai	Tucson	2025	Gris	C456789	KMHAB123456789	8350	DISPONIBLE	60.00	2026-08-21 05:33:25.716	2026-08-21 05:35:28.608	1
4	Kia	Seltos	2026	Azul	D789012	KNADE123456789	12350	ALQUILADO	70.00	2026-08-21 05:39:18.772	2026-08-23 00:17:57.618	1
8	Honda	Accord	2029	rojo	DFDR45454	44RRFRFR44	1000	DISPONIBLE	75.00	2026-08-23 00:20:48.052	2026-08-23 00:20:48.052	1
9	Kia	Seltos	2004	Azul	KJH32647	\N	140000	DISPONIBLE	50.00	2026-08-23 00:22:09.306	2026-08-23 00:22:09.306	1
10	Kia	Sportage	2004	Verde	HG2Q236	HGJ2763476	100	DISPONIBLE	144.00	2026-08-23 00:25:30.049	2026-08-23 00:25:30.049	1
11	KIA	RIO	2023	NEGRO	GH1123	KJK1126346	1	DISPONIBLE	150.00	2026-08-23 00:35:53.516	2026-08-23 00:37:43.379	1
12	Hyundai	Santa Fe	2024	Blanco	BAV-001	HYUNDAIBAV0012024	5000	MANTENIMIENTO	85.00	2026-08-23 02:10:09.029	2026-08-23 02:17:39.505	2
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1792c7da-58d6-4739-b432-2d55bc1c3ae2	51a362691a550bd4e0b07dcb39da888f619a72062ee083ab7eb85088c4fe0dd6	2026-08-17 22:17:10.033671-04	20260818021710_crear_usuario	\N	\N	2026-08-17 22:17:10.026258-04	1
cc98bcae-1c69-4334-a279-75331c118c2e	e8aae3ad43efd049e582187bdd15ad8f46eb0183656b8fc94a17beb447ef1ac8	2026-08-18 18:38:54.428237-04	20260818223854_crear_nucleo_rentos	\N	\N	2026-08-18 18:38:54.295697-04	1
\.


--
-- Name: Cliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Cliente_id_seq"', 4, true);


--
-- Name: ConsultaCredito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ConsultaCredito_id_seq"', 1, false);


--
-- Name: Contrato_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Contrato_id_seq"', 3, true);


--
-- Name: DefectoVehiculo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DefectoVehiculo_id_seq"', 1, false);


--
-- Name: DocumentoCliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DocumentoCliente_id_seq"', 1, false);


--
-- Name: Entrega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Entrega_id_seq"', 3, true);


--
-- Name: Evidencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Evidencia_id_seq"', 1, false);


--
-- Name: Pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Pago_id_seq"', 3, true);


--
-- Name: RentCar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RentCar_id_seq"', 2, true);


--
-- Name: Usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Usuario_id_seq"', 1, true);


--
-- Name: Vehiculo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Vehiculo_id_seq"', 12, true);


--
-- Name: Cliente Cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY (id);


--
-- Name: ConsultaCredito ConsultaCredito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsultaCredito"
    ADD CONSTRAINT "ConsultaCredito_pkey" PRIMARY KEY (id);


--
-- Name: Contrato Contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contrato"
    ADD CONSTRAINT "Contrato_pkey" PRIMARY KEY (id);


--
-- Name: DefectoVehiculo DefectoVehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DefectoVehiculo"
    ADD CONSTRAINT "DefectoVehiculo_pkey" PRIMARY KEY (id);


--
-- Name: DocumentoCliente DocumentoCliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentoCliente"
    ADD CONSTRAINT "DocumentoCliente_pkey" PRIMARY KEY (id);


--
-- Name: Entrega Entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrega"
    ADD CONSTRAINT "Entrega_pkey" PRIMARY KEY (id);


--
-- Name: Evidencia Evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_pkey" PRIMARY KEY (id);


--
-- Name: Pago Pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_pkey" PRIMARY KEY (id);


--
-- Name: RentCar RentCar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RentCar"
    ADD CONSTRAINT "RentCar_pkey" PRIMARY KEY (id);


--
-- Name: UsuarioCliente UsuarioCliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCliente"
    ADD CONSTRAINT "UsuarioCliente_pkey" PRIMARY KEY ("usuarioId", "clienteId");


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: Vehiculo Vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehiculo"
    ADD CONSTRAINT "Vehiculo_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Cliente_rentCarId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Cliente_rentCarId_idx" ON public."Cliente" USING btree ("rentCarId");


--
-- Name: ConsultaCredito_clienteId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConsultaCredito_clienteId_idx" ON public."ConsultaCredito" USING btree ("clienteId");


--
-- Name: ConsultaCredito_usuarioId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConsultaCredito_usuarioId_idx" ON public."ConsultaCredito" USING btree ("usuarioId");


--
-- Name: Contrato_clienteId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contrato_clienteId_idx" ON public."Contrato" USING btree ("clienteId");


--
-- Name: Contrato_rentCarId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contrato_rentCarId_idx" ON public."Contrato" USING btree ("rentCarId");


--
-- Name: Contrato_vehiculoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contrato_vehiculoId_idx" ON public."Contrato" USING btree ("vehiculoId");


--
-- Name: DefectoVehiculo_entregaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DefectoVehiculo_entregaId_idx" ON public."DefectoVehiculo" USING btree ("entregaId");


--
-- Name: DocumentoCliente_clienteId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DocumentoCliente_clienteId_idx" ON public."DocumentoCliente" USING btree ("clienteId");


--
-- Name: Entrega_contratoId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Entrega_contratoId_key" ON public."Entrega" USING btree ("contratoId");


--
-- Name: Entrega_usuarioId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entrega_usuarioId_idx" ON public."Entrega" USING btree ("usuarioId");


--
-- Name: Evidencia_defectoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_defectoId_idx" ON public."Evidencia" USING btree ("defectoId");


--
-- Name: Evidencia_entregaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_entregaId_idx" ON public."Evidencia" USING btree ("entregaId");


--
-- Name: Pago_contratoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pago_contratoId_idx" ON public."Pago" USING btree ("contratoId");


--
-- Name: Pago_usuarioId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pago_usuarioId_idx" ON public."Pago" USING btree ("usuarioId");


--
-- Name: RentCar_rnc_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RentCar_rnc_key" ON public."RentCar" USING btree (rnc);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Usuario_rentCarId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Usuario_rentCarId_idx" ON public."Usuario" USING btree ("rentCarId");


--
-- Name: Vehiculo_placa_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Vehiculo_placa_key" ON public."Vehiculo" USING btree (placa);


--
-- Name: Vehiculo_rentCarId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Vehiculo_rentCarId_idx" ON public."Vehiculo" USING btree ("rentCarId");


--
-- Name: Vehiculo_vin_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Vehiculo_vin_key" ON public."Vehiculo" USING btree (vin);


--
-- Name: Cliente Cliente_rentCarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_rentCarId_fkey" FOREIGN KEY ("rentCarId") REFERENCES public."RentCar"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConsultaCredito ConsultaCredito_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsultaCredito"
    ADD CONSTRAINT "ConsultaCredito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConsultaCredito ConsultaCredito_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsultaCredito"
    ADD CONSTRAINT "ConsultaCredito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contrato Contrato_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contrato"
    ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contrato Contrato_rentCarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contrato"
    ADD CONSTRAINT "Contrato_rentCarId_fkey" FOREIGN KEY ("rentCarId") REFERENCES public."RentCar"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contrato Contrato_vehiculoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contrato"
    ADD CONSTRAINT "Contrato_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES public."Vehiculo"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DefectoVehiculo DefectoVehiculo_entregaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DefectoVehiculo"
    ADD CONSTRAINT "DefectoVehiculo_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES public."Entrega"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentoCliente DocumentoCliente_cargadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentoCliente"
    ADD CONSTRAINT "DocumentoCliente_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentoCliente DocumentoCliente_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentoCliente"
    ADD CONSTRAINT "DocumentoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Entrega Entrega_contratoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrega"
    ADD CONSTRAINT "Entrega_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES public."Contrato"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Entrega Entrega_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrega"
    ADD CONSTRAINT "Entrega_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Evidencia Evidencia_defectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_defectoId_fkey" FOREIGN KEY ("defectoId") REFERENCES public."DefectoVehiculo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Evidencia Evidencia_entregaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES public."Entrega"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pago Pago_contratoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES public."Contrato"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pago Pago_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UsuarioCliente UsuarioCliente_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCliente"
    ADD CONSTRAINT "UsuarioCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UsuarioCliente UsuarioCliente_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCliente"
    ADD CONSTRAINT "UsuarioCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Usuario Usuario_rentCarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_rentCarId_fkey" FOREIGN KEY ("rentCarId") REFERENCES public."RentCar"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Vehiculo Vehiculo_rentCarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehiculo"
    ADD CONSTRAINT "Vehiculo_rentCarId_fkey" FOREIGN KEY ("rentCarId") REFERENCES public."RentCar"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict kXCzWVqBFcx8JlZ6gmV3HAqXjy2BfCdog9nA12d4Oq2q15jN0U4m3gVQnOi3nJp

