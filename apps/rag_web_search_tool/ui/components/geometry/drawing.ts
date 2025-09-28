/**
 * Geometry and drawing utilities
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const angle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

export const midpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export const normalize = (p: Point): Point => {
  const length = Math.sqrt(p.x * p.x + p.y * p.y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: p.x / length,
    y: p.y / length,
  };
};

export const scale = (p: Point, factor: number): Point => {
  return {
    x: p.x * factor,
    y: p.y * factor,
  };
};

export const add = (p1: Point, p2: Point): Point => {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  };
};

export const subtract = (p1: Point, p2: Point): Point => {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
  };
};

export const rotate = (p: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  };
};

export const isPointInRect = (point: Point, rect: Rect): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

export const rectIntersection = (rect1: Rect, rect2: Rect): Rect | null => {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

  if (x1 < x2 && y1 < y2) {
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    };
  }

  return null;
};

export const rectUnion = (rect1: Rect, rect2: Rect): Rect => {
  const x1 = Math.min(rect1.x, rect2.x);
  const y1 = Math.min(rect1.y, rect2.y);
  const x2 = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
};
