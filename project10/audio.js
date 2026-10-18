/**
 * RoutinePulse - Web Audio API Sound Synthesizer
 * External audio files not required; fully synthetic beeps with envelope smoothing.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.lastBeepSecond = null;
  }

  // Initialize or resume AudioContext on user interaction
  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  /**
   * Play a clean beep sound with attack/decay envelope to prevent audio popping
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {'sine'|'square'|'triangle'} type - Oscillator type
   * @param {number} volume - Volume gain (0.0 to 1.0)
   */
  playTone(freq, duration, type = 'sine', volume = 0.25) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Envelope: Fast attack, hold, quick release to eliminate click/pop
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.setValueAtTime(volume, now + duration - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * 3초 예비 카운트다운 비프음 ('삐')
   * 880Hz (A5), 짧고 명확한 0.12초 펄스
   */
  playWarningBeep() {
    this.playTone(880, 0.12, 'sine', 0.28);
  }

  /**
   * 라운드/스테이지 전환 및 종료 비프음 ('삐이-')
   * 1250Hz (D#6), 확실한 전환 인지를 위한 0.45초 롱 톤
   */
  playTransitionBeep() {
    this.playTone(1250, 0.45, 'triangle', 0.35);
  }

  /**
   * 전체 루틴 완료 팡파르 (3단계 화음)
   */
  playFanfare() {
    if (this.isMuted) return;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, idx === chords.length - 1 ? 0.6 : 0.18, 'triangle', 0.3);
      }, idx * 140);
    });
  }

  /**
   * 클릭 피드백 틱 사운드
   */
  playClick() {
    this.playTone(1000, 0.03, 'sine', 0.08);
  }
}

// Global instance
window.soundEngine = new SoundEngine();
