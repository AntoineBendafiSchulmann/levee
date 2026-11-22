import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';
import { DiagnosticsPage } from './diagnostics/DiagnosticsPage';

const root = document.getElementById('root');
if (root === null) {
  throw new Error('Element #root not found in index.html.');
}

// No router at this stage: /technique shows the BFF check, everything else shows the home page.
const isDiagnostics = window.location.pathname.replace(/\/+$/, '') === '/technique';

createRoot(root).render(<StrictMode>{isDiagnostics ? <DiagnosticsPage /> : <App />}</StrictMode>);
