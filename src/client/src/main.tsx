import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';
import { PageTechnique } from './technique/PageTechnique';

const racine = document.getElementById('root');
if (racine === null) {
  throw new Error('Élément #root introuvable dans index.html.');
}

// Sans routeur à ce stade : /technique affiche le contrôle du BFF, le reste affiche l'accueil.
const estTechnique = window.location.pathname.replace(/\/+$/, '') === '/technique';

createRoot(racine).render(<StrictMode>{estTechnique ? <PageTechnique /> : <App />}</StrictMode>);
