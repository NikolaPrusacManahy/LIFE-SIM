// Update 0.13 — conversation duel: 3 rounds, pick the line that fits. Each line moves the mood bar (−1 … +2).

export interface Round { prompt: string; lines: [string, number][] }

const R = (prompt: string, ...lines: [string, number][]): Round => ({ prompt, lines });

export const DUELS: Record<string, Round[]> = {
  debate: [
    R('The other team says your plan costs too much.', ['Show the numbers: it pays for itself.', 2], ['That’s just your opinion.', -1], ['Money isn’t everything!', 0]),
    R('The judge asks for evidence.', ['Cite the study and the source.', 2], ['Everyone knows it’s true.', -1], ['I read it somewhere…', 0]),
    R('Closing statement.', ['Sum up three points, calmly.', 2], ['Attack the other speaker.', -1], ['Repeat your opening.', 0]),
  ],
  campaign: [
    R('A student asks what you’ll actually change.', ['Longer lunch and a fixed vending machine.', 2], ['Everything!', 0], ['Vote for me and find out.', -1]),
    R('Your rival made a joke about you.', ['Laugh it off and get back to the plan.', 2], ['Make a meaner joke.', -1], ['Ignore it awkwardly.', 0]),
    R('The final speech.', ['Name real problems and real fixes.', 2], ['Promise free pizza forever.', 0], ['Read a long list of rules.', -1]),
  ],
  network: [
    R('A senior manager is at the coffee machine.', ['Ask about the project they’re leading.', 2], ['Complain about your workload.', -1], ['Talk about the weather.', 0]),
    R('They ask what you do.', ['One clear sentence and a recent win.', 2], ['A ten-minute life story.', -1], ['“Oh, this and that.”', 0]),
    R('The chat is ending.', ['Offer to help on their project.', 2], ['Ask for a raise.', -1], ['“Well… bye.”', 0]),
  ],
  books: [
    R('What did you think of the ending?', ['It mirrors the first chapter — that’s the point.', 2], ['I didn’t finish it.', -1], ['It was fine.', 0]),
    R('Someone says the main character is unlikeable.', ['Unlikeable, but honest — that’s why it works.', 2], ['You’re wrong.', -1], ['Yeah, maybe.', 0]),
    R('Pick the next book.', ['Suggest one the group will argue about.', 2], ['Suggest your own diary.', -1], ['“Whatever you want.”', 0]),
  ],
  therapy: [
    R('“How have you been, really?”', ['Honestly? Tired, and a bit lost.', 2], ['Fine. Totally fine.', -1], ['Busy.', 0]),
    R('“What’s weighing on you most?”', ['Name the thing you’ve been avoiding.', 2], ['Change the subject.', -1], ['Talk about someone else’s problem.', 0]),
    R('“What could you try this week?”', ['One small, real step.', 2], ['Fix my whole life by Friday.', 0], ['Nothing will help.', -1]),
  ],
  yard: [
    R('Someone takes your spot at the table.', ['Stand your ground, calm and quiet.', 2], ['Start a fight in front of the guards.', -1], ['Find another spot.', 0]),
    R('A crew offers you a favour.', ['Ask what it costs first.', 2], ['Accept without asking.', -1], ['Laugh at them.', -1]),
    R('An old-timer gives you advice.', ['Listen and thank him.', 2], ['Say you don’t need it.', -1], ['Nod and walk off.', 0]),
  ],
  confess: [
    R('“What would you like to confess?”', ['Say it plainly, no excuses.', 2], ['Blame someone else.', -1], ['Say something small instead.', 0]),
    R('“Do you regret it?”', ['Yes. I want to do better.', 2], ['Not really.', -1], ['I don’t know.', 0]),
    R('“How will you make it right?”', ['Apologise to the person I hurt.', 2], ['I won’t.', -1], ['Pray about it.', 1]),
  ],
  youth: [
    R('The group talks about a hard week someone had.', ['Share your own hard week too.', 2], ['Check your phone.', -1], ['Say “that sucks”.', 0]),
    R('Someone new looks nervous.', ['Sit next to them and say hi.', 2], ['Ignore them.', -1], ['Wave from far away.', 0]),
    R('Planning a charity day.', ['Volunteer to organise it.', 2], ['Say you’re too busy.', -1], ['Say you’ll “see”.', 0]),
  ],
  drama: [
    R('Line: “You left without a word!” — how?', ['Hurt, voice breaking.', 2], ['Bored, flat.', -1], ['Laughing.', 0]),
    R('Line: “We did it! We actually did it!”', ['Overjoyed, jumping.', 2], ['Whispered, scared.', 0], ['Angry.', -1]),
    R('Line: “Someone is in the house…”', ['Quiet, terrified.', 2], ['Shouted, cheerful.', -1], ['Normal voice.', 0]),
  ],
};

export function duelRounds(skin: string): Round[] {
  return DUELS[skin] ?? DUELS.network;
}

/** Sum of the chosen lines over the best possible. */
export function duelScore(points: number[], rounds: Round[]) {
  const best = rounds.reduce((a, r) => a + Math.max(...r.lines.map((l) => l[1])), 0);
  return best ? Math.max(0, points.reduce((a, b) => a + b, 0)) / best : 0;
}
