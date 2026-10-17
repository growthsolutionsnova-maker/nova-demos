-- Emotional Reconstruction Program · Base de datos real (piloto, fase 2)
-- Proyecto Supabase PROPIO del programa (organización "Emotional Reconstruction").
--
-- Cómo se protege a las personas:
--  * La persona no necesita cuenta: su teléfono tiene un código seudónimo (pid) + un secreto.
--    La base solo guarda el hash del secreto. Todo lo que escribe pasa por funciones que lo verifican.
--  * El email (si lo da para "guardar su mapa") va en una tabla aparte que nadie del equipo puede leer.
--  * El texto libre de la reflexión se guarda cifrado; la clave vive en Supabase Vault.
--  * El equipo entra con Supabase Auth (email + clave) y ve según su rol:
--      admin    → publica contenido, ve todo lo seudónimo
--      team     → Dashboard (todo lo seudónimo)
--      research → Lab (solo personas que aceptaron investigación)
--  * Nadie con la llave pública puede leer tablas directamente (RLS sin políticas para anon).

create extension if not exists pgcrypto with schema extensions;

-- ---------- Equipo ----------
create table public.staff_roles (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('admin', 'team', 'research')),
  created_at timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

create or replace function public.erp_role() returns text
language sql stable security definer set search_path = public as $$
  select role from staff_roles where email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.erp_has_role(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(erp_role() = r or erp_role() = 'admin', false);
$$;

create policy "staff ve su propio rol" on public.staff_roles for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- Dispositivos (identidad seudónima) ----------
create table public.devices (
  pid uuid primary key,
  secret_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.devices enable row level security;

-- Email: separado y solo escribible. Nadie lo lee desde la app ni desde el Lab.
create table public.identities (
  pid uuid primary key references public.devices(pid) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.identities enable row level security;

create table public.profiles (
  pid uuid primary key references public.devices(pid) on delete cascade,
  lang text not null default 'es',
  country text,
  age text,
  motive text,
  reminder text,
  avatar_name text,
  consent_data boolean not null default true,
  consent_research boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "equipo lee perfiles" on public.profiles for select to authenticated
  using (erp_has_role('team') or (erp_has_role('research') and consent_research));

-- ---------- Contenido versionado ----------
create table public.configs (
  version int primary key,
  content jsonb not null,
  note text,
  published_by text default (auth.jwt() ->> 'email'),
  published_at timestamptz not null default now()
);
alter table public.configs enable row level security;
create policy "todos leen el contenido" on public.configs for select to anon, authenticated using (true);
create policy "admin publica" on public.configs for insert to authenticated with check (erp_has_role('admin'));

-- ---------- Check-ins ----------
create table public.sessions (
  sid uuid primary key,
  pid uuid not null references public.devices(pid) on delete cascade,
  started_at timestamptz not null,
  local_date date not null,
  local_hour smallint not null,
  dow smallint not null,
  dom smallint not null,
  tz text,
  tz_offset int,
  config_version int not null,
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
  duration_ms int,
  updated_at timestamptz not null default now()
);
create index sessions_pid_started on public.sessions (pid, started_at);
create index sessions_started on public.sessions (started_at);
alter table public.sessions enable row level security;
create policy "equipo lee check-ins" on public.sessions for select to authenticated using (
  erp_has_role('team') or (erp_has_role('research') and exists (select 1 from profiles p where p.pid = sessions.pid and p.consent_research))
);

create table public.answers (
  id bigint generated always as identity primary key,
  sid uuid not null references public.sessions(sid) on delete cascade,
  pid uuid not null references public.devices(pid) on delete cascade,
  screen text not null,
  key text not null,
  code text not null,
  ms int,
  config_version int not null,
  at timestamptz not null default now()
);
create index answers_sid on public.answers (sid);
alter table public.answers enable row level security;
create policy "investigación lee respuestas" on public.answers for select to authenticated using (
  erp_has_role('team') or (erp_has_role('research') and exists (select 1 from profiles p where p.pid = answers.pid and p.consent_research))
);

-- Texto libre cifrado (nadie del equipo lo lee desde la app)
create table public.session_notes (
  sid uuid primary key references public.sessions(sid) on delete cascade,
  pid uuid not null references public.devices(pid) on delete cascade,
  note_encrypted bytea not null,
  created_at timestamptz not null default now()
);
alter table public.session_notes enable row level security;

create table public.events (
  id bigint generated always as identity primary key,
  pid uuid references public.devices(pid) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "equipo lee eventos" on public.events for select to authenticated using (erp_has_role('team'));

-- ---------- Funciones para el teléfono (verifican el secreto del dispositivo) ----------
create or replace function public._erp_ok(p_pid uuid, p_secret text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from devices where pid = p_pid and secret_hash = encode(digest(p_secret, 'sha256'), 'hex'));
$$;
revoke all on function public._erp_ok(uuid, text) from public, anon, authenticated;

create or replace function public.erp_register(p_pid uuid, p_secret text, p_profile jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(p_secret) < 32 then raise exception 'secreto inválido'; end if;
  insert into devices (pid, secret_hash) values (p_pid, encode(digest(p_secret, 'sha256'), 'hex'))
    on conflict (pid) do nothing;
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  insert into profiles (pid, lang, country, consent_data, consent_research, consent_version)
  values (p_pid, coalesce(p_profile->>'lang', 'es'), p_profile->>'country', coalesce((p_profile->>'consentData')::boolean, true),
          coalesce((p_profile->>'consentResearch')::boolean, false), p_profile->>'consentVersion')
  on conflict (pid) do nothing;
end; $$;

create or replace function public.erp_update_profile(p_pid uuid, p_secret text, p_patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  update profiles set
    lang = coalesce(p_patch->>'lang', lang),
    country = coalesce(p_patch->>'country', country),
    age = coalesce(p_patch->>'age', age),
    motive = coalesce(p_patch->>'motive', motive),
    reminder = coalesce(p_patch->>'reminder', reminder),
    avatar_name = case when p_patch ? 'avatarName' then left(p_patch->>'avatarName', 20) else avatar_name end,
    consent_research = coalesce((p_patch->>'consentResearch')::boolean, consent_research)
  where pid = p_pid;
end; $$;

create or replace function public.erp_upsert_session(p_pid uuid, p_secret text, p_s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  insert into sessions (sid, pid, started_at, local_date, local_hour, dow, dom, tz, tz_offset, config_version,
    answers, path, completed, last_screen, crisis, crisis_reason, factor, rule_id, action_id, action_done, verse_id, duration_ms)
  values ((p_s->>'sid')::uuid, p_pid, (p_s->>'startedAt')::timestamptz, (p_s->>'localDate')::date, (p_s->>'hour')::smallint,
    (p_s->>'dow')::smallint, (p_s->>'dom')::smallint, p_s->>'tz', (p_s->>'tzOffset')::int, coalesce((p_s->>'configVersion')::int, 1),
    coalesce(p_s->'answers', '{}'), coalesce(array(select jsonb_array_elements_text(p_s->'path')), '{}'),
    coalesce((p_s->>'completed')::boolean, false), p_s->>'lastScreen', coalesce((p_s->>'crisis')::boolean, false), p_s->>'crisisReason',
    p_s->>'factor', p_s->>'ruleId', p_s->>'actionId', (p_s->>'actionDone')::boolean, p_s->>'verseId', (p_s->>'durationMs')::int)
  on conflict (sid) do update set
    answers = excluded.answers, path = excluded.path, completed = excluded.completed, last_screen = excluded.last_screen,
    crisis = excluded.crisis, crisis_reason = excluded.crisis_reason, factor = excluded.factor, rule_id = excluded.rule_id,
    action_id = excluded.action_id, action_done = excluded.action_done, verse_id = excluded.verse_id,
    duration_ms = excluded.duration_ms, updated_at = now()
  where sessions.pid = p_pid;
end; $$;

create or replace function public.erp_answer(p_pid uuid, p_secret text, p_a jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  insert into answers (sid, pid, screen, key, code, ms, config_version, at)
  select (p_a->>'sid')::uuid, p_pid, p_a->>'screen', p_a->>'key', p_a->>'code', (p_a->>'ms')::int, coalesce((p_a->>'v')::int, 1),
         coalesce((p_a->>'at')::timestamptz, now())
  where exists (select 1 from sessions where sid = (p_a->>'sid')::uuid and pid = p_pid);
end; $$;

create or replace function public.erp_note(p_pid uuid, p_secret text, p_sid uuid, p_note text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text;
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'erp_notes_key';
  insert into session_notes (sid, pid, note_encrypted) values (p_sid, p_pid, pgp_sym_encrypt(left(p_note, 280), k))
  on conflict (sid) do update set note_encrypted = excluded.note_encrypted;
end; $$;

create or replace function public.erp_event(p_pid uuid, p_secret text, p_type text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  insert into events (pid, type, data) values (p_pid, left(p_type, 40), coalesce(p_data, '{}'));
end; $$;

create or replace function public.erp_save_email(p_pid uuid, p_secret text, p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  insert into identities (pid, email) values (p_pid, lower(p_email))
  on conflict (pid) do update set email = excluded.email;
end; $$;

-- Derecho a borrar: elimina el dispositivo y todo cae en cascada.
create or replace function public.erp_delete_me(p_pid uuid, p_secret text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not _erp_ok(p_pid, p_secret) then raise exception 'no autorizado'; end if;
  delete from devices where pid = p_pid;
end; $$;

grant execute on function public.erp_register, public.erp_update_profile, public.erp_upsert_session, public.erp_answer,
  public.erp_note, public.erp_event, public.erp_save_email, public.erp_delete_me to anon, authenticated;
grant execute on function public.erp_role, public.erp_has_role to authenticated;
revoke execute on function public.erp_role, public.erp_has_role from public, anon;

-- Clave para cifrar las notas (vive en Vault, nunca en el código)
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'erp_notes_key', 'Clave de cifrado de session_notes');
