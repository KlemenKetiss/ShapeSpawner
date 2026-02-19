import { Graphics } from 'pixi.js';
import type { Point, Rect } from './types';
import { ShapeKind } from './types';
import type { ShapeKind as ShapeKindType } from './types';
import { polygonArea } from '../utils/geometry';

/** Parameters per shape kind. Shapes are drawn centered at (0,0) in local space. */
export type ShapeParams =
  | { kind: 'circle'; radius: number }
  | { kind: 'ellipse'; radiusX: number; radiusY: number }
  | { kind: 'triangle' | 'rectangle' | 'pentagon' | 'hexagon'; radius: number; rotation?: number }
  | { kind: 'star'; radius: number; innerRadius?: number; points: number }
  | { kind: 'irregular'; vertices: Point[] };

const CIRCLE_ELLIPSE_SEGMENTS = 32; // Here I limited the segments for performance reasons - More means more accurate but slower
const DEFAULT_CIRCLE_RADIUS = 40;
const DEFAULT_ELLIPSE_RADIUS_Y = 25;
const DEFAULT_STAR_POINTS = 5;
const DEFAULT_STAR_INNER_RATIO = 0.5;
const MIN_POLYGON_VERTICES = 3;
const FULL_CIRCLE_RADIANS = Math.PI * 2;
const ROTATION_OFFSET_TOP = -Math.PI / 2;

const TRIANGLE_SIDES = 3;
const RECTANGLE_SIDES = 4;
const PENTAGON_SIDES = 5;
const HEXAGON_SIDES = 6;

/** Draw the shape into graphics at (0,0). Clears existing path first. */
export function drawShape(graphics: Graphics, params: ShapeParams, color: number): void {
  graphics.clear();
  switch (params.kind) {
    case 'circle':
      graphics.circle(0, 0, params.radius).fill({ color });
      break;
    case 'ellipse':
      graphics.ellipse(0, 0, params.radiusX, params.radiusY).fill({ color });
      break;
    case 'triangle':
    case 'rectangle':
    case 'pentagon':
    case 'hexagon': {
      const sides =
        params.kind === 'triangle'
          ? TRIANGLE_SIDES
          : params.kind === 'rectangle'
            ? RECTANGLE_SIDES
            : params.kind === 'pentagon'
              ? PENTAGON_SIDES
              : HEXAGON_SIDES;
      const rotation = params.rotation ?? 0;
      graphics.regularPoly(0, 0, params.radius, sides, rotation).fill({ color });
      break;
    }
    case 'star':
      graphics.star(0, 0, params.points, params.radius, params.innerRadius).fill({ color });
      break;
    case 'irregular': {
      if (params.vertices.length < MIN_POLYGON_VERTICES) break;
      const flat = params.vertices.flatMap((p) => [p.x, p.y]);
      graphics.poly(flat, true).fill({ color });
      break;
    }
    default:
      break;
  }
}

// Get the area of the shape
// @return the area of the shape
// @params params are the parameters of the shape
export function getAreaForKind(params: ShapeParams): number {
  switch (params.kind) {
    case 'circle':
      return Math.PI * params.radius * params.radius;
    case 'ellipse':
      return Math.PI * params.radiusX * params.radiusY;
    case 'triangle':
    case 'rectangle':
    case 'pentagon':
    case 'hexagon':
    case 'star':
    case 'irregular': {
      const poly = getPolygonForKind(params, 0, 0);
      return polygonArea(poly);
    }
    default:
      return 0;
  }
}

// Get the axis-aligned bounds in local space (shape centered at 0,0)
// @return the axis-aligned bounds in local space
// @params params are the parameters of the shape
export function getBoundsLocalForKind(params: ShapeParams): Rect {
  const poly = getPolygonForKind(params, 0, 0);
  if (poly.length === 0) return { left: 0, right: 0, top: 0, bottom: 0 };
  let left = poly[0].x;
  let right = poly[0].x;
  let top = poly[0].y;
  let bottom = poly[0].y;
  for (let i = 1; i < poly.length; i++) {
    left = Math.min(left, poly[i].x);
    right = Math.max(right, poly[i].x);
    top = Math.min(top, poly[i].y);
    bottom = Math.max(bottom, poly[i].y);
  }
  return { left, right, top, bottom };
}

// Vertices in world space (caller adds x, y)
// @return the vertices of the shape in world space
// @params x and y are the position of the shape in the world space
// @params params are the parameters of the shape
export function getPolygonForKind(params: ShapeParams, x: number, y: number): Point[] {
  switch (params.kind) {
    case 'circle': {
      const r = params.radius;
      const points: Point[] = [];
      for (let i = 0; i < CIRCLE_ELLIPSE_SEGMENTS; i++) {
        const t = (i / CIRCLE_ELLIPSE_SEGMENTS) * FULL_CIRCLE_RADIANS;
        points.push({ x: x + r * Math.cos(t), y: y + r * Math.sin(t) });
      }
      return points;
    }
    case 'ellipse': {
      const rx = params.radiusX;
      const ry = params.radiusY;
      const points: Point[] = [];
      for (let i = 0; i < CIRCLE_ELLIPSE_SEGMENTS; i++) {
        const t = (i / CIRCLE_ELLIPSE_SEGMENTS) * FULL_CIRCLE_RADIANS;
        points.push({ x: x + rx * Math.cos(t), y: y + ry * Math.sin(t) });
      }
      return points;
    }
    case 'triangle':
    case 'rectangle':
    case 'pentagon':
    case 'hexagon': {
      const sides =
        params.kind === 'triangle'
          ? TRIANGLE_SIDES
          : params.kind === 'rectangle'
            ? RECTANGLE_SIDES
            : params.kind === 'pentagon'
              ? PENTAGON_SIDES
              : HEXAGON_SIDES;
      const r = params.radius;
      const rot = params.rotation ?? 0;
      const points: Point[] = [];
      for (let i = 0; i < sides; i++) {
        const t = rot + (i / sides) * FULL_CIRCLE_RADIANS + ROTATION_OFFSET_TOP;
        points.push({ x: x + r * Math.cos(t), y: y + r * Math.sin(t) });
      }
      return points;
    }
    case 'star': {
      const outer = params.radius;
      const inner = params.innerRadius ?? outer * DEFAULT_STAR_INNER_RATIO;
      const n = params.points;
      const points: Point[] = [];
      const starVertices = n * 2;
      for (let i = 0; i < starVertices; i++) {
        const t = (i / starVertices) * FULL_CIRCLE_RADIANS + ROTATION_OFFSET_TOP;
        const r = i % 2 === 0 ? outer : inner;
        points.push({ x: x + r * Math.cos(t), y: y + r * Math.sin(t) });
      }
      return points;
    }
    case 'irregular':
      return params.vertices.map((p) => ({ x: x + p.x, y: y + p.y }));
    default:
      return [];
  }
}

// Get the axis-aligned bounds in world space
// @return the axis-aligned bounds in world space
// @params params are the parameters of the shape
// @params x and y are the position of the shape in the world space
export function getBoundsForKind(params: ShapeParams, x: number, y: number): Rect {
  const local = getBoundsLocalForKind(params);
  return {
    left: local.left + x,
    right: local.right + x,
    top: local.top + y,
    bottom: local.bottom + y,
  };
}

/** Whether point (px, py) is inside the shape. Uses ray-cast for polygons; circle/ellipse use formula. */
export function containsPointForKind(params: ShapeParams, x: number, y: number, px: number, py: number): boolean {
  switch (params.kind) {
    case 'circle': {
      const dx = px - x;
      const dy = py - y;
      return dx * dx + dy * dy <= params.radius * params.radius;
    }
    case 'ellipse': {
      const nx = (px - x) / params.radiusX;
      const ny = (py - y) / params.radiusY;
      return nx * nx + ny * ny <= 1;
    }
    default: {
      const poly = getPolygonForKind(params, x, y);
      return pointInPolygon(px, py, poly);
    }
  }
}

function pointInPolygon(px: number, py: number, points: Point[]): boolean {
  const n = points.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Normalize to ShapeParams from kind + optional partial params (e.g. for factory). */
export function normalizeParams(
  kind: ShapeKindType,
  params?: Partial<Record<string, number>> & { vertices?: Point[] }
): ShapeParams {
  switch (kind) {
    case ShapeKind.Circle:
      return { kind: 'circle', radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS };
    case ShapeKind.Ellipse:
      return {
        kind: 'ellipse',
        radiusX: params?.radiusX ?? DEFAULT_CIRCLE_RADIUS,
        radiusY: params?.radiusY ?? DEFAULT_ELLIPSE_RADIUS_Y,
      };
    case ShapeKind.Triangle:
      return { kind: 'triangle', radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS, rotation: params?.rotation };
    case ShapeKind.Rectangle:
      return { kind: 'rectangle', radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS, rotation: params?.rotation };
    case ShapeKind.Pentagon:
      return { kind: 'pentagon', radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS, rotation: params?.rotation };
    case ShapeKind.Hexagon:
      return { kind: 'hexagon', radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS, rotation: params?.rotation };
    case ShapeKind.Star:
      return {
        kind: 'star',
        radius: params?.radius ?? DEFAULT_CIRCLE_RADIUS,
        innerRadius: params?.innerRadius,
        points: params?.points ?? DEFAULT_STAR_POINTS,
      };
    case ShapeKind.Irregular:
      return { kind: 'irregular', vertices: params?.vertices ?? [] };
    default:
      return { kind: 'circle', radius: DEFAULT_CIRCLE_RADIUS };
  }
}
