import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const emptySettings = {
  currencyName: 'monety',
  currencySymbol: '🪙',
  startingBalance: 100,
  dailyAmount: 200,
  workMin: 50,
  workMax: 250,
  workCooldownMinutes: 60,
  robEnabled: true,
  robSuccessChance: 40,
  robMaxPercent: 30,
}

const emptyItemForm = { name: '', price: 0, roleID: '', description: '' }

export default function Economy() {
  const { id } = useParams()
  const nav = useNavigate()

  const [settings, setSettings] = React.useState(emptySettings)
  const [items, setItems] = React.useState([])
  const [roles, setRoles] = React.useState([])
  const [leaderboard, setLeaderboard] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const [itemForm, setItemForm] = React.useState(emptyItemForm)
  const [editingId, setEditingId] = React.useState(null)
  const [itemError, setItemError] = React.useState('')

  function loadAll() {
    setLoading(true)
    Promise.all([
      fetch(`/api/guilds/${id}/economy-settings`).then(r => {
        if (r.status === 401 || r.status === 403) { nav('/'); return { settings: emptySettings } }
        return r.json()
      }),
      fetch(`/api/guilds/${id}/shop`).then(r => r.json()),
      fetch(`/api/guilds/${id}/roles`).then(r => r.json()),
      fetch(`/api/guilds/${id}/economy-leaderboard`).then(r => r.json()),
    ]).then(([settingsRes, shopRes, rolesRes, lbRes]) => {
      setSettings({ ...emptySettings, ...(settingsRes.settings || {}) })
      setItems(shopRes.items || [])
      setRoles(rolesRes.roles || [])
      setLeaderboard(lbRes.entries || [])
      setLoading(false)
    })
  }

  React.useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function saveSettings() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/guilds/${id}/economy-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function updateField(field, value) {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  function startEdit(item) {
    setEditingId(item._id)
    setItemForm({
      name: item.name || '',
      price: item.price || 0,
      roleID: item.roleID || '',
      description: item.description || '',
    })
    setItemError('')
  }

  function resetItemForm() {
    setEditingId(null)
    setItemForm(emptyItemForm)
    setItemError('')
  }

  async function submitItem() {
    setItemError('')
    if (!itemForm.name.trim()) {
      setItemError('Nazwa przedmiotu jest wymagana.')
      return
    }
    const payload = {
      name: itemForm.name.trim(),
      price: Math.max(0, Math.floor(Number(itemForm.price) || 0)),
      roleID: itemForm.roleID || null,
      description: itemForm.description || '',
    }
    const url = editingId ? `/api/guilds/${id}/shop/${editingId}` : `/api/guilds/${id}/shop`
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 409) {
      setItemError('Przedmiot o tej nazwie już istnieje.')
      return
    }
    if (!res.ok) {
      setItemError('Nie udało się zapisać przedmiotu.')
      return
    }
    resetItemForm()
    loadAll()
  }

  async function deleteItem(itemId) {
    await fetch(`/api/guilds/${id}/shop/${itemId}`, { method: 'DELETE' })
    if (editingId === itemId) resetItemForm()
    loadAll()
  }

  const roleNameById = React.useMemo(() => Object.fromEntries(roles.map(r => [r.id, r.name])), [roles])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p>

  return (
    <div>
      <style>{`
        .ec-head { margin-bottom: 1.75rem; }
        .ec-head h1 { font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 0.35rem; }
        .ec-back { font-size: 0.85rem; color: var(--text-dim); }
        .ec-back:hover { color: var(--text); }
        .ec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 900px) { .ec-grid { grid-template-columns: 1fr; } }
        .ec-section { margin-bottom: 1.5rem; }
        .ec-section h2 { font-size: 0.95rem; font-family: var(--font-display); font-weight: 600; margin: 0 0 0.9rem; }
        .ec-row { display: flex; gap: 10px; }
        .ec-row .field { flex: 1; }
        .ec-toggle { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
        .ec-toggle input { width: 18px; height: 18px; }
        .ec-item-row { display: flex; align-items: center; gap: 12px; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
        .ec-item-row:last-child { border-bottom: none; }
        .ec-item-name { flex: 1; font-size: 0.9rem; }
        .ec-item-price { font-family: var(--font-mono); font-size: 0.82rem; color: var(--accent); min-width: 90px; text-align: right; }
        .ec-item-role { font-size: 0.75rem; color: var(--text-dim); }
        .ec-item-actions { display: flex; gap: 6px; }
        .ec-empty { color: var(--text-muted); padding: 1.2rem; }
        .ec-lb-row { display: flex; align-items: center; gap: 12px; padding: 0.7rem 1rem; border-bottom: 1px solid var(--border); }
        .ec-lb-row:last-child { border-bottom: none; }
        .ec-lb-rank { font-family: var(--font-mono); color: var(--text-dim); width: 24px; flex-shrink: 0; }
        .ec-lb-rank.top { color: var(--tier-2); }
        .ec-lb-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-2); flex-shrink: 0; }
        .ec-lb-name { flex: 1; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ec-lb-balance { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); }
        .ec-save-bar { display: flex; align-items: center; gap: 12px; margin-top: 0.5rem; }
        .ec-saved { font-size: 0.82rem; color: var(--tier-1); }
        .ec-error { font-size: 0.82rem; color: var(--tier-3); margin-bottom: 0.6rem; }
      `}</style>

      <div className="ec-head">
        <Link to={`/guilds/${id}/dashboard`} className="ec-back">← Dashboard</Link>
        <h1>Ekonomia</h1>
      </div>

      <div className="ec-grid">
        <div>
          <div className="card ec-section">
            <h2>Waluta i nagrody</h2>
            <div className="ec-row">
              <div className="field">
                <label>Nazwa waluty</label>
                <input value={settings.currencyName} onChange={e => updateField('currencyName', e.target.value)} maxLength={32} />
              </div>
              <div className="field" style={{ maxWidth: 90 }}>
                <label>Symbol</label>
                <input value={settings.currencySymbol} onChange={e => updateField('currencySymbol', e.target.value)} maxLength={8} />
              </div>
            </div>
            <div className="field">
              <label>Startowy stan portfela</label>
              <input type="number" min={0} value={settings.startingBalance} onChange={e => updateField('startingBalance', e.target.value)} />
            </div>
            <div className="field">
              <label>Nagroda dzienna (/daily)</label>
              <input type="number" min={0} value={settings.dailyAmount} onChange={e => updateField('dailyAmount', e.target.value)} />
            </div>
            <div className="ec-row">
              <div className="field">
                <label>Praca — min (/work)</label>
                <input type="number" min={0} value={settings.workMin} onChange={e => updateField('workMin', e.target.value)} />
              </div>
              <div className="field">
                <label>Praca — max (/work)</label>
                <input type="number" min={0} value={settings.workMax} onChange={e => updateField('workMax', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Cooldown pracy (minuty)</label>
              <input type="number" min={1} value={settings.workCooldownMinutes} onChange={e => updateField('workCooldownMinutes', e.target.value)} />
            </div>
          </div>

          <div className="card ec-section">
            <h2>Okradanie (/rob)</h2>
            <div className="ec-toggle">
              <input type="checkbox" id="robEnabled" checked={!!settings.robEnabled} onChange={e => updateField('robEnabled', e.target.checked)} />
              <label htmlFor="robEnabled" style={{ fontSize: '0.9rem' }}>Włącz okradanie na serwerze</label>
            </div>
            <div className="ec-row">
              <div className="field">
                <label>Szansa powodzenia (%)</label>
                <input type="number" min={0} max={100} value={settings.robSuccessChance} onChange={e => updateField('robSuccessChance', e.target.value)} disabled={!settings.robEnabled} />
              </div>
              <div className="field">
                <label>Maks. % skradzionej kwoty</label>
                <input type="number" min={1} max={100} value={settings.robMaxPercent} onChange={e => updateField('robMaxPercent', e.target.value)} disabled={!settings.robEnabled} />
              </div>
            </div>
            <div className="ec-save-bar">
              <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz ustawienia'}
              </button>
              {saved && <span className="ec-saved">Zapisano ✓</span>}
            </div>
          </div>
        </div>

        <div>
          <div className="card ec-section">
            <h2>Sklep serwera</h2>
            {itemError && <div className="ec-error">{itemError}</div>}
            <div className="ec-row">
              <div className="field">
                <label>Nazwa przedmiotu</label>
                <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field" style={{ maxWidth: 120 }}>
                <label>Cena</label>
                <input type="number" min={0} value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Rola do nadania (opcjonalnie)</label>
              <select value={itemForm.roleID} onChange={e => setItemForm(f => ({ ...f, roleID: e.target.value }))}>
                <option value="">— brak —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Opis (opcjonalnie)</label>
              <input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} maxLength={200} />
            </div>
            <div className="ec-save-bar">
              <button className="btn btn-primary btn-sm" onClick={submitItem}>
                {editingId ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
              </button>
              {editingId && <button className="btn btn-ghost btn-sm" onClick={resetItemForm}>Anuluj edycję</button>}
            </div>

            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              {items.length === 0 && <p className="ec-empty">Sklep jest jeszcze pusty — dodaj pierwszy przedmiot powyżej.</p>}
              {items.map(item => (
                <div className="ec-item-row" key={item._id}>
                  <div className="ec-item-name">
                    {item.name}
                    {item.roleID && <div className="ec-item-role">rola: {roleNameById[item.roleID] || item.roleID}</div>}
                  </div>
                  <div className="ec-item-price">{item.price} {settings.currencySymbol}</div>
                  <div className="ec-item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(item)}>Edytuj</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item._id)}>Usuń</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card ec-section">
            <h2>Najbogatsi użytkownicy</h2>
            {leaderboard === null && <p className="ec-empty">Ładowanie…</p>}
            {leaderboard && leaderboard.length === 0 && <p className="ec-empty">Nikt jeszcze nie założył portfela na tym serwerze.</p>}
            {leaderboard && leaderboard.map(e => (
              <div className="ec-lb-row" key={e.userID}>
                <span className={`ec-lb-rank${e.rank <= 3 ? ' top' : ''}`}>#{e.rank}</span>
                {e.avatar ? <img className="ec-lb-avatar" src={e.avatar} alt="" /> : <div className="ec-lb-avatar" />}
                <span className="ec-lb-name">{e.username}</span>
                <span className="ec-lb-balance">{e.balance} {settings.currencySymbol}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
