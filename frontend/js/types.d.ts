/**
 * Represents the possible states of magnetization.
 */
export enum Magnetization {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NONE = 'none',
}

/**
 * @interface TriangleMagnetization
 * @property a - The magnetization state of the top left vertex in a triangle.
 * This can be also be the top for a flipped triangle
 * @property b - The magnetization state of the top right vertex in a triangle.
 * This can be also be the bottom right vertex for a flipped triangle.
 * @property c - The magnetization state of the bottom vertex in a triangle.
 * This can be also be the for a bottom left vertex flipped triangle.
 */
export interface TriangleMagnetization {
  a: Magnetization; 
  b: Magnetization;
  c: Magnetization;
}

/**
 * @interface Point
 * @property exterior - If this point is visible when rendering.
 * @property x - The x coordinate of the point.
 * @property y - The y coordinate of the point.
 * @property z - The z coordinate of the point.
 */
export interface Point {
  exterior?: boolean;
  x: number;
  y: number;
  z: number;
}

/**
 * @interface MagnetizationBlock
 * @property magnetization - The magnetization state of the inner parts of this rectangular cuboid
 * @property coordinates - Array of length 2 representing 2 faces of the rectangular
 * cuboid, each inner array holds 4 points for each vertex
 */
export interface MagnetizationBlock {
  magnetization: Magnetization;
  coordinates: Array<Array<Point>>;
}

/**
 * @interface MagneticField
 * @property points -
 * Outer array of length 2 and inner arrays of length 4 to represent the bounds of the rectangular cuboid
 * @property magnetization - Negative or positive magnetization
 */
export interface MagneticField {
  points: Array<Array<Point>>;
  magnetization: Magnetization;
}

/* Create one top level object to export so each type 
doesn't need to be imported individually in the js files */
export interface Types {
  MagnetizationState: MagnetizationState;
  Magnetization: Magnetization;
  TriangleMagnetization: TriangleMagnetization;
  Point: Point;
  MagnetizationBlock: MagnetizationBlock;
  MagneticField: MagneticField;
}
