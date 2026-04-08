import { createContext, useContext, useState, useEffect } from 'react';
import { txns } from './data';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(txns);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  function addTransaction(txn) {
    setTransactions((prev) => [txn, ...prev]);
  }

  return (
    <AppContext.Provider value={{ transactions, addTransaction, darkMode, toggleDark: () => setDarkMode((d) => !d) }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
