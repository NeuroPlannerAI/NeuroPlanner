/* ============================================================
   NEURO — ONBOARDING FLOW
   welcome → name → neuro name → quiz → mirror reveal → done
   ============================================================ */

const Onboarding = (function () {

  const QUIZ = [
    {
      q: "what does your <em>brain</em> do most?",
      opts: [
        { label: "spirals into anxiety", k: 'anxious' },
        { label: "forgets everything",   k: 'forgetful' },
        { label: "can't start anything", k: 'stuck' },
        { label: "won't switch off",     k: 'wired' },
      ]
    },
    {
      q: "what do you usually <em>need</em> help with?",
      opts: [
        { label: "remembering meds, water, food", k: 'basics' },
        { label: "starting tasks i'm dreading",    k: 'starting' },
        { label: "calming down when it's a lot",   k: 'calm' },
        { label: "all of the above tbh",           k: 'all' },
      ]
    },
    {
      q: "how do you want me to <em>talk</em> to you?",
      opts: [
        { label: "warm best mate energy", k: 'warm' },
        { label: "blunt and to the point", k: 'blunt' },
        { label: "soft and gentle",        k: 'soft' },
        { label: "funny, slightly chaotic", k: 'funny' },
      ]
    },
    {
      q: "your <em>perfect</em> day looks like…",
      opts: [
        { label: "chilled, low pressure",   k: 'chilled' },
        { label: "productive but kind",     k: 'productive' },
        { label: "creative + cosy",         k: 'creative' },
        { label: "outside + moving",        k: 'active' },
      ]
    },
    {
      q: "what would <em>change everything</em>?",
      opts: [
        { label: "actually following a plan", k: 'follow' },
        { label: "feeling less alone in this", k: 'company' },
        { label: "stopping the spiral spirals", k: 'spiral' },
        { label: "remembering basic stuff",     k: 'memory' },
      ]
    },
  ];

  let stageIdx = 0;
  let quizIdx = 0;
  const answers = {};
  let pickedName = '';
  let pickedNeuro = '';

  function stageEl() { return document.getElementById('onb-stage'); }

  function next() { stageIdx++; render(); }

  function render() {
    const stage = stageEl();
    if (!stage) return;

    if (stageIdx === 0) {
      // Welcome
      stage.innerHTML = `
        <div class="a-fade-up">
          ${NeuroChar.render({ size: 160, state: 'happy' })}
        </div>
        <div class="a-fade-up d-2">
          <div class="onb-eyebrow">welcome</div>
          <h1 class="onb-title">hi. i'm <span class="accent">neuro.</span></h1>
          <p class="onb-sub">i'm a brain with legs. i live in this app, and i'm gonna help you do the things — without making you feel bad about it.</p>
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-go">let's go</button>
        </div>`;
      document.getElementById('onb-go').onclick = next;
      return;
    }

    if (stageIdx === 1) {
      // Name input
      stage.innerHTML = `
        <div class="a-fade-up">
          ${NeuroChar.render({ size: 130, state: 'thinking' })}
        </div>
        <div class="a-fade-up d-1">
          <div class="onb-eyebrow">about you</div>
          <h1 class="onb-title">first — what should i <em>call you?</em></h1>
        </div>
        <div class="a-fade-up d-2" style="width:100%;display:flex;flex-direction:column;align-items:center">
          <input class="onb-input" id="onb-name" placeholder="your name…" autocomplete="off">
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-next">that's me</button>
        </div>`;
      const inp = document.getElementById('onb-name');
      inp.value = pickedName;
      inp.focus();
      document.getElementById('onb-next').onclick = () => {
        pickedName = inp.value.trim() || 'friend';
        next();
      };
      inp.onkeydown = e => { if (e.key === 'Enter') document.getElementById('onb-next').click(); };
      return;
    }

    if (stageIdx === 2) {
      // Name Neuro
      stage.innerHTML = `
        <div class="a-fade-up">
          ${NeuroChar.render({ size: 130, state: 'happy' })}
        </div>
        <div class="a-fade-up d-1">
          <div class="onb-eyebrow">about me</div>
          <h1 class="onb-title">nice to meet you, ${UI.esc(pickedName)}.<br>now <em>name me.</em></h1>
          <p class="onb-sub">most people just call me neuro. but you can name me whatever you want — pebble, biscuit, gandalf, your call.</p>
        </div>
        <div class="a-fade-up d-2" style="width:100%;display:flex;flex-direction:column;align-items:center">
          <input class="onb-input" id="onb-neuroname" placeholder="neuro" autocomplete="off">
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-next">perfect</button>
          <button class="btn btn-ghost btn-full" id="onb-skip">just neuro is fine</button>
        </div>`;
      const inp = document.getElementById('onb-neuroname');
      inp.value = pickedNeuro;
      inp.focus();
      document.getElementById('onb-next').onclick = () => {
        pickedNeuro = inp.value.trim() || 'Neuro';
        quizIdx = 0;
        next();
      };
      document.getElementById('onb-skip').onclick = () => {
        pickedNeuro = 'Neuro';
        quizIdx = 0;
        next();
      };
      inp.onkeydown = e => { if (e.key === 'Enter') document.getElementById('onb-next').click(); };
      return;
    }

    if (stageIdx === 3) {
      // Quiz
      const q = QUIZ[quizIdx];
      const pips = QUIZ.map((_, i) => {
        if (i < quizIdx) return '<span class="quiz-pip is-done"></span>';
        if (i === quizIdx) return '<span class="quiz-pip is-on"></span>';
        return '<span class="quiz-pip"></span>';
      }).join('');
      stage.innerHTML = `
        <div class="a-fade-in">
          ${NeuroChar.render({ size: 100, state: 'thinking' })}
        </div>
        <div class="a-fade-up d-1">
          <div class="onb-eyebrow">${pickedNeuro.toLowerCase()} wants to know</div>
          <h2 class="quiz-q">${q.q}</h2>
        </div>
        <div class="quiz-progress a-fade-up d-2">${pips}</div>
        <div class="quiz-opts a-fade-up d-3">
          ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${UI.esc(o.label)}</button>`).join('')}
        </div>`;
      Array.from(stage.querySelectorAll('.quiz-opt')).forEach(btn => {
        btn.onclick = () => {
          const i = +btn.dataset.i;
          answers['q' + quizIdx] = q.opts[i].k;
          btn.classList.add('is-picked');
          setTimeout(() => {
            quizIdx++;
            if (quizIdx >= QUIZ.length) next();
            else render();
          }, 220);
        };
      });
      return;
    }

    if (stageIdx === 4) {
      // Mirror reveal
      const mood = pickMoodFromAnswers();
      stage.innerHTML = `
        <div class="a-fade-up">
          ${NeuroChar.render({ size: 170, state: mood.state })}
        </div>
        <div class="a-fade-up d-2">
          <div class="onb-eyebrow">here's what i heard</div>
          <h2 class="quiz-q" style="font-size:24px;max-width:340px">${mood.line}</h2>
          <p class="onb-sub">${mood.sub}</p>
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-finish">let's start</button>
        </div>`;
      document.getElementById('onb-finish').onclick = () => {
        // Save profile
        const profile = window.Store.get('profile');
        profile.name = pickedName;
        profile.neuroName = pickedNeuro;
        window.Store.set('profile', profile);
        window.Store.set('quiz', answers);
        window.Store.set('onboarded', true);
        // Add a welcome chat message
        const chat = window.Store.get('chat') || [];
        chat.push({ role: 'neuro', text: `right, ${pickedName.toLowerCase()}. i'm ${pickedNeuro.toLowerCase()} now. talk to me whenever — plan a day, vent, panic, ask me anything. i don't sleep.`, ts: Date.now() });
        window.Store.set('chat', chat);
        if (window.App) window.App.go('home');
      };
      return;
    }
  }

  function pickMoodFromAnswers() {
    const a = answers;
    if (a.q0 === 'anxious' || a.q4 === 'spiral') {
      return {
        state: 'concerned',
        line: `your brain spirals and you want it to <em>stop.</em>`,
        sub: `i can help with that. when you feel it coming, just say "i'm spiralling" and i'll be right here.`,
      };
    }
    if (a.q0 === 'stuck' || a.q1 === 'starting') {
      return {
        state: 'thinking',
        line: `you know what to do. starting is the hard bit.`,
        sub: `same. we'll start tiny. one task. always. no big lists, no overwhelm.`,
      };
    }
    if (a.q0 === 'forgetful' || a.q4 === 'memory') {
      return {
        state: 'happy',
        line: `you forget the basics, not because you don't care.`,
        sub: `your brain just doesn't hold them. that's fine — i'll hold them for you.`,
      };
    }
    return {
      state: 'happy',
      line: `you just want a day that <em>feels okay.</em>`,
      sub: `same. we'll do this together. one tiny thing at a time.`,
    };
  }

  function start() {
    stageIdx = 0;
    quizIdx = 0;
    Object.keys(answers).forEach(k => delete answers[k]);
    pickedName = window.Store.get('profile').name || '';
    pickedNeuro = window.Store.get('profile').neuroName || '';
    render();
  }

  return { start };
})();

window.Onboarding = Onboarding;
