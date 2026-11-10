# ChatRoom

App de mensagens em tempo real: entre em salas públicas, converse e veja quem está online e quem está digitando — tudo atualizando sozinho, sem precisar puxar a tela para atualizar.

## Funcionalidades

- **Cadastro e login**: Autenticação com e-mail e senha gerenciada pelo Supabase Auth.
- **Perfil automático**: Nome e cor do avatar são gerados automaticamente via trigger no Postgres (`handle_new_user`) no ato do cadastro.
- **Lista de salas públicas**: Exibição de salas com contagem agregada de participantes em query única.
- **Criação e gestão de salas**: Seleção de emoji, nome, descrição e entrada/saída imediata de salas.
- **Mensagens em tempo real (Supabase Realtime)**: Novas mensagens propagadas instantaneamente via WebSocket (`postgres_changes`), sem necessidade de polling.
- **Envio otimista**: Mensagens aparecem instantaneamente na interface com identificador temporário e confirmação posterior pelo servidor.
- **Presença (Presence)**: Monitoramento em memória de usuários conectados ativamente na sala.
- **"Fulano está digitando..." (Broadcast)**: Notificação efêmera via canal de broadcast, com expiração automática sem persistência em banco.
- **Ações de moderação**: Exclusão da própria mensagem com sincronização instantânea; edição de nome exibido no perfil.

## Tecnologias

- **React Native** & **Expo (SDK 58)**
- **Expo Router**: Navegação baseada em rotas de sistema de arquivos
- **TypeScript**: Tipagem estática em toda a base de código
- **Supabase**: Auth, Postgres com RLS, e Realtime (`postgres_changes`, Presence e Broadcast)
- **TanStack Query (React Query)**: Gerenciamento de estado de servidor, cache e invalidação reativa
- **React Hook Form & Zod**: Formulários validados e tipados
- **Jest & jest-expo**: Testes unitários para regras puras
- **PGlite (@electric-sql/pglite)**: Testes de integração direta do banco de dados em memória Node.js (sem Docker)

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um projeto no [Supabase](https://supabase.com) e execute o script `supabase/schema.sql` no SQL Editor.

3. Em **Database → Replication**, confirme que a tabela `messages` está habilitada para o Realtime.

4. Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=SUA-CHAVE-ANON-OU-PUBLISHABLE
   ```

5. Inicie o servidor Expo:
   ```bash
   npx expo start
   ```
   Escaneie o QR Code exibido com o **Expo Go** (Android/iOS) ou execute no navegador/emulador.

## Testes Automatizados

O projeto possui suíte completa com **32 testes automatizados** (20 de interface/regras puras no app e 12 de banco de dados e políticas RLS):

| Comando | O que testa |
| :--- | :--- |
| `npm test` | Executa a suíte completa: app (Jest) e banco (PGlite) |
| `npm run test:app` | Agrupamento de mensagens, cálculo determinístico de avatar e indicador de digitação |
| `npm run test:db` | RLS, gatilho de criação automática de perfil e controle de acesso a salas e mensagens |
| `npm run typecheck` | Checagem estática de tipos com o TypeScript (`tsc --noEmit`) |
| `npm run format` | Validação e padronização com Prettier |

## Arquitetura do Projeto

```text
app/                   Rotas e telas (Expo Router)
  ├── _layout.tsx      Layout raiz com provedores
  ├── (auth)/          Grupo de autenticação (login, register)
  └── (app)/           Grupo protegido
      ├── _layout.tsx  Guarda de rotas autenticadas
      ├── (tabs)/      Abas principais (Salas e Perfil)
      └── room/        Rotas de salas (/room/new, /room/[id])
src/
  ├── components/      Componentes de interface desacoplados
  ├── context/         Contexto de autenticação e sessão Supabase
  ├── hooks/           Hooks de dados e realtime (useRooms, useMessages, usePresence, useTypingIndicator)
  ├── lib/             Clientes inicializadores (Supabase, React Query)
  ├── schemas/         Schemas de validação Zod
  ├── services/        Serviços de integração com o Supabase
  ├── theme/           Design tokens (cores, espaçamentos, bordas)
  ├── types/           Interfaces TypeScript do domínio
  └── utils/           Funções utilitárias puras testadas
supabase/
  ├── schema.sql       Esquema SQL completo com RLS, gatilho e Realtime
  └── tests/           Testes do PostgreSQL via PGlite
```

## Relatório de Erros

Conforme requisito pedagógico da disciplina, todos os desafios técnicos, erros de compilação, problemas com o RLS e ajustes de tipagem encontrados durante o desenvolvimento estão documentados no [`RELATORIO_DE_ERROS.md`](./RELATORIO_DE_ERROS.md).

## Autor

- **GitHub**: [sredward11](https://github.com/sredward11)
- **Repositório**: [https://github.com/sredward11/ChatRoom](https://github.com/sredward11/ChatRoom)

## Licença

Projeto acadêmico desenvolvido para a disciplina de Programação para Dispositivos Móveis — IESB (Prof. Me. Bruno Assunção Dias).

