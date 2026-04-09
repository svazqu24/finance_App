import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { txns as sampleTxns } from './data';

const AppContext = createContext(null);

// Map a Supabase row → the shape the rest of the app expects.
// Table columns: id, name, cat, amt, date, user_id, created_at
function dbRowToTxn(row) {
  return {
    id:   row.id,
    name: row.name,
    cat:  row.cat,
    amt:  row.amt,
    date: row.date,
  };
}

export function AppProvider({ children }) {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Transaction state ────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);

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

  // ── Load transactions whenever the logged-in user changes ────────────────────
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    loadTransactions(user);
  }, [user]);

  async function loadTransactions(currentUser) {
    setLoading(true);
    console.log('[fintrack] Fetching transactions for user:', currentUser.id);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUser.id)         // belt-and-suspenders alongside RLS
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fintrack] Fetch failed:', error);
      setTransactions(sampleTxns);
      setLoading(false);
      return;
    }

    console.log(`[fintrack] Fetched ${data.length} row(s).`);

    if (data.length === 0) {
      // New user — seed their account with sample transactions
      console.log('[fintrack] Seeding sample transactions for new user…');

      const rows = sampleTxns.map((t) => ({
        name:    t.name,
        cat:     t.cat,
        amt:     t.amt,
        date:    t.date,
        user_id: currentUser.id,
      }));

      const { data: inserted, error: seedError } = await supabase
        .from('transactions')
        .insert(rows)
        .select();

      if (seedError) {
        console.error('[fintrack] Seed insert failed:', seedError);
        setTransactions(sampleTxns);
      } else {
        console.log(`[fintrack] Seeded ${inserted.length} transaction(s).`);
        setTransactions(inserted.map(dbRowToTxn));
      }
    } else {
      setTransactions(data.map(dbRowToTxn));
    }

    setLoading(false);
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
        loading,
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
