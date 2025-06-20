/**
 * Represents the possible states of magnetization.
 */
enum Magnetization {
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
interface TriangleMagnetization {
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
interface Point {
  exterior?: boolean;
  x: number;
  y: number;
  z: number;
}

/**
 * @interface Vector
 * @property x - Width of the vector
 * @property y - Height of the vector
 * @property z - Length of the vector
 */
interface Vector {
  x: number;
  y: number;
  z: number;
}

/**
 * @interface MagnetizationField
 * @property points -
 * Outer array of length 2 and inner arrays of length 4 to represent the bounds of the rectangular cuboid
 * @property magnetization - Negative or positive magnetization
 */
interface MagnetizationField {
  points: Array<Array<Point>>;
  magnetization: Magnetization;
}

interface Bounds {
  min: Point;
  max: Point;
}

/* Create one top level object to export so each type 
doesn't need to be imported individually in the js files */
export interface Types {
  MagnetizationState: MagnetizationState;
  Magnetization: Magnetization;
  TriangleMagnetization: TriangleMagnetization;
  Point: Point;
  Vector: Vector;
  MagnetizationField: MagnetizationField;
  Bounds: Bounds;
}
