import { applySettings, settings, type Settings } from '../state/settings';

// Update 0.3 — persists global settings (Mature Content, age confirmation) outside any life save.
const KEY = 'lifesim.settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) applySettings(JSON.parse(raw) as Partial<Settings>);
  } catch {
    /* defaults */
  }
}

export function saveSettings(s: Partial<Settings>) {
  applySettings(s);
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage blocked */
  }
}
