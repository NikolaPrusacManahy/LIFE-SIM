import { useEffect, useState } from 'react';
import type { Appearance, Background, Gender, Pronouns, Region, Sexuality } from '../../state/types';
import { TRAITS } from '../../state/data/traits';
import { firstName, lastName } from '../../state/data/names';
import { createLife, randomLook } from '../../state/newGame';
import type { Game } from '../../state/Game';
import { BUILDS, EYES, HAIR, HAIR_STYLES, HEIGHTS, SKIN, hex } from '../../fx/look';
import { PRONOUNS, SEXUALITY_LABEL } from '../../state/npc/identity';
import { useEscape } from '../../hooks/useEscape';

export interface CreatePreview {
  look: Appearance;
  gender: Gender;
  hometown: Region;
  age: number;
}

interface Props {
  onBack: () => void;
  onCreate: (g: Game) => void;
  onPreview: (p: CreatePreview) => void;
}

const BACKGROUNDS: { id: Background; name: string; desc: string }[] = [
  { id: 'poor', name: 'Struggling', desc: '$40 · street-smart · maybe one parent' },
  { id: 'middle', name: 'Middle Class', desc: '$300 · small allowance' },
  { id: 'rich', name: 'Wealthy', desc: '$2,500 · big allowance · a phone' },
];
const STEPS = ['Name', 'Identity', 'Looks', 'Background', 'Traits'];

/** Update 0.4 — step-by-step creation with a live avatar preview. */
export function CreateScreen({ onBack, onCreate, onPreview }: Props) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender>('female');
  const [name, setName] = useState(() => firstName('female'));
  const [family, setFamily] = useState(() => lastName());
  const [pron, setPron] = useState<'he' | 'she' | 'they' | 'custom'>('she');
  const [custom, setCustom] = useState<Pronouns>({ subj: 'xe', obj: 'xem', poss: 'xyr', plural: false, label: 'xe/xem' });
  const [sexuality, setSexuality] = useState<Sexuality>('unsure');
  const [bg, setBg] = useState<Background>('middle');
  const [home, setHome] = useState<Region>('city');
  const [siblings, setSiblings] = useState(1);
  const [startAge, setStartAge] = useState<14 | 23>(14);
  const [millionaire, setMillionaire] = useState(false);
  const [rules, setRules] = useState<'us' | 'eu'>('us');
  const [god, setGod] = useState(false);
  const [traits, setTraits] = useState<string[]>([]);
  const [look, setLook] = useState<Appearance>(() => randomLook('female'));
  useEscape(() => (step > 0 ? setStep(step - 1) : onBack()));

  useEffect(() => onPreview({ look, gender, hometown: home, age: startAge }), [look, gender, home, startAge, onPreview]);

  const pickGender = (g: Gender) => {
    setGender(g);
    if (pron !== 'custom') setPron(g === 'male' ? 'he' : g === 'female' ? 'she' : 'they');
    if (g !== 'nonbinary') setLook({ ...look, body: g === 'male' ? 'male' : 'female' });
  };
  const toggleTrait = (id: string) => setTraits((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length < 2 ? [...t, id] : [t[1], id]));
  const pronouns: Pronouns = pron === 'custom' ? { ...custom, label: `${custom.subj}/${custom.obj}` } : PRONOUNS[pron];
  const start = () => onCreate(createLife({ name, familyName: family, gender, background: bg, hometown: home, traits, look, pronouns, sexuality, siblings, startAge, millionaire, rules, god }));
  const set = <K extends keyof Appearance>(k: K, v: Appearance[K]) => setLook({ ...look, [k]: v });

  return (
    <div className="crt-screen">
      <div className="crt-panel glass">
        <div className="crt-steps">
          {STEPS.map((s, i) => (
            <button key={s} className={`crt-step ${i === step ? 'on' : i < step ? 'done' : ''}`} onClick={() => setStep(i)}>
              <i>{i + 1}</i>{s}
            </button>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="crt-title">Who are you?</h2>
            <div className="crt-row">
              <label className="crt-field"><span>First name</span><input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} /></label>
              <label className="crt-field"><span>Family name</span><input value={family} maxLength={16} onChange={(e) => setFamily(e.target.value)} /></label>
              <button className="btn btn-ghost crt-dice" title="Randomize" onClick={() => { setName(firstName(gender)); setFamily(lastName()); }}>🎲</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="crt-title">Identity</h2>
            <div className="crt-section">Gender</div>
            <div className="crt-seg">
              {(['female', 'male', 'nonbinary'] as Gender[]).map((g) => (
                <button key={g} className={`crt-opt ${gender === g ? 'on' : ''}`} onClick={() => pickGender(g)}>{g === 'female' ? '♀ Female' : g === 'male' ? '♂ Male' : '⚧ Non-binary'}</button>
              ))}
            </div>
            <div className="crt-section">Pronouns</div>
            <div className="crt-seg">
              {(['he', 'she', 'they', 'custom'] as const).map((k) => (
                <button key={k} className={`crt-opt ${pron === k ? 'on' : ''}`} onClick={() => setPron(k)}>{k === 'custom' ? 'Custom' : PRONOUNS[k].label}</button>
              ))}
            </div>
            {pron === 'custom' && (
              <div className="crt-row crt-pron">
                <label className="crt-field"><span>Subject</span><input value={custom.subj} maxLength={8} onChange={(e) => setCustom({ ...custom, subj: e.target.value })} /></label>
                <label className="crt-field"><span>Object</span><input value={custom.obj} maxLength={8} onChange={(e) => setCustom({ ...custom, obj: e.target.value })} /></label>
                <label className="crt-field"><span>Possessive</span><input value={custom.poss} maxLength={8} onChange={(e) => setCustom({ ...custom, poss: e.target.value })} /></label>
              </div>
            )}
            <div className="crt-section">Sexuality <em>decides who can be romance-eligible · changeable later</em></div>
            <div className="crt-seg crt-wrap">
              {(['straight', 'gay', 'bi', 'pan', 'ace', 'unsure'] as Sexuality[]).map((s) => (
                <button key={s} className={`crt-opt ${sexuality === s ? 'on' : ''}`} onClick={() => setSexuality(s)}>{SEXUALITY_LABEL[s]}{s === 'unsure' && <small>Decide later</small>}</button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="crt-title">Looks</h2>
            <div className="crt-section">Body base</div>
            <div className="crt-seg">
              <button className={`crt-opt ${look.body === 'male' ? 'on' : ''}`} onClick={() => set('body', 'male')}>Male model</button>
              <button className={`crt-opt ${look.body === 'female' ? 'on' : ''}`} onClick={() => set('body', 'female')}>Female model</button>
            </div>
            <div className="crt-section">Skin tone</div>
            <div className="crt-swatches">{SKIN.map((c, i) => <button key={i} className={`crt-sw ${look.skin === i ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => set('skin', i)} />)}</div>
            <div className="crt-section">Hair style</div>
            <div className="crt-chips">{HAIR_STYLES.map((n, i) => <button key={n} className={`crt-chip ${look.hairStyle === i ? 'on' : ''}`} onClick={() => set('hairStyle', i)}>{n}</button>)}</div>
            <div className="crt-section">Hair colour</div>
            <div className="crt-swatches">{HAIR.map((c, i) => <button key={i} className={`crt-sw ${look.hair === i ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => set('hair', i)} />)}</div>
            <div className="crt-row crt-looks2">
              <div>
                <div className="crt-section">Eyes</div>
                <div className="crt-swatches">{EYES.map((c, i) => <button key={i} className={`crt-sw ${look.eyes === i ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => set('eyes', i)} />)}</div>
              </div>
              <div>
                <div className="crt-section">Extras</div>
                <div className="crt-chips">
                  <button className={`crt-chip ${look.freckles ? 'on' : ''}`} onClick={() => set('freckles', !look.freckles)}>Freckles</button>
                  <button className={`crt-chip ${look.glasses ? 'on' : ''}`} onClick={() => set('glasses', !look.glasses)}>Glasses</button>
                </div>
              </div>
            </div>
            <div className="crt-row crt-looks2">
              <div>
                <div className="crt-section">Height</div>
                <div className="crt-chips">{HEIGHTS.map((n, i) => <button key={n} className={`crt-chip ${look.height === i ? 'on' : ''}`} onClick={() => set('height', i)}>{n}</button>)}</div>
              </div>
              <div>
                <div className="crt-section">Build</div>
                <div className="crt-chips">{BUILDS.map((n, i) => <button key={n} className={`crt-chip ${look.build === i ? 'on' : ''}`} onClick={() => set('build', i)}>{n}</button>)}</div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => setLook(randomLook(look.body))}>🎲 Randomize looks</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="crt-title">Where you start</h2>
            <div className="crt-section">Laws</div>
            <div className="crt-seg">
              <button className={`crt-opt ${rules === 'us' ? 'on' : ''}`} onClick={() => setRules('us')}>🇺🇸 US rules<small>Drink at 21, drive at 16, costly college</small></button>
              <button className={`crt-opt ${rules === 'eu' ? 'on' : ''}`} onClick={() => setRules('eu')}>🇪🇺 EU rules<small>Drink at 18, drive at 18, cheap college</small></button>
            </div>
            <div className="crt-section">Start at</div>
            <div className="crt-seg">
              <button className={`crt-opt ${startAge === 14 ? 'on' : ''}`} onClick={() => setStartAge(14)}>🎒 Age 14<small>High school, parents, curfew</small></button>
              <button className={`crt-opt ${startAge === 23 ? 'on' : ''}`} onClick={() => setStartAge(23)}>🔑 Age 23<small>Diploma, own phone, shared flat</small></button>
            </div>
            <div className="crt-section">Nature</div>
            <div className="crt-seg">
              <button className={`crt-opt ${!god ? 'on' : ''}`} onClick={() => setGod(false)}>🧍 Mortal<small>One life. Real stakes.</small></button>
              <button className={`crt-opt ${god ? 'on' : ''}`} onClick={() => setGod(true)}>⚡ Born a god<small>Immortal, untouchable, every power</small></button>
            </div>
            <div className="crt-section">Fortune</div>
            <div className="crt-seg">
              <button className={`crt-opt ${!millionaire ? 'on' : ''}`} onClick={() => setMillionaire(false)}>🪙 Normal<small>Money from your family</small></button>
              <button className={`crt-opt ${millionaire ? 'on' : ''}`} onClick={() => setMillionaire(true)}>💎 Millionaire<small>+$1,000,000 trust fund</small></button>
            </div>
            <div className="crt-section">Hometown</div>
            <div className="crt-seg">
              <button className={`crt-opt ${home === 'city' ? 'on' : ''}`} onClick={() => setHome('city')}>🏙️ The City<small>Nightlife, careers, crowds</small></button>
              <button className={`crt-opt ${home === 'country' ? 'on' : ''}`} onClick={() => setHome('country')}>🌾 Countryside<small>Farms, lakes, small town</small></button>
            </div>
            <div className="crt-section">Family</div>
            <div className="crt-seg">
              {BACKGROUNDS.map((b) => <button key={b.id} className={`crt-opt ${bg === b.id ? 'on' : ''}`} onClick={() => setBg(b.id)}>{b.name}<small>{b.desc}</small></button>)}
            </div>
            <div className="crt-section">Siblings</div>
            <div className="crt-chips">{[0, 1, 2, 3].map((n) => <button key={n} className={`crt-chip ${siblings === n ? 'on' : ''}`} onClick={() => setSiblings(n)}>{n === 0 ? 'Only child' : n}</button>)}</div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="crt-title">Traits <em className="crt-count">{traits.length}/2</em></h2>
            <div className="crt-traits">
              {TRAITS.map((t) => (
                <button key={t.id} className={`crt-trait ${traits.includes(t.id) ? 'on' : ''}`} onClick={() => toggleTrait(t.id)} title={t.desc}>
                  <b>{t.icon} {t.name}</b>
                  <small>{t.desc}</small>
                </button>
              ))}
            </div>
            <p className="crt-summary">{name} {family} · {pronouns.label} · {SEXUALITY_LABEL[sexuality]} · {home === 'city' ? 'City' : 'Countryside'} · {bg} family · {siblings} sibling{siblings === 1 ? '' : 's'}</p>
          </>
        )}

        <div className="crt-actions">
          <button className="btn" onClick={() => (step ? setStep(step - 1) : onBack())}>← {step ? 'Back' : 'Title'}</button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-lg" onClick={() => setStep(step + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={start}>Start at age 14 →</button>
          )}
        </div>
      </div>
    </div>
  );
}

