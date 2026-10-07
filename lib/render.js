'use strict';
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
    var lines = b.split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return '';
    if (lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
      return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
    }
    if (lines.length === 1 && /^###\s+/.test(lines[0])) return '<h3>' + inline(lines[0].replace(/^###\s+/, '')) + '</h3>';
    if (lines.length === 1 && /^##\s+/.test(lines[0])) return '<h2>' + inline(lines[0].replace(/^##\s+/, '')) + '</h2>';
    if (lines.every(function (l) { return /^>\s?/.test(l); })) {
      return '<blockquote>' + lines.map(function (l) { return inline(l.replace(/^>\s?/, '')); }).join('<br>') + '</blockquote>';
    }
    // تیترِ چسبیده به پاراگراف
    var out = '';
    if (/^#{2,3}\s+/.test(lines[0])) {
      var h = /^###/.test(lines[0]) ? 'h3' : 'h2';
      out = '<' + h + '>' + inline(lines.shift().replace(/^#{2,3}\s+/, '')) + '</' + h + '>';
    }
    return out + (lines.length ? '<p>' + lines.map(inline).join('<br>') + '</p>' : '');
  }).join('\n');
}

function pagesOf(c) { return arr(c.pages).filter(function (p) { return p && p.enabled !== false && p.slug; }); }

function layout(c, opts) {
  var s = c.site || {};
  var pages = pagesOf(c);
  var menu = [{ href: '/', label: 'خانه', id: 'home' }].concat(
    pages.filter(function (p) { return p.inMenu; }).map(function (p) { return { href: '/p/' + p.slug, label: p.title, id: p.slug }; }));
  var foot = pages.filter(function (p) { return p.inFooter; });
  var base = String(s.baseUrl || '').replace(/\/+$/, '');
  var title = opts.title || s.title || s.name;
  var desc = opts.desc || s.description || '';
  var theme = s.defaultTheme === 'dark' || s.defaultTheme === 'light' ? s.defaultTheme : '';
  var contactRows = arr((c.contact || {}).rows).slice(0, 4);

  return '<!doctype html>\n<html lang="fa" dir="rtl">\n<head>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n<meta name="robots" content="index, follow">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:locale" content="fa_IR">\n<meta property="og:site_name" content="' + esc(s.name) + '">\n' +
    (base ? '<link rel="canonical" href="' + esc(base + opts.path) + '">\n' : '') +
    '<link rel="icon" href="' + esc(s.logo || '/assets/img/neura-logo-gradient.png') + '">\n' +
    '<link rel="stylesheet" href="/assets/fa/css/all.min.css">\n<link rel="stylesheet" href="/assets/css/site.css">\n' +
    '<link rel="stylesheet" href="/assets/css/extra.css">\n' +
    '<script>(function(){var t="";try{t=localStorage.getItem("neura_site_theme")||""}catch(e){}' +
    'if(!t)t="' + theme + '";if(!t)t=(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";' +
    'document.documentElement.setAttribute("data-theme",t)})();</script>\n' +
    (s.headHtml ? s.headHtml + '\n' : '') +
    '</head>\n<body data-site-public id="top">\n<div class="bg"><i></i><i></i><i></i><i></i></div>\n' +
    '<header class="site"><div class="wrap nav">\n' +
    '<a class="logo" href="/"><img class="mark" src="' + esc(s.logo) + '" alt=""><span class="txt"><b>' + esc(s.brand) + '</b></span></a>\n' +
    '<nav class="menu" data-site-menu aria-label="منو">' +
    menu.map(function (m) { return '<a href="' + esc(m.href) + '"' + (m.id === opts.active ? ' aria-current="page"' : '') + '>' + esc(m.label) + '</a>'; }).join('') +
    '</nav>\n<span style="margin-inline-start:auto"></span>\n' +
    '<button type="button" class="thbtn" data-theme-btn aria-label="تغییر تم"><i class="fa-solid fa-moon"></i></button>\n' +
    '<button type="button" class="burger" data-site-burger aria-label="منو" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>\n' +
    '</div></header>\n<main>\n' + opts.body + '\n</main>\n' +
    '<footer class="site"><div class="wrap"><div class="foot-grid">\n' +
    '<div class="foot-about"><a class="logo" href="/"><img class="mark" src="' + esc(s.logo) + '" alt=""><span class="txt"><b>' + esc(s.brand) + '</b></span></a>' +
    '<p>' + esc(s.footerAbout) + '</p></div>\n' +
    '<div><h4>دسترسی سریع</h4><nav><a href="/">خانه</a>' +
    foot.map(function (p) { return '<a href="/p/' + esc(p.slug) + '">' + esc(p.title) + '</a>'; }).join('') + '</nav></div>\n' +
    '<div><h4>تماس</h4><nav>' +
    contactRows.map(function (r) { return '<span class="foot-txt">' + esc(String(r.value || '').split('\n')[0]) + '</span>'; }).join('') + '</nav>' +
    (s.enamadHtml ? '<div class="enamad">' + s.enamadHtml + '</div>' : '') + '</div>\n' +
    '</div><div class="foot-bar"><span>' + esc(s.copyright) + '</span><span class="end">' + esc(s.madeIn) + '</span></div></div></footer>\n' +
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
    '</div>';
}

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
    (h.heroAvatar ? '<div class="hero-art"><span class="detail-face hero-face" data-spectrum="' + esc(safeColor(h.heroAccent)) + '">' +
      '<canvas aria-hidden="true"></canvas><img src="' + esc(h.heroAvatar) + '" alt=""></span></div>' : '') +
    '</div></section>\n';

  if (h.showAgents !== false && agents.length) {
    body += '<section class="band" id="agents"><div class="wrap"><div class="band-head"><h2>' + esc(h.agentsTitle) + '</h2><p>' + esc(h.agentsDesc) + '</p></div><div class="agents">' +
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
    body += '<section class="band" id="about"><div class="wrap about-grid"><div class="prose">' +
      '<h2 style="font-size:30px;font-weight:800;margin-bottom:13px">' + esc(h.aboutTitle) + '</h2>' + md(h.aboutText) + '</div>' +
      '<div class="pillars">' + arr(h.pillars).map(function (k) {
        return '<div class="pillar"><i class="' + safeIcon(k.icon || 'fa-solid fa-star') + '"></i><b>' + esc(k.title) + '</b><span>' + esc(k.desc) + '</span></div>';
      }).join('') + '</div></div></section>\n';
  }
  if (h.showContact !== false) {
    var k = c.contact || {};
    body += '<section class="band" id="contact"><div class="wrap"><div class="band-head"><h2>' + esc(k.title) + '</h2><p>' + esc(k.desc) + '</p></div>' + contactBlock(c) + '</div></section>\n';
  }
  return layout(c, { path: '/', active: 'home', body: body });
}

function page(c, slug) {
  var p = pagesOf(c).filter(function (x) { return x.slug === slug; })[0];
  if (!p) return null;
  var k = c.contact || {};
  var body = '<section class="band"><div class="wrap"><div class="article" style="max-width:860px;margin-inline:auto">' +
    '<h1>' + esc(p.title) + '</h1>' +
    (p.showContact && k.desc && !p.body ? '<p class="page-lead">' + esc(k.desc) + '</p>' : '') +
    '<div class="body">' + md(p.body) + '</div>' +
    (p.showContact ? contactBlock(c) : '') +
    '</div></div></section>';
  return layout(c, { path: '/p/' + slug, active: slug, title: p.title + ' | ' + ((c.site || {}).name || ''), desc: p.description || '', body: body });
}

function notFound(c) {
  return layout(c, { path: '/404', active: '', title: 'صفحه پیدا نشد', body:
    '<section class="band"><div class="wrap" style="text-align:center;padding:70px 0"><h1 style="font-size:32px;font-weight:800;margin-bottom:12px">صفحه پیدا نشد</h1>' +
    '<p style="color:var(--ink-2);margin-bottom:22px">نشانی‌ای که دنبالش بودید وجود ندارد.</p><a class="cta" href="/">بازگشت به خانه</a></div></section>' });
}

module.exports = { home: home, page: page, notFound: notFound, md: md };
