-- Emotional Reconstruction Program · Esquema para la fase 2 (piloto con personas reales)
-- Para un proyecto Supabase PROPIO del programa (no reutilizar proyectos de otros clientes).
-- Principios: identidad separada de los datos emocionales, seudónimos, RLS en todo,
-- el equipo ve por rol y nadie descarga la base completa.

create extension if not exists pgcrypto;

-- ---------- Roles del equipo ----------
create table public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'team', 'research')),
  created_at timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

create or replace function public.has_role(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and (role = r or role = 'admin'));
$$;

create policy "staff ve su rol" on public.staff_roles for select using (user_id = auth.uid());

-- ---------- Identidad (separada) ----------
-- auth.users guarda el email. Esta tabla une la cuenta con el seudónimo y SOLO la ve su dueño.
-- El Lab y el Dashboard nunca leen esta tabla.
create table public.pseudonyms (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pid uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.pseudonyms enable row level security;
create policy "dueño ve su seudónimo" on public.pseudonyms for select using (user_id = auth.uid());
create policy "dueño crea su seudónimo" on public.pseudonyms for insert with check (user_id = auth.uid());

create or replace function public.my_pid() returns uuid
language sql stable security definer set search_path = public as $$
  select pid from pseudonyms where user_id = auth.uid();
$$;

-- ---------- Perfil seudónimo ----------
create table public.profiles (
  pid uuid primary key references public.pseudonyms(pid) on delete cascade,
  lang text not null default 'es',
  country text,
  age_range text,
  motive text,
  reminder text,
  avatar_name text,
  consent_data boolean not null,
  consent_research boolean not null default false,
  consent_version text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "dueño gestiona su perfil" on public.profiles for all using (pid = my_pid()) with check (pid = my_pid());
create policy "equipo lee perfiles" on public.profiles for select using (has_role('team') or (has_role('research') and consent_research));

-- ---------- Contenido versionado (lo que edita el Admin) ----------
create table public.configs (
  version int primary key,
  content jsonb not null,
  note text,
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now()
);
alter table public.configs enable row level security;
create policy "todos leen el contenido" on public.configs for select using (true);
create policy "admin publica" on public.configs for insert with check (has_role('admin'));

-- ---------- Check-ins ----------
create table public.sessions (
  sid uuid primary key default gen_random_uuid(),
  pid uuid not null references public.profiles(pid) on delete cascade,
  started_at timestamptz not null default now(),
  local_date date not null,
  local_hour smallint not null,
  dow smallint not null,
  dom smallint not null,
  tz text,
  config_version int not null references public.configs(version),
  answers jsonb not null default '{}',
  path text[] not null default '{}',
  completed boolean not null default false,
  last_screen text,
  crisis boolean not null default false,
  crisis_reason text,
  factor text,
  rule_id text,
  action_id text,
  action_done boolean,
  verse_id text,
  duration_ms int
);
create index on public.sessions (pid, started_at);
alter table public.sessions enable row level security;
create policy "dueño gestiona sus check-ins" on public.sessions for all using (pid = my_pid()) with check (pid = my_pid());
create policy "equipo lee check-ins" on public.sessions for select using (
  has_role('team') or (has_role('research') and exists (select 1 from profiles p where p.pid = sessions.pid and p.consent_research))
);

-- Respuestas como eventos (tiempo por pantalla, versión exacta)
create table public.answers (
  id bigint generated always as identity primary key,
  sid uuid not null references public.sessions(sid) on delete cascade,
  pid uuid not null references public.profiles(pid) on delete cascade,
  screen text not null,
  key text not null,
  code text not null,
  ms int,
  config_version int not null,
  at timestamptz not null default now()
);
alter table public.answers enable row level security;
create policy "dueño crea y ve sus respuestas" on public.answers for all using (pid = my_pid()) with check (pid = my_pid());
create policy "investigación lee respuestas" on public.answers for select using (
  has_role('research') and exists (select 1 from profiles p where p.pid = answers.pid and p.consent_research)
);

-- Texto libre de la reflexión: tabla aparte y cifrado. Solo lo lee su dueño.
-- La clave vive en Supabase Vault (secreto 'notes_key'), nunca en el código.
create table public.session_notes (
  sid uuid primary key references public.sessions(sid) on delete cascade,
  pid uuid not null references public.profiles(pid) on delete cascade,
  note_encrypted bytea not null,
  created_at timestamptz not null default now()
);
alter table public.session_notes enable row level security;
create policy "solo el dueño" on public.session_notes for all using (pid = my_pid()) with check (pid = my_pid());

-- Eventos de producto (separados de lo emocional)
create table public.events (
  id bigint generated always as identity primary key,
  pid uuid references public.profiles(pid) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "dueño crea eventos" on public.events for insert with check (pid = my_pid());
create policy "equipo lee eventos" on public.events for select using (has_role('team'));

-- Registro de auditoría: quién del equipo consultó qué
create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  action text not null,
  detail jsonb,
  at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "staff escribe auditoría" on public.audit_log for insert with check (has_role('team') or has_role('research'));
create policy "admin lee auditoría" on public.audit_log for select using (has_role('admin'));

-- Borrar mis datos (derecho del usuario): borra la cuenta y todo cae en cascada.
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
