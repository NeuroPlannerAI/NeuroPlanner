/* ============================================================
   NEURO — SCREEN RENDERERS
   home, plan, chat, paths, you — plus all bottom sheets.
   ============================================================ */

const Screens = (function () {

  const $  = UI.$;
  const $$ = UI.$$;

  // Capitalize first letter
  function cap(s) {
    s = (s || '').toString();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ===========================================================
  // HOME / TODAY
  // ===========================================================
  function renderHome() {
    const profile = Store.get('profile');
    const tod = UI.timeOfDay();
    $('#home-greet').textContent = UI.greetFor(tod);
    $('#home-name').textContent = profile.name || 'friend';
    $('#home-date').textContent = UI.prettyDate();
    $('#status-time').textContent = UI.nowTime();

    // Render Neuro character
    const charWrap = $('#neuro-home');
    charWrap.innerHTML = NeuroChar.render({ size: 180, state: moodFromHour() });
    charWrap.onclick = () => App.go('chat');

    // Bubble
    const bubble = $('#neuro-bubble');
    bubble.textContent = pickHomeLine(profile);
    bubble.onclick = () => App.go('chat');

    // Nav neuro name
    $('#nav-neuro-name').textContent = profile.neuroName || 'Neuro';

    // Mood
    const moods = Store.get('moods') || [];
    const todayMood = moods.find(m => m.date === UI.ymd());
    $('#mood-value').textContent = todayMood ? cap(todayMood.mood) : 'Log';
    $('#tile-mood').onclick = () => openMoodSheet();

    // Meds
    const medsTaken = Store.get('medsTaken');
    const medsDot = $('#meds-dot');
    if (medsTaken) {
      medsDot.classList.add('is-taken');
      $('#meds-value').textContent = 'Done';
    } else {
      medsDot.classList.remove('is-taken');
      $('#meds-value').textContent = 'Not yet';
    }
    $('#tile-meds').onclick = () => {
      const next = !Store.get('medsTaken');
      Store.set('medsTaken', next);
      if (next) {
        const log = Store.get('medsLog') || [];
        log.push(Date.now());
        Store.set('medsLog', log);
        UI.toast('Meds logged.');
      } else {
        UI.toast('Unchecked.');
      }
      renderHome();
    };

    // Pathways
    $('#tile-paths').onclick = () => App.go('paths');

    // Today's appointments
    const apptsWrap = $('#home-appts');
    if (apptsWrap) {
      const todayKey = UI.ymd();
      const todayAppts = (Store.get('appointments') || [])
        .filter(a => a.date === todayKey)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      if (todayAppts.length) {
        apptsWrap.innerHTML = todayAppts.map(a => `
          <div class="home-appt" data-id="${a.id}">
            <div class="home-appt-time">${a.time || '—'}</div>
            <div class="home-appt-body">
              <div class="home-appt-title">${UI.esc(a.title)}</div>
              <div class="home-appt-meta">${a.mins || 30} min${a.notes ? ' · ' + UI.esc(a.notes).slice(0, 40) : ''}</div>
            </div>
          </div>
        `).join('');
        apptsWrap.querySelectorAll('.home-appt').forEach(el => {
          el.onclick = () => App.go('plan');
        });
      } else {
        apptsWrap.innerHTML = '';
      }
    }

    // Day grid + progress
    refreshDayState();
    renderDayGrid();
    renderProgress();
  }

  function moodFromHour() {
    const h = new Date().getHours();
    if (h < 6 || h > 22) return 'sleepy';
    if (h < 11) return 'happy';
    if (h < 17) return 'calm';
    return 'thinking';
  }

  function pickHomeLine(profile) {
    const tod = UI.timeOfDay();
    const opts = ({
      dawn:  ["Start slow.", "One thing at a time.", "No pressure, just presence."],
      day:   ["What's one thing worth doing?", "Pick a starter, not a finisher.", "Quick check-in?"],
      dusk:  ["How did today land?", "Wind-down mode.", "You've done enough."],
      night: ["Rest counts too.", "Close the loop for tonight.", "Tomorrow's a fresh page."],
    })[tod] || ["Ready when you are."];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  function refreshDayState() {
    const today = UI.ymd();
    const stored = Store.get('dayDate');
    if (stored !== today) {
      // New day — reset meds + day tasks rollover from plan
      Store.set('dayDate', today);
      Store.set('medsTaken', false);
      const plan = Store.get('plan') || {};
      Store.set('dayTasks', plan[today] ? JSON.parse(JSON.stringify(plan[today])) : []);
    }
  }

  function renderDayGrid() {
    const grid = $('#home-day-grid');
    const tasks = Store.get('dayTasks') || [];
    const next = tasks.find(t => !t.done);
    const dayMeta = $('#day-meta');

    if (!tasks.length) {
      dayMeta.textContent = 'No plan yet';
      grid.innerHTML = `
        <div class="card card-hero" id="hero-empty">
          <div>
            <div class="hero-eyebrow">Your day</div>
            <h2 class="hero-title">Nothing <em>planned</em> yet</h2>
          </div>
          <div class="hero-footer">
            <span class="chip">Tap to plan</span>
          </div>
        </div>
        ${didCardHTML()}`;
      $('#hero-empty').onclick = () => App.go('plan');
      bindDidInput();
      return;
    }

    dayMeta.innerHTML = `<strong>${tasks.filter(t => t.done).length}</strong>&nbsp;of&nbsp;${tasks.length} done`;

    const colorClass = i => ['card-peach', 'card-lav', 'card-cyan', 'card-cream'][i % 4];

    let html = '';
    if (next) {
      html += `
        <div class="card card-hero" id="hero-next">
          <div>
            <div class="hero-eyebrow">Next up</div>
            <h2 class="hero-title">${cap(UI.esc(next.name))}</h2>
          </div>
          <div class="hero-footer">
            <div class="hero-meta">
              <span class="chip">${next.mins || 10} min</span>
              <span class="chip">${next.effort || 'Med'}</span>
            </div>
            <button class="done-btn" id="hero-done"></button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="card card-hero">
          <div>
            <div class="hero-eyebrow">Today</div>
            <h2 class="hero-title">All <em>done</em></h2>
          </div>
          <div class="hero-footer"><span class="chip">${tasks.length} tasks</span></div>
        </div>`;
    }

    // Up to 4 more cards (the rest after next)
    const rest = (next ? tasks.filter(t => t.id !== next.id) : tasks).slice(0, 4);
    rest.forEach((t, i) => {
      html += `
        <div class="card ${colorClass(i)}" data-task="${t.id}">
          <div>
            <div class="card-icon"></div>
            <h3 class="card-title">${cap(UI.esc(t.name))}</h3>
          </div>
          <div class="card-sub">${t.mins || 10} min · ${t.effort || 'Med'}</div>
        </div>`;
    });

    html += didCardHTML();

    grid.innerHTML = html;

    if (next) {
      $('#hero-done').onclick = e => { e.stopPropagation(); completeTask(next.id); };
      $('#hero-next').onclick = () => openTaskSheet(next.id);
    }
    grid.querySelectorAll('[data-task]').forEach(card => {
      card.onclick = () => openTaskSheet(card.dataset.task);
    });
    bindDidInput();
  }

  function didCardHTML() {
    const list = (Store.get('didThings') || []).slice(-3).reverse();
    return `
      <div class="card card-wide">
        <div class="did-icon">+</div>
        <input class="did-input" id="did-input" placeholder="I did a thing…">
        <button class="did-plus" id="did-plus">↵</button>
      </div>
      ${list.length ? `
        <div class="did-list">
          ${list.map(d => `<div class="did-pill">✓ ${UI.esc(d.text)}</div>`).join('')}
        </div>` : ''}`;
  }
  function bindDidInput() {
    const inp = $('#did-input');
    const plus = $('#did-plus');
    if (!inp) return;
    const submit = () => {
      const v = inp.value.trim();
      if (!v) return;
      const list = Store.get('didThings') || [];
      list.push({ text: v, ts: Date.now() });
      Store.set('didThings', list);
      // Also bump pathway for fun
      bumpPathway('selfcare');
      UI.toast(`Logged — ${v}`);
      inp.value = '';
      // Re-render so the new pill appears
      renderHome();
    };
    inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
    plus.onclick = submit;
  }

  function renderProgress() {
    const tasks = Store.get('dayTasks') || [];
    const done = tasks.filter(t => t.done).length;
    $('#progress-done').textContent = done;
    $('#progress-total').textContent = ' / ' + tasks.length;
    const pct = tasks.length ? (done / tasks.length) * 100 : 0;
    $('#progress-fill').style.width = pct + '%';
    const note = $('#progress-note');
    if (!tasks.length) note.textContent = 'No tasks yet — tap Plan to start.';
    else if (done === 0) note.textContent = 'Pick the easiest one first.';
    else if (done === tasks.length) note.textContent = `You did the whole thing. That's huge.`;
    else if (pct < 50) note.textContent = `Nice. One more when you're ready.`;
    else note.textContent = `Over halfway there.`;
  }

  function completeTask(id) {
    const tasks = Store.get('dayTasks') || [];
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = true;
    Store.set('dayTasks', tasks);
    bumpPathway(t.catKey);
    UI.toast(`Done — ${t.name}`);
    renderDayGrid();
    renderProgress();
  }

  function bumpPathway(catKey) {
    if (!catKey) return;
    const p = Store.get('pathways') || {};
    const cur = p[catKey] || { strength: 0, count: 0, lastDone: 0 };
    cur.strength = Math.min(100, cur.strength + 8);
    cur.count = (cur.count || 0) + 1;
    cur.lastDone = Date.now();
    p[catKey] = cur;
    Store.set('pathways', p);
  }

  // -------- task sheet --------
  function openTaskSheet(id) {
    const tasks = Store.get('dayTasks') || [];
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Task</div>
        <h2 class="sheet-title">${UI.esc(t.name)}</h2>
      </div>
      <div class="sheet-body">
        <div style="display:flex;gap:8px;margin-bottom:18px">
          <span class="chip" style="background:rgba(255,255,255,0.08);color:var(--text-soft)">${t.mins || 10} min</span>
          <span class="effort effort-${t.effort || 'Med'}">${t.effort || 'Med'}</span>
        </div>
        <div class="onb-btns">
          ${t.done
            ? `<button class="btn btn-ghost btn-full" id="ts-undo">Mark as not done</button>`
            : `<button class="btn btn-primary btn-full" id="ts-done">Mark as done</button>`}
          <button class="btn btn-ghost btn-full" id="ts-remove">Remove from today</button>
        </div>
      </div>`);
    if (!t.done) $('#ts-done').onclick = () => { completeTask(t.id); UI.closeSheet(); };
    else $('#ts-undo').onclick = () => {
      t.done = false; Store.set('dayTasks', tasks); UI.closeSheet(); renderDayGrid(); renderProgress();
    };
    $('#ts-remove').onclick = () => {
      const remaining = tasks.filter(x => x.id !== t.id);
      Store.set('dayTasks', remaining);
      // Also remove from today's plan
      const plan = Store.get('plan') || {};
      const today = UI.ymd();
      if (plan[today]) plan[today] = plan[today].filter(x => x.id !== t.id);
      Store.set('plan', plan);
      UI.closeSheet();
      renderDayGrid(); renderProgress();
    };
  }

  // -------- mood sheet --------
  const MOOD_OPTIONS = [
    { k: 'Great',   label: 'Great',   score: 5, color: '#a8f0d4' },
    { k: 'Good',    label: 'Good',    score: 4, color: '#d4ff5e' },
    { k: 'Meh',     label: 'Meh',     score: 3, color: '#ffe8b0' },
    { k: 'Low',     label: 'Low',     score: 2, color: '#ffb38a' },
    { k: 'Rough',   label: 'Rough',   score: 1, color: '#ff9b8a' },
  ];
  function openMoodSheet() {
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Check-in</div>
        <h2 class="sheet-title">Your <em>mood</em></h2>
      </div>
      <div class="sheet-body">
        <div class="mood-options">
          ${MOOD_OPTIONS.map(m => `
            <button class="mood-option" data-k="${m.k}">
              <div class="mood-option-icon" style="background:${m.color};box-shadow:0 0 12px ${m.color}"></div>
              <div class="mood-option-label">${m.label}</div>
            </button>
          `).join('')}
        </div>
      </div>`);
    document.querySelectorAll('.mood-option').forEach(btn => {
      btn.onclick = () => {
        const m = MOOD_OPTIONS.find(x => x.k === btn.dataset.k);
        const moods = Store.get('moods') || [];
        const today = UI.ymd();
        const existing = moods.findIndex(x => x.date === today);
        const entry = { date: today, mood: m.k, score: m.score, ts: Date.now() };
        if (existing >= 0) moods[existing] = entry; else moods.push(entry);
        Store.set('moods', moods);
        UI.closeSheet();
        renderHome();
        UI.toast('Logged.');
      };
    });
  }

  // ===========================================================
  // PLAN — V2
  // ===========================================================
  let planSelectedDate = UI.ymd();

  const BLOCKS = ['morning', 'afternoon', 'evening', 'anytime'];
  const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // Quick-add staging state
  const quickAdd = { block: 'anytime', catKey: null, mins: 10 };

  // Materialize recurring tasks into a given date if not already done
  function materializeDate(dateKey) {
    const done = Store.get('materializedDates') || [];
    if (done.includes(dateKey)) return;
    const recurring = Store.get('recurring') || [];
    const d = new Date(dateKey + 'T12:00:00');
    const dow = DOW[d.getDay()];
    const plan = Store.get('plan') || {};
    const day = plan[dateKey] || [];
    let added = 0;
    recurring.forEach(r => {
      const days = r.days && r.days.length ? r.days : DOW;
      if (!days.includes(dow)) return;
      // Avoid duplicates
      if (day.some(t => t.sourceId === r.id)) return;
      day.push({
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
        sourceId: r.id,
        name: r.name,
        catKey: r.catKey,
        color: r.color,
        mins: r.mins || 10,
        effort: r.effort || 'Med',
        block: r.block || 'anytime',
        time: r.time || null,
        recurring: true,
        done: false,
      });
      added++;
    });
    if (added) {
      plan[dateKey] = day;
      Store.set('plan', plan);
    }
    done.push(dateKey);
    Store.set('materializedDates', done);
  }

  function renderPlan() {
    seedStartersIfNeeded();
    materializeDate(planSelectedDate);

    const strip = $('#day-strip');
    const today = new Date();
    const plan = Store.get('plan') || {};
    const appts = Store.get('appointments') || [];

    let html = '';
    for (let i = -1; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = UI.ymd(d);
      const has = (plan[key] && plan[key].length > 0) || appts.some(a => a.date === key);
      const cls = [
        'day-pill',
        key === UI.ymd() ? 'is-today' : '',
        key === planSelectedDate ? 'is-active' : '',
        has ? 'has-tasks' : '',
      ].filter(Boolean).join(' ');
      html += `
        <div class="${cls}" data-date="${key}">
          <div class="day-pill-dow">${UI.shortDow(d)}</div>
          <div class="day-pill-num">${d.getDate()}</div>
          <div class="day-pill-dot"></div>
        </div>`;
    }
    strip.innerHTML = html;
    strip.querySelectorAll('.day-pill').forEach(p => {
      p.onclick = () => {
        planSelectedDate = p.dataset.date;
        materializeDate(planSelectedDate);
        renderPlan();
      };
    });

    // Selected date header
    const dObj = new Date(planSelectedDate + 'T12:00:00');
    const isToday = planSelectedDate === UI.ymd();
    const niceDate = dObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#plan-selected-date').innerHTML = isToday
      ? `<em>today</em> — ${niceDate}`
      : niceDate;

    renderPlanBlocks();
    renderQuickAdd();

    $('#btn-add-tasks').onclick = openCategoryPicker;
    $('#btn-templates').onclick = openTemplatesSheet;
    $('#btn-add-appt').onclick = () => openAppointmentSheet(null);
    $('#btn-talk-plan').onclick = () => App.go('chat');
    $('#btn-jump-date').onclick = openJumpToDate;
  }

  function renderPlanBlocks() {
    const wrap = $('#plan-blocks');
    const plan = Store.get('plan') || {};
    const list = (plan[planSelectedDate] || []).slice();
    const appts = (Store.get('appointments') || []).filter(a => a.date === planSelectedDate);

    // Convert appointments into pseudo-task rows in their right block
    const apptRows = appts.map(a => ({
      id: 'appt-' + a.id,
      apptId: a.id,
      name: a.title,
      catKey: '_appt',
      color: a.color || '#ffb38a',
      mins: a.mins || 30,
      effort: 'Med',
      block: timeToBlock(a.time),
      time: a.time,
      isAppt: true,
      notes: a.notes,
      done: false,
    }));

    const all = list.concat(apptRows);
    if (!all.length) {
      wrap.innerHTML = `
        <div class="plan-empty" style="margin:0 0 14px">
          <div class="plan-empty-title">nothing here yet</div>
          <div class="plan-empty-sub">add a task below, pick a template, or schedule an appointment</div>
        </div>`;
      return;
    }

    let html = '';
    BLOCKS.forEach(block => {
      const items = all.filter(t => (t.block || 'anytime') === block);
      // Sort by time within block
      items.sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
      if (!items.length) return;
      html += `<div class="time-block">
        <div class="time-block-head">
          <div class="time-block-name ${block}"><span class="dot"></span>${block}</div>
        </div>
        ${items.map(t => taskRowHTML(t)).join('')}
      </div>`;
    });

    if (!html) {
      wrap.innerHTML = `<div class="plan-empty" style="margin:0 0 14px"><div class="plan-empty-sub">nothing scheduled</div></div>`;
      return;
    }

    wrap.innerHTML = html;

    // Bind interactions
    wrap.querySelectorAll('.task-row').forEach(row => {
      const id = row.dataset.id;
      const isAppt = row.dataset.appt === '1';
      // Click row body → open detail
      const body = row.querySelector('.task-body');
      if (body) body.onclick = () => {
        if (isAppt) openAppointmentSheet(row.dataset.apptId);
        else openTaskDetail(id, planSelectedDate);
      };
      // Check
      const check = row.querySelector('.task-check');
      if (check) check.onclick = e => {
        e.stopPropagation();
        toggleTaskDone(id, planSelectedDate);
      };
      // Recurring icon (toggle directly only if already recurring; otherwise opens detail)
      const rec = row.querySelector('.task-recurring-icon');
      if (rec) rec.onclick = e => {
        e.stopPropagation();
        if (isAppt) return;
        openRecurringPickerForTask(id);
      };
      // Remove
      const rem = row.querySelector('.task-remove');
      if (rem) rem.onclick = e => {
        e.stopPropagation();
        if (isAppt) {
          deleteAppointment(row.dataset.apptId);
        } else {
          removeTaskFromDate(id, planSelectedDate);
        }
      };
    });
  }

  function taskRowHTML(t) {
    const timeLabel = t.time
      ? `<div class="task-time-label">${t.time}</div>`
      : `<div class="task-time-label empty">${(t.block || 'any').slice(0,3)}</div>`;
    const recIcon = t.isAppt ? '' : `
      <button class="task-recurring-icon ${t.recurring ? 'is-on' : ''}" title="repeat">↻</button>`;
    return `
      <div class="task-row ${t.done ? 'is-done' : ''} ${t.isAppt ? 'is-appt' : ''}"
           data-id="${t.id}" ${t.isAppt ? `data-appt="1" data-appt-id="${t.apptId}"` : ''}>
        ${timeLabel}
        <div class="task-colour" style="background:${t.color}"></div>
        <div class="task-body">
          <div class="task-name">${UI.esc(t.name)}</div>
          <div class="task-meta">
            <span class="task-time">${t.mins || 10} min${t.isAppt ? ' · appt' : ''}</span>
            ${t.isAppt ? '' : `<span class="effort effort-${t.effort || 'Med'}">${t.effort || 'Med'}</span>`}
          </div>
        </div>
        ${recIcon}
        ${t.isAppt ? '' : `<button class="task-check ${t.done ? 'is-checked' : ''}"></button>`}
        <button class="task-remove">×</button>
      </div>`;
  }

  function timeToBlock(time) {
    if (!time) return 'anytime';
    const h = parseInt(time.split(':')[0], 10);
    if (isNaN(h)) return 'anytime';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  function toggleTaskDone(id, dateKey) {
    const plan = Store.get('plan') || {};
    const list = plan[dateKey];
    if (!list) return;
    const t = list.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    Store.set('plan', plan);
    if (t.done) bumpPathway(t.catKey);
    if (dateKey === UI.ymd()) {
      Store.set('dayTasks', JSON.parse(JSON.stringify(list)));
    }
    renderPlanBlocks();
    if (dateKey === UI.ymd()) renderProgress();
  }

  function removeTaskFromDate(id, dateKey) {
    const plan = Store.get('plan') || {};
    if (!plan[dateKey]) return;
    plan[dateKey] = plan[dateKey].filter(x => x.id !== id);
    Store.set('plan', plan);
    if (dateKey === UI.ymd()) {
      Store.set('dayTasks', JSON.parse(JSON.stringify(plan[dateKey])));
    }
    renderPlanBlocks();
  }

  // ----- Quick add bar -----
  function renderQuickAdd() {
    $('#qa-block').textContent = quickAdd.block;
    $('#qa-block').classList.toggle('is-set', quickAdd.block !== 'anytime');
    const cat = quickAdd.catKey ? TASKBANK[quickAdd.catKey] : null;
    $('#qa-cat').textContent = cat ? cat.name : 'Category';
    $('#qa-cat').classList.toggle('is-set', !!cat);
    $('#qa-mins').textContent = quickAdd.mins + ' min';

    $('#qa-block').onclick = pickQuickBlock;
    $('#qa-cat').onclick = pickQuickCat;
    $('#qa-mins').onclick = pickQuickMins;

    const submit = () => {
      const name = $('#qa-input').value.trim();
      if (!name) return UI.toast('Add a title first');
      const catKey = quickAdd.catKey || 'selfcare';
      const cat = TASKBANK[catKey] || { color: '#a78bfa' };
      const task = {
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
        name,
        catKey,
        color: cat.color,
        mins: quickAdd.mins,
        effort: 'Med',
        block: quickAdd.block,
        done: false,
      };
      const plan = Store.get('plan') || {};
      plan[planSelectedDate] = (plan[planSelectedDate] || []).concat(task);
      Store.set('plan', plan);
      // Save to custom tasks for reuse
      const custom = Store.get('customTasks') || [];
      if (!custom.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        custom.push({ id: 'c' + Date.now(), name, catKey, color: cat.color, mins: quickAdd.mins, effort: 'Med' });
        Store.set('customTasks', custom);
      }
      if (planSelectedDate === UI.ymd()) {
        Store.set('dayTasks', JSON.parse(JSON.stringify(plan[planSelectedDate])));
      }
      $('#qa-input').value = '';
      UI.toast('Added');
      renderPlanBlocks();
      renderHome();
    };
    $('#qa-submit').onclick = submit;
    $('#qa-input').onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  function pickQuickBlock() {
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">When</div>
        <h2 class="sheet-title">Which <em>block?</em></h2>
      </div>
      <div class="sheet-body">
        <div class="block-picker">
          ${BLOCKS.map(b => `<button class="block-pick ${quickAdd.block === b ? 'is-on' : ''}" data-b="${b}">${b}</button>`).join('')}
        </div>
      </div>`);
    document.querySelectorAll('.block-pick').forEach(b => {
      b.onclick = () => { quickAdd.block = b.dataset.b; UI.closeSheet(); renderQuickAdd(); };
    });
  }

  function pickQuickCat() {
    const cats = Object.entries(TASKBANK);
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Category</div>
        <h2 class="sheet-title">Tag it as…</h2>
      </div>
      <div class="sheet-body">
        <div class="cat-chips">
          ${cats.map(([k, c]) => `
            <button class="cat-chip ${quickAdd.catKey === k ? 'is-on' : ''}" data-k="${k}">
              <span class="dot" style="background:${c.color}"></span>${c.name}
            </button>`).join('')}
        </div>
      </div>`);
    document.querySelectorAll('.cat-chip').forEach(c => {
      c.onclick = () => { quickAdd.catKey = c.dataset.k; UI.closeSheet(); renderQuickAdd(); };
    });
  }

  function pickQuickMins() {
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Duration</div>
        <h2 class="sheet-title">About <em>how long?</em></h2>
      </div>
      <div class="sheet-body">
        <div class="cat-chips">
          ${[5, 10, 15, 20, 30, 45, 60, 90].map(m => `
            <button class="cat-chip ${quickAdd.mins === m ? 'is-on' : ''}" data-m="${m}">${m} min</button>`).join('')}
        </div>
      </div>`);
    document.querySelectorAll('[data-m]').forEach(b => {
      b.onclick = () => { quickAdd.mins = +b.dataset.m; UI.closeSheet(); renderQuickAdd(); };
    });
  }

  // ----- Task detail sheet (block, time, recurring, delete) -----
  function openTaskDetail(taskId, dateKey) {
    const plan = Store.get('plan') || {};
    const t = (plan[dateKey] || []).find(x => x.id === taskId);
    if (!t) return;

    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Task</div>
        <h2 class="sheet-title">${UI.esc(t.name)}</h2>
      </div>
      <div class="sheet-body">
        <div class="field">
          <label class="field-label">Block</label>
          <div class="block-picker" id="td-blocks">
            ${BLOCKS.map(b => `<button class="block-pick ${(t.block||'anytime')===b?'is-on':''}" data-b="${b}">${b}</button>`).join('')}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Specific time (optional)</label>
          <input class="time-input" type="time" id="td-time" value="${t.time || ''}">
        </div>
        <div class="field">
          <label class="field-label">How long</label>
          <input class="field-input" type="number" id="td-mins" value="${t.mins || 10}">
        </div>
        <div class="field">
          <label class="field-label">Repeat</label>
          <button class="btn btn-ghost btn-full" id="td-recurring">${t.recurring ? '↻ On repeat — edit days' : '↻ Make this recurring'}</button>
        </div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="td-save">Save</button>
          <button class="btn btn-ghost btn-full" id="td-delete">Remove from this day</button>
        </div>
      </div>`);

    let pickedBlock = t.block || 'anytime';
    document.querySelectorAll('#td-blocks .block-pick').forEach(b => {
      b.onclick = () => {
        pickedBlock = b.dataset.b;
        document.querySelectorAll('#td-blocks .block-pick').forEach(x => x.classList.toggle('is-on', x === b));
      };
    });
    $('#td-recurring').onclick = () => openRecurringPickerForTask(t.id, true);
    $('#td-save').onclick = () => {
      t.block = pickedBlock;
      t.time = $('#td-time').value || null;
      t.mins = +$('#td-mins').value || 10;
      // If user set a time, also align block automatically
      if (t.time) t.block = timeToBlock(t.time);
      Store.set('plan', plan);
      if (dateKey === UI.ymd()) Store.set('dayTasks', JSON.parse(JSON.stringify(plan[dateKey])));
      UI.closeSheet();
      renderPlanBlocks();
      if (dateKey === UI.ymd()) renderHome();
      UI.toast('Saved');
    };
    $('#td-delete').onclick = () => {
      removeTaskFromDate(t.id, dateKey);
      UI.closeSheet();
    };
  }

  // ----- Recurring picker (for an existing task in the plan) -----
  function openRecurringPickerForTask(taskId, fromDetail = false) {
    const plan = Store.get('plan') || {};
    const t = (plan[planSelectedDate] || []).find(x => x.id === taskId);
    if (!t) return;
    const recurring = Store.get('recurring') || [];
    const existing = t.sourceId ? recurring.find(r => r.id === t.sourceId) : null;
    const initialDays = existing ? existing.days : ['mon','tue','wed','thu','fri'];
    const picked = new Set(initialDays);

    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Repeat</div>
        <h2 class="sheet-title">${UI.esc(t.name)} <em>on…</em></h2>
      </div>
      <div class="sheet-body">
        <div class="days-picker" id="rec-days">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `
            <button class="day-tog ${picked.has(d.toLowerCase()) ? 'is-on' : ''}" data-d="${d.toLowerCase()}">${d}</button>`).join('')}
        </div>
        <div class="onb-btns">
          <button class="btn btn-primary btn-full" id="rec-save">Save</button>
          ${t.recurring ? `<button class="btn btn-ghost btn-full" id="rec-stop">Stop repeating</button>` : ''}
        </div>
      </div>`);

    document.querySelectorAll('#rec-days .day-tog').forEach(b => {
      b.onclick = () => {
        const d = b.dataset.d;
        if (picked.has(d)) picked.delete(d); else picked.add(d);
        b.classList.toggle('is-on');
      };
    });
    $('#rec-save').onclick = () => {
      if (!picked.size) return UI.toast('Pick at least one day');
      // Create or update recurring source
      let r;
      if (existing) {
        r = existing;
        r.days = [...picked];
      } else {
        r = {
          id: 'r' + Date.now(),
          name: t.name,
          catKey: t.catKey,
          color: t.color,
          mins: t.mins,
          effort: t.effort,
          block: t.block,
          time: t.time || null,
          days: [...picked],
        };
        recurring.push(r);
        t.sourceId = r.id;
      }
      t.recurring = true;
      Store.set('recurring', recurring);
      Store.set('plan', plan);
      // Reset materialized so future days re-pull this recurring
      Store.set('materializedDates', [planSelectedDate]);
      UI.closeSheet();
      renderPlanBlocks();
      UI.toast('Set to repeat');
    };
    if (t.recurring) {
      $('#rec-stop').onclick = () => {
        if (existing) {
          const remaining = recurring.filter(r => r.id !== existing.id);
          Store.set('recurring', remaining);
        }
        delete t.sourceId;
        t.recurring = false;
        Store.set('plan', plan);
        UI.closeSheet();
        renderPlanBlocks();
        UI.toast('Stopped repeating');
      };
    }
  }

  // ----- Templates -----
  function seedStartersIfNeeded() {
    if (Store.get('onboardedV3')) return;
    // Remove the old lowercase starters if they exist
    const existing = Store.get('templates') || [];
    const cleaned = existing.filter(t => !t.starter);
    Store.set('templates', cleaned);
    const STARTERS = [
      {
        id: 'starter-work',
        name: 'Work day',
        emoji: '💻',
        starter: true,
        tasks: [
          { name: 'Meds + water', catKey: 'selfcare', color: '#a78bfa', mins: 5, effort: 'Low', block: 'morning' },
          { name: 'Breakfast', catKey: 'selfcare', color: '#a78bfa', mins: 15, effort: 'Low', block: 'morning' },
          { name: 'Check inbox', catKey: 'admin', color: '#60a5fa', mins: 15, effort: 'Med', block: 'morning' },
          { name: 'Deep work block', catKey: 'admin', color: '#60a5fa', mins: 90, effort: 'High', block: 'morning' },
          { name: 'Lunch + walk', catKey: 'selfcare', color: '#a78bfa', mins: 45, effort: 'Low', block: 'afternoon' },
          { name: 'Admin tasks', catKey: 'admin', color: '#60a5fa', mins: 30, effort: 'Med', block: 'afternoon' },
          { name: 'Shut laptop', catKey: 'selfcare', color: '#a78bfa', mins: 5, effort: 'Low', block: 'evening' },
          { name: 'Dinner', catKey: 'selfcare', color: '#a78bfa', mins: 30, effort: 'Low', block: 'evening' },
        ],
      },
      {
        id: 'starter-rest',
        name: 'Rest day',
        emoji: '🌿',
        starter: true,
        tasks: [
          { name: 'Meds + slow morning', catKey: 'selfcare', color: '#a78bfa', mins: 30, effort: 'Low', block: 'morning' },
          { name: 'Something nice for breakfast', catKey: 'selfcare', color: '#a78bfa', mins: 20, effort: 'Low', block: 'morning' },
          { name: 'One cosy thing', catKey: 'creative', color: '#e879f9', mins: 60, effort: 'Low', block: 'afternoon' },
          { name: 'Go outside (even briefly)', catKey: 'exercise', color: '#34d399', mins: 20, effort: 'Low', block: 'afternoon' },
          { name: 'Easy dinner', catKey: 'selfcare', color: '#a78bfa', mins: 20, effort: 'Low', block: 'evening' },
          { name: 'Wind down', catKey: 'selfcare', color: '#a78bfa', mins: 30, effort: 'Low', block: 'evening' },
        ],
      },
      {
        id: 'starter-admin',
        name: 'Admin day',
        emoji: '📋',
        starter: true,
        tasks: [
          { name: 'Meds + coffee', catKey: 'selfcare', color: '#a78bfa', mins: 10, effort: 'Low', block: 'morning' },
          { name: 'Open all the scary tabs', catKey: 'admin', color: '#60a5fa', mins: 10, effort: 'Med', block: 'morning' },
          { name: 'Deal with the worst one first', catKey: 'admin', color: '#60a5fa', mins: 30, effort: 'High', block: 'morning' },
          { name: 'Tidy a small space', catKey: 'cleaning', color: '#f472b6', mins: 15, effort: 'Low', block: 'afternoon' },
          { name: 'Reply to that one message', catKey: 'admin', color: '#60a5fa', mins: 10, effort: 'Med', block: 'afternoon' },
          { name: 'A treat for surviving', catKey: 'selfcare', color: '#a78bfa', mins: 20, effort: 'Low', block: 'evening' },
        ],
      },
    ];
    Store.set('templates', STARTERS);
    Store.set('onboardedV3', true);
  }

  function openTemplatesSheet() {
    const tpls = Store.get('templates') || [];
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Templates</div>
        <h2 class="sheet-title">Your <em>routines</em></h2>
      </div>
      <div class="sheet-body">
        ${tpls.length ? tpls.map(t => `
          <div class="template-card ${t.starter ? 'is-starter' : ''}" data-id="${t.id}">
            <div class="template-card-name">${t.emoji || '✦'} ${UI.esc(t.name)}</div>
            <div class="template-card-meta">${t.tasks.length} tasks${t.starter ? ' · example' : ''}</div>
            <div class="template-card-tasks">${t.tasks.slice(0, 4).map(x => x.name).join(' · ')}${t.tasks.length > 4 ? '…' : ''}</div>
            <div class="template-card-actions">
              <button class="btn btn-primary" data-act="apply" data-id="${t.id}">Apply to this day</button>
              ${t.starter ? '' : `<button class="btn btn-ghost" data-act="delete" data-id="${t.id}">Delete</button>`}
            </div>
          </div>
        `).join('') : '<div style="text-align:center;padding:20px 0;color:var(--text-soft)">No templates yet. Build a day you like, then save it.</div>'}
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-ghost btn-full" id="tpl-save-current">Save this day as a template</button>
        </div>
      </div>`);

    document.querySelectorAll('[data-act="apply"]').forEach(b => {
      b.onclick = () => applyTemplate(b.dataset.id);
    });
    document.querySelectorAll('[data-act="delete"]').forEach(b => {
      b.onclick = () => {
        const remaining = (Store.get('templates') || []).filter(t => t.id !== b.dataset.id);
        Store.set('templates', remaining);
        openTemplatesSheet();
      };
    });
    $('#tpl-save-current').onclick = saveDayAsTemplate;
  }

  function applyTemplate(id) {
    const tpls = Store.get('templates') || [];
    const tpl = tpls.find(t => t.id === id);
    if (!tpl) return;
    const plan = Store.get('plan') || {};
    const day = plan[planSelectedDate] || [];
    tpl.tasks.forEach(t => {
      day.push({
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
        name: t.name,
        catKey: t.catKey,
        color: t.color,
        mins: t.mins,
        effort: t.effort,
        block: t.block || 'anytime',
        time: t.time || null,
        done: false,
      });
    });
    plan[planSelectedDate] = day;
    Store.set('plan', plan);
    if (planSelectedDate === UI.ymd()) Store.set('dayTasks', JSON.parse(JSON.stringify(day)));
    UI.closeSheet();
    UI.toast(`Applied — ${tpl.name}`);
    renderPlan();
    renderHome();
  }

  function saveDayAsTemplate() {
    const plan = Store.get('plan') || {};
    const day = plan[planSelectedDate] || [];
    if (!day.length) return UI.toast('Nothing to save — the day is empty');
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Save</div>
        <h2 class="sheet-title">Name this <em>routine</em></h2>
      </div>
      <div class="sheet-body">
        <div class="field">
          <label class="field-label">Name</label>
          <input class="field-input" id="tpl-name" placeholder="e.g. studio day, hangover day…">
        </div>
        <div class="field">
          <label class="field-label">Emoji (optional)</label>
          <input class="field-input" id="tpl-emoji" placeholder="✨">
        </div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="tpl-save-go">Save</button>
        </div>
      </div>`);
    $('#tpl-save-go').onclick = () => {
      const name = $('#tpl-name').value.trim();
      if (!name) return UI.toast('Give it a name');
      const tpls = Store.get('templates') || [];
      tpls.push({
        id: 'tpl' + Date.now(),
        name,
        emoji: $('#tpl-emoji').value.trim() || '✦',
        tasks: day.map(t => ({
          name: t.name, catKey: t.catKey, color: t.color,
          mins: t.mins, effort: t.effort, block: t.block || 'anytime', time: t.time || null,
        })),
      });
      Store.set('templates', tpls);
      UI.closeSheet();
      UI.toast(`Saved — ${name}`);
    };
  }

  // ----- Appointments -----
  function openAppointmentSheet(apptId) {
    const appts = Store.get('appointments') || [];
    const existing = apptId ? appts.find(a => a.id === apptId) : null;
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">${existing ? 'Edit' : 'New'} appointment</div>
        <h2 class="sheet-title">${existing ? 'Edit' : 'An'} <em>appointment</em></h2>
      </div>
      <div class="sheet-body">
        <div class="field">
          <label class="field-label">What</label>
          <input class="field-input" id="ap-title" value="${existing ? UI.esc(existing.title) : ''}" placeholder="e.g. dentist, therapist, lunch with Sam">
        </div>
        <div class="field">
          <label class="field-label">Date</label>
          <input class="field-input" type="date" id="ap-date" value="${existing ? existing.date : planSelectedDate}">
        </div>
        <div class="field">
          <label class="field-label">Time</label>
          <input class="time-input" type="time" id="ap-time" value="${existing ? existing.time : '09:00'}">
        </div>
        <div class="field">
          <label class="field-label">How long (min)</label>
          <input class="field-input" type="number" id="ap-mins" value="${existing ? existing.mins : 30}">
        </div>
        <div class="field">
          <label class="field-label">Notes (optional)</label>
          <textarea class="field-input" id="ap-notes" placeholder="Address, who, what to bring…">${existing ? UI.esc(existing.notes || '') : ''}</textarea>
        </div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="ap-save">Save</button>
          ${existing ? '<button class="btn btn-ghost btn-full" id="ap-delete">Delete</button>' : ''}
        </div>
      </div>`);

    $('#ap-save').onclick = () => {
      const title = $('#ap-title').value.trim();
      if (!title) return UI.toast('Give it a title');
      const data = {
        id: existing ? existing.id : 'ap' + Date.now(),
        title,
        date: $('#ap-date').value || planSelectedDate,
        time: $('#ap-time').value || '09:00',
        mins: +$('#ap-mins').value || 30,
        notes: $('#ap-notes').value.trim(),
        color: '#ffb38a',
      };
      const list = Store.get('appointments') || [];
      const idx = list.findIndex(a => a.id === data.id);
      if (idx >= 0) list[idx] = data; else list.push(data);
      Store.set('appointments', list);
      UI.closeSheet();
      UI.toast('Saved');
      renderPlan();
      renderHome();
    };
    if (existing) {
      $('#ap-delete').onclick = () => {
        deleteAppointment(existing.id);
        UI.closeSheet();
      };
    }
  }

  function deleteAppointment(id) {
    const list = (Store.get('appointments') || []).filter(a => a.id !== id);
    Store.set('appointments', list);
    renderPlan();
    renderHome();
  }

  // ----- Jump to date -----
  function openJumpToDate() {
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Jump</div>
        <h2 class="sheet-title">Jump to a <em>date</em></h2>
      </div>
      <div class="sheet-body">
        <div class="field">
          <label class="field-label">Date</label>
          <input class="field-input" type="date" id="jump-date" value="${planSelectedDate}">
        </div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="jump-go">Go</button>
        </div>
      </div>`);
    $('#jump-go').onclick = () => {
      const v = $('#jump-date').value;
      if (v) {
        planSelectedDate = v;
        materializeDate(v);
        UI.closeSheet();
        renderPlan();
      }
    };
  }

  // -------- category picker (multi-step bottom sheet) --------
  function openCategoryPicker() {
    const cats = Object.entries(TASKBANK).map(([k, c]) => ({ k, ...c }));
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Add tasks</div>
        <h2 class="sheet-title">Pick a <em>category</em></h2>
      </div>
      <div class="sheet-body">
        <div class="picker-cats">
          ${cats.map(c => `
            <div class="picker-cat" data-k="${c.k}">
              <div class="picker-cat-dot" style="background:${c.color};color:${c.color}"></div>
              <div class="picker-cat-name">${c.name}</div>
              <div class="picker-cat-count">${Object.values(c.sub).flat().length} tasks</div>
            </div>
          `).join('')}
        </div>
      </div>`);
    document.querySelectorAll('.picker-cat').forEach(el => {
      el.onclick = () => openTaskPicker(el.dataset.k);
    });
  }

  function openTaskPicker(catKey) {
    const cat = TASKBANK[catKey];
    const subs = Object.keys(cat.sub);
    let activeSub = subs[0];
    const picked = new Set();

    function html() {
      return `
        <div class="sheet-header">
          <div class="sheet-sub">${cat.name}</div>
          <h2 class="sheet-title">Pick what <em>fits</em></h2>
        </div>
        <div class="picker-tabs">
          ${subs.map(s => `<button class="picker-tab ${s === activeSub ? 'is-active' : ''}" data-s="${s}">${s}</button>`).join('')}
        </div>
        <div class="sheet-body">
          <div class="picker-grid" id="picker-grid">
            ${cat.sub[activeSub].map(([name, mins, effort]) => {
              const key = catKey + '|' + name;
              return `
                <div class="picker-tile ${picked.has(key) ? 'is-picked' : ''}" data-key="${key}" data-name="${UI.esc(name)}" data-mins="${mins}" data-effort="${effort}">
                  <div>
                    <div class="picker-tile-dot" style="background:${cat.color};box-shadow:0 0 10px ${cat.color}"></div>
                    <div class="picker-tile-name">${name}</div>
                  </div>
                  <div class="picker-tile-meta">
                    <span>${mins} min</span>
                    <span>${effort}</span>
                  </div>
                </div>`;
            }).join('')}
          </div>
          <div class="picker-actions">
            <button class="btn btn-ghost btn-full" id="picker-back">Back</button>
            <button class="btn btn-primary btn-full" id="picker-add">Add <span id="picker-count">0</span></button>
          </div>
        </div>`;
    }

    function rerender() {
      UI.openSheet(html());
      document.querySelectorAll('.picker-tab').forEach(t => {
        t.onclick = () => { activeSub = t.dataset.s; rerender(); };
      });
      document.querySelectorAll('.picker-tile').forEach(t => {
        t.onclick = () => {
          const k = t.dataset.key;
          if (picked.has(k)) picked.delete(k); else picked.add(k);
          t.classList.toggle('is-picked');
          $('#picker-count').textContent = picked.size;
        };
      });
      $('#picker-count').textContent = picked.size;
      $('#picker-back').onclick = openCategoryPicker;
      $('#picker-add').onclick = () => {
        if (!picked.size) { UI.closeSheet(); return; }
        const plan = Store.get('plan') || {};
        const day = plan[planSelectedDate] || [];
        picked.forEach(k => {
          const [, name] = k.split('|');
          const tile = document.querySelector(`.picker-tile[data-key="${CSS.escape(k)}"]`);
          if (!tile) return;
          day.push({
            id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
            name,
            catKey,
            color: cat.color,
            mins: +tile.dataset.mins,
            effort: tile.dataset.effort,
            block: 'anytime',
            done: false,
          });
        });
        plan[planSelectedDate] = day;
        Store.set('plan', plan);
        if (planSelectedDate === UI.ymd()) {
          Store.set('dayTasks', JSON.parse(JSON.stringify(day)));
        }
        UI.closeSheet();
        UI.toast(`Added ${picked.size} ${picked.size === 1 ? 'task' : 'tasks'}`);
        renderPlan();
        renderHome();
      };
    }
    rerender();
  }

  // ===========================================================
  // CHAT
  // ===========================================================
  function renderChat() {
    const profile = Store.get('profile');
    $('#chat-name').textContent = profile.neuroName || 'Neuro';
    const msgs = Store.get('chat') || [];
    if (!msgs.length) {
      msgs.push({ role: 'neuro', text: `Hey ${profile.name || 'there'} — what's going on? Give me the honest version.`, ts: Date.now() });
      Store.set('chat', msgs);
    }
    drawChat();
    document.querySelectorAll('.quick-pill').forEach(p => {
      p.onclick = () => sendMessage(p.dataset.msg);
    });
    $('#chat-send').onclick = () => sendMessage($('#chat-input').value);
    $('#chat-input').onkeydown = e => {
      if (e.key === 'Enter') sendMessage($('#chat-input').value);
    };
  }

  function drawChat() {
    const wrap = $('#chat-messages');
    const msgs = Store.get('chat') || [];
    wrap.innerHTML = msgs.map(m => `
      <div class="msg msg-${m.role}">${UI.esc(m.text)}</div>
    `).join('');
    wrap.scrollTop = wrap.scrollHeight;
  }

  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text) return;
    const msgs = Store.get('chat') || [];
    msgs.push({ role: 'user', text, ts: Date.now() });
    Store.set('chat', msgs);
    $('#chat-input').value = '';
    drawChat();

    // Task extraction shortcut
    const lower = text.toLowerCase();
    if (/\b(add|plan|schedule|put on|remind me|i need to|i have to|i've got to)\b/.test(lower) ||
        /,/.test(text)) {
      const tasks = NeuroVoice.extractTasks(text);
      if (tasks.length) {
        const plan = Store.get('plan') || {};
        const today = UI.ymd();
        plan[today] = (plan[today] || []).concat(tasks);
        Store.set('plan', plan);
        Store.set('dayTasks', JSON.parse(JSON.stringify(plan[today])));
        msgs.push({
          role: 'neuro',
          text: `Added ${tasks.length} ${tasks.length === 1 ? 'thing' : 'things'} to today: ${tasks.map(t => t.name).join(', ')}. Take them one at a time.`,
          ts: Date.now(),
        });
        Store.set('chat', msgs);
        drawChat();
        renderHome();
        return;
      }
    }

    // Typing indicator
    const wrap = $('#chat-messages');
    const typer = document.createElement('div');
    typer.className = 'msg-typing';
    typer.innerHTML = '<span></span><span></span><span></span>';
    wrap.appendChild(typer);
    wrap.scrollTop = wrap.scrollHeight;

    const history = msgs.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    history.pop(); // remove just-pushed user message duplicate from history
    const reply = await NeuroVoice.respond(text, history);
    typer.remove();

    msgs.push({ role: 'neuro', text: reply, ts: Date.now() });
    Store.set('chat', msgs);
    drawChat();
  }

  // ===========================================================
  // PATHWAYS
  // ===========================================================
  function renderPaths() {
    const canvas = $('#brain-canvas');
    const paths = Store.get('pathways') || {};
    const cats = Object.entries(TASKBANK);

    // SVG with connecting lines
    const w = 380, h = 360;
    const center = { x: w / 2, y: h / 2 };
    const positions = cats.map((_, i) => {
      const angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
      const r = 110;
      return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r };
    });

    let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
    // central node
    svg += `<circle cx="${center.x}" cy="${center.y}" r="22" fill="rgba(196,163,255,0.25)" stroke="#c4a3ff" stroke-width="1.5"/>`;
    svg += `<circle cx="${center.x}" cy="${center.y}" r="8" fill="#c4a3ff"/>`;
    // lines
    cats.forEach(([k], i) => {
      const p = paths[k];
      const strength = p ? p.strength / 100 : 0.1;
      const color = TASKBANK[k].color;
      svg += `<line x1="${center.x}" y1="${center.y}" x2="${positions[i].x}" y2="${positions[i].y}"
              stroke="${color}" stroke-width="${1 + strength * 4}" opacity="${0.3 + strength * 0.6}" stroke-linecap="round"/>`;
    });
    // outer nodes
    cats.forEach(([k], i) => {
      const p = paths[k];
      const strength = p ? p.strength / 100 : 0.15;
      const color = TASKBANK[k].color;
      const r = 8 + strength * 12;
      svg += `<circle cx="${positions[i].x}" cy="${positions[i].y}" r="${r}" fill="${color}" opacity="${0.4 + strength * 0.6}"/>`;
      svg += `<circle cx="${positions[i].x}" cy="${positions[i].y}" r="${r + 4}" fill="none" stroke="${color}" stroke-width="1" opacity="${strength * 0.5}"/>`;
    });
    svg += '</svg>';

    // labels (positioned absolutely)
    let labels = '';
    cats.forEach(([k, c], i) => {
      const x = (positions[i].x / w) * 100;
      const y = (positions[i].y / h) * 100;
      labels += `<div class="brain-node" style="left:${x}%;top:${y}%">
        <div class="brain-node-label" style="color:${c.color}">${c.name}</div>
      </div>`;
    });

    canvas.innerHTML = svg + labels;

    // Legend
    const legend = $('#path-legend');
    legend.innerHTML = cats.map(([k, c]) => {
      const p = paths[k] || { strength: 0, count: 0 };
      return `
        <button class="path-row" data-k="${k}">
          <div class="path-row-dot" style="background:${c.color};color:${c.color}"></div>
          <div class="path-row-body">
            <div class="path-row-name">${c.name}</div>
            <div class="path-row-meta">${p.count || 0} done · ${Math.round(p.strength)}% strong</div>
          </div>
          <div class="path-row-bar"><div class="path-row-fill" style="width:${p.strength}%;background:${c.color}"></div></div>
        </button>`;
    }).join('');
    legend.querySelectorAll('.path-row').forEach(el => {
      el.onclick = () => openPathwayDetail(el.dataset.k);
    });
  }

  function openPathwayDetail(catKey) {
    const cat = TASKBANK[catKey];
    const p = (Store.get('pathways') || {})[catKey] || { strength: 0, count: 0, lastDone: 0 };
    const last = p.lastDone ? new Date(p.lastDone).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Not yet';
    const subs = Object.keys(cat.sub);
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Pathway</div>
        <h2 class="sheet-title">${cat.name}</h2>
      </div>
      <div class="sheet-body">
        <div class="stats-row" style="margin-top:0">
          <div class="stat-card"><div class="t-eyebrow">Strength</div><div class="stat-value">${Math.round(p.strength)}%</div></div>
          <div class="stat-card"><div class="t-eyebrow">Done</div><div class="stat-value">${p.count || 0}</div></div>
        </div>
        <div style="color:var(--text-soft);font-size:14px;margin:14px 0 18px">Last: ${last}</div>
        <div class="t-eyebrow" style="padding:0 4px 10px">Suggestions</div>
        <div class="cat-chips">
          ${subs.flatMap(s => cat.sub[s].slice(0, 2)).slice(0, 6).map(([name, mins, effort]) => `
            <button class="cat-chip path-suggest" data-name="${UI.esc(name)}" data-mins="${mins}" data-effort="${effort}">
              <span class="dot" style="background:${cat.color}"></span>${UI.esc(name)} · ${mins}m
            </button>`).join('')}
        </div>
        <div class="onb-btns" style="margin-top:16px">
          <button class="btn btn-primary btn-full" id="pwa-plan">Add one to today</button>
        </div>
      </div>`);

    let picked = null;
    document.querySelectorAll('.path-suggest').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.path-suggest').forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on');
        picked = { name: b.dataset.name, mins: +b.dataset.mins, effort: b.dataset.effort };
      };
    });
    $('#pwa-plan').onclick = () => {
      if (!picked) return UI.toast('Pick one first');
      const plan = Store.get('plan') || {};
      const today = UI.ymd();
      const day = plan[today] || [];
      day.push({
        id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
        name: picked.name,
        catKey,
        color: cat.color,
        mins: picked.mins,
        effort: picked.effort,
        block: 'anytime',
        done: false,
      });
      plan[today] = day;
      Store.set('plan', plan);
      Store.set('dayTasks', JSON.parse(JSON.stringify(day)));
      UI.closeSheet();
      UI.toast(`Added — ${picked.name}`);
      renderHome();
    };
  }

  // ===========================================================
  // YOU
  // ===========================================================
  function renderYou() {
    const profile = Store.get('profile');
    $('#you-name').textContent = profile.name || '—';
    $('#you-pronouns').textContent = profile.pronouns || '—';
    $('#you-neuro').textContent = profile.neuroName || 'Neuro';

    // Stats
    const moods = Store.get('moods') || [];
    const avgMood = moods.length
      ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1)
      : '—';
    $('#stat-mood').textContent = avgMood;

    const plan = Store.get('plan') || {};
    let totalDone = 0;
    Object.values(plan).forEach(day => day.forEach(t => { if (t.done) totalDone++; }));
    $('#stat-tasks').textContent = totalDone;

    const medsLog = Store.get('medsLog') || [];
    $('#stat-meds').textContent = medsLog.length;

    // Cat bars
    const paths = Store.get('pathways') || {};
    const cats = Object.entries(TASKBANK);
    const catBars = $('#cat-bars');
    const maxCount = Math.max(1, ...cats.map(([k]) => (paths[k] && paths[k].count) || 0));
    catBars.innerHTML = cats.map(([k, c]) => {
      const p = paths[k] || { count: 0 };
      const pct = (p.count / maxCount) * 100;
      return `
        <div class="cat-bar">
          <div class="cat-bar-name">${c.name}</div>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${c.color}"></div></div>
          <div class="cat-bar-count">${p.count || 0}</div>
        </div>`;
    }).join('');

    // Mood bars (last 7 days)
    const moodBars = $('#mood-bars');
    const today = new Date();
    let moodHTML = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = UI.ymd(d);
      const m = moods.find(x => x.date === key);
      const h = m ? (m.score / 5) * 100 : 0;
      moodHTML += `
        <div class="mood-col">
          <div class="mood-col-bar" style="height:${h}%"></div>
          <div class="mood-col-day">${UI.shortDow(d).slice(0,1)}</div>
        </div>`;
    }
    moodBars.innerHTML = moodHTML;

    // Buttons
    $('#btn-edit-profile').onclick = openProfileSheet;
    $('#btn-edit-emergency').onclick = openEmergencySheet;
    $('#btn-api-key').onclick = openApiKeySheet;
    $('#api-status').textContent = Store.get('apiKey') ? '✓' : '→';

    // Notifications
    const notifyStatus = $('#notify-status');
    const setNotifyLabel = () => {
      if (!window.Notify || !Notify.supported()) { notifyStatus.textContent = 'n/a'; return; }
      const p = Notify.permission();
      notifyStatus.textContent = p === 'granted' ? '✓' : (p === 'denied' ? 'blocked' : '→');
    };
    setNotifyLabel();
    $('#btn-notify').onclick = async () => {
      if (!window.Notify || !Notify.supported()) {
        return UI.toast('Your browser doesn’t support reminders');
      }
      if (Notify.permission() === 'denied') {
        return UI.toast('Notifications blocked — enable in browser settings');
      }
      const ok = await Notify.enable();
      setNotifyLabel();
      if (!ok) UI.toast('No problem — turn them on any time');
    };
    $('#btn-export-data').onclick = exportData;
    $('#btn-retake-quiz').onclick = () => {
      Store.set('onboarded', false);
      App.go('onboarding');
    };
    $('#btn-clear-data').onclick = () => {
      if (confirm('This will wipe everything. Sure?')) {
        Store.clearAll();
        location.reload();
      }
    };
  }

  function openProfileSheet() {
    const profile = Store.get('profile');
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Edit</div>
        <h2 class="sheet-title">About <em>you</em></h2>
      </div>
      <div class="sheet-body">
        <div class="field">
          <label class="field-label">Name</label>
          <input class="field-input" id="pf-name" value="${UI.esc(profile.name)}">
        </div>
        <div class="field">
          <label class="field-label">Pronouns</label>
          <input class="field-input" id="pf-pronouns" value="${UI.esc(profile.pronouns)}" placeholder="she/her, they/them…">
        </div>
        <div class="field">
          <label class="field-label">${profile.neuroName || 'Neuro'}'s name</label>
          <input class="field-input" id="pf-neuro" value="${UI.esc(profile.neuroName)}">
        </div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="pf-save">Save</button>
        </div>
      </div>`);
    $('#pf-save').onclick = () => {
      const p = {
        name: $('#pf-name').value.trim(),
        pronouns: $('#pf-pronouns').value.trim(),
        neuroName: $('#pf-neuro').value.trim() || 'Neuro',
        gender: profile.gender || '',
      };
      Store.set('profile', p);
      UI.closeSheet();
      renderYou();
      UI.toast('Saved');
    };
  }

  function openEmergencySheet() {
    const e = Store.get('emergency');
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Always here</div>
        <h2 class="sheet-title">Emergency <em>vault</em></h2>
      </div>
      <div class="sheet-body">
        <p style="color:var(--text-soft);font-size:14px;line-height:1.5;margin-bottom:16px">Private to your device. Easy to grab when your brain goes offline.</p>
        <div class="field"><label class="field-label">GP / doctor</label><input class="field-input" id="em-gp" value="${UI.esc(e.gp)}" placeholder="Name, phone"></div>
        <div class="field"><label class="field-label">Therapist</label><input class="field-input" id="em-th" value="${UI.esc(e.therapist)}" placeholder="Name, phone"></div>
        <div class="field"><label class="field-label">Trusted person</label><input class="field-input" id="em-tr" value="${UI.esc(e.trusted)}" placeholder="Who to call when it's bad"></div>
        <div class="field"><label class="field-label">Meds list</label><textarea class="field-input" id="em-meds" placeholder="What you take, doses, when">${UI.esc(e.meds)}</textarea></div>
        <div class="field"><label class="field-label">Crisis line</label><input class="field-input" id="em-nhs" value="${UI.esc(e.nhs || '111 (UK) · Samaritans 116 123')}"></div>
        <div class="onb-btns" style="margin-top:14px">
          <button class="btn btn-primary btn-full" id="em-save">Save</button>
        </div>
      </div>`);
    $('#em-save').onclick = () => {
      Store.set('emergency', {
        gp: $('#em-gp').value, therapist: $('#em-th').value, trusted: $('#em-tr').value,
        meds: $('#em-meds').value, nhs: $('#em-nhs').value,
      });
      UI.closeSheet();
      UI.toast('Locked in');
    };
  }

  function openApiKeySheet() {
    UI.openSheet(`
      <div class="sheet-header">
        <div class="sheet-sub">Optional</div>
        <h2 class="sheet-title">Connect <em>Claude</em></h2>
      </div>
      <div class="sheet-body">
        <p style="color:var(--text-soft);font-size:15px;line-height:1.5;margin-bottom:18px">
          Paste an Anthropic API key and Neuro will use Claude for smarter replies. Otherwise the built-in responses still work fine.
        </p>
        <div class="field">
          <label class="field-label">API key</label>
          <input class="field-input" id="api-input" type="password" value="${UI.esc(Store.get('apiKey'))}" placeholder="sk-ant-…">
        </div>
        <p style="font-family:var(--font-sans);font-size:11px;color:var(--text-mute);letter-spacing:0.05em;margin-bottom:14px">Stored locally in your browser only. Never sent anywhere except Anthropic.</p>
        <div class="onb-btns">
          <button class="btn btn-primary btn-full" id="api-save">Save</button>
          <button class="btn btn-ghost btn-full" id="api-clear">Remove key</button>
        </div>
      </div>`);
    $('#api-save').onclick = () => {
      Store.set('apiKey', $('#api-input').value.trim());
      UI.closeSheet();
      renderYou();
      UI.toast('Connected');
    };
    $('#api-clear').onclick = () => {
      Store.set('apiKey', '');
      UI.closeSheet();
      renderYou();
      UI.toast('Removed');
    };
  }

  function exportData() {
    const data = {};
    Object.keys(Store.DEFAULTS).forEach(k => { data[k] = Store.get(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuro-export-${UI.ymd()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Exported');
  }

  return {
    renderHome, renderPlan, renderChat, renderPaths, renderYou,
    bumpPathway,
  };
})();

window.Screens = Screens;
