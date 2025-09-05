/**
 * 音效类型常量
 */
export const SoundType = {
  COLLISION: 'collision',
  CLICK: 'click',
  WHOOSH: 'whoosh',
} as const;

export type SoundType = typeof SoundType[keyof typeof SoundType];

/**
 * 音效管理器类
 */
class AudioManager {
  private context: AudioContext | null = null;
  private masterVolume: number = 0.3;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.initAudioContext();
    this.generateSounds();
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * 程序化生成音效
   */
  private generateSounds() {
    if (!this.context) return;

    // 生成碰撞音效
    const collisionSound = this.generateCollisionSound();
    this.sounds.set(SoundType.COLLISION, collisionSound);

    // 生成点击音效
    const clickSound = this.generateClickSound();
    this.sounds.set(SoundType.CLICK, clickSound);

    // 生成呼啸音效
    const whooshSound = this.generateWhooshSound();
    this.sounds.set(SoundType.WHOOSH, whooshSound);
  }

  /**
   * 生成碰撞音效（短促的爆破声）
   */
  private generateCollisionSound(): AudioBuffer {
    if (!this.context) throw new Error('AudioContext not available');

    const sampleRate = this.context.sampleRate;
    const duration = 0.2;
    const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const time = i / sampleRate;
        
        // 噪声基础
        const noise = (Math.random() * 2 - 1) * 0.5;
        
        // 低频冲击
        const impact = Math.sin(time * 80 * Math.PI * 2) * 0.7;
        
        // 衰减包络
        const envelope = Math.exp(-time * 8);
        
        channelData[i] = (noise + impact) * envelope;
      }
    }

    return buffer;
  }

  /**
   * 生成点击音效（清脆的点击声）
   */
  private generateClickSound(): AudioBuffer {
    if (!this.context) throw new Error('AudioContext not available');

    const sampleRate = this.context.sampleRate;
    const duration = 0.1;
    const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const time = i / sampleRate;
        
        // 高频点击声
        const click = Math.sin(time * 800 * Math.PI * 2) * 0.3;
        const click2 = Math.sin(time * 1200 * Math.PI * 2) * 0.2;
        
        // 快速衰减
        const envelope = Math.exp(-time * 25);
        
        channelData[i] = (click + click2) * envelope;
      }
    }

    return buffer;
  }

  /**
   * 生成呼啸音效（小球快速移动时的音效）
   */
  private generateWhooshSound(): AudioBuffer {
    if (!this.context) throw new Error('AudioContext not available');

    const sampleRate = this.context.sampleRate;
    const duration = 0.3;
    const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const time = i / sampleRate;
        
        // 白噪声基础
        const noise = (Math.random() * 2 - 1) * 0.2;
        
        // 低通滤波的呼啸声
        const freq = 200 + time * 800; // 频率上升
        const whoosh = Math.sin(time * freq * Math.PI * 2) * 0.1;
        
        // 包络
        const envelope = Math.sin(time / duration * Math.PI) * 0.5;
        
        channelData[i] = (noise + whoosh) * envelope;
      }
    }

    return buffer;
  }

  /**
   * 播放音效
   */
  playSound(type: SoundType, volume: number = 1, pitch: number = 1) {
    if (!this.context || !this.isEnabled) return;

    const buffer = this.sounds.get(type);
    if (!buffer) return;

    try {
      // 确保音频上下文处于运行状态
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      source.buffer = buffer;
      source.playbackRate.value = pitch;
      
      gainNode.gain.value = this.masterVolume * volume;
      
      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      source.start();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取主音量
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 获取音效启用状态
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 激活音频上下文（需要用户交互后调用）
   */
  async activate() {
    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }
}

// 单例导出
export const audioManager = new AudioManager();
export default audioManager;