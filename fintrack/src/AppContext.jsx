import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { txns as sampleTxns } from './data';

const AppContext = createContext(null);

// Map a Supabase row → the shape the rest of the app expects.
// Column names in the table: id, name, cat, amt, date, created_at
function dbRowToTxn(row) {
  return {
    id:   row.id,
    name: row.name,
    cat:  row.cat,   // was row.category — wrong column name
    amt:  row.amt,   // was row.amount  — wrong column name
    date: row.date,
  };
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // On mount: fetch from Supabase, seed with sample data if the table is empty
  useEffect(() => {
    async function loadTransactions() {
      console.log('[fintrack] Fetching transactions from Supabase…');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[fintrack] Fetch failed:', error);
        setTransactions(sampleTxns);
        setLoading(false);
        return;
      }

      console.log(`[fintrack] Fetched ${data.length} row(s) from Supabase.`);

      if (data.length === 0) {
        console.log('[fintrack] Table empty — seeding sample transactions…');

        // Column names must match the table schema exactly: name, cat, amt, date
        const rows = sampleTxns.map((t) => ({
          name: t.name,
          cat:  t.cat,
          amt:  t.amt,
          date: t.date,
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

    loadTransactions();
  }, []);

  async function addTransaction(txn) {
    console.log('[fintrack] Inserting transaction:', txn);

    // Column names must match the table schema exactly: name, cat, amt, date
    const { data, error } = await supabase
      .from('transactions')
      .insert({ name: txn.name, cat: txn.cat, amt: txn.amt, date: txn.date })
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
        transactions,
        addTransaction,
        loading,
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
