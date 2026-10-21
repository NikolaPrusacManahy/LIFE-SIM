// Update 0.8 — the weather rule lives in state so the forecast site (WeatherNerds) can read next month.
// Same formula as before (moved from fx/view.ts).

export type Weather = 'clear' | 'rain' | 'snow';

export function weatherAt(year: number, month: number): Weather {
  const winter = month === 11 || month <= 1;
  const h = ((year * 12 + month) * 2654435761) >>> 0;
  const roll = h % 7;
  if (winter && roll < 4) return 'snow';
  if ([2, 3, 4, 8, 9, 10].includes(month) && roll < 2) return 'rain';
  return 'clear';
}
