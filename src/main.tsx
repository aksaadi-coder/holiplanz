import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import './styles/itinerary.css'
import './styles/entry.css'
import './styles/account.css'
import './styles/trips.css'
import './styles/shared.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
