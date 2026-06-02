// ============================================================
// audioManager.js - 游戏音效管理器
// ============================================================
// 
// 【文件职责】
// 使用 Web Audio API 生成和播放游戏音效，无需外部音频文件
// 
// 【音效列表】
// 1. placePiece - 画圈/画叉音效
// 2. win - 胜利音效
// 3. lose - 失败音效
// 4. draw - 平局音效
// 5. join - 加入房间音效
// 6. error - 错误提示音效
// ============================================================

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  // ============================================================
  // 初始化音频上下文
  // ============================================================
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('[AudioManager] Web Audio API 不支持，音效功能不可用');
      this.enabled = false;
    }
  }

  // ============================================================
  // 确保音频上下文已恢复（浏览器自动播放策略）
  // ============================================================
  async ensureContext() {
    if (!this.audioContext) {
      this.init();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // ============================================================
  // 播放音效
  // ============================================================
  async play(soundName) {
    if (!this.enabled || !this.audioContext) return;
    
    await this.ensureContext();
    
    const now = this.audioContext.currentTime;
    
    switch (soundName) {
      case 'placePiece':
        this._playPlacePiece(now);
        break;
      case 'win':
        this._playWin(now);
        break;
      case 'lose':
        this._playLose(now);
        break;
      case 'draw':
        this._playDraw(now);
        break;
      case 'join':
        this._playJoin(now);
        break;
      case 'error':
        this._playError(now);
        break;
      case 'rematch':
        this._playRematch(now);
        break;
      case 'hover':
        this._playHover(now);
        break;
      case 'countdown':
        this._playCountdown(now);
        break;
      default:
        console.warn(`[AudioManager] 未知音效: ${soundName}`);
    }
  }

  // ============================================================
  // 画圈/画叉音效 - 短促的"滴"声
  // ============================================================
  _playPlacePiece(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    
    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // ============================================================
  // 胜利音效 - 上升的琶音
  // ============================================================
  _playWin(now) {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const startTime = now + index * 0.15;
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(this.volume * 0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  // ============================================================
  // 失败音效 - 下降的音调
  // ============================================================
  _playLose(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  // ============================================================
  // 平局音效 - 中性音调
  // ============================================================
  _playDraw(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // ============================================================
  // 加入房间音效 - 清脆的"叮"声
  // ============================================================
  _playJoin(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // ============================================================
  // 错误音效 - 低沉的"嗡"声
  // ============================================================
  _playError(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(this.volume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  // ============================================================
  // 再来一局音效 - 欢快的上升音
  // ============================================================
  _playRematch(now) {
    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    
    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const startTime = now + index * 0.1;
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(this.volume * 0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  }

  // ============================================================
  // 悬停音效 - 轻微的提示音
  // ============================================================
  _playHover(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, now);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(this.volume * 0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  // ============================================================
  // 倒计时音效 - 急促的滴答声
  // ============================================================
  _playCountdown(now) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(this.volume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  // ============================================================
  // 设置音量 (0-1)
  // ============================================================
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // ============================================================
  // 启用/禁用音效
  // ============================================================
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// 单例导出
export default new AudioManager();
