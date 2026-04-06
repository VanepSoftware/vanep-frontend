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
