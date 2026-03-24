# ✂️ NC Barber — Sistema de Gestão para Barbearia

Sistema SaaS completo de gestão para barbearia, desenvolvido do zero com foco em usabilidade mobile e uso real em produção. Cada barbeiro acessa sua própria agenda, registra atendimentos e acompanha seu faturamento e repasse diretamente pelo celular.

🔗 **[Acesse o sistema ao vivo](https://nc-barber-v3l8.vercel.app)**

---

## 📸 Screenshots

![Image](https://github.com/user-attachments/assets/05446ee1-6f9b-4ec9-8ebe-5e4ee6bd0881) 
![Image](https://github.com/user-attachments/assets/52fecaae-4b82-4046-8095-a07dfdf9ec0d)
![Image](https://github.com/user-attachments/assets/b75a4eb7-7b43-41a2-964f-e7646a7afc2e)
![Image](https://github.com/user-attachments/assets/e678258b-a2bf-434c-9b2b-2842377f7bd4)
![Image](https://github.com/user-attachments/assets/f301e271-ccfe-41f6-bdcd-0fad36d9d1f0)
![Image](https://github.com/user-attachments/assets/fe829503-8ee0-4199-b259-22f18cca5f1b)

---

## Sobre o projeto

O NC Barber nasceu de uma necessidade real: uma barbearia precisava de um sistema simples para organizar a agenda dos barbeiros, controlar o caixa e calcular automaticamente o repasse de cada funcionário — tudo pelo celular, sem depender de planilhas ou anotações no papel.

O sistema está em uso ativo por 3 barbeiros, com agendamentos diários, atendimentos avulsos e fechamento de caixa no final do dia.

---

## Funcionalidades

**Agenda**
- Scroll de datas com 7 dias anteriores e 14 dias futuros
- Agendamentos com múltiplos serviços, desconto opcional e horário
- Modal interativo para concluir, cancelar ou excluir atendimentos

**Atendimento avulso**
- Registro direto no caixa para clientes sem agendamento prévio
- Entra automaticamente como concluído, sem passar pela agenda

**Caixa**
- Faturamento diário, semanal e mensal
- Ticket médio e quantidade de atendimentos
- Gráfico de barras com faturamento por dia
- Cálculo automático de repasse: 50% de segunda a sábado, 60% aos domingos

**Autenticação**
- Login individual por barbeiro com email e senha
- Sessão persistente entre sessões
- Dados isolados por barbeiro via Row Level Security (RLS)

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + React |
| Tipagem | TypeScript |
| Backend / Auth | Supabase (PostgreSQL + RLS) |
| Deploy | Vercel |
| Versionamento | Git / GitHub |

---

## Decisões técnicas

**Por que Next.js e não React puro?**
Next.js facilita o deploy na Vercel com zero configuração e oferece melhor performance com server-side rendering. Para um sistema usado diariamente em produção, a estabilidade importa mais que a simplicidade do setup.

**Por que Supabase?**
Auth + banco de dados + Row Level Security em um único serviço. A RLS garante que cada barbeiro acessa apenas seus próprios agendamentos diretamente no banco, sem precisar de middleware. Isso elimina uma camada inteira de lógica de permissão no código.

**Por que separar agendamento de atendimento avulso?**
Na prática, nem todo cliente agenda com antecedência. O fluxo avulso permite que o barbeiro registre um atendimento em poucos segundos — sem preencher data, hora e calendário — e o valor já cai direto no caixa como concluído.

**Repasse automático por dia da semana**
O cálculo considera o dia da semana do atendimento, não do fechamento. Isso evita erros quando o barbeiro fecha o caixa depois da meia-noite ou revisa atendimentos de dias anteriores.

---

## Banco de dados

```
barbeiros                — perfis vinculados ao Supabase Auth
servicos                 — catálogo de serviços com preço e duração
agendamentos             — agendamentos e atendimentos avulsos
agendamento_servicos     — relação N:N entre agendamentos e serviços
```

---

## Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/kaiox21/NC-BARBER.git
cd NC-BARBER

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# Rode o servidor de desenvolvimento
npm run dev
```

**Variáveis de ambiente necessárias**
```
NEXT_PUBLIC_SUPABASE_URL=       # Painel do Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Painel do Supabase → Settings → API
```

---

## Autor

**Kaio Xavier** — [GitHub](https://github.com/kaiox21)
