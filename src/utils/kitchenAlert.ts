let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

function scheduleBeeps(audioCtx: AudioContext) {
  // Compressor maximises perceived loudness without clipping
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
  compressor.knee.setValueAtTime(3, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(20, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.15, audioCtx.currentTime);
  compressor.connect(audioCtx.destination);

  const tone = (freq: number, start: number, duration: number) => {
    // Layer square + sawtooth for a harsh, cutting sound that carries in a noisy kitchen
    for (const [type, gain] of [['square', 1.2], ['sawtooth', 0.6]] as [OscillatorType, number][]) {
      const osc = audioCtx.createOscillator();
      const vol = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      vol.gain.setValueAtTime(0, start);
      vol.gain.linearRampToValueAtTime(gain, start + 0.008);
      vol.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(vol);
      vol.connect(compressor);
      osc.start(start);
      osc.stop(start + duration);
    }
  };

  const t = audioCtx.currentTime;
  // Four-beep pattern: three sharp hits + one long hold
  tone(880,  t,        0.22);
  tone(880,  t + 0.30, 0.22);
  tone(880,  t + 0.60, 0.22);
  tone(1320, t + 0.90, 0.55);
}

export function playKitchenAlert() {
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => scheduleBeeps(audioCtx)).catch(() => {});
    } else {
      scheduleBeeps(audioCtx);
    }
  } catch {
    // AudioContext unavailable or blocked
  }
}
