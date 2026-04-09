import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { txns as sampleTxns } from './data';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // On mount: fetch from Supabase, seed with sample data if empty
  useEffect(() => {
    async function loadTransactions() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch transactions:', error.message);
        // Fall back to sample data so the UI is never blank
        setTransactions(sampleTxns);
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        // Table is empty — seed with sample transactions
        const rows = sampleTxns.map((t) => ({
          name: t.name,
          category: t.cat,
          amount: t.amt,
          date: t.date,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('transactions')
          .insert(rows)
          .select();

        if (insertError) {
          console.error('Failed to seed transactions:', insertError.message);
          setTransactions(sampleTxns);
        } else {
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
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        name: txn.name,
        category: txn.cat,
        amount: txn.amt,
        date: txn.date,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save transaction:', error.message);
      // Optimistically update state anyway so the UI doesn't feel broken
      setTransactions((prev) => [txn, ...prev]);
      return;
    }

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

// Map a Supabase row → the shape the rest of the app expects
function dbRowToTxn(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.category,
    amt: row.amount,
    date: row.date,
  };
}
