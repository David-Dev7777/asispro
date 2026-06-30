--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.2

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: auto_generate_overtime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_generate_overtime() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_worked_hours  numeric;

  v_work_hours    numeric;

  v_overtime      numeric;

BEGIN

  -- Solo ejecutar en check_out

  IF NEW.type <> 'check_out' THEN

    RETURN NEW;

  END IF;



  -- Horas trabajadas ese d├¡a

  v_worked_hours := public.get_worked_hours(NEW.employee_id, NEW.timestamp::date);



  -- Jornada configurada para la empresa

  SELECT work_hours_day INTO v_work_hours

  FROM public.company_settings

  WHERE company_id = NEW.company_id;



  v_work_hours := COALESCE(v_work_hours, 8);



  -- Calcular horas extra

  v_overtime := v_worked_hours - v_work_hours;



  IF v_overtime > 0 THEN

    INSERT INTO public.overtime_requests (

      company_id, employee_id, date, hours, origin, status

    ) VALUES (

      NEW.company_id,

      NEW.employee_id,

      NEW.timestamp::date,

      ROUND(v_overtime, 2),

      'automatic',

      'pending'

    )

    -- Evitar duplicados si el trigger se ejecuta m├ís de una vez

    ON CONFLICT DO NOTHING;

  END IF;



  RETURN NEW;

END;

$$;


--
-- Name: get_user_company(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company() RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    AS $$

  select company_id

  from public.profiles

  where id = auth.uid()

$$;


--
-- Name: get_worked_hours(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_worked_hours(p_employee_id uuid, p_date date) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_check_in  timestamptz;

  v_check_out timestamptz;

BEGIN

  SELECT timestamp INTO v_check_in

  FROM public.attendance_logs

  WHERE employee_id = p_employee_id

    AND type = 'check_in'

    AND timestamp::date = p_date

  ORDER BY timestamp DESC LIMIT 1;



  SELECT timestamp INTO v_check_out

  FROM public.attendance_logs

  WHERE employee_id = p_employee_id

    AND type = 'check_out'

    AND timestamp::date = p_date

  ORDER BY timestamp DESC LIMIT 1;



  IF v_check_in IS NULL OR v_check_out IS NULL THEN

    RETURN 0;

  END IF;



  RETURN ROUND(

    EXTRACT(EPOCH FROM (v_check_out - v_check_in)) / 3600.0,

    2

  );

END;

$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

begin

  insert into public.profiles (id, full_name, role, company_id)

  values (

    new.id,

    new.raw_user_meta_data->>'full_name',

    coalesce(new.raw_user_meta_data->>'role', 'employee'),

    (new.raw_user_meta_data->>'company_id')::uuid

  );

  return new;

end;

$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$

  SELECT role = 'admin'

  FROM profiles

  WHERE id = auth.uid();

$$;


--
-- Name: mark_check_in(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_check_in() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$



declare

  emp_id uuid;

  attendance_id uuid;



begin



  -- Buscar empleado del usuario actual

  select id

  into emp_id

  from public.employees

  where user_id = auth.uid();





  if emp_id is null then

    return json_build_object(

      'success', false,

      'message', 'Empleado no encontrado'

    );

  end if;





  -- Crear asistencia



  insert into public.attendance

  (

    employee_id,

    check_in

  )



  values

  (

    emp_id,

    now()

  )



  returning id into attendance_id;





  return json_build_object(

    'success', true,

    'attendance_id', attendance_id

  );





end;



$$;


--
-- Name: mark_check_out(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_check_out() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$





declare



  emp_id uuid;





begin





select id

into emp_id



from employees



where user_id = auth.uid();







update attendance



set



check_out = now(),



worked_minutes =

extract(epoch from (now() - check_in))/60





where employee_id = emp_id



and check_out is null;







return json_build_object(



'success', true



);





end;





$$;


--
-- Name: my_company_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_company_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$

  select company_id from public.profiles

  where id = auth.uid()

  limit 1;

$$;


--
-- Name: my_employee_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_employee_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$

  SELECT id FROM public.employees

  WHERE user_id = auth.uid()

  LIMIT 1;

$$;


--
-- Name: my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$

  select role from public.profiles

  where id = auth.uid()

  limit 1;

$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    attendance_date date DEFAULT CURRENT_DATE NOT NULL,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    worked_minutes integer DEFAULT 0 NOT NULL,
    overtime_minutes integer DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'present'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    type text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    lat numeric(10,7) NOT NULL,
    lng numeric(10,7) NOT NULL,
    distance_m integer,
    is_valid boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_logs_type_check CHECK ((type = ANY (ARRAY['check_in'::text, 'check_out'::text])))
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying NOT NULL,
    rut character varying(12),
    address text,
    active boolean DEFAULT true
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    work_hours_day numeric(4,2) DEFAULT 8 NOT NULL,
    geo_lat numeric(10,7),
    geo_lng numeric(10,7),
    geo_radius_m integer DEFAULT 200 NOT NULL,
    vacation_days integer DEFAULT 15 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    work_start_time time without time zone DEFAULT '09:00:00'::time without time zone,
    work_end_time time without time zone DEFAULT '18:00:00'::time without time zone,
    work_days text[] DEFAULT '{monday,tuesday,wednesday,thursday,friday}'::text[],
    late_tolerance_minutes integer DEFAULT 15
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name character varying NOT NULL,
    company_id uuid NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    address text NOT NULL,
    rut character varying NOT NULL,
    "position" text,
    company_id uuid NOT NULL,
    user_id uuid,
    department_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hour_rate numeric
);


--
-- Name: TABLE employees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employees IS 'tabla  empleados';


--
-- Name: overtime_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.overtime_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    date date NOT NULL,
    hours numeric(4,2) NOT NULL,
    origin text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT overtime_requests_hours_check CHECK ((hours > (0)::numeric)),
    CONSTRAINT overtime_requests_origin_check CHECK ((origin = ANY (ARRAY['automatic'::text, 'manual'::text]))),
    CONSTRAINT overtime_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    full_name character varying,
    role character varying DEFAULT 'employee'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vacation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacation_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_requested integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_note text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vacation_requests_days_requested_check CHECK ((days_requested > 0)),
    CONSTRAINT vacation_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date))
);


--
-- Name: vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, employee_id, attendance_date, check_in, check_out, worked_minutes, overtime_minutes, status, created_at, updated_at) FROM stdin;
51ce48be-6b52-413f-9a56-718114c44dca	7bab372a-2fb3-4d85-8cf0-b3d28050b8b0	2026-06-11	2026-06-11 00:23:34.436019+00	\N	0	0	present	2026-06-11 00:23:34.436019+00	2026-06-11 00:23:34.436019+00
\.


--
-- Data for Name: attendance_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_logs (id, company_id, employee_id, type, "timestamp", lat, lng, distance_m, is_valid, notes, created_at) FROM stdin;
6cb524c3-7447-42a3-8c84-3ce283ba6c0f	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	check_in	2026-06-27 17:55:35.034637+00	-33.4619064	-70.6020258	31	t	\N	2026-06-27 17:55:35.034637+00
76010d5c-53f7-4e4d-be04-b2e2714c11a8	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	check_out	2026-06-27 19:09:26.131513+00	-33.4617885	-70.6020651	27	t	\N	2026-06-27 19:09:26.131513+00
211c23e5-1c0f-4496-b3cb-7fad04f30aef	013cbf21-6540-4cbd-9da6-7dfaf52c0527	4c9d5cb3-a8ff-4df3-87f5-c414addaea5d	check_in	2026-06-27 19:26:44.173126+00	-33.4617665	-70.6019676	36	t	\N	2026-06-27 19:26:44.173126+00
3b3e137b-2a7f-4d33-b952-44f9e9173802	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	check_in	2026-06-27 19:27:33.597433+00	-33.4618167	-70.6020151	31	t	\N	2026-06-27 19:27:33.597433+00
6e23a720-1a0e-4eb8-b91b-3addb349fb43	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	check_out	2026-06-27 19:29:21.678273+00	-33.4618167	-70.6020151	31	t	\N	2026-06-27 19:29:21.678273+00
1c4a27ee-7bf0-419d-a92e-143377255c8e	013cbf21-6540-4cbd-9da6-7dfaf52c0527	4c9d5cb3-a8ff-4df3-87f5-c414addaea5d	check_out	2026-06-27 19:46:10.30382+00	-33.4619224	-70.6019313	39	t	\N	2026-06-27 19:46:10.30382+00
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, created_at, updated_at, name, rut, address, active) FROM stdin;
013cbf21-6540-4cbd-9da6-7dfaf52c0527	2026-06-10 23:53:58.401088+00	2026-06-10 23:53:58.401088+00	Gava 	12345678-9	obispo uma├▒a 2855	t
7302825c-9d65-421f-b80f-a18e46d4817d	2026-06-11 00:00:49.66086+00	2026-06-11 00:00:49.66086+00	coca cola	111111111-1	av la monta├▒a 1244	t
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, company_id, work_hours_day, geo_lat, geo_lng, geo_radius_m, vacation_days, created_at, updated_at, work_start_time, work_end_time, work_days, late_tolerance_minutes) FROM stdin;
95e46a2b-cc2e-4c41-84cd-cfd10429f4fb	013cbf21-6540-4cbd-9da6-7dfaf52c0527	8.00	-33.4618484	-70.6023472	500	15	2026-06-22 11:59:55.470807+00	2026-06-27 17:55:20.435793+00	09:00:00	18:00:00	{monday,tuesday,wednesday,thursday,friday}	15
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, created_at, name, company_id) FROM stdin;
0772ab56-8ebe-4719-9fc0-958fd54eefd0	2026-06-11 00:04:24.775048+00	Despacho	013cbf21-6540-4cbd-9da6-7dfaf52c0527
b8cb06cc-2ced-405b-8d68-6d975dcc2798	2026-06-27 19:24:39.114541+00	ventas	013cbf21-6540-4cbd-9da6-7dfaf52c0527
426a80c6-ea65-4058-8214-8876290b33b2	2026-06-27 19:24:47.345926+00	bodega	013cbf21-6540-4cbd-9da6-7dfaf52c0527
23cd7c69-02ca-4c0e-8203-a14257873537	2026-06-27 19:24:55.546232+00	picking	013cbf21-6540-4cbd-9da6-7dfaf52c0527
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, created_at, first_name, last_name, address, rut, "position", company_id, user_id, department_id, updated_at, hour_rate) FROM stdin;
7bab372a-2fb3-4d85-8cf0-b3d28050b8b0	2026-06-11 00:12:08.020145+00	Juan	Perez	matucana 1161	12345678-9	Chofer	013cbf21-6540-4cbd-9da6-7dfaf52c0527	8e9850a5-6a61-4b2d-a592-4a6092755b1d	0772ab56-8ebe-4719-9fc0-958fd54eefd0	2026-06-11 00:12:08.020145+00	5000
b6e2f9be-607c-454a-b999-107249dc7208	2026-06-24 11:48:13.380054+00	empleado_1	prueba	matanaga 1234	444444444-4	chofer	013cbf21-6540-4cbd-9da6-7dfaf52c0527	4fbaec19-ea32-453a-91b8-4d4a077ec436	0772ab56-8ebe-4719-9fc0-958fd54eefd0	2026-06-25 11:51:52.225+00	5000
d1d0ffcf-32c0-4381-bd43-8ed84b6a75b6	2026-06-24 00:06:42.077568+00	jovi	alor	Matucana 1161	3333333333	vendedora	013cbf21-6540-4cbd-9da6-7dfaf52c0527	\N	b8cb06cc-2ced-405b-8d68-6d975dcc2798	2026-06-27 19:25:15.983+00	6000
923030cd-248f-4e6c-8457-bb79b02997b0	2026-06-21 00:20:24.707914+00	juliana	molina	Matucana 1161	271707770	jefe de area	013cbf21-6540-4cbd-9da6-7dfaf52c0527	\N	426a80c6-ea65-4058-8214-8876290b33b2	2026-06-27 19:25:27.597+00	5000
4c9d5cb3-a8ff-4df3-87f5-c414addaea5d	2026-06-27 19:20:32.252541+00	kevin	alvarez	lo espejo 123	5555555555-5	chofer	013cbf21-6540-4cbd-9da6-7dfaf52c0527	2cbb4977-6dc0-4ead-ac54-9727e08f1f54	0772ab56-8ebe-4719-9fc0-958fd54eefd0	2026-06-27 19:25:46.814+00	6000
\.


--
-- Data for Name: overtime_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.overtime_requests (id, company_id, employee_id, date, hours, origin, reason, status, approved_by, approved_at, rejection_note, created_at, updated_at) FROM stdin;
c397d769-b62f-476c-b0f3-f95fa3566a9c	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-24	2.00	manual	almuerzo	approved	\N	2026-06-25 12:09:39.649+00	\N	2026-06-24 11:48:44.789104+00	2026-06-25 12:09:39.879758+00
b63e56e2-cfee-485c-b9cb-7066c503c8c5	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-27	2.00	manual	2da vuelta	rejected	\N	\N	solo se considera 1 hora extra	2026-06-27 11:32:37.373307+00	2026-06-27 11:34:36.759171+00
23d5ccb2-48c6-48e7-8993-5963ab284de8	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-27	1.00	manual	2da vuelta	approved	\N	2026-06-27 11:36:57.016+00	\N	2026-06-27 11:35:37.534333+00	2026-06-27 11:36:57.601981+00
86c81d0b-4127-4585-8595-98ce5e1ec3ef	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-27	4.00	manual	viaje al sur	approved	\N	2026-06-27 17:59:03.571+00	\N	2026-06-27 17:58:00.75594+00	2026-06-27 17:59:04.183691+00
acead371-05ce-4d08-93c4-dcbbbcdcad14	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-27	1.00	manual	horario pico	approved	\N	2026-06-27 19:14:32.518+00	\N	2026-06-27 18:56:07.972216+00	2026-06-27 19:14:33.145495+00
339b0085-57d6-4eb1-8413-47cdfe5dd368	013cbf21-6540-4cbd-9da6-7dfaf52c0527	4c9d5cb3-a8ff-4df3-87f5-c414addaea5d	2026-06-27	1.00	manual	almuerzo	approved	\N	2026-06-27 19:26:15.857+00	\N	2026-06-27 19:23:25.618025+00	2026-06-27 19:26:16.466426+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, company_id, full_name, role, created_at) FROM stdin;
e8ee030c-a5d4-4474-82ed-886a6e7eb972	013cbf21-6540-4cbd-9da6-7dfaf52c0527	David Lozano	admin	2026-06-10 23:56:36.251691+00
8e9850a5-6a61-4b2d-a592-4a6092755b1d	013cbf21-6540-4cbd-9da6-7dfaf52c0527	juan perez	employee	2026-06-11 00:30:43.811312+00
2b459bf3-6a34-4efe-b8f2-1d17dc25dac0	013cbf21-6540-4cbd-9da6-7dfaf52c0527	david_admin	admin	2026-06-24 00:04:30.288716+00
28418f9c-e0a6-4af9-9e98-f87e34ef9c7e	013cbf21-6540-4cbd-9da6-7dfaf52c0527	juliana molina	employee	2026-06-24 00:20:06.596372+00
4fbaec19-ea32-453a-91b8-4d4a077ec436	013cbf21-6540-4cbd-9da6-7dfaf52c0527	\N	employee	2026-06-24 11:28:49.713194+00
2cbb4977-6dc0-4ead-ac54-9727e08f1f54	013cbf21-6540-4cbd-9da6-7dfaf52c0527	\N	employee	2026-06-27 19:19:07.549241+00
\.


--
-- Data for Name: vacation_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vacation_requests (id, company_id, employee_id, start_date, end_date, days_requested, status, approved_by, approved_at, rejection_note, notes, created_at, updated_at) FROM stdin;
f255e44e-9c45-46e7-b340-4d838d8a1da8	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-06-25	2026-06-30	4	approved	\N	2026-06-25 12:09:52.101+00	\N	vacaciones de invierno	2026-06-24 11:49:18.822213+00	2026-06-25 12:09:52.296734+00
4d8f1624-8814-41c1-80ef-7aa0c087bec9	013cbf21-6540-4cbd-9da6-7dfaf52c0527	b6e2f9be-607c-454a-b999-107249dc7208	2026-07-15	2026-07-22	6	approved	\N	2026-06-27 11:53:49.482+00	\N	vacaciones de invierno	2026-06-27 11:50:35.500194+00	2026-06-27 11:53:50.072214+00
\.


--
-- Data for Name: vacations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vacations (id, employee_id, start_date, end_date, status, approved_by, created_at) FROM stdin;
\.


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_rut_key UNIQUE (rut);


--
-- Name: company_settings company_settings_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_key UNIQUE (company_id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_rut_key UNIQUE (rut);


--
-- Name: overtime_requests overtime_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: vacation_requests vacation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT vacation_requests_pkey PRIMARY KEY (id);


--
-- Name: vacations vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_pkey PRIMARY KEY (id);


--
-- Name: employees_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_company_idx ON public.employees USING btree (company_id);


--
-- Name: idx_attendance_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_company ON public.attendance_logs USING btree (company_id);


--
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_date ON public.attendance_logs USING btree ("timestamp");


--
-- Name: idx_attendance_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_employee ON public.attendance_logs USING btree (employee_id);


--
-- Name: idx_overtime_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_overtime_company ON public.overtime_requests USING btree (company_id);


--
-- Name: idx_overtime_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_overtime_employee ON public.overtime_requests USING btree (employee_id);


--
-- Name: idx_overtime_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_overtime_status ON public.overtime_requests USING btree (status);


--
-- Name: idx_vacation_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacation_company ON public.vacation_requests USING btree (company_id);


--
-- Name: idx_vacation_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacation_employee ON public.vacation_requests USING btree (employee_id);


--
-- Name: idx_vacation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacation_status ON public.vacation_requests USING btree (status);


--
-- Name: profiles_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_company_idx ON public.profiles USING btree (company_id);


--
-- Name: attendance_logs trg_auto_overtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_overtime AFTER INSERT ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION public.auto_generate_overtime();


--
-- Name: company_settings trg_company_settings_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_company_settings_updated BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: overtime_requests trg_overtime_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_overtime_updated BEFORE UPDATE ON public.overtime_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vacation_requests trg_vacation_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vacation_updated BEFORE UPDATE ON public.vacation_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: attendance attendance_employee_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance_logs attendance_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: attendance_logs attendance_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: departments departments_company_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_company_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: employees employees_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: overtime_requests overtime_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: overtime_requests overtime_requests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: overtime_requests overtime_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_company_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_company_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vacation_requests vacation_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT vacation_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: vacation_requests vacation_requests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT vacation_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: vacation_requests vacation_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT vacation_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: vacations vacations_employee_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: company_settings Admin can update own company settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update own company settings" ON public.company_settings FOR UPDATE USING ((company_id = public.get_user_company()));


--
-- Name: company_settings Admin can view own company settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view own company settings" ON public.company_settings FOR SELECT USING ((company_id = public.get_user_company()));


--
-- Name: departments Admin creates departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin creates departments" ON public.departments FOR INSERT WITH CHECK (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: profiles Admin creates profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin creates profiles" ON public.profiles FOR INSERT WITH CHECK (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: attendance Admin deletes attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin deletes attendance" ON public.attendance FOR DELETE USING ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin()))));


--
-- Name: departments Admin deletes departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin deletes departments" ON public.departments FOR DELETE USING (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: profiles Admin deletes profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin deletes profiles" ON public.profiles FOR DELETE USING (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: vacations Admin deletes vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin deletes vacations" ON public.vacations FOR DELETE USING ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin()))));


--
-- Name: attendance Admin updates attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin updates attendance" ON public.attendance FOR UPDATE USING ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin()))));


--
-- Name: departments Admin updates departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin updates departments" ON public.departments FOR UPDATE USING (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: companies Admin updates own company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin updates own company" ON public.companies FOR UPDATE USING (((id = public.get_user_company()) AND public.is_admin()));


--
-- Name: vacations Admin updates vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin updates vacations" ON public.vacations FOR UPDATE USING ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin()))));


--
-- Name: employees Create employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Create employees" ON public.employees FOR INSERT WITH CHECK (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: vacations Create vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Create vacations" ON public.vacations FOR INSERT WITH CHECK (((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.user_id = auth.uid()))) OR (employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin())))));


--
-- Name: employees Delete employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete employees" ON public.employees FOR DELETE USING (((company_id = public.get_user_company()) AND public.is_admin()));


--
-- Name: employees Employee can insert own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employee can insert own record" ON public.employees FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: employees Employee can view own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employee can view own record" ON public.employees FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: employees Update employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Update employees" ON public.employees FOR UPDATE USING ((company_id = public.get_user_company()));


--
-- Name: profiles Update own profile or admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Update own profile or admin" ON public.profiles FOR UPDATE USING (((id = auth.uid()) OR ((company_id = public.get_user_company()) AND public.is_admin())));


--
-- Name: companies Users can view their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their company" ON public.companies FOR SELECT USING ((id = public.get_user_company()));


--
-- Name: attendance View attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View attendance" ON public.attendance FOR SELECT USING (((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.user_id = auth.uid()))) OR (employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin())))));


--
-- Name: departments View company departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View company departments" ON public.departments FOR SELECT USING ((company_id = public.get_user_company()));


--
-- Name: employees View company employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View company employees" ON public.employees FOR SELECT USING ((company_id = public.get_user_company()));


--
-- Name: profiles View company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View company profiles" ON public.profiles FOR SELECT USING ((company_id = public.get_user_company()));


--
-- Name: vacations View vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View vacations" ON public.vacations FOR SELECT USING (((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.user_id = auth.uid()))) OR (employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE ((employees.company_id = public.get_user_company()) AND public.is_admin())))));


--
-- Name: attendance_logs admin_company_attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_company_attendance ON public.attendance_logs USING (((company_id = public.my_company_id()) AND (public.my_role() = ANY (ARRAY['admin'::text, 'superadmin'::text]))));


--
-- Name: overtime_requests admin_company_overtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_company_overtime ON public.overtime_requests USING (((company_id = public.my_company_id()) AND (public.my_role() = ANY (ARRAY['admin'::text, 'superadmin'::text]))));


--
-- Name: vacation_requests admin_company_vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_company_vacations ON public.vacation_requests USING (((company_id = public.my_company_id()) AND (public.my_role() = ANY (ARRAY['admin'::text, 'superadmin'::text]))));


--
-- Name: company_settings admin_manage_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_settings ON public.company_settings USING (((company_id = public.my_company_id()) AND (public.my_role() = ANY (ARRAY['admin'::text, 'superadmin'::text]))));


--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: company_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_logs employee_own_attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_own_attendance ON public.attendance_logs USING (((employee_id = public.my_employee_id()) AND (public.my_role() = 'employee'::text)));


--
-- Name: overtime_requests employee_own_overtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_own_overtime ON public.overtime_requests USING (((employee_id = public.my_employee_id()) AND (public.my_role() = 'employee'::text)));


--
-- Name: vacation_requests employee_own_vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_own_vacations ON public.vacation_requests USING (((employee_id = public.my_employee_id()) AND (public.my_role() = 'employee'::text)));


--
-- Name: company_settings employee_read_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_read_settings ON public.company_settings FOR SELECT USING ((company_id = public.my_company_id()));


--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: overtime_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: vacation_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: vacations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

