export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'diploma', name: 'Diploma Holder', icon: '📜', desc: 'Graduate high school.' },
  { id: 'valedictorian', name: 'Valedictorian', icon: '🥇', desc: 'Graduate any program with 3.7+ GPA.' },
  { id: 'scholar', name: 'Full Ride', icon: '🎟️', desc: 'Earn a full scholarship.' },
  { id: 'doctorate', name: 'Dr. Smartypants', icon: '🔬', desc: 'Earn a PhD.' },
  { id: 'doctor', name: 'Is There a Doctor?', icon: '⚕️', desc: 'Earn an M.D.' },
  { id: 'lawyer', name: 'Objection!', icon: '⚖️', desc: 'Earn a J.D.' },
  { id: 'scholar3', name: 'Eternal Student', icon: '📚', desc: 'Hold 3+ higher degrees.' },
  { id: 'bigbrain', name: 'Galaxy Brain', icon: '🧠', desc: 'Reach 95 Smarts.' },
  { id: 'dropout', name: 'Dropout', icon: '🚪', desc: 'Get expelled from school.' },
  { id: 'firstjob', name: 'Working Class', icon: '💼', desc: 'Get your first job.' },
  { id: 'topjob', name: 'Top of the Ladder', icon: '🏔️', desc: 'Reach the highest rank in a career.' },
  { id: 'commissioner', name: 'Top Cop', icon: '🚔', desc: 'Become Police Commissioner.' },
  { id: 'founder', name: 'Founder Mode', icon: '🚀', desc: 'Start a company.' },
  { id: 'unicorn', name: 'Unicorn', icon: '🦄', desc: 'Take your startup public.' },
  { id: 'nobel', name: 'Laureate', icon: '🏅', desc: 'Win the Nobel Prize.' },
  { id: 'famous', name: 'Household Name', icon: '🌟', desc: 'Reach 80 Fame.' },
  { id: 'millionaire', name: 'Millionaire', icon: '💰', desc: 'Net worth $1,000,000.' },
  { id: 'billionaire', name: 'Billionaire', icon: '🤑', desc: 'Net worth $1,000,000,000.' },
  { id: 'baller', name: 'Baller', icon: '🛥️', desc: 'Buy a seven-figure toy.' },
  { id: 'mansion', name: 'Lord of the Manor', icon: '🏰', desc: 'Move into a mansion.' },
  { id: 'debtfree', name: 'Debt Free', icon: '🕊️', desc: 'Pay off all your debt.' },
  { id: 'jackpot', name: 'Jackpot!', icon: '🎰', desc: 'Win the lottery or a casino jackpot.' },
  { id: 'firstcrime', name: 'First Offense', icon: '😈', desc: 'Commit your first crime.' },
  { id: 'juvie', name: 'Juvie Kid', icon: '🧒', desc: 'Get sent to juvenile hall.' },
  { id: 'jailbird', name: 'Jailbird', icon: '⛓️', desc: 'Get sentenced to prison.' },
  { id: 'escape', name: 'Shawshank', icon: '🕳️', desc: 'Escape from prison.' },
  { id: 'careercriminal', name: 'Career Criminal', icon: '📁', desc: '3+ convictions.' },
  { id: 'gang', name: 'Jumped In', icon: '🐍', desc: 'Join a gang.' },
  { id: 'kingpin', name: 'Kingpin', icon: '👑', desc: 'Lead a gang.' },
  { id: 'family', name: 'Friend of Ours', icon: '🌹', desc: 'Join the Mafia.' },
  { id: 'made', name: 'Made Man', icon: '🩸', desc: 'Take the oath of omertà.' },
  { id: 'don', name: 'The Godfather', icon: '🎩', desc: 'Become Don of the Moretti Family.' },
  { id: 'heist', name: 'Ocean’s One', icon: '🏦', desc: 'Pull off a major heist.' },
  { id: 'rat', name: 'Rat', icon: '🐀', desc: 'Become a federal informant.' },
  { id: 'saint', name: 'Saint', icon: '😇', desc: 'Reach 80 Karma.' },
  { id: 'monster', name: 'Monster', icon: '👹', desc: 'Reach -80 Karma.' },
  { id: 'peak', name: 'Peak Human', icon: '🏋️', desc: 'Reach 95 Fitness.' },
  { id: 'married', name: 'Just Married', icon: '💍', desc: 'Get married.' },
  { id: 'parent', name: 'Parenthood', icon: '👶', desc: 'Have a child.' },
  { id: 'bigfamily', name: 'Full House', icon: '👨‍👩‍👧‍👦', desc: 'Have 3+ children.' },
  { id: 'centenarian', name: 'Centenarian', icon: '🎂', desc: 'Live to 100.' },
  { id: 'legacy', name: 'Legacy', icon: '🧬', desc: 'Continue life as your child.' },
  { id: 'citymouse', name: 'City Mouse', icon: '🏙️', desc: 'Move from the countryside to the city.' },
  { id: 'countrymouse', name: 'Country Mouse', icon: '🌾', desc: 'Move from the city to the countryside.' },
  { id: 'hero', name: 'Real Hero', icon: '🦸', desc: 'Save someone’s life.' },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
