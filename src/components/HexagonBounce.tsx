import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createBall, updateBallPhysics, handleWallCollision, Vector } from '../utils/physics';
import type { Ball } from '../utils/physics';
import { 
  checkHexagonCollision, 
  generateHexagonVertices, 
  constrainBallInsideHexagon 
} from '../utils/collision';

/**
 * 游戏配置接口
 */
interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  hexagonRadius: number;
  rotationSpeed: number;
  ballRadius: number;
}

/**
 * 默认游戏配置
 */
const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 600,
  canvasHeight: 600,
  hexagonRadius: 200,
  rotationSpeed: 0.02,
  ballRadius: 8,
};

/**
 * 游戏控制面板组件
 */
interface ControlPanelProps {
  config: GameConfig;
  isPaused: boolean;
  onConfigChange: (config: Partial<GameConfig>) => void;
  onTogglePause: () => void;
  onResetBall: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  isPaused,
  onConfigChange,
  onTogglePause,
  onResetBall,
}) => {
  return (
    <div className="control-panel">
      <h3>控制面板</h3>
      
      <div className="control-group">
        <button onClick={onTogglePause} className="control-button">
          {isPaused ? '继续' : '暂停'}
        </button>
        <button onClick={onResetBall} className="control-button">
          重置小球
        </button>
      </div>
      
      <div className="control-group">
        <label>
          旋转速度:
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.001"
            value={config.rotationSpeed}
            onChange={(e) => onConfigChange({ rotationSpeed: parseFloat(e.target.value) })}
          />
          <span>{config.rotationSpeed.toFixed(3)}</span>
        </label>
      </div>
      
      <div className="control-group">
        <label>
          六边形大小:
          <input
            type="range"
            min="100"
            max="280"
            step="10"
            value={config.hexagonRadius}
            onChange={(e) => onConfigChange({ hexagonRadius: parseInt(e.target.value) })}
          />
          <span>{config.hexagonRadius}px</span>
        </label>
      </div>
      
      <div className="control-group">
        <label>
          小球大小:
          <input
            type="range"
            min="4"
            max="20"
            step="1"
            value={config.ballRadius}
            onChange={(e) => onConfigChange({ ballRadius: parseInt(e.target.value) })}
          />
          <span>{config.ballRadius}px</span>
        </label>
      </div>
    </div>
  );
};

/**
 * 主游戏组件
 */
const HexagonBounce: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  
  // 游戏状态
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [ball, setBall] = useState<Ball>(() => 
    createBall(
      config.canvasWidth / 2,
      config.canvasHeight / 2 - 50,
      config.ballRadius
    )
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  /**
   * 绘制六边形
   */
  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    rotation: number
  ) => {
    const vertices = generateHexagonVertices(centerX, centerY, radius, rotation);
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    
    // 绘制六边形轮廓
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 添加渐变背景
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
  }, []);
  
  /**
   * 绘制小球
   */
  const drawBall = useCallback((
    ctx: CanvasRenderingContext2D,
    ballState: Ball
  ) => {
    const { position, radius } = ballState;
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
      position.x - radius * 0.3,
      position.y - radius * 0.3,
      0,
      position.x,
      position.y,
      radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a24');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 添加阴影效果
    ctx.shadowColor = 'rgba(238, 90, 36, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, []);
  
  /**
   * 游戏渲染循环
   */
  const gameLoop = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 计算时间间隔
    const deltaTime = lastTimeRef.current === 0 
      ? 0 
      : Math.min((currentTime - lastTimeRef.current) / 1000, 0.016); // 限制最大帧时间
    
    lastTimeRef.current = currentTime;
    
    if (!isPaused) {
      // 更新旋转角度
      rotationRef.current += config.rotationSpeed;
      
      // 更新小球物理状态
      setBall(prevBall => {
        let updatedBall = updateBallPhysics(prevBall, deltaTime);
        
        // 更新小球半径
        updatedBall = { ...updatedBall, radius: config.ballRadius };
        
        // 检测与六边形的碰撞
        const hexagonCenter = { 
          x: config.canvasWidth / 2, 
          y: config.canvasHeight / 2 
        };
        
        const collision = checkHexagonCollision(
          updatedBall.position,
          updatedBall.radius,
          hexagonCenter,
          config.hexagonRadius,
          rotationRef.current
        );
        
        if (collision.hasCollision) {
          updatedBall = handleWallCollision(
            updatedBall,
            collision.wallStart,
            collision.wallEnd,
            collision.distance
          );
        }
        
        return updatedBall;
      });
    }
    
    // 清空画布
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // 绘制背景
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // 绘制六边形
    drawHexagon(
      ctx,
      config.canvasWidth / 2,
      config.canvasHeight / 2,
      config.hexagonRadius,
      rotationRef.current
    );
    
    // 绘制小球
    drawBall(ctx, ball);
    
    // 绘制暂停提示
    if (isPaused) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂停', config.canvasWidth / 2, config.canvasHeight / 2);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [config, ball, isPaused, drawHexagon, drawBall]);
  
  /**
   * 配置更新处理
   */
  const handleConfigChange = useCallback((newConfig: Partial<GameConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      // 如果六边形大小改变，需要重新约束小球位置
      if (newConfig.hexagonRadius) {
        setBall(prevBall => {
          const hexagonCenter = { 
            x: updated.canvasWidth / 2, 
            y: updated.canvasHeight / 2 
          };
          
          const constrainedPosition = constrainBallInsideHexagon(
            prevBall.position,
            updated.ballRadius,
            hexagonCenter,
            updated.hexagonRadius,
            rotationRef.current
          );
          
          return {
            ...prevBall,
            position: constrainedPosition,
            radius: updated.ballRadius,
          };
        });
      }
      
      return updated;
    });
  }, []);
  
  /**
   * 重置小球位置
   */
  const resetBall = useCallback(() => {
    const hexagonCenter = { 
      x: config.canvasWidth / 2, 
      y: config.canvasHeight / 2 
    };
    
    const newPosition = constrainBallInsideHexagon(
      { x: config.canvasWidth / 2, y: config.canvasHeight / 2 - 50 },
      config.ballRadius,
      hexagonCenter,
      config.hexagonRadius,
      rotationRef.current
    );
    
    setBall(createBall(newPosition.x, newPosition.y, config.ballRadius));
  }, [config]);
  
  /**
   * 鼠标点击事件：给小球一个初始速度
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    setBall(prevBall => {
      const direction = Vector.subtract({ x: clickX, y: clickY }, prevBall.position);
      const normalizedDirection = Vector.normalize(direction);
      const impulse = Vector.multiply(normalizedDirection, 300); // 冲击力大小
      
      return {
        ...prevBall,
        velocity: Vector.add(prevBall.velocity, impulse),
      };
    });
  }, [isPaused]);
  
  /**
   * 组件挂载时启动游戏循环
   */
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);
  
  return (
    <div className="hexagon-bounce-game">
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={config.canvasWidth}
          height={config.canvasHeight}
          onClick={handleCanvasClick}
          className="game-canvas"
        />
        <div className="instructions">
          <p>点击画布给小球施加力量！</p>
          <p>小球会受重力和摩擦力影响，在旋转的六边形内弹跳</p>
        </div>
      </div>
      
      <ControlPanel
        config={config}
        isPaused={isPaused}
        onConfigChange={handleConfigChange}
        onTogglePause={() => setIsPaused(!isPaused)}
        onResetBall={resetBall}
      />
    </div>
  );
};

export default HexagonBounce;