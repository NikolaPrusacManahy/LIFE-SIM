import { useState } from 'react';
import type { DeskProps } from '../types';
import type { Appeal, IdeaId, SkillBranch } from '../../../state/startup/types';
import { APPEAL, BUILDINGS, IDEAS, IDEA_ORDER, ROUNDS, SKILLS, SKILL_ORDER, STATUS, STATUS_ORDER, STATUS_POINTS, skillCost } from '../../../state/startup/data';
import {
  MARKETING, capOf, costsOf, crunch, found, foundLock, headcount, hire, hireLock, investOwn, launch, layOff, learnSkill, marketing, nextBuilding,
  outputOf, payYourself, pitch, pitchLock, pitchOdds, sellCompany, startup, upgradeBuilding, valuationOf, wagesOf, productRevenue, staffSales, type HireKind,
} from '../../../state/startup/company';
import { energyDo } from '../../../state/web/sites';
import { fmt } from '../../../state/systems/finance';
import { HoldButton } from '../../../components/HoldButton';
import { HQView } from './HQView';

type Tab = 'overview' | 'product' | 'team' | 'money' | 'upgrades';

/** Update 0.11 — START-UP: a tycoon app on the Doors desktop. Every management move is one computer action. */
export function StartupApp(props: DeskProps) {
  const { game, notify } = props;
  const c = startup(game);
  const [tab, setTab] = useState<Tab>('overview');
  const act = (fn: () => string) => notify(energyDo(game, fn));
  if (!c) return <Founding {...props} />;
  const val = valuationOf(c);
  const next = nextBuilding(c);
  return (
    <div className="sup-wrap">
      <div className="sup-left">
        <HQView c={c} />
        <div className="sup-status">
          {STATUS_ORDER.map((s) => (
            <span key={s} className={`sup-rank ${STATUS_ORDER.indexOf(s) <= STATUS_ORDER.indexOf(c.status) ? 'on' : ''}`} title={`${STATUS[s].name}: ${fmt(STATUS[s].at)}${s === 'diplomatic' ? ' + skyscraper' : ''}`}>
              {STATUS[s].icon}
            </span>
          ))}
          <b>{STATUS[c.status].name}{c.status === 'diplomatic' ? ' · immunity' : ''}</b>
        </div>
      </div>
      <div className="sup-right">
        <div className="sup-tabs">
          {(['overview', 'product', 'team', 'money', 'upgrades'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'upgrades' && c.points ? `upgrades (${c.points})` : t}</button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className="sup-grid">
            <Stat label="Company cash" value={fmt(c.cash)} bad={c.cash < 0} />
            <Stat label="Valuation" value={fmt(val)} />
            <Stat label="Your share" value={`${(c.stake * 100).toFixed(1)}% · ${fmt(val * c.stake)}`} />
            <Stat label="Revenue / mo" value={fmt(c.revenue)} sub={c.version ? `📦 ${fmt(productRevenue(c))} · 👥 ${fmt(staffSales(c))}` : undefined} />
            <Stat label="Costs / mo" value={fmt(costsOf(c))} />
            <Stat label="Last month" value={`${c.profit >= 0 ? '+' : ''}${fmt(c.profit)}`} bad={c.profit < 0} />
            <Stat label="Paid to you (total)" value={fmt(c.paid ?? 0)} />
            <p className="app-note">💼 Profitable months pay you a dividend: 25% of profit × your share, taxed 25%.</p>
            <Bar label="Hype" v={c.hype} color="#ff5c8a" />
            <Bar label={`Next version (v${c.version + 1}) · +${outputOf(c)}%/mo`} v={c.progress} color="#3aa8e6" />
            <Bar label="Quality" v={c.quality} color="#3fbf74" />
            {c.redMonths > 0 && <p className="sup-warn">⚠ In the red {c.redMonths}/3 months — then it folds.</p>}
          </div>
        )}
        {tab === 'product' && (
          <div className="sup-list">
            <Row icon="☕" title="Crunch (work all night)" sub="Development + · Energy −" lock={c.progress >= 100 ? 'Ready to launch' : null} onClick={() => act(() => crunch(game))} />
            <Row icon="🎉" title={`Launch v${c.version + 1}`} sub="Revenue starts · hype + · skill point" lock={c.progress < 100 ? `${Math.round(c.progress)}% done` : null} onClick={() => act(() => launch(game))} />
            <div className="ph-section">Marketing</div>
            {MARKETING.map((m) => (
              <Row key={m.id} icon={m.icon} title={`${m.name} (${fmt(m.cost)})`} sub={`Hype +${m.hype} (less when already hyped)`} lock={c.cash < m.cost ? 'Company can’t afford it' : null} onClick={() => act(() => marketing(game, m.id))} />
            ))}
          </div>
        )}
        {tab === 'team' && (
          <div className="sup-list">
            <p className="app-note">{headcount(c)}/{capOf(c)} staff · payroll {fmt(wagesOf(c))}/mo</p>
            {([['employee', 1, '👩‍💻 Hire 1 employee'], ['employee', 5, '👩‍💻 Hire 5 employees'], ['employee', 25, '👩‍💻 Hire 25 employees'], ['supervisor', 1, '🧑‍🏫 Hire a supervisor'], ['manager', 1, '🧑‍💼 Hire a manager'], ['hr', 1, '🗂️ Hire a head of HR']] as [HireKind, number, string][]).map(([k, n, label]) => (
              <Row key={label} icon="" title={label} sub={k === 'employee' ? '$4k/mo each · development +' : k === 'supervisor' ? '$7k/mo · quality + · dev +' : k === 'manager' ? '$12k/mo · dev +20%, quality +' : '$8k/mo · wages −5%'} lock={hireLock(c, k, n)} onClick={() => act(() => hire(game, k, n))} />
            ))}
            <p className="app-note">👩‍💻 {c.staff.employees} · 🧑‍🏫 {c.staff.supervisors} · 🧑‍💼 {c.staff.manager ? 1 : 0} · 🗂️ {c.staff.hr ? 1 : 0}</p>
            {c.staff.employees > 0 && <Row icon="📦" title="Lay off 5" sub="Saves wages · hype −" lock={null} onClick={() => act(() => layOff(game, 5))} />}
          </div>
        )}
        {tab === 'money' && (
          <div className="sup-list">
            <div className="ph-section">Pitch investors (they take a share)</div>
            {ROUNDS.map((r) => {
              const lock = pitchLock(game, r.id);
              return <Row key={r.id} icon={r.icon} title={`${r.name} · ${fmt(r.min)}–${fmt(r.max)}`} sub={lock ?? `${Math.round(pitchOdds(game, c) * 100)}% they say yes`} lock={lock} onClick={() => act(() => pitch(game, r.id))} />;
            })}
            <div className="ph-section">Your money</div>
            {[10000, 100000, 1000000].map((a) => <Row key={a} icon="💸" title={`Invest ${fmt(a)} of your own`} sub={`You have ${fmt(game.s.money)}`} lock={game.canAfford(a) ? null : 'Not enough'} onClick={() => act(() => investOwn(game, a))} />)}
            {[5000, 50000, 500000].map((a) => <Row key={a} icon="🏦" title={`Pay yourself ${fmt(a)}`} sub="25% tax · big payouts worry investors" lock={c.cash >= a ? null : 'Company can’t spare it'} onClick={() => act(() => payYourself(game, a))} />)}
            {c.investors.length > 0 && <p className="app-note">Investors: {c.investors.map((i) => `${i.name} (${(i.stake * 100).toFixed(1)}%)`).join(' · ')}</p>}
            <HoldButton className="btn-sm" onConfirm={() => notify(sellCompany(game))}>Hold to sell the company — your share {fmt(val * c.stake)}</HoldButton>
          </div>
        )}
        {tab === 'upgrades' && (
          <div className="sup-list">
            <div className="ph-section">Building · {BUILDINGS[c.building].icon} {BUILDINGS[c.building].name}</div>
            {next ? (
              <Row icon={BUILDINGS[next].icon} title={`Move to a ${BUILDINGS[next].name.toLowerCase()} (${fmt(BUILDINGS[next].upgrade)})`} sub={`${BUILDINGS[next].cap} staff · rent ${fmt(BUILDINGS[next].rent)}/mo · skill point`} lock={c.cash < BUILDINGS[next].upgrade ? 'Company can’t afford it' : null} onClick={() => act(() => upgradeBuilding(game))} />
            ) : <p className="app-note">🌆 The top of the skyline.</p>}
            <div className="ph-section">Skill tree · {c.points} point{c.points === 1 ? '' : 's'}</div>
            <div className="sup-skills">
              {SKILL_ORDER.map((b: SkillBranch) => (
                <button key={b} className="sup-skill" disabled={c.skills[b] >= SKILLS[b].max || c.points < skillCost(c.skills[b])} title={c.skills[b] >= SKILLS[b].max ? 'Maxed' : `Next level: ${skillCost(c.skills[b])} point${skillCost(c.skills[b]) > 1 ? 's' : ''}`} onClick={() => notify(learnSkill(game, b))}>
                  <span>{SKILLS[b].icon}</span>
                  <b>{SKILLS[b].name}</b>
                  <small>{SKILLS[b].per}</small>
                  <i>{'●'.repeat(c.skills[b])}{'○'.repeat(SKILLS[b].max - c.skills[b])}</i>
                  {c.skills[b] < SKILLS[b].max && <em className="sup-cost">{skillCost(c.skills[b])} pt</em>}
                </button>
              ))}
            </div>
            <p className="app-note">Points: each launch, each move to a bigger building, every 6 profitable months, +{STATUS_POINTS} per new status. Levels 4–5 cost 2 points.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Founding({ game, notify }: DeskProps) {
  const [name, setName] = useState('');
  const [idea, setIdea] = useState<IdeaId>('social');
  const [appeal, setAppeal] = useState<Appeal>('normal');
  const [invest, setInvest] = useState(IDEAS.social.found);
  const lock = foundLock(game, idea, invest);
  return (
    <div className="sup-found">
      <h3>🚀 START-UP — found your company</h3>
      <input className="sup-name" placeholder={`${IDEAS[idea].name} Inc.`} value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
      <div className="sup-ideas">
        {IDEA_ORDER.map((id) => (
          <button key={id} className={`sup-idea ${idea === id ? 'on' : ''}`} onClick={() => { setIdea(id); setInvest(Math.max(invest, IDEAS[id].found)); }}>
            <span>{IDEAS[id].icon}</span>
            <b>{IDEAS[id].name}</b>
            <small>{IDEAS[id].desc} From {fmt(IDEAS[id].found)}.</small>
          </button>
        ))}
      </div>
      <div className="ph-section">How easily does it appeal to investors?</div>
      <div className="sup-appeal">
        {(Object.keys(APPEAL) as Appeal[]).map((a) => (
          <button key={a} className={appeal === a ? 'on' : ''} onClick={() => setAppeal(a)}><b>{APPEAL[a].name}</b><small>{APPEAL[a].desc}</small></button>
        ))}
      </div>
      <label className="sup-invest">
        Your starting investment: <b>{fmt(invest)}</b>
        <input type="range" min={IDEAS[idea].found} max={Math.max(IDEAS[idea].found, Math.min(game.s.money, IDEAS[idea].found * 20))} step={1000} value={invest} onChange={(e) => setInvest(Number(e.target.value))} />
      </label>
      <button className="btn btn-primary" disabled={!!lock} title={lock ?? ''} onClick={() => notify(energyDo(game, () => found(game, name, idea, appeal, invest)))}>{lock ?? 'Found it (1 action)'}</button>
    </div>
  );
}

const Stat = ({ label, value, bad, sub }: { label: string; value: string; bad?: boolean; sub?: string }) => (
  <div className={`sup-stat ${bad ? 'bad' : ''}`}><small>{label}</small><b>{value}</b>{sub && <em className="sup-sub">{sub}</em>}</div>
);
const Bar = ({ label, v, color }: { label: string; v: number; color: string }) => (
  <div className="sup-bar"><small>{label}</small><i><em style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: color }} /></i></div>
);
const Row = ({ icon, title, sub, lock, onClick }: { icon: string; title: string; sub: string; lock: string | null; onClick: () => void }) => (
  <button className="sup-row" disabled={!!lock} title={lock ?? ''} onClick={onClick}>
    {icon && <span>{icon}</span>}
    <span className="sup-row-mid"><b>{title}</b><small>{lock ?? sub}</small></span>
  </button>
);
