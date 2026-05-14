let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

function beep(audioCtx: AudioContext, freq: number, start: number, duration: number, volume = 1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, start);

  // Sharp attack, exponential decay
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.start(start);
  osc.stop(start + duration);
}

export function playKitchenAlert() {
  try {
    const audioCtx = getCtx();

    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;

    // Three ascending tones: attention-grabbing POS-style alert
    beep(audioCtx, 880,  t,        0.18, 1.0);
    beep(audioCtx, 880,  t + 0.22, 0.18, 1.0);
    beep(audioCtx, 1320, t + 0.44, 0.30, 1.0);
  } catch {
    // AudioContext unavailable or blocked
  }
}
