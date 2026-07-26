import React from 'react'

const TIER_COLORS = ['var(--tier-1)', 'var(--tier-1)', 'var(--tier-2)', 'var(--tier-2)', 'var(--tier-3)']

/**
 * Shared "escalation ladder" visual. Same shape used for:
 *  - the warn tariff (warns -> timeout/kick/ban)
 *  - XP levels (poziom -> nagroda)
 * `steps` is an array of { label, sub, active }.
 */
export default function TariffLadder({ steps, compact = false }) {
  return (
    <div className={`ladder${compact ? ' ladder-compact' : ''}`}>
      <style>{`
        .ladder { display: flex; flex-direction: column-reverse; gap: 10px; width: 100%; }
        .ladder-rung {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          position: relative;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .ladder-rung.active { border-color: var(--border-strong); transform: translateX(6px); }
        .ladder-bar { width: 5px; align-self: stretch; border-radius: 4px; flex-shrink: 0; }
        .ladder-text { display: flex; flex-direction: column; gap: 2px; }
        .ladder-label { font-family: var(--font-mono); font-size: 0.82rem; color: var(--text); }
        .ladder-sub { font-size: 0.75rem; color: var(--text-muted); }
        .ladder-compact .ladder-rung { padding: 8px 12px; }
      `}</style>
      {steps.map((s, i) => (
        <div className={`ladder-rung${s.active ? ' active' : ''}`} key={i}>
          <div className="ladder-bar" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
          <div className="ladder-text">
            <span className="ladder-label">{s.label}</span>
            {s.sub && <span className="ladder-sub">{s.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
