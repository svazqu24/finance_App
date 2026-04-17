# FinTrack

A personal finance dashboard built with Vite, React, Tailwind CSS, and Supabase.

## Features

- Transaction import from CSV
- Budget tracking and history
- Spending breakdown and charts
- Account labels and filters
- Supabase backend with row-level security

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example and add your Supabase keys:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Environment Variables

Store API keys and secrets in `.env` only; do not commit this file to source control.

Typical values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database

This project uses Supabase. Run the SQL files in the `supabase-*.sql` files to create tables and policies.

## Notes

- The `.env` file is ignored by Git.
- Keep any keys or secrets out of source control.
