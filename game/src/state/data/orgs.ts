import type { Region } from '../types';

export interface OrgRank {
  title: string;
  pay: number;
  respect: number;
}

export interface OrgDef {
  id: string;
  name: string;
  kind: 'gang' | 'mafia';
  region: Region;
  icon: string;
  color: string;
  hideout: string;
  boss: string;
  ranks: OrgRank[];
}

export const ORGS: OrgDef[] = [
  {
    id: 'vipers', name: 'Southside Vipers', kind: 'gang', region: 'city', icon: '🐍', color: '#3ddc84', hideout: 'Viper Den (Auto Shop)', boss: 'Big Tony "Fangs" Ruiz',
    ranks: [
      { title: 'Lookout', pay: 250, respect: 0 },
      { title: 'Runner', pay: 800, respect: 25 },
      { title: 'Soldier', pay: 2200, respect: 60 },
      { title: 'Lieutenant', pay: 5500, respect: 120 },
      { title: 'Shot-Caller', pay: 12000, respect: 200 },
      { title: 'Kingpin', pay: 32000, respect: 320 },
    ],
  },
  {
    id: 'riders', name: 'Hollow Creek Riders', kind: 'gang', region: 'country', icon: '🏍️', color: '#ff9f43', hideout: 'The Clubhouse (Old Mill)', boss: 'Old Man Cutter',
    ranks: [
      { title: 'Hang-Around', pay: 200, respect: 0 },
      { title: 'Prospect', pay: 700, respect: 25 },
      { title: 'Patched Member', pay: 2000, respect: 60 },
      { title: 'Road Captain', pay: 5000, respect: 120 },
      { title: 'Vice President', pay: 11000, respect: 200 },
      { title: 'President', pay: 28000, respect: 320 },
    ],
  },
  {
    id: 'moretti', name: 'Moretti Crime Family', kind: 'mafia', region: 'city', icon: '🌹', color: '#ff4d6d', hideout: 'Bella Notte Social Club', boss: 'Don Carmine Moretti',
    ranks: [
      { title: 'Associate', pay: 1500, respect: 0 },
      { title: 'Made Man', pay: 4500, respect: 60 },
      { title: 'Capo', pay: 11000, respect: 160 },
      { title: 'Consigliere', pay: 22000, respect: 270 },
      { title: 'Underboss', pay: 42000, respect: 400 },
      { title: 'Don', pay: 95000, respect: 560 },
    ],
  },
];

export const ORG_BY_ID: Record<string, OrgDef> = Object.fromEntries(ORGS.map((o) => [o.id, o]));
export const gangFor = (r: Region) => (r === 'city' ? ORG_BY_ID.vipers : ORG_BY_ID.riders);
