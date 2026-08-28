-- Faltava política de DELETE em agendamentos: o botão "Excluir atendimento" do app
-- nunca apagava nada e não dava erro (RLS sem política = 0 linhas afetadas).
-- Cada barbeiro só apaga os próprios; agendamento_servicos cai junto pelo ON DELETE CASCADE.
-- Aplicado em produção em 2026-08-27 (migração agendamentos_delete_proprio).
drop policy if exists "agendamentos_delete" on public.agendamentos;
create policy "agendamentos_delete"
  on public.agendamentos for delete
  using (auth.uid() = barbeiro_id);
