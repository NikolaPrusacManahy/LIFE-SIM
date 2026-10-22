import { useEffect, useRef, useState } from 'react';
import type { Game } from '../../state/Game';
import { LOCATIONS } from '../../state/data/locations';
import { visibleLocations } from '../../state/systems/world';
import { startup } from '../../state/startup/company';
import { seasonOf } from '../../fx/stage/palette';
import { Modal } from '../../components/Modal';
import { CityMapView } from '../../fx/iso/MapView';
import type { MapPin } from '../../fx/iso/cityMap';

const CARS = ['car', 'truck', 'motorbike', 'sportscar'];

/** Update 0.13 — the clickable city map: pick a place to go there. */
export function CityMap({ game, onGo, onClose }: { game: Game; onGo: (id: string) => void; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<MapPin | null>(null);
  const go = useRef(onGo);
  go.current = onGo;
  useEffect(() => {
    const open = new Set(visibleLocations(game).map((l) => l.id));
    const region = game.s.region;
    const places = LOCATIONS.filter((l) => (!l.region || l.region === region) && l.id !== 'onrun' && (l.id !== 'jail' || game.jailed)).map((l) => ({ id: l.id, icon: l.icon, name: l.name(game), open: open.has(l.id) }));
    const c = startup(game);
    const view = new CityMapView();
    view.init(host.current!, region, seasonOf(game.month), places, { startup: c ? { name: c.name, tier: c.building } : undefined, car: CARS.some((k) => game.has(k)) }, { onPick: (id) => go.current(id), onHover: setHover });
    return () => view.destroy();
  }, [game]);
  return (
    <Modal wide className="map-modal" onClose={onClose}>
      <div className="map-head">
        <h3>🗺️ {game.s.region === 'city' ? 'The City' : 'The Countryside'}</h3>
        <span className="map-hint">{hover ? (hover.id === 'startup' ? `🚀 ${hover.name} — click to open START-UP` : hover.open ? `${hover.icon} ${hover.name} — click to go` : `🔒 ${hover.name} — not available right now`) : 'Click a place to go there.'}</span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="map-canvas" ref={host} />
    </Modal>
  );
}
