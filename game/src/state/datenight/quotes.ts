// Update 0.10 — what your date says back to each thing you do (shown in a speech bubble). Playful, never mean.

type Lines = { ok: string[]; fail: string[] };

export const QUOTES: Record<string, Lines> = {
  // shared
  talk: { ok: ['Okay, I could talk to you all night.', 'Wait, you too?! No way.'], fail: ['So… nice weather, huh.', 'Mm-hm. Cool.'] },
  compliment: { ok: ['Stop it… okay, don’t stop.', 'You’re making me blush, idiot~'], fail: ['Did you practise that in the mirror?', 'Uh… thanks? I think?'] },
  joke: { ok: ['HAHA — stop, people are staring!', 'Okay, that was actually funny.'], fail: ['I don’t get it.', 'Was that… a joke?'] },
  dreams: { ok: ['Nobody ever asks me that. Thank you.', 'Promise you won’t laugh? Okay…'], fail: ['That’s a bit deep for a first drink.', 'Can we keep it light tonight?'] },
  gaze: { ok: ['What? Why are you looking at me like that~', 'You! …just quieter next time you flirt~'], fail: ['Is there something on my face?', 'That’s… a lot of eye contact.'] },
  // restaurant
  wine: { ok: ['Ooh, you know your wine. Fancy~', 'To us? To us.'], fail: ['I think that one’s gone off…', 'I don’t really drink, actually.'] },
  dessert: { ok: ['Last bite’s mine. Fight me.', 'Sharing dessert? Bold move~'], fail: ['I’m kind of full, sorry.', 'You ate all the strawberries, idiot!'] },
  footsie: { ok: ['Hey! …do that again~', 'Under the table? Scandalous~'], fail: ['Idiot! That was my shin!', 'Ow— was that on purpose?!'] },
  toast: { ok: ['To you too. Really.', 'Okay, that was smooth.'], fail: ['Did you just spill wine on me?', 'That speech went on a bit…'] },
  // movies
  popcorn: { ok: ['Hands off the buttery bits~', 'Salty AND sweet? Marry me. Kidding!'], fail: ['You got popcorn in my hair!', 'Shh! The movie!'] },
  whisper: { ok: ['Stop, I’m going to laugh out loud!', 'Shh~ you’re terrible. Keep going.'], fail: ['Shh! I’m watching!', 'The whole row heard that.'] },
  arm: { ok: ['…Okay. This is nice.', 'Took you long enough~'], fail: ['Your elbow is in my ear.', 'The armrest is right there, you know.'] },
  scare: { ok: ['I wasn’t scared! …Don’t let go.', 'Hold on, I’m hiding behind you.'], fail: ['You screamed louder than me!', 'Personal space, please!'] },
  flirtdark: { ok: ['Shh… keep going~', 'Are you even watching the movie?'], fail: ['People can hear you, idiot!', 'Not during the good part!'] },
  brush: { ok: ['…Was that on purpose? Do it again.', 'Your hand is so warm~'], fail: ['You got butter on me!', 'Uh… excuse me?'] },
  backrow: { ok: ['The back row? Sneaky~', 'Much better view from here.'], fail: ['I can’t see anything back here.', 'Why are we moving?'] },
  snoop: { ok: ['Like it? I cleaned. For you~', 'Don’t look in that drawer!'], fail: ['Hey, that’s private!', 'Stop judging my plants!'] },
  // gym (Update 0.11)
  lift: { ok: ['Okay, those arms~', 'Same time next week? Deal.'], fail: ['Bend your knees, idiot!', 'Are you okay?! That clanged.'] },
  spot: { ok: ['I feel safe with you spotting me~', 'Your hands were right there. Thanks~'], fail: ['You were on your phone!', 'I almost dropped it on my face!'] },
  treadmill: { ok: ['You’re fast! …I let you win.', 'Again! Loser buys smoothies!'], fail: ['You fell off the treadmill!', 'I’m dying. You’re dying. Stop.'] },
  stretch: { ok: ['Okay, this is… a lot of eye contact~', 'You’re flexible. Noted~'], fail: ['OW. Too far!', 'Personal space!'] },
  shake: { ok: ['Chocolate? You know me.', 'Gains together~'], fail: ['It’s chalky…', 'Is that… broccoli flavour?'] },
  // gala
  slowdance: { ok: ['You can actually dance?!', 'Don’t step on my— wow. Okay.'], fail: ['Idiot! My foot!', 'Let’s just… sit this one out.'] },
  champagne: { ok: ['Bubbles go straight to my head~', 'This is so fancy. I love it.'], fail: ['It went up my nose!', 'Too many bubbles…'] },
  vips: { ok: ['You know the MAYOR?!', 'Okay, I’m impressed. Very.'], fail: ['Who was that? They ignored us.', 'That was so awkward.'] },
  balcony: { ok: ['The stars are out just for us~', 'I never want to go back inside.'], fail: ['It’s freezing out here!', 'Is that a pigeon?'] },
  // concert
  singalong: { ok: ['You know ALL the words?!', 'Okay, we’re a duet now.'], fail: ['You’re… off-key. Very.', 'My ears, idiot!'] },
  sway: { ok: ['This is our song now~', 'Just… stay like this.'], fail: ['You’re swaying to a different song.', 'Too close, too sweaty!'] },
  front: { ok: ['WE’RE SO CLOSE!', 'Best. Spot. Ever.'], fail: ['I lost a shoe back there!', 'I can’t breathe in here!'] },
  merch: { ok: ['You got me the shirt?! Wearing it now.', 'Okay, you’re officially my favourite.'], fail: ['It’s… three sizes too big.', 'I already have this one.'] },
  // park
  walk: { ok: ['I could walk with you forever.', 'Slow down, I want this to last.'], fail: ['My feet hurt…', 'Are we lost?'] },
  ducks: { ok: ['Look, that one likes you!', 'This is the cutest date ever.'], fail: ['It bit me!', 'You threw bread at the duck’s head.'] },
  fountain: { ok: ['Make a wish. Don’t tell me~', 'It’s so peaceful here.'], fail: ['You splashed me!', 'It smells kind of weird here.'] },
  flower: { ok: ['For me? …I’m keeping it forever.', 'You’re so sweet. Ugh~'], fail: ['That was someone’s garden!', 'Achoo— I’m allergic!'] },
  // arcade
  plushie: { ok: ['YOU WON IT?! I’m naming it after you.', 'My hero~'], fail: ['The claw is rigged anyway.', 'That’s twenty dollars gone, idiot!'] },
  booth: { ok: ['We look so cute!', 'Again, again! Silly faces this time!'], fail: ['You blinked in all four!', 'I look terrible in that one.'] },
  hockey: { ok: ['Rematch! Now!', 'You’re going down~'], fail: ['You hit my finger!', 'Okay, I’m bored now.'] },
  dancegame: { ok: ['Those moves! Who ARE you?', 'High score! We’re a team.'], fail: ['You fell off the machine!', 'Everyone’s watching…'] },
  // beach
  swim: { ok: ['Race you to the buoy!', 'The water’s perfect.'], fail: ['It’s FREEZING!', 'Something touched my foot!'] },
  sandcastle: { ok: ['It’s a castle for two~', 'You’re weirdly good at this.'], fail: ['The wave took it.', 'Is that a castle or a lump?'] },
  splash: { ok: ['Oh, it’s ON!', 'You’re dead— come here!'], fail: ['My hair! Idiot!', 'Not the face!'] },
  sunset: { ok: ['I’ll remember this forever.', 'This is perfect. You’re perfect.'], fail: ['Clouds. Of course.', 'I’ve got sand everywhere.'] },
  // picnic
  clouds: { ok: ['That one’s a heart. Look~', 'That one looks like you!'], fail: ['It’s just… clouds.', 'Is that a raincloud?'] },
  strawberries: { ok: ['Feed me another~', 'You’re ridiculous. Again.'], fail: ['You poked my nose with it!', 'Ants. Everywhere. Ants.'] },
  poem: { ok: ['You wrote that? For me?', 'Read it again. Slower.'], fail: ['Did that rhyme “love” with “glove”?', 'That was… a lot.'] },
  // mini-golf
  bet: { ok: ['Loser buys dinner. Deal~', 'Oh, you’re on.'], fail: ['You’re so competitive.', 'This isn’t fun anymore.'] },
  trick: { ok: ['NO WAY. Do it again!', 'Okay, show-off~'], fail: ['It went in the pond.', 'You hit the windmill. And me.'] },
  letwin: { ok: ['I totally won that fair and square~', 'You let me win, didn’t you? Cute.'], fail: ['You’re being obvious.', 'Try a little at least!'] },
  // your place
  tour: { ok: ['Your place is so cute!', 'Is that a photo of you as a kid?!'], fail: ['Is that… laundry?', 'You live HERE?'] },
  cook: { ok: ['You can COOK?', 'This is better than the restaurant.'], fail: ['Is it supposed to be on fire?', 'It’s a bit… crunchy.'] },
  takeout: { ok: ['Perfect choice, honestly.', 'Lazy and romantic. I love it.'], fail: ['They forgot the sauce.', 'It’s cold already.'] },
  couch: { ok: ['Blanket? Blanket.', 'I’m not even watching the movie~'], fail: ['I’ve seen this one. Three times.', 'Can I pick next time?'] },
  cuddle: { ok: ['Mmm. Stay.', 'You’re so warm.'], fail: ['Too hot. Too hot.', 'Your elbow, idiot!'] },
  boardgame: { ok: ['I’m winning. Admit it~', 'One more round!'], fail: ['You cheated!', 'I hate this game.'] },
  kitchen: { ok: ['Dancing in socks? Perfect.', 'Spin me again~'], fail: ['I slipped on the tiles!', 'There’s no music, idiot.'] },
  bottle: { ok: ['Good taste~', 'Pour me another?'], fail: ['The cork broke in it.', 'That’s vinegar now.'] },
  // moments
  hands: { ok: ['Your hand’s warm~', 'Don’t let go.'], fail: [''] },
  kiss: { ok: ['…Do that again.', 'Took you long enough~'], fail: [''] },
  french: { ok: ['Wow. Okay. Wow.', 'I forgot where we are.'], fail: [''] },
};

export function quoteFor(id: string, ok: boolean): string {
  const q = QUOTES[id];
  if (!q) return ok ? 'That was lovely.' : 'Hmm.';
  const pool = ok ? q.ok : q.fail;
  return pool[Math.floor(Math.random() * pool.length)];
}
