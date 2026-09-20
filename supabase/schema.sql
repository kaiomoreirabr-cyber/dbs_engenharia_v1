create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  closing_period text not null default 'quinzenal'
    check (closing_period in ('semanal', 'quinzenal')),
  created_at timestamptz not null default now(),
  constraint projects_name_unique unique (name)
);

alter table projects
  add column if not exists closing_period text not null default 'quinzenal';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_closing_period_check'
  ) then
    alter table projects
      add constraint projects_closing_period_check
      check (closing_period in ('semanal', 'quinzenal'));
  end if;
end $$;

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  role text not null,
  daily_rate numeric(10, 2) not null check (daily_rate > 0),
  pix_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists employees_project_id_idx on employees (project_id);

create unique index if not exists employees_unique_name_per_project
  on employees (project_id, lower(name));

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  week_start date not null,
  day text not null check (day in ('seg', 'ter', 'qua', 'qui', 'sex', 'sab')),
  status text not null check (status in ('absent', 'full', 'half')) default 'absent',
  updated_at timestamptz not null default now(),
  constraint attendance_unique_slot unique (employee_id, week_start, day)
);

create index if not exists attendance_week_idx on attendance_records (week_start);
create index if not exists attendance_employee_idx on attendance_records (employee_id);

create table if not exists project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  description text not null,
  category text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price > 0),
  total numeric(12, 2) not null check (total >= 0),
  spent_at date not null,
  notes text,
  is_settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_expenses_project_idx on project_expenses (project_id);
create index if not exists project_expenses_date_idx on project_expenses (spent_at);

alter table project_expenses
  add column if not exists is_settled boolean not null default false;

alter table projects enable row level security;
alter table employees enable row level security;
alter table attendance_records enable row level security;
alter table project_expenses enable row level security;

drop policy if exists "projects_all" on projects;
create policy "projects_all" on projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "employees_all" on employees;
create policy "employees_all" on employees for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "attendance_all" on attendance_records;
create policy "attendance_all" on attendance_records for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "project_expenses_all" on project_expenses;
create policy "project_expenses_all" on project_expenses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['projects', 'employees', 'attendance_records', 'project_expenses']
    loop
      if not exists (
        select 1
        from pg_publication_rel publication_table
        join pg_publication publication on publication.oid = publication_table.prpubid
        join pg_class relation on relation.oid = publication_table.prrelid
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        where publication.pubname = 'supabase_realtime'
          and namespace.nspname = 'public'
          and relation.relname = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;
