import { useMemo, useState } from 'react';
import type { ActionResult, Game } from '../../state/Game';
import type { Person } from '../../state/types';
import { Modal } from '../../components/Modal';
import { Portrait } from '../../components/Portrait';
import { PersonChip } from '../../components/PersonChip';
import { GENDER_SYMBOL, SEXUALITY_LABEL } from '../../state/npc/identity';
import { allLabels, contactGroup, GROUP_ORDER } from '../../state/npc/labels';
import { NPC_TRAIT_BY_ID } from '../../state/npc/traits';
import { ARCHETYPE_BY_ID } from '../../state/npc/generator';
import { GROUP_ICON, doInteraction, interactionsFor, usesSlot, type InteractionGroup, type ResolvedInteraction } from '../../state/npc/interactions';
import { hasPhone } from '../../state/systems/phone';
import { MONTHS } from '../../state/types';
import { WebView } from './WebView';
import { PERSONA, personaShown } from '../../state/npc/persona';
import { inHospital, isDepressed } from '../../state/systems/shy';

interface Props {
  game: Game;
  onClose: () => void;
  onResult: (r: ActionResult, card?: boolean) => void;
  /** Update 0.8 — texting lives in the phone: open this person's chat */
  onOpenChat?: (pid: string) => void;
  initial?: string | null;
}

const BARS: [keyof Person, string, string][] = [
  ['rel', 'Friendship', '#3cbfc4'],
  ['romance', 'Romance', '#ff5c8a'],
  ['trust', 'Trust', '#8b72f5'],
  ['respect', 'Respect', '#f5b53a'],
  ['rivalry', 'Rivalry', '#ff5d6c'],
];

/** Update 0.4 — contacts on the left, profile on the right, relationship web tab. */
export function PeopleScreen({ game, onClose, onResult, onOpenChat, initial = null }: Props) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'contacts' | 'web'>('contacts');
  const [sel, setSel] = useState<string | null>(initial);
  const [pending, setPending] = useState<ResolvedInteraction | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const people = game.s.people.filter((p) => p.status !== 'moved' || p.role === 'mother' || p.role === 'father');
  const groups = useMemo(() => {
    const m = new Map<string, Person[]>();
    for (const p of people.filter((x) => `${x.name} ${x.surname}`.toLowerCase().includes(q.toLowerCase()))) {
      const k = contactGroup(p);
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return GROUP_ORDER.filter((k) => m.has(k)).map((k) => [k, m.get(k)!] as const);
  }, [people, q]);
  const p = game.personById(sel ?? '') ?? groups[0]?.[1][0] ?? null;

  const doIt = (ri: ResolvedInteraction, opt?: string) => {
    if (!p) return;
    setPending(null);
    const r = doInteraction(game, p.id, ri.def.id, opt);
    if (r) {
      onResult(r);
      setNote(r.text);
      if (game.currentEvent) onClose();
    }
  };
  const free = (fn: () => string) => {
    const msg = fn();
    onResult(game.flush('', '', ''), false);
    setNote(msg);
  };

  const list = p ? interactionsFor(game, p) : [];
  const byGroup = new Map<InteractionGroup, ResolvedInteraction[]>();
  for (const ri of list) byGroup.set(ri.def.group, [...(byGroup.get(ri.def.group) ?? []), ri]);

  return (
    <Modal onClose={onClose} wide className="ppl-screen">
      <div className="ppl-tabs">
        <button className={tab === 'contacts' ? 'on' : ''} onClick={() => setTab('contacts')}>👥 Contacts</button>
        <button className={tab === 'web' ? 'on' : ''} onClick={() => setTab('web')}>🕸️ Relationship web</button>
      </div>
      {tab === 'web' ? (
        <WebView game={game} onPick={(id) => { setSel(id); setTab('contacts'); }} />
      ) : (
        <div className="ppl-layout">
          <aside className="ppl-side">
            <input className="ppl-search" placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="ppl-groups">
              {groups.map(([k, ps]) => (
                <div key={k}>
                  <div className="hud-label ppl-group">{k}</div>
                  {ps.map((x) => (
                    <div key={x.id} className={`ppl-row ${p?.id === x.id ? 'on' : ''}`}>
                      <PersonChip game={game} p={x} onClick={() => { setSel(x.id); setNote(null); setPending(null); }} />
                    </div>
                  ))}
                </div>
              ))}
              {groups.length === 0 && <p className="app-empty">No one yet. Go out and meet people!</p>}
            </div>
          </aside>
          {p && (
            <section className="ppl-profile">
              <div className="ppl-head">
                <Portrait look={p.look} age={game.ageOf(p)} size={86} seed={p.id} mood={p.mood} />
                <div>
                  <h3>{p.name} {p.surname}</h3>
                  <div className="ppl-chips">
                    <span>{GENDER_SYMBOL[p.gender]} {p.pronouns.label}</span>
                    <span>Age {game.ageOf(p)}</span>
                    {allLabels(p).map((l) => <span key={l} className="lbl">{l}</span>)}
                    <span>{ARCHETYPE_BY_ID[p.archetype]?.name}</span>
                    {(p.trust >= 60 || p.tags.includes('bestie')) && <span>{SEXUALITY_LABEL[p.sexuality]}</span>}
                    {p.status !== 'alive' && <span className="warn">{p.status === 'dead' ? 'Passed away' : p.status === 'jail' ? 'In jail' : 'Moved away'}</span>}
                  </div>
                  <small className="ppl-met">Met {p.met}{p.where ? ` · ${p.where}` : ''}{p.subject ? ` · ${p.subject}` : ''}</small>
                </div>
              </div>
              <div className="ppl-bars">
                {BARS.map(([k, label, color]) => (
                  <div key={k} className="ppl-bar">
                    <small>{label}</small>
                    <div className="me-track"><div style={{ width: `${p[k] as number}%`, background: color }} /></div>
                    <b>{Math.round(p[k] as number)}</b>
                  </div>
                ))}
              </div>
              <div className="ppl-traits">
                {p.persona && <span className={`psn-chip psn-${p.persona === 'yandere' ? 'hidden' : p.persona}`} title={p.persona === 'yandere' ? 'Maybe a bit passionate' : PERSONA[p.persona].desc}>{personaShown(p)}</span>}
                {p.tags.includes('stunning') && <span className="psn-chip psn-stun">✨ Stunning</span>}
                {p.tags.includes('loveAtFirstSight') && <span className="psn-chip">💘 Love at first sight</span>}
                {inHospital(game, p) && <span className="psn-chip">🏥 In hospital</span>}
                {isDepressed(game, p) && <span className="psn-chip">🌧️ Heartbroken</span>}
                {p.traits.map((t) => {
                  const d = NPC_TRAIT_BY_ID[t.id];
                  return t.revealed ? (
                    <span key={t.id} className="trt-chip" title={d?.desc}>{d?.icon} {d?.name}</span>
                  ) : (
                    <span key={t.id} className="trt-chip unk" title="Spend time together to find out">
                      <i style={{ background: `conic-gradient(var(--pink) ${t.progress * 3.6}deg, #ece8f3 0)` }} />?
                    </span>
                  );
                })}
              </div>
              {p.memory.length > 0 && (
                <div className="ppl-memory">
                  {p.memory.slice(0, 4).map((m, i) => <span key={i} className={`mem-${m.tone}`}>{m.text} ({MONTHS[((m.clock % 12) + 12) % 12]} {game.s.startYear + Math.floor(m.clock / 12)})</span>)}
                </div>
              )}
              {note && <div className="app-msg" onClick={() => setNote(null)}>{note}</div>}
              {pending && (
                <div className="ppl-opts">
                  <b>{pending.def.icon} {pending.def.label}:</b>
                  {pending.options!.map((o) => (
                    <button key={o.id} className="btn btn-sm" disabled={!!o.reason} title={o.reason ?? ''} onClick={() => doIt(pending, o.id)}>{o.label}</button>
                  ))}
                  <button className="btn btn-sm btn-ghost" onClick={() => setPending(null)}>Cancel</button>
                </div>
              )}
              <div className="ppl-actions-grid">
                {[...byGroup.entries()].map(([grp, items]) => (
                  <div key={grp} className="ppl-act-group">
                    <div className="hud-label">{GROUP_ICON[grp]} {grp}</div>
                    <div className="ppl-act-list">
                      {items.map((ri) => (
                        <button key={ri.def.id} className="ppl-act" disabled={!ri.ok} title={ri.reason ?? ''} onClick={() => (ri.options ? setPending(ri) : doIt(ri))}>
                          <span>{ri.def.icon}</span>
                          <b>{ri.def.label}{usesSlot(ri.def) ? ' ⏱' : ''}</b>
                          {ri.reason && <small>{ri.reason}</small>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ppl-phone">
                {p.hasNumber && hasPhone(game) && onOpenChat && <button className="btn btn-sm btn-primary" onClick={() => onOpenChat(p.id)}>💬 Open chat</button>}
                {p.hasNumber && <button className="btn btn-sm" onClick={() => free(() => { p.blocked = !p.blocked; return p.blocked ? `Blocked ${p.name}.` : `Unblocked ${p.name}.`; })}>{p.blocked ? 'Unblock' : '🚫 Block'}</button>}
                {p.hasNumber && <button className="btn btn-sm btn-ghost" onClick={() => free(() => { p.hasNumber = false; return `Deleted ${p.name}’s number.`; })}>Delete number</button>}
                <small>Most actions are free, once per time of day. ⏱ = uses the time slot.</small>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
