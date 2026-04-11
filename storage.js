/* ============================================================
   NEURO — STORAGE
   localStorage with try/catch and in-memory fallback.
   All keys prefixed with 'np_'. Single Store object exposed.
   ============================================================ */

(function () {
  const PREFIX = 'np_';
  const memory = {};

  function safeGet(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return memory[key] ?? null;
      return JSON.parse(raw);
    } catch (e) {
      return memory[key] ?? null;
    }
  }

  function safeSet(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      /* memory only */
    }
  }

  function safeRemove(key) {
    delete memory[key];
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
  }

  function clearAll() {
    Object.keys(memory).forEach(k => delete memory[k]);
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  // ----- Defaults -----
  const DEFAULTS = {
    profile: { name: '', neuroName: 'Neuro', pronouns: '', gender: '' },
    onboarded: false,
    quiz: {},
    dayTasks: [],
    dayDate: '',
    plan: {},          // { 'YYYY-MM-DD': [tasks] }   tasks: {id,name,catKey,color,mins,effort,block,time?,done,recurring?,sourceId?}
    moods: [],         // [{mood, score, ts}]
    medsTaken: false,
    medsLog: [],
    chat: [],
    emergency: { gp: '', therapist: '', trusted: '', meds: '', nhs: '' },
    streaks: { meds: 0, water: 0 },
    pathways: {},      // {category: {strength, lastDone, count}}
    didThings: [],
    apiKey: '',
    // ---- new in v2 ----
    customTasks: [],   // [{id,name,catKey,color,mins,effort}] — user's own task library
    recurring: [],     // [{id,name,catKey,color,mins,effort,days:['mon','tue'],block,time?}]
    templates: [],     // [{id,name,emoji,tasks:[{name,catKey,color,mins,effort,block,time?}]}]
    appointments: [],  // [{id,title,date:'YYYY-MM-DD',time:'HH:MM',mins,notes,color}]
    materializedDates: [], // ['YYYY-MM-DD'] — days we've already pulled recurring into
    onboardedV2: false, // bumped to seed starter templates
  };

  const Store = {
    get(key) {
      const v = safeGet(key);
      return v !== null && v !== undefined ? v : DEFAULTS[key];
    },
    set(key, value) { safeSet(key, value); },
    remove(key) { safeRemove(key); },
    clearAll() { clearAll(); },
    DEFAULTS,
  };

  window.Store = Store;
})();
