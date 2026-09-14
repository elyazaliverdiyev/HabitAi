/**
 * Confetti celebration effects for HabitAI
 * Uses canvas-confetti for milestone celebrations
 */
import confetti from 'canvas-confetti';

/** Quick burst — single habit completed */
export const confettiMini = () => {
    confetti({
        particleCount: 30,
        spread: 50,
        startVelocity: 20,
        decay: 0.94,
        gravity: 1.2,
        scalar: 0.7,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22d3ee', '#818cf8'],
        ticks: 100
    });
};

/** Medium celebration — all habits done today */
export const confettiAllDone = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ff0534', '#2ecc09', '#00cebc', '#fbbf24']
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ff0534', '#2ecc09', '#00cebc', '#fbbf24']
        });

        if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
};

/** Big celebration — streak milestone (7, 30, 100 days) */
export const confettiMilestone = () => {
    const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.4,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
    };

    confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ['star'] });
    confetti({ ...defaults, particleCount: 20, scalar: 0.75, shapes: ['circle'] });

    setTimeout(() => {
        confetti({ ...defaults, particleCount: 30, scalar: 1, origin: { x: 0.3, y: 0.4 } });
        confetti({ ...defaults, particleCount: 30, scalar: 1, origin: { x: 0.7, y: 0.4 } });
    }, 300);
};
