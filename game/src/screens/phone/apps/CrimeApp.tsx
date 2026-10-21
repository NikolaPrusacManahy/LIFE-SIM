import { useState } from 'react';
import type { AppProps } from './types';
import type { ProductId } from '../../../state/crime/types';
import { activeCases, detectiveOf, detectiveTrait, DETECTIVE_LABEL } from '../../../state/crime/investigation';
import { TAG_LABEL } from '../../../state/crime/evidence';
import { PROPERTIES, UPGRADES, buyProperty, upgradeProperty, PROPERTY_BY_KIND } from '../../../state/crime/properties';
import { PRODUCTS, CREW_ROLES, crew, expandTerritory, launder, productLock, startBusiness, PRODUCT_BY_ID } from '../../../state/crime/drugs';
import { captives } from '../../../state/crime/captives';
import { darkCrimeOn } from '../../../state/crime/consent';
import { fmt } from '../../../state/systems/finance';
import { PersonChip } from '../../../components/PersonChip';
import { HoldButton } from '../../../components/HoldButton';

/** Update 0.5 — the Crime tab: heat, wanted, rep, cases, crew, properties, business. */
export function CrimeApp({ game, done, openPeople }: AppProps) {
  const [tab, setTab] = useState<'status' | 'spots' | 'biz'>('status');
  const u = game.s.underworld;
  const det = detectiveOf(game);
  const cases = u.cases.filter((c) => c.status === 'open' || c.status === 'cold');
  return (
    <div className="app-stack">
      <div className="app-seg">
        <button className={tab === 'status' ? 'on' : ''} onClick={() => setTab('status')}>Status</button>
        <button className={tab === 'spots' ? 'on' : ''} onClick={() => setTab('spots')}>Properties</button>
        {darkCrimeOn() && <button className={tab === 'biz' ? 'on' : ''} onClick={() => setTab('biz')}>Business</button>}
      </div>

      {tab === 'status' && (
        <>
          <div className="app-box crm-stats">
            <div><small>Heat</small><div className="me-track"><div style={{ width: `${game.s.heat}%`, background: '#ff5d6c' }} /></div></div>
            <div><small>Wanted</small><b className="crm-stars">{'★'.repeat(u.wanted)}<i>{'★'.repeat(5 - u.wanted)}</i></b></div>
            <div><small>Street Rep</small><b>{Math.round(game.s.stats.street)}</b></div>
            <div><small>Dirty cash</small><b>{fmt(u.dirty)}</b></div>
            <div><small>Guilt</small><b>{Math.round(u.guilt)}{game.hasTrait('sociopath') ? ' · 🧊' : ''}</b></div>
          </div>
          {det && (
            <div className="app-box">
              <div className="ph-section">The Detective · {DETECTIVE_LABEL[detectiveTrait(det)]}</div>
              <PersonChip game={game} p={det} onClick={() => openPeople?.(det.id)} />
            </div>
          )}
          <div className="ph-section">Cases ({activeCases(game).length} open)</div>
          {cases.length === 0 && <p className="app-empty">Nobody’s looking at you. Yet.</p>}
          {cases.map((c) => (
            <div key={c.id} className={`crm-case ${c.status}`}>
              <b>{c.name}{c.status === 'cold' ? ' · cold' : ''}</b>
              <small>{c.suspect ? '⚠ You’re a suspect' : 'No suspect named'} · progress {Math.round(c.progress)}%{c.wanted ? ` · ${'★'.repeat(c.wanted)}` : ''}</small>
              {c.board && <small className="crm-board">Evidence board: {c.found.map((t) => TAG_LABEL[t]).join(', ') || 'empty'}</small>}
            </div>
          ))}
          {captives(game).length > 0 && (
            <>
              <div className="ph-section">Holding</div>
              {captives(game).map((p) => <PersonChip key={p.id} game={game} p={p} onClick={() => openPeople?.(p.id)} />)}
            </>
          )}
          {crew(game).length > 0 && (
            <>
              <div className="ph-section">Crew</div>
              {crew(game).map((p) => (
                <div key={p.id} className="crm-crew">
                  <PersonChip game={game} p={p} compact onClick={() => openPeople?.(p.id)} />
                  <small>{CREW_ROLES.find((r) => r.id === p.crewRole)?.icon} {p.crewRole} · loyalty {Math.round(p.loyalty ?? 50)}</small>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {tab === 'spots' && (
        <div className="ph-cards">
          {PROPERTIES.map((d) => {
            const owned = u.properties.find((p) => p.kind === d.kind);
            return (
              <div key={d.kind} className="ph-row">
                <span className="ph-row-icon">{d.icon}</span>
                <span className="ph-row-main">
                  <b>{d.name}</b>
                  <small>{d.uses} · {fmt(d.upkeep)}/mo{owned ? ` · suspicion ${Math.round(owned.suspicion)}` : ''}</small>
                  {owned && (
                    <span className="crm-upg">
                      {UPGRADES.map((x) => (
                        <button key={x.id} className="btn btn-sm" disabled={owned.upgrades.includes(x.id)} title={x.desc} onClick={() => done(upgradeProperty(game, owned, x.id), 'Upgrade', PROPERTY_BY_KIND[owned.kind].icon)}>
                          {owned.upgrades.includes(x.id) ? '✓ ' : ''}{x.name}{owned.upgrades.includes(x.id) ? '' : ` ${fmt(x.price)}`}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
                {!owned && <HoldButton className="btn-sm" disabled={!game.canAfford(d.price) || game.age < 18} onConfirm={() => done(buyProperty(game, d.kind), 'Property', d.icon)}>Hold · {fmt(d.price)}</HoldButton>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'biz' && darkCrimeOn() && (
        <>
          {u.business ? (
            <div className="app-box">
              <b>{PRODUCT_BY_ID[u.business.product].name}</b>
              <p className="app-sub">Quality {Math.round(u.business.quality)} · Territory: {u.business.territories.join(', ')} · last month {fmt(u.business.lastProfit)}</p>
              <div className="ph-pills">
                <button className="btn btn-sm" onClick={() => done(expandTerritory(game), 'Territory', '🗺️')}>Expand territory</button>
                <button className="btn btn-sm" onClick={() => done(launder(game), 'Laundering', '🧺')}>Launder money</button>
              </div>
            </div>
          ) : (
            <div className="ph-cards">
              {PRODUCTS.map((p) => {
                const lock = productLock(game, p.id as ProductId);
                return (
                  <div key={p.id} className={`ph-row ${lock ? 'dim' : ''}`}>
                    <span className="ph-row-icon">📦</span>
                    <span className="ph-row-main"><b>{p.name}</b><small>Street {p.rep}+ · fictional product</small></span>
                    {lock ? <span className="ph-why">{lock}</span> : <button className="btn btn-sm" onClick={() => done(startBusiness(game, p.id as ProductId), 'Business', '📦')}>Start</button>}
                  </div>
                );
              })}
            </div>
          )}
          <p className="app-note">Dirty cash must be laundered through a front business or spending it draws heat.</p>
        </>
      )}
    </div>
  );
}
