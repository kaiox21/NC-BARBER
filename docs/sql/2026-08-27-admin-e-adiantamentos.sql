-- Papel de dono (admin) e adiantamentos.
-- Rodar no SQL Editor do Supabase (ou via MCP). Idempotente: pode rodar mais de uma vez.
--
-- O app lê `barbeiros.admin` no login (select('*')). Quem tem admin = true:
--   • vê a agenda e o faturamento de todos os barbeiros (políticas de select abaixo)
--   • lança e exclui adiantamentos, que o Caixa desconta do repasse de cada funcionário
-- Quem não é admin continua vendo só o que é seu; adiantamentos próprios são só leitura.

-- 1. Flag de admin ───────────────────────────────────────────────────────────
alter table public.barbeiros add column if not exists admin boolean not null default false;

-- Dono da barbearia. Email exato conferido no banco antes de rodar.
update public.barbeiros set admin = true where email = 'nettofrancisco82@gmail.com';

-- Função usada nas políticas. security definer para não cair na própria RLS de barbeiros.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select admin from public.barbeiros where id = auth.uid()), false);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Ninguém liga a própria flag pela API; só o painel/service role (auth.uid() nulo) ou outro admin.
create or replace function public.barbeiros_protege_admin()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.admin is distinct from old.admin and auth.uid() is not null and not public.is_admin() then
    raise exception 'sem permissão para alterar admin';
  end if;
  return new;
end;
$$;
drop trigger if exists barbeiros_protege_admin on public.barbeiros;
create trigger barbeiros_protege_admin
  before update on public.barbeiros
  for each row execute function public.barbeiros_protege_admin();

-- 2. Admin lê tudo (políticas permissivas somam-se às existentes por OR) ─────
drop policy if exists "admin le todos os barbeiros" on public.barbeiros;
create policy "admin le todos os barbeiros"
  on public.barbeiros for select to authenticated
  using (public.is_admin());

drop policy if exists "admin le todos os agendamentos" on public.agendamentos;
create policy "admin le todos os agendamentos"
  on public.agendamentos for select to authenticated
  using (public.is_admin());

drop policy if exists "admin le todos os agendamento_servicos" on public.agendamento_servicos;
create policy "admin le todos os agendamento_servicos"
  on public.agendamento_servicos for select to authenticated
  using (public.is_admin());

-- 3. Adiantamentos ───────────────────────────────────────────────────────────
create table if not exists public.adiantamentos (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  data        date not null default current_date,
  valor       numeric(10,2) not null check (valor > 0),
  descricao   text,
  criado_por  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists adiantamentos_barbeiro_data_idx on public.adiantamentos (barbeiro_id, data);

alter table public.adiantamentos enable row level security;

drop policy if exists "barbeiro le os proprios adiantamentos" on public.adiantamentos;
create policy "barbeiro le os proprios adiantamentos"
  on public.adiantamentos for select to authenticated
  using (barbeiro_id = auth.uid());

drop policy if exists "admin gerencia adiantamentos" on public.adiantamentos;
create policy "admin gerencia adiantamentos"
  on public.adiantamentos for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.adiantamentos to authenticated;

-- 4. Grants das funções (o Supabase concede execute a anon/authenticated por padrão) ──
-- is_admin() precisa ser executável por authenticated (as políticas rodam como o usuário), mas não por anon.
revoke execute on function public.is_admin() from anon;
-- Função de trigger roda como owner; ninguém precisa chamá-la pela API.
revoke execute on function public.barbeiros_protege_admin() from anon, authenticated, public;
