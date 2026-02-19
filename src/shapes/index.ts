export type { IShape, ShapeResetOptions } from './IShape';
export { Shape, type ShapeOptions } from './Shape';
export {
  drawShape,
  getPolygonForKind,
  getAreaForKind,
  getBoundsLocalForKind,
  getBoundsForKind,
  containsPointForKind,
  normalizeParams,
  type ShapeParams,
} from './shapeGeometry';
export { ShapeKind, type Point, type Rect, type ShapeKind as ShapeKindType } from './types';
