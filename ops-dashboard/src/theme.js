// Theme preference: 'system' follows prefers-color-scheme (no override
// attribute set); 'light'/'dark' pin it via documentElement[data-theme],
// which wins over the media query in styles.css either direction.
const KEY = 'ops-theme';

export function getStoredTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function storeTheme(theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    /* best-effort, same as the rest of the app's localStorage writes */
  }
}
