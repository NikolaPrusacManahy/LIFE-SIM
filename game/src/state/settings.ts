// Update 0.3 — global player settings (not part of a life's save). The UI loads/saves them.

export interface Settings {
  /** confirmed 18+ at first launch */
  ageConfirmed: boolean;
  isAdult: boolean;
  /** Mature Content: shows 18+ intimacy actions between adult characters */
  mature: boolean;
  /** Update 0.5 — Dark Crime: murder, kidnapping, drug empire. Off = petty crime only. */
  darkCrime: boolean;
  /** Update 0.5.1 — background music and sound effects */
  music: boolean;
  sound: boolean;
  /** Update 0.13 — fewer people and cars on the stage, no club lights */
  reducedFx: boolean;
}

export const settings: Settings = { ageConfirmed: false, isAdult: false, mature: false, darkCrime: false, music: true, sound: true, reducedFx: false };

export function applySettings(s: Partial<Settings>) {
  Object.assign(settings, s);
  if (!settings.isAdult) {
    settings.mature = false;
    settings.darkCrime = false;
  }
}
