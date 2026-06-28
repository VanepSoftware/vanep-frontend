# vanep-frontend

Frontend Next.js do projeto **Vanep** — landing page institucional + área autenticada para gestão de transporte escolar.

---

## Stack

| Componente | Versão |
| --- | --- |
| Next.js | **16.x** (App Router) |
| React | **19.x** |
| Tailwind CSS | **v4** |
| TypeScript | **5** |
| Node.js | **≥ 22** |

---

## Passo a passo: rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o `.env`

```bash
cp .env.example .env
```

Preencha as variáveis (ver seção **Variáveis de ambiente** abaixo).

### 3. Backend rodando

O frontend depende do backend (`vanep-api-java`) para autenticação. Suba-o antes:

```bash
# No diretório do backend:
make dev
```

### 4. Iniciar o dev server

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente (ver `.env.example`)

| Variável | Descrição |
| --- | --- |
| `AUTH_URL` | URL base do backend (Spring Authorization Server), sem `/api`. Dev: `http://localhost:8080` |
| `AUTH_OAUTH_CLIENT_ID` | ID do cliente OAuth público (PKCE). Deve bater com `VANEP_OAUTH_CLIENT_ID` no backend. Default: `vanep-frontend` |
| `AUTH_SECRET` | Segredo para assinar o JWT de sessão do NextAuth. Gerar com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública deste frontend. Dev: `http://localhost:3000` |

> O callback `${NEXTAUTH_URL}/api/auth/callback/vanep` precisa estar configurado no backend em `VANEP_OAUTH_REDIRECT_URIS`.

---

## Autenticação (OAuth2 + NextAuth)

O login usa o backend Vanep (Spring Authorization Server) via **NextAuth**, com fluxo **authorization code + PKCE** (cliente público, sem secret).

- **Login:** ícone de perfil (canto superior direito) → redireciona ao backend (`/oauth2/authorize`) → login por e-mail/senha ou Google → retorna com token.
- **Sessão:** JWT do NextAuth (cookie). Access token é renovado automaticamente via refresh grant (`/oauth2/token`).
- **Rotas protegidas:** middleware protege `/conta/*` e `/dashboard/*` — redireciona para `/` se não autenticado.

### Logout (SSO)

O botão "Sair" executa dois passos:

1. `signOut({ redirect: false })` — limpa a sessão NextAuth e revoga os tokens OAuth2 no backend
2. Redireciona o navegador para `/api/auth/sso-logout` → backend `/auth/sso-logout` → invalida a sessão HTTP do Spring → redireciona de volta ao frontend

Sem o segundo passo, o backend manteria a sessão ativa e o próximo login seria automático (sem mostrar a tela de login).

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth route handler
│   │   └── sso-logout/route.ts       # Redireciona ao backend para invalidar sessão Spring
│   ├── (routes)/
│   │   └── about/page.tsx
│   ├── layout.tsx
│   └── page.tsx                      # Landing page
├── components/
│   ├── profile-button.tsx            # Ícone de perfil + menu login/logout
│   └── providers.tsx                 # SessionProvider do NextAuth
├── lib/
│   └── server/
│       └── oauth-session.ts          # Refresh token, revoke token, helpers OAuth
├── auth.ts                           # Configuração NextAuth (provider, callbacks, events)
├── middleware.ts                     # Protege rotas /conta/* e /dashboard/*
└── types/
    └── next-auth.d.ts                # Extensão dos tipos NextAuth
```

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch mode) |
| `npm run test:coverage` | Vitest com cobertura |

---

## CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda em push/PR para `main`:

1. **Security Audit** — `npm audit --audit-level=high`
2. **Lint** — `npm run lint`
3. **Test & Coverage** — `npm run test:coverage`
4. **Build** — `npm run build` (depende dos 3 anteriores)

---

## Licença

Private — all rights reserved.
