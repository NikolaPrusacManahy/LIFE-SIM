import { useState } from 'react';
import type { DeskProps } from './types';
import type { SiteDef, WebAction } from '../../state/web/types';
import { SITES, SITE_BY_ID, actionLock, sessionDo, siteLock, siteVisible, webAct } from '../../state/web/sites';
import { applyJob, visibleCareers } from '../../state/systems/career';
import { forecast } from '../../state/web/social';
import { FRIEND_ACTIONS, claimedAge, isVerified, onlineFriends } from '../../state/web/discorb';
import { AppView } from '../phone/apps';
import { NileView, PartPickerView } from './Shop';
import { fmt } from '../../state/systems/finance';

/** Update 0.8 — the browser: bookmarks bar + one page at a time. */
export function Browser(props: DeskProps & { site?: string }) {
  const { game } = props;
  const [siteId, setSite] = useState(props.site ?? 'jobhunt');
  const site = SITE_BY_ID[siteId] ?? SITES[0];
  const lock = siteLock(game, site);
  const visible = SITES.filter((s) => siteVisible(game, s));
  return (
    <div className="brw-wrap">
      <div className="brw-bar">
        <span className="brw-url">🔒 www.{site.id}.com</span>
      </div>
      <div className="brw-main">
        <div className="brw-marks">
          {visible.map((s) => (
            <button key={s.id} className={`brw-mark ${s.id === site.id ? 'on' : ''}`} onClick={() => setSite(s.id)} title={siteLock(game, s) ?? s.tagline}>
              <span>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
        <div className="brw-page">
          <div className="brw-hero" style={{ background: site.color }}>
            <b>{site.icon} {site.name}</b>
            <small>{site.tagline}</small>
          </div>
          {lock ? <p className="brw-locked">🔒 {lock}</p> : <SitePage {...props} site={site} />}
        </div>
      </div>
    </div>
  );
}

function ActionList({ game, notify, site, actions, arg }: DeskProps & { site: SiteDef; actions: WebAction[]; arg?: string }) {
  return (
    <div className="brw-actions">
      {actions.map((a) => {
        const lock = actionLock(game, a);
        return (
          <button key={a.id} className="brw-act" disabled={!!lock} title={lock ?? ''} onClick={() => notify(webAct(game, site.id, a.id, arg))}>
            <span>{a.icon}</span>
            <b>{a.label}</b>
            <small>{lock ?? `${a.desc}${a.free ? ' · free' : ''}`}</small>
          </button>
        );
      })}
    </div>
  );
}

function SitePage(props: DeskProps & { site: SiteDef }) {
  const { game, site, notify, host } = props;
  switch (site.view) {
    case 'jobs':
      return (
        <>
          <ActionList {...props} actions={site.actions} />
          <div className="brw-list">
            {visibleCareers(game).slice(0, 14).map(({ c, st }) => (
              <div key={c.id} className="brw-row">
                <span>{c.icon}</span>
                <span className="brw-mid"><b>{c.levels[0].title}</b><small>{c.place} · {fmt(c.levels[0].pay)}/mo</small></span>
                <button className="btn btn-sm" disabled={!st.ok || game.s.job?.careerId === c.id} title={st.reason ?? ''} onClick={() => notify(sessionDo(game, () => applyJob(game, c.id).text))}>
                  {st.ok ? `Apply · ${Math.round(st.chance * 100)}%` : st.reason}
                </button>
              </div>
            ))}
          </div>
        </>
      );
    case 'shop':
      return <NileView {...props} dark={false} />;
    case 'onion':
      return <NileView {...props} dark />;
    case 'partpicker':
      return <PartPickerView {...props} />;
    case 'weather':
      return (
        <>
          <p className="brw-big">{forecast(game)}</p>
          <ActionList {...props} actions={site.actions} />
        </>
      );
    case 'news':
      return (
        <div className="brw-list">
          {game.s.underworld.news && <div className="brw-news hot">🔴 {game.s.underworld.news.text}</div>}
          {game.s.fame >= 20 && <div className="brw-news">⭐ Local celebrity {game.s.name} {game.s.familyName} spotted downtown</div>}
          <div className="brw-news">📈 Markets {game.s.clock % 3 === 0 ? 'down 1.2%' : 'up 0.8%'} on mixed signals</div>
          {game.s.log.filter((l) => l.kind === 'milestone').slice(0, 4).map((l, i) => <div key={i} className="brw-news">🗞️ {l.text.replace(/^[^\w]+/, '')}</div>)}
        </div>
      );
    case 'discorb': {
      const friends = onlineFriends(game);
      return (
        <>
          <ActionList {...props} actions={site.actions} />
          <div className="ph-section">Online friends</div>
          {friends.length === 0 && <p className="app-empty">Nobody yet — hang out in a room.</p>}
          {friends.map((p) => (
            <div key={p.id} className="brw-friend">
              <b>{p.name} · {isVerified(p) ? `${game.ageOf(p)} ✔` : `says ${claimedAge(game, p)}`}</b>
              <ActionList {...props} actions={FRIEND_ACTIONS.filter((a) => a.id !== 'meet' || !isVerified(p))} arg={p.id} />
            </div>
          ))}
        </>
      );
    }
    case 'dating':
      return <div className="brw-embed"><AppView id="dating" host={host} /></div>;
    case 'bank':
      return <div className="brw-embed"><AppView id="bank" host={host} /></div>;
    case 'spicy':
      return (
        <>
          <div className="brw-spicy"><span>18+ content — blurred</span></div>
          <ActionList {...props} actions={site.actions} />
        </>
      );
    default:
      return <ActionList {...props} actions={site.actions} />;
  }
}
