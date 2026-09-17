'use client';

export function playNotificationSound() {
  try {
    type AudioContextLike = typeof AudioContext;
    const Ctx: AudioContextLike | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextLike }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // audio is best-effort only
  }
}