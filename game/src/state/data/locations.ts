import type { Game } from '../Game';
import type { HousingId, Region } from '../types';
import { CAREER_BY_ID } from './careers';
import { ORG_BY_ID } from './orgs';
import { PROGRAM_BY_ID } from './programs';

export type SceneKind =
  | 'home' | 'apartment' | 'mansion' | 'farmhouse' | 'homeless'
  | 'school' | 'campus' | 'office' | 'shop' | 'downtown' | 'park' | 'gym' | 'library' | 'hospital'
  | 'club' | 'bar' | 'alley' | 'docks' | 'casino' | 'hideout' | 'mafia'
  | 'farm' | 'woods' | 'lake' | 'mainstreet' | 'roadhouse' | 'backroads' | 'church'
  | 'jail' | 'diner' | 'police' | 'construction' | 'studio' | 'stadium' | 'base' | 'warehouse' | 'garage' | 'station';

const hasProps = (g: Game) => g.s.underworld.properties.length > 0;

export interface LocationDef {
  id: string;
  name: (g: Game) => string;
  icon: string;
  region?: Region;
  scene: (g: Game) => SceneKind;
  when?: (g: Game) => boolean;
  desc: string;
}

export const HOUSING: Record<HousingId, { name: string; icon: string; scene: SceneKind; rent: Record<Region, number>; owned?: boolean; price?: Record<Region, number> }> = {
  parents: { name: "Parents' House", icon: '🏠', scene: 'home', rent: { city: 0, country: 0 } },
  homeless: { name: 'The Streets', icon: '📦', scene: 'homeless', rent: { city: 0, country: 0 } },
  shared: { name: 'Shared Flat', icon: '🛏️', scene: 'apartment', rent: { city: 750, country: 400 } },
  apartment: { name: 'Apartment', icon: '🏢', scene: 'apartment', rent: { city: 1600, country: 850 } },
  loft: { name: 'Luxury Loft', icon: '🌃', scene: 'apartment', rent: { city: 4200, country: 2200 } },
  house: { name: 'Your House', icon: '🏡', scene: 'home', rent: { city: 450, country: 300 }, owned: true, price: { city: 320000, country: 160000 } },
  farmhouse: { name: 'Farmhouse', icon: '🌻', scene: 'farmhouse', rent: { city: 300, country: 300 }, owned: true, price: { city: 140000, country: 140000 } },
  ranch: { name: 'Grand Ranch', icon: '🐎', scene: 'farmhouse', rent: { city: 1800, country: 1800 }, owned: true, price: { city: 950000, country: 950000 } },
  mansion: { name: 'Mansion', icon: '🏰', scene: 'mansion', rent: { city: 6000, country: 4000 }, owned: true, price: { city: 3500000, country: 2200000 } },
};

const s = (k: SceneKind) => () => k;
const nm = (n: string) => () => n;

export const LOCATIONS: LocationDef[] = [
  {
    id: 'home', icon: '🏠', desc: 'Rest, study, and recharge.',
    name: (g) => (g.jailed ? 'Cell' : HOUSING[g.s.housing].name),
    scene: (g) => (g.s.housing === 'parents' && g.s.hometown === 'country' && g.s.region === 'country' ? 'farmhouse' : HOUSING[g.s.housing].scene),
  },
  {
    id: 'school', icon: '🏫', desc: 'Classes, cliques, and detention.',
    name: (g) => (g.s.region === 'city' ? 'Westside High' : 'Hollow Creek High'),
    scene: s('school'),
    when: (g) => g.s.education.current?.program === 'hs',
  },
  {
    id: 'campus', icon: '🎓', desc: 'Lectures, labs, and parties.',
    name: (g) => {
      const p = g.s.education.current ? PROGRAM_BY_ID[g.s.education.current.program] : null;
      if (!p) return 'Campus';
      if (p.kind === 'academy') return 'Police Academy';
      if (p.kind === 'trade') return 'Technical Institute';
      return 'State University';
    },
    scene: (g) => (g.s.education.current?.program === 'academy' ? 'police' : 'campus'),
    when: (g) => !!g.s.education.current && g.s.education.current.program !== 'hs' && !g.s.education.current.program.startsWith('cc_'),
  },
  { id: 'college', icon: '🏫', desc: 'Cheap classes, day or night.', name: () => 'Community College', scene: () => 'campus', when: (g) => g.age >= 18 },
  { id: 'driving', icon: '🚗', desc: 'Permit, lessons, road test.', name: () => 'Driving School', scene: () => 'garage', when: (g) => g.age >= 15 },
  { id: 'clinic', icon: '💊', desc: 'Pharmacy & sexual health clinic.', name: () => 'Clinic & Pharmacy', scene: () => 'hospital' },
  { id: 'airport', icon: '✈️', region: 'city', desc: 'Vacations and fresh starts.', name: () => 'Airport', scene: () => 'station', when: (g) => g.age >= 18 },
  { id: 'base', icon: '🎖️', desc: 'Enlist and serve.', name: () => 'Military Recruiting', scene: () => 'base', when: (g) => g.age >= 17 },
  { id: 'rehab', icon: '🌱', desc: 'Get help. Get better.', name: () => 'Rehab Centre', scene: () => 'hospital', when: (g) => g.age >= 18 },
  {
    id: 'work', icon: '💼', desc: 'Earn your keep.',
    name: (g) => (g.s.job ? CAREER_BY_ID[g.s.job.careerId].place : 'Work'),
    scene: (g) => (g.s.job ? CAREER_BY_ID[g.s.job.careerId].scene : 'office'),
    when: (g) => !!g.s.job,
  },
  { id: 'downtown', icon: '🏙️', region: 'city', desc: 'Shops, jobs, and pickpockets.', name: nm('Downtown'), scene: s('downtown') },
  { id: 'mainstreet', icon: '🛻', region: 'country', desc: 'Diner, feed store, gossip.', name: nm('Main Street'), scene: s('mainstreet') },
  { id: 'park', icon: '🌳', region: 'city', desc: 'Fresh air and shady deals.', name: nm('Riverside Park'), scene: s('park') },
  { id: 'gym', icon: '🏋️', desc: 'Get swole.', name: (g) => (g.s.region === 'city' ? 'Iron Temple Gym' : 'County Rec Center'), scene: s('gym') },
  { id: 'library', icon: '📚', desc: 'Quiet. Knowledge. Free Wi-Fi.', name: nm('Public Library'), scene: s('library') },
  { id: 'hospital', icon: '🏥', desc: 'Heal up. Bring insurance.', name: (g) => (g.s.region === 'city' ? 'St. Mary’s Hospital' : 'County Clinic'), scene: s('hospital') },
  { id: 'club', icon: '🪩', region: 'city', desc: 'Lights, bass, bad decisions.', name: nm('Static Nightclub'), scene: s('club') },
  { id: 'bar', icon: '🍺', region: 'city', desc: 'Drinks, darts, and dive-bar wisdom.', name: nm('The Anchor'), scene: s('bar') },
  { id: 'roadhouse', icon: '🤠', region: 'country', desc: 'Honky-tonk, mechanical bull, brawls.', name: nm("Dusty's Roadhouse"), scene: s('roadhouse') },
  { id: 'alley', icon: '🌃', region: 'city', desc: 'The Southside. Watch your back.', name: nm('The Southside'), scene: s('alley') },
  { id: 'backroads', icon: '🛣️', region: 'country', desc: 'Dirt roads where the law rarely drives.', name: nm('The Backroads'), scene: s('backroads') },
  { id: 'farm', icon: '🌾', region: 'country', desc: 'Fields, barns, and hard work.', name: (g) => (g.has('farm') ? 'Your Farm' : 'Miller Farm'), scene: s('farm') },
  { id: 'woods', icon: '🌲', region: 'country', desc: 'Hunting, hiking, hidden stills.', name: nm('Blackpine Woods'), scene: s('woods') },
  { id: 'lake', icon: '🎣', region: 'country', desc: 'Fishing, swimming, sunsets.', name: nm('Hollow Lake'), scene: s('lake') },
  { id: 'church', icon: '⛪', desc: 'Redemption is always open.', name: (g) => (g.s.region === 'city' ? 'St. Jude Cathedral' : 'Little White Chapel'), scene: s('church') },
  { id: 'casino', icon: '🎰', region: 'city', desc: 'The house always wins. Usually.', name: nm('Golden Crown Casino'), scene: s('casino') },
  { id: 'docks', icon: '⚓', region: 'city', desc: 'Containers, cranes, and contraband.', name: nm('Harbor Docks'), scene: s('docks'), when: (g) => g.s.stats.street >= 30 || g.s.crime.org?.id === 'moretti' || g.age >= 18 },
  {
    id: 'hideout', icon: '🕶️', desc: 'Your crew’s turf.',
    name: (g) => (g.s.crime.org ? ORG_BY_ID[g.s.crime.org.id].hideout : 'Hideout'),
    scene: (g) => (g.s.crime.org?.id === 'moretti' ? 'mafia' : 'hideout'),
    when: (g) => !!g.s.crime.org,
  },
  { id: 'police', icon: '👮', desc: 'Turn yourself in. Or don’t.', name: (g) => (g.s.region === 'city' ? 'Metro PD Precinct' : 'Sheriff’s Office'), scene: s('police') },
  { id: 'station', icon: '🚉', desc: 'Leave town. Start over.', name: (g) => (g.s.region === 'city' ? 'Central Station' : 'Greyhound Stop'), scene: s('station') },
  // Update 0.5
  { id: 'backroom', icon: '🕶️', desc: 'No receipts. No questions.', name: () => 'The Back Room', scene: () => 'mafia', when: (g) => g.age >= 18 && (g.s.underworld.contact || g.s.stats.street >= 15) },
  { id: 'spots', icon: '🗝️', desc: 'Your properties.', name: () => 'Your Spots', scene: (g) => (g.s.underworld.properties.some((p) => p.kind === 'warehouse') ? 'warehouse' : 'garage'), when: hasProps },
  { id: 'onrun', icon: '🚨', desc: 'Keep moving.', name: () => 'On the Run', scene: (g) => (g.s.region === 'city' ? 'alley' : 'backroads'), when: (g) => !!g.s.underworld.pursuit && !g.s.underworld.pursuit.settled },
  { id: 'jail', icon: '⛓️', desc: 'Do your time.', name: (g) => (g.s.crime.jail?.juvie ? 'Juvenile Hall' : 'State Penitentiary'), scene: s('jail'), when: (g) => g.jailed },
];

export const LOC_BY_ID: Record<string, LocationDef> = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
