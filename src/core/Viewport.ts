import type { Container } from 'pixi.js';

/**
 * Fits the playfield container to the view while keeping a fixed aspect ratio (scale + letterbox).
 * Made to work with all screen sizes
 */
export function fitPlayfieldToView(
  containerEl: HTMLElement,
  playfield: Container,
  logicalWidth: number,
  logicalHeight: number
): void {
  const rect = containerEl.getBoundingClientRect();
  const viewWidth = rect.width;
  const viewHeight = rect.height;

  if (viewWidth === 0 || viewHeight === 0) return;

  const scale = Math.min(viewWidth / logicalWidth, viewHeight / logicalHeight);
  playfield.scale.set(scale);

  const offsetX = (viewWidth - logicalWidth * scale) / 2;
  const offsetY = (viewHeight - logicalHeight * scale) / 2;
  playfield.position.set(offsetX, offsetY);
}
