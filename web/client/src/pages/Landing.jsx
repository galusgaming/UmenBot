import React from 'react'
import { Link } from 'react-router-dom'
import { useMe, usePublicInfo } from '../lib/api'
import TariffLadder from '../components/TariffLadder'

const WARN_LADDER = [
  { label: '5 warnów', sub: 'ban', active: false },
  { label: '3 warny', sub: 'timeout 1h', active: true },
  { label: '1 warn', sub: 'zapisany', active: false },
]

const XP_LADDER = [
  { label: 'poziom 20', sub: 'rola: Weteran', active: false },
  { label: 'poziom 10', sub: 'rola: Zaufany', active: true },
  { label: 'poziom 1', sub: 'start', active: false },
]

const FEATURES = [
  {
    title: 'Moderacja, która się nie spóźnia',
    body: 'Ustawiasz progi ostrzeżeń raz — bot pilnuje ich o każdej porze dnia i nocy, bez Ciebie.',
  },
  {
    title: 'Tickety bez zalewania DM-ów',
    body: 'Użytkownik klika przycisk, dostaje prywatny kanał, staff widzi wszystko w jednym miejscu.',
  },
  {
    title: 'Ludzie wracają po XP',
    body: 'Poziomy i role-nagrody za aktywność — mały bodziec, żeby serwer żył, nie tylko istniał.',
  },
  {
    title: 'Wszystko z jednego panelu',
    body: 'Logujesz się przez Discord i zarządzasz botem z przeglądarki — zero grzebania w bazie.',
  },
]

const LEADERBOARD_PREVIEW = [
  { rank: 1, name: 'kubix_pl', level: 34 },
  { rank: 2, name: 'weronika.exe', level: 29 },
  { rank: 3, name: 'stary_wilk', level: 27 },
]

const ECONOMY_LIVE = ['/work', '/daily', '/shop', '/buy', '/sell', '/rob', '/coinflip', '/slots', '/transfer']

const PUBLIC_COMMANDS = [
  ['/ping', 'sprawdza opóźnienie'],
  ['/help', 'lista komend i pomoc'],
  ['/info', 'informacje o bocie/serwerze'],
  ['/level', 'poziom użytkownika'],
  ['/leaderboard', 'ranking aktywności'],
  ['/ticket', 'otwiera prywatny ticket'],
  ['/balance', 'stan portfela'],
  ['/daily', 'codzienna nagroda'],
  ['/work', 'praca za monety'],
  ['/shop', 'sklep serwera'],
  ['/buy item', 'kupuje przedmiot'],
  ['/sell item', 'sprzedaje przedmiot'],
  ['/transfer user amount', 'przelew do innego użytkownika'],
  ['/rob user', 'próba okradzenia gracza'],
  ['/coinflip amount', 'orzeł czy reszka'],
  ['/slots amount', 'automaty'],
]

const MOD_COMMANDS = [
  ['/warn user reason', 'nadaje ostrzeżenie, sprawdza taryfikator'],
  ['/pardon user amount', 'usuwa wskazaną liczbę ostrzeżeń'],
  ['/ban user reason', 'banuje użytkownika'],
  ['/clear amount', 'czyści wiadomości'],
]

function Nav({ user, loading }) {
  return (
    <header className="l-nav">
      <div className="l-nav-inner">
        <span className="l-logo">Umen<span style={{ color: 'var(--accent)' }}>Bot</span></span>
        <nav className="l-nav-links">
          <a href="#funkcje">Funkcje</a>
          <a href="#tickety">Tickety</a>
          <a href="#ranking">Ranking</a>
          <a href="#komendy">Komendy</a>
        </nav>
        <div className="l-nav-cta">
          {loading ? null : user ? (
            <Link to="/panel" className="btn btn-primary btn-sm">Panel</Link>
          ) : (
            <a href="/login" className="btn btn-ghost btn-sm">Zaloguj</a>
          )}
        </div>
      </div>
    </header>
  )
}

export default function Landing() {
  const { user, loading } = useMe()
  const { info } = usePublicInfo()
  const inviteHref = info?.inviteUrl || '#'

  return (
    <div className="landing">
      <style>{`
        .landing { min-height: 100vh; }
        .l-nav { position: sticky; top: 0; z-index: 10; background: rgba(15,17,23,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
        .l-nav-inner { max-width: 1080px; margin: 0 auto; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 2rem; }
        .l-logo { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; }
        .l-nav-links { display: flex; gap: 1.5rem; font-size: 0.9rem; color: var(--text-muted); margin-right: auto; }
        .l-nav-links a:hover { color: var(--text); }

        .l-hero { max-width: 1080px; margin: 0 auto; padding: 4.5rem 1.5rem 3rem; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 3rem; align-items: center; }
        .l-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); border: 1px solid var(--border-strong); padding: 0.3rem 0.7rem; border-radius: 999px; margin-bottom: 1.5rem; }
        .l-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tier-2); }
        .l-h1 { font-family: var(--font-display); font-size: clamp(2.1rem, 4.2vw, 3.1rem); line-height: 1.1; font-weight: 700; margin: 0 0 1.25rem; }
        .l-h1 em { font-style: normal; color: var(--accent); }
        .l-sub { color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; max-width: 46ch; margin-bottom: 2rem; }
        .l-cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 2rem; }
        .l-stats { display: flex; gap: 2rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim); }
        .l-stats b { color: var(--text); font-size: 0.95rem; }

        .l-hero-visual-label { font-size: 0.78rem; color: var(--text-dim); font-family: var(--font-mono); margin-bottom: 0.6rem; }

        .l-section { max-width: 1080px; margin: 0 auto; padding: 4rem 1.5rem; border-top: 1px solid var(--border); }
        .l-section-head { margin-bottom: 2.25rem; }
        .l-kicker { font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
        .l-h2 { font-family: var(--font-display); font-size: 1.9rem; font-weight: 600; margin: 0.5rem 0 0.75rem; }
        .l-p { color: var(--text-muted); max-width: 60ch; line-height: 1.6; }

        .l-features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .l-feature { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.4rem; }
        .l-feature h3 { font-family: var(--font-display); font-size: 1rem; margin: 0 0 0.5rem; font-weight: 600; }
        .l-feature p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.55; margin: 0; }

        .l-tariff { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        .l-tariff-example { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; margin-top: 1.25rem; }
        .l-tariff-example div { margin: 0.2rem 0; }

        .l-ticket-flow { display: flex; gap: 0; align-items: stretch; }
        .l-ticket-step { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; }
        .l-ticket-step + .l-ticket-step { margin-left: 1rem; }
        .l-ticket-num { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); margin-bottom: 0.5rem; }
        .l-ticket-step h4 { font-family: var(--font-display); font-size: 0.95rem; margin: 0 0 0.4rem; font-weight: 600; }
        .l-ticket-step p { color: var(--text-muted); font-size: 0.85rem; margin: 0; line-height: 1.5; }

        .l-lb { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        .l-lb-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .l-lb-row { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--border); }
        .l-lb-row:last-child { border-bottom: none; }
        .l-lb-rank { font-family: var(--font-mono); color: var(--tier-2); width: 20px; }
        .l-lb-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-2); }
        .l-lb-name { flex: 1; font-size: 0.88rem; }
        .l-lb-level { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); }

        .l-economy { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .l-economy-cmds { display: flex; gap: 8px; flex-wrap: wrap; }
        .l-economy-cmds code { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); border: 1px solid var(--border-strong); padding: 0.25rem 0.55rem; border-radius: 6px; }
        .l-live-badge { font-family: var(--font-mono); font-size: 0.72rem; color: var(--tier-1); border: 1px solid var(--tier-1); padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap; }

        .l-commands { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .l-cmd-group h4 { font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); margin-bottom: 1rem; }
        .l-cmd-row { display: flex; justify-content: space-between; gap: 12px; padding: 0.6rem 0; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
        .l-cmd-row code { color: var(--accent); }
        .l-cmd-row span { color: var(--text-muted); text-align: right; }

        .l-panel-teaser { display: flex; align-items: center; justify-content: space-between; gap: 2rem; background: linear-gradient(135deg, var(--surface), var(--surface-2)); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
        .l-panel-teaser h3 { font-family: var(--font-display); margin: 0 0 0.5rem; font-size: 1.3rem; }
        .l-panel-teaser p { color: var(--text-muted); margin: 0 0 1.25rem; max-width: 48ch; }

        .l-footer { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 3rem; display: flex; justify-content: space-between; align-items: center; color: var(--text-dim); font-size: 0.85rem; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 1rem; }
        .l-footer a:hover { color: var(--text); }

        @media (max-width: 860px) {
          .l-hero { grid-template-columns: 1fr; padding-top: 3rem; }
          .l-features { grid-template-columns: 1fr 1fr; }
          .l-tariff, .l-commands, .l-lb { grid-template-columns: 1fr; }
          .l-ticket-flow { flex-direction: column; }
          .l-ticket-step + .l-ticket-step { margin-left: 0; margin-top: 1rem; }
          .l-nav-links { display: none; }
        }
        @media (max-width: 520px) {
          .l-features { grid-template-columns: 1fr; }
        }
      `}</style>

      <Nav user={user} loading={loading} />

      <section className="l-hero">
        <div>
          <span className="l-eyebrow"><span className="l-eyebrow-dot" />ALPHA · aktywnie rozwijany</span>
          <h1 className="l-h1">Twój serwer zasługuje<br /><em>na porządek.</em></h1>
          <p className="l-sub">UmenBot pilnuje zasad, obsługuje zgłoszenia i nagradza aktywnych — żebyś Ty nie musiał robić tego ręcznie o 2 w nocy. Konfiguracja z panelu, bez komend w konsoli.</p>
          <div className="l-cta-row">
            <a className="btn btn-primary" href={inviteHref}>Dodaj do serwera</a>
            <a className="btn btn-ghost" href="#funkcje">Zobacz co potrafi</a>
          </div>
          <div className="l-stats">
            <span><b>{info?.guildCount ?? '—'}</b> serwerów</span>
            <span><b>za darmo</b> w użyciu</span>
            <span><b>panel WWW</b> w komplecie</span>
          </div>
        </div>
        <div>
          <div className="l-hero-visual-label">taryfikator ostrzeżeń</div>
          <TariffLadder steps={WARN_LADDER} />
        </div>
      </section>

      <section className="l-section" id="funkcje">
        <div className="l-section-head">
          <span className="l-kicker">Funkcje</span>
          <h2 className="l-h2">Cztery rzeczy, które naprawdę odciążają admina</h2>
          <p className="l-p">Bez zalewu funkcji, których nikt nie używa — tylko to, co realnie zmniejsza robotę na serwerze.</p>
        </div>
        <div className="l-features">
          {FEATURES.map(f => (
            <div className="l-feature" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-section" id="taryfikator">
        <div className="l-section-head">
          <span className="l-kicker">Taryfikator ostrzeżeń</span>
          <h2 className="l-h2">Ty ustalasz progi. Bot je egzekwuje.</h2>
          <p className="l-p">Dla każdego serwera definiujesz przy ilu ostrzeżeniach ma zajść jaka akcja. Przy nowym warnie bot sprawdza najwyższy próg i wykonuje go sam — bez Twojego udziału.</p>
        </div>
        <div className="l-tariff">
          <TariffLadder steps={WARN_LADDER} />
          <div>
            <TariffLadder steps={XP_LADDER} />
            <div className="l-tariff-example">
              <div>$ /taryfikator dodaj warns:3 action:timeout meta:1h</div>
              <div>$ /taryfikator dodaj warns:5 action:ban</div>
              <div>$ /warn user:@User reason:"Naruszenie regulaminu"</div>
            </div>
          </div>
        </div>
      </section>

      <section className="l-section" id="tickety">
        <div className="l-section-head">
          <span className="l-kicker">Tickety</span>
          <h2 className="l-h2">Wsparcie bez chaosu w DM-ach</h2>
          <p className="l-p">Jeden przycisk na kanale, prywatny kanał dla każdego zgłoszenia, pełny transkrypt po zamknięciu. Zero pytań "kto to ogarnie".</p>
        </div>
        <div className="l-ticket-flow">
          <div className="l-ticket-step">
            <div className="l-ticket-num">01</div>
            <h4>Użytkownik klika</h4>
            <p>Przycisk "Utwórz ticket" pod embedem na wybranym kanale.</p>
          </div>
          <div className="l-ticket-step">
            <div className="l-ticket-num">02</div>
            <h4>Powstaje prywatny kanał</h4>
            <p>Widzi go tylko autor zgłoszenia i rola supportu, którą ustawisz w panelu.</p>
          </div>
          <div className="l-ticket-step">
            <div className="l-ticket-num">03</div>
            <h4>Zamknięcie i transkrypt</h4>
            <p>Po zamknięciu bot zapisuje pełną rozmowę na kanale logów i usuwa kanał.</p>
          </div>
        </div>
      </section>

      <section className="l-section" id="ranking">
        <div className="l-section-head">
          <span className="l-kicker">Poziomy</span>
          <h2 className="l-h2">Aktywność, która się opłaca</h2>
          <p className="l-p">Każda wiadomość dodaje XP. Poziomy odblokowują role-nagrody, które sam skonfigurujesz — a ranking pokazuje, kto jest najbardziej zaangażowany.</p>
        </div>
        <div className="l-lb">
          <div className="l-lb-card">
            {LEADERBOARD_PREVIEW.map(e => (
              <div className="l-lb-row" key={e.rank}>
                <span className="l-lb-rank">#{e.rank}</span>
                <div className="l-lb-avatar" />
                <span className="l-lb-name">{e.name}</span>
                <span className="l-lb-level">poziom {e.level}</span>
              </div>
            ))}
          </div>
          <p className="l-p">Przykładowy widok — <code className="mono">/leaderboard</code> pokazuje top 10 na Twoim serwerze, ten sam ranking widzisz też na żywo w panelu.</p>
        </div>
      </section>

      <section className="l-section">
        <div className="l-section-head">
          <span className="l-kicker">Ekonomia</span>
          <h2 className="l-h2">Wirtualna waluta i sklep</h2>
          <p className="l-p">Praca, dzienne nagrody, sklep serwera i mini-gry — konfigurujesz stawki, walutę i przedmioty prosto z panelu, bez dotykania bazy danych.</p>
        </div>
        <div className="l-economy">
          <div className="l-economy-cmds">
            {ECONOMY_LIVE.map(c => <code key={c}>{c}</code>)}
          </div>
          <span className="l-live-badge">aktywne</span>
        </div>
      </section>

      <section className="l-section" id="komendy">
        <div className="l-section-head">
          <span className="l-kicker">Komendy</span>
          <h2 className="l-h2">Przegląd</h2>
          <p className="l-p">Pełna lista zawsze dostępna przez <code className="mono">/help</code> na serwerze.</p>
        </div>
        <div className="l-commands">
          <div className="l-cmd-group">
            <h4>Publiczne</h4>
            {PUBLIC_COMMANDS.map(([c, d]) => (
              <div className="l-cmd-row" key={c}><code className="mono">{c}</code><span>{d}</span></div>
            ))}
          </div>
          <div className="l-cmd-group">
            <h4>Moderacja</h4>
            {MOD_COMMANDS.map(([c, d]) => (
              <div className="l-cmd-row" key={c}><code className="mono">{c}</code><span>{d}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-section">
        <div className="l-panel-teaser">
          <div>
            <h3>Panel WWW do zarządzania</h3>
            <p>Zaloguj się przez Discord i skonfiguruj XP, tickety i nagrody za poziomy — bez dotykania bazy danych.</p>
            {loading ? null : user ? (
              <Link to="/panel" className="btn btn-primary">Przejdź do panelu</Link>
            ) : (
              <a href="/login" className="btn btn-primary">Zaloguj przez Discord</a>
            )}
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <span>UmenBot · autor GalusGaming · licencja ISC</span>
        <a href="https://github.com/galusgaming/UmenBot" target="_blank" rel="noreferrer">GitHub →</a>
      </footer>
    </div>
  )
}
