import type { Startup } from '../../../state/startup/types';
import { headcount } from '../../../state/startup/company';
import { IDEAS } from '../../../state/startup/data';

/** Update 0.11 — where your company lives: your room → an office → a facility → HQ → the skyscraper penthouse. */
export function HQView({ c }: { c: Startup }) {
  const staff = headcount(c);
  const b = c.building;
  const logo = IDEAS[c.idea].icon;
  return (
    <svg className="sup-hq" viewBox="0 0 400 260" role="img" aria-label={`${c.name} — ${b}`}>
      {b === 'room' && <Room />}
      {(b === 'office' || b === 'facility' || b === 'hq') && <Floor tier={b} staff={staff} />}
      {b === 'skyscraper' && <Penthouse staff={staff} />}
      <g>
        <rect x="8" y="8" width={Math.min(250, 40 + c.name.length * 8)} height="26" rx="13" fill="rgba(0,0,0,0.45)" />
        <text x="22" y="26" fontSize="13" fontWeight="700" fill="#fff">{logo} {c.name}</text>
      </g>
    </svg>
  );
}

function Person({ x, y, hue }: { x: number; y: number; hue: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="5" cy="-9" fill={`hsl(${30 + (hue % 4) * 8}, 45%, ${45 + (hue % 3) * 12}%)`} />
      <rect x="-5" y="-4" width="10" height="9" rx="4" fill={`hsl(${(hue * 47) % 360}, 55%, 55%)`} />
    </g>
  );
}

function Room() {
  return (
    <g>
      <rect width="400" height="260" fill="#2e2a4a" />
      <rect y="200" width="400" height="60" fill="#5b4636" />
      <rect x="250" y="40" width="110" height="80" rx="4" fill="#0f1a3a" stroke="#c9b48a" strokeWidth="4" />
      {[[270, 60], [300, 75], [335, 55], [320, 95]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" />)}
      <circle cx="345" cy="70" r="9" fill="#f3e6c8" />
      <rect x="40" y="150" width="140" height="55" rx="8" fill="#7a5ab8" />
      <rect x="40" y="140" width="40" height="20" rx="6" fill="#efe9ff" />
      <rect x="210" y="160" width="110" height="10" fill="#8a6a4a" />
      <rect x="220" y="170" width="6" height="32" fill="#6b5236" />
      <rect x="304" y="170" width="6" height="32" fill="#6b5236" />
      <rect x="240" y="136" width="44" height="26" rx="3" fill="#20202e" />
      <rect x="244" y="140" width="36" height="18" rx="2" fill="#7fd0f5" />
      <rect x="120" y="60" width="50" height="66" rx="3" fill="#ff7aa2" />
      <text x="128" y="98" fontSize="11" fill="#fff" fontWeight="800">DREAM</text>
      <Person x={262} y={196} hue={1} />
    </g>
  );
}

function Floor({ tier, staff }: { tier: 'office' | 'facility' | 'hq'; staff: number }) {
  const cols = tier === 'office' ? 5 : tier === 'facility' ? 8 : 10;
  const rows = tier === 'office' ? 2 : 3;
  const seats = cols * rows;
  const filled = Math.min(seats, Math.max(1, Math.round((staff / (tier === 'office' ? 15 : tier === 'facility' ? 60 : 200)) * seats)));
  const wall = tier === 'facility' ? '#3a3f4f' : tier === 'hq' ? '#1d2a44' : '#33305a';
  return (
    <g>
      <rect width="400" height="260" fill={wall} />
      {Array.from({ length: tier === 'hq' ? 6 : 4 }, (_, i) => (
        <g key={i}>
          <rect x={20 + i * (360 / (tier === 'hq' ? 6 : 4))} y="40" width={360 / (tier === 'hq' ? 6 : 4) - 10} height="60" fill="#7fb6e6" opacity="0.8" />
          {[0, 1, 2].map((k) => <rect key={k} x={26 + i * (360 / (tier === 'hq' ? 6 : 4)) + k * 18} y={70 - k * 8} width="12" height={30 + k * 8} fill="#4a6a9a" />)}
        </g>
      ))}
      <rect y="110" width="400" height="150" fill={tier === 'facility' ? '#55585f' : '#3c3a5e'} />
      {Array.from({ length: seats }, (_, i) => {
        const x = 30 + (i % cols) * (340 / cols) + 340 / cols / 2 - 15;
        const y = 140 + Math.floor(i / cols) * 38;
        return (
          <g key={i}>
            <rect x={x} y={y} width="30" height="8" rx="2" fill={tier === 'facility' ? '#9a7a3a' : '#c9c3dd'} />
            <rect x={x + 9} y={y - 12} width="12" height="10" rx="1" fill="#20202e" />
            {i < filled && <Person x={x + 15} y={y + 22} hue={i} />}
          </g>
        );
      })}
    </g>
  );
}

function Penthouse({ staff }: { staff: number }) {
  const chairs = 10;
  const seated = Math.min(chairs, Math.max(2, Math.round(staff / 100)));
  return (
    <g>
      <rect width="400" height="260" fill="#0b1026" />
      {/* the giant window over the city */}
      <rect x="10" y="20" width="380" height="150" fill="#1b2350" />
      {Array.from({ length: 22 }, (_, i) => {
        const w = 12 + ((i * 7) % 14);
        const h = 40 + ((i * 37) % 100);
        const x = 12 + i * 17.5;
        return (
          <g key={i}>
            <rect x={x} y={170 - h} width={w} height={h} fill="#141a3a" />
            {Array.from({ length: Math.floor(h / 12) }, (_, k) => (
              <rect key={k} x={x + 3} y={170 - h + 5 + k * 12} width="3" height="4" fill={(i + k) % 3 ? '#ffd36b' : '#2a3060'} />
            ))}
          </g>
        );
      })}
      <circle cx="340" cy="45" r="10" fill="#f3e6c8" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={10 + i * 95} y="20" width="3" height="150" fill="#2a3060" />)}
      {/* the meeting table */}
      <rect y="170" width="400" height="90" fill="#231a14" />
      <ellipse cx="200" cy="215" rx="150" ry="24" fill="#5a3a22" />
      <ellipse cx="200" cy="211" rx="146" ry="20" fill="#7a5232" />
      {Array.from({ length: chairs }, (_, i) => {
        const a = (i / chairs) * Math.PI * 2;
        const x = 200 + Math.cos(a) * 165;
        const y = 216 + Math.sin(a) * 34;
        return (
          <g key={i}>
            <rect x={x - 7} y={y - 6} width="14" height="12" rx="3" fill="#1a1a24" />
            {i < seated && <Person x={x} y={y + 2} hue={i + 3} />}
          </g>
        );
      })}
    </g>
  );
}
