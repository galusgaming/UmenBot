import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function Tickets() {
  const { id } = useParams()
  const nav = useNavigate()
  const [settings, setSettings] = React.useState({ staffRoleID: '', logsChannelID: '', categoryID: '' })
  const [roles, setRoles] = React.useState([])
  const [textChannels, setTextChannels] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [panelChannel, setPanelChannel] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [sendResult, setSendResult] = React.useState(null)

  React.useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/guilds/${id}/ticket-settings`).then(r => {
        if (r.status === 401 || r.status === 403) { nav('/'); return { settings: {} } }
        return r.json()
      }),
      fetch(`/api/guilds/${id}/roles`).then(r => r.json()),
      fetch(`/api/guilds/${id}/channels`).then(r => r.json()),
    ]).then(([s, r, c]) => {
      const st = s.settings || {}
      setSettings({
        staffRoleID: st.staffRoleID || '',
        logsChannelID: st.logsChannelID || '',
        categoryID: st.categoryID || '',
      })
      setRoles(r.roles || [])
      setTextChannels(c.textChannels || [])
      setCategories(c.categories || [])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/guilds/${id}/ticket-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function sendPanel() {
    if (!panelChannel) return
    setSending(true)
    setSendResult(null)
    try {
      const r = await fetch(`/api/guilds/${id}/ticket-panel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: panelChannel }),
      })
      const j = await r.json()
      setSendResult(j.ok ? 'ok' : j.error || 'error')
    } catch {
      setSendResult('error')
    } finally {
      setSending(false)
    }
  }

  const configured = settings.staffRoleID && settings.logsChannelID
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p>

  return (
    <div>
      <style>{`
        .tk-head { margin-bottom: 1.75rem; }
        .tk-head h1 { font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 0.35rem; }
        .tk-back { font-size: 0.85rem; color: var(--text-dim); }
        .tk-back:hover { color: var(--text); }
        .tk-status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; margin-top: 0.5rem; }
        .tk-dot { width: 7px; height: 7px; border-radius: 50%; }
        .tk-section { margin-bottom: 1.25rem; }
        .tk-section h2 { font-size: 0.95rem; font-family: var(--font-display); font-weight: 600; margin: 0 0 0.9rem; }
        .tk-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .tk-send-row { display: flex; gap: 10px; align-items: flex-end; }
        .tk-send-row .field { flex: 1; margin-bottom: 0; }
        .tk-hint { font-size: 0.8rem; color: var(--tier-1); margin-left: 8px; }
        .tk-hint-err { color: var(--tier-3); }
        @media (max-width: 600px) { .tk-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="tk-head">
        <Link to="/panel" className="tk-back">← Twoje serwery</Link>
        <h1>System ticketów</h1>
        <span className="tk-status">
          <span className="tk-dot" style={{ background: configured ? 'var(--tier-1)' : 'var(--tier-2)' }} />
          {configured ? 'Skonfigurowany' : 'Nieskonfigurowany — użytkownicy nie mogą jeszcze otwierać ticketów'}
        </span>
      </div>

      <div className="card tk-section">
        <h2>Podstawy</h2>
        <div className="tk-row">
          <div className="field">
            <label>Rola supportu</label>
            <select value={settings.staffRoleID} onChange={e => setSettings({ ...settings, staffRoleID: e.target.value })}>
              <option value="">— wybierz rolę —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span className="field-hint">Widzi i obsługuje wszystkie tickety.</span>
          </div>
          <div className="field">
            <label>Kanał logów</label>
            <select value={settings.logsChannelID} onChange={e => setSettings({ ...settings, logsChannelID: e.target.value })}>
              <option value="">— wybierz kanał —</option>
              {textChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <span className="field-hint">Tu trafiają transkrypty zamkniętych ticketów.</span>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 320, marginTop: '0.25rem' }}>
          <label>Kategoria (opcjonalnie)</label>
          <select value={settings.categoryID} onChange={e => setSettings({ ...settings, categoryID: e.target.value })}>
            <option value="">— bez kategorii —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="field-hint">Nowe kanały ticketów będą tworzone w tej kategorii.</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</button>
          {saved && <span className="tk-hint">Zapisano ✓</span>}
        </div>
      </div>

      <div className="card tk-section">
        <h2>Panel z przyciskiem "Utwórz ticket"</h2>
        <p className="field-hint" style={{ marginBottom: '1rem' }}>
          Wysyła embed z przyciskiem na wybrany kanał — użytkownicy klikają, żeby otworzyć ticket. Wymaga zapisanej konfiguracji powyżej.
        </p>
        <div className="tk-send-row">
          <div className="field">
            <label>Kanał docelowy</label>
            <select value={panelChannel} onChange={e => setPanelChannel(e.target.value)}>
              <option value="">— wybierz kanał —</option>
              {textChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost" onClick={sendPanel} disabled={!configured || !panelChannel || sending}>
            {sending ? 'Wysyłanie…' : 'Wyślij panel'}
          </button>
        </div>
        {sendResult === 'ok' && <span className="tk-hint">Panel wysłany ✓</span>}
        {sendResult && sendResult !== 'ok' && <span className="tk-hint tk-hint-err">Nie udało się wysłać ({sendResult})</span>}
      </div>
    </div>
  )
}
