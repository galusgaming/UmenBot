import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import './styles.css'
import { useMe } from './lib/api'
import PanelLayout from './components/PanelLayout'
import Landing from './pages/Landing'
import Panel from './pages/Panel'
import Settings from './pages/Settings'

function RequireAuth({ children }) {
  const { user, loading } = useMe()
  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>Ładowanie…</div>
  if (!user) return <Navigate to="/" replace />
  return <PanelLayout user={user}>{children}</PanelLayout>
}

function SettingsRoute() {
  // wraps Settings so PanelLayout (which reads useParams itself) still works standalone
  useParams()
  return <Settings />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/panel" element={<RequireAuth><Panel /></RequireAuth>} />
        <Route path="/guilds/:id/settings" element={<RequireAuth><SettingsRoute /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
