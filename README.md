# Arabic Course Platform

A bilingual Arabic and English learning platform foundation built with Next.js 15 App Router and TypeScript.

## Stack

- Next.js 15
- React
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

- Node.js 20+
- npm
- PostgreSQL database

## Installation

```bash
npm install
cp .env.example .env.local
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

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
