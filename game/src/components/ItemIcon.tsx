import { useState } from 'react';
import { itemIconUrl } from '../ui/itemIcon';

/** Update 0.13 — an item's picture (Kenney art), or its emoji when there's no match or the file fails. */
export function ItemIcon({ id, emoji, className = '' }: { id: string; emoji: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const url = itemIconUrl(id);
  if (!url || broken) return <span className={className}>{emoji}</span>;
  return <img className={`itm-ico ${className}`} src={url} alt="" draggable={false} onError={() => setBroken(true)} />;
}
