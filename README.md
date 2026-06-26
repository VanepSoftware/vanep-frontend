# vanep-frontend

Institutional landing page for the **Vanep** mobile app, a solution for managing school van transportation.

---

## Tech Stack

- [Next.js 16.2.1](https://nextjs.org/) — App Router
- [React 19.2.4](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TypeScript 5](https://www.typescriptlang.org/)

---

## Project Structure

```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx              # Root layout (fonts, global metadata)
│   ├── page.tsx                # Home / Landing page
│   └── (routes)/
│       └── about/
│           └── page.tsx        # About page (example)
│
├── components/
│   ├── ui/                     # Generic components (Button, Badge, Card...)
│   └── sections/               # Landing page sections (Hero, Features, CTA, Footer...)
│
└── lib/
    └── utils.ts                # Helpers and utilities
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Authentication (OAuth2)

Login uses the Vanep backend (Spring Authorization Server) via **NextAuth**, in the same
authorization-code + PKCE model as `checklists-frontend`.

- A **profile icon** (top-right) starts the flow: clicking it (when logged out) redirects to the
  backend login (`/oauth2/authorize`). After login the session token is persisted (NextAuth JWT
  cookie) and the user stays logged in across reloads; the icon then shows the account + **Sair**.
- The access token is refreshed automatically via the backend `/oauth2/token` (refresh grant).

Copy the env file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `AUTH_URL` | Backend base URL (no `/api`), e.g. `http://localhost:8080` |
| `AUTH_OAUTH_CLIENT_ID` | Public OAuth client id registered in the backend (`vanep-frontend`) |
| `AUTH_SECRET` | Secret to sign the NextAuth session JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | This app's public URL (dev: `http://localhost:3000`) |

> The callback `${NEXTAUTH_URL}/api/auth/callback/vanep` must be in the backend client's
> `VANEP_OAUTH_REDIRECT_URIS`.

---

## Available Scripts

| Command         | Description                   |
| --------------- | ----------------------------- |
| `npm run dev`   | Starts the development server |
| `npm run build` | Builds the app for production |
| `npm run start` | Starts the production server  |
| `npm run lint`  | Runs ESLint                   |

---

## Requirements

- Node.js >= 20.9.0

---

## run ci

#run tests
**npm run test:coverage || npm run test**

#run lint
**npm run lint**

#run audit
**npm audit**


## License

Private — all rights reserved.
