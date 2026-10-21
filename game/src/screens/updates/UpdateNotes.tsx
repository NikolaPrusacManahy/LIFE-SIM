import { Modal } from '../../components/Modal';

type Card = [icon: string, title: string, lines: string[]];

const UPDATES: [string, Card[]][] = [
  [
    'Update 0.11 — START-UP',
    [
      ['🚀', 'Start a real company', ['Computer → START-UP. Pick an idea, name it,', 'put in your own money. Starts in your bedroom.']],
      ['💼', 'It pays you', ['Profitable months pay you a dividend:', '25% of profit × your share, taxed 25%.']],
      ['👥', 'Build the team', ['Employees, supervisors, a manager, head of HR.', 'Room → office → facility → HQ → skyscraper.']],
      ['🦈', 'Investors', ['Angels, VCs, mega funds. Cash for a share.', 'Safe pitch is easy to fund, moonshot has the higher ceiling.']],
      ['🌳', 'Skill tree', ['Profit, speed, payroll, pitch.', 'Three red months in a row and it folds.']],
      ['🕊️', 'Diplomatic', ['$1B and a skyscraper: police and scandals', 'can’t touch you anymore. For life.']],
      ['🏋️', 'Gym & movie dates', ['Gym: lift together, spot them, locker room or home.', 'Movies: flirt in the dark, the back row — no restroom.']],
      ['😏', 'Make a move on a friend', ['Same date scene, but harder:', '+10 spark per moment, and they can dodge the kiss.']],
      ['🏡', 'They ask you', ['Partners text: movie tonight? come over? my place?', 'In love (80+): they pick where & how. Spouses: you can ask.']],
      ['🎓', 'School stays in school', ['No school events or school rivals after you leave.']],
      ['💉', 'Stats on steroids', ['Computer app: $100 / €100 per stat level, up to 100.', 'Max health & energy up to 300. Karma isn’t for sale.']],
      ['😴', 'Sleep', ['A night in your bed fills the whole energy bar.']],
    ],
  ],
  [
    'Update 0.10 — Date Night',
    [
      ['🕯️', 'Dates are a scene', ['Raise the spark with actions. Romantic dates only.', 'Your date reacts out loud: “Idiot! That was my shin!”']],
      ['🍝', 'Every venue differs', ['Restaurant, movies, gala, concert, park, arcade,', 'beach, picnic, mini-golf, dinner at home.']],
      ['💋', 'Moments', ['Hold hands → kiss → French kiss →', 'your place, or the restroom if it’s love (0.11: not at the movies).']],
      ['🏠', 'Your place', ['Invite them over (or text “Come over?”).', 'Calm night in, or the bedroom. Nicer home = better odds.']],
      ['💶', 'Euros', ['EU lives show prices in € (1 € = 1.12 $).']],
      ['⏰', 'Tonight means tonight', ['Say yes in the evening or at night: it starts now.', 'In the morning: this evening, same day.']],
      ['🛡️', 'Your call', ['Condom or not. Intimacy: big romance boost.', 'Adults, Mature on, not too drunk.']],
    ],
  ],
  [
    'Update 0.9 — Free Time',
    [
      ['⏱️', 'Free actions', ['Computers and most profile actions take no time:', 'once per time of day. Outings still do (⏱).']],
      ['🌅', 'Nights out', ['Partying into the morning? You wake up rested —', 'or at half energy if you got drunk.']],
      ['💘', 'Real faces on Spark', ['Dating profiles show who you’ll actually meet.']],
      ['🌙', 'Their place', ['Reach Flirty on a night out → go back to their place.', 'Sober or tipsy: condom or not. Drunk: they’re furious next day.']],
      ['💾', '5 save slots', ['Continue any saved life. New lives pick a slot', '(hold to overwrite). Still autosaves.']],
    ],
  ],
  [
    'Update 0.8 — Connected',
    [
      ['💬', 'Real conversations', ['Reply to what they actually said.', 'Your bubble, their reaction, effects inline.']],
      ['📅', 'Plans', ['Accept an invite → it happens in that slot.', 'Partners ask you out. Standing people up hurts.']],
      ['🧾', 'One thing at a time', ['Every action ends on a result card.', 'Events and texts wait until you’re done.']],
      ['🔔', 'Notifications', ['Number badges, banners, a notification centre.', '10 texts per person per month.']],
      ['🖥️', 'Computers', ['Doors desktop: JobHunt, ViewTube, Twitchy, Chirp,', 'Nile, Discorb, 7 mini-games and more.']],
      ['🔧', 'Build a PC', ['Fictional parts, real compatibility.', 'Forget the thermal paste at your peril.']],
      ['🪩', 'Nights out', ['Walk up to people, chat, dance, drink, darts.', 'Too drunk = cab home, not your place.']],
    ],
  ],
  [
    'Update 0.7 — New Faces',
    [
      ['🧑‍🎨', 'New portraits', ['Avataaars faces everywhere: chats, contacts,', 'events, the news. Built from your look.']],
      ['😊', 'Moods show', ['Happy people smile, sad people look it.']],
      ['♀️', 'Women look like women', ['Every hairstyle and outfit fits the body.', 'Heirs keep their own body, not the parent’s.']],
    ],
  ],
  [
    'Update 0.6 — Ascension',
    [
      ['⚡', 'Born a god', ['New creator option. Immortal, untouchable,', 'every stat and your wallet maxed. The world still reacts.']],
      ['🔥', 'Powers', ['Fly, feats of strength, fireballs, supernovas,', 'answer prayers, gather worshippers.']],
      ['🌋', 'Level the city', ['Evacuated first — nobody dies.', 'Ruins for two years, then rebuilt.']],
      ['👑', 'Your circle', ['Date several adults at once, no secrets.', 'Each partner decides for themselves.']],
      ['🛡️', 'Still never', ['Smite is adults only and needs Dark Crime.', 'No power makes anyone love you.']],
    ],
  ],
  [
    'Update 0.5.1 — Fresh Start',
    [
      ['🔑', 'Start at 23', ['Skip high school: diploma, phone, shared flat.']],
      ['💎', 'Millionaire start', ['+$1,000,000 trust fund. Any age.']],
      ['🇪🇺', 'US or EU laws', ['EU: drink, gamble and smoke at 18, drive at 18,', 'cheap college, no proof-of-income rule.']],
      ['🪢', 'Full kit', ['Restraints + sedative = a sure thing.']],
      ['🔊', 'Sound', ['Music, clicks, texts, notifications.', 'Music / sound toggles in Settings.']],
    ],
  ],
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
