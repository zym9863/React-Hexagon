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
  const [clickEffects, setClickEffects] = useState<Array<{
    x: number;
    y: number;
    time: number;
    id: number;
  }>>([]);
  
  /**
   * 绘制点击效果
   */
  const drawClickEffects = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    clickEffects.forEach(effect => {
      const age = currentTime - effect.time;
      const maxAge = 1000; // 1秒
      
      if (age < maxAge) {
        const progress = age / maxAge;
        const radius = 20 * progress;
        const alpha = 1 - progress;
        
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 内圈
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius * 0.5, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    
    // 清理过期效果
    setClickEffects(prev => prev.filter(effect => currentTime - effect.time < 1000));
  }, [clickEffects]);

  /**
   * 绘制星空背景
   */
  const drawStarfield = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.5) % config.canvasWidth;
      const y = (i * 197.3) % config.canvasHeight;
      const brightness = 0.3 + 0.5 * Math.sin(time * 0.001 + i);
      
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fill();
    }
  }, [config.canvasWidth, config.canvasHeight]);

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
    
    // 添加内部渐变背景
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    innerGradient.addColorStop(0, 'rgba(0, 255, 136, 0.15)');
    innerGradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.08)');
    innerGradient.addColorStop(1, 'rgba(0, 255, 136, 0.02)');
    
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // 绘制发光轮廓效果
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 添加额外的发光层
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    
    ctx.restore();
    
    // 绘制边框高光
    ctx.strokeStyle = '#4fffb0';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);
  
  /**
   * 绘制小球
   */
  const drawBall = useCallback((
    ctx: CanvasRenderingContext2D,
    ballState: Ball
  ) => {
    const { position, radius } = ballState;
    
    // 绘制发光光晕
    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius * 3
    );
    glowGradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
    glowGradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.1)');
    glowGradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 3, 0, 2 * Math.PI);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    ctx.restore();
    
    // 绘制主体小球
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    
    // 创建更丰富的径向渐变
    const gradient = ctx.createRadialGradient(
      position.x - radius * 0.4,
      position.y - radius * 0.4,
      0,
      position.x,
      position.y,
      radius * 1.2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#ffeb3b');
    gradient.addColorStop(0.5, '#ff6b6b');
    gradient.addColorStop(0.8, '#ee5a24');
    gradient.addColorStop(1, '#c44569');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 添加边框高光
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // 添加内部高光点
    ctx.beginPath();
    ctx.arc(position.x - radius * 0.3, position.y - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
    const highlightGradient = ctx.createRadialGradient(
      position.x - radius * 0.3, position.y - radius * 0.3, 0,
      position.x - radius * 0.3, position.y - radius * 0.3, radius * 0.3
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fill();
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
    
    // 绘制渐变背景
    const backgroundGradient = ctx.createRadialGradient(
      config.canvasWidth / 2, config.canvasHeight / 2, 0,
      config.canvasWidth / 2, config.canvasHeight / 2, Math.max(config.canvasWidth, config.canvasHeight) / 2
    );
    backgroundGradient.addColorStop(0, '#1a1a2e');
    backgroundGradient.addColorStop(0.5, '#16213e');
    backgroundGradient.addColorStop(1, '#0f0f0f');
    
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // 绘制星空背景
    drawStarfield(ctx, currentTime);
    
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
    
    // 绘制点击效果
    drawClickEffects(ctx, currentTime);
    
    // 绘制暂停提示
    if (isPaused) {
      // 绘制半透明遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
      
      // 绘制暂停文字背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(config.canvasWidth / 2 - 60, config.canvasHeight / 2 - 30, 120, 60);
      
      // 绘制暂停文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂停', config.canvasWidth / 2, config.canvasHeight / 2);
      
      // 重置文字对齐
      ctx.textBaseline = 'alphabetic';
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [config, ball, isPaused, drawHexagon, drawBall, drawStarfield, drawClickEffects]);
  
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
    
    // 添加点击效果
    setClickEffects(prev => [...prev, {
      x: clickX,
      y: clickY,
      time: performance.now(),
      id: Math.random()
    }]);
    
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