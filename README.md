#  FinTrack
 
A personal finance dashboard built with React + Vite, React Router, Tailwind CSS, and Chart.js.
 
## Features
 
- **Overview** — Net worth trend chart and recent transaction activity
- **Transactions** — Full transaction history with category filtering
- **Spending** — Donut and bar charts breaking down monthly expenses by category
- **Budget** — Progress bars tracking spend vs. budget per category, plus upcoming bills
- **Goals** — Savings goal cards with progress tracking and projected completion dates
- **Portfolio** — Investment account summary with allocation chart and net worth milestone
 
## Tech Stack
 
| Tool | Purpose |
|---|---|
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [React 18](https://react.dev/) | UI framework |
| [React Router v6](https://reactrouter.com/) | Client-side routing (one URL per tab) |
| [Tailwind CSS v3](https://tailwindcss.com/) | Utility-first styling |
| [Chart.js v4](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/) | Line, bar, and doughnut charts |
 
## Project Structure
 
```
fintrack/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx           # App entry point
    ├── App.jsx            # Router and route definitions
    ├── Layout.jsx         # Shared header, stat cards, and tab nav
    ├── chartSetup.js      # Global Chart.js component registration
    ├── index.css          # Tailwind directives
    ├── data/
    │   └── index.js       # All sample data and helper functions
    ├── components/
    │   ├── StatCard.jsx
    │   ├── TransactionRow.jsx
    │   ├── BudgetBar.jsx
    │   ├── BillRow.jsx
    │   └── GoalCard.jsx
    └── pages/
        ├── Overview.jsx
        ├── Transactions.jsx
        ├── Spending.jsx
        ├── Budget.jsx
        ├── Goals.jsx
        └── Portfolio.jsx
```
 
## Getting Started
 
```bash
# Install dependencies
npm install
 
# Start the dev server
npm run dev
 
# Build for production
npm run build
```
 
The app runs at `http://localhost:5173` by default.
