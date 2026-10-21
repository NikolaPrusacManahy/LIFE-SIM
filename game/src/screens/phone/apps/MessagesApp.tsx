import { useEffect, useRef, useState } from 'react';
import type { Person } from '../../../state/types';
import { CHAT_POOLS, GROUP_TABS, TABS, chipsFor, groupChips, isGamble, sendChip, sendGroup, tabsFor, threadFor, threadState, unsend, type ChatTab } from '../../../state/phone/chat';
import { MAX_PER_MONTH, answer, contextReplies, pendingMessage, sentThisMonth } from '../../../state/phone/convo';
import { arrived, badgeCount, readThread, unreadIn } from '../../../state/phone/notify';
import { slotLabel } from '../../../state/phone/plans';
import { npcState, stateLabel } from '../../../state/npc/mood';
import { hasPhone } from '../../../state/systems/phone';
import { itemCount } from '../../../state/inventory/items';
import { hasTrait, knowsTrait } from '../../../state/npc/traits';
import { primaryLabel } from '../../../state/npc/labels';
import { PersonChip } from '../../../components/PersonChip';
import { Portrait } from '../../../components/Portrait';
import { sfx } from '../../../ui/audio';
import type { AppProps } from './types';

type Thread = { kind: 'person' | 'group'; id: string };

/** Update 0.5 — messenger. Update 0.8 — contextual replies, both bubbles, inline effects, 10 per contact per month. */
export function MessagesApp({ game, done, openPeople, initialThread }: AppProps) {
  const [thread, setThread] = useState<Thread | null>(initialThread ? { kind: 'person', id: initialThread } : null);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  if (!hasPhone(game)) {
    return (
      <div className="app-stack">
        <button className="btn" onClick={() => openPeople?.()}>👥 Open contacts</button>
        <p className="app-empty">No phone — you can only talk to people in person.</p>
      </div>
    );
  }
  if (thread) return <ChatView game={game} thread={thread} onBack={() => setThread(null)} done={done} openPeople={openPeople} refresh={refresh} />;

  const visible = (id: string) => threadFor(game, id).filter((m) => arrived(game, m.turn));
  const last = (id: string) => visible(id).slice(-1)[0];
  const people = game.s.people.filter((p) => p.hasNumber && (visible(p.id).length || p.alive));
  const sorted = [...people].sort((a, b) => (last(b.id)?.turn ?? -1) - (last(a.id)?.turn ?? -1));
  const unread = badgeCount(game);
  return (
    <div className="app-stack">
      <button className="btn" onClick={() => openPeople?.()}>👥 Contacts {unread ? `· ${unread} unread` : ''}</button>
      {game.s.groups.length > 0 && <div className="ph-section">Group chats</div>}
      {game.s.groups.map((grp) => (
        <button key={grp.id} className={`msg-row ${unreadIn(game, grp.id) ? 'unread' : ''}`} onClick={() => setThread({ kind: 'group', id: grp.id })}>
          <span className="msg-grp">{grp.icon}</span>
          <span className="msg-mid"><b>{grp.name}</b><small>{last(grp.id)?.text || `${grp.members.length} members`}</small></span>
          {unreadIn(game, grp.id) > 0 && <i className="msg-badge">{unreadIn(game, grp.id)}</i>}
        </button>
      ))}
      <div className="ph-section">Chats</div>
      {sorted.length === 0 && <p className="app-empty">No contacts yet. Get some numbers!</p>}
      {sorted.slice(0, 40).map((p) => {
        const n = unreadIn(game, p.id);
        const l = last(p.id);
        const pend = pendingMessage(game, p.id);
        return (
          <button key={p.id} className={`msg-row ${n ? 'unread' : ''}`} onClick={() => setThread({ kind: 'person', id: p.id })}>
            <Portrait look={p.look} age={game.ageOf(p)} size={38} seed={p.id} mood={p.mood} />
            <span className="msg-mid">
              <b>{p.name}{!p.alive ? ' 🕊️' : ''}</b>
              <small>{l ? (l.from === 'me' ? 'You: ' : '') + (l.photo ?? l.text) : primaryLabel(p)}</small>
              {pend && <em className="msg-need">Needs reply{pend.expires !== undefined ? ` · expires ${slotLabel(game, pend.expires)}` : ''}</em>}
            </span>
            {n > 0 && <i className="msg-badge">{n}</i>}
          </button>
        );
      })}
    </div>
  );
}

function ChatView({ game, thread, onBack, done, openPeople, refresh }: { game: AppProps['game']; thread: Thread; onBack: () => void; done: AppProps['done']; openPeople?: AppProps['openPeople']; refresh: () => void }) {
  const isGroup = thread.kind === 'group';
  const p: Person | null = isGroup ? null : game.personById(thread.id);
  const grp = isGroup ? game.s.groups.find((x) => x.id === thread.id) ?? null : null;
  const [tab, setTab] = useState<ChatTab>('greet');
  const [typing, setTyping] = useState(false);
  const [burner, setBurner] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const msgs = threadFor(game, thread.id).filter((m) => arrived(game, m.turn));
  // scroll only the chat log — scrollIntoView also scrolled the zoomed game frame and showed a dark screen
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [msgs.length, typing]);
  useEffect(() => readThread(game, thread.id), [game, thread.id, msgs.length]);

  const state = p ? threadState(game, p) : 'open';
  const mood = p ? npcState(game, p) : null;
  const tabs: ChatTab[] = p ? tabsFor(game, p) : GROUP_TABS;
  const activeTab = tabs.includes(tab) ? tab : tabs[0];
  const chips = p ? chipsFor(game, p, activeTab) : groupChips(activeTab).map((chip) => ({ chip, odds: 0.7, reason: null as string | null }));
  const sent = sentThisMonth(game, thread.id);
  const full = sent >= MAX_PER_MONTH;
  const pend = p ? pendingMessage(game, p.id) : null;
  const ctx = p && pend ? contextReplies(game, p, pend) : [];

  const after = (r: { error?: string; reply: string | null; delay: number; note?: string }, photo = false) => {
    if (r.error) { setNote(r.error); return; }
    sfx(photo ? 'camera' : 'message');
    setNote(r.note ?? null);
    done('', '', '');
    if (r.delay && r.reply !== null) {
      setTyping(true);
      setTimeout(() => { setTyping(false); sfx('message'); refresh(); }, Math.min(1400, r.delay));
    }
    refresh();
  };
  const send = (chipId: string) => {
    const chip = chips.find((c) => c.chip.id === chipId)?.chip;
    after(isGroup ? sendGroup(game, thread.id, chipId) : sendChip(game, thread.id, chipId, burner), !!chip?.photo);
  };
  const reply = (replyId: string) => {
    if (!p || !pend) return;
    after(answer(game, p.id, pend.id, replyId));
  };
  const name = (id: string) => (id === 'me' ? 'You' : game.personById(id)?.name ?? '');
  const lastMine = [...msgs].reverse().find((m) => m.from === 'me');
  const status = mood ? stateLabel(mood) : null;
  const ended = msgs[msgs.length - 1]?.kind === 'closing';
  // hide the "typing" bubble's real message until it lands
  const shown = typing ? msgs.slice(0, msgs.length - 1) : msgs;

  return (
    <div className="cht-wrap">
      <div className="cht-head">
        <button className="app-back" onClick={onBack}>‹</button>
        {p ? <PersonChip game={game} p={p} compact onClick={() => openPeople?.(p.id)} /> : <b className="cht-gname">{grp?.icon} {grp?.name}</b>}
        {p && (
          <span className="cht-mini">
            <i style={{ width: `${p.rel}%` }} className="f" />
            <i style={{ width: `${p.romance}%` }} className="r" />
            <small>{knowsTrait(p, 'nightowl') ? 'last seen 3:12 am' : knowsTrait(p, 'earlybird') ? 'last seen 5:40 am' : 'last seen recently'}</small>
          </span>
        )}
      </div>
      {status && <div className={`cht-status ${mood?.mood}`}>{status}</div>}
      <div className="cht-log" ref={log}>
        {shown.map((m) => {
          const mine = m.from === 'me';
          return (
            <div key={m.id} className={`cht-row ${mine ? 'me' : ''}`}>
              {isGroup && !mine && <small className="cht-from">{name(m.from)}</small>}
              <div className={`cht-bub ${mine ? 'me' : ''} ${m.photo ? 'photo' : ''} ${m.kind === 'expired' || m.kind === 'closing' ? 'soft' : ''}`}>
                {m.photo ? <span className="cht-photo">{m.photo}</span> : m.text}
                {m.burner && <i className="cht-burner">📵</i>}
                {m.reaction && <i className="cht-react">{m.reaction}</i>}
              </div>
              {m.effects && <small className="cht-fx">{m.effects}</small>}
            </div>
          );
        })}
        {typing && <div className="cht-row"><div className="cht-bub cht-typing"><i /><i /><i /></div></div>}
        {lastMine && !typing && <small className="cht-receipt">{lastMine.read ? 'Read' : 'Delivered'}</small>}
        {ended && !pend && <small className="cht-ended">Conversation ended</small>}
      </div>
      {note && <div className="app-msg" onClick={() => setNote(null)}>{note}</div>}
      {state !== 'open' ? (
        <div className="cht-closed">
          {state === 'dead' && <button className="btn btn-sm" onClick={() => { game.stat('mood', -4); game.setFlag(`closure:${thread.id}`); done('You read their last messages. It hurt. It also helped.', 'Old messages', '🕊️'); }}>🕊️ Read old messages</button>}
          {state === 'jail' && <small>They’re in jail. They can call collect.</small>}
          {state === 'captive' && <small>They can’t answer.</small>}
          {state === 'blocked' && <small>You can’t message them.</small>}
        </div>
      ) : (
        <div className="cht-composer" data-sfx="none">
          {pend && ctx.length > 0 && (
            <div className="cht-ctx">
              <small className="cht-ctx-label">Reply to: “{pend.text.slice(0, 48)}”{pend.free ? ' · free reply' : ''}</small>
              <div className="cht-chipgrid">
                {ctx.map(({ reply: r, reason, odds }) => (
                  <button key={r.id} className="cht-chip ctx" disabled={!!reason || typing || (full && !pend.free)} title={reason ?? ''} onClick={() => reply(r.id)}>
                    <span>{r.label}</span>
                    {(reason || odds !== null) && <small>{reason ?? `${Math.round(odds! * 100)}%`}</small>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="cht-tabs">
            {TABS.filter((t) => tabs.includes(t.id)).map((t) => (
              <button key={t.id} className={`${t.id === activeTab ? 'on' : ''} ${t.id === 'intimate' || t.id === 'underworld' ? 'dark' : ''}`} onClick={() => setTab(t.id)} title={t.label}>{t.icon}</button>
            ))}
          </div>
          <div className="cht-chipgrid">
            {chips.map(({ chip, odds, reason }) => {
              const gamble = isGamble(chip);
              return (
                <button key={chip.id} className={`cht-chip ${CHAT_POOLS[chip.pool]?.mature || chip.tab === 'underworld' ? 'hot' : ''}`} disabled={!!reason || full || typing} title={reason ?? ''} onClick={() => send(chip.id)}>
                  <span>{chip.label}</span>
                  {(reason || gamble || chip.risk) && <small>{reason ?? [gamble ? `${Math.round(odds * 100)}%` : '', chip.risk ?? ''].filter(Boolean).join(' · ')}</small>}
                </button>
              );
            })}
            {chips.length === 0 && <small className="app-note">Nothing to say here.</small>}
          </div>
          <div className="cht-foot">
            <small className={full ? 'cht-full' : ''}>{sent}/{MAX_PER_MONTH} this month</small>
            {!isGroup && itemCount(game, 'burner') > 0 && activeTab === 'underworld' && (
              <label className="cht-burnertog"><input type="checkbox" checked={burner} onChange={(e) => setBurner(e.target.checked)} /> 📵 Burner</label>
            )}
            {!isGroup && lastMine && <button className="btn btn-sm btn-ghost" onClick={() => { setNote(unsend(game, thread.id)); refresh(); }}>Unsend</button>}
            {p && hasTrait(p, 'clingy') && <small>⚡ replies fast</small>}
          </div>
        </div>
      )}
    </div>
  );
}
