/* ==========================================================================
   萸老头 · 伏牛山道地药材  |  交互脚本
   纯原生 JS，无依赖（图标由本地 lucide.min.js 提供）
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     上线前请替换：收件邮箱与品牌名
     ------------------------------------------------------------------ */
  var CONTACT_EMAIL = 'yulaotou@example.com';
  var BRAND_NAME = '萸老头';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------- 图标 ---------------- */
  function paintIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /* ---------------- 提示条 ---------------- */
  var toastTimer = null;
  function toast(message) {
    var box = $('#toast');
    var text = $('#toast-text');
    if (!box || !text) { return; }
    text.textContent = message;
    box.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      box.classList.remove('is-visible');
    }, 3200);
  }

  /* ---------------- 头部：滚动阴影 + 移动导航 ---------------- */
  function initHeader() {
    var header = $('.site-header');
    var toggle = $('.nav-toggle');
    var mobileNav = $('#mobile-nav');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!toggle || !mobileNav) { return; }

    var closeNav = function () {
      mobileNav.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '打开导航');
    };

    toggle.addEventListener('click', function () {
      var isOpen = !mobileNav.hidden;
      if (isOpen) {
        closeNav();
      } else {
        mobileNav.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', '关闭导航');
      }
    });

    $$('a', mobileNav).forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) { closeNav(); }
    });
  }

  /* ---------------- 滚动出现动画 ---------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) { return; }

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 4, 3) * 70 + 'ms';
      observer.observe(el);
    });
  }

  /* ---------------- 数字滚动 ---------------- */
  function initCounters() {
    var targets = $$('.hero-stats .stat b, .metric b');
    if (!targets.length || !('IntersectionObserver' in window)) { return; }

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        observer.unobserve(entry.target);
        runCount(entry.target);
      });
    }, { threshold: 0.4 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  function runCount(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) { return; }
    var raw = node.nodeValue.trim();
    var target = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (!target || isNaN(target)) { return; }

    var duration = 1100;
    var start = null;

    function frame(now) {
      if (start === null) { start = now; }
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.nodeValue = String(Math.round(target * eased));
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        node.nodeValue = raw;
      }
    }
    node.nodeValue = '0';
    window.requestAnimationFrame(frame);
  }

  /* ---------------- 导航高亮 ---------------- */
  function initNavHighlight() {
    var links = $$('.main-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) { return; }

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) {
        map[id] = link;
        sections.push(section);
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (link) { link.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) { active.classList.add('is-active'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------------- 产品详情 ---------------- */
  var PRODUCTS = {
    cornus: {
      title: '野生山茱萸 · 萸肉',
      latin: 'Cornus officinalis · 山茱萸科',
      desc: '伏牛山区的“小红果”，米坪产区以肉厚色正、有效成分足被全国药商熟悉。人工在果实红透时采摘，再经清洗、去核、晾晒分级。',
      image: 'assets/cornus-officinalis.jpg',
      specs: [
        ['产地', '河南省南阳市西峡县米坪镇，海拔千余米山坡，5000 亩基地'],
        ['采收', '秋末冬初果实红透时人工采摘，当日摊晾'],
        ['形态', '鲜果 / 干品 / 去核萸肉（一级、统货可分等）'],
        ['用途', '泡茶、煮粥、炖汤；饮片企业与药企原料'],
        ['储存', '密封避光、阴凉干燥；梅雨季建议冷藏'],
        ['供应', '零售按件；批发按等级议价，可长期供货']
      ]
    },
    huangjing: {
      title: '九蒸九晒黄精',
      latin: 'Polygonatum sibiricum · 天门冬科',
      desc: '反复蒸制、反复日晒，颜色由黄转黑、油润透亮，口感由麻转甘润。工序按次计、周期以月计，人工与损耗都远高于一次烘干。',
      image: 'assets/herb-huangjing.svg',
      art: true,
      specs: [
        ['基地', '行上村 2 个 500 亩黄精种植基地'],
        ['工艺', '传统九蒸九晒，足汽蒸透、晴天摊晒，循环九次'],
        ['形态', '整支 / 厚片，可做茶饮与炖煮原料'],
        ['分级', '按个头、断面、色泽分等'],
        ['储存', '密封避光、阴凉干燥，防潮防虫'],
        ['定制', '可按客户标准做切片厚度与包装']
      ]
    },
    tianma: {
      title: '伏牛山天麻',
      latin: 'Gastrodia elata · 兰科',
      desc: '生长在米坪镇的山地林下环境，块茎饱满、环纹清晰。按个头、完整度与断面分级，鲜品与干片都有。',
      image: 'assets/herb-tianma.svg',
      art: true,
      specs: [
        ['产区', '米坪镇山地林下环境'],
        ['分级', '按个头、完整度、断面分等'],
        ['形态', '鲜天麻 / 干片'],
        ['包装', '可按客户要求分装、贴牌'],
        ['储存', '鲜品冷藏快运；干片密封防潮'],
        ['供应', '药企、饮片企业、商超与电商平台']
      ]
    },
    lianqiao: {
      title: '连翘',
      latin: 'Forsythia suspensa · 木犀科',
      desc: '3000 亩连翘种植基地，按采收期分为“青翘”与“老翘”。颗粒饱满、杂质少，主要面向饮片厂与药企。',
      image: 'assets/herb-lianqiao.svg',
      art: true,
      specs: [
        ['基地', '3000 亩连翘种植基地'],
        ['规格', '青翘 / 老翘，按采收期与颗粒大小区分'],
        ['加工', '统一收购后清洗、干燥、去杂、过筛'],
        ['客户', '饮片企业、药企、批发商'],
        ['供应', '产地仓常备库存，支持整车发货'],
        ['合作', '可签长期供货协议，按等级定价']
      ]
    },
    honey: {
      title: '伏牛山土蜂蜜',
      latin: 'Apis cerana honey · 中华蜜蜂',
      desc: '山中百花蜜源，一年取蜜次数少、浓度高、浓稠挂壁。随蜂蜜一起打包发货，适合做伴手礼与组合礼盒。',
      image: 'assets/herb-honey.svg',
      art: true,
      specs: [
        ['蜜源', '伏牛山山地百花'],
        ['特点', '取蜜次数少，浓度高，浓稠挂壁'],
        ['规格', '散装 / 瓶装 / 礼盒装'],
        ['包装', '可定制标签与礼盒'],
        ['储存', '阴凉避光，避免高温；结晶属正常现象'],
        ['搭配', '与萸肉、黄精组合成节令礼盒']
      ]
    },
    shiitake: {
      title: '西峡香菇',
      latin: 'Lentinula edodes · 国家地理标志保护产品',
      desc: '与山茱萸同为西峡县国家地理标志保护产品。米坪镇香菇大棚连片成规模，鲜菇、干菇、分级菇常年供应。',
      image: 'assets/shiitake-public-domain.jpg',
      specs: [
        ['资质', '西峡香菇为国家地理标志保护产品'],
        ['等级', '按菌盖直径、厚度、开伞度分级'],
        ['形式', '鲜菇冷链 / 干菇常温'],
        ['加工', '烘干、剪柄、分级、包装'],
        ['供应', '商超、餐饮、电商平台、批发市场'],
        ['溯源', '西峡县实行一品一码、扫码溯源']
      ]
    }
  };

  function initProductDialog() {
    var dialog = $('#product-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') { return; }

    var image = $('#pd-image');
    var title = $('#pd-title');
    var latin = $('#pd-latin');
    var desc = $('#pd-desc');
    var specs = $('#pd-specs');

    function open(key) {
      var item = PRODUCTS[key];
      if (!item) { return; }

      image.src = item.image;
      image.alt = item.title;
      image.className = item.art ? 'is-art' : '';
      title.textContent = item.title;
      latin.textContent = item.latin;
      desc.textContent = item.desc;

      specs.innerHTML = '';
      item.specs.forEach(function (pair) {
        var li = document.createElement('li');
        var label = document.createElement('b');
        var value = document.createElement('span');
        label.textContent = pair[0];
        value.textContent = pair[1];
        li.appendChild(label);
        li.appendChild(value);
        specs.appendChild(li);
      });

      dialog.showModal();
      document.body.classList.add('is-locked');
    }

    function close() {
      if (dialog.open) { dialog.close(); }
      document.body.classList.remove('is-locked');
    }

    $$('[data-product]').forEach(function (button) {
      button.addEventListener('click', function () {
        open(button.getAttribute('data-product'));
      });
    });

    $$('#pd-close, #pd-close-2').forEach(function (button) {
      button.addEventListener('click', close);
    });

    var cta = $('#pd-cta');
    if (cta) { cta.addEventListener('click', close); }

    // 弹窗里跳外站（抖音店铺）的链接，点完顺手把弹窗收起来
    $$('a[target="_blank"]', dialog).forEach(function (link) {
      link.addEventListener('click', close);
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { close(); }
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('is-locked');
    });
  }

  /* ---------------- 宣传片播放 ---------------- */
  function initVideo() {
    var video = $('#promo-video');
    var play = $('#promo-play');
    if (!video || !play) { return; }

    function hide() { play.classList.add('is-hidden'); }

    play.addEventListener('click', function () {
      hide();
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () { play.classList.remove('is-hidden'); });
      }
    });

    video.addEventListener('play', hide);
  }

  /* ---------------- 咨询表单 ---------------- */
  function initForm() {
    var form = $('#inquiry-form');
    if (!form) { return; }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = ($('#f-name').value || '').trim();
      var contact = ($('#f-contact').value || '').trim();
      var type = $('#f-type').value;
      var product = ($('#f-product').value || '').trim();
      var message = ($('#f-message').value || '').trim();

      var missing = [];
      if (!name) { missing.push('称呼'); }
      if (!contact) { missing.push('联系方式'); }
      if (!message) { missing.push('具体需求'); }

      if (missing.length) {
        toast('还差一点：请填写' + missing.join('、'));
        var firstEmpty = !name ? $('#f-name') : (!contact ? $('#f-contact') : $('#f-message'));
        if (firstEmpty) { firstEmpty.focus(); }
        return;
      }

      var subject = '【' + BRAND_NAME + '咨询】' + type + (product ? ' · ' + product : '');
      var body = [
        '咨询类型：' + type,
        '称呼：' + name,
        '联系方式：' + contact,
        '产品与规格：' + (product || '（未填写）'),
        '',
        '具体需求：',
        message,
        '',
        '—— 来自 ' + BRAND_NAME + ' 官网咨询表单'
      ].join('\n');

      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      toast('已生成咨询邮件，请在邮件客户端中确认发送');
    });
  }

  /* ---------------- 大字模式 ---------------- */
  function initTextToggle() {
    var button = $('#text-toggle');
    var label = $('#text-toggle-label');
    if (!button) { return; }

    var KEY = 'yulaotou-large-text';

    function apply(on) {
      document.body.classList.toggle('is-large-text', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (label) { label.textContent = on ? '标准字' : '大字'; }
    }

    var saved = null;
    try { saved = window.localStorage.getItem(KEY); } catch (error) { saved = null; }
    apply(saved === '1');

    button.addEventListener('click', function () {
      var next = !document.body.classList.contains('is-large-text');
      apply(next);
      try { window.localStorage.setItem(KEY, next ? '1' : '0'); } catch (error) { /* 忽略隐私模式 */ }
      toast(next ? '已切换到大字模式' : '已切回标准字号');
    });
  }

  /* ---------------- 回到顶部 ---------------- */
  function initToTop() {
    var button = $('#to-top');
    if (!button) { return; }

    var onScroll = function () {
      button.classList.toggle('is-visible', window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- 页脚年份 ---------------- */
  function initYear() {
    var year = $('#year');
    if (year) { year.textContent = String(new Date().getFullYear()); }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    paintIcons();
    initHeader();
    initReveal();
    initCounters();
    initNavHighlight();
    initProductDialog();
    initVideo();
    initForm();
    initTextToggle();
    initToTop();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
