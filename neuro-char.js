/* ============================================================
   NEURO — CHARACTER MODULE
   Renders Neuro at any size, with state-driven brain glow.
   States: calm | happy | sleepy | thinking | concerned | celebrating
   ============================================================ */

const NeuroChar = (function () {

  const BRAIN_GRADS = {
    calm:        ['#e8fff5', '#a8f0d4', '#6ad4b4', '#4a9e85'],
    happy:       ['#fff3e0', '#ffc49b', '#ff9b8a', '#c46a5a'],
    sleepy:      ['#e8e0ff', '#c4a3ff', '#8a6fd4', '#5a3fa0'],
    thinking:    ['#e0f7ff', '#8ee5f0', '#5ab8c5', '#357585'],
    concerned:   ['#ffe0e0', '#ff9b8a', '#d46d5e', '#8a3a30'],
    celebrating: ['#fff8d4', '#d4ff5e', '#a8f0d4', '#6ad4b4'],
  };

  function uid() { return 'n' + Math.random().toString(36).slice(2, 8); }

  /**
   * Render the Neuro SVG character.
   * @param {object} opts { size: number, state: string, eyesClosed: boolean }
   */
  function render(opts = {}) {
    const size = opts.size || 180;
    const state = opts.state || 'calm';
    const eyesClosed = opts.eyesClosed || false;
    const grad = BRAIN_GRADS[state] || BRAIN_GRADS.calm;
    const id = uid();

    return `
      <svg viewBox="0 0 200 240" width="${size}" height="${size * (240/180)}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="brainGrad-${id}" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stop-color="${grad[0]}"/>
            <stop offset="35%" stop-color="${grad[1]}"/>
            <stop offset="75%" stop-color="${grad[2]}"/>
            <stop offset="100%" stop-color="${grad[3]}"/>
          </radialGradient>
          <radialGradient id="bodyGrad-${id}" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#e4d4e8"/>
            <stop offset="50%" stop-color="#c7b8c8"/>
            <stop offset="100%" stop-color="#8e7d95"/>
          </radialGradient>
          <filter id="brainGlow-${id}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="pathGlow-${id}">
            <feGaussianBlur stdDeviation="1.5"/>
          </filter>
        </defs>

        <ellipse cx="100" cy="70" rx="78" ry="62" fill="${grad[1]}" opacity="0.18" filter="url(#brainGlow-${id})"/>

        <ellipse cx="100" cy="170" rx="62" ry="55" fill="url(#bodyGrad-${id})"/>
        <ellipse cx="80" cy="150" rx="28" ry="18" fill="#f0e4f2" opacity="0.35"/>
        <ellipse cx="100" cy="225" rx="55" ry="8" fill="#000" opacity="0.25"/>

        ${eyesClosed
          ? `<path d="M77 175 Q82 178 87 175" stroke="#1a1530" stroke-width="2" fill="none" stroke-linecap="round"/>
             <path d="M113 175 Q118 178 123 175" stroke="#1a1530" stroke-width="2" fill="none" stroke-linecap="round"/>`
          : `<ellipse cx="82" cy="175" rx="5" ry="7" fill="#1a1530"/>
             <ellipse cx="118" cy="175" rx="5" ry="7" fill="#1a1530"/>
             <circle cx="84" cy="172" r="1.8" fill="#fff"/>
             <circle cx="120" cy="172" r="1.8" fill="#fff"/>`}

        <g filter="url(#brainGlow-${id})">
          <path d="M100,20 C70,20 42,38 42,68 C42,92 58,108 72,115 C80,120 92,122 100,122 C108,122 120,120 128,115 C142,108 158,92 158,68 C158,38 130,20 100,20 Z" fill="url(#brainGrad-${id})"/>
          <path d="M100,20 C100,50 95,80 100,115" stroke="${grad[3]}" stroke-width="1.5" fill="none" opacity="0.4"/>
          <path d="M70,40 Q75,60 72,90" stroke="${grad[3]}" stroke-width="1" fill="none" opacity="0.3"/>
          <path d="M130,40 Q128,60 130,90" stroke="${grad[3]}" stroke-width="1" fill="none" opacity="0.3"/>
          <g filter="url(#pathGlow-${id})" opacity="0.85">
            <path d="M60,70 Q78,60 90,75 T115,68 Q128,60 140,72" stroke="#e8fff5" stroke-width="1.2" fill="none"/>
            <path d="M65,90 Q80,82 95,95 Q110,105 130,95" stroke="#e8fff5" stroke-width="1" fill="none"/>
            <circle cx="78" cy="68" r="1.5" fill="#fff"/>
            <circle cx="115" cy="68" r="1.5" fill="#fff"/>
            <circle cx="95" cy="95" r="1.5" fill="#fff"/>
            <circle cx="130" cy="78" r="1.3" fill="#fff"/>
          </g>
          <ellipse cx="78" cy="45" rx="20" ry="12" fill="#fff" opacity="0.35"/>
        </g>
      </svg>
    `;
  }

  return { render, BRAIN_GRADS };
})();

window.NeuroChar = NeuroChar;
