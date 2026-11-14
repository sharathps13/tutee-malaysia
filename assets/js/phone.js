/* ---------- The phone layer (assets/css/phone.css) ----------
   Follows the Finland page's approach to small screens:
   1. one action bar at the bottom of the screen (Ask AI · Free evaluation · WhatsApp). It comes up once the first
      screen has scrolled away and steps aside at the enquiry form and the footer, where the floating WhatsApp and AI
      buttons return. The section dock is not shown on phones.
   2. the floating buttons and the bars get out of the way of the open menu and of the on-screen keyboard.
   The bar exists at every width but is only displayed on a phone (up to 760px wide, or held sideways: CSS), so
   turning the device or resizing just works. */
(function () {
  'use strict';
  var html = document.documentElement, phone = window.matchMedia('(max-width: 760px), (max-width: 960px) and (max-height: 520px) and (orientation: landscape)');
  var hero = document.getElementById('home'), begin = document.getElementById('begin'), nav = document.querySelector('.nav');
  var waEl = document.querySelector('a.wa'), waHref = waEl ? waEl.getAttribute('href') : 'https://wa.me/917010902329';
  var waSvg = waEl && waEl.querySelector('svg') ? waEl.querySelector('svg').outerHTML : '';
  var spark = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.3 6.7L21 11l-6.7 2.3L12 20l-2.3-6.7L3 11l6.7-2.3z"/></svg>';

  var bar = document.createElement('div'); bar.className = 'mbar'; bar.setAttribute('data-mbar', '');
  bar.innerHTML =
    '<button type="button" class="mbar-ai" data-mbar-ai aria-label="Ask Tutee Connect AI"><span class="mbar-orb" aria-hidden="true">' + spark + '</span><span class="mbar-ai-l">Ask AI</span></button>' +
    '<a class="mbar-cta" href="#begin">Free evaluation <span aria-hidden="true">→</span></a>' +
    '<a class="mbar-wa" href="' + waHref + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">' + waSvg + '</a>';
  document.body.appendChild(bar);
  bar.querySelector('[data-mbar-ai]').addEventListener('click', function () { if (window.TanyaAI) window.TanyaAI.open(); });

  var ticking = false;
  function update() {
    ticking = false;
    var past = !!hero && hero.getBoundingClientRect().bottom < 80;
    var on = phone.matches && past && (!begin || begin.getBoundingClientRect().top > window.innerHeight * .75) && !html.classList.contains('menu-on');
    bar.classList.toggle('is-on', on); html.classList.toggle('mbar-on', on); html.classList.toggle('past-hero', past);
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  if (phone.addEventListener) phone.addEventListener('change', ask); else if (phone.addListener) phone.addListener(ask);

  // the open menu covers the page: the floating buttons and the bar step back
  if (nav && 'MutationObserver' in window) {
    new MutationObserver(function () { html.classList.toggle('menu-on', nav.classList.contains('menu-open')); update(); }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  // while a field is being typed in (outside the chat, which fills the screen), nothing sits on the bottom edge
  function typing(el) { return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|range|button|submit|hidden)$/.test(el.type || '') && !el.closest('.ta-panel'); }
  document.addEventListener('focusin', function (e) { if (phone.matches && typing(e.target)) html.classList.add('kb-on'); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (!typing(document.activeElement)) html.classList.remove('kb-on'); }, 80); });

  update();
})();
