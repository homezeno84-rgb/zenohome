/*=============================================================================
  ZH-SECTIONS.JS — Shared JS utilities for ZenoHome custom sections
  Luxury Home Decor | GCC Market
=============================================================================*/
(function() {
  'use strict';

  /* ─── Intersection Observer for animate-on-scroll ──────────────────── */
  window.ZH = window.ZH || {};

  ZH.initAnimations = function(root) {
    var els = (root || document).querySelectorAll('.zh-anim:not(.zh-visible)');
    if (!els.length) return;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('zh-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function(el) { obs.observe(el); });
  };
  document.addEventListener('DOMContentLoaded', function() { ZH.initAnimations(); });
  document.addEventListener('shopify:section:load', function(e) { ZH.initAnimations(e.target); });

  /* ─── Recently Viewed (localStorage) ────────────────────────────────── */
  ZH.RecentlyViewed = {
    KEY: 'zh_rv',
    MAX: 20,
    add: function(handle, title, price, imageUrl, url) {
      var list = this.get();
      list = list.filter(function(p) { return p.handle !== handle; });
      list.unshift({ handle: handle, title: title, price: price, imageUrl: imageUrl, url: url, ts: Date.now() });
      if (list.length > this.MAX) list = list.slice(0, this.MAX);
      try { localStorage.setItem(this.KEY, JSON.stringify(list)); } catch(e) {}
    },
    get: function(limit) {
      try {
        var raw = localStorage.getItem(this.KEY);
        var list = raw ? JSON.parse(raw) : [];
        return limit ? list.slice(0, limit) : list;
      } catch(e) { return []; }
    }
  };

  /* Track product page views */
  if (document.body.dataset.zhProductHandle) {
    var d = document.body.dataset;
    ZH.RecentlyViewed.add(
      d.zhProductHandle,
      d.zhProductTitle || '',
      d.zhProductPrice || '',
      d.zhProductImage || '',
      window.location.href
    );
  }

  /* ─── Countdown Timer ───────────────────────────────────────────────── */
  ZH.Countdown = function(el) {
    var endTime = new Date(el.dataset.endTime).getTime();
    var numEls = {
      d: el.querySelector('[data-cd-days]'),
      h: el.querySelector('[data-cd-hours]'),
      m: el.querySelector('[data-cd-minutes]'),
      s: el.querySelector('[data-cd-seconds]')
    };
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var now = Date.now(), diff = endTime - now;
      if (diff <= 0) { el.dispatchEvent(new CustomEvent('zh:countdown:ended')); return; }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (numEls.d) numEls.d.textContent = pad(d);
      if (numEls.h) numEls.h.textContent = pad(h);
      if (numEls.m) numEls.m.textContent = pad(m);
      if (numEls.s) numEls.s.textContent = pad(s);
    }
    tick();
    this._interval = setInterval(tick, 1000);
    this.destroy = function() { clearInterval(this._interval); };
  };

  /* ─── Hero Slider ────────────────────────────────────────────────────── */
  ZH.HeroSlider = function(el) {
    var slides = el.querySelectorAll('.zh-slide');
    var dots = el.querySelectorAll('.zh-slider-dot');
    var prevBtn = el.querySelector('.zh-slider-prev');
    var nextBtn = el.querySelector('.zh-slider-next');
    var current = 0;
    var total = slides.length;
    var autoplay = el.dataset.autoplay === 'true';
    var speed = parseInt(el.dataset.speed) || 5000;
    var animation = el.dataset.animation || 'fade';
    var timer = null;

    function goTo(idx) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (idx + total) % total;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function startAuto() { if (autoplay && total > 1) { timer = setInterval(next, speed); } }
    function stopAuto() { clearInterval(timer); }

    if (prevBtn) prevBtn.addEventListener('click', function() { stopAuto(); prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { stopAuto(); next(); startAuto(); });
    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() { stopAuto(); goTo(i); startAuto(); });
    });

    /* Swipe support */
    var touchX = 0;
    el.addEventListener('touchstart', function(e) { touchX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { stopAuto(); (dx < 0 ? next : prev)(); startAuto(); }
    });

    if (total > 0) { slides[0].classList.add('active'); if (dots[0]) dots[0].classList.add('active'); }
    startAuto();

    /* Keyboard */
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  };

  /* ─── Before/After Slider ────────────────────────────────────────────── */
  ZH.BeforeAfter = function(el) {
    var handle = el.querySelector('.zh-ba-handle');
    var after = el.querySelector('.zh-ba-after');
    var isDragging = false;

    function setPos(x) {
      var rect = el.getBoundingClientRect();
      var pct = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
    }

    handle.addEventListener('mousedown', function(e) { isDragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', function(e) { if (isDragging) setPos(e.clientX); });
    window.addEventListener('mouseup', function() { isDragging = false; });

    handle.addEventListener('touchstart', function(e) { isDragging = true; e.preventDefault(); }, { passive: false });
    window.addEventListener('touchmove', function(e) { if (isDragging) setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', function() { isDragging = false; });

    setPos(el.getBoundingClientRect().left + el.offsetWidth / 2);
  };

  /* ─── Accordion ─────────────────────────────────────────────────────── */
  ZH.Accordion = function(el) {
    var items = el.querySelectorAll('.zh-accordion-item');
    items.forEach(function(item) {
      var btn = item.querySelector('.zh-accordion-btn');
      var body = item.querySelector('.zh-accordion-body');
      if (!btn || !body) return;
      btn.addEventListener('click', function() {
        var isOpen = item.classList.contains('open');
        items.forEach(function(i) {
          i.classList.remove('open');
          var b = i.querySelector('.zh-accordion-body');
          if (b) b.style.maxHeight = '0';
        });
        if (!isOpen) {
          item.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  };

  /* ─── Tab switcher ───────────────────────────────────────────────────── */
  ZH.Tabs = function(el) {
    var tabs = el.querySelectorAll('[data-tab-trigger]');
    var panels = el.querySelectorAll('[data-tab-panel]');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.dataset.tabTrigger;
        tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tabTrigger === target); });
        panels.forEach(function(p) { p.classList.toggle('active', p.dataset.tabPanel === target); });
      });
    });
  };

  /* ─── Infinite marquee (brands) ─────────────────────────────────────── */
  ZH.Marquee = function(el) {
    var track = el.querySelector('.zh-marquee-track');
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    el.appendChild(clone);
  };

  /* ─── Init on section load ───────────────────────────────────────────── */
  function initSection(root) {
    root = root || document;
    root.querySelectorAll('[data-zh-hero-slider]').forEach(function(el) { new ZH.HeroSlider(el); });
    root.querySelectorAll('[data-zh-before-after]').forEach(function(el) { new ZH.BeforeAfter(el); });
    root.querySelectorAll('[data-zh-accordion]').forEach(function(el) { new ZH.Accordion(el); });
    root.querySelectorAll('[data-zh-tabs]').forEach(function(el) { new ZH.Tabs(el); });
    root.querySelectorAll('[data-zh-marquee]').forEach(function(el) { new ZH.Marquee(el); });
    root.querySelectorAll('[data-zh-countdown]').forEach(function(el) { new ZH.Countdown(el); });
  }

  document.addEventListener('DOMContentLoaded', function() { initSection(); });
  document.addEventListener('shopify:section:load', function(e) { initSection(e.target); });
})();
