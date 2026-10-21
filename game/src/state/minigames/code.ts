import type { Game } from '../Game';
// Update 0.12 — guided coding lessons: follow the instructions, fill in the missing code, build.
// C++ in a Visual Studio-like editor (purple), Python (yellow), HTML/JS in a VS Code-like editor (blue).

// Final touch — Java (IntelliJ, orange), C# (Rider, green), Rust (RustRover, rust red); 4 projects per language.
export type Lang = 'cpp' | 'python' | 'web' | 'java' | 'csharp' | 'rust';

export const LANGS: Record<Lang, { name: string; ide: string; icon: string; file: string }> = {
  cpp: { name: 'C++', ide: 'Visual Studio', icon: '🟣', file: 'main.cpp' },
  python: { name: 'Python', ide: 'PyCharm', icon: '🐍', file: 'main.py' },
  web: { name: 'HTML / JS', ide: 'VS Code', icon: '🌐', file: 'index.html' },
  java: { name: 'Java', ide: 'IntelliJ IDEA', icon: '☕', file: 'Main.java' },
  csharp: { name: 'C#', ide: 'Rider', icon: '🎯', file: 'Program.cs' },
  rust: { name: 'Rust', ide: 'RustRover', icon: '🦀', file: 'main.rs' },
};
export const LANG_ORDER: Lang[] = ['cpp', 'python', 'web', 'java', 'csharp', 'rust'];

/** A line of code: plain text, or text with one blank the player fills in. */
export interface CodeLine { before: string; blank?: { answer: string; hint: string }; after?: string }
export interface Project { id: string; lang: Lang; name: string; goal: string; lines: CodeLine[]; output: string }

const L = (before: string, answer?: string, hint?: string, after = ''): CodeLine => (answer ? { before, blank: { answer, hint: hint ?? '' }, after } : { before });

export const PROJECTS: Project[] = [
  {
    id: 'cpp_loop', lang: 'cpp', name: 'Game loop', goal: 'Make a game that keeps running until the player quits.', output: 'Frame 1… Frame 2… Frame 3… Game over. Thanks for playing!',
    lines: [
      L('#include <iostream>'),
      L(''),
      L('int ', 'main', 'Every C++ program starts in the function called main', '() {'),
      L('    bool running = ', 'true', 'The game starts running: set it to true', ';'),
      L('    int frame = 0;'),
      L('    ', 'while', 'Loop as long as running is true: use the while keyword', ' (running) {'),
      L('        frame++;'),
      L('        std::cout << "Frame " << frame << std::endl;'),
      L('        if (frame == 3) running = ', 'false', 'Stop the loop after 3 frames', ';'),
      L('    }'),
      L('    ', 'return', 'End main by returning 0', ' 0;'),
      L('}'),
    ],
  },
  {
    id: 'cpp_player', lang: 'cpp', name: 'Player health', goal: 'Give the player health that goes down when hit.', output: 'Player HP: 100 → hit! → HP: 75',
    lines: [
      L('struct ', 'Player', 'Name the struct Player', ' {'),
      L('    int hp = ', '100', 'The player starts with 100 health', ';'),
      L('    void hit(int dmg) { hp ', '-=', 'Subtract the damage from hp (use -=)', ' dmg; }'),
      L('};'),
      L(''),
      L('Player p;'),
      L('p.', 'hit', 'Call the hit function', '(25);'),
    ],
  },
  {
    id: 'py_guess', lang: 'python', name: 'Guess the number', goal: 'A game where you guess a secret number.', output: 'Guess: 7 … Too low! Guess: 9 … You got it! 🎉',
    lines: [
      L('import ', 'random', 'Import the random module', ''),
      L(''),
      L('secret = random.randint(1, 10)'),
      L('', 'while', 'Keep asking: start a while loop', ' True:'),
      L('    guess = int(', 'input', 'Read what the player types with input()', '("Guess: "))'),
      L('    if guess == secret:'),
      L('        ', 'print', 'Show a message with print()', '("You got it!")'),
      L('        ', 'break', 'Leave the loop with break', ''),
    ],
  },
  {
    id: 'py_todo', lang: 'python', name: 'To-do list', goal: 'Store tasks in a list and show them.', output: '1. buy milk  2. finish homework  3. call mom',
    lines: [
      L('tasks = ', '[]', 'Start with an empty list: []', ''),
      L('tasks.', 'append', 'Add a task with append', '("buy milk")'),
      L('', 'for', 'Loop over the list with for', ' i, t in enumerate(tasks, 1):'),
      L('    print(f"{i}. {', 't', 'Print the task variable t', '}")'),
    ],
  },
  {
    id: 'web_counter', lang: 'web', name: 'Click counter', goal: 'A button that counts your clicks.', output: '[ Clicked 3 times ]',
    lines: [
      L('<', 'button', 'Make a button element', ' id="btn">Click me</button>'),
      L('<script>'),
      L('  ', 'let', 'Declare a changing variable with let', ' clicks = 0;'),
      L('  const btn = document.', 'getElementById', 'Find the button by its id', '("btn");'),
      L('  btn.addEventListener("', 'click', 'Listen for the click event', '", () => {'),
      L('    clicks++;'),
      L('    btn.textContent = `Clicked ${clicks} times`;'),
      L('  });'),
      L('</script>'),
    ],
  },
  {
    id: 'web_canvas', lang: 'web', name: 'Bouncing ball', goal: 'Draw a ball that moves every frame.', output: '● bouncing across the canvas',
    lines: [
      L('<', 'canvas', 'Make a canvas element to draw on', ' id="c" width="300" height="150"></canvas>'),
      L('<script>'),
      L('  const ctx = c.getContext("', '2d', 'Ask for a 2d drawing context', '");'),
      L('  let x = 0;'),
      L('  function ', 'loop', 'Name the frame function loop', '() {'),
      L('    ctx.clearRect(0, 0, 300, 150);'),
      L('    ctx.fillRect(x++, 70, 10, 10);'),
      L('    ', 'requestAnimationFrame', 'Ask the browser for the next frame', '(loop);'),
      L('  }'),
      L('  loop();'),
      L('</script>'),
    ],
  },
  // ---- Final touch — two more projects for the first three languages
  {
    id: 'cpp_inventory', lang: 'cpp', name: 'Inventory', goal: 'Keep the player’s items in a vector and list them.', output: 'Inventory: sword, potion, key',
    lines: [
      L('#include <', 'vector', 'Include the vector header', '>'),
      L('#include <string>'),
      L('std::vector<std::string> bag;'),
      L('bag.', 'push_back', 'Add an item to the end with push_back', '("sword");'),
      L('', 'for', 'Loop over every item', ' (const auto& item : bag)'),
      L('    std::', 'cout', 'Print with std::cout', ' << item << ", ";'),
    ],
  },
  {
    id: 'cpp_score', lang: 'cpp', name: 'High score', goal: 'Keep the best score between rounds.', output: 'Round 1: 40 · Round 2: 75 · Best: 75',
    lines: [
      L('int best = ', '0', 'No score yet: start best at 0', ';'),
      L('void submit(int score) {'),
      L('    ', 'if', 'Check whether the new score is higher', ' (score > best) {'),
      L('        best = ', 'score', 'Save the new best score', ';'),
      L('    }'),
      L('}'),
    ],
  },
  {
    id: 'py_weather', lang: 'python', name: 'Weather bot', goal: 'Give advice based on the temperature.', output: '18°C → "Bring a jacket."',
    lines: [
      L('', 'def', 'Define a function with def', ' advice(temp):'),
      L('    if temp ', '<', 'Cold means less than 10', ' 10:'),
      L('        return "Wear a coat."'),
      L('    ', 'elif', 'Another condition: elif', ' temp < 20:'),
      L('        ', 'return', 'Send the answer back with return', ' "Bring a jacket."'),
      L('    return "T-shirt weather."'),
    ],
  },
  {
    id: 'py_dice', lang: 'python', name: 'Dice roller', goal: 'Roll two dice and add them up.', output: '🎲 4 + 🎲 6 = 10',
    lines: [
      L('from random import ', 'randint', 'Import randint from random', ''),
      L('a = randint(1, ', '6', 'A die has 6 sides', ')'),
      L('b = randint(1, 6)'),
      L('total = a ', '+', 'Add the two dice', ' b'),
      L('print(', 'f', 'Use an f-string to format the result', '"{a} + {b} = {total}")'),
    ],
  },
  {
    id: 'web_todo', lang: 'web', name: 'To-do app', goal: 'Type a task, press Add, see it in the list.', output: '• walk the dog  • buy bread',
    lines: [
      L('<input id="task"><button id="add">Add</button>'),
      L('<', 'ul', 'An unordered list holds the tasks', ' id="list"></ul>'),
      L('<script>'),
      L('  add.onclick = () => {'),
      L('    const li = document.', 'createElement', 'Make a new element', '("li");'),
      L('    li.textContent = task.', 'value', 'Read what was typed: value', ';'),
      L('    list.', 'appendChild', 'Put it in the list', '(li);'),
      L('  };'),
      L('</script>'),
    ],
  },
  {
    id: 'web_dark', lang: 'web', name: 'Dark mode', goal: 'A toggle that switches the page to dark mode.', output: '🌙 Dark mode on',
    lines: [
      L('<style> .dark { background: #111; color: #eee; } </style>'),
      L('<button id="t">🌙</button>'),
      L('<script>'),
      L('  t.', 'addEventListener', 'Listen for the button’s click', '("click", () => {'),
      L('    const page = document.', 'body', 'The page is document.body', ';'),
      L('    page.classList.', 'toggle', 'Switch the class on and off with toggle', '("dark");'),
      L('  });'),
      L('</script>'),
    ],
  },
  // ---- Java
  {
    id: 'java_hello', lang: 'java', name: 'Hello, class', goal: 'Your first Java class that prints a greeting.', output: 'Hello from Java!',
    lines: [
      L('public ', 'class', 'Everything in Java lives in a class', ' Main {'),
      L('    public static void ', 'main', 'The program starts in main', '(String[] args) {'),
      L('        System.out.', 'println', 'Print a line with println', '("Hello from Java!");'),
      L('    }'),
      L('}'),
    ],
  },
  {
    id: 'java_bank', lang: 'java', name: 'Bank account', goal: 'An account you can deposit into.', output: 'Balance: $0 → deposit 50 → $50',
    lines: [
      L('class Account {'),
      L('    ', 'private', 'Hide the balance from other classes', ' int balance = 0;'),
      L('    ', 'void', 'deposit returns nothing: void', ' deposit(int amount) {'),
      L('        balance ', '+=', 'Add the amount to balance', ' amount;'),
      L('    }'),
      L('}'),
    ],
  },
  {
    id: 'java_list', lang: 'java', name: 'Guest list', goal: 'Store names in an ArrayList and count them.', output: '3 guests: Ana, Ben, Cleo',
    lines: [
      L('import java.util.', 'ArrayList', 'Import ArrayList', ';'),
      L('ArrayList<String> guests = ', 'new', 'Create it with new', ' ArrayList<>();'),
      L('guests.', 'add', 'Add a name with add', '("Ana");'),
      L('System.out.println(guests.', 'size', 'How many: size()', '() + " guests");'),
    ],
  },
  {
    id: 'java_grade', lang: 'java', name: 'Grade checker', goal: 'Turn a score into a letter grade.', output: '87 → B',
    lines: [
      L('char grade(int score) {'),
      L('    if (score ', '>=', 'At least 90 is an A', ' 90) return \'A\';'),
      L('    ', 'else', 'Otherwise, check the next grade', ' if (score >= 80) return \'B\';'),
      L('    ', 'return', 'Everything else gets a C', ' \'C\';'),
      L('}'),
    ],
  },
  // ---- C#
  {
    id: 'cs_hello', lang: 'csharp', name: 'Console hello', goal: 'Ask for a name and greet the user.', output: 'Name? Sam → Hi, Sam!',
    lines: [
      L('', 'using', 'Bring in a namespace with using', ' System;'),
      L('var name = Console.', 'ReadLine', 'Read what the user types', '();'),
      L('Console.', 'WriteLine', 'Print a line', '($"Hi, {name}!");'),
    ],
  },
  {
    id: 'cs_unity', lang: 'csharp', name: 'Moving cube', goal: 'A Unity script that moves a cube every frame.', output: '🟦 → → → the cube slides right',
    lines: [
      L('public class Mover : ', 'MonoBehaviour', 'Unity scripts inherit MonoBehaviour', ' {'),
      L('    public float speed = 2f;'),
      L('    void ', 'Update', 'Unity calls Update every frame', '() {'),
      L('        transform.', 'Translate', 'Move the object with Translate', '(speed * Time.deltaTime, 0, 0);'),
      L('    }'),
      L('}'),
    ],
  },
  {
    id: 'cs_shop', lang: 'csharp', name: 'Shop prices', goal: 'Store item prices in a dictionary.', output: 'Potion costs 25 gold',
    lines: [
      L('var prices = new ', 'Dictionary', 'A Dictionary maps names to prices', '<string, int>();'),
      L('prices[', '"Potion"', 'The key is the string "Potion"', '] = 25;'),
      L('Console.WriteLine($"Potion costs {prices["Potion"]} ', 'gold', 'Prices are in gold', '");'),
    ],
  },
  {
    id: 'cs_enemy', lang: 'csharp', name: 'Enemy AI', goal: 'An enemy that chases you when you’re close.', output: '👾 spotted you → chasing!',
    lines: [
      L('', 'enum', 'An enum lists the states', ' State { Idle, Chase }'),
      L('State state = State.', 'Idle', 'The enemy starts idle', ';'),
      L('if (distance < 5) state = State.', 'Chase', 'Close enough: chase', ';'),
    ],
  },
  // ---- Rust
  {
    id: 'rs_hello', lang: 'rust', name: 'Hello, Ferris', goal: 'Print a greeting with a macro.', output: 'Hello, Ferris! 🦀',
    lines: [
      L('', 'fn', 'Functions start with fn', ' main() {'),
      L('    ', 'let', 'Create a variable with let', ' name = "Ferris";'),
      L('    ', 'println!', 'Print with the println! macro', '("Hello, {}!", name);'),
      L('}'),
    ],
  },
  {
    id: 'rs_counter', lang: 'rust', name: 'Counter', goal: 'Count to five with a changeable variable.', output: '1 2 3 4 5',
    lines: [
      L('let ', 'mut', 'Variables are fixed unless marked mut', ' n = 0;'),
      L('', 'while', 'Loop while n is under 5', ' n < 5 {'),
      L('    n ', '+=', 'Increase n by one', ' 1;'),
      L('    println!("{}", n);'),
      L('}'),
    ],
  },
  {
    id: 'rs_struct', lang: 'rust', name: 'Hero struct', goal: 'A hero with a name and a level-up method.', output: 'Aria reached level 2!',
    lines: [
      L('', 'struct', 'Define a struct', ' Hero { name: String, level: u32 }'),
      L('', 'impl', 'Add methods with impl', ' Hero {'),
      L('    fn level_up(&', 'mut', 'Changing the hero needs &mut self', ' self) { self.level += 1; }'),
      L('}'),
    ],
  },
  {
    id: 'rs_match', lang: 'rust', name: 'Traffic light', goal: 'Use match to react to each light.', output: '🟢 Go!',
    lines: [
      L('enum Light { Red, Yellow, Green }'),
      L('', 'match', 'Pick a branch with match', ' light {'),
      L('    Light::Red ', '=>', 'Arms use =>', ' println!("Stop"),'),
      L('    Light::Green => println!("Go!"),'),
      L('    ', '_', 'Everything else: the _ wildcard', ' => println!("Slow down"),'),
      L('}'),
    ],
  },
];

export const projectsFor = (lang: Lang) => PROJECTS.filter((p) => p.lang === lang);
export const blanksOf = (p: Project) => p.lines.filter((l) => l.blank).map((l) => l.blank!);

/** Did they type it right? (Trimmed; code is case-sensitive.) */
export const isRight = (answer: string, typed: string) => typed.trim() === answer;

/** Share of blanks filled correctly (0–1). */
export function codeScore(p: Project, typed: string[]): number {
  const b = blanksOf(p);
  if (!b.length) return 1;
  return b.filter((x, i) => isRight(x.answer, typed[i] ?? '')).length / b.length;
}

/** What the build window prints. */
export function buildOutput(p: Project, typed: string[]): { ok: boolean; lines: string[] } {
  const b = blanksOf(p);
  const errors = b.map((x, i) => (isRight(x.answer, typed[i] ?? '') ? null : `error: expected '${x.answer}' (${x.hint.toLowerCase()})`)).filter(Boolean) as string[];
  if (errors.length) return { ok: false, lines: [`Build failed — ${errors.length} error${errors.length > 1 ? 's' : ''}`, ...errors] };
  return { ok: true, lines: ['Build succeeded ✔', `> ${p.output}`] };
}

/** Final touch — finished projects teach more: a clean build adds a bonus, the first time a project ships adds more,
 *  and shipping every project in a language masters it. */
export const CODE_CLEAN = { smarts: 2, coder: 3 };
export const CODE_FIRST = { smarts: 2, creativity: 1, coder: 3 };
export const CODE_MASTER = { smarts: 5, coder: 10 };

export function codeLearn(g: Game, m: { score: number; played: boolean; lang?: string; project?: string }): string {
  if (!m.played || m.score < 1) return '';
  g.stat('smarts', CODE_CLEAN.smarts);
  g.inc('coder', CODE_CLEAN.coder);
  const p = PROJECTS.find((x) => x.id === m.project);
  if (!p || g.flag(`shipped:${p.id}`)) return ' Clean build: bonus learning.';
  g.setFlag(`shipped:${p.id}`);
  g.stat('smarts', CODE_FIRST.smarts);
  g.stat('creativity', CODE_FIRST.creativity);
  g.inc('coder', CODE_FIRST.coder);
  if (projectsFor(p.lang).every((x) => g.flag(`shipped:${x.id}`)) && !g.flag(`mastered:${p.lang}`)) {
    g.setFlag(`mastered:${p.lang}`);
    g.stat('smarts', CODE_MASTER.smarts);
    g.inc('coder', CODE_MASTER.coder);
    g.milestone(`Mastered ${LANGS[p.lang].name}`);
    return ` New project shipped — and you’ve mastered ${LANGS[p.lang].name}!`;
  }
  return ' New project shipped: big learning boost.';
}
