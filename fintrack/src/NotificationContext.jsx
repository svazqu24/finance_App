import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

// Global notification dispatcher for use outside components
let notificationDispatcher = null;

export function setNotificationDispatcher(dispatcher) {
  notificationDispatcher = dispatcher;
}

// Can be called from AppContext or other non-component code
export function sendNotification(message, options = {}) {
  if (notificationDispatcher) {
    notificationDispatcher(message, options);
  }
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dispatcherRef = useRef(null);

  const showNotification = useCallback((message, options = {}) => {
    const {
      type = 'success',      // 'success', 'error', 'undo'
      duration = 3000,       // ms
      onUndo = null,         // callback for undo action
    } = options;

    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type, onUndo };

    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    if (type !== 'undo' || !onUndo) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    } else {
      // Undo with 5-second window
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const hideNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Set up the global dispatcher when this provider mounts
  useRef(() => {
    setNotificationDispatcher(showNotification);
    dispatcherRef.current = showNotification;
  }).current?.();

  const value = {
    toasts,
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

