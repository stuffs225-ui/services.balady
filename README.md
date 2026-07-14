# Services Balady

Application foundation built with Vite, React, and TypeScript.

## Tech stack

- [Vite](https://vite.dev/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.com/) client (`@supabase/supabase-js`)
- [ESLint](https://eslint.org/)

## Getting started

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your own Supabase project values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable (anon) key |

`.env` is git-ignored and should never be committed. Never place a Supabase
**service role** key in this project — only the publishable/anon key belongs
in client-side code.

The app validates these variables at startup via `src/lib/supabase.ts` and
throws a clear error if either is missing.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

## Project structure

```
src/
  lib/supabase.ts    Centralized Supabase client
  pages/              Route-level page components
  App.tsx             Route definitions
  main.tsx            Application entry point
```
