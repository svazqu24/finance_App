import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { goalClrMap, GOAL_COLORS, catSty } from './data';
import { sendNotification } from './NotificationContext';

// ── Preferences ──────────────────────────────────────────────────────────────
const PREF_DEFAULTS = {
  darkMode:             true,
  compactView:          false,
  layoutStyle:          'single',
  navPosition:          'top',
  currency:             'USD',
  onboardingComplete:   false,
  categoryColors:       {}, // { categoryName: { bg, fg }, ... }
  dismissedSubscriptions: [], // array of subscription names to hide
  twoFactorEnabled:     false,
  twoFactorSkipped:     false,
};

// DB column → JS key mapping
const DB_TO_JS = {
  dark_mode:               'darkMode',
  compact_view:            'compactView',
  layout_style:            'layoutStyle',
  nav_position:            'navPosition',
  currency:                'currency',
  onboarding_complete:     'onboardingComplete',
  category_colors:         'categoryColors',
  dismissed_subscriptions: 'dismissedSubscriptions',
  two_factor_enabled:      'twoFactorEnabled',
  two_factor_skipped:      'twoFactorSkipped',
};

function dbRowToPrefs(row) {
  const p = { ...PREF_DEFAULTS };
  if (row.dark_mode    !== null && row.dark_mode    !== undefined) p.darkMode    = row.dark_mode;
  if (row.compact_view !== null && row.compact_view !== undefined) p.compactView = row.compact_view;
  if (row.layout_style) p.layoutStyle = row.layout_style;
  if (row.nav_position) p.navPosition = row.nav_position;
  if (row.currency)     p.currency    = row.currency;
  if (row.onboarding_complete !== null && row.onboarding_complete !== undefined) p.onboardingComplete = row.onboarding_complete;
  if (row.category_colors) {
    try {
      p.categoryColors = typeof row.category_colors === 'string'
        ? JSON.parse(row.category_colors)
        : row.category_colors;
    } catch { p.categoryColors = {}; }
  }
  if (row.dismissed_subscriptions) {
    try {
      p.dismissedSubscriptions = typeof row.dismissed_subscriptions === 'string'
        ? JSON.parse(row.dismissed_subscriptions)
        : row.dismissed_subscriptions;
    } catch { p.dismissedSubscriptions = []; }
  }
  if (row.two_factor_enabled !== null && row.two_factor_enabled !== undefined) {
    p.twoFactorEnabled = Boolean(row.two_factor_enabled);
  }
  if (row.two_factor_skipped !== null && row.two_factor_skipped !== undefined) {
    p.twoFactorSkipped = Boolean(row.two_factor_skipped);
  }
  return p;
}

// Map a Supabase bills row → app shape
function dbRowToBill(row) {
  return {
    id:              row.id,
    name:            row.name,
    amount:          Number(row.amount),
    due_day:         row.due_day,
    cat:             row.cat,
    paid_month:      row.paid_month ?? null,
    is_subscription: row.is_subscription ?? false,
    frequency:       row.frequency ?? null,
    next_due_date:   row.next_due_date ?? null,
  };
}

const AppContext = createContext(null);

// Map a Supabase row → the shape the rest of the app expects.
// Table columns: id, name, cat, amt, date, user_id, created_at, account
function dbRowToTxn(row) {
  return { id: row.id, name: row.name, cat: row.cat, amt: row.amt, date: row.date, account: row.account };
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

function dbRowToGoalContribution(row) {
  return {
    id:     row.id,
    goalId: row.goal_id,
    amount: Number(row.amount),
    note:   row.note,
    date:   row.date,
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
  const [goalContributions, setGoalContributions] = useState([]);

  // ── Net Worth ─────────────────────────────────────────────────────────────
  const [netWorthEntries, setNetWorthEntries] = useState([]);

  // ── Preferences ───────────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState(PREF_DEFAULTS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);

  // ── Bills ─────────────────────────────────────────────────────────────────
  const [billsData, setBillsData]       = useState([]);
  const [editBill, setEditBill]         = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);

  // ── Credit Cards ───────────────────────────────────────────────────────────
  const [creditCardsData, setCreditCardsData] = useState([]);
  const [editCreditCard, setEditCreditCard]   = useState(null);
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false);

  // ── Date range filter (session state — resets on refresh) ─────────────────
  const [txnDateRange,  setTxnDateRange]  = useState('this-month');
  const [txnCustomFrom, setTxnCustomFrom] = useState('');
  const [txnCustomTo,   setTxnCustomTo]   = useState('');

  // ── Dark mode — localStorage fallback for logged-out state ──────────────────
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('fintrack-dark') !== 'false'; } catch { return true; }
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
      setGoalContributions([]);
      setBillsData([]);
      setCreditCardsData([]);
      setPreferences(PREF_DEFAULTS);
      setPrefsLoaded(false);
      setTwoFactorVerified(false);
      return;
    }
    setTwoFactorVerified(false);
    loadTransactions(user);
    loadBudgetOverrides(user);
    loadGoals(user);
    loadGoalContributions(user);
    loadNetWorthEntries(user);
    loadBills(user);
    loadCreditCards(user);
    loadPreferences(user);
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

  async function loadGoalContributions(currentUser) {
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { console.error('[fintrack] Goal contributions fetch failed:', error); return; }
    setGoalContributions(data.map(dbRowToGoalContribution));
  }

  async function loadNetWorthEntries(currentUser) {
    const { data, error } = await supabase
      .from('net_worth_entries')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('month', { ascending: false });
    if (error) { console.error('[fintrack] Net worth entries fetch failed:', error); return; }
    setNetWorthEntries(data);
  }

  async function addGoalContribution(goalId, amount, note, date) {
    if (!user) return;
    const contributionPayload = {
      user_id: user.id,
      goal_id: goalId,
      amount,
      note: note?.trim() || null,
      date: date || new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from('goal_contributions')
      .insert(contributionPayload)
      .select()
      .single();

    if (error) {
      console.error('[fintrack] Goal contribution insert failed:', error);
      return;
    }

    const goal = goalsData.find((g) => g.id === goalId);
    const updatedSaved = Number(goal?.saved ?? 0) + Number(amount);

    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .update({ saved: updatedSaved })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (goalError) {
      console.error('[fintrack] Goal saved update failed:', goalError);
      return;
    }

    setGoalContributions((prev) => [dbRowToGoalContribution(data), ...prev]);
    setGoalsData((prev) => prev.map((g) => (g.id === goalId ? dbRowToGoal(goalData) : g)));
  }

  async function deleteGoalContribution(id, goalId, amount) {
    if (!user) return;

    const { error } = await supabase
      .from('goal_contributions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[fintrack] Goal contribution delete failed:', error);
      return;
    }

    const goal = goalsData.find((g) => g.id === goalId);
    const updatedSaved = Math.max(0, Number(goal?.saved ?? 0) - Number(amount));

    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .update({ saved: updatedSaved })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (goalError) {
      console.error('[fintrack] Goal saved update failed:', goalError);
      return;
    }

    setGoalContributions((prev) => prev.filter((entry) => entry.id !== id));
    setGoalsData((prev) => prev.map((g) => (g.id === goalId ? dbRowToGoal(goalData) : g)));
  }

  async function saveNetWorthEntry(month, accounts) {
    if (!user) return;
    const assets = accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + Number(acc.balance), 0);
    const liabilities = accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + Number(acc.balance), 0);
    const netWorth = assets - liabilities;

    const payload = {
      user_id: user.id,
      month,
      accounts,
      total_assets: assets,
      total_liabilities: liabilities,
      net_worth: netWorth,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('net_worth_entries')
      .upsert(payload, { onConflict: 'user_id,month' })
      .select()
      .single();

    if (error) {
      console.error('[fintrack] Net worth entry save failed:', error);
      return;
    }

    setNetWorthEntries((prev) => {
      const existingIndex = prev.findIndex(entry => entry.month === month);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = data;
        return updated;
      } else {
        return [data, ...prev];
      }
    });
  }

  function getNetWorthHistory() {
    return netWorthEntries
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }

  // ── Auth actions ─────────────────────────────────────────────────────────────
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  }

  async function signUp(email, password, name) {
    const signUpPayload = { email, password };
    const options = {};
    if (name?.trim()) {
      options.data = { full_name: name.trim() };
    }
    const { data, error } = await supabase.auth.signUp({ ...signUpPayload, options });
    if (error) throw error;
    // Set onboardingComplete to false for new sign-ups (they should see onboarding)
    if (data.user) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: data.user.id, onboarding_complete: false }, { onConflict: 'user_id' })
        .catch(() => {}); // Ignore errors here, not critical
    }
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
  async function updateTransaction(id, updates, { silent = false } = {}) {
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
    if (!silent) sendNotification('Changes saved', { type: 'success', duration: 3000 });
  }

  async function bulkRenameTransactions(originalName, newName) {
    if (!user || !originalName || !newName || originalName === newName) return;
    // Collect IDs so the rollback is precise
    const ids = transactions.filter((t) => t.name === originalName).map((t) => t.id);
    if (ids.length === 0) return;
    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, name: newName } : t))
    );
    const { error } = await supabase
      .from('transactions')
      .update({ name: newName })
      .eq('user_id', user.id)
      .eq('name', originalName);
    if (error) {
      console.error('[fintrack] Bulk rename failed:', error);
      // Rollback
      setTransactions((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, name: originalName } : t))
      );
      sendNotification('Rename failed', { type: 'error', duration: 4000 });
      return;
    }
    sendNotification(
      `${ids.length} transaction${ids.length === 1 ? '' : 's'} renamed`,
      { type: 'success', duration: 3000 }
    );
  }

  async function deleteTransaction(id) {
    if (!user) return;

    // Store the transaction for potential undo
    const txnToDelete = transactions.find((t) => t.id === id);

    // Optimistically remove from UI
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Show undo notification
    sendNotification('Deleted · Undo', {
      type: 'undo',
      duration: 5000,
      onUndo: () => {
        // Restore to state
        if (txnToDelete) {
          setTransactions((prev) => [txnToDelete, ...prev]);
        }
      },
    });

    // Delete from DB after a brief delay (in case user hits undo)
    setTimeout(async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('[fintrack] Delete failed:', error);
        // Restore if delete failed
        if (txnToDelete) {
          setTransactions((prev) => [txnToDelete, ...prev]);
        }
      }
    }, 5000);
  }

  async function addTransaction(txn) {
    if (!user) return;
    console.log('[fintrack] Inserting transaction:', txn);

    const payload = sanitizeTransactionPayload({
      user_id: user.id,
      name:    txn.name,
      cat:     txn.cat,
      amt:     txn.amt,
      date:    txn.date,
    });

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
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
    sendNotification('Transaction added', { type: 'success', duration: 3000 });
  }

  function sanitizeTransactionPayload(txn) {
    return {
      user_id: String(txn.user_id ?? '').trim(),
      name:    String(txn.name ?? '').trim().slice(0, 255),
      cat:     String(txn.cat ?? '').trim(),
      amt:     Number(txn.amt),
      date:    String(txn.date ?? '').trim(),
      account: txn.account ? String(txn.account).trim() : null,
    };
  }

  // ── Bulk insert ──────────────────────────────────────────────────────────
  async function bulkInsertTransactions(txnArray, { onProgress } = {}) {
    if (!user || txnArray.length === 0) return { count: 0, skipped: 0 };

    const normalizeTxnKey = (txn) => `${txn.date}|${txn.amt}|${txn.name}`;

    const existingByKey = new Map();
    for (const txn of transactions) {
      const key = normalizeTxnKey(txn);
      const current = existingByKey.get(key);
      if (!current || (!current.account && txn.account)) {
        existingByKey.set(key, txn);
      }
    }

    const incomingByKey = new Map();
    for (const txn of txnArray) {
      const key = normalizeTxnKey(txn);
      const current = incomingByKey.get(key);
      if (!current || (!current.account && txn.account)) {
        incomingByKey.set(key, txn);
      }
    }

    const deduped = [];
    for (const txn of incomingByKey.values()) {
      const key = normalizeTxnKey(txn);
      const existing = existingByKey.get(key);

      if (existing) {
        if (!existing.account && txn.account) {
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ account: txn.account })
            .eq('user_id', user.id)
            .eq('date', txn.date)
            .eq('amt', txn.amt)
            .eq('name', txn.name);

          if (!updateError) {
            setTransactions((prev) =>
              prev.map((t) =>
                normalizeTxnKey(t) === key ? { ...t, account: txn.account } : t
              )
            );
          } else {
            console.error('[fintrack] Account update failed for duplicate transaction:', updateError);
          }
        }
        continue;
      }

      deduped.push(txn);
    }

    const skipped = txnArray.length - deduped.length;

    if (deduped.length === 0) {
      sendNotification('All rows already exist — nothing imported', { type: 'success', duration: 3000 });
      return { count: 0, skipped };
    }

    const BATCH_SIZE = 50;
    let inserted = [];
    let batchNum = 0;

    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      batchNum++;
      const chunk = deduped.slice(i, i + BATCH_SIZE).map((t) => sanitizeTransactionPayload({
        user_id: user.id,
        name:    t.name,
        cat:     t.cat,
        amt:     t.amt,
        date:    t.date,
        account: t.account ?? null,
      }));
      const { data, error } = await supabase.from('transactions').insert(chunk).select();
      if (error) {
        console.error(`[fintrack] Bulk insert batch ${batchNum} failed:`, error);
        console.error('[fintrack] Bulk insert batch payload preview:', {
          batchNum,
          firstRow: chunk[0],
          payloadKeys: Object.keys(chunk[0]),
          sampleRows: chunk.slice(0, 3),
        });
        sendNotification(`Import error on batch ${batchNum} — some rows may be missing`, { type: 'error', duration: 6000 });
        // still advance progress so the indicator doesn't stall
        if (onProgress) onProgress(Math.min(i + BATCH_SIZE, deduped.length), deduped.length);
        continue;
      }
      inserted = inserted.concat(data.map(dbRowToTxn));
      if (onProgress) onProgress(Math.min(i + BATCH_SIZE, deduped.length), deduped.length);
    }

    if (inserted.length > 0) {
      setTransactions((prev) => [...inserted, ...prev]);
    }
    return { count: inserted.length, skipped };
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

  // ── Account deletion ─────────────────────────────────────────────────────
  async function deleteAccount() {
    if (!user) return;
    // Delete all user data, then sign out (client can't delete auth user directly)
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('goal_contributions').delete().eq('user_id', user.id),
      supabase.from('goals').delete().eq('user_id', user.id),
      supabase.from('bills').delete().eq('user_id', user.id),
      supabase.from('budgets').delete().eq('user_id', user.id),
      supabase.from('user_preferences').delete().eq('user_id', user.id),
    ]);
    await signOut();
  }

  // ── Bills CRUD ────────────────────────────────────────────────────────────
  async function loadBills(currentUser) {
    console.log('[fintrack] Loading bills for user:', currentUser.id);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('due_day', { ascending: true });
    if (error) { console.error('[fintrack] Bills fetch failed:', error); return; }
    console.log('[fintrack] Loaded bills:', data);
    setBillsData(data.map(dbRowToBill));
  }

  async function addBill(bill) {
    if (!user) return;
    const row = {
      user_id: user.id,
      name:    bill.name,
      amount:  bill.amount,
      due_day: bill.due_day,
      cat:     bill.cat,
    };
    // Only include optional subscription columns when explicitly provided
    // (they may not exist if supabase-subscriptions.sql hasn't been run)
    if (bill.is_subscription != null) row.is_subscription = bill.is_subscription;
    if (bill.frequency       != null) row.frequency        = bill.frequency;
    if (bill.next_due_date   != null) row.next_due_date    = bill.next_due_date;

    const { data, error } = await supabase.from('bills').insert(row).select().single();
    if (error) { console.error('[fintrack] Bill insert failed:', error); return; }
    setBillsData((prev) => [...prev, dbRowToBill(data)].sort((a, b) => a.due_day - b.due_day));
  }

  async function updateBill(id, updates) {
    if (!user) return;
    const row = {
      name:    updates.name,
      amount:  updates.amount,
      due_day: updates.due_day,
      cat:     updates.cat,
    };
    if (updates.is_subscription != null) row.is_subscription = updates.is_subscription;
    if (updates.frequency       != null) row.frequency        = updates.frequency;
    if (updates.next_due_date   != null) row.next_due_date    = updates.next_due_date;

    const { data, error } = await supabase
      .from('bills').update(row)
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

  async function dismissSubscription(name) {
    const currentDismissed = preferences.dismissedSubscriptions || [];
    if (currentDismissed.includes(name)) return; // Already dismissed
    const newDismissed = [...currentDismissed, name];
    await updatePreference('dismissedSubscriptions', newDismissed);
  }

  async function undismissSubscription(name) {
    const currentDismissed = preferences.dismissedSubscriptions || [];
    const newDismissed = currentDismissed.filter((n) => n !== name);
    await updatePreference('dismissedSubscriptions', newDismissed);
  }

  async function loadPreferences(currentUser) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) { console.error('[nero] Prefs fetch failed:', error); setPrefsLoaded(true); return; }

    if (data) {
      // User has existing preferences — use them
      const prefs = dbRowToPrefs(data);
      // localStorage fallback: if DB column doesn't exist yet (null), check localStorage
      if (!prefs.onboardingComplete && data.onboarding_complete == null) {
        try {
          if (localStorage.getItem('nero-onboarding-complete') === 'true') {
            prefs.onboardingComplete = true;
          }
        } catch {}
      }
      setPreferences(prefs);
      setDarkMode(prefs.darkMode);
      console.log('[onboarding] Loaded preferences:', { onboardingComplete: prefs.onboardingComplete });
    } else {
      // First time this user is loading preferences — assume they're existing user
      // (unless they just signed up, in which case onboarding_complete would be set to false above)
      const newPrefs = { ...PREF_DEFAULTS, onboardingComplete: true };
      setPreferences(newPrefs);
      setDarkMode(newPrefs.darkMode);
      console.log('[onboarding] No preferences record found, defaulting to onboardingComplete: true (existing user)');
      // Optionally save this for future loads
      await supabase
        .from('user_preferences')
        .upsert({ user_id: currentUser.id, onboarding_complete: true }, { onConflict: 'user_id' })
        .catch(() => {}); // Ignore errors
    }
    setPrefsLoaded(true);
  }

  useEffect(() => {
    if (!user) {
      setTwoFactorVerified(false);
      return;
    }
    if (preferences.twoFactorEnabled) {
      setTwoFactorVerified(false);
    } else {
      setTwoFactorVerified(true);
    }
  }, [user, preferences.twoFactorEnabled]);

  async function updatePreference(key, value) {
    // Optimistic local update
    setPreferences((prev) => ({ ...prev, [key]: value }));
    if (key === 'darkMode') setDarkMode(value);
    // localStorage fallback so onboarding state persists even if DB column doesn't exist yet
    if (key === 'onboardingComplete' && value === true) {
      try { localStorage.setItem('nero-onboarding-complete', 'true'); } catch {}
    }
    if (!user) return;
    // Map JS key → DB column
    const dbKey = Object.entries(DB_TO_JS).find(([, v]) => v === key)?.[0] ?? key;
    // Serialize JSON for categoryColors and dismissedSubscriptions
    const dbValue = (key === 'categoryColors' || key === 'dismissedSubscriptions') ? JSON.stringify(value) : value;
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, [dbKey]: dbValue }, { onConflict: 'user_id' });
    if (error) console.error('[nero] Pref update failed:', error);
  }

  // Subscription preference helpers
  function dismissSubscription(name) {
    const updated = [...preferences.dismissedSubscriptions, name];
    updatePreference('dismissedSubscriptions', updated);
  }

  function undismissSubscription(name) {
    const updated = preferences.dismissedSubscriptions.filter(n => n !== name);
    updatePreference('dismissedSubscriptions', updated);
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

  // ── Credit Cards CRUD ──────────────────────────────────────────────────────
  async function loadCreditCards(currentUser) {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });
    if (error) { console.error('[fintrack] Credit cards fetch failed:', error); return; }
    setCreditCardsData(data);
  }

  async function addCreditCard(card) {
    if (!user) return;
    const { data, error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        name: card.name,
        last_four: card.last_four,
        credit_limit: card.credit_limit,
        current_balance: card.current_balance,
        statement_balance: card.statement_balance,
        minimum_payment: card.minimum_payment,
        due_day: card.due_day,
        paid_month: card.paid_month,
      })
      .select().single();
    if (error) { console.error('[fintrack] Credit card insert failed:', error); return; }
    setCreditCardsData((prev) => [...prev, data]);
  }

  async function updateCreditCard(id, updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('credit_cards')
      .update({
        name: updates.name,
        last_four: updates.last_four,
        credit_limit: updates.credit_limit,
        current_balance: updates.current_balance,
        statement_balance: updates.statement_balance,
        minimum_payment: updates.minimum_payment,
        due_day: updates.due_day,
        paid_month: updates.paid_month,
      })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) { console.error('[fintrack] Credit card update failed:', error); return; }
    setCreditCardsData((prev) => prev.map((c) => (c.id === id ? data : c)));
  }

  async function deleteCreditCard(id) {
    if (!user) return;
    const { error } = await supabase.from('credit_cards').delete().eq('id', id).eq('user_id', user.id);
    if (error) { console.error('[fintrack] Credit card delete failed:', error); return; }
    setCreditCardsData((prev) => prev.filter((c) => c.id !== id));
  }

  async function markCreditCardPaid(id, monthStr) {
    if (!user) return;
    const { data, error } = await supabase
      .from('credit_cards')
      .update({ paid_month: monthStr })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) { console.error('[fintrack] Credit card paid update failed:', error); return; }
    setCreditCardsData((prev) => prev.map((c) => (c.id === id ? data : c)));
  }

  // Helper: Get category styles (custom or default)
  function getCategorySty(categoryName) {
    const custom = preferences.categoryColors?.[categoryName];
    if (custom) return custom;
    return catSty[categoryName] || { bg: '#DDDBD3', fg: '#444441' };
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
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        twoFactorVerified,
        setTwoFactorVerified,
        // transactions
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkInsertTransactions,
        bulkRenameTransactions,
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
        goalContributions,
        addGoalContribution,
        deleteGoalContribution,
        // net worth
        netWorthEntries,
        saveNetWorthEntry,
        getNetWorthHistory,
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
        // credit cards
        creditCardsData,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        markCreditCardPaid,
        editCreditCard,
        setEditCreditCard,
        creditCardModalOpen,
        setCreditCardModalOpen,
        // preferences
        preferences,
        updatePreference,
        dismissSubscription,
        undismissSubscription,
        prefsLoaded,
        deleteAccount,
        // date range filter (session state)
        txnDateRange,  setTxnDateRange,
        txnCustomFrom, setTxnCustomFrom,
        txnCustomTo,   setTxnCustomTo,
        // ui
        darkMode,
        toggleDark: () => updatePreference('darkMode', !preferences.darkMode),
        getCategorySty,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
