import type { Ruleset } from './us';

// Update 0.5.1 — European Union ruleset (a typical member state). Same shape as US.
export const EU: Ruleset = {
  id: 'eu',
  name: 'European Union',
  ages: {
    partTimeJob: 15, job: 16, hazardousJob: 18,
    permit: 16, license: 18, rentCar: 21,
    lease: 18, creditCard: 18, vote: 18,
    tattoo: 18, tobacco: 18, alcohol: 18, cannabis: 18, casino: 18, lottery: 18,
    marriage: 18, military: 18, gunRifle: 18, gunHandgun: 18,
    intimacy: 18, dating: 18, travel: 18, rehab: 18, steroids: 18, fakeId: 16, compete: 18,
  },
  withConsent: { tattoo: 16, compete: 16 },
  cannabisLegal: { city: false, country: false },
  abortionAccess: { city: true, country: true },
  creditIncomeAge: 18,
  tuitionMult: 0.1,
};
