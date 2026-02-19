import type { Container } from 'pixi.js';
import type { Point, Rect, ShapeKind } from './types';
import type { ShapeParams } from './shapeGeometry';

/**
 * Interface for a single falling shape (triangle, polygon, circle, ellipse, star, irregular, etc).
 * We use Pixi.Graphics but the display object is what gets added to the playfield.
 */
export interface IShape {
  /** The main display object to add to the playfield (often a masked Container holding a Graphics child). */
  readonly displayObject: Container;

  /** What kind of shape this is (useful for debugging and factories). */
  readonly kind: ShapeKind;

  /** True if this shape is currently active (not destroyed or pooled). */
  readonly isAlive: boolean;

  /** The total area (in px²) before clipping to the playfield. */
  getAreaPx2(): number;

  /** The shape's vertices, in playfield coordinates (used for clipping and hit testing). */
  getPolygon(): Point[];

  /** How much of the shape (in px²) is visible within the given rect (intersection area). */
  getVisibleArea(playfieldRect: Rect): number;

  /** Axis-aligned bounding box of the shape, in its own/local coordinates. */
  getBounds(): Rect;

  /** Returns true if the given point (in playfield space) is inside the shape. */
  containsPoint(x: number, y: number): boolean;

  /** Step the shape's physics (like position and velocity). Runs each frame while active. */
  update(deltaSeconds: number): void;

  /** Free up resources and remove from the stage. Call when destroying or pooling the shape. */
  destroy(): void;

  /**
   * Remove from stage and mark inactive for pooling; does not destroy Pixi objects.
   * If pooling isn't supported, this can be undefined.
   */
  recycle?(): void;

  /**
   * Resets the shape's state for reuse—position, velocity, type/color, etc.
   * If pooling isn't supported, this can do nothing.
   */
  reset?(options: ShapeResetOptions): void;
}

export type ShapeResetOptions = {
  x: number;
  y: number;
  velocityY?: number;
  gravity?: number;
  color?: number;
  kind?: ShapeKind;
  /** Passed to normalizeParams when kind is set (e.g. radius for circle). */
  kindParams?: Partial<Record<string, number>> & { vertices?: Point[] };
  /** When set, overrides kind/kindParams and uses this directly for the shape. */
  params?: ShapeParams;
  rotationSpeed?: number;
};
