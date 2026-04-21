# FinTrack

A comprehensive personal finance dashboard built with modern web technologies. Track transactions, manage budgets, monitor investments, and visualize cash flow with interactive D3 Sankey diagrams.

## ✨ Features

### 💰 Core Finance Management
- **Transaction Tracking**: Import and manage financial transactions with CSV support
- **Multi-Account Support**: Handle multiple bank accounts, credit cards, and investment accounts
- **Budget Management**: Create, track, and monitor budgets with visual progress indicators and historical data
- **Spending Analysis**: Detailed spending breakdown by category with interactive charts

### 📊 Advanced Analytics & Reporting
- **Cash Flow Visualization**: Interactive D3 Sankey diagrams showing income-to-expense flow
- **Financial Reports**: Monthly reports with savings rate analysis and spending insights
- **Category Analytics**: Deep dive into spending patterns with merchant-level detail
- **Net Worth Tracking**: Monitor overall financial health across all accounts and assets

### 🎯 Financial Planning
- **Bills & Subscriptions**: Track recurring expenses with payment schedules and notifications
- **Financial Goals**: Set and monitor savings goals with contribution tracking and progress visualization
- **Credit Card Management**: Monitor multiple credit cards and credit utilization
- **Investment Portfolio**: Track holdings, market performance, and portfolio allocation

### 🔒 Security & User Experience
- **Two-Factor Authentication (2FA)**: Enhanced account security with TOTP setup and verification
- **Row-Level Security**: Supabase backend with database-level access control
- **Responsive Design**: Mobile-first interface with bottom navigation for seamless mobile experience
- **User Preferences**: Customizable settings with persistent localStorage and Supabase sync
- **Guided Onboarding**: Step-by-step setup process for new users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Alpha Vantage API key (for market data)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fintrack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_ALPHA_VANTAGE_KEY=your-alpha-vantage-api-key
   ```

4. **Set up the database:**
   Run the SQL files in order to create tables and policies:
   ```bash
   # Execute these in your Supabase SQL editor or psql:
   # supabase-tables.sql
   # supabase-rls.sql
   # supabase-preferences.sql
   # supabase-onboarding.sql
   # supabase-account-column.sql
   # supabase-bills.sql
   # supabase-subscriptions.sql
   # supabase-dismissed-subscriptions.sql
   # supabase-contributions.sql
   # supabase-credit-cards.sql
   # supabase-networth.sql
   # supabase-portfolio.sql
   # supabase-display-name.sql
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1 with React Router 6.26.2
- **Build Tool**: Vite 5.4.3
- **Styling**: Tailwind CSS 3.4.11 with custom dark navy theme
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Charts**: Chart.js 4.4.1 and D3-Sankey 0.12.3 for data visualization
- **Deployment**: Vercel with SPA routing
- **Authentication**: Supabase Auth with 2FA support

## 📁 Project Structure

```
fintrack/
├── public/
│   └── _redirects          # SPA routing for Vercel
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── services/          # External API integrations
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component with routing
│   ├── AppContext.jsx     # Global state management
│   └── supabaseClient.js  # Supabase configuration
├── supabase-*.sql         # Database schema and policies
├── package.json
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite build configuration
└── vercel.json           # Vercel deployment config
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `VITE_ALPHA_VANTAGE_KEY` | Alpha Vantage API key for market data | Optional |

### Database Setup

The application uses several Supabase tables with Row Level Security enabled. Run the SQL files in this order:

1. `supabase-tables.sql` - Core tables
2. `supabase-rls.sql` - Security policies
3. `supabase-preferences.sql` - User preferences
4. `supabase-onboarding.sql` - Onboarding flow
5. `supabase-account-column.sql` - Account management
6. `supabase-bills.sql` - Bills tracking
7. `supabase-subscriptions.sql` - Subscription management
8. `supabase-contributions.sql` - Goal contributions
9. `supabase-credit-cards.sql` - Credit card tracking
10. `supabase-networth.sql` - Net worth calculations
11. `supabase-portfolio.sql` - Investment portfolio
12. `supabase-display-name.sql` - User display names

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `vercel.json` and `public/_redirects` files handle SPA routing for client-side navigation.

### Manual Build

```bash
npm run build
# Serve the dist/ folder with any static hosting service
```

## 📊 Key Features Deep Dive

### Cash Flow Reports
The Reports page features an interactive D3 Sankey diagram that visualizes the flow of money from income sources through expenses to savings. Key capabilities:

- **Monthly Navigation**: Browse through different months of financial data
- **Category Breakdown**: See spending by category with budget comparisons
- **Merchant Details**: Hover over nodes to see top merchants for each category
- **Savings Analysis**: Track savings rate and identify optimization opportunities

### Transaction Management
- **CSV Import**: Bulk import transactions from financial institutions
- **Smart Categorization**: Automatic categorization with manual override
- **Account Filtering**: View transactions by account type
- **Search & Filter**: Find specific transactions quickly

### Budget Tracking
- **Category Budgets**: Set spending limits by category
- **Progress Visualization**: See budget usage with color-coded progress bars
- **Historical Tracking**: Monitor budget performance over time
- **Over-budget Alerts**: Visual indicators for categories exceeding budgets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:
1. Check the Supabase dashboard for database issues
2. Verify environment variables are correctly set
3. Ensure all SQL migrations have been run
4. Check browser console for JavaScript errors

## 🔄 Recent Updates

- **Reports Page**: Added interactive D3 Sankey cash flow visualization
- **Text Readability**: Improved contrast for all text elements on dark backgrounds
- **Remember Me**: Added persistent login functionality with localStorage
- **Emoji Avatars**: Replaced SVG icons with native emoji for better rendering
- **Dark Navy Theme**: Consistent dark theme across all components
