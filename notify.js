// Neuro — notifications & local reminders
// Works in any modern mobile browser; best when added to homescreen as PWA.
// Supports: permission request, immediate toast, scheduled reminders for
// appointments and recurring tasks. Uses setTimeout while the app is open,
// and a service-worker-backed notification when available.

(function () {
  const LS_KEY = 'np_notify';

  const Notify = {
    supported() { return 'Notification' in window; },
    permission() { return this.supported() ? Notification.permission : 'denied'; },

    async requestPermission() {
      if (!this.supported()) return 'denied';
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
      try {
        const p = await Notification.requestPermission();
        return p;
      } catch (e) { return 'denied'; }
    },

    // Show immediately (via SW if registered, else via Notification API)
    show(title, body, tag) {
      if (!this.supported() || Notification.permission !== 'granted') return false;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'notify', title, body, tag
        });
        return true;
      }
      try { new Notification(title, { body, tag, icon: './icon-192.png' }); return true; }
      catch (e) { return false; }
    },

    // in-app fallback toast + optional OS notification
    ping(title, body, tag) {
      this.show(title, body, tag);
      if (window.UI && UI.toast) UI.toast(`${title} — ${body}`);
    },

    // --- scheduling ---
    _timers: new Map(),

    _clearTimers() {
      this._timers.forEach(id => clearTimeout(id));
      this._timers.clear();
    },

    // Re-read appointments + recurring and schedule timers for anything
    // that's still ahead today. Call this on app load, after any save,
    // and from a setInterval every minute to catch drift.
    reschedule() {
      this._clearTimers();
      if (!this.supported() || Notification.permission !== 'granted') return;
      const now = Date.now();
      const todayKey = ymd(new Date());

      const appts = (window.Store && Store.get('appointments')) || [];
      appts.forEach(a => {
        if (a.date !== todayKey || !a.time) return;
        const when = toTime(a.date, a.time);
        const leadWhen = when - 10 * 60 * 1000; // 10 min heads-up
        if (leadWhen > now) {
          this._schedule(`appt-lead-${a.id}`, leadWhen,
            'coming up in 10 min', a.title);
        }
        if (when > now) {
          this._schedule(`appt-${a.id}`, when,
            a.title || 'reminder', (a.notes || 'now') + '');
        }
      });

      // recurring (with time) hitting today
      const recs = (window.Store && Store.get('recurring')) || [];
      const dow = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
      recs.forEach(r => {
        if (!r.time) return;
        if (!(r.days || []).includes(dow)) return;
        const when = toTime(todayKey, r.time);
        if (when > now) {
          this._schedule(`rec-${r.id}`, when,
            'time for', r.name);
        }
      });
    },

    _schedule(tag, when, title, body) {
      const delay = when - Date.now();
      if (delay < 0 || delay > 24 * 60 * 60 * 1000) return;
      const id = setTimeout(() => {
        this.show(title, body, tag);
        this._timers.delete(tag);
      }, delay);
      this._timers.set(tag, id);
    },

    // Try to register the service worker
    async registerSW() {
      if (!('serviceWorker' in navigator)) return false;
      try {
        await navigator.serviceWorker.register('./sw.js');
        return true;
      } catch (e) { console.warn('sw reg failed', e); return false; }
    },

    // Ask permission + register SW, wire up "prompt once" behaviour
    async init() {
      await this.registerSW();
      const settings = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (settings.asked) {
        this.reschedule();
      }
      // re-run every minute to catch newly added appts
      setInterval(() => this.reschedule(), 60 * 1000);
      // re-run when the tab becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.reschedule();
      });
    },

    // Called from a user-initiated UI button (required by browsers)
    async enable() {
      await this.registerSW();
      const p = await this.requestPermission();
      localStorage.setItem(LS_KEY, JSON.stringify({ asked: true, at: Date.now() }));
      if (p === 'granted') {
        this.reschedule();
        this.show('notifications on', 'i’ll nudge you gently.', 'welcome');
        return true;
      }
      return false;
    },

    asked() {
      try { return !!JSON.parse(localStorage.getItem(LS_KEY) || '{}').asked; }
      catch (e) { return false; }
    }
  };

  function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function toTime(dateKey, hhmm) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const [h, min] = hhmm.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, 0, 0).getTime();
  }

  window.Notify = Notify;
})();
