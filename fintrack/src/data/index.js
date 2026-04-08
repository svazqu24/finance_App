export const txns = [
  // Income — totals $5,200
  { name: 'Salary deposit', cat: 'Income', amt: 2600, date: 'Apr 1' },
  { name: 'Salary deposit', cat: 'Income', amt: 2000, date: 'Mar 15' },
  { name: 'Freelance payment', cat: 'Income', amt: 600, date: 'Mar 25' },
  // Housing
  { name: 'Rent', cat: 'Housing', amt: -1450, date: 'Mar 30' },
  // Groceries
  { name: "Trader Joe's", cat: 'Groceries', amt: -87.32, date: 'Apr 5' },
  { name: 'Whole Foods', cat: 'Groceries', amt: -124.5, date: 'Mar 24' },
  // Dining
  { name: 'Chipotle', cat: 'Dining', amt: -18.45, date: 'Mar 31' },
  { name: "Lou Malnati's", cat: 'Dining', amt: -38.2, date: 'Mar 15' },
  { name: 'Honey Butter Chicken', cat: 'Dining', amt: -42.1, date: 'Mar 28' },
  { name: 'DoorDash', cat: 'Dining', amt: -38.60, date: 'Mar 18' },
  { name: 'Starbucks', cat: 'Dining', amt: -55, date: 'Mar 23' },
  // Subscriptions
  { name: 'Spotify', cat: 'Subscriptions', amt: -10.99, date: 'Apr 1' },
  { name: 'Netflix', cat: 'Subscriptions', amt: -15.49, date: 'Mar 30' },
  { name: 'T-Mobile', cat: 'Subscriptions', amt: -65, date: 'Mar 5' },
  { name: 'Hulu', cat: 'Subscriptions', amt: -17.99, date: 'Mar 30' },
  // Travel
  { name: 'United Airlines', cat: 'Travel', amt: -342, date: 'Mar 28' },
  // Transport
  { name: 'CTA Ventra', cat: 'Transport', amt: -20, date: 'Mar 22' },
  { name: 'Lyft', cat: 'Transport', amt: -24.3, date: 'Mar 20' },
  { name: 'Divvy Bikes', cat: 'Transport', amt: -15, date: 'Mar 12' },
  { name: 'Shell Gas', cat: 'Transport', amt: -67.52, date: 'Mar 14' },
  // Health
  { name: 'Walgreens', cat: 'Health', amt: -23.15, date: 'Mar 27' },
  { name: 'Gym membership', cat: 'Health', amt: -45, date: 'Mar 20' },
  { name: 'Dental copay', cat: 'Health', amt: -125, date: 'Mar 10' },
  // Shopping
  { name: 'Amazon', cat: 'Shopping', amt: -67.99, date: 'Mar 21' },
  { name: 'Target', cat: 'Shopping', amt: -134.50, date: 'Mar 16' },
  { name: 'Home Depot', cat: 'Shopping', amt: -98.40, date: 'Mar 8' },
  { name: 'Nordstrom', cat: 'Shopping', amt: -199.50, date: 'Mar 12' },
  { name: 'Best Buy', cat: 'Shopping', amt: -200, date: 'Mar 3' },
  { name: 'Dry cleaning', cat: 'Shopping', amt: -45, date: 'Mar 11' },
  // Utilities
  { name: 'ComEd', cat: 'Utilities', amt: -89, date: 'Mar 23' },
  // Insurance
  { name: 'Car insurance', cat: 'Insurance', amt: -180, date: 'Mar 15' },
];

export const catSty = {
  Income: { bg: '#C8EBB4', fg: '#27500A' },
  Housing: { bg: '#BAD6F2', fg: '#0C447C' },
  Groceries: { bg: '#C8EBB4', fg: '#27500A' },
  Dining: { bg: '#F5C9B8', fg: '#993C1D' },
  Subscriptions: { bg: '#D8D5F5', fg: '#3C3489' },
  Travel: { bg: '#B4E5D0', fg: '#085041' },
  Transport: { bg: '#F5DEB0', fg: '#633806' },
  Health: { bg: '#F2C2D0', fg: '#72243E' },
  Shopping: { bg: '#DDDBD3', fg: '#444441' },
  Utilities: { bg: '#DDDBD3', fg: '#444441' },
  Insurance: { bg: '#BAD6F2', fg: '#0C447C' },
};

export const spendCats = [
  { label: 'Housing', amt: 1450, clr: '#185FA5' },
  { label: 'Travel', amt: 342, clr: '#1D9E75' },
  { label: 'Insurance', amt: 180, clr: '#378ADD' },
  { label: 'Groceries', amt: 211, clr: '#639922' },
  { label: 'Dining', amt: 157, clr: '#D85A30' },
  { label: 'Shopping', amt: 110, clr: '#888780' },
  { label: 'Utilities', amt: 89, clr: '#5F5E5A' },
  { label: 'Health', amt: 68, clr: '#D4537E' },
  { label: 'Transport', amt: 59, clr: '#BA7517' },
  { label: 'Subscriptions', amt: 26, clr: '#7F77DD' },
];

export const budgets = [
  { cat: 'Housing', budget: 1500, spent: 1450 },
  { cat: 'Groceries', budget: 300, spent: 211 },
  { cat: 'Dining', budget: 150, spent: 157 },
  { cat: 'Transport', budget: 100, spent: 59 },
  { cat: 'Health', budget: 100, spent: 68 },
  { cat: 'Subscriptions', budget: 50, spent: 26 },
  { cat: 'Shopping', budget: 100, spent: 110 },
  { cat: 'Utilities', budget: 120, spent: 89 },
  { cat: 'Insurance', budget: 200, spent: 180 },
  { cat: 'Travel', budget: 200, spent: 342 },
];

export const bills = [
  { name: 'Car insurance', amt: 180, due: 'Apr 15', cat: 'Insurance' },
  { name: 'ComEd', amt: 89, due: 'Apr 23', cat: 'Utilities' },
  { name: 'Rent', amt: 1450, due: 'Apr 30', cat: 'Housing' },
  { name: 'Netflix', amt: 15.49, due: 'Apr 30', cat: 'Subscriptions' },
  { name: 'Spotify', amt: 10.99, due: 'May 1', cat: 'Subscriptions' },
];

export const goals = [
  { name: 'Emergency fund', target: 15000, saved: 9540, monthly: 400, clr: '#185FA5', bg: '#BAD6F2', fg: '#0C447C' },
  { name: 'Japan vacation', target: 4500, saved: 1800, monthly: 200, clr: '#1D9E75', bg: '#B4E5D0', fg: '#085041' },
  { name: 'New laptop', target: 2500, saved: 650, monthly: 150, clr: '#7F77DD', bg: '#D8D5F5', fg: '#3C3489' },
  { name: 'Down payment', target: 80000, saved: 12000, monthly: 500, clr: '#D85A30', bg: '#F5C9B8', fg: '#993C1D' },
];

export const portfolio = [
  { name: '401(k)', val: 22400, chg: 3.2, clr: '#185FA5' },
  { name: 'Roth IRA', val: 10800, chg: 2.8, clr: '#7F77DD' },
  { name: 'Brokerage', val: 5100, chg: 5.1, clr: '#1D9E75' },
];

export function projectedDate(g) {
  const rem = g.target - g.saved;
  if (rem <= 0) return 'Complete!';
  const months = Math.ceil(rem / g.monthly);
  const d = new Date(2026, 3);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
