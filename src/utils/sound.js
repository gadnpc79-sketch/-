export const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Alert sound pattern: Ding-Dong style
        const now = ctx.currentTime;

        // First tone (High)
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // Second tone (Low)
        osc.frequency.setValueAtTime(659.25, now + 0.4); // E5
        gain.gain.setValueAtTime(0.5, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc.start(now);
        osc.stop(now + 1.5);

    } catch (e) {
        console.error("Audio play failed", e);
    }
};
