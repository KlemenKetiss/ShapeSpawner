import type { Container } from 'pixi.js';
import type { IShape } from '../shapes/IShape';
import type { Point, Rect } from '../shapes/types';
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

// --- General spawn margins/constants ---
const SPAWN_MARGIN_ABOVE = 80;
const SPAWN_MARGIN_BELOW = 80;
/** Cap active shapes to avoid overload (e.g. autoclicker). */
const MAX_ACTIVE_SHAPES = 250;
const ROTATION_RANDOMIZATION = Math.PI * 2;

// --- General shape radiuses ---
const MIN_RADIUS = 14;
const MAX_RADIUS = 38;
const FULL_CIRCLE = Math.PI * 2;

// --- Irregular shape constants ---
const IRREGULAR_MIN_VERTICES = 5;
const IRREGULAR_MAX_VERTICES = 12;
const ANGLE_RANDOMIZATION_IRREGULAR = 0.4;
const MIN_RADIUS_FACTOR_IRREGULAR = 0.6;

// --- Star shape constants ---
const STAR_MIN_POINTS = 4; // min 4 points
const STAR_MAX_POINTS = 6; // max 6 points
const STAR_POINT_SPAN = STAR_MAX_POINTS - STAR_MIN_POINTS + 1;
const STAR_MIN_INNER_RADIUS_RATIO = 0.4;
const STAR_INNER_RADIUS_VARIATION = 0.35;

/** Kinds used for timer spawn (including irregular). */
const SPAWN_KINDS = [
  ShapeKind.Triangle,
  ShapeKind.Rectangle,
  ShapeKind.Pentagon,
  ShapeKind.Hexagon,
  ShapeKind.Circle,
  ShapeKind.Ellipse,
  ShapeKind.Star,
  ShapeKind.Irregular,
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
    const points = STAR_MIN_POINTS + Math.floor(Math.random() * STAR_POINT_SPAN);
    const innerRadius = radius * (STAR_MIN_INNER_RADIUS_RATIO + Math.random() * STAR_INNER_RADIUS_VARIATION);
    return normalizeParams(kind, { radius, points, innerRadius });
  }
  if (kind === ShapeKind.Irregular) {
    const numVertices =
      IRREGULAR_MIN_VERTICES + Math.floor(Math.random() * (IRREGULAR_MAX_VERTICES - IRREGULAR_MIN_VERTICES + 1));
    const vertices: Point[] = [];
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * FULL_CIRCLE + Math.random() * ANGLE_RANDOMIZATION_IRREGULAR;
      const r = randomInRange(radius * MIN_RADIUS_FACTOR_IRREGULAR, radius);
      vertices.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    vertices.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
    return { kind: 'irregular', vertices };
  }
  return normalizeParams(kind, { radius, rotation: Math.random() * ROTATION_RANDOMIZATION });
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

    const gravity = this.getGravity();

    for (let i = this.activeShapes.length - 1; i >= 0; i--) {
      const shape = this.activeShapes[i];
      if (shape.setGravity) {
        shape.setGravity(gravity);
      }
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

  /** Extra logical units around the click point to count as a hit (makes click area slightly larger). */
  private static readonly HIT_PADDING = 5;

  /**
   * If the point (in playfield coordinates) hits a shape, remove it and return it to the pool (same as despawning).
   * Uses a slightly larger hit area (center + padding in 4 directions). Top-most shape wins. Returns true if removed.
   */
  removeShapeAt(playfieldX: number, playfieldY: number): boolean {
    const p = ShapeSpawner.HIT_PADDING;
    const hitPoints: [number, number][] = [
      [playfieldX, playfieldY],
      [playfieldX + p, playfieldY],
      [playfieldX - p, playfieldY],
      [playfieldX, playfieldY + p],
      [playfieldX, playfieldY - p],
    ];
    for (let i = this.activeShapes.length - 1; i >= 0; i--) {
      const shape = this.activeShapes[i];
      const hit = hitPoints.some(([x, y]) => shape.containsPoint(x, y));
      if (hit) {
        if (shape.recycle) {
          shape.recycle();
          this.pool.push(shape);
        } else {
          shape.destroy();
        }
        this.activeShapes.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /** Spawn one shape above the playfield with random kind, position, and one of five colors. */
  spawnOne(): void {
    const params = getRandomSpawnParams();
    const padding = MAX_RADIUS * 2;
    const width = this.playfieldRect.right - this.playfieldRect.left - padding;
    const x = this.playfieldRect.left + padding / 2 + (width > 0 ? Math.random() * width : 0);
    const y = this.playfieldRect.top - SPAWN_MARGIN_ABOVE;
    this.addShapeAt(x, y, params);
  }

  /**
   * Spawn one shape at the given playfield coordinates (e.g. on click in empty area).
   * Uses random kind, color, and current gravity.
   */
  spawnOneAt(playfieldX: number, playfieldY: number): void {
    const params = getRandomSpawnParams();
    this.addShapeAt(playfieldX, playfieldY, params);
  }

  private addShapeAt(x: number, y: number, params: ShapeParams): void {
    if (this.activeShapes.length >= MAX_ACTIVE_SHAPES) return;
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
