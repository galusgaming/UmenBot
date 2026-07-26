import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import TariffLadder from '../components/TariffLadder'

const emptyForm = { xpRate: 1, roleRewards: [], blacklist: { channels: [], users: [], roles: [] } }

export default function Settings() {
  const { id } = useParams()
  const nav = useNavigate()
  const [form, setForm] = React.useState(emptyForm)
  const [roles, setRoles] = React.useState([])
  const [textChannels, setTextChannels] = React.useState([])
  const [selectedRole, setSelectedRole] = React.useState('')
  const [selectedChannel, setSelectedChannel] = React.useState('')
  const [selectedBlacklistRole, setSelectedBlacklistRole] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/guilds/${id}/settings`).then(r => {
        if (r.status === 401 || r.status === 403) { nav('/'); return { settings: emptyForm } }
        return r.json()
      }),
      fetch(`/api/guilds/${id}/roles`).then(r => r.json()),
      fetch(`/api/guilds/${id}/channels`).then(r => r.json()),
    ]).then(([settingsResponse, rolesResponse, channelsResponse]) => {
      const s = settingsResponse.settings || {}
      setForm({
        xpRate: s.xpRate ?? 1,
        roleRewards: Array.isArray(s.roleRewards) ? s.roleRewards : [],
        blacklist: {
          channels: s.blacklist?.channels || [],
          users: s.blacklist?.users || [],
          roles: s.blacklist?.roles || [],
        }
      })
      setRoles(rolesResponse.roles || [])
      setTextChannels(channelsResponse.textChannels || [])
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
    setForm(prev => ({ ...prev, roleRewards: [...prev.roleRewards, { level: 0, roleId: selectedRole || roles[0]?.id || '' }] }))
  }
  function removeReward(i) {
    setForm(prev => ({ ...prev, roleRewards: prev.roleRewards.filter((_, idx) => idx !== i) }))
  }
  function addBlacklistValue(kind, value) {
    if (!value) return
    setForm(prev => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        [kind]: Array.from(new Set([...(prev.blacklist[kind] || []), value])),
      },
    }))
  }
  function removeBlacklistValue(kind, value) {
    setForm(prev => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        [kind]: (prev.blacklist[kind] || []).filter(item => item !== value),
      },
    }))
  }

  const roleNameById = React.useMemo(() => Object.fromEntries(roles.map(role => [role.id, role.name])), [roles])
  const channelNameById = React.useMemo(() => Object.fromEntries(textChannels.map(channel => [channel.id, channel.name])), [textChannels])

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/guilds/${id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const ladderSteps = [...form.roleRewards]
    .sort((a, b) => a.level - b.level)
    .map(r => ({ label: `poziom ${r.level}`, sub: r.roleId ? `rola ${roleNameById[r.roleId] || r.roleId}` : 'brak roli' }))

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p>

  return (
    <div>
      <style>{`
        .st-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.75rem; gap: 1rem; flex-wrap: wrap; }
        .st-head h1 { font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 0.35rem; }
        .st-back { font-size: 0.85rem; color: var(--text-dim); }
        .st-back:hover { color: var(--text); }
        .st-section { margin-bottom: 1.25rem; }
        .st-section h2 { font-size: 0.95rem; font-family: var(--font-display); font-weight: 600; margin: 0 0 0.9rem; }
        .st-reward-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 0.6rem; }
        .st-reward-row .field { margin-bottom: 0; flex: 1; }
        .st-picker-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 0.6rem; flex-wrap: wrap; }
        .st-picker-row .field { margin-bottom: 0; flex: 1; min-width: 220px; }
        .st-chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.55rem; }
        .st-chip { display: inline-flex; align-items: center; gap: 8px; padding: 0.35rem 0.6rem; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font-size: 0.8rem; }
        .st-chip button { border: none; background: transparent; color: var(--text-dim); cursor: pointer; padding: 0; }
        .st-chip button:hover { color: var(--tier-3); }
        .st-blacklist-grid { display: grid; gap: 1rem; }
        .st-actions { display: flex; gap: 12px; align-items: center; margin-top: 1.5rem; }
        .st-saved { font-size: 0.85rem; color: var(--tier-1); }
        .st-two-col { display: grid; grid-template-columns: 1fr 260px; gap: 1.5rem; align-items: start; }
        @media (max-width: 700px) { .st-two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div className="st-head">
        <div>
          <Link to="/panel" className="st-back">← Twoje serwery</Link>
          <h1>Ustawienia serwera</h1>
        </div>
      </div>

      <div className="st-two-col">
        <div>
          <div className="card st-section">
            <h2>XP</h2>
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Mnożnik XP</label>
              <input type="number" step="0.1" min="0" value={form.xpRate}
                onChange={e => setForm({ ...form, xpRate: Number(e.target.value) })} />
              <span className="field-hint">1.0 to wartość domyślna. Wyższa = szybsze levelowanie.</span>
            </div>
          </div>

          <div className="card st-section">
            <h2>Nagrody za poziomy</h2>
            {form.roleRewards.map((r, i) => (
              <div className="st-reward-row" key={i}>
                <div className="field">
                  <label>Poziom</label>
                  <input type="number" min="0" value={r.level} onChange={e => updateReward(i, 'level', Number(e.target.value))} />
                </div>
                <div className="field">
                  <label>Rola</label>
                  <select value={r.roleId} onChange={e => updateReward(i, 'roleId', e.target.value)}>
                    <option value="">— wybierz rolę —</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeReward(i)}>Usuń</button>
              </div>
            ))}
            <div className="st-picker-row" style={{ marginTop: '0.75rem' }}>
              <div className="field">
                <label>Dodaj nagrodę z listy ról</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option value="">— wybierz rolę —</option>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={addReward}>+ Dodaj nagrodę</button>
            </div>
          </div>

          <div className="card st-section">
            <h2>Blacklisty</h2>
            <div className="st-blacklist-grid">
              <div className="field">
                <label>Kanały</label>
                <div className="st-picker-row">
                  <div className="field">
                    <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
                      <option value="">— wybierz kanał —</option>
                      {textChannels.map(channel => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => addBlacklistValue('channels', selectedChannel)}>+ Dodaj kanał</button>
                </div>
                <div className="st-chip-list">
                  {form.blacklist.channels.map(channelId => (
                    <span className="st-chip" key={channelId}>
                      #{channelNameById[channelId] || channelId}
                      <button type="button" onClick={() => removeBlacklistValue('channels', channelId)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Użytkownicy (ID)</label>
                <input type="text" className="mono" value={form.blacklist.users.join(', ')}
                  onChange={e => setForm({ ...form, blacklist: { ...form.blacklist, users: e.target.value.split(/[,\s]+/).filter(Boolean) } })} />
              </div>
              <div className="field">
                <label>Role</label>
                <div className="st-picker-row">
                  <div className="field">
                    <select value={selectedBlacklistRole} onChange={e => setSelectedBlacklistRole(e.target.value)}>
                      <option value="">— wybierz rolę —</option>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => addBlacklistValue('roles', selectedBlacklistRole)}>+ Dodaj rolę</button>
                </div>
                <div className="st-chip-list">
                  {form.blacklist.roles.map(roleId => (
                    <span className="st-chip" key={roleId}>
                      {roleNameById[roleId] || roleId}
                      <button type="button" onClick={() => removeBlacklistValue('roles', roleId)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="field-hint">Wpisane tu kanały/użytkownicy/role nie naliczają ani nie przyjmują XP.</span>
          </div>

          <div className="st-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz zmiany'}</button>
            {saved && <span className="st-saved">Zapisano ✓</span>}
          </div>
        </div>

        <div>
          <span className="field-hint" style={{ display: 'block', marginBottom: 8 }}>Podgląd progów poziomów</span>
          {ladderSteps.length > 0 ? (
            <TariffLadder steps={ladderSteps} compact />
          ) : (
            <p className="field-hint">Dodaj nagrodę, żeby zobaczyć podgląd.</p>
          )}
        </div>
      </div>
    </div>
  )
}
