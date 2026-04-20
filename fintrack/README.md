# FinTrack

A personal finance dashboard built with Vite, React, Tailwind CSS, and Supabase.

## Features

### Core Finance Management
- **Transaction Tracking**: Import and manage financial transactions with CSV support
- **Budget Management**: Create, track, and monitor budgets with historical data and visual progress indicators
- **Spending Analysis**: Detailed spending breakdown and categorization with interactive charts
- **Account Management**: Support for multiple accounts with custom labels and filtering options

### Advanced Features
- **Bills & Subscriptions**: Track recurring bills and subscriptions with payment schedules and notifications
- **Financial Goals**: Set and monitor savings goals with contribution tracking
- **Investment Portfolio**: Manage investment holdings and track market performance
- **Credit Card Management**: Keep track of multiple credit cards and credit utilization
- **Net Worth Tracking**: Monitor overall net worth across all accounts and assets
- **Onboarding Flow**: Guided setup process for new users

### Security & User Experience
- **Two-Factor Authentication (2FA)**: Enhanced account security with setup and verification
- **Row-Level Security**: Supabase backend with database-level access control
- **Responsive Design**: Mobile-friendly interface with bottom navigation for easy navigation
- **User Preferences**: Customizable settings and preferences storage

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
