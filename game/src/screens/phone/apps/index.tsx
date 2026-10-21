import { useState, type ReactElement } from 'react';
import type { ActionResult, Game } from '../../../state/Game';
import type { AppId, AppProps } from './types';
import { sfxForText } from '../../../ui/audio';
import { MessagesApp } from './MessagesApp';
import { BagApp } from './BagApp';
import { CareerApp } from './CareerApp';
import { SchoolApp } from './SchoolApp';
import { ShopApp } from './ShopApp';
import { HomeApp } from './HomeApp';
import { BankApp } from './BankApp';
import { StatsApp } from './StatsApp';
import { DiaryApp } from './DiaryApp';
import { LifeApp } from './LifeApp';
import { SettingsApp } from './SettingsApp';
import { DatingApp } from './DatingApp';
import { CrimeApp } from './CrimeApp';
import { GodApp } from './GodApp';
import { NotesApp } from './NotesApp';
import { BlackMarketApp } from './BlackMarketApp';

export { APPS, APP_ORDER, type AppId } from './types';

const VIEW: Record<AppId, (p: AppProps) => ReactElement> = {
  people: MessagesApp,
  dating: DatingApp,
  bag: BagApp,
  crime: CrimeApp,
  god: GodApp,
  notes: NotesApp,
  blackmarket: BlackMarketApp,
  jobs: CareerApp,
  school: SchoolApp,
  shop: ShopApp,
  homes: HomeApp,
  bank: BankApp,
  stats: StatsApp,
  diary: DiaryApp,
  trophies: LifeApp,
  settings: SettingsApp,
};

export interface AppHostProps {
  game: Game;
  onResult: (r: ActionResult, card?: boolean) => void;
  onClose: () => void;
  onTitle: () => void;
  onRestart: () => void;
  openPeople?: (pid?: string) => void;
  /** Update 0.8 — open the phone on a chat thread */
  openChat?: (pid: string) => void;
  thread?: string;
}

/** Renders one app with the shared done/spend plumbing and an inline message banner. */
export function AppView({ id, host }: { id: AppId; host: AppHostProps }) {
  const [msg, setMsg] = useState<string | null>(null);
  const props: AppProps = {
    game: host.game,
    done: (m, title = '', icon = '') => {
      host.onResult(host.game.flush(title, icon, m), false);
      sfxForText(m);
      setMsg(m);
    },
    spend: (r) => {
      if (!r) return;
      host.onResult(r);
      host.onClose();
    },
    onTitle: host.onTitle,
    onRestart: host.onRestart,
    openPeople: host.openPeople,
    initialThread: host.thread,
    openChat: host.openChat,
  };
  const View = VIEW[id];
  return (
    <>
      {msg && <div className="app-msg" onClick={() => setMsg(null)}>{msg}</div>}
      <View {...props} />
    </>
  );
}
