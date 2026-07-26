import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { avatarUrl } from '../lib/api'

function formatTime(value) {
  if (!value) return 'brak daty'
  return new Date(value).toLocaleString('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function StatCard({ label, value, hint }) {
  return (
    <div className="db-stat card">
      <span className="db-stat-label">{label}</span>
      <span className="db-stat-value">{value}</span>
      {hint && <span className="db-stat-hint">{hint}</span>}
    </div>
  )
}

function statusLabel(status) {
  if (status === 'waiting-user') return 'Czeka na usera'
  if (status === 'waiting-staff') return 'W toku'
  return 'Nowy'
}

export default function Dashboard() {
  const { id } = useParams()
  const nav = useNavigate()
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/guilds/${id}/dashboard`).then(r => {
      if (r.status === 401 || r.status === 403) { nav('/'); return null }
      return r.json()
    }).then(j => {
      if (!j) return
      setData(j)
      setLoading(false)
    }).catch(() => {
      setData(null)
      setLoading(false)
    })
  }, [id, nav])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p>

  const stats = data?.stats || {}
  const recentTickets = data?.recentTickets || []
  const topMembers = data?.topMembers || []
  const recentActions = data?.recentActions || []

  function actionLabel(action) {
    if (action === 'ticket_created') return 'Ticket utworzony'
    if (action === 'ticket_closed') return 'Ticket zamknięty'
    if (action === 'ticket_meta_updated') return 'Zmieniono status/przypisanie'
    if (action === 'ticket_settings_saved') return 'Zapisano ustawienia ticketów'
    if (action === 'settings_saved') return 'Zapisano ustawienia serwera'
    if (action === 'ticket_message_sent') return 'Wysłano wiadomość do ticketu'
    return action
  }

  return (
    <div>
      <style>{`
        .db-head { margin-bottom: 1.5rem; display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
        .db-head h1 { font-family: var(--font-display); font-size: 1.65rem; margin: 0 0 0.35rem; }
        .db-head p { margin: 0; color: var(--text-muted); }
        .db-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 1rem; }
        .db-stat { padding: 1rem; }
        .db-stat-label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem; }
        .db-stat-value { display: block; font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); }
        .db-stat-hint { display: block; margin-top: 0.35rem; font-size: 0.78rem; color: var(--text-dim); }
        .db-two { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1rem; }
        .db-section { padding: 1rem; }
        .db-section h2 { font-size: 0.95rem; font-family: var(--font-display); margin: 0 0 0.9rem; }
        .db-ticket { display: flex; justify-content: space-between; gap: 10px; padding: 0.8rem 0; border-bottom: 1px solid var(--border); }
        .db-ticket:last-child { border-bottom: none; }
        .db-ticket-name { font-weight: 600; }
        .db-ticket-meta { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
        .db-pill { font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 999px; border: 1px solid var(--border); color: var(--text-muted); background: var(--surface-2); white-space: nowrap; }
        .db-member { display: flex; align-items: center; gap: 12px; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
        .db-member:last-child { border-bottom: none; }
        .db-avatar { width: 34px; height: 34px; border-radius: 50%; }
        .db-member-name { font-weight: 600; }
        .db-member-meta { font-size: 0.8rem; color: var(--text-muted); }
        .db-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 1100px) { .db-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .db-two { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .db-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="db-head">
        <div>
          <h1>Dashboard serwera{data?.guild?.name ? `: ${data.guild.name}` : ''}</h1>
          <p>Szybki przegląd XP, ticketów i aktywności bez klikania po podstronach.</p>
        </div>
        <div className="db-actions">
          <Link className="btn btn-ghost" to={`/guilds/${id}/settings`}>Ustawienia</Link>
          <Link className="btn btn-ghost" to={`/guilds/${id}/tickets`}>Tickety</Link>
          <Link className="btn btn-ghost" to={`/guilds/${id}/leaderboard`}>Ranking</Link>
        </div>
      </div>

      <div className="db-grid">
        <StatCard label="Ticketów" value={stats.tickets?.total ?? 0} hint={`${stats.tickets?.open ?? 0} nowych, ${stats.tickets?.waitingStaff ?? 0} w toku`} />
        <StatCard label="Bez przypisania" value={stats.tickets?.unassigned ?? 0} hint="Warto rozdysponować między moderatorów" />
        <StatCard label="XP rate" value={`${stats.xpRate ?? 1}x`} hint={`${stats.roleRewards?.length ?? 0} progów nagród`} />
        <StatCard label="Ticket setup" value={stats.ticketSettings?.configured ? 'OK' : 'Brak'} hint={`${stats.ticketSettings?.ticketCount ?? 0} utworzonych ticketów`} />
      </div>

      <div className="db-two">
        <section className="card db-section">
          <h2>Ostatnie tickety</h2>
          {recentTickets.length === 0 ? (
            <p className="field-hint">Brak otwartych ticketów do pokazania.</p>
          ) : recentTickets.map(ticket => (
            <div className="db-ticket" key={ticket.id}>
              <div>
                <div className="db-ticket-name">{ticket.name}</div>
                <div className="db-ticket-meta">
                  {statusLabel(ticket.status)} · {ticket.assigneeId ? `przypisany: ${ticket.assigneeId}` : 'nieprzypisany'}
                  <br />
                  Ostatnia aktywność: {formatTime(ticket.lastMessageAt || ticket.createdAt)}
                </div>
              </div>
              <span className="db-pill">{ticket.ticketNumber ? `#${String(ticket.ticketNumber).padStart(4, '0')}` : 'ticket'}</span>
            </div>
          ))}
        </section>

        <section className="card db-section">
          <h2>Top poziomy</h2>
          {topMembers.length === 0 ? (
            <p className="field-hint">Brak danych rankingu.</p>
          ) : topMembers.map(member => (
            <div className="db-member" key={member.userID}>
              {member.avatar ? <img className="db-avatar" src={member.avatar} alt="" /> : <div className="db-avatar" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="db-member-name">{member.username}</div>
                <div className="db-member-meta">poziom {member.level} · {member.xp} XP</div>
              </div>
              <span className="db-pill">#{member.rank}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="card db-section" style={{ marginTop: '1rem' }}>
        <h2>Skróty</h2>
        <div className="db-actions">
          <Link className="btn btn-primary" to={`/guilds/${id}/tickets`}>Otwórz centrum ticketów</Link>
          <Link className="btn btn-ghost" to={`/guilds/${id}/settings`}>Dopasuj XP i blacklisty</Link>
          <Link className="btn btn-ghost" to={`/guilds/${id}/leaderboard`}>Sprawdź ranking</Link>
        </div>
      </section>

      <section className="card db-section" style={{ marginTop: '1rem' }}>
        <h2>Ostatnie działania</h2>
        {recentActions.length === 0 ? (
          <p className="field-hint">Brak zapisanej historii działań.</p>
        ) : recentActions.map(action => (
          <div className="db-ticket" key={action._id}>
            <div>
              <div className="db-ticket-name">{actionLabel(action.action)}</div>
              <div className="db-ticket-meta">
                {action.actorName ? `przez ${action.actorName}` : 'bez autora'}
                {action.targetType ? ` · ${action.targetType}` : ''}
                {action.targetId ? ` · ${action.targetId}` : ''}
                <br />
                {formatTime(action.createdAt)}
              </div>
            </div>
            <span className="db-pill">{action.action}</span>
          </div>
        ))}
      </section>
    </div>
  )
}