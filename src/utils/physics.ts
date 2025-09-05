// 二维向量类型定义
export interface Vector2D {
  x: number;
  y: number;
}

// 小球状态类型定义
export interface Ball {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
}

// 物理常量
export const PHYSICS_CONSTANTS = {
  GRAVITY: 500, // 重力加速度 (pixels/s²)
  FRICTION: 0.98, // 摩擦系数
  BOUNCE_DAMPING: 0.85, // 反弹能量损失系数
  MIN_VELOCITY: 0.1, // 最小速度阈值
} as const;

// 向量工具函数
export class Vector {
  /**
   * 创建新向量
   */
  static create(x: number, y: number): Vector2D {
    return { x, y };
  }

  /**
   * 向量加法
   */
  static add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  /**
   * 向量减法
   */
  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  /**
   * 向量数乘
   */
  static multiply(vector: Vector2D, scalar: number): Vector2D {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }

  /**
   * 向量点积
   */
  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * 向量长度
   */
  static magnitude(vector: Vector2D): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  /**
   * 向量归一化
   */
  static normalize(vector: Vector2D): Vector2D {
    const mag = Vector.magnitude(vector);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: vector.x / mag, y: vector.y / mag };
  }

  /**
   * 向量旋转
   */
  static rotate(vector: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vector.x * cos - vector.y * sin,
      y: vector.x * sin + vector.y * cos,
    };
  }

  /**
   * 向量反射
   */
  static reflect(incident: Vector2D, normal: Vector2D): Vector2D {
    const normalizedNormal = Vector.normalize(normal);
    const dot = Vector.dot(incident, normalizedNormal);
    return Vector.subtract(incident, Vector.multiply(normalizedNormal, 2 * dot));
  }
}

/**
 * 更新小球的物理状态
 */
export function updateBallPhysics(ball: Ball, deltaTime: number): Ball {
  // 应用重力
  const gravity = Vector.create(0, PHYSICS_CONSTANTS.GRAVITY);
  const gravityForce = Vector.multiply(gravity, deltaTime);
  
  // 更新速度（加上重力影响）
  let newVelocity = Vector.add(ball.velocity, gravityForce);
  
  // 应用摩擦力
  newVelocity = Vector.multiply(newVelocity, PHYSICS_CONSTANTS.FRICTION);
  
  // 如果速度太小，设为零
  if (Vector.magnitude(newVelocity) < PHYSICS_CONSTANTS.MIN_VELOCITY) {
    newVelocity = { x: 0, y: 0 };
  }
  
  // 更新位置
  const velocityDelta = Vector.multiply(newVelocity, deltaTime);
  const newPosition = Vector.add(ball.position, velocityDelta);
  
  return {
    ...ball,
    position: newPosition,
    velocity: newVelocity,
  };
}

/**
 * 处理小球与墙面的碰撞
 */
export function handleWallCollision(
  ball: Ball,
  wallStart: Vector2D,
  wallEnd: Vector2D,
  distance: number
): Ball {
  if (distance > ball.radius) return ball;
  
  // 计算墙面法向量
  const wallVector = Vector.subtract(wallEnd, wallStart);
  const wallNormal = Vector.normalize({
    x: -wallVector.y,
    y: wallVector.x,
  });
  
  // 确保法向量指向小球
  const ballCenter = ball.position;
  const wallMidpoint = Vector.multiply(Vector.add(wallStart, wallEnd), 0.5);
  const ballDirection = Vector.subtract(ballCenter, wallMidpoint);
  
  if (Vector.dot(wallNormal, ballDirection) < 0) {
    wallNormal.x = -wallNormal.x;
    wallNormal.y = -wallNormal.y;
  }
  
  // 计算反射速度
  const reflectedVelocity = Vector.reflect(ball.velocity, wallNormal);
  const dampedVelocity = Vector.multiply(reflectedVelocity, PHYSICS_CONSTANTS.BOUNCE_DAMPING);
  
  // 修正小球位置（防止穿透）
  const penetration = ball.radius - distance;
  const correctionVector = Vector.multiply(wallNormal, penetration);
  const correctedPosition = Vector.add(ball.position, correctionVector);
  
  return {
    ...ball,
    position: correctedPosition,
    velocity: dampedVelocity,
  };
}

/**
 * 创建初始小球状态
 */
export function createBall(x: number, y: number, radius: number = 8): Ball {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    radius,
  };
}