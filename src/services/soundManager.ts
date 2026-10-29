// Web Audio API procedural sound engine for Hunter x Hunter Exam
// Zero external dependencies, zero CORS errors, works offline and instantly on mobile!

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isAmbientPlaying: boolean = false;
  private soundEnabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled && this.isAmbientPlaying) {
      this.stopAmbient();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public isAmbientActive(): boolean {
    return this.isAmbientPlaying;
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    }
  }

  // 1. Scan Réussi : Son de succès épique (Greed Island Card Activation / Nen Burst)
  public playScanSuccess() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume, now);
      master.connect(this.ctx.destination);

      // Chime frequencies (A4, C#5, E5, A5) - Triumphant A Major
      const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now + idx * 0.06);
        filter.frequency.exponentialRampToValueAtTime(6000, now + idx * 0.06 + 0.1);
        filter.frequency.exponentialRampToValueAtTime(800, now + idx * 0.06 + 0.6);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.85);
      });

      // Low Nen Aura Sub-Bass burst
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(55, now + 0.4);
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start(now);
      sub.stop(now + 0.5);

    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 2. Scan Invalide / Déjà Scanné : Buzzer stylé Hunter Exam
  public playScanError() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume * 0.7, now);
      master.connect(this.ctx.destination);

      [0, 0.18].forEach((delay) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(160, now + delay);
        osc2.frequency.setValueAtTime(154, now + delay); // Detuned for discordant buzz

        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.14);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(master);

        osc1.start(now + delay);
        osc2.start(now + delay);
        osc1.stop(now + delay + 0.15);
        osc2.stop(now + delay + 0.15);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 3. Ouverture d'un Indice : Effet sonore "BOOK!" de Greed Island
  public playBookOpen() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume * 0.8, now);
      master.connect(this.ctx.destination);

      // Sci-fi binder whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
      filter.Q.value = 3;

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.25);

      // Metallic Greed Island lock chime
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1760, now + 0.08); // High A6
      chime.frequency.exponentialRampToValueAtTime(2093, now + 0.12); // C7
      chimeGain.gain.setValueAtTime(0.25, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      chime.connect(chimeGain);
      chimeGain.connect(master);
      chime.start(now + 0.08);
      chime.stop(now + 0.48);

    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 4. Click tactique UI
  public playUiClick() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // ignore
    }
  }

  // 5. Rank Up Fanfare (Triple / Double / Pro Hunter)
  public playRankUp() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume, now);
      master.connect(this.ctx.destination);

      // Heroic brass arpeggio: C4, G4, C5, E5, G5
      const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);

        gain.gain.setValueAtTime(0, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + (i === notes.length - 1 ? 1.4 : 0.4));

        osc.connect(gain);
        gain.connect(master);

        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + (i === notes.length - 1 ? 1.5 : 0.45));
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 6. Fond Sonore Hunter Exam (Ambiance méditative Nen mystérieuse)
  public toggleAmbientMusic(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  public startAmbient() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stopAmbient();

      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(this.volume * 0.12, now + 2); // Soft fade-in
      this.ambientGain.connect(this.ctx.destination);

      // Mystical Nen drone: D2 (73.4Hz), A2 (110Hz), D3 (146.8Hz), F#3 (185Hz)
      const freqs = [73.42, 110.0, 146.83, 185.0];
      
      this.ambientOscillators = freqs.map((freq) => {
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const lfo = this.ctx!.createOscillator();
        const lfoGain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Subtle slow pitch drift for atmospheric Nen breathing
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // 0.15 Hz slow breath
        lfoGain.gain.value = 1.2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        filter.type = 'lowpass';
        filter.frequency.value = 350;

        osc.connect(filter);
        filter.connect(this.ambientGain!);
        osc.start();

        return osc;
      });

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient error:', e);
      this.isAmbientPlaying = false;
    }
  }

  public stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
        setTimeout(() => {
          this.ambientOscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch {}
          });
          this.ambientOscillators = [];
          if (this.ambientGain) {
            this.ambientGain.disconnect();
            this.ambientGain = null;
          }
        }, 850);
      } catch {}
    }
    this.isAmbientPlaying = false;
  }
}

export const soundManager = new SoundManager();
