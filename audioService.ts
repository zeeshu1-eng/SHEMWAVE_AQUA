
class AudioService {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  private async init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  async startBeep() {
    await this.init();
    if (this.isPlaying || !this.audioCtx) return;

    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'square';
    this.oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 note

    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.1);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator.start();
    this.isPlaying = true;

    // Pulsing effect
    const pulse = () => {
      if (!this.isPlaying || !this.gainNode || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      this.gainNode.gain.setValueAtTime(0.5, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      setTimeout(pulse, 600);
    };
    pulse();
  }

  stopBeep() {
    if (!this.isPlaying) return;
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {}
      this.oscillator.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    this.isPlaying = false;
  }
}

export const alertAudio = new AudioService();
