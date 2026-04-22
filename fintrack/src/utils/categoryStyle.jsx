export const CATEGORY_STYLE = {
  'Dining':        { bg: '#1a0a00', color: '#f97316', emoji: '🍽️' },
  'Groceries':     { bg: '#001a0a', color: '#34d399', emoji: '🛒' },
  'Shopping':      { bg: '#1a001a', color: '#c084fc', emoji: '🛍️' },
  'Transport':     { bg: '#001020', color: '#60a5fa', emoji: '🚗' },
  'Health':        { bg: '#1a001a', color: '#f472b6', emoji: '💊' },
  'Subscriptions': { bg: '#0a001a', color: '#818cf8', emoji: '🎵' },
  'Housing':       { bg: '#0a001a', color: '#818cf8', emoji: '🏠' },
  'Utilities':     { bg: '#001a10', color: '#2dd4bf', emoji: '⚡' },
  'Insurance':     { bg: '#001020', color: '#60a5fa', emoji: '🛡️' },
  'Travel':        { bg: '#00101a', color: '#38bdf8', emoji: '✈️' },
  'Entertainment': { bg: '#1a0010', color: '#e879f9', emoji: '🎬' },
  'Income':        { bg: '#001a0a', color: '#34d399', emoji: '💵' },
  'Transfer':      { bg: '#111827', color: '#6b7280', emoji: '🔄' },
  'Other':         { bg: '#0f0f0f', color: '#9ca3af', emoji: '📦' },
};

export function getCategoryStyle(category) {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE['Other'];
}

export function CategoryAvatar({ category, size = 36 }) {
  const style = getCategoryStyle(category);
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '10px 3px 10px 3px',
      background: style.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {style.emoji}
    </div>
  );
}
