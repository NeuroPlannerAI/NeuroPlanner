/* ============================================================
   NEURO — ONBOARDING FLOW
   welcome → name → neuro name → quiz → mirror reveal → done
   ============================================================ */

const Onboarding = (function () {

  const QUIZ = [
    {
      q: "What does your <em>brain</em> do most?",
      opts: [
        { label: "Spirals into anxiety",    k: 'anxious' },
        { label: "Forgets everything",      k: 'forgetful' },
        { label: "Can't start anything",    k: 'stuck' },
        { label: "Won't switch off",        k: 'wired' },
      ]
    },
    {
      q: "What do you want <em>help</em> with?",
      opts: [
        { label: "Remembering meds, water, food", k: 'basics' },
        { label: "Starting the stuff I dread",    k: 'starting' },
        { label: "Calming down when it's a lot",  k: 'calm' },
        { label: "All of the above, tbh",         k: 'all' },
      ]
    },
    {
      q: "How should I <em>talk</em> to you?",
      opts: [
        { label: "Warm, best-mate energy",  k: 'warm' },
        { label: "Blunt and to the point",  k: 'blunt' },
        { label: "Soft and gentle",         k: 'soft' },
        { label: "Funny, slightly chaotic", k: 'funny' },
      ]
    },
    {
      q: "Your <em>perfect</em> day looks like…",
      opts: [
        { label: "Chilled, low pressure",  k: 'chilled' },
        { label: "Productive but kind",    k: 'productive' },
        { label: "Creative + cosy",        k: 'creative' },
        { label: "Outside + moving",       k: 'active' },
      ]
    },
    {
      q: "What would <em>change everything</em>?",
      opts: [
        { label: "Actually following a plan",     k: 'follow' },
        { label: "Feeling less alone in this",    k: 'company' },
        { label: "Stopping the spiral spirals",   k: 'spiral' },
        { label: "Remembering basic stuff",       k: 'memory' },
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
          <div class="onb-eyebrow">Welcome</div>
          <h1 class="onb-title">Hi. I'm <span class="accent">Neuro.</span></h1>
          <p class="onb-sub">I'm a brain with legs. I live in this app and I'll help you do the stuff — without making you feel bad about it.</p>
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-go">Let's go</button>
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
          <div class="onb-eyebrow">About you</div>
          <h1 class="onb-title">First — what should I <em>call you?</em></h1>
        </div>
        <div class="a-fade-up d-2" style="width:100%;display:flex;flex-direction:column;align-items:center">
          <input class="onb-input" id="onb-name" placeholder="Your name…" autocomplete="off">
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-next">That's me</button>
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
          <div class="onb-eyebrow">About me</div>
          <h1 class="onb-title">Nice to meet you, ${UI.esc(pickedName)}.<br>Now <em>name me.</em></h1>
          <p class="onb-sub">Most people just call me Neuro. Name me whatever — Pebble, Biscuit, Gandalf. Your call.</p>
        </div>
        <div class="a-fade-up d-2" style="width:100%;display:flex;flex-direction:column;align-items:center">
          <input class="onb-input" id="onb-neuroname" placeholder="Neuro" autocomplete="off">
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-next">Perfect</button>
          <button class="btn btn-ghost btn-full" id="onb-skip">Just Neuro is fine</button>
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
          <div class="onb-eyebrow">${UI.esc(pickedNeuro)} wants to know</div>
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
          <div class="onb-eyebrow">Here's what I heard</div>
          <h2 class="quiz-q" style="font-size:24px;max-width:340px">${mood.line}</h2>
          <p class="onb-sub">${mood.sub}</p>
        </div>
        <div class="onb-btns a-fade-up d-3">
          <button class="btn btn-primary btn-full" id="onb-finish">Let's start</button>
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
        chat.push({
          role: 'neuro',
          text: `Right, ${pickedName}. I'm ${pickedNeuro} now. Talk to me whenever — plan a day, vent, panic, ask me anything. I don't sleep.`,
          ts: Date.now(),
        });
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
        line: `Your brain spirals and you want it to <em>stop.</em>`,
        sub: `I can help. When you feel it coming, just say "I'm spiralling" and I'll be right here.`,
      };
    }
    if (a.q0 === 'stuck' || a.q1 === 'starting') {
      return {
        state: 'thinking',
        line: `You know what to do. Starting is the hard bit.`,
        sub: `Same. We'll start tiny. One task, always. No big lists, no overwhelm.`,
      };
    }
    if (a.q0 === 'forgetful' || a.q4 === 'memory') {
      return {
        state: 'happy',
        line: `You forget the basics — not because you don't care.`,
        sub: `Your brain just doesn't hold them. Fine. I'll hold them for you.`,
      };
    }
    return {
      state: 'happy',
      line: `You just want a day that <em>feels okay.</em>`,
      sub: `Same. We'll do this together. One small thing at a time.`,
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
