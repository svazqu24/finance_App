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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ── Bootstrap auth session on mount ──────────────────────────────────────────
  useEffect(() => {
    // Restore any existing session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[auth] getSession error:', error);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        signIn,
        signUp,
        signOut,
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
