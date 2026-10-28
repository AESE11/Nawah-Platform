# Arabic Course Platform

A bilingual Arabic and English learning platform built with Next.js 16 App Router and TypeScript.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Auth.js
- React Hook Form
- Zod

## Features

- Arabic and English support from the start
- RTL/LTR automatic layout switching
- Locale-aware routing under `/[locale]`
- Reusable layout components
- Initial public, student, and admin route structure
- Prisma + environment configuration foundation
- Auth.js architecture prepared for protected routes

## Requirements

- Node.js 20.9+
- npm
- PostgreSQL database

## Installation

```bash
npm install
```

Local application and Prisma commands use `.env.nawah`. Keep its database
settings pointed at the intended project; the command wrapper validates the
Supabase project reference and prevents values from standard `.env*` files or
conflicting inherited database variables from replacing them. `.env` and
`.env.old-backup` are left untouched. Configure credentials in `.env.nawah`
directly; do not copy secrets from another environment file.

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

`npm run dev` sets `NEXTAUTH_URL` to `http://localhost:3000` for development
only. Prisma commands that use the same validated environment are
`npm run prisma:generate`, `npm run prisma:validate`, and the read-only
`npm run prisma:migrate:status`. The wrapper does not expose schema-changing
migration commands. `npm run lint` remains independent of environment secrets.
Local builds and `npm run start` require `NEXTAUTH_URL` to be set explicitly in
`.env.nawah`; the development URL is never substituted for those modes. Vercel
builds continue to use Vercel-provided environment variables.

Local `npm run start` binds Next.js to `127.0.0.1` and uses that fixed loopback
address as the shared local rate-limit key. The wrapper enables this only for a
local start without production `NODE_ENV` or the Vercel runtime marker. In
production, client IPs are accepted only from Vercel's platform-provided
`x-vercel-forwarded-for` header; other forwarding headers are not trusted.

## Project Structure

```text
app/
  [locale]/
    admin/
    dashboard/
    courses/
    login/
    register/
    contact/
    page.tsx
components/
  ui/
lib/
messages/
prisma/
public/
```

## Internationalization

The app uses a locale-aware route structure with:

- `ar` as default locale
- `en` as secondary locale
- automatic `dir` and `lang` switching
- centralized dictionary files in `messages/`

## Environment Variables

See `.env.example` for required placeholders.

The database, authentication, mobile-auth, and Upstash variables are required
for their corresponding features. Password-reset delivery also requires
`APP_BASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`; video playback
requires `VCDN_API_KEY`. Cloudinary and Google Sheets variables are needed only
when those integrations are used. Set `APP_BASE_URL` to the HTTPS production
origin when deploying.

Web and mobile sign-in share Upstash login limits (30 attempts per client IP and
5 attempts per normalized email in 15 minutes). Password changes invalidate
previous web and mobile credentials by validating a keyed password-version
claim against the current user record; this requires a database read during
authenticated session/token validation and does not require a schema migration.

## Vercel

No custom `vercel.json` is required for the current Next.js application. Add
the production values for the variables in `.env.example` to the Vercel project
environment, using separate production credentials and a production database.
Use independent strong values for `AUTH_SECRET` and `MOBILE_AUTH_SECRET`.
`npm run build` generates Prisma Client but does not apply database migrations;
review and handle migrations separately before production use.
