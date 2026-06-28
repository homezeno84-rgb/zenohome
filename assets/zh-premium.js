/**
 * zh-premium.js
 * ZenoHome Luxury Shopify 2.0 Theme — Premium JS Module
 * Vanilla JS, ES5-compatible with progressive enhancement
 * No jQuery, no build tools required
 */

(function (window, document) {
  'use strict';

  // ─── Namespace ───────────────────────────────────────────────────────────────
  var ZHP = window.ZHP = window.ZHP || {};

  // ─── Utility helpers ─────────────────────────────────────────────────────────
  var Utils = {
    qs: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    qsa: function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); },
    on: function (el, ev, fn, opts) { el && el.addEventListener(ev, fn, opts || false); },
    off: function (el, ev, fn) { el && el.removeEventListener(ev, fn); },
    pad: function (n) { return n < 10 ? '0' + n : String(n); },
    debounce: function (fn, ms) {
      var t;
      return function () {
        var args = arguments, ctx = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(ctx, args); }, ms);
      };
    },
    fetch: function (url, opts) {
      opts = opts || {};
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(opts.method || 'GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (e) { resolve(xhr.responseText); }
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = function () { reject(new Error('Network error')); };
        xhr.send(opts.body ? JSON.stringify(opts.body) : null);
      });
    },
    lockScroll: function () {
      var scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      document.body.dataset.scrollLock = scrollY;
    },
    unlockScroll: function () {
      var scrollY = parseInt(document.body.dataset.scrollLock || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      delete document.body.dataset.scrollLock;
      window.scrollTo(0, scrollY);
    },
    moneyFormat: function (cents) {
      return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    isRTL: function () {
      return document.documentElement.getAttribute('dir') === 'rtl';
    }
  };

  // ─── 1. HeroSlider ───────────────────────────────────────────────────────────
  ZHP.HeroSlider = (function () {
    var instances = [];

    function HeroSlider(el) {
      this.el = el;
      this.animation = el.getAttribute('data-animation') || 'fade';
      this.autoplay = el.getAttribute('data-autoplay') !== 'false';
      this.speed = parseInt(el.getAttribute('data-speed') || '5000', 10);
      this.slides = Utils.qsa('.zh-slide', el);
      this.dots = Utils.qsa('[data-zh-dot]', el);
      this.prevBtn = Utils.qs('[data-zh-prev]', el);
      this.nextBtn = Utils.qs('[data-zh-next]', el);
      this.current = 0;
      this.timer = null;
      this.touching = false;
      this.touchStartX = 0;
      this._boundKey = this._onKey.bind(this);
      this._init();
    }

    HeroSlider.prototype._init = function () {
      var self = this;
      if (!this.slides.length) return;
      this.goTo(0);

      Utils.on(this.prevBtn, 'click', function () { self.prev(); });
      Utils.on(this.nextBtn, 'click', function () { self.next(); });

      this.dots.forEach(function (dot, i) {
        Utils.on(dot, 'click', function () { self.goTo(i); });
      });

      Utils.on(this.el, 'touchstart', function (e) {
        self.touching = true;
        self.touchStartX = e.touches[0].clientX;
      }, { passive: true });

      Utils.on(this.el, 'touchend', function (e) {
        if (!self.touching) return;
        self.touching = false;
        var dx = e.changedTouches[0].clientX - self.touchStartX;
        if (Math.abs(dx) > 50) { dx < 0 ? self.next() : self.prev(); }
      });

      Utils.on(this.el, 'mouseenter', function () { self._pause(); });
      Utils.on(this.el, 'mouseleave', function () { self._resume(); });

      this.el.setAttribute('tabindex', '0');
      Utils.on(this.el, 'focus', function () { document.addEventListener('keydown', self._boundKey); });
      Utils.on(this.el, 'blur', function () { document.removeEventListener('keydown', self._boundKey); });

      if (this.autoplay) this._resume();
    };

    HeroSlider.prototype._onKey = function (e) {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };

    HeroSlider.prototype.goTo = function (idx) {
      var self = this;
      var len = this.slides.length;
      this.current = (idx + len) % len;

      this.slides.forEach(function (slide, i) {
        var active = i === self.current;
        slide.classList.toggle('zh-slide--active', active);
        if (active) {
          Utils.qsa('.zh-anim', slide).forEach(function (el) {
            el.classList.remove('zh-visible');
            setTimeout(function () { el.classList.add('zh-visible'); }, 50);
          });
        }
      });

      this.dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === self.current);
        dot.setAttribute('aria-current', i === self.current ? 'true' : 'false');
      });
    };

    HeroSlider.prototype.prev = function () { this.goTo(this.current - 1); };
    HeroSlider.prototype.next = function () { this.goTo(this.current + 1); };

    HeroSlider.prototype._pause = function () { clearInterval(this.timer); this.timer = null; };

    HeroSlider.prototype._resume = function () {
      if (!this.autoplay) return;
      var self = this;
      this._pause();
      this.timer = setInterval(function () { self.next(); }, self.speed);
    };

    HeroSlider.prototype.destroy = function () {
      this._pause();
      document.removeEventListener('keydown', this._boundKey);
    };

    return {
      init: function (root) {
        Utils.qsa('[data-zh-hero-slider]', root).forEach(function (el) {
          if (el._zhSlider) el._zhSlider.destroy();
          el._zhSlider = new HeroSlider(el);
          instances.push(el._zhSlider);
        });
      },
      destroy: function (root) {
        Utils.qsa('[data-zh-hero-slider]', root).forEach(function (el) {
          if (el._zhSlider) { el._zhSlider.destroy(); el._zhSlider = null; }
        });
      }
    };
  }());

  // ─── 2. ProductCard ──────────────────────────────────────────────────────────
  ZHP.ProductCard = (function () {
    var WL_KEY = 'zh_wishlist';

    function getWishlist() {
      try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch (e) { return []; }
    }

    function saveWishlist(arr) {
      try { localStorage.setItem(WL_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function restoreWishlistStates() {
      var wl = getWishlist();
      Utils.qsa('[data-zh-wishlist]').forEach(function (btn) {
        var id = btn.getAttribute('data-product-id');
        if (id && wl.indexOf(id) !== -1) btn.setAttribute('data-active', 'true');
      });
    }

    function bindQuickAdd(btn) {
      Utils.on(btn, 'click', function () {
        var variantId = btn.getAttribute('data-variant-id');
        if (!variantId) return;
        btn.classList.add('zh-loading');
        btn.disabled = true;
        Utils.fetch('/cart/add.json', {
          method: 'POST',
          body: { items: [{ id: parseInt(variantId, 10), quantity: 1 }] }
        }).then(function (cart) {
          btn.classList.remove('zh-loading');
          btn.disabled = false;
          document.dispatchEvent(new CustomEvent('zh:cart:updated', { detail: cart }));
          ZHP.toast('Item added to cart', 'success');
        }).catch(function () {
          btn.classList.remove('zh-loading');
          btn.disabled = false;
          var orig = btn.textContent;
          btn.textContent = 'Error — try again';
          btn.classList.add('zh-error');
          setTimeout(function () {
            btn.textContent = orig;
            btn.classList.remove('zh-error');
          }, 2500);
        });
      });
    }

    function bindWishlist(btn) {
      Utils.on(btn, 'click', function () {
        var id = btn.getAttribute('data-product-id');
        if (!id) return;
        var wl = getWishlist();
        var idx = wl.indexOf(id);
        if (idx === -1) {
          wl.push(id);
          btn.setAttribute('data-active', 'true');
          ZHP.toast('Added to wishlist', 'info');
        } else {
          wl.splice(idx, 1);
          btn.removeAttribute('data-active');
          ZHP.toast('Removed from wishlist', 'info');
        }
        saveWishlist(wl);
      });
    }

    return {
      init: function (root) {
        Utils.qsa('[data-zh-quick-add]', root).forEach(bindQuickAdd);
        Utils.qsa('[data-zh-wishlist]', root).forEach(bindWishlist);
      },
      restoreWishlist: restoreWishlistStates,
      getWishlist: getWishlist
    };
  }());

  // ─── 3. CartDrawer ───────────────────────────────────────────────────────────
  ZHP.CartDrawer = (function () {
    var drawer, overlay, itemsEl, subtotalEl;
    var isOpen = false;

    function renderItems(cart) {
      if (!itemsEl) return;
      itemsEl.innerHTML = '';

      var counts = Utils.qsa('#zh-cart-count');
      counts.forEach(function (el) { el.textContent = cart.item_count; });

      if (subtotalEl) subtotalEl.textContent = Utils.moneyFormat(cart.total_price);

      if (!cart.items || !cart.items.length) {
        itemsEl.innerHTML = '<p class="zh-cart-empty">Your cart is empty.</p>';
        return;
      }

      cart.items.forEach(function (item) {
        var li = document.createElement('div');
        li.className = 'zh-cart-item';
        li.setAttribute('data-line', item.key);
        li.innerHTML =
          '<img src="' + (item.image || '') + '" alt="' + item.title + '" class="zh-cart-item__img">' +
          '<div class="zh-cart-item__info">' +
            '<p class="zh-cart-item__title">' + item.product_title + '</p>' +
            '<p class="zh-cart-item__variant">' + (item.variant_title || '') + '</p>' +
            '<p class="zh-cart-item__price">' + Utils.moneyFormat(item.final_line_price) + '</p>' +
            '<div class="zh-cart-item__qty">' +
              '<button data-zh-cart-qty-down data-key="' + item.key + '" data-qty="' + item.quantity + '" aria-label="Decrease quantity">−</button>' +
              '<span>' + item.quantity + '</span>' +
              '<button data-zh-cart-qty-up data-key="' + item.key + '" data-qty="' + item.quantity + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button data-zh-cart-remove data-key="' + item.key + '" class="zh-cart-item__remove">Remove</button>' +
          '</div>';
        itemsEl.appendChild(li);
      });

      Utils.qsa('[data-zh-cart-qty-up]', itemsEl).forEach(function (btn) {
        Utils.on(btn, 'click', function () {
          changeQty(btn.getAttribute('data-key'), parseInt(btn.getAttribute('data-qty'), 10) + 1);
        });
      });

      Utils.qsa('[data-zh-cart-qty-down]', itemsEl).forEach(function (btn) {
        Utils.on(btn, 'click', function () {
          var q = parseInt(btn.getAttribute('data-qty'), 10) - 1;
          changeQty(btn.getAttribute('data-key'), Math.max(q, 0));
        });
      });

      Utils.qsa('[data-zh-cart-remove]', itemsEl).forEach(function (btn) {
        Utils.on(btn, 'click', function () {
          changeQty(btn.getAttribute('data-key'), 0);
        });
      });
    }

    function changeQty(key, qty) {
      Utils.fetch('/cart/change.json', {
        method: 'POST',
        body: { id: key, quantity: qty }
      }).then(function (cart) {
        renderItems(cart);
        document.dispatchEvent(new CustomEvent('zh:cart:updated', { detail: cart }));
      }).catch(function () { ZHP.toast('Could not update cart', 'error'); });
    }

    function fetchCart() {
      Utils.fetch('/cart.json').then(renderItems).catch(function () {
        if (itemsEl) itemsEl.innerHTML = '<p>Unable to load cart.</p>';
      });
    }

    function open() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      if (overlay) overlay.classList.add('zh-overlay--active');
      Utils.lockScroll();
      isOpen = true;
      fetchCart();
      var firstFocusable = drawer.querySelector('button, [href], input, [tabindex]');
      if (firstFocusable) firstFocusable.focus();
    }

    function close() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('zh-overlay--active');
      Utils.unlockScroll();
      isOpen = false;
    }

    function init() {
      drawer = Utils.qs('#zh-cart-drawer');
      overlay = Utils.qs('#zh-cart-overlay');
      itemsEl = Utils.qs('#zh-cart-items');
      subtotalEl = Utils.qs('#zh-cart-subtotal');

      Utils.qsa('[data-zh-open-cart]').forEach(function (el) {
        Utils.on(el, 'click', function (e) { e.preventDefault(); open(); });
      });

      if (overlay) Utils.on(overlay, 'click', close);

      var closeBtn = Utils.qs('[data-zh-cart-close]');
      if (closeBtn) Utils.on(closeBtn, 'click', close);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) close();
      });

      document.addEventListener('zh:cart:updated', function (e) {
        var counts = Utils.qsa('#zh-cart-count');
        if (e.detail && e.detail.item_count !== undefined) {
          counts.forEach(function (el) { el.textContent = e.detail.item_count; });
        }
        if (isOpen) fetchCart();
      });
    }

    return { init: init, open: open, close: close, refresh: fetchCart };
  }());

  // ─── 4. MobileNav ────────────────────────────────────────────────────────────
  ZHP.MobileNav = (function () {
    var nav, overlay;
    var focusableSelectors = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var _trapFn;

    function getFocusables() {
      return Utils.qsa(focusableSelectors, nav).filter(function (el) {
        return !el.closest('[hidden]') && el.offsetParent !== null;
      });
    }

    function trapFocus(e) {
      var focusables = getFocusables();
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === 'Escape') close();
    }

    function open() {
      if (!nav) return;
      nav.classList.add('is-open');
      if (overlay) overlay.classList.add('zh-overlay--active');
      Utils.lockScroll();
      _trapFn = trapFocus;
      document.addEventListener('keydown', _trapFn);
      var firstFocusable = getFocusables()[0];
      if (firstFocusable) setTimeout(function () { firstFocusable.focus(); }, 50);
    }

    function close() {
      if (!nav) return;
      nav.classList.remove('is-open');
      if (overlay) overlay.classList.remove('zh-overlay--active');
      Utils.unlockScroll();
      if (_trapFn) { document.removeEventListener('keydown', _trapFn); _trapFn = null; }
    }

    function init() {
      nav = Utils.qs('#zh-mobile-nav');
      overlay = Utils.qs('#zh-mobile-nav-overlay') || Utils.qs('#zh-cart-overlay');

      Utils.qsa('[data-zh-menu-toggle]').forEach(function (btn) {
        Utils.on(btn, 'click', function () {
          nav && nav.classList.contains('is-open') ? close() : open();
        });
      });

      Utils.qsa('[data-zh-submenu-toggle]').forEach(function (btn) {
        Utils.on(btn, 'click', function (e) {
          e.preventDefault();
          var li = btn.closest('li.has-children');
          if (li) li.classList.toggle('open');
        });
      });

      var closeBtn = Utils.qs('[data-zh-nav-close]');
      if (closeBtn) Utils.on(closeBtn, 'click', close);
      if (overlay) Utils.on(overlay, 'click', close);
    }

    return { init: init, open: open, close: close };
  }());

  // ─── 5. MegaMenu ─────────────────────────────────────────────────────────────
  ZHP.MegaMenu = (function () {
    var hideTimers = {};

    function showPanel(trigger, panel) {
      clearTimeout(hideTimers[trigger.dataset.zhMegaTrigger]);
      panel.removeAttribute('aria-hidden');
      panel.style.display = 'block';
      trigger.setAttribute('aria-expanded', 'true');
    }

    function hidePanel(trigger, panel) {
      var key = trigger.dataset.zhMegaTrigger;
      hideTimers[key] = setTimeout(function () {
        panel.setAttribute('aria-hidden', 'true');
        panel.style.display = 'none';
        trigger.setAttribute('aria-expanded', 'false');
      }, 200);
    }

    function init() {
      Utils.qsa('[data-zh-mega-trigger]').forEach(function (trigger) {
        var panel = trigger.querySelector('[data-zh-mega-panel]');
        if (!panel) return;
        panel.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');

        Utils.on(trigger, 'mouseenter', function () { showPanel(trigger, panel); });
        Utils.on(trigger, 'mouseleave', function () { hidePanel(trigger, panel); });
        Utils.on(panel, 'mouseenter', function () { showPanel(trigger, panel); });
        Utils.on(panel, 'mouseleave', function () { hidePanel(trigger, panel); });
        Utils.on(trigger, 'focusin', function () { showPanel(trigger, panel); });

        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { hidePanel(trigger, panel); trigger.focus(); }
        });
      });
    }

    return { init: init };
  }());

  // ─── 6. StickyHeader ─────────────────────────────────────────────────────────
  ZHP.StickyHeader = (function () {
    var header;
    var scrolled = false;

    function onScroll() {
      var shouldScroll = window.scrollY > 80;
      if (shouldScroll !== scrolled) {
        scrolled = shouldScroll;
        header && header.classList.toggle('is-scrolled', scrolled);
      }
    }

    function init() {
      header = Utils.qs('.zh-header');
      if (!header) return;

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      var hero = Utils.qs('.zh-hero, [data-zh-hero]');
      if (hero && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          var intersecting = entries[0].isIntersecting;
          header.classList.toggle('zh-header--transparent', intersecting);
          header.classList.toggle('zh-header--solid', !intersecting);
        }, { threshold: 0.1 });
        io.observe(hero);
      }
    }

    return { init: init };
  }());

  // ─── 7. SearchPanel ──────────────────────────────────────────────────────────
  ZHP.SearchPanel = (function () {
    var panel, input, results;
    var isOpen = false;

    var doSearch = Utils.debounce(function (q) {
      if (!q || q.length < 2) { results && (results.innerHTML = ''); return; }
      Utils.fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=5')
        .then(function (data) {
          if (!results) return;
          results.innerHTML = '';
          var products = data && data.resources && data.resources.results && data.resources.results.products || [];
          if (!products.length) {
            results.innerHTML = '<p class="zh-search-no-results">No results found.</p>';
            return;
          }
          var ul = document.createElement('ul');
          ul.className = 'zh-search-suggestions';
          products.slice(0, 5).forEach(function (p) {
            var li = document.createElement('li');
            li.innerHTML =
              '<a href="' + p.url + '" class="zh-search-suggestion">' +
                (p.image ? '<img src="' + p.image + '" alt="' + p.title + '">' : '') +
                '<span class="zh-suggestion-title">' + p.title + '</span>' +
                (p.price ? '<span class="zh-suggestion-price">' + Utils.moneyFormat(p.price) + '</span>' : '') +
              '</a>';
            ul.appendChild(li);
          });
          results.appendChild(ul);
        }).catch(function () {});
    }, 300);

    function open() {
      if (!panel) return;
      panel.style.display = 'block';
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
      isOpen = true;
      if (input) setTimeout(function () { input.focus(); }, 150);
    }

    function close() {
      if (!panel) return;
      panel.classList.remove('is-open');
      isOpen = false;
      if (results) results.innerHTML = '';
    }

    function init() {
      panel = Utils.qs('#zh-search-panel');
      input = Utils.qs('#zh-search-input, [data-zh-search-input]');
      results = Utils.qs('#zh-search-results');

      Utils.qsa('[data-zh-search-toggle]').forEach(function (btn) {
        Utils.on(btn, 'click', function (e) {
          e.stopPropagation();
          isOpen ? close() : open();
        });
      });

      if (input) Utils.on(input, 'input', function () { doSearch(input.value.trim()); });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) close();
      });

      document.addEventListener('click', function (e) {
        if (isOpen && panel && !panel.contains(e.target)) close();
      });
    }

    return { init: init, open: open, close: close };
  }());

  // ─── 8. Countdown ────────────────────────────────────────────────────────────
  ZHP.Countdown = (function () {
    var timers = [];

    function CountdownInstance(el) {
      this.el = el;
      this.endTime = new Date(el.getAttribute('data-end-time')).getTime();
      this.daysEl = el.querySelector('[data-cd-days]');
      this.hoursEl = el.querySelector('[data-cd-hours]');
      this.minsEl = el.querySelector('[data-cd-minutes]');
      this.secsEl = el.querySelector('[data-cd-seconds]');
      this.interval = null;
      this._tick();
      this.interval = setInterval(this._tick.bind(this), 1000);
    }

    CountdownInstance.prototype._tick = function () {
      var now = Date.now();
      var diff = this.endTime - now;
      if (diff <= 0) {
        clearInterval(this.interval);
        this.el.classList.add('zh-countdown--ended');
        this._set(0, 0, 0, 0);
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);
      this._set(days, hours, mins, secs);
    };

    CountdownInstance.prototype._set = function (d, h, m, s) {
      if (this.daysEl) this.daysEl.textContent = Utils.pad(d);
      if (this.hoursEl) this.hoursEl.textContent = Utils.pad(h);
      if (this.minsEl) this.minsEl.textContent = Utils.pad(m);
      if (this.secsEl) this.secsEl.textContent = Utils.pad(s);
    };

    CountdownInstance.prototype.destroy = function () { clearInterval(this.interval); };

    return {
      init: function (root) {
        Utils.qsa('[data-zh-countdown]', root).forEach(function (el) {
          if (el._zhCountdown) el._zhCountdown.destroy();
          el._zhCountdown = new CountdownInstance(el);
          timers.push(el._zhCountdown);
        });
      },
      destroy: function (root) {
        Utils.qsa('[data-zh-countdown]', root).forEach(function (el) {
          if (el._zhCountdown) { el._zhCountdown.destroy(); el._zhCountdown = null; }
        });
      }
    };
  }());

  // ─── 9. FAQAccordion ─────────────────────────────────────────────────────────
  ZHP.FAQAccordion = (function () {
    function initFaq(container) {
      var items = Utils.qsa('.zh-faq-item', container);

      items.forEach(function (item) {
        var question = item.querySelector('.zh-faq-question');
        var answer = item.querySelector('.zh-faq-answer');
        if (!question || !answer) return;

        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.35s ease';

        Utils.on(question, 'click', function () {
          var opening = !item.classList.contains('is-open');

          // collapse all
          items.forEach(function (other) {
            if (other !== item) {
              other.classList.remove('is-open');
              var otherAnswer = other.querySelector('.zh-faq-answer');
              if (otherAnswer) otherAnswer.style.maxHeight = '0';
              var otherQ = other.querySelector('.zh-faq-question');
              if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
            }
          });

          if (opening) {
            item.classList.add('is-open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            question.setAttribute('aria-expanded', 'true');
          } else {
            item.classList.remove('is-open');
            answer.style.maxHeight = '0';
            question.setAttribute('aria-expanded', 'false');
          }
        });

        question.setAttribute('aria-expanded', 'false');
        var panelId = 'zh-faq-panel-' + Math.random().toString(36).slice(2);
        answer.id = panelId;
        question.setAttribute('aria-controls', panelId);
      });
    }

    return {
      init: function (root) {
        Utils.qsa('[data-zh-faq]', root).forEach(function (el) {
          if (!el._zhFaq) { el._zhFaq = true; initFaq(el); }
        });
      }
    };
  }());

  // ─── 10. BrandMarquee ────────────────────────────────────────────────────────
  ZHP.BrandMarquee = (function () {
    function initMarquee(el) {
      var track = el.querySelector('.zh-marquee-track');
      if (!track) return;
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      el.appendChild(clone);

      Utils.on(el, 'mouseenter', function () {
        track.style.animationPlayState = 'paused';
        clone.style.animationPlayState = 'paused';
      });
      Utils.on(el, 'mouseleave', function () {
        track.style.animationPlayState = 'running';
        clone.style.animationPlayState = 'running';
      });
    }

    return {
      init: function (root) {
        Utils.qsa('[data-zh-marquee]', root).forEach(function (el) {
          if (!el._zhMarquee) { el._zhMarquee = true; initMarquee(el); }
        });
      }
    };
  }());

  // ─── 11. NewsletterForm ──────────────────────────────────────────────────────
  ZHP.NewsletterForm = (function () {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function initForm(form) {
      Utils.on(form, 'submit', function (e) {
        e.preventDefault();
        var emailInput = form.querySelector('[type="email"]');
        var msgEl = form.querySelector('.zh-newsletter-msg');
        if (!emailInput) return;

        var email = emailInput.value.trim();
        if (!EMAIL_RE.test(email)) {
          if (msgEl) { msgEl.textContent = 'Please enter a valid email address.'; msgEl.className = 'zh-newsletter-msg zh-newsletter-msg--error'; }
          return;
        }

        var btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.classList.add('zh-loading'); }

        var action = form.getAttribute('action') || '/contact#contact_form';
        var formData = new FormData(form);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', action, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onload = function () {
          if (btn) { btn.disabled = false; btn.classList.remove('zh-loading'); }
          if (xhr.status >= 200 && xhr.status < 400) {
            if (msgEl) { msgEl.textContent = 'Thank you for subscribing!'; msgEl.className = 'zh-newsletter-msg zh-newsletter-msg--success'; }
            form.reset();
          } else {
            if (msgEl) { msgEl.textContent = 'Something went wrong. Please try again.'; msgEl.className = 'zh-newsletter-msg zh-newsletter-msg--error'; }
          }
        };
        xhr.onerror = function () {
          if (btn) { btn.disabled = false; btn.classList.remove('zh-loading'); }
          if (msgEl) { msgEl.textContent = 'Network error. Please try again.'; msgEl.className = 'zh-newsletter-msg zh-newsletter-msg--error'; }
        };
        xhr.send(formData);
      });
    }

    return {
      init: function (root) {
        Utils.qsa('[data-zh-newsletter]', root).forEach(function (el) {
          if (!el._zhNewsletter) { el._zhNewsletter = true; initForm(el); }
        });
      }
    };
  }());

  // ─── 12. TabSwitcher ─────────────────────────────────────────────────────────
  ZHP.TabSwitcher = (function () {
    function initTabs(container) {
      var tabs = Utils.qsa('[data-tab]', container);
      var panels = Utils.qsa('[data-tab-panel]', container);

      function activate(tabId) {
        tabs.forEach(function (tab) {
          var active = tab.getAttribute('data-tab') === tabId;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.classList.toggle('is-active', active);
        });
        panels.forEach(function (panel) {
          var active = panel.getAttribute('data-tab-panel') === tabId;
          panel.setAttribute('aria-hidden', active ? 'false' : 'true');
          panel.classList.toggle('is-active', active);
          if (active) {
            var rect = panel.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
      }

      tabs.forEach(function (tab) {
        tab.setAttribute('role', 'tab');
        Utils.on(tab, 'click', function () { activate(tab.getAttribute('data-tab')); });
      });

      panels.forEach(function (panel) { panel.setAttribute('role', 'tabpanel'); });

      if (tabs.length) activate(tabs[0].getAttribute('data-tab'));
    }

    return {
      init: function (root) {
        Utils.qsa('[data-zh-tabs]', root).forEach(function (el) {
          if (!el._zhTabs) { el._zhTabs = true; initTabs(el); }
        });
      }
    };
  }());

  // ─── 13. AnimateOnScroll ─────────────────────────────────────────────────────
  ZHP.AnimateOnScroll = (function () {
    var io;

    function init(root) {
      if (!('IntersectionObserver' in window)) {
        Utils.qsa('.zh-anim', root).forEach(function (el) { el.classList.add('zh-visible'); });
        return;
      }

      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var delay = el.getAttribute('data-delay');
              if (delay) el.style.transitionDelay = delay;
              el.classList.add('zh-visible');
              io.unobserve(el);
            }
          });
        }, { threshold: 0.12 });
      }

      Utils.qsa('.zh-anim', root).forEach(function (el) {
        if (!el._zhAos) { el._zhAos = true; io.observe(el); }
      });
    }

    return { init: init };
  }());

  // ─── 14. RecentlyViewed ──────────────────────────────────────────────────────
  ZHP.RecentlyViewed = (function () {
    var RV_KEY = 'zh_rv';
    var MAX = 20;

    function getAll() {
      try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch (e) { return []; }
    }

    function save(arr) {
      try { localStorage.setItem(RV_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function add(handle, title, price, imageUrl, url) {
      if (!handle) return;
      var arr = getAll().filter(function (p) { return p.handle !== handle; });
      arr.unshift({ handle: handle, title: title, price: price, imageUrl: imageUrl, url: url });
      if (arr.length > MAX) arr = arr.slice(0, MAX);
      save(arr);
    }

    function get(limit) {
      var arr = getAll();
      return limit ? arr.slice(0, limit) : arr;
    }

    function initFromPage() {
      var body = document.body;
      var handle = body.getAttribute('data-product-handle');
      if (!handle) return;
      add(
        handle,
        body.getAttribute('data-product-title') || '',
        parseInt(body.getAttribute('data-product-price') || '0', 10),
        body.getAttribute('data-product-image') || '',
        window.location.pathname
      );
    }

    return { add: add, get: get, init: initFromPage };
  }());

  // ─── 15. NotificationToast ───────────────────────────────────────────────────
  ZHP.toast = (function () {
    var container;

    var colors = { success: '#2d6a4f', error: '#c62828', info: '#b5860c' };

    function getContainer() {
      if (container) return container;
      container = document.createElement('div');
      container.id = 'zh-toast-container';
      var rtl = Utils.isRTL();
      container.style.cssText = [
        'position:fixed',
        'bottom:24px',
        rtl ? 'left:24px' : 'right:24px',
        'z-index:9999',
        'display:flex',
        'flex-direction:column',
        'gap:8px',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(container);
      return container;
    }

    return function toast(message, type) {
      type = type || 'success';
      var c = getContainer();
      var el = document.createElement('div');
      el.className = 'zh-toast zh-toast--' + type;
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = [
        'background:' + (colors[type] || colors.success),
        'color:#fff',
        'padding:12px 20px',
        'border-radius:6px',
        'font-size:14px',
        'font-weight:500',
        'box-shadow:0 4px 16px rgba(0,0,0,0.18)',
        'pointer-events:auto',
        'cursor:pointer',
        'opacity:0',
        'transform:translateY(10px)',
        'transition:opacity 0.25s,transform 0.25s'
      ].join(';');
      el.textContent = message;
      c.appendChild(el);

      requestAnimationFrame(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });

      function dismiss() {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
      }

      Utils.on(el, 'click', dismiss);
      setTimeout(dismiss, 3000);
    };
  }());

  // ─── 16. ImageZoom ───────────────────────────────────────────────────────────
  ZHP.ImageZoom = (function () {
    var lightbox, lightboxImg;

    function createLightbox() {
      lightbox = document.createElement('div');
      lightbox.id = 'zh-lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Product image zoom');
      lightbox.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:10000',
        'background:rgba(0,0,0,0.92)', 'display:none',
        'align-items:center', 'justify-content:center', 'cursor:zoom-out'
      ].join(';');

      lightboxImg = document.createElement('img');
      lightboxImg.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;';
      lightbox.appendChild(lightboxImg);

      var closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.setAttribute('aria-label', 'Close zoom');
      closeBtn.style.cssText = [
        'position:absolute', 'top:16px', 'right:24px',
        'background:none', 'border:none', 'color:#fff',
        'font-size:40px', 'cursor:pointer', 'line-height:1'
      ].join(';');
      lightbox.appendChild(closeBtn);
      document.body.appendChild(lightbox);

      function closeLB() {
        lightbox.style.display = 'none';
        Utils.unlockScroll();
      }
      Utils.on(lightbox, 'click', function (e) { if (e.target === lightbox || e.target === closeBtn) closeLB(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLB(); });
    }

    function openLightbox(src, alt) {
      if (!lightbox) createLightbox();
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.style.display = 'flex';
      Utils.lockScroll();
      lightboxImg.focus && lightboxImg.focus();
    }

    function initMagnifier(img) {
      var lens = document.createElement('div');
      lens.className = 'zh-zoom-lens';
      lens.style.cssText = [
        'position:absolute', 'border:2px solid #ccc',
        'width:80px', 'height:80px', 'border-radius:50%',
        'pointer-events:none', 'display:none',
        'background-repeat:no-repeat', 'z-index:10'
      ].join(';');

      var wrapper = img.parentElement;
      if (wrapper) wrapper.style.position = 'relative';
      if (wrapper) wrapper.appendChild(lens);

      img.addEventListener('mousemove', function (e) {
        var rect = img.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var bw = lens.offsetWidth / 2;
        var bh = lens.offsetHeight / 2;
        var lx = Math.max(bw, Math.min(x, img.offsetWidth - bw));
        var ly = Math.max(bh, Math.min(y, img.offsetHeight - bh));
        lens.style.left = (lx - bw) + 'px';
        lens.style.top = (ly - bh) + 'px';
        var zoomFactor = 2.5;
        lens.style.backgroundImage = 'url(' + img.src + ')';
        lens.style.backgroundSize = (img.offsetWidth * zoomFactor) + 'px ' + (img.offsetHeight * zoomFactor) + 'px';
        lens.style.backgroundPosition = '-' + (lx * zoomFactor - bw) + 'px -' + (ly * zoomFactor - bh) + 'px';
      });

      img.addEventListener('mouseenter', function () { lens.style.display = 'block'; });
      img.addEventListener('mouseleave', function () { lens.style.display = 'none'; });
    }

    function init(root) {
      Utils.qsa('.zh-product-main-img', root).forEach(function (img) {
        if (img._zhZoom) return;
        img._zhZoom = true;
        img.style.cursor = 'zoom-in';
        if (window.matchMedia('(hover: hover)').matches) {
          initMagnifier(img);
        }
        Utils.on(img, 'click', function () {
          openLightbox(img.getAttribute('data-zoom') || img.src, img.alt);
        });
      });
    }

    return { init: init, open: openLightbox };
  }());

  // ─── 17. Init & Lifecycle ────────────────────────────────────────────────────
  function init(root) {
    root = root || document;
    ZHP.HeroSlider.init(root);
    ZHP.ProductCard.init(root);
    ZHP.MegaMenu.init();
    ZHP.FAQAccordion.init(root);
    ZHP.Countdown.init(root);
    ZHP.BrandMarquee.init(root);
    ZHP.TabSwitcher.init(root);
    ZHP.AnimateOnScroll.init(root);
    ZHP.NewsletterForm.init(root);
    ZHP.ImageZoom.init(root);
    ZHP.SearchPanel.init();
  }

  document.addEventListener('DOMContentLoaded', function () {
    init();
    ZHP.StickyHeader.init();
    ZHP.MobileNav.init();
    ZHP.CartDrawer.init();
    ZHP.ProductCard.restoreWishlist();
    ZHP.RecentlyViewed.init();
  });

  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });

  document.addEventListener('shopify:section:unload', function (e) {
    ZHP.HeroSlider.destroy(e.target);
    ZHP.Countdown.destroy(e.target);
  });

  // ─── Expose init for external use ────────────────────────────────────────────
  ZHP.init = init;

}(window, document));
