// Update 0.10 — EU lives see euros. Game rules and saves stay in dollars; this only changes what's displayed.
// One observer rewrites "$1,234" in the UI's text (and tooltips) to euros at the set rate, and restores the
// originals when the life uses US laws again. Elements marked data-cur="fixed" format their own money.

export const USD_PER_EUR = 1.12;
const MONEY = /\$(\d[\d,]*(?:\.\d+)?)/g;

let eur = false;

/** Pure: convert every dollar amount in a string (tested). */
export function toEuros(text: string): string {
  return text.replace(MONEY, (_, n: string) => `€${Math.round(parseFloat(n.replace(/,/g, '')) / USD_PER_EUR).toLocaleString('en-US')}`);
}

/** Display a dollar string in the active currency. */
export const cur = (text: string) => (eur ? toEuros(text) : text);

/** Format an amount for a specific life's laws (e.g. the save-slot list). */
export const moneyFor = (usd: number, rules: 'us' | 'eu') => {
  const s = `${usd < 0 ? '-' : ''}$${Math.abs(Math.round(usd)).toLocaleString('en-US')}`;
  return rules === 'eu' ? toEuros(s) : s;
};

const raw = new WeakMap<Text, string>();
const written = new WeakMap<Text, string>();
const rawTitle = new WeakMap<Element, string>();

const skip = (n: Node | null) => {
  const el = n instanceof Element ? n : n?.parentElement;
  return !el || !!el.closest('[data-cur="fixed"], input, textarea, script, style');
};

function fixText(t: Text) {
  const d = t.data;
  if (written.get(t) === d) return; // our own write
  raw.set(t, d);
  written.delete(t);
  if (!eur || !d.includes('$') || skip(t)) return;
  const out = toEuros(d);
  if (out !== d) {
    written.set(t, out);
    t.data = out;
  }
}

function fixTitle(el: Element) {
  const v = el.getAttribute('title');
  if (v === null) return;
  const before = rawTitle.get(el);
  const isOurs = before !== undefined && eur && toEuros(before) === v;
  if (isOurs) return;
  rawTitle.set(el, v);
  if (eur && v.includes('$') && !skip(el)) el.setAttribute('title', toEuros(v));
}

function scan(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) fixText(n as Text);
  if (root instanceof Element) {
    if (root.hasAttribute('title')) fixTitle(root);
    root.querySelectorAll('[title]').forEach(fixTitle);
  }
}

/** Switch currency for the whole UI (called when a life loads or its laws change). */
export function setCurrency(rules: 'us' | 'eu') {
  const next = rules === 'eu';
  if (next === eur) return;
  eur = next;
  if (typeof document === 'undefined') return;
  if (!eur) {
    // put the original dollar text back
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n as Text;
      if (written.get(t) === t.data) {
        t.data = raw.get(t) ?? t.data;
        written.delete(t);
      }
    }
    document.querySelectorAll('[title]').forEach((el) => {
      const r = rawTitle.get(el);
      if (r !== undefined) el.setAttribute('title', r);
    });
    return;
  }
  scan(document.body);
}

export function installCurrency() {
  const obs = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target as Text);
      else if (m.type === 'attributes') fixTitle(m.target as Element);
      else m.addedNodes.forEach((n) => (n.nodeType === Node.TEXT_NODE ? fixText(n as Text) : scan(n)));
    }
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title'] });
  return () => obs.disconnect();
}
