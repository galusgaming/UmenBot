import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function Leaderboard() {
  const { id } = useParams()
  const nav = useNavigate()
  const [entries, setEntries] = React.useState(null)

  React.useEffect(() => {
    fetch(`/api/guilds/${id}/leaderboard`).then(r => {
      if (r.status === 401 || r.status === 403) { nav('/'); return { entries: [] } }
      return r.json()
    }).then(j => setEntries(j.entries || [])).catch(() => setEntries([]))
  }, [id, nav])

  return (
    <div>
      <style>{`
        .lb-head { margin-bottom: 1.75rem; }
        .lb-head h1 { font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 0.35rem; }
        .lb-back { font-size: 0.85rem; color: var(--text-dim); }
        .lb-back:hover { color: var(--text); }
        .lb-row { display: flex; align-items: center; gap: 14px; padding: 0.8rem 1rem; border-bottom: 1px solid var(--border); }
        .lb-row:last-child { border-bottom: none; }
        .lb-rank { font-family: var(--font-mono); color: var(--text-dim); width: 24px; flex-shrink: 0; }
        .lb-rank.top { color: var(--tier-2); }
        .lb-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); flex-shrink: 0; }
        .lb-name { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-level { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); }
        .lb-xp { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-dim); min-width: 70px; text-align: right; }
        .lb-empty { color: var(--text-muted); }
      `}</style>
      <div className="lb-head">
        <Link to="/panel" className="lb-back">← Twoje serwery</Link>
        <h1>Ranking poziomów</h1>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {entries === null && <p className="lb-empty" style={{ padding: '1.2rem' }}>Ładowanie…</p>}
        {entries && entries.length === 0 && <p className="lb-empty" style={{ padding: '1.2rem' }}>Nikt jeszcze nie zdobył XP na tym serwerze.</p>}
        {entries && entries.map(e => (
          <div className="lb-row" key={e.userID}>
            <span className={`lb-rank${e.rank <= 3 ? ' top' : ''}`}>#{e.rank}</span>
            {e.avatar ? <img className="lb-avatar" src={e.avatar} alt="" /> : <div className="lb-avatar" />}
            <span className="lb-name">{e.username}</span>
            <span className="lb-level">poziom {e.level}</span>
            <span className="lb-xp">{e.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
