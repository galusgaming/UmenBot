import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom'

function useMe() {
  const [data, setData] = React.useState({ user: null, loading: true })
  React.useEffect(() => {
    fetch('/api/me')
      .then(r => {
        if (r.status === 401 || r.status === 403) return { user: null }
        return r.json()
      })
      .then(j => setData({ user: j.user || null, loading: false }))
      .catch(() => setData({ user: null, loading: false }))
  }, [])
  return data
}

function Layout({ children }) {
  const { user, loading } = useMe()
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem' }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>UmenBot Panel</h2>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Home</Link>
          {user && <Link to="/panel">Panel</Link>}
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          {loading ? '...' : user ? (
            <a href="/logout">Wyloguj</a>
          ) : (
            <a href="/login">Zaloguj przez Discord</a>
          )}
        </div>
      </header>
      <main style={{ marginTop: 24 }}>{children}</main>
    </div>
  )
}

function Home() {
  const { user, loading } = useMe()
  if (loading) return <p>Ładowanie...</p>
  return (
    <div>
      <h1>Witaj {user ? `${user.username}#${user.discriminator}` : 'nieznajomy'}</h1>
      {!user && <p><a href="/login">Zaloguj przez Discord</a> aby zarządzać serwerami.</p>}
      {user && <p><Link to="/panel">Przejdź do panelu</Link></p>}
    </div>
  )
}

function Panel() {
  const nav = useNavigate()
  const [guilds, setGuilds] = React.useState([])
  React.useEffect(() => {
    fetch('/api/guilds').then(r => {
      if (r.status === 401 || r.status === 403) {
        nav('/')
        return { guilds: [] }
      }
      return r.json()
    }).then(j => setGuilds(j.guilds || [])).catch(() => setGuilds([]))
  }, [nav])
  return (
    <div>
      <h1>Twoje serwery</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {guilds.map(g => (
          <li key={g.id} style={{ margin: '.4rem 0' }}>
            <Link to={`/guilds/${g.id}/settings`}>🔧 {g.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SettingsPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [form, setForm] = React.useState({ xpRate: 1, roleRewards: [], blacklist: { channels: [], users: [], roles: [] } })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/guilds/${id}/settings`).then(r => {
      if (r.status === 401 || r.status === 403) {
        nav('/')
        return { settings: form }
      }
      return r.json()
    }).then(j => {
      const s = j.settings || {}
      setForm({
        xpRate: s.xpRate ?? 1,
        roleRewards: Array.isArray(s.roleRewards) ? s.roleRewards : [],
        blacklist: {
          channels: s.blacklist?.channels || [],
          users: s.blacklist?.users || [],
          roles: s.blacklist?.roles || [],
        }
      })
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function updateReward(idx, field, value) {
    setForm(prev => {
      const rr = [...prev.roleRewards]
      rr[idx] = { ...rr[idx], [field]: value }
      return { ...prev, roleRewards: rr }
    })
  }
  function addReward() {
    setForm(prev => ({ ...prev, roleRewards: [...prev.roleRewards, { level: 0, roleId: '' }] }))
  }
  function removeReward(i) {
    setForm(prev => ({ ...prev, roleRewards: prev.roleRewards.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/guilds/${id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    nav('/panel')
  }

  if (loading) return <p>Ładowanie...</p>

  return (
    <div>
      <h1>Ustawienia serwera {id}</h1>

      <section style={{ marginBottom: 16 }}>
        <h3>XP</h3>
        <label>XP rate: <input type="number" step="0.1" min="0" value={form.xpRate} onChange={e => setForm({ ...form, xpRate: Number(e.target.value) })} /></label>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>Nagrody za poziomy</h3>
        <button onClick={addReward}>+ dodaj</button>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {form.roleRewards.map((r, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '.3rem 0' }}>
              <label>Poziom <input type="number" min="0" value={r.level} onChange={e => updateReward(i, 'level', Number(e.target.value))} /></label>
              <label>Rola ID <input type="text" value={r.roleId} onChange={e => updateReward(i, 'roleId', e.target.value)} /></label>
              <button onClick={() => removeReward(i)}>Usuń</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>Blacklisty</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>Kanały (IDs, po przecinku)
            <input type="text" value={form.blacklist.channels.join(', ')} onChange={e => setForm({ ...form, blacklist: { ...form.blacklist, channels: e.target.value.split(/[,\s]+/).filter(Boolean) } })} />
          </label>
          <label>Użytkownicy (IDs)
            <input type="text" value={form.blacklist.users.join(', ')} onChange={e => setForm({ ...form, blacklist: { ...form.blacklist, users: e.target.value.split(/[,\s]+/).filter(Boolean) } })} />
          </label>
          <label>Role (IDs)
            <input type="text" value={form.blacklist.roles.join(', ')} onChange={e => setForm({ ...form, blacklist: { ...form.blacklist, roles: e.target.value.split(/[,\s]+/).filter(Boolean) } })} />
          </label>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={save} disabled={saving}>{saving ? 'Zapisywanie...' : 'Zapisz'}</button>
        <button onClick={() => nav('/panel')}>Anuluj</button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/guilds/:id/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
