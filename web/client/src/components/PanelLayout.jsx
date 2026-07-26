import React from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { avatarUrl } from '../lib/api'

export default function PanelLayout({ user, children }) {
  const { id } = useParams()
  const loc = useLocation()

  const navItem = (to, label) => (
    <Link to={to} className={`pl-navitem${loc.pathname === to ? ' active' : ''}`}>{label}</Link>
  )

  return (
    <div className="pl-shell">
      <style>{`
        .pl-shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
        .pl-sidebar { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.25rem 1rem; position: sticky; top: 0; height: 100vh; }
        .pl-logo { font-family: var(--font-display); font-weight: 700; font-size: 1rem; padding: 0.5rem 0.5rem 1.5rem; }
        .pl-logo a:hover { color: var(--accent); }
        .pl-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .pl-navitem { padding: 0.6rem 0.7rem; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-muted); }
        .pl-navitem:hover { background: var(--surface-hover); color: var(--text); }
        .pl-navitem.active { background: var(--accent-soft); color: var(--accent); }
        .pl-user { display: flex; align-items: center; gap: 10px; padding-top: 1rem; border-top: 1px solid var(--border); margin-top: 1rem; }
        .pl-user img { width: 32px; height: 32px; border-radius: 50%; }
        .pl-user-name { font-size: 0.85rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pl-user-logout { font-size: 0.78rem; color: var(--text-dim); }
        .pl-user-logout:hover { color: var(--tier-3); }
        .pl-main { padding: 2.5rem 3rem; max-width: 900px; }
        @media (max-width: 780px) {
          .pl-shell { grid-template-columns: 1fr; }
          .pl-sidebar { position: static; height: auto; flex-direction: row; align-items: center; overflow-x: auto; }
          .pl-nav { flex-direction: row; }
          .pl-main { padding: 1.5rem; }
        }
      `}</style>
      <aside className="pl-sidebar">
        <div className="pl-logo"><Link to="/">Umen<span style={{ color: 'var(--accent)' }}>Bot</span></Link></div>
        <nav className="pl-nav">
          {navItem('/panel', 'Twoje serwery')}
          {id && navItem(`/guilds/${id}/settings`, 'XP i nagrody')}
          {id && navItem(`/guilds/${id}/tickets`, 'Tickety')}
          {id && navItem(`/guilds/${id}/leaderboard`, 'Ranking')}
        </nav>
        {user && (
          <div className="pl-user">
            <img src={avatarUrl(user)} alt="" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pl-user-name">{user.username}</div>
              <a className="pl-user-logout" href="/logout">Wyloguj</a>
            </div>
          </div>
        )}
      </aside>
      <main className="pl-main">{children}</main>
    </div>
  )
}
