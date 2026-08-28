# Próximos passos

Backlog do NC Barber, em ordem de prioridade. Cada item diz **o que**, **por que importa** e **como fazer**, com uma estimativa grosseira de esforço.

Contexto de arquitetura e armadilhas está em [`../CLAUDE.md`](../CLAUDE.md).

Última revisão: 12/08/2026.

---

## 1. Bugs que afetam o uso diário

### 1.1 A agenda mostra o dia errado depois das 21h · ~5 min

`AgendaTab` monta a data com `activeDay.toISOString().split('T')[0]` (`app/page.tsx:357`). `toISOString()` converte para UTC, e o Brasil é UTC-3 — então, a partir das 21h local, a string vira o **dia seguinte**. O barbeiro que abre a agenda às 21h30 para conferir o dia vê os agendamentos de amanhã rotulados como hoje, e não encontra os de hoje.

Piora porque o resto do app não faz isso: `NovoAgendamentoTab` e `AvulsoTab` gravam a data com componentes locais (`toDateStr`, `app/page.tsx:34`). Ou seja, grava-se local e lê-se UTC.

**Correção:** trocar a linha 357 por `toDateStr(activeDay.getDate(), activeDay.getMonth(), activeDay.getFullYear())`, que já existe e é o padrão do arquivo.

### 1.2 O rótulo "Hoje" aparece no dia errado · ~2 min

`app/page.tsx:411` usa `activeDayIdx === 0 ? 'Hoje' : ...`, mas o scroll de datas começa 7 dias atrás — hoje é o índice **7** (é o que a linha 404 usa para o `id="date-chip-today"`, e é o valor inicial do estado). Resultado: o dia de hoje aparece com a data escrita por extenso, e o dia de uma semana atrás aparece como "Hoje".

**Correção:** `activeDayIdx === 7 ? 'Hoje' : ...`.

### 1.3 A aba aberta não vira o dia à meia-noite · ~15 min

`today` é capturado uma vez, no carregamento do módulo (`app/page.tsx:32`), e usado no scroll de datas, na saudação e no calendário. Quem deixa o app aberto no celular e volta depois da meia-noite continua vendo o dia anterior. Como o horário de atendimento vai até 20h, o impacto é pequeno, mas é a mesma família de problema dos dois itens acima.

**Correção:** mover para um `useState(() => new Date())` no `NCBarberApp` e revalidar quando a aba volta ao foco (`visibilitychange`).

---

## 2. Tirar a régua de funcionário do código

### 2.1 Coluna `funcionario` na tabela `barbeiros` · ~20 min + SQL

Hoje quem recebe repasse é decidido por um array de emails hardcoded (`app/page.tsx:22`). Três problemas concretos:

- **É case-sensitive e falha em silêncio.** Já aconteceu: no commit `5c278c7` o email estava como `Kauanzinxl90@gmail.com` e o barbeiro simplesmente não recebeu repasse na tela, sem erro nenhum.
- **Os emails dos funcionários vão no bundle** e são visíveis no DevTools de qualquer visitante.
- **Toda mudança de quadro vira commit + deploy.**

O app já carrega o barbeiro inteiro com `select('*')` no login (`app/page.tsx:224`) e ao restaurar a sessão (`app/page.tsx:1131`), então o objeto `barber` já chega completo no componente — a troca no código é de uma linha.

```sql
alter table barbeiros add column funcionario boolean not null default false;
update barbeiros set funcionario = true
  where email in ('juninduamassa7@gmail.com','kaioxavier50@gmail.com',
                  'kauanzinxl90@gmail.com','carlos@gmail.com');
```

```diff
- const isFuncionario = FUNCIONARIOS.includes(barber.email);
+ const isFuncionario = barber.funcionario;
```

E apagar a constante `FUNCIONARIOS`.

> Como o repasse é derivado na renderização e não gravado em `agendamentos`, a mudança vale retroativamente para todo o histórico assim que a flag é ligada. Não há migração de dados a fazer.

### 2.2 Porcentagem por barbeiro — só se precisar · ~15 min

Os 50% / 60% estão fixos em `getRepasse` (`app/page.tsx:26`). Enquanto todos os funcionários tiverem o mesmo percentual, não vale a pena mexer. No dia em que um barbeiro negociar diferente, o caminho é uma coluna `pct_repasse` em `barbeiros` com default, e `getRepasse(total, data, barber)`.

---

## 3. O Caixa só enxerga o mês corrente

### 3.1 Navegação de meses anteriores no faturamento · ~1h

Os períodos são hoje, esta semana e este mês, e "este mês" é sempre o mês atual (`app/page.tsx:775-783`). Não existe nenhuma tela onde o barbeiro veja quanto faturou em julho. Para conferir repasse depois do fechamento do mês, isso vira consulta manual no Supabase.

**Correção:** adicionar setas de mês (`‹ Julho 2026 ›`) na `FaturamentoScreen`, guardando `viewYear`/`viewMonth` em estado e derivando o range a partir deles — o `NovoAgendamentoTab` já tem exatamente esse padrão de navegação (`app/page.tsx:466-467`), dá para copiar.

---

## 4. Higiene de configuração

### 4.1 Credenciais do Supabase em variáveis de ambiente · ~15 min

`app/page.tsx:6-9` tem a URL e a anon key escritas no código. A anon key é pública por design — quem protege os dados é a RLS, não o segredo da chave —, então isso **não é um vazamento**. Mas:

- O `README.md` manda copiar um `.env.example` e preencher `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nenhum dos dois arquivos existe e nenhuma das duas variáveis é lida. Quem clonar o repo seguindo o README não vai entender por que funciona mesmo sem `.env.local`.
- Rotacionar a chave ou apontar para um projeto de staging exige commit e deploy.

**Correção:** ler de `process.env.NEXT_PUBLIC_*`, criar o `.env.example`, configurar as variáveis na Vercel e deixar o README verdadeiro.

### 4.2 Confirmar as políticas de RLS · ~30 min

O README afirma que cada barbeiro só acessa os próprios agendamentos via RLS. Vale confirmar isso no painel do Supabase, porque o app inteiro fala com o banco direto do cliente — se alguma tabela estiver com política permissiva, um barbeiro consegue ler ou alterar dados dos outros trocando o `barbeiro_id` na requisição. Verificar, no mínimo: `select`/`insert`/`update`/`delete` em `agendamentos` restritos a `auth.uid() = barbeiro_id`, e `update` em `barbeiros` que não permita o próprio barbeiro ligar a flag `funcionario` do item 2.1.

---

## 5. Limpeza

| O quê | Onde | Esforço |
|---|---|---|
| `FaturamentoTab` é código morto — nunca é renderizado, e é uma cópia antiga do Caixa sem cálculo de repasse. Apagar, para ninguém editar o arquivo errado. | `app/page.tsx:655-762` | ~5 min |
| `components/ui/*` (shadcn) não é importado por lugar nenhum. Decidir entre remover ou passar a usar. | `components/ui/` | ~10 min |
| Comentário desatualizado: diz que o repasse é "sobre valor cheio (total + desconto)", mas o commit `4527e39` mudou para usar só `total`. | `app/page.tsx:809` | ~1 min |
| `<html lang="en">` num app inteiramente em português. | `app/layout.tsx:26` | ~1 min |
| README diz "Next.js 15"; o projeto está no Next 16.1.6. Também diz "3 barbeiros" — já são 4. | `README.md:24,56` | ~2 min |

---

## 6. Decisões em aberto

**Tela de cadastro de barbeiros.** Hoje as contas nascem no painel do Supabase e o app só faz `signInWithPassword`. Criar um cadastro dentro do app parece natural, mas abre a pergunta de quem pode se cadastrar: uma tela pública deixa qualquer pessoa criar conta, marcar-se como funcionário e entrar na agenda da barbearia. Fazer direito exige convite ou aprovação, um papel de administrador e RLS coerente com isso — é um projeto, não uma tarefa. Enquanto entrar um barbeiro a cada vários meses, criar a conta pelo painel é mais barato e mais seguro. **Reavaliar se a rotatividade aumentar.**

**Cálculo de repasse no servidor.** Todo o financeiro é somado no cliente, então os números do Caixa são um relatório, não uma contabilidade com garantia. Para o uso atual — barbeiros conferindo o próprio repasse — está adequado. Se em algum momento esse valor virar base de pagamento contestável, o caminho é uma view ou RPC no Postgres que devolva o total e o repasse já calculados, com a porcentagem morando no banco.
