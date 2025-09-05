import { Vector } from './physics';
import type { Vector2D } from './physics';

/**
 * 六边形顶点类型定义
 */
export interface HexagonVertex {
  x: number;
  y: number;
}

/**
 * 线段类型定义
 */
export interface LineSegment {
  start: Vector2D;
  end: Vector2D;
}

/**
 * 碰撞检测结果
 */
export interface CollisionResult {
  hasCollision: boolean;
  distance: number;
  wallStart: Vector2D;
  wallEnd: Vector2D;
}

/**
 * 生成六边形的顶点坐标
 */
export function generateHexagonVertices(
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number = 0
): HexagonVertex[] {
  const vertices: HexagonVertex[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + rotation;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    vertices.push({ x, y });
  }
  
  return vertices;
}

/**
 * 获取六边形的边线段
 */
export function getHexagonEdges(vertices: HexagonVertex[]): LineSegment[] {
  const edges: LineSegment[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];
    edges.push({
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
    });
  }
  
  return edges;
}

/**
 * 计算点到线段的最短距离
 */
export function pointToLineSegmentDistance(
  point: Vector2D,
  lineStart: Vector2D,
  lineEnd: Vector2D
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // 线段退化为点
    return Math.sqrt(A * A + B * B);
  }
  
  let param = dot / lenSq;
  
  let closestPoint: Vector2D;
  if (param < 0) {
    closestPoint = lineStart;
  } else if (param > 1) {
    closestPoint = lineEnd;
  } else {
    closestPoint = {
      x: lineStart.x + param * C,
      y: lineStart.y + param * D,
    };
  }
  
  const dx = point.x - closestPoint.x;
  const dy = point.y - closestPoint.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 检测小球是否与六边形发生碰撞
 */
export function checkHexagonCollision(
  ballPosition: Vector2D,
  ballRadius: number,
  hexagonCenter: Vector2D,
  hexagonRadius: number,
  rotation: number
): CollisionResult {
  // 生成六边形顶点
  const vertices = generateHexagonVertices(
    hexagonCenter.x,
    hexagonCenter.y,
    hexagonRadius,
    rotation
  );
  
  // 获取六边形边线段
  const edges = getHexagonEdges(vertices);
  
  let minDistance = Infinity;
  let closestWall: LineSegment | null = null;
  
  // 检查与每条边的距离
  for (const edge of edges) {
    const distance = pointToLineSegmentDistance(ballPosition, edge.start, edge.end);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestWall = edge;
    }
  }
  
  if (!closestWall) {
    return {
      hasCollision: false,
      distance: Infinity,
      wallStart: { x: 0, y: 0 },
      wallEnd: { x: 0, y: 0 },
    };
  }
  
  return {
    hasCollision: minDistance <= ballRadius,
    distance: minDistance,
    wallStart: closestWall.start,
    wallEnd: closestWall.end,
  };
}

/**
 * 检查点是否在六边形内部
 */
export function isPointInsideHexagon(
  point: Vector2D,
  hexagonCenter: Vector2D,
  hexagonRadius: number,
  rotation: number = 0
): boolean {
  // 生成六边形顶点
  const vertices = generateHexagonVertices(
    hexagonCenter.x,
    hexagonCenter.y,
    hexagonRadius,
    rotation
  );
  
  // 使用射线投射算法
  let inside = false;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * 确保小球在六边形内部（防止初始化时在外部）
 */
export function constrainBallInsideHexagon(
  ballPosition: Vector2D,
  ballRadius: number,
  hexagonCenter: Vector2D,
  hexagonRadius: number,
  rotation: number
): Vector2D {
  const collision = checkHexagonCollision(
    ballPosition,
    ballRadius,
    hexagonCenter,
    hexagonRadius,
    rotation
  );
  
  if (!collision.hasCollision) {
    return ballPosition;
  }
  
  // 如果发生碰撞，将小球推向六边形中心
  const directionToCenter = Vector.subtract(hexagonCenter, ballPosition);
  const distanceToCenter = Vector.magnitude(directionToCenter);
  
  if (distanceToCenter === 0) {
    // 如果小球正好在中心，随机选择一个方向
    return Vector.add(ballPosition, { x: Math.random() - 0.5, y: Math.random() - 0.5 });
  }
  
  const normalizedDirection = Vector.normalize(directionToCenter);
  const safeDistance = hexagonRadius - ballRadius - 10; // 留10像素安全距离
  const safePosition = Vector.add(
    hexagonCenter,
    Vector.multiply(normalizedDirection, -safeDistance)
  );
  
  return safePosition;
}