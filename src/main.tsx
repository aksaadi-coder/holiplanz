import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import './styles/itinerary.css'
import './styles/entry.css'
import './styles/account.css'
import './styles/trips.css'
import App from './App.tsx'
import { pinShellToViewport } from './utils/viewportPin'

// Undoes the stray document scroll iOS leaves behind after the keyboard —
// see the module for the full story. No-op everywhere else.
pinShellToViewport()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
