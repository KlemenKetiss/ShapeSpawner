import { Container, Graphics } from 'pixi.js';
import type { IShape, ShapeResetOptions } from './IShape';
import type { Point, Rect } from './types';
import type { ShapeKind as ShapeKindType } from './types';
import { clipPolygonAgainstRect, polygonArea } from '../utils/geometry';
import { DEFAULT_SHAPE_COLOR } from '../config/constants';
import {
  drawShape,
  getPolygonForKind,
  getAreaForKind,
  getBoundsLocalForKind,
  containsPointForKind,
  normalizeParams,
  type ShapeParams,
} from './shapeGeometry';

/** Maps ShapeParams.kind to the IShape ShapeKind string. */
function paramsKindToShapeKind(kind: ShapeParams['kind']): ShapeKindType {
  switch (kind) {
    case 'circle':
      return 'circle';
    case 'ellipse':
      return 'ellipse';
    case 'triangle':
      return 'triangle';
    case 'rectangle':
      return 'rectangle';
    case 'pentagon':
      return 'pentagon';
    case 'hexagon':
      return 'hexagon';
    case 'star':
      return 'star';
    case 'irregular':
      return 'irregular';
    default:
      return 'circle';
  }
}

export type ShapeOptions = {
  x: number;
  y: number;
  params: ShapeParams;
  color?: number;
  velocityY?: number;
  gravity?: number;
  rotationSpeed?: number;
};

/** Single unified shape (circle, polygon, star, irregular, etc.). Implements IShape. */
export class Shape implements IShape {
  readonly displayObject: Container;
  private readonly graphics: Graphics;
  private _params: ShapeParams;
  private _x: number;
  private _y: number;
  private _velocityY: number;
  private _gravity: number;
  private _color: number;
  private _rotationSpeed: number;
  private _alive = true;

  get kind(): ShapeKindType {
    return paramsKindToShapeKind(this._params.kind);
  }

  get isAlive(): boolean {
    return this._alive;
  }

  constructor(options: ShapeOptions) {
    const {
      x,
      y,
      params,
      color = DEFAULT_SHAPE_COLOR,
      velocityY = 0,
      gravity = 0,
      rotationSpeed = 0,
    } = options;

    this._params = params;
    this._x = x;
    this._y = y;
    this._velocityY = velocityY;
    this._gravity = gravity;
    this._color = color;
    this._rotationSpeed = rotationSpeed;

    this.graphics = new Graphics();
    drawShape(this.graphics, this._params, this._color);
    this.displayObject = new Container();
    this.displayObject.addChild(this.graphics);
    this.displayObject.position.set(x, y);
  }

  getAreaPx2(): number {
    return getAreaForKind(this._params);
  }

  /** Vertices in playfield space (from shapeGeometry: circle/ellipse → segments, polygons → sides, star → points). */
  getPolygon(): Point[] {
    return getPolygonForKind(this._params, this._x, this._y);
  }

  /**
   * Area of this shape that lies inside the playfield (px²).
   * Uses shape geometry: polygon in world space → clip to rect (Sutherland–Hodgman) → shoelace area.
   */
  getVisibleArea(playfieldRect: Rect): number {
    const poly = this.getPolygon();
    const clipped = clipPolygonAgainstRect(poly, playfieldRect);
    return polygonArea(clipped);
  }

  getBounds(): Rect {
    return getBoundsLocalForKind(this._params);
  }

  containsPoint(x: number, y: number): boolean {
    return containsPointForKind(this._params, this._x, this._y, x, y);
  }

  update(deltaSeconds: number): void {
    this._velocityY += this._gravity * deltaSeconds;
    this._y += this._velocityY * deltaSeconds;
    this.displayObject.position.set(this._x, this._y);
    if (this._rotationSpeed !== 0) {
      this.displayObject.rotation += this._rotationSpeed * deltaSeconds;
    }
  }

  destroy(): void {
    if (!this._alive) return;
    this._alive = false;
    this.graphics.destroy();
    this.displayObject.removeFromParent();
    this.displayObject.destroy({ children: true });
  }

  /** Remove from stage and mark inactive for pooling; does not destroy Pixi objects. */
  recycle(): void {
    if (!this._alive) return;
    this._alive = false;
    this.displayObject.removeFromParent();
  }

  reset(options: ShapeResetOptions): void {
    this._alive = true;
    this._x = options.x;
    this._y = options.y;
    this._velocityY = options.velocityY ?? 0;
    this._gravity = options.gravity ?? 0;
    this._rotationSpeed = options.rotationSpeed ?? 0;
    this.displayObject.position.set(this._x, this._y);
    this.displayObject.rotation = 0;
    if (options.color !== undefined) {
      this._color = options.color;
    }
    if (options.params !== undefined) {
      this._params = options.params;
      drawShape(this.graphics, this._params, this._color);
    } else if (options.kind !== undefined) {
      this._params = normalizeParams(options.kind, options.kindParams);
      drawShape(this.graphics, this._params, this._color);
    } else if (options.color !== undefined) {
      drawShape(this.graphics, this._params, this._color);
    }
  }
}
