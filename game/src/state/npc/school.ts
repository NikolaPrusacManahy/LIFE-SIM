import type { Game } from '../Game';
import { PROGRAM_BY_ID } from '../data/programs';
import { addLabel, dropLabel } from './labels';

// Update 0.4 — teachers (never romance-eligible) and professors (adults; see identity.ts).

const HS_SUBJECTS = ['Math', 'English', 'Science', 'History'];
const TEACHER_TAGS = ['strict', 'inspiring', 'burnedout', 'favoritist', 'funny', 'unfair'];
const PROGRAM_SUBJECTS: Record<string, string[]> = {
  uni_cs: ['Algorithms', 'Systems', 'AI'], uni_eng: ['Mechanics', 'Circuits', 'Design'], uni_bus: ['Finance', 'Marketing', 'Economics'],
  uni_med: ['Biology', 'Chemistry', 'Anatomy'], uni_law: ['Politics', 'Ethics', 'Rhetoric'], uni_arts: ['Film', 'Studio Art', 'Writing'],
  uni_crim: ['Criminology', 'Forensics', 'Sociology'], uni_agri: ['Soil Science', 'Botany', 'Agri-business'],
};

/** Make sure the current school has staff. Called monthly and after enrolling. */
export function ensureStaff(g: Game) {
  const e = g.s.education.current;
  if (!e) return;
  const p = PROGRAM_BY_ID[e.program];
  const tag = `staff:${e.program}`;
  if (g.s.people.some((x) => x.tags.includes(tag))) return;
  if (p.kind === 'hs') {
    for (const subject of HS_SUBJECTS) {
      const t = g.addPerson('teacher', { age: g.rand(26, 62), rel: 30, met: 'School', where: g.s.region === 'city' ? 'Westside High' : 'Hollow Creek High', tags: [tag, g.pick(TEACHER_TAGS)] });
      t.subject = subject;
      t.respect = 45;
      addLabel(t, 'teacher');
    }
  } else if (p.kind === 'uni' || p.kind === 'grad' || p.kind === 'cc') {
    const subjects = PROGRAM_SUBJECTS[e.program] ?? ['Seminar', 'Methods', 'Theory'];
    for (const subject of subjects) {
      const t = g.addPerson('professor', { age: g.rand(30, 68), rel: 30, met: 'Campus', where: 'State University', tags: [tag] });
      t.subject = subject;
      t.respect = 40;
      addLabel(t, 'professor');
    }
  }
}

/** Staff leave your life when you leave the school. Update 0.11 — so do school rivalries. */
export function retireStaff(g: Game) {
  const e = g.s.education.current;
  for (const p of g.s.people) {
    if ((p.role === 'teacher' || p.role === 'professor') && (!e || !p.tags.includes(`staff:${e.program}`))) p.status = 'moved';
    if (!e && p.where === 'School' && (p.labels.includes('rival') || p.rivalry > 20)) {
      dropLabel(p, 'rival');
      p.rivalry = Math.min(p.rivalry, 20);
    }
  }
}
