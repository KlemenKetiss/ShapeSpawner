import type { Point, Rect } from '../shapes/types';
// Basically it's a function that calculates the area of a polygon using the shoelace formula.
// Shoelace formula is a way to calculate the area of a polygon by summing the products of the x and y coordinates of the vertices.
// Why I decided to use this because I wanted to calculate the area that is inside the rectangle not full areas of all shapes that are currently spawned.

/** Minimum number of vertices for a valid polygon. */
const MIN_POLYGON_VERTICES = 3;
/** Shoelace formula: area = |sum| / 2. */
const SHOELACE_AREA_FACTOR = 0.5;

/** Area of a polygon (vertices in order) using the shoelace formula. */
export function polygonArea(points: Point[]): number {
  const n = points.length;
  if (n < MIN_POLYGON_VERTICES) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) * SHOELACE_AREA_FACTOR;
}

function clipEdge(
  points: Point[],
  inside: (p: Point) => boolean,
  intersect: (a: Point, b: Point) => Point
): Point[] {
  const out: Point[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const aIn = inside(a);
    const bIn = inside(b);
    if (aIn && bIn) {
      out.push(b);
    } else if (aIn && !bIn) {
      out.push(intersect(a, b));
    } else if (!aIn && bIn) {
      out.push(intersect(a, b));
      out.push(b);
    }
  }
  return out;
}

/** Clip a polygon to a rectangle using Sutherland–Hodgman. Returns vertices of polygon ∩ rect. */
export function clipPolygonAgainstRect(points: Point[], rect: Rect): Point[] {
  if (points.length < MIN_POLYGON_VERTICES) return [];

  let output = [...points];

  // left: x >= rect.left
  output = clipEdge(
    output,
    (p) => p.x >= rect.left,
    (a, b) => {
      const t = (rect.left - a.x) / (b.x - a.x);
      return { x: rect.left, y: a.y + t * (b.y - a.y) };
    }
  );
  if (output.length < MIN_POLYGON_VERTICES) return output;

  // right: x <= rect.right
  output = clipEdge(
    output,
    (p) => p.x <= rect.right,
    (a, b) => {
      const t = (rect.right - a.x) / (b.x - a.x);
      return { x: rect.right, y: a.y + t * (b.y - a.y) };
    }
  );
  if (output.length < MIN_POLYGON_VERTICES) return output;

  // top: y >= rect.top
  output = clipEdge(
    output,
    (p) => p.y >= rect.top,
    (a, b) => {
      const t = (rect.top - a.y) / (b.y - a.y);
      return { x: a.x + t * (b.x - a.x), y: rect.top };
    }
  );
  if (output.length < MIN_POLYGON_VERTICES) return output;

  // bottom: y <= rect.bottom
  output = clipEdge(
    output,
    (p) => p.y <= rect.bottom,
    (a, b) => {
      const t = (rect.bottom - a.y) / (b.y - a.y);
      return { x: a.x + t * (b.x - a.x), y: rect.bottom };
    }
  );

  return output;
}
