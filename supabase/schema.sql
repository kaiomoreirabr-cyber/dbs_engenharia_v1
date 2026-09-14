-- Controle de Frequência de Obras — schema do banco (Supabase / Postgres)
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- ========== OBRAS ==========
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- ALTERAÇÃO: nova coluna "closing_period" define o período de fechamento
  -- (pagamento) da obra. 'semanal' fecha a cada 1 semana (6 dias, seg-sáb);
  -- 'quinzenal' fecha a cada 2 semanas (12 dias). Por padrão, novas obras
  -- nascem como 'quinzenal', que é o modo de pagamento mais usado na empresa.
  closing_period text not null default 'quinzenal'
    check (closing_period in ('semanal', 'quinzenal')),
  created_at timestamptz not null default now(),
  constraint projects_name_unique unique (name)
);

-- ALTERAÇÃO: migração para bancos já existentes (criados antes desta mudança).
-- Se a tabela "projects" já existir sem a coluna "closing_period", este bloco
-- adiciona a coluna sem apagar nada. É seguro rodar mais de uma vez.
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

-- ========== FUNCIONÁRIOS ==========
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

-- Evita funcionários com o mesmo nome duplicado na mesma obra
create unique index if not exists employees_unique_name_per_project
  on employees (project_id, lower(name));

-- ========== FREQUÊNCIA (CHAMADA) ==========
-- Cada linha representa a marcação de um funcionário em um dia de uma semana específica.
-- week_start é sempre a segunda-feira (ISO) da semana em questão, o que permite
-- consultar/editar semanas passadas sem perder o histórico.
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

-- ========== RLS ==========
-- ALTERAÇÃO: antes essas políticas liberavam acesso total pra quem tivesse
-- a chave anon (uso interno, sem login). Agora que o app tem tela de login
-- (Supabase Auth), exigimos "authenticated" — só entra quem estiver logado
-- com um usuário criado em Authentication > Users. Rodar este arquivo de
-- novo num projeto que já tinha o schema antigo é seguro: os "drop policy"
-- removem a política antiga antes de criar a nova.
alter table projects enable row level security;
alter table employees enable row level security;
alter table attendance_records enable row level security;

drop policy if exists "projects_all" on projects;
create policy "projects_all" on projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "employees_all" on employees;
create policy "employees_all" on employees for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "attendance_all" on attendance_records;
create policy "attendance_all" on attendance_records for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ========== REALTIME ==========
-- Habilita atualização em tempo real (usada pelo front-end para refletir mudanças
-- feitas em outro dispositivo/aba automaticamente).
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table employees;
alter publication supabase_realtime add table attendance_records;
