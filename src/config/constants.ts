import type { Rect } from '../shapes/types';

export const PLAYFIELD_WIDTH = 800;
export const PLAYFIELD_HEIGHT = 450;

export const PLAYFIELD_RECT: Rect = {
  left: 0,
  top: 0,
  right: PLAYFIELD_WIDTH,
  bottom: PLAYFIELD_HEIGHT,
};

export const MIN_SPAWN_RATE = 1;
export const MAX_SPAWN_RATE = 10;
export const MIN_GRAVITY = 100;
export const MAX_GRAVITY = 2000;

export const PLAYFIELD_BG_COLOR = 0x0f172a;
export const APP_BG_COLOR = 0x020617;

/** Fill color for the playfield mask (fully opaque white). */
export const MASK_FILL_COLOR = 0xffffff;
/** Full opacity for fill/alpha (1 = 100%). */
export const FULL_OPACITY = 1;

/** Default fill color for shapes when not specified (e.g. in constructors). */
export const DEFAULT_SHAPE_COLOR = 0xe11d48;

/** Milliseconds per second (for delta conversion). */
export const MS_PER_SECOND = 1000;
