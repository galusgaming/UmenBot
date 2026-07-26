import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Panel() {
  const nav = useNavigate()
  const [guilds, setGuilds] = React.useState(null)

  React.useEffect(() => {
    fetch('/api/guilds').then(r => {
      if (r.status === 401 || r.status === 403) { nav('/'); return { guilds: [] } }
      return r.json()
    }).then(j => setGuilds(j.guilds || [])).catch(() => setGuilds([]))
  }, [nav])

  return (
    <div>
      <style>{`
        .pg-head { margin-bottom: 1.75rem; }
        .pg-head h1 { font-family: var(--font-display); font-size: 1.6rem; margin: 0 0 0.4rem; }
        .pg-head p { color: var(--text-muted); margin: 0; }
        .pg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .pg-guild { display: flex; align-items: center; gap: 12px; padding: 1.1rem; }
        .pg-guild:hover { border-color: var(--border-strong); }
        .pg-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); color: var(--text-muted); flex-shrink: 0; }
        .pg-name { font-size: 0.92rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pg-empty { color: var(--text-muted); }
      `}</style>
      <div className="pg-head">
        <h1>Twoje serwery</h1>
        <p>Serwery, na których jesteś administratorem i jest na nich UmenBot.</p>
      </div>
      {guilds === null && <p className="pg-empty">Ładowanie…</p>}
      {guilds && guilds.length === 0 && (
        <p className="pg-empty">Nie znaleziono serwerów z UmenBotem, którymi zarządzasz.</p>
      )}
      <div className="pg-grid">
        {guilds && guilds.map(g => (
          <Link to={`/guilds/${g.id}/settings`} className="card pg-guild" key={g.id}>
            <div className="pg-icon">{g.name?.slice(0, 1)?.toUpperCase() || '?'}</div>
            <span className="pg-name">{g.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
