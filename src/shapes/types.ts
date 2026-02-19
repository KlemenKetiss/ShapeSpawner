/**
 * Shared types for shapes and playfield geometry.
 */

export type Point = { x: number; y: number };

//This is a playfield rectangle
export type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Possible shapes */
export const ShapeKind = {
  Triangle: 'triangle',
  Rectangle: 'rectangle',
  Pentagon: 'pentagon',
  Hexagon: 'hexagon',
  Circle: 'circle',
  Ellipse: 'ellipse',
  Star: 'star',
  Irregular: 'irregular',
} as const;

// This is so the ShapeKind is a string literal type and not a string
// Example it can be "rectangle or ShapeKind.Rectangle" and not "square"
export type ShapeKind = (typeof ShapeKind)[keyof typeof ShapeKind];
