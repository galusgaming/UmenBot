import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import { useMe } from './lib/api'
import PanelLayout from './components/PanelLayout'
import Landing from './pages/Landing'
import Panel from './pages/Panel'
import Settings from './pages/Settings'
import Tickets from './pages/Tickets'
import Leaderboard from './pages/Leaderboard'

function RequireAuth({ children }) {
  const { user, loading } = useMe()
  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>Ładowanie…</div>
  if (!user) return <Navigate to="/" replace />
  return <PanelLayout user={user}>{children}</PanelLayout>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/panel" element={<RequireAuth><Panel /></RequireAuth>} />
        <Route path="/guilds/:id/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/guilds/:id/tickets" element={<RequireAuth><Tickets /></RequireAuth>} />
        <Route path="/guilds/:id/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
