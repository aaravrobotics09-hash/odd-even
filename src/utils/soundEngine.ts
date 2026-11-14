class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private voiceEnabled = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setSettings({ sfxEnabled, voiceEnabled }: { sfxEnabled: boolean; voiceEnabled: boolean }): void {
    this.sfxEnabled = sfxEnabled;
    this.voiceEnabled = voiceEnabled;
    if (!voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.14,
    delay = 0
  ): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playClick(): void {
    this.playTone(600, 0.06, 'triangle', 0.08);
  }

  playLock(): void {
    this.playTone(520, 0.08, 'sine', 0.11, 0);
    this.playTone(780, 0.1, 'sine', 0.11, 0.05);
  }

  playBatHit(runs = 4): void {
    if (!this.sfxEnabled) return;
    this.playTone(210, 0.07, 'triangle', 0.2, 0);
    this.playTone(130, 0.09, 'sine', 0.18, 0.01);

    if (runs >= 6) {
      this.playTone(523.25, 0.14, 'triangle', 0.12, 0.08);
      this.playTone(659.25, 0.14, 'triangle', 0.12, 0.16);
      this.playTone(783.99, 0.22, 'triangle', 0.14, 0.24);
    } else {
      this.playTone(440, 0.11, 'sine', 0.09, 0.07);
    }
  }

  playWicket(): void {
    if (!this.sfxEnabled) return;
    this.playTone(300, 0.12, 'sawtooth', 0.12, 0);
    this.playTone(190, 0.16, 'sawtooth', 0.13, 0.09);
    this.playTone(105, 0.34, 'square', 0.12, 0.18);
  }

  playTossFlip(): void {
    if (!this.sfxEnabled) return;
    this.playTone(880, 0.08, 'sine', 0.1, 0);
    this.playTone(1174, 0.1, 'sine', 0.1, 0.07);
    this.playTone(1318, 0.15, 'triangle', 0.12, 0.15);
  }

  playVictory(): void {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, 'triangle', 0.14, idx * 0.11);
    });
  }

  playDefeat(): void {
    if (!this.sfxEnabled) return;
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, 'sawtooth', 0.08, idx * 0.14);
    });
  }

  speak(text: string): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.05;
      utter.pitch = 1.0;
      utter.volume = 0.85;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speech synthesis errors on restricted environments
    }
  }
}

export const soundEngine = new SoundEngine();
