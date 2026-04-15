import { useNotification } from '../NotificationContext';

export default function Toast() {
  const { toasts, hideNotification } = useNotification();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, idx) => {
        const isUndoType   = toast.type === 'undo';
        const isActionType = toast.type === 'action';
        const yPos = idx * 68;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in fade-in duration-200 px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              background: '#1f1f1f',
              color: 'white',
              border: '1px solid #2a2a2a',
              transform: `translateY(${yPos}px)`,
              transition: 'all 300ms ease-out',
              maxWidth: '360px',
              minWidth: '240px',
            }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex-1 min-w-0">{toast.message}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isUndoType && toast.onUndo && (
                  <button
                    onClick={() => { toast.onUndo(); hideNotification(toast.id); }}
                    className="font-semibold px-2 py-1 rounded transition-colors"
                    style={{ color: '#27AE60' }}
                  >
                    Undo
                  </button>
                )}
                {isActionType && toast.onYes && (
                  <button
                    onClick={() => { toast.onYes(); hideNotification(toast.id); }}
                    className="font-semibold px-2 py-1 rounded transition-colors"
                    style={{ color: '#27AE60' }}
                  >
                    Yes
                  </button>
                )}
                {isActionType && toast.onNo && (
                  <button
                    onClick={() => { toast.onNo(); hideNotification(toast.id); }}
                    className="font-medium px-2 py-1 rounded text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    No
                  </button>
                )}
                <button
                  onClick={() => hideNotification(toast.id)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                  style={{ fontSize: '18px', lineHeight: '1', padding: '0 2px' }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
