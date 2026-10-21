import { useEffect, useRef, useState } from 'react';
import type { Person } from '../../../state/types';
import { REPLIES, reply, unreadCount } from '../../../state/phone/texts';
import { CHAT_POOLS, CHIP_BY_ID, GROUP_TABS, MAX_PER_SLOT, TABS, chipsFor, groupChips, sendChip, sendGroup, sentThisSlot, tabsFor, threadFor, threadState, unsend, type ChatTab } from '../../../state/phone/chat';
import { hasPhone } from '../../../state/systems/phone';
import { itemCount } from '../../../state/inventory/items';
import { hasTrait, knowsTrait } from '../../../state/npc/traits';
import { primaryLabel } from '../../../state/npc/labels';
import { PersonChip } from '../../../components/PersonChip';
import { Portrait } from '../../../components/Portrait';
import type { AppProps } from './types';
import { sfx } from '../../../ui/audio';

type Thread = { kind: 'person' | 'group'; id: string };

/** Update 0.5 — real messenger: inbox → chat view with bubbles and a chip composer. Texting is free (3 per chat per slot). */
export function MessagesApp({ game, done, openPeople }: AppProps) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const phone = hasPhone(game);
  if (!phone) {
    return (
      <div className="app-stack">
        <button className="btn" onClick={() => openPeople?.()}>👥 Open contacts</button>
        <p className="app-empty">No phone — you can only talk to people in person.</p>
      </div>
    );
  }
  if (thread) return <ChatView game={game} thread={thread} onBack={() => setThread(null)} done={done} openPeople={openPeople} refresh={refresh} />;

  const people = game.s.people.filter((p) => p.hasNumber && (threadFor(game, p.id).length || game.s.inbox.some((m) => m.pid === p.id) || p.alive));
  const last = (id: string) => threadFor(game, id).slice(-1)[0];
  const sorted = [...people].sort((a, b) => (last(b.id)?.turn ?? -1) - (last(a.id)?.turn ?? -1));
  return (
    <div className="app-stack">
      <button className="btn" onClick={() => openPeople?.()}>👥 Contacts {unreadCount(game) ? `· ${unreadCount(game)} new` : ''}</button>
      {game.s.groups.length > 0 && <div className="ph-section">Group chats</div>}
      {game.s.groups.map((grp) => (
        <button key={grp.id} className="msg-row" onClick={() => setThread({ kind: 'group', id: grp.id })}>
          <span className="msg-grp">{grp.icon}</span>
          <span className="msg-mid"><b>{grp.name}</b><small>{last(grp.id)?.text || `${grp.members.length} members`}</small></span>
        </button>
      ))}
      <div className="ph-section">Chats</div>
      {sorted.length === 0 && <p className="app-empty">No contacts yet. Get some numbers!</p>}
      {sorted.slice(0, 40).map((p) => {
        const unread = game.s.inbox.filter((m) => m.pid === p.id && !m.read).length;
        const l = last(p.id);
        return (
          <button key={p.id} className="msg-row" onClick={() => setThread({ kind: 'person', id: p.id })}>
            <Portrait look={p.look} age={game.ageOf(p)} size={38} />
            <span className="msg-mid"><b>{p.name}{!p.alive ? ' 🕊️' : ''}</b><small>{l ? (l.photo ?? l.text) : primaryLabel(p)}</small></span>
            {unread > 0 && <i className="msg-badge">{unread}</i>}
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
  const msgs = threadFor(game, thread.id);
  // scroll only the chat log — scrollIntoView also scrolled the zoomed game frame and showed a dark screen
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [msgs.length, typing]);
  useEffect(() => {
    for (const m of game.s.inbox) if (m.pid === thread.id) m.read = true;
  }, [game, thread.id]);

  const state = p ? threadState(game, p) : 'open';
  const tabs: ChatTab[] = p ? tabsFor(game, p) : GROUP_TABS;
  const activeTab = tabs.includes(tab) ? tab : tabs[0];
  const chips = p ? chipsFor(game, p, activeTab) : groupChips(activeTab).map((chip) => ({ chip, odds: 0.7, reason: null as string | null }));
  const sent = sentThisSlot(game, thread.id);

  const send = (chipId: string) => {
    const r = isGroup ? sendGroup(game, thread.id, chipId) : sendChip(game, thread.id, chipId, burner);
    if (r.error) { setNote(r.error); return; }
    sfx(CHIP_BY_ID[chipId]?.photo ? 'camera' : 'message');
    setNote(r.reply === null ? 'Left on read.' : null);
    done('', '', '');
    if (r.delay) {
      setTyping(true);
      setTimeout(() => { setTyping(false); if (r.reply !== null) sfx('message'); refresh(); }, Math.min(1400, r.delay));
    }
    refresh();
  };
  const name = (id: string) => (id === 'me' ? 'You' : game.personById(id)?.name ?? '');
  const lastMine = [...msgs].reverse().find((m) => m.from === 'me');

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
      <div className="cht-log" ref={log}>
        {msgs.map((m) => {
          const mine = m.from === 'me';
          const pending = !mine && m.branch?.length ? game.s.inbox.find((x) => x.id === m.branch![0] && !x.replied) : null;
          return (
            <div key={m.id} className={`cht-row ${mine ? 'me' : ''}`}>
              {isGroup && !mine && <small className="cht-from">{name(m.from)}</small>}
              <div className={`cht-bub ${mine ? 'me' : ''} ${m.photo ? 'photo' : ''}`}>
                {m.photo ? <span className="cht-photo">{m.photo}</span> : m.text}
                {m.burner && <i className="cht-burner">📵</i>}
                {m.reaction && <i className="cht-react">{m.reaction}</i>}
              </div>
              {pending && p && (
                <div className="cht-chips">
                  {(REPLIES[pending.kind] ?? []).map((r, i) => {
                    const lock = r.req?.(game, p) ?? null;
                    return <button key={i} className="cht-chip" disabled={!!lock} title={lock ?? ''} onClick={() => { const t = reply(game, pending.id, i); done(t, 'Message', '💬'); refresh(); }}>{r.label}</button>;
                  })}
                </div>
              )}
            </div>
          );
        })}
        {typing && <div className="cht-row"><div className="cht-bub cht-typing"><i /><i /><i /></div></div>}
        {lastMine && !typing && <small className="cht-receipt">{lastMine.read ? 'Read' : 'Delivered'}</small>}
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
        <div className="cht-composer">
          <div className="cht-tabs">
            {TABS.filter((t) => tabs.includes(t.id)).map((t) => (
              <button key={t.id} className={`${t.id === activeTab ? 'on' : ''} ${t.id === 'intimate' || t.id === 'underworld' ? 'dark' : ''}`} onClick={() => setTab(t.id)} title={t.label}>{t.icon}</button>
            ))}
          </div>
          <div className="cht-chipgrid" data-sfx="none">
            {chips.map(({ chip, odds, reason }) => (
              <button key={chip.id} className={`cht-chip ${CHAT_POOLS[chip.pool]?.mature || chip.tab === 'underworld' ? 'hot' : ''}`} disabled={!!reason || sent >= MAX_PER_SLOT} title={reason ?? ''} onClick={() => send(chip.id)}>
                <span>{chip.label}</span>
                <small>{reason ?? `${Math.round(odds * 100)}%${chip.risk ? ` · ${chip.risk}` : ''}`}</small>
              </button>
            ))}
            {chips.length === 0 && <small className="app-note">Nothing to say here.</small>}
          </div>
          <div className="cht-foot">
            <small>{sent}/{MAX_PER_SLOT} this slot</small>
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
