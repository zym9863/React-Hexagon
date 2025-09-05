import React, { useRef, useEffect, useCallback } from 'react';

/**
 * 粒子接口定义
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  twinkle: number; // 闪烁效果
}

/**
 * 粒子系统配置接口
 */
interface ParticleSystemProps {
  width: number;
  height: number;
  particleCount?: number;
  className?: string;
}

/**
 * 粒子系统组件 - 创建动态星空背景效果
 */
const ParticleSystem: React.FC<ParticleSystemProps> = ({
  width,
  height,
  particleCount = 50,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  /**
   * 创建单个粒子
   */
  const createParticle = useCallback((): Particle => {
    const colors = ['#ffffff', '#00ff88', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
    
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5, // 水平速度
      vy: (Math.random() - 0.5) * 0.5, // 垂直速度
      life: Math.random() * 300 + 100,
      maxLife: Math.random() * 300 + 100,
      size: Math.random() * 2 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    };
  }, [width, height]);

  /**
   * 初始化粒子系统
   */
  const initParticles = useCallback(() => {
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle());
    }
  }, [particleCount, createParticle]);

  /**
   * 更新粒子状态
   */
  const updateParticles = useCallback((deltaTime: number) => {
    particlesRef.current.forEach((particle, index) => {
      // 更新位置
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;

      // 更新生命周期
      particle.life -= deltaTime * 60;

      // 更新闪烁效果
      particle.twinkle += deltaTime * 3;

      // 边界处理 - 环绕效果
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      // 重生粒子
      if (particle.life <= 0) {
        const newParticle = createParticle();
        particlesRef.current[index] = newParticle;
      }
    });
  }, [width, height, createParticle]);

  /**
   * 渲染粒子
   */
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);

    particlesRef.current.forEach((particle) => {
      const lifeRatio = particle.life / particle.maxLife;
      const twinkleAlpha = (Math.sin(particle.twinkle) + 1) * 0.5; // 0-1之间的闪烁值
      const alpha = particle.alpha * lifeRatio * twinkleAlpha;

      // 绘制粒子主体
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // 绘制发光效果
      if (alpha > 0.5) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 绘制连线效果（距离较近的粒子之间）
      particlesRef.current.forEach((otherParticle) => {
        if (particle === otherParticle) return;
        
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.globalAlpha = (1 - distance / 100) * 0.1;
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.5;
          
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      });

      ctx.restore();
    });
  }, [width, height]);

  /**
   * 动画循环
   */
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current === 0 
      ? 0 
      : Math.min((currentTime - lastTimeRef.current) / 1000, 0.016);
    
    lastTimeRef.current = currentTime;

    updateParticles(deltaTime);
    renderParticles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, renderParticles]);

  /**
   * 组件挂载时初始化
   */
  useEffect(() => {
    initParticles();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, animate]);

  /**
   * 当尺寸变化时重新初始化
   */
  useEffect(() => {
    initParticles();
  }, [width, height, particleCount, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`particle-system ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default ParticleSystem;