/* ============================================================
   NEURO — VOICE
   Smart fallback responses + optional Claude API integration.
   Also handles natural-language task extraction (Tiimo-style).
   ============================================================ */

const NeuroVoice = (function () {

  // -----------------------------------------------
  // FALLBACK RESPONSES
  // -----------------------------------------------
  const RESPONSES = {
    greeting: [
      "Hey. How's your brain treating you today — honest answer.",
      "Alright, what's the vibe? Give me the real one, not the 'I'm fine' one.",
      "Hey. Before we do anything — have you had water? Just checking.",
      "Morning, or evening, or whatever it is. How are we feeling?",
    ],
    plan: [
      "Right, let's not overthink this. How much energy have you actually got? Be brutal.",
      "Planning mode. On a scale of 'can barely lift my phone' to 'weirdly productive' — where are we?",
      "Let's build your day. No pressure, no guilt. Just what feels doable.",
      "Tell me what's on your mind and I'll sort it. Don't structure it, just throw it at me.",
    ],
    spiral: [
      "Okay. I hear you. First thing — you're not broken, your brain is just doing that thing again. Let's slow down.\n\nBreathe in for 4. Hold for 4. Out for 4.\n\nWhat's the actual thought stuck on repeat?",
      "I'm here. You're spiralling and that's okay — it doesn't mean the thoughts are true.\n\nLet's ground you. Look around. Name 5 things you can see right now.",
      "The spiral lies. It always does. You've survived every single one of these before.\n\nOne tiny thing — can you move to a different room? Changing what you're looking at sometimes breaks the loop.",
    ],
    selfcare: [
      "Self-care idea: the everything shower. Music on, every product you own, come out a different person. Factory reset.",
      "Try the 'one nice thing' approach. Just ONE thing for yourself. Face mask while watching trash tv. Proper cup of tea with actual biscuits.",
      "Sometimes the best self-care is cancelling plans you dreaded, putting on the softest thing you own, and watching something you've seen 47 times.",
    ],
    script: [
      "I can help with that. Who do you need to message or call, and what's it about?",
      "People scripts are my thing. Who, what, and how anxious are we about it?",
    ],
    impulse: [
      "Okay. 24-hour rule. If you still want it tomorrow, fine. Usually you won't. Good move asking me first.",
      "Let's pause. What's going on under the urge — boredom, stress, loneliness, all three?",
    ],
    general: [
      "That's valid. Your brain isn't making this up — it's just processing things differently.",
      "Tbh that sounds exhausting. You're doing more than you think.",
      "Some days are just about surviving, and that's enough. What's one tiny thing that might make the next hour slightly less awful?",
      "I hear you. Say more if you want to, or we can just sit here. Either is fine.",
    ],
  };

  function classify(text) {
    const t = text.toLowerCase();
    if (/\b(hi|hey|hello|morning|evening|yo|sup)\b/.test(t)) return 'greeting';
    if (/\b(plan|day|tasks?|schedule|todo|to.do)\b/.test(t)) return 'plan';
    if (/\b(spiral|panic|anxious|anxiety|overwhelm|crash|breakdown|losing it)\b/.test(t)) return 'spiral';
    if (/\b(self.?care|pamper|treat myself|tired|exhausted)\b/.test(t)) return 'selfcare';
    if (/\b(script|message|text|call|email|reply|say to)\b/.test(t)) return 'script';
    if (/\b(impulse|spending|buy|order|takeaway|stop me)\b/.test(t)) return 'impulse';
    return 'general';
  }

  function pickFallback(text) {
    const cat = classify(text);
    const list = RESPONSES[cat];
    return list[Math.floor(Math.random() * list.length)];
  }

  // -----------------------------------------------
  // TASK EXTRACTION (lightweight rule-based)
  // -----------------------------------------------
  function extractTasks(text) {
    const out = [];
    // Split on commas, "and", periods, line breaks
    const chunks = text.split(/(?:,|\band\b|;|\.|\n|then\b)/i)
      .map(s => s.trim())
      .filter(Boolean);

    chunks.forEach(chunk => {
      const lower = chunk.toLowerCase();
      // Skip noise
      if (lower.length < 3) return;
      if (/^(i|i'?ve? got|i need to|i want to|i should|i have to|please|can you|remind me to)\s+/i.test(chunk)) {
        chunk = chunk.replace(/^(i|i'?ve? got|i need to|i want to|i should|i have to|please|can you|remind me to)\s+/i, '');
      }
      if (chunk.length < 3) return;

      // Try to match against the task bank for category guess
      const match = window.FLAT_TASKS && window.FLAT_TASKS.find(t =>
        lower.includes(t.name.toLowerCase().split(' ')[0])
      );

      let cat = 'admin', color = '#60a5fa', mins = 15, effort = 'Med';
      if (match) {
        cat = match.catKey;
        color = match.color;
        mins = match.mins;
        effort = match.effort;
      } else {
        // Heuristics
        if (/\b(walk|run|gym|exercise|yoga|stretch)\b/.test(lower)) { cat='exercise'; color='#34d399'; mins=20; effort='Med'; }
        else if (/\b(clean|tidy|hoover|mop|laundry|wash|kitchen|bathroom)\b/.test(lower)) { cat='cleaning'; color='#f472b6'; mins=15; effort='Med'; }
        else if (/\b(shower|skincare|nap|rest|meds|teeth|bath)\b/.test(lower)) { cat='selfcare'; color='#a78bfa'; mins=15; effort='Low'; }
        else if (/\b(dog|cat|pet|feed|walkies)\b/.test(lower)) { cat='pets'; color='#fb923c'; mins=20; effort='Low'; }
        else if (/\b(call|email|book|appointment|gp|dentist|bank)\b/.test(lower)) { cat='admin'; color='#60a5fa'; mins=10; effort='Med'; }
        else if (/\b(draw|write|paint|read|cook|bake|knit)\b/.test(lower)) { cat='creative'; color='#e879f9'; mins=30; effort='Low'; }
        else if (/\b(text|message|call .* friend|see .* friend)\b/.test(lower)) { cat='social'; color='#fbbf24'; mins=10; effort='Med'; }
      }

      // Capitalise nicely
      const name = chunk.charAt(0).toUpperCase() + chunk.slice(1);
      out.push({
        id: 'x' + Date.now() + Math.random().toString(36).slice(2, 6),
        name: name.slice(0, 60),
        catKey: cat,
        color,
        mins,
        effort,
        block: 'anytime',
        done: false,
      });
    });
    return out;
  }

  // -----------------------------------------------
  // OPTIONAL CLAUDE API
  // -----------------------------------------------
  async function callClaude(messages, systemPrompt) {
    const apiKey = window.Store.get('apiKey');
    if (!apiKey) return null;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 600,
          system: systemPrompt,
          messages,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.content?.[0]?.text || null;
    } catch (e) {
      return null;
    }
  }

  function buildSystemPrompt() {
    const profile = window.Store.get('profile');
    const name = profile.name || 'mate';
    const neuroName = profile.neuroName || 'Neuro';
    const dayTasks = window.Store.get('dayTasks') || [];
    const done = dayTasks.filter(t => t.done).length;

    return `You are ${neuroName}, a warm, witty companion living inside an app called Neuro. The user's name is ${name}. You help them plan their day, manage their brain, and feel less alone.

Voice rules:
- Peer, not parent. Best friend who gets ADHD and ND brains. British English. Casual ("gonna", "tbh", "mate").
- Sentence case — standard capitalisation, not aggressively lowercase. Warm, witty, never preachy. Zero platitudes. Never say "proud of you", "well done", "good job", "take care little one" or anything that sounds like a parent.
- 2-4 sentences usually. Longer only if asked.
- Read the room. Spiralling → slow down, ground them. Planning → practical and brisk.
- References real ND experiences without being clinical.
- Never says "as an AI" or breaks character.
- Validate first, then help.
- User is 16-25. Speak to them like an equal.

Current state:
- ${done} of ${dayTasks.length} tasks done today.
- The user can speak to you to add tasks, set reminders, or vent. Treat each message like a real conversation.`;
  }

  async function respond(userText, history = []) {
    const apiKey = window.Store.get('apiKey');
    if (apiKey) {
      const messages = history.concat([{ role: 'user', content: userText }]);
      const reply = await callClaude(messages, buildSystemPrompt());
      if (reply) return reply;
    }
    return pickFallback(userText);
  }

  return { respond, pickFallback, extractTasks, classify };
})();

window.NeuroVoice = NeuroVoice;
