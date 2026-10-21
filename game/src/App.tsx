import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from './state/Game';
import { anySave, clearSave, loadGame, saveGame } from './state/save';
import { SlotPicker } from './screens/title/SlotPicker';
import { continueAsChild } from './state/newGame';
import { currentObligations } from './state/systems/obligations';
import { StageCanvas, type StageHandle } from './fx/StageCanvas';
import type { StageView } from './fx/stage/Stage';
import { stageViewFor } from './fx/view';
import { useGame } from './hooks/useGame';
import { TitleScreen } from './screens/title/TitleScreen';
import { CreateScreen, type CreatePreview } from './screens/create/CreateScreen';
import { PlayScreen } from './screens/play/PlayScreen';
import { AgeConfirm } from './screens/title/AgeConfirm';
import { settings } from './state/settings';
import { installAudio } from './ui/audio';
import { installCurrency, setCurrency } from './ui/currency';

type Screen = 'title' | 'create' | 'play';

const TITLE_VIEW: StageView = { region: 'city', scene: 'downtown', phase: 'night', month: 5, weather: 'clear', look: null };

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<Game | null>(null);
  const [tab, setTab] = useState('home');
  const [preview, setPreview] = useState<CreatePreview | null>(null);
  const stage = useRef<StageHandle>(null);
  const [ageAsked, setAgeAsked] = useState(settings.ageConfirmed);
  useGame(game);
  useEffect(() => installAudio(), []);
  // Update 0.10 — euros for EU lives (display only)
  useEffect(() => installCurrency(), []);

  // Update 0.9 — which of the 5 save slots this life writes to (autosave)
  const slot = useRef(0);
  const [picker, setPicker] = useState<'continue' | 'new' | null>(null);

  const begin = useCallback((g: Game) => {
    g.onSave = (gg) => saveGame(gg.s, slot.current);
    g.save();
    setCurrency(g.s.rules);
    setGame(g);
    setTab(currentObligations(g)[0]?.loc ?? g.s.location ?? 'home');
    setScreen('play');
  }, []);

  const pick = (n: number) => {
    const mode = picker;
    setPicker(null);
    slot.current = n;
    if (mode === 'continue') {
      const s = loadGame(n);
      if (s) begin(new Game(s));
    } else setScreen('create'); // the old life in this slot is overwritten when the new one starts
  };

  /** A new life from the pause menu / death screen stays in the current slot. */
  const restart = () => {
    clearSave(slot.current);
    setGame(null);
    setScreen('create');
  };

  const onChild = (id: string) => {
    if (!game) return;
    const g = continueAsChild(game.s, id);
    if (g) begin(g);
  };

  const onPreview = useCallback((p: CreatePreview) => setPreview(p), []);
  // Update 0.12 — is a story card open right now? (the stage shows that card's person only then)
  const [eventOpen, setEventOpen] = useState(false);

  // Game state is mutable, so the stage view is simply recomputed every render.
  let view: StageView = TITLE_VIEW;
  if (screen === 'play' && game) view = stageViewFor(game, tab, eventOpen);
  else if (screen === 'create' && preview) {
    view = {
      region: preview.hometown,
      scene: preview.hometown === 'city' ? 'downtown' : 'mainstreet',
      phase: 'evening',
      month: 5,
      weather: 'clear',
      look: { ...preview.look, gender: preview.gender, age: preview.age, mood: 70, outfit: 'casual' },
    };
  }

  return (
    <div className="app-frame">
      <StageCanvas ref={stage} view={view} />
      <div className="app-ui">
        {screen === 'title' && <TitleScreen hasSave={anySave()} onContinue={() => setPicker('continue')} onNew={() => setPicker('new')} />}
        {screen === 'title' && picker && <SlotPicker mode={picker} onPick={pick} onClose={() => setPicker(null)} />}
        {!ageAsked && <AgeConfirm onDone={() => setAgeAsked(true)} />}
        {screen === 'create' && <CreateScreen onBack={() => setScreen('title')} onCreate={begin} onPreview={onPreview} />}
        {screen === 'play' && game && (
          <PlayScreen game={game} stage={stage} tab={tab} setTab={setTab} onEventOpen={setEventOpen} onTitle={() => setScreen('title')} onRestart={restart} onChild={onChild} />
        )}
      </div>
    </div>
  );
}
