import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { goalClrMap, GOAL_COLORS } from './data';

// Map a Supabase bills row → app shape
function dbRowToBill(row) {
  return {
    id:         row.id,
    name:       row.name,
    amount:     Number(row.amount),
    due_day:    row.due_day,
    cat:        row.cat,
    paid_month: row.paid_month ?? null,
  };
}

const AppContext = createContext(null);

// Map a Supabase row → the shape the rest of the app expects.
// Table columns: id, name, cat, amt, date, user_id, created_at
function dbRowToTxn(row) {
  return { id: row.id, name: row.name, cat: row.cat, amt: row.amt, date: row.date };
}

function dbRowToGoal(row) {
  const palette = goalClrMap[row.color] || GOAL_COLORS[0];
  return {
    id:      row.id,
    name:    row.name,
    target:  Number(row.target),
    saved:   Number(row.saved),
    monthly: Number(row.monthly),
    clr:     palette.clr,
    bg:      palette.bg,
    fg:      palette.fg,
  };
}

export function AppProvider({ children }) {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Transaction state ────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);

  // ── Modal open state (centralised so any page can trigger them) ─────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // ── Edit state ───────────────────────────────────────────────────────────────
  const [editTxn, setEditTxn] = useState(null);
  const [editGoal, setEditGoal] = useState(null);

  // ── Budget overrides: { cat: customLimit } ────────────────────────────────
  const [budgetOverrides, setBudgetOverrides] = useState({});

  // ── Goals ─────────────────────────────────────────────────────────────────
  const [goalsData, setGoalsData] = useState([]);

  // ── Bills ─────────────────────────────────────────────────────────────────
  const [billsData, setBillsData]       = useState([]);
  const [editBill, setEditBill]         = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────────
  // Lazy initializer reads localStorage so the preference survives refreshes
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('fintrack-dark') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('fintrack-dark', String(darkMode)); } catch {}
  }, [darkMode]);

  // ── Password-recovery gate ────────────────────────────────────────────────────
  // True when the user lands via a password-reset email link.
  // App.jsx shows the Auth page (reset form) instead of the dashboard while this is set.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  // ── Bootstrap auth session on mount ──────────────────────────────────────────
  useEffect(() => {
    // Restore any existing session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[auth] getSession error:', error);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for login / logout / token refresh / password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'USER_UPDATED')      setPasswordRecovery(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load data whenever the logged-in user changes ────────────────────────────
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBudgetOverrides({});
      setGoalsData([]);
      setBillsData([]);
      return;
    }
    loadTransactions(user);
    loadBudgetOverrides(user);
    loadGoals(user);
    loadBills(user);
  }, [user]);

  async function loadTransactions(currentUser) {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[fintrack] Fetch failed:', error);
      setLoading(false);
      return;
    }
    setTransactions(data.map(dbRowToTxn));
    setLoading(false);
  }

  async function loadBudgetOverrides(currentUser) {
    const { data, error } = await supabase
      .from('budgets')
      .select('cat, budget')
      .eq('user_id', currentUser.id);
    if (error) { console.error('[fintrack] Budget fetch failed:', error); return; }
    const map = {};
    for (const row of data) map[row.cat] = Number(row.budget);
    setBudgetOverrides(map);
  }

  async function loadGoals(currentUser) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });
    if (error) { console.error('[fintrack] Goals fetch failed:', error); return; }
    setGoalsData(data.map(dbRowToGoal));
  }

  // ── Auth actions ─────────────────────────────────────────────────────────────
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data; // caller inspects data.session to detect "confirm email" flow
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[auth] signOut error:', error);
    setTransactions([]);
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    // USER_UPDATED event in onAuthStateChange will clear passwordRecovery,
    // but set it here too so the UI transitions immediately on success
    setPasswordRecovery(false);
  }

  // ── Transaction actions ───────────────────────────────────────────────────────
  async function updateTransaction(id, updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('transactions')
      .update({ name: updates.name, cat: updates.cat, amt: updates.amt, date: updates.date })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) { console.error('[fintrack] Update failed:', error); return; }
    setTransactions((prev) => prev.map((t) => (t.id === id ? dbRowToTxn(data) : t)));
  }

  async function deleteTransaction(id) {
    if (!user) return;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) { console.error('[fintrack] Delete failed:', error); return; }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  async function addTransaction(txn) {
    if (!user) return;
    console.log('[fintrack] Inserting transaction:', txn);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        name:    txn.name,
        cat:     txn.cat,
        amt:     txn.amt,
        date:    txn.date,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[fintrack] Insert failed:', error);
      // Optimistic local update so the UI stays responsive
      setTransactions((prev) => [txn, ...prev]);
      return;
    }

    console.log('[fintrack] Insert succeeded:', data);
    setTransactions((prev) => [dbRowToTxn(data), ...prev]);
  }

  // ── Bulk insert ──────────────────────────────────────────────────────────
  async function bulkInsertTransactions(txnArray) {
    if (!user || txnArray.length === 0) return 0;
    // Chunk into batches of 100 to stay within PostgREST request limits
    let inserted = [];
    for (let i = 0; i < txnArray.length; i += 100) {
      const chunk = txnArray.slice(i, i + 100).map((t) => ({
        name: t.name, cat: t.cat, amt: t.amt, date: t.date, user_id: user.id,
      }));
      const { data, error } = await supabase.from('transactions').insert(chunk).select();
      if (error) { console.error('[fintrack] Bulk insert chunk failed:', error); continue; }
      inserted = inserted.concat(data.map(dbRowToTxn));
    }
    if (inserted.length > 0) {
      setTransactions((prev) => [...inserted, ...prev]);
    }
    return inserted.length;
  }

  // ── Budget limit actions ──────────────────────────────────────────────────
  async function saveBudgetLimit(cat, budget) {
    if (!user) return;
    const { error } = await supabase
      .from('budgets')
      .upsert({ user_id: user.id, cat, budget }, { onConflict: 'user_id,cat' });
    if (error) { console.error('[fintrack] Budget upsert failed:', error); return; }
    setBudgetOverrides((prev) => ({ ...prev, [cat]: budget }));
  }

  // ── Goal actions ──────────────────────────────────────────────────────────
  async function addGoal(goal) {
    if (!user) return;
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, name: goal.name, target: goal.target, saved: goal.saved, monthly: goal.monthly, color: goal.color })
      .select().single();
    if (error) { console.error('[fintrack] Goal insert failed:', error); return; }
    setGoalsData((prev) => [...prev, dbRowToGoal(data)]);
  }

  async function updateGoal(id, updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('goals')
      .update({ name: updates.name, target: updates.target, saved: updates.saved, monthly: updates.monthly, color: updates.color })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) { console.error('[fintrack] Goal update failed:', error); return; }
    setGoalsData((prev) => prev.map((g) => (g.id === id ? dbRowToGoal(data) : g)));
  }

  async function deleteGoal(id) {
    if (!user) return;
    const { error } = await supabase
      .from('goals').delete().eq('id', id).eq('user_id', user.id);
    if (error) { console.error('[fintrack] Goal delete failed:', error); return; }
    setGoalsData((prev) => prev.filter((g) => g.id !== id));
  }

  // ── Bills CRUD ────────────────────────────────────────────────────────────
  async function loadBills(currentUser) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('due_day', { ascending: true });
    if (error) { console.error('[fintrack] Bills fetch failed:', error); return; }
    setBillsData(data.map(dbRowToBill));
  }

  async function addBill(bill) {
    if (!user) return;
    const { data, error } = await supabase
      .from('bills')
      .insert({ user_id: user.id, name: bill.name, amount: bill.amount, due_day: bill.due_day, cat: bill.cat })
      .select().single();
    if (error) { console.error('[fintrack] Bill insert failed:', error); return; }
    setBillsData((prev) => [...prev, dbRowToBill(data)].sort((a, b) => a.due_day - b.due_day));
  }

  async function updateBill(id, updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('bills')
      .update({ name: updates.name, amount: updates.amount, due_day: updates.due_day, cat: updates.cat })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) { console.error('[fintrack] Bill update failed:', error); return; }
    setBillsData((prev) => prev.map((b) => (b.id === id ? dbRowToBill(data) : b)).sort((a, b) => a.due_day - b.due_day));
  }

  async function deleteBill(id) {
    if (!user) return;
    const { error } = await supabase.from('bills').delete().eq('id', id).eq('user_id', user.id);
    if (error) { console.error('[fintrack] Bill delete failed:', error); return; }
    setBillsData((prev) => prev.filter((b) => b.id !== id));
  }

  async function markBillPaid(id, monthStr) {
    if (!user) return;
    const { data, error } = await supabase
      .from('bills')
      .update({ paid_month: monthStr })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) { console.error('[fintrack] Bill paid update failed:', error); return; }
    setBillsData((prev) => prev.map((b) => (b.id === id ? dbRowToBill(data) : b)));
  }

  return (
    <AppContext.Provider
      value={{
        // auth
        user,
        authLoading,
        passwordRecovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        // transactions
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkInsertTransactions,
        loading,
        // modal triggers (usable from any page)
        addModalOpen,
        setAddModalOpen,
        csvModalOpen,
        setCsvModalOpen,
        openAddModal: () => setAddModalOpen(true),
        openCsvModal: () => setCsvModalOpen(true),
        // edit state
        editTxn,
        setEditTxn,
        // budget overrides
        budgetOverrides,
        saveBudgetLimit,
        // goals
        goalsData,
        addGoal,
        updateGoal,
        deleteGoal,
        editGoal,
        setEditGoal,
        // bills
        billsData,
        addBill,
        updateBill,
        deleteBill,
        markBillPaid,
        editBill,
        setEditBill,
        billModalOpen,
        setBillModalOpen,
        // ui
        darkMode,
        toggleDark: () => setDarkMode((d) => !d),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
