# CLAUDE.md

Orientações para agentes de IA trabalhando neste repositório. O README é a visão de produto; este arquivo é a visão de código.

## O que é

App de gestão para uma barbearia real, em produção (https://nc-barber-v3l8.vercel.app), usado diariamente por ~4 barbeiros no celular. Cada barbeiro faz login, vê sua agenda, registra atendimentos e acompanha faturamento e repasse.

**Isto não é um projeto de estudo.** Uma regressão em cálculo de valores ou em status de agendamento afeta o pagamento de pessoas reais no fim do mês. Prefira mudanças pequenas e conservadoras.

## Comandos

```bash
npm run dev     # Next dev server
npm run build   # build de produção
npm run lint    # eslint
```

Não há testes. Não há CI. O deploy é automático pela Vercel a partir da branch `main`.

## Arquitetura — leia antes de mexer

**O app inteiro vive em `app/page.tsx`** (~1150 linhas). Um único arquivo com `'use client'` no topo contendo cliente Supabase, constantes, CSS, todos os componentes e o roteamento por estado. Não há rotas, não há server components, não há camada de serviços.

Ordem do arquivo:

| Linha | Conteúdo |
|---|---|
| 6 | Cliente Supabase |
| 11–34 | Constantes e helpers de data (`TIME_SLOTS`, `FUNCIONARIOS`, `getRepasse`, `toDateStr`) |
| 37 | `CSS` — todo o estilo, numa template string |
| 199 | `Spinner` |
| 211 | `LoginScreen` |
| 266 | `ApptModal` |
| 347 | `AgendaTab` |
| 443 | `NovoAgendamentoTab` |
| 655 | `FaturamentoTab` — **código morto, veja abaixo** |
| 766 | `FaturamentoScreen` — a tela do "Caixa" que roda de verdade |
| 913 | `AvulsoTab` |
| 1088 | `Dashboard` (abas + topbar; admin carrega `barbeiros`) |
| 1124 | `NCBarberApp` (sessão, login/logout) |

Ao adicionar código, siga a seção onde ele pertence e mantenha o estilo denso do arquivo (declarações alinhadas, ternários encadeados, handlers inline). Não refatore o arquivo em módulos sem o usuário pedir.

### Coisas que parecem existir mas não são usadas

- **`FaturamentoTab` (linha 655) nunca é renderizado.** É uma versão antiga e quase idêntica do Caixa, que sequer calcula repasse. A tela real é `FaturamentoScreen` (linha 766), aberta pelo botão "💰 Caixa" da topbar (`app/page.tsx:1096`). Ao mexer no Caixa, confirme que está no componente certo — os dois têm `getRange`, `periodLabel` e `fetchData` com nomes iguais.
- `components/ui/*` — componentes shadcn instalados e **não importados** por `page.tsx`. Não assuma que a UI usa shadcn; ela não usa.
- Tailwind v4 e `app/globals.css` estão configurados, mas o visual vem da string `CSS` injetada com `<style>{CSS}</style>`. Para mexer em aparência, edite a string, não classes Tailwind.
- `README.md` fala em `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` e num `.env.example`. **Nenhum dos dois existe** — as credenciais estão hardcoded em `app/page.tsx:6-9`.

## Modelo de dados (Supabase)

```
barbeiros             id (= auth.users.id), nome, email, avatar, cor, ativo, admin
servicos              id, nome, icone, preco, duracao, ativo
agendamentos          id, barbeiro_id, cliente_nome, cliente_fone, data,
                      horario, total, duracao_total, desconto, status
agendamento_servicos  agendamento_id, servico_id, preco_cobrado
adiantamentos         id, barbeiro_id, data, valor, descricao, criado_por
```

**Admin (dono).** `barbeiros.admin = true` (hoje só o Netto). O objeto `barber` já chega com a flag no login, e o app usa `barber.admin` para: carregar a lista de barbeiros no `Dashboard`, mostrar o seletor de barbeiro na `AgendaTab` (atendimento de outro abre o `ApptModal` em `readOnly`) e abrir o Caixa na visão da loja em `FaturamentoScreen`. No banco, a função `is_admin()` alimenta políticas de **select** em `barbeiros`, `agendamentos` e `agendamento_servicos` (admin lê tudo, mas não edita o que é dos outros) e um trigger impede qualquer um de ligar o próprio `admin` pela API. SQL em [`docs/sql/2026-08-27-admin-e-adiantamentos.sql`](docs/sql/2026-08-27-admin-e-adiantamentos.sql).

**Adiantamentos.** Só o admin insere/exclui; cada barbeiro lê os seus. O Caixa soma os adiantamentos do período e mostra `repasse − adiantamentos` como "a pagar" / "você recebe". Assim como o repasse, nada é gravado em `agendamentos` — é tudo derivado na tela.

`status` ∈ `confirmado` | `concluido` | `cancelado`. Agendamentos nascem `confirmado`; atendimentos avulsos nascem `concluido` (`app/page.tsx:957`).

Só entra no faturamento o que está `concluido`. A agenda mostra tudo que **não** está `cancelado`.

## Regra de negócio: repasse

Barbeiros funcionários recebem uma porcentagem; o resto fica com o dono.

- Quem é funcionário: array `FUNCIONARIOS` de emails em `app/page.tsx:22`.
- Quanto: `getRepasse` (`app/page.tsx:23`) — **50%**, ou **60% aos domingos**, sobre `total`.
- O dia da semana vem da coluna `data` do atendimento, não da data de fechamento. Isso é intencional.

**O repasse não é armazenado.** Não há coluna de repasse nem flag de funcionário em `agendamentos`. Tudo é derivado na renderização (`app/page.tsx:787` e `app/page.tsx:810`). Consequência prática: mudar `FUNCIONARIOS` ou `getRepasse` reescreve retroativamente o valor exibido de todo o histórico. Nunca sugira "migrar registros antigos" — não há nada para migrar.

## Armadilhas conhecidas

**`FUNCIONARIOS.includes(barber.email)` é case-sensitive.** Já quebrou uma vez (commit `5c278c7`): o email estava com maiúscula no array e o barbeiro ficou sem repasse silenciosamente, sem erro nenhum. Ao adicionar alguém, confirme o email exato salvo no Supabase.

**Datas: use sempre componentes locais, nunca `toISOString()`.** O fuso do Brasil é UTC-3, então `toISOString()` devolve o dia seguinte a partir das 21h local. `NovoAgendamentoTab` e `AvulsoTab` fazem certo (`toDateStr`, `app/page.tsx:34`); `AgendaTab` usa `toISOString()` em `app/page.tsx:357` e por isso mostra o dia errado à noite. Ao tocar em datas, siga o padrão do `toDateStr`, não o do `AgendaTab`.

**`today` é capturado no carregamento do módulo** (`app/page.tsx:32`). Uma aba aberta durante a virada da meia-noite continua achando que é ontem.

**O comentário em `app/page.tsx:809` está desatualizado.** Diz "sobre valor cheio (total + desconto)", mas o commit `4527e39` mudou o cálculo para usar só `total`. O código é a fonte da verdade; o desconto sai do bolso dos dois.

**Todo cálculo financeiro roda no cliente.** Os números do Caixa são relatório, não contabilidade com garantia. Não descreva isso ao usuário como algo à prova de adulteração.

## Convenções

- UI, comentários e nomes de domínio em **português**. Código em inglês onde já está em inglês; não traduza o que existe.
- Commits em português, com prefixo convencional: `feat:`, `fix:`. Curtos, uma linha.
- Trabalho vai para uma branch, faz merge fast-forward na `main` e a branch é apagada nos dois lados. `main` é a branch de deploy.
- Erros de escrita no banco são tratados com `alert()` + `console.error`. É o padrão do arquivo; mantenha.
- Sem TypeScript estrito nos componentes — a maioria recebe props sem tipo (`{ barber }`). Não adicione tipagem em massa sem pedido.

## Próximos passos

Backlog priorizado em [`docs/PROXIMOS-PASSOS.md`](docs/PROXIMOS-PASSOS.md).
