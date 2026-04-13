import { useNotification } from '../NotificationContext';

export default function Toast() {
  const { toasts, hideNotification } = useNotification();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, idx) => {
        const isUndoType = toast.type === 'undo';
        const yPos = idx * 64;

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
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              {isUndoType && toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo();
                    hideNotification(toast.id);
                  }}
                  className="font-semibold px-2 py-1 rounded transition-colors"
                  style={{ color: '#27AE60' }}
                  onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.target.style.opacity = '1')}
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => hideNotification(toast.id)}
                className="text-gray-400 hover:text-gray-300 transition-colors ml-2"
                style={{ fontSize: '18px', lineHeight: '1', padding: '0' }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
