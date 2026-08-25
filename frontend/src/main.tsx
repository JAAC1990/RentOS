/**
 * ============================================================================
 * RentOS - Punto de Montaje del DOM (main.tsx)
 * ============================================================================
 * Inicializa la aplicación React 19 en el elemento raíz (#root) con StrictMode.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
