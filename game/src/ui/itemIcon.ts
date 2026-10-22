// Update 0.13 — real item art (Kenney generic items) for bag, shop and market rows. Items without a good match keep
// their emoji. Files: public/items/item_NNN.webp (tools/pack_iso.py).

export const ITEM_ICON: Record<string, string> = {
  notebook: '034', textbooks: '035', gympass: '150', movie_tix: '156', concert_tix: '156',
  first_aid: '102', painkillers: '099', preg_test: '106', alcohol: '127',
  fakeid: '149', knife: '013', combat_knife: '134', burner: '064', duffel: '145', lockpick: '155', sedative: '093',
  poison: '105', scanner: '063', passport: '148', contraband: '146',
  // PC parts by slot
  pc_case1: '054', pc_case2: '055', pc_case3: '054', pc_mobo_am1: '075', pc_mobo_am2: '075', pc_mobo_lg1: '075', pc_mobo_lg2: '075',
  pc_gpu1: '077', pc_gpu2: '078', pc_gpu3: '077', pc_gpu4: '078', pc_ram1: '076', pc_ram2: '076', pc_ram3: '076',
  pc_mon1: '051', pc_mon2: '052', pc_mon3: '053', pc_kb1: '057', pc_kb2: '056', pc_mouse1: '059', pc_mouse2: '058',
  pc_head1: '084', pc_cam1: '041', pc_mic1: '083',
};

export const itemIconUrl = (id: string) => (ITEM_ICON[id] ? `${import.meta.env.BASE_URL}items/item_${ITEM_ICON[id]}.webp` : null);
