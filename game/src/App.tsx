import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from './state/Game';
import { clearSave, loadGame, saveGame } from './state/save';
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

  const begin = useCallback((g: Game) => {
    g.onSave = (gg) => saveGame(gg.s);
    g.save();
    setGame(g);
    setTab(currentObligations(g)[0]?.loc ?? g.s.location ?? 'home');
    setScreen('play');
  }, []);

  const onContinue = () => {
    const s = loadGame();
    if (s) begin(new Game(s));
  };

  const restart = () => {
    clearSave();
    setGame(null);
    setScreen('create');
  };

  const onChild = (id: string) => {
    if (!game) return;
    const g = continueAsChild(game.s, id);
    if (g) begin(g);
  };

  const onPreview = useCallback((p: CreatePreview) => setPreview(p), []);

  // Game state is mutable, so the stage view is simply recomputed every render.
  let view: StageView = TITLE_VIEW;
  if (screen === 'play' && game) view = stageViewFor(game, tab);
  else if (screen === 'create' && preview) {
    view = {
      region: preview.hometown,
      scene: preview.hometown === 'city' ? 'downtown' : 'mainstreet',
      phase: 'evening',
      month: 5,
      weather: 'clear',
      look: { ...preview.look, gender: preview.gender, age: 14, mood: 70, outfit: 'casual' },
    };
  }

  return (
    <div className="app-frame">
      <StageCanvas ref={stage} view={view} />
      <div className="app-ui">
        {screen === 'title' && <TitleScreen hasSave={!!loadGame()} onContinue={onContinue} onNew={() => setScreen('create')} />}
        {!ageAsked && <AgeConfirm onDone={() => setAgeAsked(true)} />}
        {screen === 'create' && <CreateScreen onBack={() => setScreen('title')} onCreate={begin} onPreview={onPreview} />}
        {screen === 'play' && game && (
          <PlayScreen game={game} stage={stage} tab={tab} setTab={setTab} onTitle={() => setScreen('title')} onRestart={restart} onChild={onChild} />
        )}
      </div>
    </div>
  );
}
