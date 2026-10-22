// Update 0.13 — which isometric scene each place uses. A Record over SceneKind, so a new place can't be forgotten.

import type { SceneKind } from '../../state/data/locations';
import { cityScene, parkScene } from './layout';
import { alleyScene, backroadsScene, baseScene, campusScene, constructionScene, docksScene, farmScene, homelessScene, lakeScene, stadiumScene, stationScene, woodsScene } from './outdoor';
import { HOMES, ROOMS, roomScene } from './rooms';
import type { IsoScene, IsoSeason, Member } from './layout-core';

type Builder = (season: IsoSeason, household: Member[]) => IsoScene;
// only homes have your household in them
const room = (k: string): Builder => () => roomScene(k, ROOMS[k]);
const home = (k: string): Builder => (_s, h) => roomScene(k, HOMES[k], h);

export const SCENES: Record<SceneKind, Builder> = {
  home: home('home'), apartment: home('apartment'), mansion: home('mansion'), farmhouse: home('farmhouse'), homeless: (s) => homelessScene(s),
  school: room('school'), campus: (s) => campusScene(s), office: room('office'), shop: room('shop'),
  downtown: (s) => cityScene('downtown', s), park: (s) => parkScene(s), gym: room('gym'), library: room('library'), hospital: room('hospital'),
  club: room('club'), bar: room('bar'), alley: (s) => alleyScene(s), docks: (s) => docksScene(s), casino: room('casino'), hideout: room('hideout'), mafia: room('mafia'),
  farm: (s) => farmScene(s), woods: (s) => woodsScene(s), lake: (s) => lakeScene(s), mainstreet: (s) => cityScene('mainstreet', s),
  roadhouse: room('roadhouse'), backroads: (s) => backroadsScene(s), church: room('church'),
  jail: room('jail'), diner: room('diner'), police: room('police'), construction: (s) => constructionScene(s), studio: room('studio'),
  stadium: (s) => stadiumScene(s), base: (s) => baseScene(s), warehouse: room('warehouse'), garage: room('garage'), station: (s) => stationScene(s),
};

export const isoScene = (kind: SceneKind, season: IsoSeason, household: Member[] = []): IsoScene => SCENES[kind](season, household);
