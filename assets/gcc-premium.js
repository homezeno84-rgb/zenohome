/*!
 * GCC Premium JS — Zenohome Saudi Arabia & GCC
 * Sticky ATC · Shipping Progress · RTL · Reveal Animations · Wishlist · Tabs
 */
(function () {
  'use strict';

  /* ────────────────────────────────────────────
     Utility: run after DOM ready
  ──────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  /* ────────────────────────────────────────────
     1. RTL DETECTION & BODY CLASS
  ──────────────────────────────────────────── */
  function initRTL() {
    var isRTL = document.documentElement.getAttribute('dir') === 'rtl'
             || document.documentElement.lang === 'ar'
             || document.body.classList.contains('rtl_true');

    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.setAttribute('dir', 'rtl');
    }
  }

  /* ────────────────────────────────────────────
     2. STICKY ATC — Product Page
  ──────────────────────────────────────────── */
  function initStickyATC() {
    var bar = document.querySelector('.gcc-sticky-atc');
    if (!bar) return;

    var trigger = document.querySelector('.t4s-pr-addtocart, [data-action-atc]');
    if (!trigger) return;

    function onScroll() {
      var rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0) {
        bar.classList.add('is-visible');
      } else {
        bar.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* Proxy click to real ATC */
    var barBtn = bar.querySelector('.gcc-sticky-atc__btn');
    if (barBtn) {
      barBtn.addEventListener('click', function () {
        trigger.click();
      });
    }
  }

  /* ────────────────────────────────────────────
     3. SHIPPING PROGRESS BAR
  ──────────────────────────────────────────── */
  function initShippingBar() {
    var bar = document.querySelector('.gcc-shipping-progress__fill');
    var textEl = document.querySelector('.gcc-shipping-bar-amount');
    if (!bar) return;

    var threshold = parseInt(bar.closest('[data-threshold]')
      ? bar.closest('[data-threshold]').dataset.threshold
      : 30000, 10); // default 300 SAR in cents

    function update(total) {
      var pct = Math.min(100, Math.round((total / threshold) * 100));
      bar.style.width = pct + '%';

      if (textEl) {
        var remaining = Math.max(0, threshold - total);
        if (remaining === 0) {
          textEl.innerHTML = window.gccI18n
            ? window.gccI18n.free_shipping_reached
            : '🎉 Free shipping unlocked!';
        } else {
          var formatted = (remaining / 100).toFixed(0);
          textEl.innerHTML = (window.gccI18n
            ? window.gccI18n.free_shipping_remaining
            : 'Add <span>' + formatted + ' SAR</span> for free shipping'
          ).replace('{amount}', '<span>' + formatted + ' SAR</span>');
        }
      }
    }

    /* Read current cart total from Shopify cart object if available */
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      /* noop — relies on cart:update event */
    }

    /* Listen for cart updates */
    document.addEventListener('cart:updated', function (e) {
      if (e.detail && e.detail.cart) { update(e.detail.cart.total_price); }
    });

    /* Try fetch on load */
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) { update(cart.total_price); })
      .catch(function () {});
  }

  /* ────────────────────────────────────────────
     4. SCROLL REVEAL ANIMATIONS
  ──────────────────────────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll('[data-gcc-reveal], [data-gcc-reveal-stagger]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ────────────────────────────────────────────
     5. PRODUCT TABS (accordion on mobile)
  ──────────────────────────────────────────── */
  function initProductTabs() {
    var tabBtns = document.querySelectorAll('.gcc-tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.gcc-tabs');
        if (!group) return;

        group.querySelectorAll('.gcc-tab-btn').forEach(function (b) {
          b.classList.remove('is--active');
          b.setAttribute('aria-selected', 'false');
        });
        group.querySelectorAll('.gcc-tab-panel').forEach(function (p) {
          p.hidden = true;
        });

        btn.classList.add('is--active');
        btn.setAttribute('aria-selected', 'true');
        var target = group.querySelector(btn.dataset.tab);
        if (target) { target.hidden = false; }
      });
    });
  }

  /* ────────────────────────────────────────────
     6. FLASH DEALS COUNTDOWN
  ──────────────────────────────────────────── */
  function initCountdown() {
    var countdowns = document.querySelectorAll('[data-gcc-countdown]');
    countdowns.forEach(function (el) {
      var endTime = new Date(el.dataset.gccCountdown).getTime();
      if (isNaN(endTime)) return;

      var dEl = el.querySelector('[data-gcc-days]');
      var hEl = el.querySelector('[data-gcc-hours]');
      var mEl = el.querySelector('[data-gcc-minutes]');
      var sEl = el.querySelector('[data-gcc-seconds]');

      function pad(n) { return n < 10 ? '0' + n : '' + n; }

      function tick() {
        var now  = Date.now();
        var diff = Math.max(0, endTime - now);
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        if (dEl) dEl.textContent = pad(d);
        if (hEl) hEl.textContent = pad(h);
        if (mEl) mEl.textContent = pad(m);
        if (sEl) sEl.textContent = pad(s);
        if (diff <= 0) { clearInterval(timer); }
      }

      tick();
      var timer = setInterval(tick, 1000);
    });
  }

  /* ────────────────────────────────────────────
     7. MOBILE NAV IMPROVEMENTS
  ──────────────────────────────────────────── */
  function initMobileNav() {
    /* Ensure minimum 44px tap targets */
    var navLinks = document.querySelectorAll('.t4s-push-menu a, .t4s-sidebar-menu a');
    navLinks.forEach(function (link) {
      if (link.offsetHeight < 44) {
        link.style.minHeight = '44px';
        link.style.display   = 'flex';
        link.style.alignItems = 'center';
      }
    });
  }

  /* ────────────────────────────────────────────
     8. QUICK WISHLIST HEART ANIMATION
  ──────────────────────────────────────────── */
  function initWishlist() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wishlist-btn], .t4s-btn-wishlist');
      if (!btn) return;
      btn.classList.toggle('is--active');
    });
  }

  /* ────────────────────────────────────────────
     9. IMAGE LAZY LOAD FALLBACK
  ──────────────────────────────────────────── */
  function initLazyImages() {
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[data-src]').forEach(function (img) {
        if (!img.src && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
    }
  }

  /* ────────────────────────────────────────────
     10. STRUCTURED DATA (JSON-LD)
  ──────────────────────────────────────────── */
  function injectOrganizationSchema() {
    if (document.querySelector('script[data-gcc-schema]')) return;
    var el = document.getElementById('gcc-schema-org');
    if (!el) return;
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-gcc-schema', '1');
    script.textContent = el.textContent;
    document.head.appendChild(script);
  }

  /* ────────────────────────────────────────────
     11. CLS PREVENTION — reserve space for images
  ──────────────────────────────────────────── */
  function fixImageCLS() {
    document.querySelectorAll('img[width][height]').forEach(function (img) {
      if (!img.style.aspectRatio) {
        img.style.aspectRatio = img.width + ' / ' + img.height;
      }
    });
  }

  /* ────────────────────────────────────────────
     12. HEADER SCROLL BEHAVIOR
  ──────────────────────────────────────────── */
  function initHeaderScroll() {
    var header = document.querySelector('.t4s-section-header');
    if (!header) return;

    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 100) {
        header.classList.add('is-header--stuck');
      } else {
        header.classList.remove('is-header--stuck');
      }
      lastY = y;
    }, { passive: true });
  }

  /* ────────────────────────────────────────────
     INIT
  ──────────────────────────────────────────── */
  ready(function () {
    initRTL();
    initStickyATC();
    initShippingBar();
    initReveal();
    initProductTabs();
    initCountdown();
    initMobileNav();
    initWishlist();
    initLazyImages();
    injectOrganizationSchema();
    fixImageCLS();
    initHeaderScroll();
  });

})();
