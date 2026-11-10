# Relatório de Erros e Soluções no Desenvolvimento — ChatRoom

Este relatório registra os erros, alertas e comportamentos inesperados encontrados durante o ciclo de desenvolvimento do aplicativo **ChatRoom**, suas causas raízes e as soluções aplicadas.

---

## 1. Conflito de Padrão de Busca do Jest com Arquivos de Teste do Banco (`db.test.mjs`)

- **Contexto**: Execução dos testes automatizados do app via `npm run test:app` ou `jest`.
- **Sintoma / Mensagem de Erro**:
  ```text
  FAIL supabase/tests/db.test.mjs
    ● Test suite failed to run
      Must use import to load ES Module: ...\supabase\tests\db.test.mjs
      The file contains ESM syntax (import/export) that could not be executed as CommonJS.
  ```
- **Causa Raiz**:
  O Jest possui como padrão de busca (`testMatch`) capturar qualquer arquivo com extensão `.test.*` ou `.spec.*` dentro de todo o repositório. Por isso, tentou interpretar `supabase/tests/db.test.mjs` como uma suíte do Jest. No entanto, o `db.test.mjs` foi escrito em ESM para execução nativa com o executor de testes do Node.js (`node --test`), utilizando `@electric-sql/pglite`.
- **Solução Aplicada**:
  No `package.json`, configurou-se explicitamente o campo `jest.testMatch` para limitar a execução do Jest exclusivamente à pasta de testes da aplicação:
  ```json
  "jest": {
    "preset": "jest-expo",
    "testMatch": [
      "**/__tests__/**/*.test.[jt]s?(x)"
    ],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
  ```
  Dessa forma, `npm run test:app` executa apenas os 20 testes do Jest em `__tests__/`, `npm run test:db` executa os 12 testes de banco via Node.js, e `npm test` orquestra ambos com sucesso (32 testes no total).

---

## 2. Recursão Infinita em Políticas de Segurança de Nível de Linha (RLS) no PostgreSQL

- **Contexto**: Modelagem de segurança da tabela `room_members` para garantir que apenas membros de uma sala possam visualizar os demais membros.
- **Sintoma / Erro**:
  ```text
  infinite recursion detected in policy for relation "room_members"
  ```
- **Causa Raiz**:
  Uma política em `room_members` que fizesse `room_id in (select room_id from public.room_members where user_id = auth.uid())` acionaria a si mesma recursivamente na subconsulta, pois o PostgreSQL reaplica as políticas ativas de RLS à leitura interna da mesma tabela.
- **Solução Aplicada**:
  Extração da verificação de pertinência para uma função SQL com `security definer`:
  ```sql
  create or replace function public.is_room_member(p_room_id uuid)
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
  as $$
    select exists (
      select 1 from public.room_members
      where room_id = p_room_id and user_id = auth.uid()
    );
  $$;
  ```
  E a política em `room_members` passa a chamar apenas `public.is_room_member(room_id)` ou checar `user_id = auth.uid()`.

---

## 3. Comportamento do `UPDATE` com RLS no PostgreSQL (0 Linhas Afetadas vs Exceção)

- **Contexto**: Teste unitário de RLS no PGlite verificando se Bob consegue atualizar o nome de perfil de Alice.
- **Sintoma**:
  O teste originalmente esperava `assert.rejects(...)`, mas o comando SQL `UPDATE profiles SET ...` concluía sem lançar exceção.
- **Causa Raiz**:
  No PostgreSQL, uma operação de `UPDATE` filtrada por RLS (quando a cláusula `USING` falha) simplesmente filtra as linhas antes da atualização. Como nenhuma linha atende à condição `auth.uid() = id`, o banco afeta `0` linhas e encerra com código de sucesso, em vez de lançar erro de permissão.
- **Solução Aplicada**:
  No teste do banco (`db.test.mjs`), a asserção foi ajustada para verificar `result.affectedRows === 0` e confirmar que o registro da vítima não sofreu alteração:
  ```javascript
  const result = await as(BOB, () =>
    db.query("update profiles set username = 'hack' where id = $1", [ALICE]),
  );
  assert.equal(result.affectedRows ?? result.rowCount ?? 0, 0);
  ```

---

## 4. Tipagem de `process.env` no TypeScript (`error TS2591: Cannot find name 'process'`)

- **Contexto**: Verificação estática de tipos via `npm run typecheck` (`tsc --noEmit`).
- **Sintoma / Mensagem de Erro**:
  ```text
  src/lib/supabase.ts(6,13): error TS2591: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
  ```
- **Causa Raiz**:
  No TypeScript 6+ com configuração estrita, a global `process` de Node/ambiente não é inferida por padrão sem o pacote `@types/node` ou a geração dos arquivos de ambiente do Expo (`expo-env.d.ts`).
- **Solução Aplicada**:
  Instalou-se `@types/node` como dependência de desenvolvimento (`npm install -D @types/node`), incluiu-se `"node"` no campo `"types": ["jest", "node"]` do `tsconfig.json` e gerou-se o `expo-env.d.ts`. Com isso, `npm run typecheck` passou sem nenhum erro.

---

## 5. Incompatibilidade de Tipo em `tabBarIcon` (`____ColorValue_Internal` vs `Ionicons`)

- **Contexto**: Definição dos ícones da barra de navegação em abas no arquivo `app/(app)/(tabs)/_layout.tsx`.
- **Sintoma / Mensagem de Erro**:
  ```text
  app/(app)/(tabs)/_layout.tsx(9,39): error TS2322: Type '____ColorValue_Internal' is not assignable to type 'string | NativeColorValue | undefined'.
    Type 'null' is not assignable to type 'string | NativeColorValue | undefined'.
  ```
- **Causa Raiz**:
  Nas definições de tipo recentes do React Native / React Navigation, a propriedade `color` injetada na renderização de ícones de abas pode ser `null` (ou o tipo interno `____ColorValue_Internal`), enquanto o componente `Ionicons` do `@expo/vector-icons` espera obrigatoriamente um valor `string` não-nulo.
- **Solução Aplicada**:
  Ajustou-se a função auxiliar `tabIcon` para receber o parâmetro `color` com segurança e realizar fallback para a cor padrão do tema caso seja nulo ou indefinido:
  ```tsx
  function tabIcon(name: IconName) {
    return ({ color, size }: { color: unknown; size: number }) => (
      <Ionicons name={name} size={size} color={(color as string) ?? colors.muted} />
    );
  }
  ```

---

## 6. Retorno de `refetch()` do TanStack Query no `RefreshControl.onRefresh`

- **Contexto**: Implementação do gesto pull-to-refresh na lista de salas em `app/(app)/(tabs)/index.tsx`.
- **Sintoma / Mensagem de Erro**:
  ```text
  app/(app)/(tabs)/index.tsx(58,13): error TS2769: No overload matches this call.
    Overload 1 of 2, '(props: RefreshControlProps): RefreshControl', gave the following error.
      Type '(options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Room[], Error>>' is not assignable to type '() => void | Promise<void>'.
  ```
- **Causa Raiz**:
  No TanStack Query v5, a função `refetch` devolve uma `Promise<QueryObserverResult<T, Error>>`. A tipagem estrita do React Native para `RefreshControlProps.onRefresh` exige que a função retorne `void` ou `Promise<void>`, rejeitando promises com tipos genéricos resolvidos diferentes de `void`.
- **Solução Aplicada**:
  Envolveu-se a chamada em uma arrow function que descarta explicitamente o valor resolvido da Promise:
  ```tsx
  onRefresh={() => {
    refetch();
  }}
  ```

---

## 7. Dependência Par (`peerDependency`) Ausente: `expo-font`

- **Contexto**: Diagnóstico de integridade do ambiente mobile via `npx expo-doctor`.
- **Sintoma / Alerta**:
  ```text
  ✖ Check that required peer dependencies are installed
  Missing peer dependency: expo-font
  Required by: @expo/vector-icons
  Advice: Install missing required peer dependency with "npx expo install expo-font"
  ```
- **Causa Raiz**:
  O pacote de ícones `@expo/vector-icons` depende diretamente do módulo nativo `expo-font` para carregamento de fontes vetoriais (como `Ionicons`). Fora do Expo Go padrão ou em compilações nativas fechadas, a ausência de `expo-font` ocasionaria crash imediato ao inicializar os ícones da interface.
- **Solução Aplicada**:
  Executou-se `npx expo install expo-font`, que configurou a versão compatível com o SDK 58 e adicionou o config plugin correspondente. A validação via `npx expo-doctor` retornou `20/20 checks passed. No issues detected!`.

---
