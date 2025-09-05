import React, { useEffect, useState } from 'react';

/**
 * 游戏统计数据接口
 */
interface GameStats {
  score: number;
  bounces: number;
  maxSpeed: number;
  currentSpeed: number;
  totalTime: number;
  collisions: number;
}

/**
 * 统计面板属性接口
 */
interface StatsPanelProps {
  ballVelocity: { x: number; y: number };
  collisionCount: number;
  isPlaying: boolean;
  className?: string;
}

/**
 * 统计面板组件 - 显示游戏数据统计
 */
const StatsPanel: React.FC<StatsPanelProps> = ({
  ballVelocity,
  collisionCount,
  isPlaying,
  className = '',
}) => {
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    bounces: 0,
    maxSpeed: 0,
    currentSpeed: 0,
    totalTime: 0,
    collisions: 0,
  });
  
  const [startTime, setStartTime] = useState<number>(Date.now());

  /**
   * 计算当前速度
   */
  const getCurrentSpeed = (): number => {
    return Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * 格式化速度显示
   */
  const formatSpeed = (speed: number): string => {
    return speed.toFixed(1);
  };

  /**
   * 更新统计数据
   */
  useEffect(() => {
    const currentSpeed = getCurrentSpeed();
    const currentTime = isPlaying ? (Date.now() - startTime) / 1000 : stats.totalTime;
    
    setStats(prevStats => {
      const newStats = { ...prevStats };
      
      // 更新当前速度
      newStats.currentSpeed = currentSpeed;
      
      // 更新最高速度
      if (currentSpeed > newStats.maxSpeed) {
        newStats.maxSpeed = currentSpeed;
      }
      
      // 更新碰撞次数
      if (collisionCount > newStats.collisions) {
        newStats.bounces = collisionCount;
        newStats.collisions = collisionCount;
        
        // 根据碰撞和速度计算分数
        const speedBonus = Math.floor(currentSpeed / 10);
        newStats.score += 10 + speedBonus;
      }
      
      // 更新游戏时间
      if (isPlaying) {
        newStats.totalTime = currentTime;
      }
      
      return newStats;
    });
  }, [ballVelocity, collisionCount, isPlaying, startTime, stats.totalTime]);

  /**
   * 重置开始时间
   */
  useEffect(() => {
    if (isPlaying && stats.totalTime === 0) {
      setStartTime(Date.now());
    }
  }, [isPlaying, stats.totalTime]);

  return (
    <div className={`stats-panel ${className}`}>
      <h3>游戏统计</h3>
      
      <div className="stats-grid">
        <div className="stat-item score">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-label">分数</div>
            <div className="stat-value">{stats.score}</div>
          </div>
        </div>
        
        <div className="stat-item bounces">
          <div className="stat-icon">🎾</div>
          <div className="stat-content">
            <div className="stat-label">弹跳次数</div>
            <div className="stat-value">{stats.bounces}</div>
          </div>
        </div>
        
        <div className="stat-item speed">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-label">当前速度</div>
            <div className="stat-value">{formatSpeed(stats.currentSpeed)}</div>
          </div>
        </div>
        
        <div className="stat-item max-speed">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-label">最高速度</div>
            <div className="stat-value">{formatSpeed(stats.maxSpeed)}</div>
          </div>
        </div>
        
        <div className="stat-item time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">游戏时间</div>
            <div className="stat-value">{formatTime(stats.totalTime)}</div>
          </div>
        </div>
        
        <div className="stat-item status">
          <div className="stat-icon">{isPlaying ? '▶️' : '⏸️'}</div>
          <div className="stat-content">
            <div className="stat-label">状态</div>
            <div className="stat-value">{isPlaying ? '进行中' : '暂停'}</div>
          </div>
        </div>
      </div>
      
      {/* 速度条 */}
      <div className="speed-bar-container">
        <div className="speed-bar-label">速度指示器</div>
        <div className="speed-bar">
          <div 
            className="speed-bar-fill" 
            style={{
              width: `${Math.min((stats.currentSpeed / 500) * 100, 100)}%`,
              background: stats.currentSpeed > 300 
                ? 'linear-gradient(90deg, #ff6b6b, #ee5a24)' 
                : stats.currentSpeed > 150 
                ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                : 'linear-gradient(90deg, #00ff88, #00cc6a)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;