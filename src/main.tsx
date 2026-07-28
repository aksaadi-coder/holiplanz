import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import './styles/itinerary.css'
import './styles/entry.css'
import './styles/account.css'
import './styles/trips.css'
import App from './App.tsx'
import { ViewportDebug } from './components/ViewportDebug'
import { pinShellToViewport } from './utils/viewportPin'

// Temporary diagnostic, opt-in via ?debug=viewport. Mounted here rather than
// inside App so it shows on every screen including the entry flow, which
// returns before App's main tree. Delete once the iPhone tab-bar position is
// settled.
const debugViewport = new URLSearchParams(location.search).get('debug') === 'viewport'

// Undoes the stray document scroll iOS leaves behind after the keyboard —
// see the module for the full story. No-op everywhere else.
pinShellToViewport()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {debugViewport && <ViewportDebug />}
    <App />
  </StrictMode>,
)
