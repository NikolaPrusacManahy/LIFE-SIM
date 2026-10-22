// Update 0.13 — every activity is playable: which minigame engine each activity uses, and how it's dressed.
// The score (0–1) scales the activity's gains through Game.playMul: poor 0.6×, average 1×, great 1.5×.

export type Engine = 'rhythm' | 'timing' | 'gym' | 'runner' | 'quiz' | 'duel' | 'sort' | 'cards' | 'aim' | 'fish' | 'plant' | 'draw' | 'stealth' | 'drive' | 'calm';

export interface Theme {
  engine: Engine;
  /** the look and the content (e.g. which song, which subject, which cards) */
  skin: string;
  /** one line telling you what to do */
  prompt: string;
}

const t = (engine: Engine, skin: string, prompt: string): Theme => ({ engine, skin, prompt });

export const MINI_THEMES: Record<string, Theme> = {
  // rhythm
  guitar: t('rhythm', 'guitar', 'Hit the notes as they reach the line: A · S · D · F'),
  choir: t('rhythm', 'choir', 'Sing on the beat: A · S · D · F'),
  prom: t('rhythm', 'dance', 'Dance! Hit the steps on the beat: A · S · D · F'),
  // sweet-spot timing
  yoga: t('timing', 'yoga', 'Hold the pose: press SPACE when the needle is in the green'),
  compete: t('timing', 'lift', 'Lock out the lift in the green zone'),
  trainer: t('timing', 'lift', 'Your trainer counts — hit each rep in the green'),
  academy_train: t('timing', 'aim', 'Steady your aim — fire in the green'),
  // key spam (the gym game)
  home_workout: t('gym', 'home', 'Spam the key in the ring'),
  jail_workout: t('gym', 'yard', 'Spam the key in the ring'),
  academy_drill: t('gym', 'drill', 'Spam the key in the ring'),
  // runner
  jog: t('runner', 'park', 'SPACE to jump the benches and dogs'),
  hike: t('runner', 'trail', 'SPACE to jump the rocks and roots'),
  skate: t('runner', 'bmx', 'SPACE to ollie the rails'),
  run_run: t('runner', 'escape', 'RUN. SPACE to vault the fences'),
  run_backroads: t('runner', 'escape', 'Stay off the main road. SPACE to jump'),
  // quiz cards
  homework: t('quiz', 'mixed', 'Answer as many as you can'),
  class_attend: t('quiz', 'mixed', 'Pop quiz!'),
  class_focus: t('quiz', 'mixed', 'Impress the teacher'),
  study_group: t('quiz', 'mixed', 'Quiz each other'),
  science_fair: t('quiz', 'science', 'The judges have questions'),
  lecture_attend: t('quiz', 'mixed', 'Keep up with the lecture'),
  lecture_focus: t('quiz', 'mixed', 'Office hours: show what you know'),
  campus_library: t('quiz', 'mixed', 'Study session'),
  study_lib: t('quiz', 'mixed', 'Study session'),
  ged: t('quiz', 'mixed', 'GED practice questions'),
  sat: t('quiz', 'sat', 'SAT section — think fast'),
  cc_attend: t('quiz', 'mixed', 'Class quiz'),
  cc_focus: t('quiz', 'mixed', 'Extra questions after class'),
  tutor_others: t('quiz', 'mixed', 'Explain it right'),
  jail_study: t('quiz', 'mixed', 'Prison class'),
  permit_test: t('quiz', 'driving', 'Learner permit test'),
  // conversation duel
  debate: t('duel', 'debate', 'Win the room'),
  council: t('duel', 'campaign', 'Win their votes'),
  work_network: t('duel', 'network', 'Make the right impression'),
  book_club: t('duel', 'books', 'Hold your own in the discussion'),
  therapy: t('duel', 'therapy', 'Open up — say what is true'),
  jail_allies: t('duel', 'yard', 'Read the room. Do not look weak'),
  confess: t('duel', 'confess', 'Unburden yourself'),
  youth_group: t('duel', 'youth', 'Join the conversation'),
  drama: t('duel', 'drama', 'Deliver the line with the right feeling'),
  // sort & tidy
  chores: t('sort', 'home', 'Put everything where it belongs'),
  jail_job: t('sort', 'kitchen', 'Sort the trays before the buzzer'),
  dock_work: t('sort', 'docks', 'Sort the crates to the right ship'),
  farm_chores: t('sort', 'farm', 'Feed and sort before sundown'),
  harvest: t('sort', 'harvest', 'Good ones in the basket, bad ones out'),
  work_shift: t('sort', 'work', 'Clear the queue'),
  work_hard: t('sort', 'work', 'Clear the queue — faster'),
  overtime: t('sort', 'work', 'Clear the queue — one more hour'),
  // cards & reels
  blackjack: t('cards', 'blackjack', 'Beat the dealer without going over 21'),
  high_roller: t('cards', 'blackjack', 'High stakes. Beat the dealer'),
  poker: t('cards', 'poker', 'Pick the cards to keep, then draw'),
  slots: t('cards', 'slots', 'Stop the reels'),
  // aim & arc
  hoops: t('aim', 'hoops', 'Hold to power up, let go to shoot'),
  sports: t('aim', 'hoops', 'Practice shots: hold, release'),
  bowling: t('aim', 'bowling', 'Hold to power up, let go to bowl'),
  // the rest
  fish: t('fish', 'lake', 'Cast, wait for the bite, then reel inside the green'),
  garden: t('plant', 'garden', 'Water each plant to the line — not more'),
  sketch: t('draw', 'sketch', 'Sketch what you see'),
  sneak_out: t('stealth', 'house', 'Arrow keys: get out without being seen'),
  run_hide: t('stealth', 'alley', 'Arrow keys: stay out of the flashlights'),
  jail_escape: t('stealth', 'prison', 'Arrow keys: learn the guard rounds'),
  drive_lesson: t('drive', 'lesson', 'Left/right to stay in lane, SPACE to brake at red lights'),
  road_test: t('drive', 'test', 'The examiner is watching. Stay in lane, stop at red'),
  cartheft: t('drive', 'getaway', 'Get away clean — dodge the traffic'),
  cartheft_c: t('drive', 'getaway', 'Get away clean — dodge the traffic'),
  run_car: t('drive', 'getaway', 'Lose them — dodge the traffic'),
  stargaze: t('calm', 'stars', 'Connect the stars in order'),
  meditate: t('calm', 'breath', 'Breathe with the circle: click when it is full'),
  picnic: t('calm', 'breath', 'Breathe with the circle: click when it is full'),
  me_time: t('calm', 'breath', 'Breathe with the circle: click when it is full'),
  reflect: t('calm', 'stars', 'Connect your thoughts, one by one'),
  service: t('calm', 'breath', 'Breathe with the hymn: click when the circle is full'),
};

/** Score → gain multiplier. */
export const playMulOf = (score: number) => 0.6 + 0.9 * Math.max(0, Math.min(1, score));
