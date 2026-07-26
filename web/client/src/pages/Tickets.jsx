import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { avatarUrl, useMe } from '../lib/api'

function formatTime(value) {
  if (!value) return 'brak daty'
  return new Date(value).toLocaleString('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function TicketMessage({ message }) {
  const authorName = message.author?.tag || message.author?.username || 'Nieznany użytkownik'
  return (
    <div className="tk-msg">
      <img className="tk-avatar" src={avatarUrl(message.author)} alt="" />
      <div className="tk-msg-body">
        <div className="tk-msg-meta">
          <span className="tk-msg-author">{authorName}</span>
          <span className="tk-msg-time">{formatTime(message.createdAt)}</span>
        </div>
        {message.content ? <div className="tk-msg-content">{message.content}</div> : <div className="tk-msg-content tk-msg-empty">[bez treści]</div>}
        {message.attachments.length > 0 && (
          <div className="tk-msg-files">
            {message.attachments.map((attachment) => (
              <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">{attachment.name || attachment.url}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function statusLabel(status) {
  if (status === 'waiting-user') return 'Czeka na usera'
  if (status === 'waiting-staff') return 'W toku'
  return 'Nowy'
}

function ticketMatchesQuery(ticket, query, userId) {
  if (!query) return true
  const haystack = [
    ticket.name,
    ticket.id,
    ticket.ownerId,
    ticket.assigneeId,
    ticket.ticketNumber ? `#${String(ticket.ticketNumber).padStart(4, '0')}` : '',
    ticket.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const needle = query.toLowerCase().trim()
  return haystack.includes(needle)
}

const QUICK_REPLIES = [
  {
    id: 'need-info',
    label: 'Potrzebuję więcej danych',
    text: 'Hej, potrzebuję jeszcze kilku informacji, żeby ruszyć dalej. Podeślij proszę dokładny opis problemu, screeny lub logi, jeśli je masz.',
  },
  {
    id: 'working',
    label: 'Jest w trakcie',
    text: 'Ticket jest już w trakcie sprawdzania. Wracam z odpowiedzią, jak tylko będę mieć konkrety.',
  },
  {
    id: 'resolved',
    label: 'Rozwiązane',
    text: 'Wygląda na to, że sprawa jest już rozwiązana. Jeśli coś jeszcze będzie nie tak, odpisz w tym tickecie.',
  },
  {
    id: 'thanks',
    label: 'Dzięki i zamykam',
    text: 'Dzięki za cierpliwość. Zamykam ticket, ale jeśli problem wróci, otwórz proszę nowy.',
  },
]

export default function Tickets() {
  const { id, ticketId } = useParams()
  const nav = useNavigate()
  const { user } = useMe()
  const [settings, setSettings] = React.useState({ staffRoleID: '', logsChannelID: '', categoryID: '' })
  const [roles, setRoles] = React.useState([])
  const [textChannels, setTextChannels] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [ticketList, setTicketList] = React.useState([])
  const [activeTicket, setActiveTicket] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [loadingTicket, setLoadingTicket] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [panelChannel, setPanelChannel] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [sendResult, setSendResult] = React.useState(null)
  const [reply, setReply] = React.useState('')
  const [replying, setReplying] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const [savingMeta, setSavingMeta] = React.useState(false)
  const [ticketQuery, setTicketQuery] = React.useState('')
  const [ticketScope, setTicketScope] = React.useState('all')
  const [pageError, setPageError] = React.useState('')

  React.useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/guilds/${id}/ticket-settings`).then(r => {
        if (r.status === 401 || r.status === 403) { nav('/'); return { settings: {} } }
        return r.json()
      }),
      fetch(`/api/guilds/${id}/roles`).then(r => r.json()),
      fetch(`/api/guilds/${id}/channels`).then(r => r.json()),
      fetch(`/api/guilds/${id}/tickets`).then(r => r.json()),
    ]).then(([s, r, c, t]) => {
      const st = s.settings || {}
      setSettings({
        staffRoleID: st.staffRoleID || '',
        logsChannelID: st.logsChannelID || '',
        categoryID: st.categoryID || '',
      })
      setRoles(r.roles || [])
      setTextChannels(c.textChannels || [])
      setCategories(c.categories || [])
      setTicketList(t.tickets || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
      setPageError('Nie udało się wczytać danych panelu.')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  React.useEffect(() => {
    if (!loading && !ticketId && ticketList.length > 0) {
      nav(`/guilds/${id}/tickets/${ticketList[0].id}`, { replace: true })
    }
  }, [id, loading, nav, ticketId, ticketList])

  React.useEffect(() => {
    if (!ticketId) {
      setActiveTicket(null)
      setMessages([])
      setPageError('')
      return
    }

    let cancelled = false
    setLoadingTicket(true)
    setPageError('')

    fetch(`/api/guilds/${id}/tickets/${ticketId}`).then(async r => {
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(body.error || 'ticket_load_failed')
      return body
    }).then(body => {
      if (cancelled) return
      setActiveTicket(body.ticket || null)
      setMessages(body.messages || [])
      setLoadingTicket(false)
    }).catch(() => {
      if (cancelled) return
      setActiveTicket(null)
      setMessages([])
      setLoadingTicket(false)
      setPageError('Nie udało się wczytać tego ticketa.')
    })

    return () => { cancelled = true }
  }, [id, ticketId])

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

  async function sendReply(e) {
    e.preventDefault()
    if (!ticketId || !reply.trim() || replying) return

    setReplying(true)
    try {
      const r = await fetch(`/api/guilds/${id}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error || 'send_failed')
      setMessages(prev => [...prev, j.message])
      setReply('')
    } finally {
      setReplying(false)
    }
  }

  function insertQuickReply(text) {
    setReply((current) => {
      if (!current.trim()) return text
      return `${current.trimEnd()}\n\n${text}`
    })
  }

  async function closeCurrentTicket() {
    if (!ticketId || closing) return
    const confirmed = window.confirm('Zamknąć ten ticket? Zostanie wygenerowany transkrypt i kanał zostanie usunięty.')
    if (!confirmed) return

    setClosing(true)
    try {
      const r = await fetch(`/api/guilds/${id}/tickets/${ticketId}/close`, {
        method: 'POST',
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || 'close_failed')
      setTicketList(prev => prev.filter(ticket => ticket.id !== ticketId))
      nav(`/guilds/${id}/tickets`, { replace: true })
    } catch {
      setPageError('Nie udało się zamknąć ticketa.')
    } finally {
      setClosing(false)
    }
  }

  async function setCurrentTicketMeta(patch) {
    if (!ticketId || savingMeta) return
    setSavingMeta(true)
    try {
      const r = await fetch(`/api/guilds/${id}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || 'update_failed')
      setActiveTicket(j.ticket || null)
      setTicketList(prev => prev.map(ticket => ticket.id === ticketId ? { ...ticket, ...(j.ticket || {}) } : ticket))
    } catch {
      setPageError('Nie udało się zaktualizować ticketu.')
    } finally {
      setSavingMeta(false)
    }
  }

  const configured = settings.staffRoleID && settings.logsChannelID
  const currentTicket = activeTicket || ticketList.find(ticket => ticket.id === ticketId) || null
  const filteredTickets = React.useMemo(() => {
    return ticketList.filter(ticket => {
      const inScope = (() => {
        if (ticketScope === 'mine') return ticket.assigneeId === user?.id
        if (ticketScope === 'unassigned') return !ticket.assigneeId
        if (ticketScope === 'waiting-user') return ticket.status === 'waiting-user'
        if (ticketScope === 'waiting-staff') return ticket.status === 'waiting-staff'
        if (ticketScope === 'open') return ticket.status === 'open'
        return true
      })()

      return inScope && ticketMatchesQuery(ticket, ticketQuery, user?.id)
    })
  }, [ticketList, ticketQuery, ticketScope, user?.id])

  const ticketCounters = React.useMemo(() => ({
    all: ticketList.length,
    mine: ticketList.filter(ticket => ticket.assigneeId === user?.id).length,
    unassigned: ticketList.filter(ticket => !ticket.assigneeId).length,
    waitingUser: ticketList.filter(ticket => ticket.status === 'waiting-user').length,
    waitingStaff: ticketList.filter(ticket => ticket.status === 'waiting-staff').length,
  }), [ticketList, user?.id])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p>

  return (
    <div>
      <style>{`
        .tk-head { margin-bottom: 1.4rem; }
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
        .tk-ticket-shell { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 1rem; min-height: 72vh; }
        .tk-list, .tk-thread { min-height: 100%; }
        .tk-list { padding: 0.75rem; }
        .tk-list-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 0.85rem; }
        .tk-list-head h2 { margin: 0; }
        .tk-search { margin-bottom: 0.75rem; }
        .tk-search input { width: 100%; }
        .tk-filters { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .tk-filter { border: 1px solid var(--border); background: var(--surface-2); color: var(--text-muted); border-radius: 999px; padding: 0.4rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
        .tk-filter.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
        .tk-list-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; margin-bottom: 0.9rem; }
        .tk-summary { padding: 0.7rem 0.8rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); }
        .tk-summary-label { display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .tk-summary-value { font-size: 1rem; font-weight: 700; }
        .tk-ticket-item { display: block; padding: 0.95rem 1rem; border-radius: var(--radius-sm); border: 1px solid transparent; color: var(--text); margin-bottom: 0.6rem; }
        .tk-ticket-item:hover { background: var(--surface-hover); border-color: var(--border); }
        .tk-ticket-item.active { background: var(--accent-soft); border-color: var(--accent); }
        .tk-ticket-name { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .tk-ticket-meta { font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; }
        .tk-ticket-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.4rem; }
        .tk-ticket-chip { font-size: 0.68rem; padding: 0.22rem 0.45rem; border-radius: 999px; border: 1px solid var(--border); color: var(--text-muted); background: var(--surface-2); }
        .tk-ticket-chip.status { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .tk-ticket-activity { display: block; margin-top: 0.35rem; font-size: 0.74rem; color: var(--text-dim); }
        .tk-empty { color: var(--text-muted); font-size: 0.9rem; }
        .tk-thread { padding: 1rem; display: flex; flex-direction: column; }
        .tk-thread-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 1rem; }
        .tk-thread-title { margin: 0; font-family: var(--font-display); font-size: 1.15rem; }
        .tk-thread-sub { margin-top: 0.35rem; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; }
        .tk-thread-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.7rem; }
        .tk-badge { font-size: 0.72rem; padding: 0.28rem 0.55rem; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text-muted); }
        .tk-badge.status { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
        .tk-thread-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .tk-meta-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 0.9rem; }
        .tk-thread-link { color: var(--accent); font-size: 0.85rem; }
        .tk-thread-link:hover { text-decoration: underline; }
        .tk-messages { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 0.25rem; }
        .tk-msg { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 0.7rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: rgba(255,255,255,0.02); }
        .tk-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--surface-2); }
        .tk-msg-meta { display: flex; gap: 10px; align-items: baseline; margin-bottom: 0.35rem; }
        .tk-msg-author { font-size: 0.9rem; font-weight: 600; }
        .tk-msg-time { font-size: 0.75rem; color: var(--text-muted); }
        .tk-msg-content { white-space: pre-wrap; line-height: 1.55; font-size: 0.92rem; color: var(--text); }
        .tk-msg-empty { color: var(--text-muted); }
        .tk-msg-files { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.6rem; font-size: 0.82rem; }
        .tk-msg-files a { color: var(--accent); }
        .tk-reply { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .tk-reply textarea { min-height: 110px; resize: vertical; }
        .tk-templates { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem; }
        .tk-template { border: 1px solid var(--border); background: var(--surface-2); color: var(--text-muted); border-radius: 999px; padding: 0.35rem 0.65rem; font-size: 0.76rem; cursor: pointer; }
        .tk-template:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .tk-reply-actions { display: flex; gap: 12px; align-items: center; margin-top: 0.85rem; }
        .tk-reply-note { font-size: 0.8rem; color: var(--text-muted); }
        .tk-placeholder { display: grid; place-items: center; min-height: 360px; color: var(--text-muted); text-align: center; padding: 2rem; }
        @media (max-width: 920px) { .tk-ticket-shell { grid-template-columns: 1fr; } }
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

      {pageError && <p className="tk-empty" style={{ marginBottom: '1rem', color: 'var(--tier-3)' }}>{pageError}</p>}

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

      <div className="card tk-section tk-ticket-shell">
        <aside className="tk-list">
          <div className="tk-list-head">
            <h2>Otwarte tickety</h2>
            <span className="field-hint">{filteredTickets.length}/{ticketList.length}</span>
          </div>
          <div className="tk-search">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Szukaj</label>
              <input
                type="text"
                value={ticketQuery}
                onChange={e => setTicketQuery(e.target.value)}
                placeholder="Nazwa, numer, owner, przypisany..."
              />
            </div>
          </div>
          <div className="tk-filters">
            <button type="button" className={`tk-filter${ticketScope === 'all' ? ' active' : ''}`} onClick={() => setTicketScope('all')}>Wszystkie ({ticketCounters.all})</button>
            <button type="button" className={`tk-filter${ticketScope === 'mine' ? ' active' : ''}`} onClick={() => setTicketScope('mine')}>Moje ({ticketCounters.mine})</button>
            <button type="button" className={`tk-filter${ticketScope === 'unassigned' ? ' active' : ''}`} onClick={() => setTicketScope('unassigned')}>Nieprzypisane ({ticketCounters.unassigned})</button>
            <button type="button" className={`tk-filter${ticketScope === 'waiting-user' ? ' active' : ''}`} onClick={() => setTicketScope('waiting-user')}>Czeka na usera ({ticketCounters.waitingUser})</button>
            <button type="button" className={`tk-filter${ticketScope === 'waiting-staff' ? ' active' : ''}`} onClick={() => setTicketScope('waiting-staff')}>W toku ({ticketCounters.waitingStaff})</button>
          </div>
          <div className="tk-list-summary">
            <div className="tk-summary"><span className="tk-summary-label">Wszystkie</span><span className="tk-summary-value">{ticketCounters.all}</span></div>
            <div className="tk-summary"><span className="tk-summary-label">Moje</span><span className="tk-summary-value">{ticketCounters.mine}</span></div>
            <div className="tk-summary"><span className="tk-summary-label">Bez przypisania</span><span className="tk-summary-value">{ticketCounters.unassigned}</span></div>
            <div className="tk-summary"><span className="tk-summary-label">Wymagają akcji</span><span className="tk-summary-value">{ticketCounters.waitingUser + ticketCounters.waitingStaff}</span></div>
          </div>
          {filteredTickets.length === 0 && <p className="tk-empty">Brak ticketów spełniających aktualne filtry.</p>}
          {filteredTickets.map(ticket => (
            <Link key={ticket.id} to={`/guilds/${id}/tickets/${ticket.id}`} className={`tk-ticket-item${ticket.id === ticketId ? ' active' : ''}`}>
              <div className="tk-ticket-name">{ticket.name}</div>
              <div className="tk-ticket-chips">
                <span className="tk-ticket-chip status">{statusLabel(ticket.status)}</span>
                {ticket.assigneeId ? <span className="tk-ticket-chip">{ticket.assigneeId === user?.id ? 'Przypisany do mnie' : `Przypisany: ${ticket.assigneeId}`}</span> : <span className="tk-ticket-chip">Nieprzypisany</span>}
              </div>
              <div className="tk-ticket-meta">
                {ticket.ticketNumber ? `#${String(ticket.ticketNumber).padStart(4, '0')}` : ticket.id}
                <br />
                Otwarty: {formatTime(ticket.createdAt)}
                <span className="tk-ticket-activity">Ostatnia aktywność: {formatTime(ticket.lastMessageAt || ticket.createdAt)}</span>
              </div>
            </Link>
          ))}
        </aside>

        <section className="tk-thread">
          {loadingTicket && <div className="tk-placeholder">Ładowanie ticketa…</div>}
          {!loadingTicket && !currentTicket && (
            <div className="tk-placeholder">
              Wybierz ticket z listy po lewej, aby podejrzeć rozmowę i odpisać z poziomu panelu.
            </div>
          )}
          {!loadingTicket && currentTicket && (
            <>
              <div className="tk-thread-top">
                <div>
                  <h2 className="tk-thread-title">{currentTicket.name}</h2>
                  <div className="tk-thread-sub">
                    Właściciel: {currentTicket.ownerId || 'nieznany'}
                    <br />
                    Otwarty: {formatTime(currentTicket.createdAt)}
                  </div>
                  <div className="tk-thread-badges">
                    <span className="tk-badge status">{statusLabel(currentTicket.status)}</span>
                    {currentTicket.assigneeId ? <span className="tk-badge">Przypisany: {currentTicket.assigneeId}</span> : <span className="tk-badge">Nieprzypisany</span>}
                  </div>
                </div>
                <div className="tk-thread-actions">
                  {currentTicket.url && (
                    <a className="tk-thread-link" href={currentTicket.url} target="_blank" rel="noreferrer">Otwórz w Discordzie</a>
                  )}
                    <button className="btn btn-ghost" type="button" onClick={closeCurrentTicket} disabled={closing}>
                    {closing ? 'Zamykanie…' : 'Zamknij ticket'}
                  </button>
                </div>
              </div>

              <div className="tk-meta-row">
                <div className="field" style={{ minWidth: 220, marginBottom: 0 }}>
                  <label>Status</label>
                  <select value={currentTicket.status || 'open'} onChange={e => setCurrentTicketMeta({ status: e.target.value })} disabled={savingMeta}>
                    <option value="open">Nowy</option>
                    <option value="waiting-user">Czeka na usera</option>
                    <option value="waiting-staff">W toku</option>
                  </select>
                </div>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => currentTicket.assigneeId === user?.id
                    ? setCurrentTicketMeta({ assigneeId: null })
                    : setCurrentTicketMeta({ assignToMe: true })}
                  disabled={savingMeta || !user?.id}
                >
                  {currentTicket.assigneeId === user?.id ? 'Odprzypisz ode mnie' : 'Przypisz do mnie'}
                </button>
                {savingMeta && <span className="tk-hint">Zapisywanie…</span>}
              </div>

              <div className="tk-messages">
                {messages.map(message => <TicketMessage key={message.id} message={message} />)}
              </div>

              <form className="tk-reply" onSubmit={sendReply}>
                <div className="field">
                  <label>Odpowiedź</label>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Napisz wiadomość do użytkownika lub zespołu supportu…" />
                  <div className="tk-templates">
                    {QUICK_REPLIES.map(template => (
                      <button key={template.id} type="button" className="tk-template" onClick={() => insertQuickReply(template.text)}>
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="tk-reply-actions">
                  <button className="btn btn-primary" type="submit" disabled={!reply.trim() || replying}>{replying ? 'Wysyłanie…' : 'Wyślij wiadomość'}</button>
                  <span className="tk-reply-note">Wiadomość zostanie wysłana do otwartego kanału ticketa.</span>
                </div>
              </form>
            </>
          )}
        </section>
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
