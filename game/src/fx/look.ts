// Update 0.4 — shared look palette for the Pixi avatar and the SVG portraits.

export const SKIN = [0xffe0c7, 0xf6cfa9, 0xeebd8d, 0xd9a066, 0xbd8250, 0x96613a, 0x6e4426, 0x4a2c18];
export const HAIR = [0x1f1a1a, 0x3b2516, 0x5e3a1e, 0x8b5a2b, 0xc89b5a, 0xe9d18f, 0xb5462a, 0x7a7a80, 0xe86ed0, 0x4f7ad8];
export const EYES = [0x3b2516, 0x5b7fb8, 0x4f8a4a, 0x8a6a3a, 0x6b6f7a, 0x2a2a2a];
export const HAIR_STYLES = ['Tousled', 'Long', 'Top bun', 'Buzz', 'Ponytail', 'Bob', 'Braids', 'Curly', 'Pixie', 'Mohawk', 'Side part', 'Hijab'];
export const HEIGHTS = ['Short', 'Average', 'Tall'];
export const BUILDS = ['Slim', 'Average', 'Athletic', 'Heavy'];

export const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
export const hairColor = (hair: number, age: number) => (age >= 62 ? 0xd9d9de : age >= 50 && hair < 4 ? 0x8a8a90 : HAIR[hair % HAIR.length]);
