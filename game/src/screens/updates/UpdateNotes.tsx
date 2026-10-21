import { Modal } from '../../components/Modal';

type Card = [icon: string, title: string, lines: string[]];

const UPDATES: [string, Card[]][] = [
  [
    'Update 0.5 — Underworld',
    [
      ['🗡️', 'Crime tiers', ['Petty, property, organised, violent. 18+ only.', 'Dark Crime toggle in Settings. Minors are never targets.']],
      ['🧽', 'Cover-ups', ['After a serious crime: spend limited actions on clues.', 'Whatever you miss becomes evidence.']],
      ['🕵️', 'Investigations', ['A detective with a personality works your case.', 'Wanted stars, interviews, court, cold cases.']],
      ['🚨', 'On the run', ['★★★★ = manhunt. Hide, disguise, flee the country.', 'Turning yourself in is always an option.']],
      ['🕶️', 'The Back Room', ['Gear, burners, fake passports. Properties, crew,', 'the business, laundering, heists.']],
      ['💬', 'Real messenger', ['Chat bubbles, typing, reactions, group chats.', '3 texts per chat per slot. Free.']],
      ['📵', 'Digital trail', ['Shady texts become evidence — unless from a burner.']],
      ['🔊', 'Sound', ['Background music, clicks, texts, notifications.', 'Music / sound toggles in Settings.']],
      ['🛡️', 'Hard lines', ['Crime and intimacy never mix. Blackmail is never sexual.', 'Private photos: adults only, never shown.']],
    ],
  ],
  [
    'Update 0.4 — People',
    [
      ['🪪', 'Who is this?', ['Every NPC has a face, gender, pronouns, age and label.', 'Person chips everywhere.']],
      ['🧬', 'New creator', ['Pronouns (custom too), sexuality, female model,', '12 hairstyles, height, build, freckles, glasses.']],
      ['👋', 'Encounters', ['Meet people based on where you are and your age.', 'Stat-based openers, ask for numbers.']],
      ['📱', 'Texts', ['Invites, memes, drama, birthdays. Reply or lose touch.', 'Fake numbers bounce.']],
      ['🔍', 'Hidden traits', ['40+ traits revealed by spending time together.']],
      ['🍎', 'Teachers & professors', ['Help, extra credit, recommendation letters.', 'Teachers are never romance options.']],
      ['🎒', 'Bag', ['Gifts, rings, condoms, contraband.', 'Searches confiscate illegal items.']],
      ['💞', 'Relationships', ['Friendship & romance tracks, rivals, FWB, exes.', '18+ college life — adults only, non-explicit.']],
    ],
  ],
  [
    'Update 0.3 — Coming of Age',
    [
      ['⚖️', 'US rules', ['Real legal ages: 21 to drink, 18 to sign a lease…', 'Locked cards say why.']],
      ['🚨', 'Juvenile system', ['Minors get grounded, community service, juvie.', 'Record sealed at 18 (unless serious).']],
      ['🏫', 'New places', ['Driving school, community college, clinic,', 'casino, airport, recruiting, rehab.']],
      ['🎭', 'Teen life', ['SAT, prom, student council, sneaking out,', 'cheating, vaping, fake IDs.']],
      ['💘', 'Adult relationships', ['18+ only, both people. Non-explicit.', 'Consent, protection, real consequences.']],
      ['🌀', 'Habits', ['Alcohol, nicotine and gambling meters.', 'Cravings, rehab, relapse.']],
      ['📊', 'New layout', ['All stats on the left, actions dock below.', 'Month summary after Next month.']],
      ['📱', 'Phone apps', ['Spark dating app (18+), Diary filters,', 'Mature Content toggle in Settings.']],
    ],
  ],
  [
    'Update 0.2 — Bright Lights',
    [
      ['🎨', 'New look', ['Clean floating cards, rounded type, pastel icons.']],
      ['🌆', 'Deeper world', ['Layered parallax skyline & hills.', 'Lights sit at the right depth.']],
      ['✨', 'Living scenes', ['Traffic with headlights, birds, fireflies, leaves.', 'Wet streets reflect light in the rain.']],
      ['🧍', 'New avatar', ['Outlined, shaded, more expressive.']],
      ['📱', 'Your phone', ['Teens need a yes from either parent.', 'Apps: jobs, school, shop, bank and more, anywhere.']],
      ['📓', 'Journal', ['No phone? People, stats and diary still work.', 'Job Center, Bank etc. work in person.']],
    ],
  ],
  [
    'Update 0.1 — First Breath',
    [
      ['🌅', 'Live a whole life', ['Start at 14. Four time slots a month.', 'Age, retire, die — or continue as your child.']],
      ['🏫', 'School & degrees', ['High school, 8 majors, grad school, trades, police academy.']],
      ['💼', '40 careers', ['Promotions, warnings, firing, retirement.']],
      ['❤️', 'People & money', ['Friends, marriage, kids. Rent, debt, homes, cars.']],
    ],
  ],
];

export function UpdateNotes({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="upd-card">
      <h3 className="evt-title">What’s new</h3>
      {UPDATES.map(([ver, cards]) => (
        <div key={ver}>
          <div className="upd-ver">{ver}</div>
          <div className="upd-grid">
            {cards.map(([icon, title, lines]) => (
              <div key={title} className="upd-item">
                <b>{icon} {title}</b>
                {lines.map((l) => <small key={l}>{l}</small>)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
