(() => {
    'use strict';
    const hero = document.querySelector('.orchestra-hero');
    if (!hero) return;
    const video = hero.querySelector('video');
    const sound = hero.querySelector('.orchestra-hero__sound');
    const status = hero.querySelector('[role="status"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncSound = () => {
        const audible = !video.muted;
        sound.setAttribute('aria-pressed', String(audible));
        sound.setAttribute('aria-label', audible ? 'Mute orchestra' : 'Play orchestra with sound');
        sound.title = audible ? 'Mute orchestra' : 'Play orchestra with sound';
    };
    const fallback = () => {
        hero.dataset.playing = 'false';
        sound.hidden = true;
        video.pause();
    };
    const start = () => {
        video.muted = true;
        video.defaultMuted = true;
        syncSound();
        if (reducedMotion.matches) {
            video.autoplay = false;
            sound.hidden = false;
            sound.setAttribute('aria-label', 'Play orchestra with sound');
            return;
        }
        video.play().catch(() => {
            if (!video.error) {
                sound.hidden = false;
                sound.setAttribute('aria-label', 'Play orchestra with sound');
            }
        });
    };
    video.addEventListener('playing', () => {
        hero.dataset.playing = 'true';
        sound.hidden = false;
    });
    video.addEventListener('error', fallback);
    video.addEventListener('volumechange', syncSound);
    sound.addEventListener('click', async () => {
        const wasMuted = video.muted;
        video.muted = !wasMuted;
        try {
            if (video.paused) await video.play();
            status.textContent = video.muted ? 'Orchestra muted.' : 'Orchestra sound on.';
        } catch (_) {
            video.muted = wasMuted;
            status.textContent = 'Playback could not start. Please try again.';
        }
        syncSound();
    });
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) video.pause();
    });
    if (video.querySelector('source')?.getAttribute('src') || video.getAttribute('src')) start();
})();
