import type { Game } from '../Game';
import type { Phase, Region, StatKey } from '../types';
import type { SceneKind } from './locations';

export interface CareerLevel {
  title: string;
  pay: number;
}

export type CareerTrack = 'teen' | 'entry' | 'trade' | 'pro' | 'elite' | 'service' | 'creative' | 'country' | 'special';

export interface CareerDef {
  id: string;
  name: string;
  icon: string;
  track: CareerTrack;
  place: string;
  scene: SceneKind;
  region?: Region;
  shift: Phase[];
  minAge: number;
  maxAge?: number;
  stat: StatKey;
  degree?: string[];
  minStat?: Partial<Record<StatKey, number>>;
  asset?: string;
  noRecord?: boolean;
  difficulty: number;
  levels: CareerLevel[];
  promoMonths: number;
  gains: Partial<Record<StatKey, number>>;
  fame?: number;
  hidden?: boolean;
  req?: (g: Game) => string | null;
  flavor: string[];
}

const DAY: Phase[] = ['morning', 'afternoon'];
const EVE: Phase[] = ['evening'];
const LATE: Phase[] = ['evening', 'night'];
const AFT_EVE: Phase[] = ['afternoon', 'evening'];

const L = (...pairs: [string, number][]): CareerLevel[] => pairs.map(([title, pay]) => ({ title, pay }));

export const CAREERS: CareerDef[] = [
  // ---------- teen part-time ----------
  { id: 'burger', name: 'Burger Barn', icon: '🍔', track: 'teen', place: 'Burger Barn', scene: 'diner', region: 'city', shift: EVE, minAge: 14, maxAge: 24, stat: 'charm', difficulty: 10, promoMonths: 6,
    levels: L(['Crew Member', 450], ['Shift Leader', 700]), gains: { charm: 0.6 }, flavor: ['You flipped 300 patties.', 'A customer screamed about pickles.', 'You mastered the fryer.'] },
  { id: 'grocer', name: 'FreshMart Bagger', icon: '🛒', track: 'teen', place: 'FreshMart', scene: 'shop', shift: EVE, minAge: 14, maxAge: 24, stat: 'fitness', difficulty: 8, promoMonths: 6,
    levels: L(['Bagger', 420], ['Stock Clerk', 620]), gains: { fitness: 0.5 }, flavor: ['Paper or plastic. Forever.', 'You built a cereal pyramid.', 'Cart duty in the rain.'] },
  { id: 'babysit', name: 'Babysitting', icon: '🍼', track: 'teen', place: "Neighbor's House", scene: 'home', shift: EVE, minAge: 14, maxAge: 24, stat: 'charm', difficulty: 15, promoMonths: 8,
    levels: L(['Babysitter', 380], ['Trusted Nanny', 650]), gains: { charm: 0.5, mood: -0.5 }, flavor: ['The kids glued your shoes to the floor.', 'Bedtime negotiations went well.', 'You watched cartoons and got paid.'] },
  { id: 'farmhand', name: 'Farmhand', icon: '🐄', track: 'teen', place: 'Miller Farm', scene: 'farm', region: 'country', shift: EVE, minAge: 14, maxAge: 30, stat: 'fitness', difficulty: 5, promoMonths: 6,
    levels: L(['Farmhand', 520], ['Head Hand', 780]), gains: { fitness: 0.9 }, flavor: ['Hay bales: 1, Your back: 0.', 'You chased an escaped goat.', 'Milking at dawn builds character.'] },
  { id: 'tutor', name: 'Tutoring', icon: '📚', track: 'teen', place: 'Public Library', scene: 'library', shift: EVE, minAge: 15, maxAge: 26, stat: 'smarts', minStat: { smarts: 60 }, difficulty: 30, promoMonths: 6,
    levels: L(['Tutor', 550], ['Senior Tutor', 900]), gains: { smarts: 0.6, charm: 0.3 }, flavor: ['You explained fractions 9 different ways.', 'Your student aced their test!', 'Calculus, again.'] },

  // ---------- entry level ----------
  { id: 'cashier', name: 'Retail', icon: '🏷️', track: 'entry', place: 'MegaMart', scene: 'shop', shift: AFT_EVE, minAge: 16, stat: 'charm', difficulty: 10, promoMonths: 10,
    levels: L(['Cashier', 1800], ['Senior Associate', 2300], ['Store Manager', 3600]), gains: { charm: 0.4 }, flavor: ['Price check on aisle 7.', 'You survived a Black Friday.', 'Someone tried to return a half-eaten cake.'] },
  { id: 'waiter', name: 'Restaurant', icon: '🍝', track: 'entry', place: "Luigi's Trattoria", scene: 'diner', shift: AFT_EVE, minAge: 16, stat: 'charm', difficulty: 15, promoMonths: 10,
    levels: L(['Busser', 1600], ['Server', 2500], ['Head Server', 3200], ['Restaurant Manager', 4400]), gains: { charm: 0.6 }, flavor: ['Great tips tonight.', 'You dropped a tray of linguine.', 'A regular asked for you by name.'] },
  { id: 'warehouse', name: 'Warehouse', icon: '📦', track: 'entry', place: 'Logix Fulfillment', scene: 'warehouse', shift: DAY, minAge: 18, stat: 'fitness', difficulty: 10, promoMonths: 10,
    levels: L(['Picker', 2500], ['Forklift Operator', 3000], ['Shift Supervisor', 3900], ['Warehouse Manager', 5200]), gains: { fitness: 0.6, mood: -0.3 }, flavor: ['You hit your pick rate.', 'Forklift drifting is frowned upon.', 'Boxes. Boxes forever.'] },
  { id: 'construction', name: 'Construction', icon: '🏗️', track: 'entry', place: 'Ironclad Builders', scene: 'construction', shift: DAY, minAge: 18, stat: 'fitness', difficulty: 18, promoMonths: 12,
    levels: L(['Laborer', 2700], ['Carpenter', 3500], ['Foreman', 5000], ['Site Manager', 6800]), gains: { fitness: 0.9, health: -0.2 }, flavor: ['You poured a foundation.', 'Lunch on a steel beam.', 'Hard hats save lives. Yours, today.'] },
  { id: 'security', name: 'Security', icon: '🛡️', track: 'entry', place: 'Sentinel Security', scene: 'office', shift: ['night'], minAge: 18, stat: 'fitness', difficulty: 15, promoMonths: 12,
    levels: L(['Security Guard', 2400], ['Senior Guard', 3000], ['Security Chief', 4400]), gains: { fitness: 0.3, street: 0.2 }, flavor: ['Quiet night. Very quiet.', 'You caught a shoplifter.', 'Watched the cameras for 8 hours.'] },
  { id: 'bartender', name: 'Bartending', icon: '🍸', track: 'entry', place: 'The Rusty Anchor', scene: 'bar', shift: LATE, minAge: 18, stat: 'charm', difficulty: 18, promoMonths: 10,
    levels: L(['Barback', 1900], ['Bartender', 3100], ['Head Bartender', 3900], ['Bar Owner', 6800]), gains: { charm: 0.7, street: 0.2 }, flavor: ['You invented a cocktail.', 'Broke up a fight with a look.', 'Everyone tells you their secrets.'] },
  { id: 'janitor', name: 'Custodial', icon: '🧹', track: 'entry', place: 'City Offices', scene: 'office', shift: ['night'], minAge: 18, stat: 'fitness', difficulty: 3, promoMonths: 14,
    levels: L(['Janitor', 2100], ['Head Custodian', 2800]), gains: { smarts: 0.1 }, flavor: ['You found someone’s whiteboard math and solved it.', 'Mopped the 14th floor.', 'Silence and vacuum hum.'] },
  { id: 'trucker', name: 'Trucking', icon: '🚚', track: 'entry', place: 'Big Rig Haulers', scene: 'backroads', region: 'country', shift: DAY, minAge: 21, stat: 'fitness', difficulty: 15, promoMonths: 12,
    levels: L(['Driver', 3700], ['Senior Driver', 4600], ['Owner-Operator', 7200]), gains: { mood: -0.2 }, flavor: ['800 miles of highway.', 'Truck stop coffee, the best and worst.', 'You beat the delivery window.'] },

  // ---------- trades ----------
  { id: 'electrician', name: 'Electrician', icon: '⚡', track: 'trade', place: 'Volt Electric', scene: 'construction', shift: DAY, minAge: 18, stat: 'smarts', degree: ['trade_elec'], difficulty: 15, promoMonths: 14,
    levels: L(['Apprentice', 3100], ['Journeyman', 4900], ['Master Electrician', 7200], ['Contractor', 10500]), gains: { smarts: 0.4, fitness: 0.3 }, flavor: ['Rewired a whole office.', 'Zap. You’re fine.', 'Passed inspection first try.'] },
  { id: 'mechanic', name: 'Mechanic', icon: '🔧', track: 'trade', place: 'Torque Auto', scene: 'garage', shift: DAY, minAge: 18, stat: 'smarts', degree: ['trade_mech'], difficulty: 12, promoMonths: 14,
    levels: L(['Apprentice', 2800], ['Mechanic', 4300], ['Master Mechanic', 6000], ['Shop Owner', 9500]), gains: { smarts: 0.3, fitness: 0.3 }, flavor: ['Rebuilt a transmission.', 'Diagnosed that weird noise.', 'Oil under your fingernails forever.'] },
  { id: 'chef', name: 'Kitchen', icon: '👨‍🍳', track: 'trade', place: 'Maison Rouge', scene: 'diner', shift: AFT_EVE, minAge: 17, stat: 'creativity', degree: ['culinary'], difficulty: 20, promoMonths: 12,
    levels: L(['Line Cook', 2400], ['Sous Chef', 3800], ['Head Chef', 6500], ['Celebrity Chef', 16000]), gains: { creativity: 0.7 }, fame: 0.3, flavor: ['Yes, chef!', 'Your special sold out.', 'A critic loved your risotto.'] },

  // ---------- professional ----------
  { id: 'software', name: 'Software Engineering', icon: '💻', track: 'pro', place: 'Nimbus Tech', scene: 'office', shift: DAY, minAge: 18, stat: 'smarts', degree: ['ba_cs', 'selftaught'], difficulty: 45, promoMonths: 14,
    levels: L(['Junior Developer', 6200], ['Developer', 8800], ['Senior Developer', 12500], ['Staff Engineer', 17000], ['CTO', 26000]), gains: { smarts: 0.6, mood: -0.2 }, flavor: ['Shipped a feature. It broke prod.', 'Code review: 47 comments.', 'You fixed a bug from 2009.'] },
  { id: 'engineer', name: 'Engineering', icon: '⚙️', track: 'pro', place: 'Apex Dynamics', scene: 'office', shift: DAY, minAge: 21, stat: 'smarts', degree: ['ba_eng'], difficulty: 40, promoMonths: 16,
    levels: L(['Junior Engineer', 5600], ['Engineer', 7600], ['Senior Engineer', 10200], ['Principal Engineer', 14500]), gains: { smarts: 0.5 }, flavor: ['Your bridge design passed review.', 'CAD until your eyes blurred.', 'The prototype worked!'] },
  { id: 'finance', name: 'Finance', icon: '💹', track: 'pro', place: 'Goldstone Capital', scene: 'office', shift: DAY, minAge: 21, stat: 'smarts', degree: ['ba_bus', 'mba'], difficulty: 50, promoMonths: 16,
    levels: L(['Analyst', 6200], ['Associate', 9500], ['Vice President', 16000], ['Managing Director', 32000]), gains: { smarts: 0.4, mood: -0.4 }, flavor: ['90-hour week.', 'You closed a merger.', 'Spreadsheets in your dreams.'] },
  { id: 'marketing', name: 'Marketing', icon: '📣', track: 'pro', place: 'Brightside Agency', scene: 'office', shift: DAY, minAge: 21, stat: 'charm', degree: ['ba_bus', 'ba_arts', 'mba'], difficulty: 30, promoMonths: 14,
    levels: L(['Coordinator', 3900], ['Marketing Manager', 6100], ['Director', 10200], ['CMO', 18500]), gains: { charm: 0.5, creativity: 0.3 }, flavor: ['Your campaign went viral.', 'Brainstorm with too many sticky notes.', 'Pitched to a soda brand.'] },
  { id: 'teacher', name: 'Teaching', icon: '🍎', track: 'pro', place: 'Lincoln Middle School', scene: 'school', shift: DAY, minAge: 21, stat: 'charm', req: (g) => (g.s.education.degrees.some((d) => d.startsWith('ba_')) ? null : "Needs a bachelor's degree"), difficulty: 15, promoMonths: 18,
    levels: L(['Substitute', 2900], ['Teacher', 3900], ['Department Head', 4900], ['Principal', 6700]), gains: { charm: 0.4, smarts: 0.2, mood: 0.2 }, flavor: ['A kid said you changed their life.', 'Grading 120 essays.', 'Field trip chaos.'] },
  { id: 'journalist', name: 'Journalism', icon: '📰', track: 'pro', place: 'The Daily Ledger', scene: 'office', shift: AFT_EVE, minAge: 21, stat: 'creativity', degree: ['ba_arts', 'ba_law', 'ba_crim'], difficulty: 30, promoMonths: 14,
    levels: L(['Intern', 2100], ['Reporter', 3600], ['Senior Reporter', 5100], ['Editor-in-Chief', 9200]), gains: { creativity: 0.4, smarts: 0.3 }, fame: 0.2, flavor: ['You broke a story.', 'Deadline at midnight.', 'A source went silent.'] },
  { id: 'nurse', name: 'Nursing', icon: '💉', track: 'pro', place: 'St. Mary’s Hospital', scene: 'hospital', shift: ['afternoon', 'night'], minAge: 21, stat: 'smarts', degree: ['ba_med'], difficulty: 30, promoMonths: 16,
    levels: L(['Nurse', 5100], ['Senior Nurse', 6300], ['Head Nurse', 7800]), gains: { charm: 0.3, smarts: 0.3 }, flavor: ['12-hour shift.', 'You caught a doctor’s mistake.', 'A patient held your hand.'] },
  { id: 'fbi', name: 'Federal Agent', icon: '🕴️', track: 'pro', place: 'FBI Field Office', scene: 'police', shift: DAY, minAge: 23, stat: 'smarts', degree: ['ba_crim', 'jd', 'ba_law'], minStat: { fitness: 40 }, noRecord: true, difficulty: 55, promoMonths: 18,
    levels: L(['Agent Trainee', 4700], ['Special Agent', 6800], ['Senior Agent', 9300], ['Section Chief', 14500]), gains: { smarts: 0.3, fitness: 0.3, street: 0.3 }, flavor: ['Stakeout. Bad coffee.', 'Wiretap transcripts.', 'You closed in on a target.'] },
  { id: 'agronomist', name: 'Agronomy', icon: '🌱', track: 'pro', place: 'Valley Agri Co-op', scene: 'farm', region: 'country', shift: DAY, minAge: 21, stat: 'smarts', degree: ['ba_agri'], difficulty: 20, promoMonths: 14,
    levels: L(['Ag Technician', 3900], ['Agronomist', 5700], ['Farm Consultant', 8300]), gains: { smarts: 0.4 }, flavor: ['Soil samples galore.', 'You saved a crop from blight.', 'Drone survey of 2,000 acres.'] },

  // ---------- elite ----------
  { id: 'doctor', name: 'Medicine', icon: '⚕️', track: 'elite', place: 'St. Mary’s Hospital', scene: 'hospital', shift: DAY, minAge: 25, stat: 'smarts', degree: ['md'], difficulty: 30, promoMonths: 20,
    levels: L(['Intern', 5200], ['Resident', 6800], ['Attending Physician', 19000], ['Chief of Surgery', 34000]), gains: { smarts: 0.5, mood: -0.3 }, fame: 0.1, flavor: ['You saved a life today.', '36-hour shift.', 'A rare diagnosis — you nailed it.'] },
  { id: 'lawyer', name: 'Law', icon: '⚖️', track: 'elite', place: 'Sterling & Vance LLP', scene: 'office', shift: DAY, minAge: 24, stat: 'charm', degree: ['jd'], difficulty: 35, promoMonths: 20,
    levels: L(['Associate', 8200], ['Senior Associate', 12500], ['Partner', 26000], ['Name Partner', 48000]), gains: { charm: 0.4, smarts: 0.4 }, flavor: ['You won a motion.', 'Billed 14 hours.', 'Opposing counsel blinked first.'] },
  { id: 'professor', name: 'Academia', icon: '🧑‍🏫', track: 'elite', place: 'State University', scene: 'campus', shift: ['morning'], minAge: 26, stat: 'smarts', degree: ['phd'], difficulty: 45, promoMonths: 24,
    levels: L(['Postdoc', 4200], ['Assistant Professor', 6700], ['Professor', 9800], ['Dean', 14500]), gains: { smarts: 0.6 }, fame: 0.1, flavor: ['Your paper got accepted.', 'Office hours: nobody came.', 'A student cited you.'] },
  { id: 'scientist', name: 'Research Science', icon: '🧪', track: 'elite', place: 'Helix Labs', scene: 'office', shift: DAY, minAge: 26, stat: 'smarts', degree: ['phd', 'ms'], difficulty: 50, promoMonths: 20,
    levels: L(['Researcher', 6200], ['Senior Scientist', 9200], ['Lab Director', 14800], ['Chief Scientist', 22000]), gains: { smarts: 0.7 }, fame: 0.15, flavor: ['The experiment replicated!', 'Grant proposal submitted.', 'Eureka. Small one.'] },

  // ---------- service ----------
  { id: 'police', name: 'Police', icon: '🚓', track: 'service', place: 'Metro PD', scene: 'police', region: 'city', shift: AFT_EVE, minAge: 18, stat: 'fitness', degree: ['academy'], noRecord: true, difficulty: 10, promoMonths: 16,
    levels: L(['Patrol Officer', 4300], ['Sergeant', 5300], ['Detective', 6700], ['Captain', 8800], ['Commissioner', 13500]), gains: { fitness: 0.4, street: 0.4 }, flavor: ['Traffic stop went sideways.', 'You chased a suspect 6 blocks.', 'Paperwork. Mountains.'] },
  { id: 'deputy', name: 'Sheriff’s Office', icon: '⭐', track: 'service', place: 'County Sheriff', scene: 'police', region: 'country', shift: AFT_EVE, minAge: 18, stat: 'fitness', degree: ['academy'], noRecord: true, difficulty: 8, promoMonths: 18,
    levels: L(['Deputy', 3400], ['Senior Deputy', 4200], ['Undersheriff', 5200], ['Sheriff', 6800]), gains: { fitness: 0.3, street: 0.3 }, flavor: ['Cows on the highway again.', 'Busted a moonshine still.', 'Quiet county, long roads.'] },
  { id: 'army', name: 'Army', icon: '🎖️', track: 'service', place: 'Fort Steel', scene: 'base', shift: DAY, minAge: 18, maxAge: 35, stat: 'fitness', minStat: { fitness: 30 }, noRecord: true, difficulty: 5, promoMonths: 14,
    levels: L(['Private', 2500], ['Corporal', 3000], ['Sergeant', 3800], ['Lieutenant', 5000], ['Captain', 6500], ['Colonel', 9500]), gains: { fitness: 1, street: 0.2, mood: -0.2 }, flavor: ['5am run.', 'Field exercise in the mud.', 'You earned a commendation.'] },
  { id: 'firefighter', name: 'Fire Department', icon: '🚒', track: 'service', place: 'Station 12', scene: 'police', shift: DAY, minAge: 18, stat: 'fitness', minStat: { fitness: 50 }, difficulty: 25, promoMonths: 18,
    levels: L(['Probie', 3300], ['Firefighter', 4300], ['Lieutenant', 5600], ['Fire Chief', 8000]), gains: { fitness: 0.8, mood: 0.2 }, flavor: ['Pulled a kid from a fire.', 'Cat in a tree. Classic.', 'Chili night at the station.'] },

  // ---------- creative / fame ----------
  { id: 'musician', name: 'Music', icon: '🎸', track: 'creative', place: 'The Velvet Room', scene: 'club', shift: LATE, minAge: 15, stat: 'creativity', minStat: { creativity: 30 }, asset: 'guitar', difficulty: 30, promoMonths: 12,
    levels: L(['Busker', 600], ['Bar Musician', 1600], ['Signed Artist', 6500], ['Touring Star', 32000], ['Living Legend', 85000]), gains: { creativity: 0.8, charm: 0.3 }, fame: 1.2, flavor: ['The crowd sang along.', 'Wrote a song at 3am.', 'Broke a string mid-solo.'] },
  { id: 'streamer', name: 'Streaming', icon: '🎥', track: 'creative', place: 'Your Bedroom Studio', scene: 'home', shift: LATE, minAge: 14, stat: 'charm', minStat: { charm: 25 }, asset: 'laptop', difficulty: 25, promoMonths: 10,
    levels: L(['Small Streamer', 300], ['Partnered Creator', 2200], ['Influencer', 8500], ['Megastar', 42000]), gains: { charm: 0.5, creativity: 0.4 }, fame: 1.3, flavor: ['Chat spammed your catchphrase.', 'A clip went semi-viral.', '8-hour marathon stream.'] },
  { id: 'athlete', name: 'Pro Sports', icon: '🏆', track: 'creative', place: 'City Stadium', scene: 'stadium', shift: AFT_EVE, minAge: 18, maxAge: 30, stat: 'fitness', minStat: { fitness: 72 }, difficulty: 60, promoMonths: 12,
    levels: L(['Minor League', 3200], ['Pro Rookie', 16000], ['Starter', 52000], ['Superstar', 160000]), gains: { fitness: 1, health: -0.2 }, fame: 1.5, flavor: ['Game-winning play!', 'Two-a-day practice.', 'The crowd chanted your name.'] },
  { id: 'actor', name: 'Acting', icon: '🎬', track: 'creative', place: 'Silver Screen Studios', scene: 'studio', region: 'city', shift: DAY, minAge: 16, stat: 'charm', minStat: { looks: 45, charm: 45 }, difficulty: 55, promoMonths: 12,
    levels: L(['Extra', 1300], ['Bit-Part Actor', 3200], ['Supporting Actor', 13000], ['Leading Star', 65000]), gains: { charm: 0.5, looks: 0.2 }, fame: 1.5, flavor: ['You nailed a monologue.', 'Twelve hours for one scene.', 'Red carpet rehearsal.'] },
  { id: 'writer', name: 'Writing', icon: '✒️', track: 'creative', place: 'Your Desk', scene: 'library', shift: EVE, minAge: 16, stat: 'creativity', minStat: { creativity: 50 }, difficulty: 25, promoMonths: 14,
    levels: L(['Freelance Writer', 1300], ['Published Author', 3800], ['Bestselling Author', 16000]), gains: { creativity: 0.7, smarts: 0.3 }, fame: 0.6, flavor: ['2,000 words today.', 'Writer’s block. Ugh.', 'Fan mail!'] },

  // ---------- countryside ----------
  { id: 'farmer', name: 'Farming', icon: '🚜', track: 'country', place: 'Your Farm', scene: 'farm', region: 'country', shift: DAY, minAge: 18, stat: 'fitness', asset: 'farm', difficulty: 0, promoMonths: 18,
    levels: L(['Small Farmer', 2100], ['Farmer', 3700], ['Ranch Owner', 7400], ['Agri-Baron', 16000]), gains: { fitness: 0.7, mood: 0.2 }, flavor: ['Harvest came in strong.', 'Fixed the fence. Again.', 'A calf was born at midnight.'] },
  { id: 'fisher', name: 'Fishing', icon: '🎣', track: 'country', place: 'Hollow Lake Docks', scene: 'lake', region: 'country', shift: ['morning'], minAge: 16, stat: 'fitness', difficulty: 8, promoMonths: 14,
    levels: L(['Deckhand', 2000], ['Fisherman', 3100], ['Boat Captain', 5200]), gains: { fitness: 0.5, mood: 0.3 }, flavor: ['Big catch!', 'Nothing but weeds today.', 'Sunrise over still water.'] },

  // ---------- special (event-driven) ----------
  { id: 'founder', name: 'Startup Founder', icon: '🚀', track: 'special', hidden: true, place: 'Your Startup', scene: 'office', shift: DAY, minAge: 16, stat: 'smarts', difficulty: 0, promoMonths: 14,
    levels: L(['Pre-Seed Founder', 1500], ['Seed-Funded CEO', 5500], ['Series A CEO', 13000], ['Unicorn CEO', 55000], ['Tech Titan', 160000]), gains: { smarts: 0.5, charm: 0.4, mood: -0.3 }, fame: 0.8, flavor: ['Pitched 6 investors.', 'Product launch day!', 'Ramen for dinner. Again.'] },
];

export const CAREER_BY_ID: Record<string, CareerDef> = Object.fromEntries(CAREERS.map((c) => [c.id, c]));
