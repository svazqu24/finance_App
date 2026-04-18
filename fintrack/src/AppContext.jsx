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

  // ── Preferences ───────────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState(PREF_DEFAULTS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

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
      setBillsData([]);
      setCreditCardsData([]);
      setPreferences(PREF_DEFAULTS);
      setPrefsLoaded(false);
      return;
    }
    loadTransactions(user);
    loadBudgetOverrides(user);
    loadGoals(user);
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

  // ── Auth actions ─────────────────────────────────────────────────────────────
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
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

    // Dedup: skip rows that already exist (same date + amount + name + account)
    const existingKeys = new Set(
      transactions.map((t) => `${t.date}|${t.amt}|${t.name}|${t.account || ''}`)
    );
    const deduped = txnArray.filter(
      (t) => !existingKeys.has(`${t.date}|${t.amt}|${t.name}|${t.account || ''}`)
    );
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
      supabase.from('goals').delete().eq('user_id', user.id),
      supabase.from('bills').delete().eq('user_id', user.id),
      supabase.from('budgets').delete().eq('user_id', user.id),
      supabase.from('user_preferences').delete().eq('user_id', user.id),
    ]);
    await signOut();
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
      .insert({
        user_id:         user.id,
        name:            bill.name,
        amount:          bill.amount,
        due_day:         bill.due_day,
        cat:             bill.cat,
        is_subscription: bill.is_subscription ?? false,
        frequency:       bill.frequency ?? null,
        next_due_date:   bill.next_due_date ?? null,
      })
      .select().single();
    if (error) { console.error('[fintrack] Bill insert failed:', error); return; }
    setBillsData((prev) => [...prev, dbRowToBill(data)].sort((a, b) => a.due_day - b.due_day));
  }

  async function updateBill(id, updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('bills')
      .update({
        name:            updates.name,
        amount:          updates.amount,
        due_day:         updates.due_day,
        cat:             updates.cat,
        is_subscription: updates.is_subscription ?? false,
        frequency:       updates.frequency ?? null,
        next_due_date:   updates.next_due_date ?? null,
      })
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
        signOut,
        resetPassword,
        updatePassword,
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
