/* ============================================================
   NEURO — APP ROUTER & INIT
   ============================================================ */

const App = (function () {

  const $  = UI.$;
  const $$ = UI.$$;

  const SCREENS = ['onboarding', 'home', 'plan', 'chat', 'paths', 'you'];
  let current = 'home';

  function go(name) {
    if (!SCREENS.includes(name)) return;
    current = name;
    SCREENS.forEach(s => {
      const el = document.getElementById('screen-' + s);
      if (el) el.classList.toggle('is-active', s === name);
    });

    // Show/hide nav (hidden during onboarding)
    const nav = $('#nav');
    nav.style.display = (name === 'onboarding') ? 'none' : 'flex';

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('is-active', b.dataset.screen === name);
    });

    // Render the screen
    if (name === 'onboarding') Onboarding.start();
    else if (name === 'home')  Screens.renderHome();
    else if (name === 'plan')  Screens.renderPlan();
    else if (name === 'chat')  Screens.renderChat();
    else if (name === 'paths') Screens.renderPaths();
    else if (name === 'you')   Screens.renderYou();

    // Reset scroll on screen
    const screen = document.getElementById('screen-' + name);
    const scroller = screen && screen.querySelector('.scroll');
    if (scroller) scroller.scrollTop = 0;
  }

  function init() {
    // Background world + stars
    UI.applyWorld();
    UI.drawStars(35);

    // Wire nav
    document.querySelectorAll('.nav-item').forEach(b => {
      b.onclick = () => go(b.dataset.screen);
    });

    // Update clock-ish status bar every minute
    setInterval(() => {
      const el = $('#status-time');
      if (el) el.textContent = UI.nowTime();
    }, 60000);

    // Re-apply world background every 30 min
    setInterval(UI.applyWorld, 30 * 60 * 1000);

    // Decide first screen
    const onboarded = Store.get('onboarded');
    if (!onboarded) go('onboarding');
    else go('home');

    // Boot notifications (register SW, rebind reminders)
    if (window.Notify) { Notify.init(); }
  }

  return { go, init };
})();

window.App = App;

// Boot
document.addEventListener('DOMContentLoaded', App.init);
