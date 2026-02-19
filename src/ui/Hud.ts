import type { IShape } from '../shapes/IShape';
import type { Rect } from '../shapes/types';

export type HudOptions = {
  countEl: HTMLElement;
  areaEl: HTMLElement;
  /**
   * Playfield scale (logical units → screen pixels). When set, area is shown in actual screen px².
   */
  scale?: number;
};

/**
 * Updates the HUD with the number of shapes and their total visible area (clipped to the playfield).
 * When scale is provided, area is in screen pixels² (logical area × scale²); otherwise in logical units².
 */
export function updateHud(shapes: readonly IShape[], playfieldRect: Rect, options: HudOptions): void {
  options.countEl.textContent = `Shapes: ${shapes.length}`;

  let totalVisibleArea = 0;
  for (let i = 0; i < shapes.length; i++) {
    totalVisibleArea += shapes[i].getVisibleArea(playfieldRect);
  }

  const area =
    options.scale != null && options.scale > 0
      ? Math.round(totalVisibleArea * options.scale * options.scale)
      : Math.round(totalVisibleArea);
  options.areaEl.textContent = `Area: ${area} px²`;
}
