'use strict';
var design = require('./design');
// رندرِ سمتِ سرورِ صفحاتِ عمومی از محتوای ذخیره‌شده (data/content.json).
// همهٔ متن‌ها از سوپرادمین می‌آیند؛ این فایل فقط قالب است.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function arr(x) { return Array.isArray(x) ? x : []; }
function safeUrl(u) {
  u = String(u || '').trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(u)) return u;
  return '';
}
function safeIcon(c) { return String(c || '').replace(/[^a-z0-9 \-]/gi, ''); }
function safeColor(c) { return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : '#8f74ee'; }

// متنِ ساده‌شدهٔ مارک‌داون: ## تیتر، ### زیرتیتر، - فهرست، > نقل‌قول، **پررنگ**، [متن](نشانی)
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_m, t, u) {
      var url = safeUrl(u.replace(/&amp;/g, '&'));
      return url ? '<a href="' + esc(url) + '">' + t + '</a>' : t;
    });
}
function md(src) {
  var blocks = String(src || '').replace(/\r/g, '').split(/\n\s*\n/);
  return blocks.map(function (b) {
    var out = '', para = [], list = [], quote = [];
    function flush() {
      if (para.length) out += '<p>' + para.map(inline).join('<br>') + '</p>';
      if (list.length) out += '<ul>' + list.map(function (l) { return '<li>' + inline(l) + '</li>'; }).join('') + '</ul>';
      if (quote.length) out += '<blockquote>' + quote.map(inline).join('<br>') + '</blockquote>';
      para = []; list = []; quote = [];
    }
    b.split('\n').forEach(function (l) {
      if (!l.trim()) return;
      var m;
      if ((m = /^\s*###\s+(.*)$/.exec(l))) { flush(); out += '<h3>' + inline(m[1]) + '</h3>'; }
      else if ((m = /^\s*##\s+(.*)$/.exec(l))) { flush(); out += '<h2>' + inline(m[1]) + '</h2>'; }
      else if ((m = /^\s*[-*]\s+(.*)$/.exec(l))) { if (para.length || quote.length) flush(); list.push(m[1]); }
      else if ((m = /^\s*>\s?(.*)$/.exec(l))) { if (para.length || list.length) flush(); quote.push(m[1]); }
      else { if (list.length || quote.length) flush(); para.push(l); }
    });
    flush();
    return out;
  }).join('\n');
}

function pagesOf(c) { return arr(c.pages).filter(function (p) { return p && p.enabled !== false && p.slug; }); }

function logoHtml(c) {
  var s = c.site || {};
  var d = design.normalize(c.design);
  var src = s.logo || '/assets/img/neura-logo-gradient.png';
  var mark = d.logoMode === 'original'
    ? '<img class="mark" src="' + esc(src) + '" alt="">'
    : '<span class="mark mark-mask" style="-webkit-mask-image:url(\'' + esc(src) + '\');mask-image:url(\'' + esc(src) + '\')" role="img" aria-label="' + esc(s.name) + '"></span>';
  return '<a class="logo" href="/">' + mark + (d.logoText ? '<span class="txt"><b>' + esc(s.brand) + '</b></span>' : '') + '</a>';
}

function linkAttrs(l) {
  var u = safeUrl(l.url);
  if (!u) return '';
  var ext = /^https?:/i.test(u) || l.newTab;
  return 'href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '');
}

function layout(c, opts) {
  var s = c.site || {};
  var pages = pagesOf(c);
  var menu = [{ href: '/', label: s.homeLabel || 'خانه', id: 'home' }].concat(
    pages.filter(function (p) { return p.inMenu; }).map(function (p) { return { href: '/p/' + p.slug, label: p.title, id: p.slug }; }));
  var foot = pages.filter(function (p) { return p.inFooter; });
  var base = String(s.baseUrl || '').replace(/\/+$/, '');
  var title = opts.title || s.title || s.name;
  var desc = opts.desc || s.description || '';
  var theme = s.defaultTheme === 'dark' || s.defaultTheme === 'light' ? s.defaultTheme : '';
  var k = c.contact || {};
  var contactRows = arr(k.rows).slice(0, 4);
  var an = s.announce || {};
  var fl = s.floating || {};
  var ogImg = s.ogImage ? (/^https?:/i.test(s.ogImage) ? s.ogImage : base + s.ogImage) : '';
  var floatBtns = [];
  if (fl.enabled) {
    if (fl.whatsapp) floatBtns.push('<a class="fl-wa" href="https://wa.me/' + esc(String(fl.whatsapp).replace(/[^0-9]/g, '')) + '" target="_blank" rel="noopener" aria-label="واتساپ"><i class="fa-brands fa-whatsapp"></i></a>');
    if (fl.telegram) floatBtns.push('<a class="fl-tg" href="https://t.me/' + esc(String(fl.telegram).replace(/^@|https?:\/\/t\.me\//g, '')) + '" target="_blank" rel="noopener" aria-label="تلگرام"><i class="fa-brands fa-telegram"></i></a>');
    if (fl.phone) floatBtns.push('<a class="fl-ph" href="tel:' + esc(String(fl.phone).replace(/[^0-9+]/g, '')) + '" aria-label="تماس"><i class="fa-solid fa-phone"></i></a>');
  }

  return '<!doctype html>\n<html lang="fa" dir="rtl">\n<head>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n<meta name="robots" content="' + (opts.noindex ? 'noindex, follow' : 'index, follow') + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:locale" content="fa_IR">\n<meta property="og:site_name" content="' + esc(s.name) + '">\n' +
    (ogImg ? '<meta property="og:image" content="' + esc(ogImg) + '">\n<meta name="twitter:card" content="summary_large_image">\n' : '') +
    (base ? '<link rel="canonical" href="' + esc(base + opts.path) + '">\n' : '') +
    '<meta name="theme-color" content="' + esc(design.normalize(c.design).brand) + '">\n' +
    '<link rel="icon" href="' + esc((c.design && c.design.favicon) || s.logo || '/assets/img/neura-logo-gradient.png') + '">\n' +
    '<link rel="stylesheet" href="/assets/fa/css/all.min.css">\n<link rel="stylesheet" href="/assets/css/site.css">\n' +
    '<link rel="stylesheet" href="/assets/css/extra.css">\n' +
    '<style id="design">' + design.css(c.design) + '</style>\n' +
    '<script>(function(){var t="";try{t=localStorage.getItem("neura_site_theme")||""}catch(e){}' +
    (s.showThemeToggle === false ? 't="";' : '') +
    'if(!t)t="' + theme + '";if(!t)t=(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";' +
    'document.documentElement.setAttribute("data-theme",t)})();</script>\n' +
    (s.headHtml ? s.headHtml + '\n' : '') +
    '</head>\n<body data-site-public id="top">\n<div class="bg"><i></i><i></i><i></i><i></i></div>\n' +
    (an.enabled && an.text ? '<div class="announce">' + (safeUrl(an.link) ? '<a ' + linkAttrs({ url: an.link }) + '>' + esc(an.text) + ' <i class="fa-solid fa-arrow-left"></i></a>' : '<span>' + esc(an.text) + '</span>') + '</div>\n' : '') +
    '<header class="site"><div class="wrap nav">\n' + logoHtml(c) + '\n' +
    '<nav class="menu" data-site-menu aria-label="منو">' +
    menu.map(function (m) { return '<a href="' + esc(m.href) + '"' + (m.id === opts.active ? ' aria-current="page"' : '') + '>' + esc(m.label) + '</a>'; }).join('') +
    arr(s.menuLinks).filter(function (l) { return l && l.label && safeUrl(l.url); }).map(function (l) {
      return '<a ' + linkAttrs(l) + (l.highlight ? ' class="cta sm"' : '') + '>' + esc(l.label) + '</a>';
    }).join('') +
    '</nav>\n<span style="margin-inline-start:auto"></span>\n' +
    (s.showThemeToggle === false ? '' : '<button type="button" class="thbtn" data-theme-btn aria-label="تغییر تم"><i class="fa-solid fa-moon"></i></button>\n') +
    '<button type="button" class="burger" data-site-burger aria-label="منو" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>\n' +
    '</div></header>\n<main>\n' + opts.body + '\n</main>\n' +
    '<footer class="site"><div class="wrap"><div class="foot-grid">\n' +
    '<div class="foot-about">' + logoHtml(c) + '<p>' + esc(s.footerAbout) + '</p>' +
    (s.footerSocials !== false && arr(k.socials).some(function (x) { return safeUrl(x.url); }) ? '<div class="socials">' + arr(k.socials).filter(function (x) { return safeUrl(x.url); }).map(function (x) {
      return '<a ' + linkAttrs({ url: x.url, newTab: true }) + ' aria-label="' + esc(x.label) + '"><i class="' + safeIcon(x.icon || 'fa-solid fa-link') + '"></i></a>';
    }).join('') + '</div>' : '') + '</div>\n' +
    '<div><h4>' + esc(s.footerLinksTitle || 'دسترسی سریع') + '</h4><nav><a href="/">' + esc(s.homeLabel || 'خانه') + '</a>' +
    foot.map(function (p) { return '<a href="/p/' + esc(p.slug) + '">' + esc(p.title) + '</a>'; }).join('') +
    arr(s.footerLinks).filter(function (l) { return l && l.label && safeUrl(l.url); }).map(function (l) { return '<a ' + linkAttrs(l) + '>' + esc(l.label) + '</a>'; }).join('') +
    '</nav></div>\n' +
    '<div><h4>' + esc(s.footerContactTitle || 'تماس') + '</h4><nav>' +
    contactRows.map(function (r) { return '<span class="foot-txt">' + esc(String(r.value || '').split('\n')[0]) + '</span>'; }).join('') + '</nav>' +
    (s.enamadHtml ? '<div class="enamad">' + s.enamadHtml + '</div>' : '') + '</div>\n' +
    '</div><div class="foot-bar"><span>' + esc(s.copyright) + '</span><span class="end">' + esc(s.madeIn) + '</span></div></div></footer>\n' +
    (floatBtns.length ? '<div class="floating">' + floatBtns.join('') + '</div>\n' : '') +
    (s.bodyHtml ? s.bodyHtml + '\n' : '') +
    '<script src="/assets/js/site.js" defer></script>\n</body>\n</html>\n';
}

function contactBlock(c) {
  var k = c.contact || {};
  return '<div class="contact-grid">' +
    '<div class="card"><h3><i class="fa-solid fa-address-card"></i>' + esc(k.infoTitle) + '</h3>' +
    arr(k.rows).map(function (r) {
      return '<div class="cline"><span class="ic"><i class="' + safeIcon(r.icon || 'fa-solid fa-circle-info') + '"></i></span><div><b>' + esc(r.label) + '</b>' +
        String(r.value || '').split('\n').map(function (v) { return '<span>' + esc(v) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div>' +
    (arr(k.socials).length ? '<div class="card"><h3><i class="fa-solid fa-comments"></i>' + esc(k.socialTitle) + '</h3>' +
      arr(k.socials).map(function (s) {
        var u = safeUrl(s.url);
        var v = u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(s.value) + '</a>' : '<span>' + esc(s.value) + '</span>';
        return '<div class="cline"><span class="ic"><i class="' + safeIcon(s.icon || 'fa-solid fa-link') + '"></i></span><div><b>' + esc(s.label) + '</b>' + v + '</div></div>';
      }).join('') + '</div>' : '') +
    '</div>' + (k.formEnabled ? contactForm(k) : '');
}

function contactForm(k) {
  return '<form class="card contact-form" data-contact-form>' +
    '<h3><i class="fa-solid fa-paper-plane"></i>' + esc(k.formTitle || 'ارسال پیام') + '</h3>' +
    '<div class="cf-grid"><label class="field"><span>' + esc(k.formName || 'نام و نام خانوادگی') + '</span><input name="name" required maxlength="80"></label>' +
    '<label class="field"><span>' + esc(k.formPhone || 'شماره تماس') + '</span><input name="phone" required maxlength="20" inputmode="tel" dir="ltr"></label></div>' +
    '<label class="field"><span>' + esc(k.formMessage || 'پیام شما') + '</span><textarea name="msg" required rows="4" maxlength="3000"></textarea></label>' +
    '<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button class="cta" type="submit"><i class="fa-solid fa-paper-plane"></i>' + esc(k.formSubmit || 'ارسال') + '</button>' +
    '<p class="cf-msg" data-ok="' + esc(k.formOk || 'پیام شما ثبت شد؛ به‌زودی با شما تماس می‌گیریم.') + '"></p></form>';
}

var HOME_PARTS = ['agents', 'about', 'custom', 'contact'];

function home(c) {
  var h = c.home || {};
  var agents = arr(c.agents);
  var btn = function (label, link, cls, icon) {
    var u = safeUrl(link);
    return label && u ? '<a class="cta' + cls + '" href="' + esc(u) + '"><i class="' + icon + '"></i>' + esc(label) + '</a>' : '';
  };
  var body =
    '<section class="hero"><div class="wrap hero-grid"><div>' +
    (h.heroEyebrow ? '<span class="eyebrow"><i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px"></i>' + esc(h.heroEyebrow) + '</span>' : '') +
    '<h1>' + esc(h.heroTitle) + ' <em>' + esc(h.heroTitleAccent) + '</em></h1>' +
    (h.heroP1 ? '<p class="lead">' + esc(h.heroP1) + '</p>' : '') +
    (h.heroP2 ? '<p class="sub">' + esc(h.heroP2) + '</p>' : '') +
    '<div class="hero-btns">' + btn(h.heroBtn1, h.heroBtn1Link, '', 'fa-solid fa-users-gear') + btn(h.heroBtn2, h.heroBtn2Link, ' ghost', 'fa-solid fa-phone') + '</div>' +
    (arr(h.stats).length ? '<div class="hero-stats">' + arr(h.stats).map(function (s) {
      return '<div><b class="num">' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('') + '</div>' : '') +
    '</div>' +
    (h.heroAvatar && design.normalize(c.design).heroStyle === 'plain' ? '<div class="hero-art hero-plain"><img src="' + esc(h.heroAvatar) + '" alt=""></div>' :
     h.heroAvatar ? '<div class="hero-art"><span class="detail-face hero-face" data-spectrum="' + esc(safeColor(h.heroAccent)) + '">' +
      '<canvas aria-hidden="true"></canvas><img src="' + esc(h.heroAvatar) + '" alt=""></span></div>' : '') +
    '</div></section>\n';

  var parts = {};
  if (h.showAgents !== false && agents.length) {
    parts.agents = '<section class="band" id="agents"><div class="wrap"><div class="band-head"><h2>' + esc(h.agentsTitle) + '</h2><p>' + esc(h.agentsDesc) + '</p></div><div class="agents">' +
      agents.map(function (a) {
        return '<article class="acard" style="--ac:' + esc(safeColor(a.accent)) + ';text-align:start"><div class="body"><div class="col">' +
          '<h3>' + esc(a.name) + '</h3><div class="tag">' + esc(a.tagline) + '</div><p>' + esc(a.desc) + '</p>' +
          '<ul class="feats">' + String(a.bullets || '').split('\n').filter(function (x) { return x.trim(); }).map(function (f) {
            return '<li><i class="fa-solid fa-circle"></i>' + esc(f) + '</li>';
          }).join('') + '</ul></div>' +
          (a.avatar ? '<span class="face"><img src="' + esc(a.avatar) + '" alt="' + esc(a.name) + '" loading="lazy"></span>' : '') +
          '</div></article>';
      }).join('') + '</div></div></section>\n';
  }
  if (h.showAbout !== false) {
    parts.about = '<section class="band" id="about"><div class="wrap about-grid"><div class="prose">' +
      '<h2 style="font-size:30px;font-weight:800;margin-bottom:13px">' + esc(h.aboutTitle) + '</h2>' + md(h.aboutText) + '</div>' +
      '<div class="pillars">' + arr(h.pillars).map(function (k) {
        return '<div class="pillar"><i class="' + safeIcon(k.icon || 'fa-solid fa-star') + '"></i><b>' + esc(k.title) + '</b><span>' + esc(k.desc) + '</span></div>';
      }).join('') + '</div></div></section>\n';
  }
  parts.custom = '';
  arr(h.sections).forEach(function (sec, i) {
    if (!sec || sec.enabled === false) return;
    parts.custom += '<section class="band" id="sec-' + (i + 1) + '"><div class="wrap"><div class="article"><div class="band-head" style="margin-bottom:14px"><h2>' +
      esc(sec.title) + '</h2></div><div class="body">' + md(sec.body) + '</div></div></div></section>\n';
  });
  if (h.showContact !== false) {
    var k = c.contact || {};
    parts.contact = '<section class="band" id="contact"><div class="wrap"><div class="band-head"><h2>' + esc(k.title) + '</h2><p>' + esc(k.desc) + '</p></div>' + contactBlock(c) + '</div></section>\n';
  }
  var order = arr(h.order).filter(function (x) { return HOME_PARTS.indexOf(x) >= 0; });
  HOME_PARTS.forEach(function (x) { if (order.indexOf(x) < 0) order.push(x); });
  order.forEach(function (x) { body += parts[x] || ''; });
  return layout(c, { path: '/', active: 'home', body: body });
}

function page(c, slug) {
  var p = pagesOf(c).filter(function (x) { return x.slug === slug; })[0];
  if (!p) return null;
  var k = c.contact || {};
  var body = '<section class="band"><div class="wrap"><div class="article" style="max-width:' + (p.width === 'wide' ? '100%' : '860px') + ';margin-inline:auto">' +
    (p.cover ? '<img class="page-cover" src="' + esc(p.cover) + '" alt="">' : '') +
    '<h1>' + esc(p.title) + '</h1>' +
    (p.showContact && k.desc && !p.body ? '<p class="page-lead">' + esc(k.desc) + '</p>' : '') +
    '<div class="body">' + md(p.body) + '</div>' +
    (p.showContact ? contactBlock(c) : '') +
    '</div></div></section>';
  return layout(c, { path: '/p/' + slug, active: slug, title: p.title + ' | ' + ((c.site || {}).name || ''), desc: p.description || '', body: body });
}

function notFound(c) {
  var s = c.site || {};
  return layout(c, { path: '/404', active: '', noindex: true, title: s.notFoundTitle || 'صفحه پیدا نشد', body:
    '<section class="band"><div class="wrap" style="text-align:center;padding:70px 0"><h1 style="font-size:32px;font-weight:800;margin-bottom:12px">' + esc(s.notFoundTitle || 'صفحه پیدا نشد') + '</h1>' +
    '<p style="color:var(--ink-2);margin-bottom:22px">' + esc(s.notFoundText || 'نشانی‌ای که دنبالش بودید وجود ندارد.') + '</p><a class="cta" href="/">بازگشت به خانه</a></div></section>' });
}

function maintenance(c) {
  var s = c.site || {};
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + esc(s.name) + '</title><link rel="stylesheet" href="/assets/css/site.css"><link rel="stylesheet" href="/assets/css/extra.css">' +
    '<style id="design">' + design.css(c.design) + '</style></head><body data-site-public><div class="bg"><i></i><i></i><i></i><i></i></div>' +
    '<main class="maint"><div>' + logoHtml(c) + '<h1>' + esc(s.maintenanceTitle || 'به‌زودی برمی‌گردیم') + '</h1><p>' + esc(s.maintenanceText || 'سایت در حال به‌روزرسانی است.') + '</p></div></main></body></html>';
}

function sitemap(c, base) {
  var urls = ['/'].concat(pagesOf(c).map(function (p) { return '/p/' + p.slug; }));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(function (u) { return '  <url><loc>' + esc(base + u) + '</loc></url>'; }).join('\n') + '\n</urlset>\n';
}

module.exports = { home: home, page: page, notFound: notFound, maintenance: maintenance, sitemap: sitemap, md: md };
