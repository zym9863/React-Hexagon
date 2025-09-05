import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createBall, updateBallPhysics, handleWallCollision, Vector } from '../utils/physics';
import type { Ball } from '../utils/physics';
import { 
  checkHexagonCollision, 
  generateHexagonVertices, 
  constrainBallInsideHexagon 
} from '../utils/collision';
import ParticleSystem from './ParticleSystem';
import StatsPanel from './StatsPanel';
import audioManager, { SoundType } from '../utils/audio';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);

  /**
   * 更新音效设置
   */
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
    audioManager.setMasterVolume(soundVolume);
  }, [soundEnabled, soundVolume]);

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

      <div className="control-group">
        <label>
          音效开关:
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`control-button ${soundEnabled ? '' : 'disabled'}`}
              style={{ 
                background: soundEnabled 
                  ? 'linear-gradient(135deg, #00ff88, #00cc6a)' 
                  : 'linear-gradient(135deg, #666, #555)',
                minWidth: '80px'
              }}
            >
              {soundEnabled ? '🔊 开启' : '🔇 关闭'}
            </button>
          </div>
        </label>
      </div>

      {soundEnabled && (
        <div className="control-group">
          <label>
            音效音量:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
            />
            <span>{Math.round(soundVolume * 100)}%</span>
          </label>
        </div>
      )}
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
  const ballTrailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const collisionEffectsRef = useRef<{ x: number; y: number; life: number; maxLife: number; particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] }[]>([]);
  const collisionCountRef = useRef<number>(0);
  
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
   * 绘制增强版六边形（带霓虹灯光效果）
   */
  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    rotation: number
  ) => {
    const vertices = generateHexagonVertices(centerX, centerY, radius, rotation);
    
    // 绘制外层发光效果
    for (let i = 3; i >= 0; i--) {
      const glowRadius = radius + i * 8;
      const glowVertices = generateHexagonVertices(centerX, centerY, glowRadius, rotation);
      
      ctx.beginPath();
      ctx.moveTo(glowVertices[0].x, glowVertices[0].y);
      
      for (let j = 1; j < glowVertices.length; j++) {
        ctx.lineTo(glowVertices[j].x, glowVertices[j].y);
      }
      ctx.closePath();
      
      // 渐变发光效果
      const alpha = (0.15 - i * 0.03) * (0.8 + Math.sin(Date.now() * 0.003) * 0.2);
      ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
      ctx.lineWidth = 2 + i;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15 + i * 5;
      ctx.stroke();
    }
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    
    // 绘制主要六边形轮廓（带脉冲效果）
    const pulseIntensity = 0.8 + Math.sin(Date.now() * 0.005) * 0.3;
    ctx.strokeStyle = `rgba(0, 255, 136, ${pulseIntensity})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.stroke();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // 添加内部渐变背景
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.08)');
    gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0.01)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制六边形顶点的装饰效果
    vertices.forEach((vertex) => {
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${pulseIntensity * 0.8})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fill();
    });
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, []);
  
  /**
   * 绘制增强版小球（带拖尾和发光效果）
   */
  const drawBall = useCallback((
    ctx: CanvasRenderingContext2D,
    ballState: Ball
  ) => {
    const { position, radius, velocity } = ballState;
    
    // 更新拖尾
    ballTrailRef.current.unshift({ x: position.x, y: position.y, alpha: 1.0 });
    
    // 限制拖尾长度
    const maxTrailLength = 15;
    if (ballTrailRef.current.length > maxTrailLength) {
      ballTrailRef.current = ballTrailRef.current.slice(0, maxTrailLength);
    }
    
    // 更新拖尾透明度
    ballTrailRef.current.forEach((point, index) => {
      point.alpha = 1.0 - (index / maxTrailLength);
    });
    
    // 绘制拖尾
    ballTrailRef.current.forEach((point, index) => {
      if (index === 0) return; // 跳过当前位置
      
      const trailRadius = radius * (1 - index / maxTrailLength) * 0.8;
      const alpha = point.alpha * 0.6;
      
      if (trailRadius > 0.5 && alpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 拖尾渐变
        const trailGradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, trailRadius * 2
        );
        trailGradient.addColorStop(0, '#ff6b6b');
        trailGradient.addColorStop(0.5, '#ee5a24');
        trailGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailRadius, 0, 2 * Math.PI);
        ctx.fillStyle = trailGradient;
        ctx.fill();
        
        ctx.restore();
      }
    });
    
    // 计算速度大小用于发光强度
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const glowIntensity = Math.min(speed / 300, 1.0) * 0.8 + 0.3;
    
    // 绘制外层发光效果
    for (let i = 3; i >= 0; i--) {
      ctx.save();
      ctx.globalAlpha = glowIntensity * (0.3 - i * 0.06);
      
      const glowRadius = radius + i * 6;
      const glowGradient = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, glowRadius
      );
      glowGradient.addColorStop(0, '#ff6b6b');
      glowGradient.addColorStop(0.4, '#ee5a24');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(position.x, position.y, glowRadius, 0, 2 * Math.PI);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      ctx.restore();
    }
    
    // 绘制小球主体
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
    gradient.addColorStop(0.8, '#ee5a24');
    gradient.addColorStop(1, '#c0392b');
    
    ctx.fillStyle = gradient;
    
    // 添加动态阴影效果
    ctx.shadowColor = `rgba(238, 90, 36, ${glowIntensity})`;
    ctx.shadowBlur = 15 + speed / 30;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fill();
    
    // 绘制小球内部高光
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    const highlightGradient = ctx.createRadialGradient(
      position.x - radius * 0.4,
      position.y - radius * 0.4,
      0,
      position.x - radius * 0.4,
      position.y - radius * 0.4,
      radius * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(position.x - radius * 0.3, position.y - radius * 0.3, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = highlightGradient;
    ctx.fill();
    
    ctx.restore();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, []);
  
  /**
   * 创建碰撞特效
   */
  const createCollisionEffect = useCallback((x: number, y: number) => {
    const particles = [];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 150 + Math.random() * 100;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color: Math.random() > 0.5 ? '#ff6b6b' : '#00ff88',
      });
    }
    
    collisionEffectsRef.current.push({
      x,
      y,
      life: 50,
      maxLife: 50,
      particles,
    });
  }, []);
  
  /**
   * 更新和渲染碰撞特效
   */
  const updateAndDrawCollisionEffects = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    collisionEffectsRef.current.forEach((effect, effectIndex) => {
      effect.life -= deltaTime * 60;
      
      // 更新粒子
      effect.particles.forEach((particle) => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vx *= 0.98; // 阻尼
        particle.vy *= 0.98;
        particle.life -= deltaTime * 60;
        
        // 绘制粒子
        if (particle.life > 0) {
          const alpha = particle.life / 50;
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // 绘制发光粒子
          const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, 8
          );
          glowGradient.addColorStop(0, particle.color);
          glowGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // 绘制核心
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });
      
      // 移除过期的特效
      if (effect.life <= 0) {
        collisionEffectsRef.current.splice(effectIndex, 1);
      }
    });
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
          // 创建碰撞特效
          createCollisionEffect(updatedBall.position.x, updatedBall.position.y);
          
          // 增加碰撞计数
          collisionCountRef.current += 1;
          
          // 播放碰撞音效
          const speed = Math.sqrt(updatedBall.velocity.x * updatedBall.velocity.x + updatedBall.velocity.y * updatedBall.velocity.y);
          const volume = Math.min(speed / 300, 1) * 0.8 + 0.2;
          const pitch = 0.8 + Math.random() * 0.4; // 随机音调变化
          audioManager.playSound(SoundType.COLLISION, volume, pitch);
          
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
    
    // 绘制动态渐变背景
    const backgroundGradient = ctx.createRadialGradient(
      config.canvasWidth / 2, config.canvasHeight / 2, 0,
      config.canvasWidth / 2, config.canvasHeight / 2, Math.max(config.canvasWidth, config.canvasHeight) / 2
    );
    const time = Date.now() * 0.001;
    const r = Math.sin(time * 0.3) * 30 + 20;
    const g = Math.sin(time * 0.5) * 30 + 20;
    const b = Math.sin(time * 0.7) * 30 + 30;
    
    backgroundGradient.addColorStop(0, `rgb(${r + 10}, ${g + 10}, ${b + 10})`);
    backgroundGradient.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
    backgroundGradient.addColorStop(1, `rgb(${r - 10}, ${g - 10}, ${b - 5})`);
    
    ctx.fillStyle = backgroundGradient;
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
    
    // 绘制碰撞特效
    updateAndDrawCollisionEffects(ctx, deltaTime);
    
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
    
    // 激活音频上下文
    audioManager.activate();
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    setBall(prevBall => {
      const direction = Vector.subtract({ x: clickX, y: clickY }, prevBall.position);
      const normalizedDirection = Vector.normalize(direction);
      const impulse = Vector.multiply(normalizedDirection, 300); // 冲击力大小
      
      // 播放点击音效
      audioManager.playSound(SoundType.CLICK, 0.6, 1.2);
      
      // 根据冲击力播放呼啸音效
      const speed = Vector.magnitude(impulse);
      if (speed > 200) {
        audioManager.playSound(SoundType.WHOOSH, 0.4, 1 + speed / 1000);
      }
      
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
        <div className="canvas-container" style={{ position: 'relative' }}>
          <ParticleSystem 
            width={config.canvasWidth}
            height={config.canvasHeight}
            particleCount={40}
          />
          <canvas
            ref={canvasRef}
            width={config.canvasWidth}
            height={config.canvasHeight}
            onClick={handleCanvasClick}
            className="game-canvas"
            style={{ position: 'relative', zIndex: 2 }}
          />
        </div>
        <div className="instructions">
          <p>点击画布给小球施加力量！</p>
          <p>小球会受重力和摩擦力影响，在旋转的六边形内弹跳</p>
        </div>
      </div>
      
      <div className="panels-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <ControlPanel
          config={config}
          isPaused={isPaused}
          onConfigChange={handleConfigChange}
          onTogglePause={() => setIsPaused(!isPaused)}
          onResetBall={resetBall}
        />
        
        <StatsPanel
          ballVelocity={ball.velocity}
          collisionCount={collisionCountRef.current}
          isPlaying={!isPaused}
        />
      </div>
    </div>
  );
};

export default HexagonBounce;