/* ==========================================================================
   Easy-RNA-seq 官网 · 交互脚本（无外部依赖）
   ========================================================================== */
(function () {
  'use strict';

  var THEME_KEY = 'ernaseq-theme';
  var doc = document.documentElement;

  /* ---------- 主题（护眼模式） ---------- */
  function setTheme(mode, persist) {
    doc.setAttribute('data-theme', mode);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
      btn.setAttribute('title', mode === 'dark' ? '切换到浅色模式' : '切换到护眼模式');
    });
  }

  function queryTheme() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('theme'); } catch (e) {}
    return (q === 'dark' || q === 'light') ? q : null;
  }

  function currentTheme() {
    var q = queryTheme();
    if (q) return q;
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(currentTheme(), false);

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- 复制文本（兼容 file:// 打开） ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- 图片放大（软著证书等） ---------- */
  var lightbox = null;
  var lightboxOpener = null;

  function buildLightbox() {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<button class="lightbox__close" type="button" data-lightbox-close aria-label="关闭放大图片">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      '<div class="lightbox__inner">' +
        '<img class="lightbox__img" alt="">' +
        '<p class="lightbox__cap"></p>' +
      '</div>';
    document.body.appendChild(box);
    return box;
  }

  function openLightbox(src, caption, opener) {
    if (!lightbox) lightbox = buildLightbox();
    var img = lightbox.querySelector('.lightbox__img');
    img.setAttribute('src', src);
    img.setAttribute('alt', caption || '放大查看的图片');
    lightbox.querySelector('.lightbox__cap').textContent = caption || '';
    lightbox.classList.add('is-on');
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    lightboxOpener = opener || null;
    var close = lightbox.querySelector('[data-lightbox-close]');
    if (close) close.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('is-on')) return;
    lightbox.classList.remove('is-on');
    lightbox.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lightboxOpener && lightboxOpener.focus) lightboxOpener.focus();
    lightboxOpener = null;
  }

  /* ---------- 全局点击代理 ---------- */
  document.addEventListener('click', function (ev) {
    if (lightbox && lightbox.classList.contains('is-on') &&
        (ev.target === lightbox || ev.target.closest('[data-lightbox-close]'))) {
      closeLightbox();
      return;
    }

    var t = ev.target.closest('[data-zoom]');
    if (t) {
      ev.preventDefault();
      var inner = t.querySelector('img');
      openLightbox(
        t.getAttribute('data-zoom'),
        t.getAttribute('data-zoom-title') || (inner ? inner.getAttribute('alt') : ''),
        t
      );
      return;
    }

    t = ev.target.closest('[data-theme-toggle]');
    if (t) {
      setTheme(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
      return;
    }

    t = ev.target.closest('[data-copy]');
    if (t) {
      ev.preventDefault();
      var value = t.getAttribute('data-copy');
      var label = t.getAttribute('data-copy-label') || '内容';
      copyText(value).then(function () {
        toast(label + '已复制到剪贴板');
      }).catch(function () {
        toast('复制失败，请手动选择：' + value);
      });
      return;
    }

    t = ev.target.closest('[data-drawer-toggle]');
    if (t) {
      var drawer = document.getElementById('drawer');
      if (!drawer) return;
      var open = drawer.classList.toggle('is-open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    t = ev.target.closest('[data-tab]');
    if (t) {
      var group = t.closest('[data-tabgroup]');
      if (!group) return;
      var name = t.getAttribute('data-tab');
      group.querySelectorAll('[data-tab]').forEach(function (b) {
        b.setAttribute('aria-selected', b === t ? 'true' : 'false');
      });
      var scope = group.getAttribute('data-tabgroup');
      document.querySelectorAll('[data-panel][data-scope="' + scope + '"]').forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== name;
      });
      return;
    }

    t = ev.target.closest('[data-totop]');
    if (t) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 点击抽屉里的链接后自动收起
    if (ev.target.closest('#drawer a')) {
      var d = document.getElementById('drawer');
      var tg = document.querySelector('[data-drawer-toggle]');
      if (d) d.classList.remove('is-open');
      if (tg) tg.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (lightbox && lightbox.classList.contains('is-on')) {
      closeLightbox();
      return;
    }
    var d = document.getElementById('drawer');
    if (d && d.classList.contains('is-open')) {
      d.classList.remove('is-open');
      var tg = document.querySelector('[data-drawer-toggle]');
      if (tg) tg.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- 滚动动效 ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 导航高亮 / 返回顶部 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"], .drawer a[href^="#"]'));
  var toTop = document.querySelector('[data-totop]');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (toTop) toTop.classList.toggle('is-on', y > 640);

    if (sections.length && navLinks.length) {
      var probe = y + 120;
      var activeId = '';
      sections.forEach(function (s) {
        if (s.offsetTop <= probe) activeId = s.id;
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', activeId && a.getAttribute('href') === '#' + activeId);
      });
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- 页脚年份 ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
