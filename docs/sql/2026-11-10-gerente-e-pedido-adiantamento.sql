-- Novo modelo da barbearia (10/11/2026): gerente lança tudo, barbeiro só consulta e pede adiantamento.
-- Rodar no SQL Editor do Supabase (ou via MCP). Idempotente: pode rodar mais de uma vez.
--
--   • gerente (barbeiros.gerente = true): lê tudo, cria/edita/apaga agendamentos de qualquer barbeiro,
--     lança adiantamentos e aprova/recusa pedidos.
--   • admin (dono): continua lendo tudo, mas não escreve mais em agendamentos nem em adiantamentos.
--   • barbeiro: lê só o que é seu; não escreve em agendamentos; cria pedido de adiantamento
--     (sempre `pendente`) e pode cancelar o próprio pedido enquanto ele estiver pendente.
-- Só adiantamento `aprovado` desconta do repasse (cálculo no app, FaturamentoScreen).

-- 1. Flag de gerente ─────────────────────────────────────────────────────────
alter table public.barbeiros add column if not exists gerente boolean not null default false;

create or replace function public.is_gerente()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select gerente from public.barbeiros where id = auth.uid()), false);
$$;
revoke all on function public.is_gerente() from public;
revoke execute on function public.is_gerente() from anon;
grant execute on function public.is_gerente() to authenticated;

-- O trigger que protegia `admin` passa a proteger `gerente` também.
create or replace function public.barbeiros_protege_admin()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if (new.admin is distinct from old.admin or new.gerente is distinct from old.gerente)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'sem permissão para alterar admin/gerente';
  end if;
  return new;
end;
$$;
revoke execute on function public.barbeiros_protege_admin() from anon, authenticated, public;

drop policy if exists "gerente le todos os barbeiros" on public.barbeiros;
create policy "gerente le todos os barbeiros"
  on public.barbeiros for select to authenticated
  using (public.is_gerente());

-- 2. Agendamentos: só o gerente escreve ───────────────────────────────────────
-- Remove toda política de escrita (insert/update/delete/all) que exista hoje nas duas tabelas,
-- inclusive a "agendamentos_delete" de 27/08, e recria a leitura de forma explícita.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('agendamentos', 'agendamento_servicos')
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

drop policy if exists "barbeiro le os proprios agendamentos" on public.agendamentos;
create policy "barbeiro le os proprios agendamentos"
  on public.agendamentos for select to authenticated
  using (barbeiro_id = auth.uid());

drop policy if exists "barbeiro le os proprios agendamento_servicos" on public.agendamento_servicos;
create policy "barbeiro le os proprios agendamento_servicos"
  on public.agendamento_servicos for select to authenticated
  using (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.barbeiro_id = auth.uid()));

drop policy if exists "gerente gerencia agendamentos" on public.agendamentos;
create policy "gerente gerencia agendamentos"
  on public.agendamentos for all to authenticated
  using (public.is_gerente())
  with check (public.is_gerente());

drop policy if exists "gerente gerencia agendamento_servicos" on public.agendamento_servicos;
create policy "gerente gerencia agendamento_servicos"
  on public.agendamento_servicos for all to authenticated
  using (public.is_gerente())
  with check (public.is_gerente());

-- 3. Adiantamentos com pedido e aprovação ────────────────────────────────────
-- Os que já existem foram lançados pelo dono, então nascem `aprovado` (default).
alter table public.adiantamentos add column if not exists status text not null default 'aprovado';
alter table public.adiantamentos add column if not exists decidido_por uuid;
alter table public.adiantamentos add column if not exists decidido_em  timestamptz;
alter table public.adiantamentos drop constraint if exists adiantamentos_status_check;
alter table public.adiantamentos add constraint adiantamentos_status_check
  check (status in ('pendente', 'aprovado', 'recusado'));

-- Dono passa a só ler.
drop policy if exists "admin gerencia adiantamentos" on public.adiantamentos;
drop policy if exists "admin le todos os adiantamentos" on public.adiantamentos;
create policy "admin le todos os adiantamentos"
  on public.adiantamentos for select to authenticated
  using (public.is_admin());

drop policy if exists "gerente gerencia adiantamentos" on public.adiantamentos;
create policy "gerente gerencia adiantamentos"
  on public.adiantamentos for all to authenticated
  using (public.is_gerente())
  with check (public.is_gerente());

-- "barbeiro le os proprios adiantamentos" (select, barbeiro_id = auth.uid()) continua de 27/08.

drop policy if exists "barbeiro pede adiantamento" on public.adiantamentos;
create policy "barbeiro pede adiantamento"
  on public.adiantamentos for insert to authenticated
  with check (barbeiro_id = auth.uid() and status = 'pendente' and decidido_por is null and decidido_em is null);

drop policy if exists "barbeiro cancela pedido pendente" on public.adiantamentos;
create policy "barbeiro cancela pedido pendente"
  on public.adiantamentos for delete to authenticated
  using (barbeiro_id = auth.uid() and status = 'pendente');

-- 4. Conta do gerente ────────────────────────────────────────────────────────
-- Criar o usuário em Authentication → Users → Add user (email + senha), depois:
-- insert into public.barbeiros (id, nome, email, avatar, cor, ativo, gerente)
--   select id, '<Nome>', email, '<Iniciais>', '#a78bfa', true, true from auth.users where email = '<email>';
