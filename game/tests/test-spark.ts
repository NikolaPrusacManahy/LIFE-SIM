// Update 0.13 — Spark: 30 swipes a month, your own profile, and preferences (who, ages, a tag at up to 30%).
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import { hydrate } from '../src/state/save';
import { SWIPES_PER_MONTH, TAG_CHANCE, nextProfile, saveSparkProfile, swipe, swipesLeft } from '../src/state/systems/dating';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (sexuality: 'straight' | 'bi' = 'bi') => {
  const g = createLife({ name: 'S', familyName: 'P', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: 23 });
  g.s.sexuality = sexuality;
  return g;
};

{
  const g = mk();
  check('30 swipes a month', SWIPES_PER_MONTH === 30 && swipesLeft(g) === 30);
  for (let i = 0; i < 30; i++) swipe(g, nextProfile(g), false);
  check('…and then you are out until next month', swipesLeft(g) === 0 && swipe(g, nextProfile(g), true).text.includes('Out of swipes'));
  g.s.clock++;
  check('a new month brings 30 again', swipesLeft(g) === 30);
}

{
  const g = mk();
  check('no profile at first', !g.s.spark.made);
  const old = JSON.parse(JSON.stringify(g.s));
  delete old.spark;
  check('old saves get an empty profile', hydrate(old)?.spark.made === false);
  saveSparkProfile(g, { bio: '  Coffee first.  ', show: 'female', ageMin: 25, ageMax: 30, tag: null });
  check('saving makes your profile (bio trimmed)', g.s.spark.made && g.s.spark.bio === 'Coffee first.');
  const ps = Array.from({ length: 300 }, () => nextProfile(g));
  check('"Show me: Women" only shows women', ps.every((p) => p.gender === 'female'));
  check('profiles stay inside your age range', ps.every((p) => p.age >= 25 && p.age <= 30));
}

{
  const g = mk('straight');
  saveSparkProfile(g, { show: 'male', ageMin: 10, ageMax: 30 });
  check('you can’t pick a gender you aren’t into; ages never go under 18', g.s.spark.show === 'any' && g.s.spark.ageMin >= 18);
  check('every profile is an adult', Array.from({ length: 300 }, () => nextProfile(g)).every((p) => p.age >= 18));
}

{
  const count = (tag: Parameters<typeof saveSparkProfile>[1]['tag'], n = 2000) => {
    const g = mk();
    saveSparkProfile(g, { show: 'any', ageMin: 20, ageMax: 30, tag });
    return Array.from({ length: n }, () => nextProfile(g)).filter((p) => p.persona === tag).length / n;
  };
  const otaku = count('otaku');
  check(`a chosen tag shows up about ${TAG_CHANCE * 100}% of the time (plus its normal chance)`, otaku > 0.28 && otaku < 0.42, `${Math.round(otaku * 100)}%`);
  const g = mk();
  saveSparkProfile(g, { show: 'any', ageMin: 20, ageMax: 30, tag: 'gyaru' });
  const gy = Array.from({ length: 2000 }, () => nextProfile(g)).filter((p) => p.persona === 'gyaru');
  check('gyaru tag: always women aged 18–24', gy.length > 300 && gy.every((p) => p.gender === 'female' && p.age >= 18 && p.age <= 24));
  const male = mk('straight');
  male.s.gender = 'female';
  saveSparkProfile(male, { show: 'any', ageMin: 20, ageMax: 30, tag: 'gyaru' });
  check('gyaru tag never appears for someone who only sees men', !Array.from({ length: 500 }, () => nextProfile(male)).some((p) => p.persona === 'gyaru'));
}

done();
