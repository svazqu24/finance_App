import { useState } from 'react';
import { useApp } from '../AppContext';
import BillModal from '../components/BillModal';
import CreditCardModal from '../components/CreditCardModal';
import { catSty } from '../data';
import { fmtDollars } from '../utils';

/** Returns 'paid' | 'overdue' | 'soon' | 'upcoming' for a bill in a given view month */
function billStatus(bill, viewYear, viewMonth) {
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  if (bill.paid_month === monthStr) return 'paid';

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  if (isCurrentMonth) {
    if (bill.due_day < today.getDate()) return 'overdue';
    const daysUntil = bill.due_day - today.getDate();
    if (daysUntil <= 7) return 'soon';
  } else if (viewYear < today.getFullYear() ||
             (viewYear === today.getFullYear() && viewMonth < today.getMonth())) {
    return 'overdue';
  }
  return 'upcoming';
}

const STATUS_STYLES = {
  paid:     { dot: '#22C55E', label: 'Paid',    bg: '#DCFCE7', fg: '#166534' },
  soon:     { dot: '#F59E0B', label: 'Due soon', bg: '#FEF3C7', fg: '#92400E' },
  overdue:  { dot: '#EF4444', label: 'Overdue',  bg: '#FEE2E2', fg: '#991B1B' },
  upcoming: { dot: '#94A3B8', label: 'Upcoming', bg: '#F1F5F9', fg: '#475569' },
};

/** Returns 'paid' | 'overdue' | 'soon' | 'upcoming' for a credit card in current month */
function creditCardStatus(card) {
  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  if (card.paid_month === monthStr) return 'paid';

  const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
  if (dueDate < today) return 'overdue';
  const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'overdue'; // Red for due within 3 days
  if (daysUntil <= 7) return 'soon'; // Amber for due within 7 days
  return 'upcoming';
}

/** Get utilization color */
function getUtilizationColor(utilization) {
  if (utilization < 0.3) return '#22C55E'; // Green
  if (utilization < 0.7) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CalendarCell({ day, bills, onBillClick }) {
  if (!day) return <div className="aspect-square" />;
  const today = new Date();
  const isToday = today.getDate() === day;

  return (
    <div className="aspect-square rounded-lg p-1 flex flex-col" style={{ minHeight: 48 }}>
      <span
        className="text-[11px] font-medium leading-none mb-1 w-5 h-5 flex items-center justify-center rounded-full"
        style={isToday ? { background: '#27AE60', color: '#fff' } : {}}
      >
        {day}
      </span>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {bills.map((b) => {
          const st = STATUS_STYLES[b.status];
          return (
            <button
              key={b.id}
              onClick={() => onBillClick(b)}
              className="text-left text-[9px] font-medium leading-tight px-1 py-0.5 rounded truncate w-full"
              style={{ background: st.bg, color: st.fg }}
              title={`${b.name} — ${fmtDollars(b.amount)}`}
            >
              {b.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Bills() {
  const {
    billsData,
    markBillPaid,
    editBill, setEditBill,
    billModalOpen, setBillModalOpen,
    creditCardsData,
    markCreditCardPaid,
    editCreditCard, setEditCreditCard,
    creditCardModalOpen, setCreditCardModalOpen,
  } = useApp();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Annotate each bill with its status for this view month
  const annotated = billsData.map((b) => ({
    ...b,
    status: billStatus(b, viewYear, viewMonth),
  }));

  // Bills due within next 30 days from today (unpaid)
  const upcomingTotal = (() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 30);
    return billsData.reduce((sum, b) => {
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (b.paid_month === monthStr) return sum;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), b.due_day);
      if (dueDate < today) {
        // try next month
        const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, b.due_day);
        if (nextDue <= cutoff) return sum + b.amount;
        return sum;
      }
      if (dueDate <= cutoff) return sum + b.amount;
      return sum;
    }, 0);
  })();

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Group annotated bills by due_day for calendar rendering
  const byDay = {};
  for (const b of annotated) {
    (byDay[b.due_day] = byDay[b.due_day] || []).push(b);
  }

  function handleBillClick(bill) {
    setEditBill(bill);
    setBillModalOpen(true);
  }

  function handleTogglePaid(bill, e) {
    e.stopPropagation();
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    markBillPaid(bill.id, bill.paid_month === monthStr ? null : monthStr);
  }

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const isCurrentView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          {upcomingTotal > 0 && isCurrentView && (
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtDollars(upcomingTotal)} due in the next 30 days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => { setEditBill(null); setBillModalOpen(true); }}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}
          >
            + Add bill
          </button>
        </div>
      </div>

      {/* Credit Cards Section */}
      {creditCardsData.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">Credit cards</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Total minimum payments: {fmtDollars(creditCardsData.reduce((sum, c) => {
                  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                  return c.paid_month === monthStr ? sum : sum + (c.minimum_payment || 0);
                }, 0))}
              </p>
            </div>
            <button
              onClick={() => { setEditCreditCard(null); setCreditCardModalOpen(true); }}
              className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors"
              style={{ background: '#27AE60' }}
            >
              + Add card
            </button>
          </div>
          <div className="grid gap-3">
            {creditCardsData.map((card) => {
              const status = creditCardStatus(card);
              const utilization = card.credit_limit ? (card.current_balance / card.credit_limit) : 0;
              const utilizationColor = getUtilizationColor(utilization);
              const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
              const isPaid = card.paid_month === monthStr;

              return (
                <div
                  key={card.id}
                  className="bg-[#f5f5f3] dark:bg-nero-surface rounded-xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-nero-border transition-colors cursor-pointer"
                  onClick={() => { setEditCreditCard(card); setCreditCardModalOpen(true); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {card.name} {card.last_four && `•••• ${card.last_four}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Due on {card.due_day}{card.due_day === 1 ? 'st' : card.due_day === 2 ? 'nd' : card.due_day === 3 ? 'rd' : 'th'}
                        {status === 'overdue' && ' (overdue)'}
                        {status === 'soon' && ` (in ${Math.ceil((new Date(today.getFullYear(), today.getMonth(), card.due_day) - today) / (1000 * 60 * 60 * 24))} days)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: STATUS_STYLES[status].dot }}
                      />
                      {isPaid && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Paid</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current balance</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {fmtDollars(card.current_balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Statement balance</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {fmtDollars(card.statement_balance)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Minimum payment: {fmtDollars(card.minimum_payment)}
                    </p>
                    {card.credit_limit && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-nero-border rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(utilization * 100, 100)}%`,
                              background: utilizationColor
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(utilization * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {!isPaid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markCreditCardPaid(card.id, monthStr);
                      }}
                      className="w-full text-xs font-medium py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      Mark as paid
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {billsData.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif' }}
          >
            B
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">Track your bills</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[260px] mx-auto">
            Add recurring bills like rent, utilities, and subscriptions to stay on top of due dates.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={() => { setEditBill(null); setBillModalOpen(true); }}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}
            >
              <PlusIcon />
              Add bill
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Calendar */}
          <div className="rounded-xl border border-gray-100 dark:border-nero-border overflow-hidden mb-5">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-nero-border">
              {SHORT_DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-nero-border">
              {cells.map((day, i) => (
                <div key={i} className="bg-white dark:bg-nero-surface">
                  <CalendarCell
                    day={day}
                    bills={day ? (byDay[day] || []) : []}
                    onBillClick={handleBillClick}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bill list */}
          <p className="text-[13px] font-medium mb-2.5 text-gray-900 dark:text-white">
            {MONTH_NAMES[viewMonth]} bills
          </p>
          <div className="flex flex-col gap-2">
            {annotated
              .slice()
              .sort((a, b) => a.due_day - b.due_day)
              .map((bill) => {
                const st = STATUS_STYLES[bill.status];
                const sty = catSty[bill.cat] || catSty['Utilities'];
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface transition-colors border border-transparent dark:border-nero-border"
                  >
                    <div className="flex items-center gap-3">
                      {/* Category avatar */}
                      <div
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        style={{ background: sty.bg, borderRadius: '10px 3px 10px 3px' }}
                      >
                        <span className="text-[11px] font-medium" style={{ color: sty.fg }}>
                          {bill.cat.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
                          {bill.name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Due {bill.due_day}{['st','nd','rd'][((bill.due_day % 10) - 1)] || 'th'}
                          {' · '}
                          <span style={{ color: st.fg }}>{st.label}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">
                        {fmtDollars(bill.amount)}
                      </span>
                      {/* Paid toggle */}
                      <button
                        onClick={(e) => handleTogglePaid(bill, e)}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0"
                        style={bill.status === 'paid'
                          ? { background: '#22C55E', borderColor: '#22C55E' }
                          : { background: 'transparent', borderColor: '#D1D5DB' }
                        }
                        title={bill.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                      >
                        {bill.status === 'paid' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => handleBillClick(bill)}
                        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditBill(null); }}
      />
      <CreditCardModal
        open={creditCardModalOpen}
        onClose={() => { setCreditCardModalOpen(false); setEditCreditCard(null); }}
      />
    </>
  );
}
