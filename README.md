# Controle de Frequência de Obras

Aplicação para cadastrar obras, gerenciar a equipe e fazer a chamada semanal de
frequência, com fechamento automático de pagamento (incluindo chave Pix para
copiar). Construída com **Vite + React** e **Supabase** (banco de dados +
tempo real), pronta para deploy na **Vercel**.

## Funcionalidades

- Cadastro, edição e exclusão de obras
- Cadastro, edição e exclusão de funcionários (nome, função, diária, obra, chave Pix)
- Chamada semanal com navegação entre semanas (histórico preservado)
- Marcação de presença em 3 estados: ausente, diária completa, meia diária
- Resumo em tempo real (completas / meias / ausências)
- Relatório de pagamento com valor total por funcionário e cópia da chave Pix
- Sincronização em tempo real entre dispositivos/abas (Supabase Realtime)
- Validações completas, mensagens de sucesso/erro, estados de carregamento
- Acessível (labels, aria-label, foco por teclado, contraste) e responsivo (mobile-first)

## 1. Configurar o banco (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql).
   Isso cria as tabelas `projects`, `employees` e `attendance_records`, os
   índices, as políticas de acesso (RLS) e habilita o Realtime.
3. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.

> ALTERAÇÃO: as políticas de RLS agora exigem estar **autenticado**
> (`auth.role() = 'authenticated'`) — só quem fizer login consegue ler ou
> escrever dados. Se você já tinha rodado uma versão anterior deste
> `schema.sql` (com `using (true)`, liberado pra qualquer um com a chave
> anon), execute o arquivo de novo: os `drop policy` removem a política
> antiga antes de criar a nova, então é seguro rodar de novo no mesmo banco.

## 2. Configurar o login (Supabase Auth)

O app agora tem tela de login, "esqueci minha senha" e redefinição de senha.
Não existe cadastro público — você cria as contas manualmente:

1. No painel do Supabase, vá em **Authentication > Users > Add user** e crie
   um usuário para cada pessoa que vai usar o app (e-mail + senha). Marque
   **Auto Confirm User** para não precisar confirmar o e-mail.
2. Em **Authentication > URL Configuration**, configure:
   - **Site URL**: a URL onde o app roda em produção (ex.:
     `https://seu-app.vercel.app`). Em desenvolvimento, `http://localhost:5173`.
   - **Redirect URLs**: adicione tanto a URL de produção quanto
     `http://localhost:5173/*` (ou a porta que você usa localmente). Sem
     isso, o link de "esqueci minha senha" abre a tela de redefinição no
     domínio errado (ou dá erro) — foi exatamente esse ajuste que resolvemos
     no KitnetPro.
3. Pronto — na tela de login, use o e-mail/senha criados no passo 1.

## 3. Rodar localmente

```bash
npm install
cp .env.example .env
# edite .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Abra http://localhost:5173.

## 4. Deploy na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), importe o repositório (o Vite é detectado automaticamente).
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. O `vercel.json` incluso garante que as rotas funcionem como SPA.

## Estrutura do projeto

```
src/
  lib/            funções puras: acesso a dados (api.js), datas, formatação, validação
  context/        estado global (AppContext) e sistema de avisos (ToastContext)
  components/     componentes de UI, um por responsabilidade
supabase/
  schema.sql      schema completo do banco (tabelas, índices, RLS, realtime)
```

## Notas de arquitetura

- **Semanas com histórico**: cada marcação de presença é salva com a
  segunda-feira da semana (`week_start`), permitindo consultar semanas
  anteriores sem perder dados — diferente de um estado apenas em memória.
- **Atualização otimista**: ao marcar presença, a UI atualiza na hora e reverte
  automaticamente se a gravação falhar, com aviso de erro.
- **Tempo real**: alterações em obras, funcionários e presença feitas em outra
  aba/dispositivo aparecem automaticamente via Supabase Realtime.
