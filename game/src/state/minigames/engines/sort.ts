// Update 0.13 — sort & tidy: items come one at a time; send each to the right bin before the clock runs out.

export const SORT_SECONDS = 20;

export interface Bin { id: string; label: string; icon: string }
export interface Item { label: string; icon: string; bin: string }

interface Set_ { bins: Bin[]; items: Item[] }
const B = (id: string, icon: string, label: string): Bin => ({ id, icon, label });
const I = (icon: string, label: string, bin: string): Item => ({ icon, label, bin });

export const SORTS: Record<string, Set_> = {
  home: { bins: [B('wash', '🧺', 'Laundry'), B('trash', '🗑️', 'Trash'), B('shelf', '📚', 'Shelf')], items: [I('👕', 'T-shirt', 'wash'), I('🧦', 'Socks', 'wash'), I('🍌', 'Banana peel', 'trash'), I('🥤', 'Empty cup', 'trash'), I('📕', 'Book', 'shelf'), I('🎮', 'Controller', 'shelf'), I('👖', 'Jeans', 'wash'), I('🍕', 'Old pizza', 'trash')] },
  kitchen: { bins: [B('trays', '🍽️', 'Trays'), B('cups', '🥤', 'Cups'), B('trash', '🗑️', 'Scraps')], items: [I('🍽️', 'Plate', 'trays'), I('🥣', 'Bowl', 'trays'), I('🥤', 'Cup', 'cups'), I('☕', 'Mug', 'cups'), I('🦴', 'Bones', 'trash'), I('🥔', 'Peels', 'trash')] },
  docks: { bins: [B('red', '🟥', 'Red ship'), B('blue', '🟦', 'Blue ship'), B('green', '🟩', 'Green ship')], items: [I('🟥', 'Red crate', 'red'), I('🟦', 'Blue crate', 'blue'), I('🟩', 'Green crate', 'green'), I('📦', 'Crate (red tag)', 'red'), I('🧰', 'Toolbox (blue tag)', 'blue')] },
  farm: { bins: [B('feed', '🐔', 'Chickens'), B('pigs', '🐖', 'Pigs'), B('barn', '🏚️', 'Barn')], items: [I('🌽', 'Corn', 'feed'), I('🍎', 'Apples', 'pigs'), I('🥕', 'Carrots', 'pigs'), I('🌾', 'Hay', 'barn'), I('🪣', 'Bucket', 'barn'), I('🌻', 'Seeds', 'feed')] },
  harvest: { bins: [B('basket', '🧺', 'Basket'), B('bad', '🗑️', 'Compost')], items: [I('🍅', 'Ripe tomato', 'basket'), I('🌽', 'Good corn', 'basket'), I('🥔', 'Potato', 'basket'), I('🐛', 'Wormy apple', 'bad'), I('🥀', 'Rotten', 'bad'), I('🍆', 'Eggplant', 'basket')] },
  work: { bins: [B('urgent', '🔥', 'Urgent'), B('later', '📥', 'Later'), B('trash', '🗑️', 'Spam')], items: [I('📧', 'Boss: deadline today', 'urgent'), I('📞', 'Client complaint', 'urgent'), I('📄', 'Weekly report', 'later'), I('📅', 'Next month’s plan', 'later'), I('🎁', 'You won a prize!!', 'trash'), I('💊', 'Cheap pills', 'trash')] },
};

export function sortSet(skin: string): Set_ {
  return SORTS[skin] ?? SORTS.home;
}

/** right answers count, wrong ones cost half; about 14 items is a great round */
export function sortScore(right: number, wrong: number) {
  return Math.max(0, Math.min(1, (right - wrong * 0.5) / 14));
}
