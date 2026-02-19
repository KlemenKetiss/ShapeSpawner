import type { Container } from 'pixi.js';
import type { IShape } from '../shapes/IShape';
import type { Rect } from '../shapes/types';
import { Shape } from '../shapes/Shape';
import { normalizeParams, type ShapeParams } from '../shapes/shapeGeometry';
import { ShapeKind } from '../shapes/types';

const COLOR_SPAWN_RED = 0xdc2626;
const COLOR_SPAWN_BLUE = 0x2563eb;
const COLOR_SPAWN_GREEN = 0x16a34a;
const COLOR_SPAWN_AMBER = 0xca8a04;
const COLOR_SPAWN_PURPLE = 0x9333ea;
/** Five fixed colors for spawned shapes (modern palette). */
const SPAWN_COLORS: number[] = [
  COLOR_SPAWN_RED,
  COLOR_SPAWN_BLUE,
  COLOR_SPAWN_GREEN,
  COLOR_SPAWN_AMBER,
  COLOR_SPAWN_PURPLE,
];

const SPAWN_MARGIN_ABOVE = 80;
const SPAWN_MARGIN_BELOW = 80;
const MIN_RADIUS = 14;
const MAX_RADIUS = 38;
const STAR_MIN_INNER_RADIUS_RATIO = 0.4;
const STAR_INNER_RADIUS_VARIATION = 0.35;

/** Kinds used for timer spawn (excludes irregular). */
const SPAWN_KINDS = [
  ShapeKind.Triangle,
  ShapeKind.Rectangle,
  ShapeKind.Pentagon,
  ShapeKind.Hexagon,
  ShapeKind.Circle,
  ShapeKind.Ellipse,
  ShapeKind.Star,
] as const;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Returns random ShapeParams for timer-based spawn. */
function getRandomSpawnParams(): ShapeParams {
  const kind = SPAWN_KINDS[Math.floor(Math.random() * SPAWN_KINDS.length)];
  const radius = randomInRange(MIN_RADIUS, MAX_RADIUS);
  if (kind === ShapeKind.Ellipse) {
    const radiusY = randomInRange(radius, radius);
    return normalizeParams(kind, { radiusX: radius, radiusY });
  }
  if (kind === ShapeKind.Star) {
    // Randomly generate the number of points for the star shape.
    // We want stars to have between 4 and 6 points.
    const STAR_MIN_POINTS = 4;
    const STAR_MAX_POINTS = 6;
    const STAR_POINT_SPAN = STAR_MAX_POINTS - STAR_MIN_POINTS + 1;
    const points = STAR_MIN_POINTS + Math.floor(Math.random() * STAR_POINT_SPAN);
    const innerRadius = radius * (STAR_MIN_INNER_RADIUS_RATIO + Math.random() * STAR_INNER_RADIUS_VARIATION);
    return normalizeParams(kind, { radius, points, innerRadius });
  }
  return normalizeParams(kind, { radius, rotation: Math.random() * Math.PI * 2 });
}

export type ShapeSpawnerOptions = {
  shapesContainer: Container;
  playfieldRect: Rect;
  getSpawnRate: () => number;
  getGravity: () => number;
};

/**
 * Spawns shapes above the playfield at a rate (shapes per second) from .spawn-value.
 * Updates all active shapes (gravity) and removes those that have fallen below the playfield.
 */
export class ShapeSpawner {
  private readonly shapesContainer: Container;
  private readonly playfieldRect: Rect;
  private readonly getSpawnRate: () => number;
  private readonly getGravity: () => number;

  private readonly activeShapes: IShape[] = [];
  private readonly pool: IShape[] = [];
  private spawnAccumulator = 0;

  constructor(options: ShapeSpawnerOptions) {
    this.shapesContainer = options.shapesContainer;
    this.playfieldRect = options.playfieldRect;
    this.getSpawnRate = options.getSpawnRate;
    this.getGravity = options.getGravity;
  }

  /** Call every frame with delta in seconds. Spawns when interval elapsed; updates and culls shapes. */
  update(deltaSeconds: number): void {
    const rate = this.getSpawnRate();
    if (rate > 0) {
      this.spawnAccumulator += deltaSeconds;
      const interval = 1 / rate;
      while (this.spawnAccumulator >= interval) {
        this.spawnOne();
        this.spawnAccumulator -= interval;
      }
    }

    for (let i = this.activeShapes.length - 1; i >= 0; i--) {
      const shape = this.activeShapes[i];
      shape.update(deltaSeconds);
      const local = shape.getBounds();
      const worldBottom = shape.displayObject.position.y + local.bottom;
      const refBottom = this.playfieldRect.bottom + SPAWN_MARGIN_BELOW;
      if (worldBottom > refBottom) {
        //Just in case any future implementation doesn't have a pool
        if (shape.recycle) {
          shape.recycle();
          this.pool.push(shape);
        } else {
          shape.destroy();
        }
        this.activeShapes.splice(i, 1);
      }
    }
  }

  /** Spawn one shape above the playfield with random kind, position, and one of five colors. */
  spawnOne(): void {
    const params = getRandomSpawnParams();
    const padding = MAX_RADIUS * 2;
    const width = this.playfieldRect.right - this.playfieldRect.left - padding;
    const x = this.playfieldRect.left + padding / 2 + (width > 0 ? Math.random() * width : 0);
    const y = this.playfieldRect.top - SPAWN_MARGIN_ABOVE;
    const color = SPAWN_COLORS[Math.floor(Math.random() * SPAWN_COLORS.length)];
    const gravity = this.getGravity();

    let shape: IShape;
    if (this.pool.length > 0) {
      shape = this.pool.pop()!;
      shape.reset!({
        x,
        y,
        color,
        velocityY: 0,
        gravity,
        params,
      });
    } else {
      shape = new Shape({
        x,
        y,
        params,
        color,
        velocityY: 0,
        gravity,
      });
    }
    this.shapesContainer.addChild(shape.displayObject);
    this.activeShapes.push(shape);
  }

  getActiveShapes(): readonly IShape[] {
    return this.activeShapes;
  }
}
