import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { initTheme } from './lib/theme.ts';
import './design/tokens.css';
import './styles/reset.css';

// Apply the saved theme synchronously before the first paint to avoid a flash
// of the wrong appearance.
initTheme();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
