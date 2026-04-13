/* ============================================================
   NEURO — UI HELPERS
   Toast, bottom sheet, backdrop, time-of-day, stars, $ helper.
   ============================================================ */

const UI = (function () {

  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else node.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ----- TOAST -----
  let toastTimer = null;
  function toast(msg, ms = 2400) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), ms);
  }

  // ----- SHEET -----
  function openSheet(html) {
    const sheet = $('#sheet');
    const back = $('#backdrop');
    sheet.innerHTML = `<div class="sheet-handle"></div>${html}`;
    sheet.classList.add('is-visible');
    back.classList.add('is-visible');
    back.onclick = closeSheet;
  }
  function closeSheet() {
    const sheet = $('#sheet');
    const back = $('#backdrop');
    sheet.classList.remove('is-visible');
    back.classList.remove('is-visible');
    setTimeout(() => { sheet.innerHTML = ''; }, 320);
  }

  // ----- TIME-OF-DAY -----
  function timeOfDay() {
    const h = new Date().getHours();
    if (h < 5)  return 'night';
    if (h < 11) return 'dawn';
    if (h < 17) return 'day';
    if (h < 21) return 'dusk';
    return 'night';
  }
  function greetFor(tod) {
    return ({
      night: 'Still up,',
      dawn:  'Morning,',
      day:   'Hey,',
      dusk:  'Evening,',
    })[tod] || 'Hey,';
  }
  function applyWorld() {
    const tod = timeOfDay();
    const bg = $('#world-bg');
    if (!bg) return;
    bg.className = 'world-bg';
    if (tod !== 'day') bg.classList.add('world-bg--' + tod);
  }

  // ----- STARS -----
  function drawStars(n = 30) {
    const wrap = $('#stars');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2 + 0.6;
      s.style.width = s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 65 + '%';
      s.style.animationDelay = (Math.random() * 4) + 's';
      wrap.appendChild(s);
    }
  }

  // ----- DATE HELPERS -----
  function ymd(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function prettyDate(d = new Date()) {
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase();
  }
  function shortDow(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short' }).toLowerCase().slice(0, 3);
  }

  // ----- ESCAPE HTML -----
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ----- TIME STRING -----
  function nowTime() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  return {
    $, $$, el,
    toast,
    openSheet, closeSheet,
    timeOfDay, greetFor, applyWorld,
    drawStars,
    ymd, prettyDate, shortDow, nowTime,
    esc,
  };
})();

window.UI = UI;
