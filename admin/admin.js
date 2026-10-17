// سوپرادمینِ سایتِ نورا — فرم‌ها از روی یک شِما ساخته می‌شوند.
(function () {
  var C = null, dirty = false, cur = 'site';
  var $ = function (s) { return document.querySelector(s); };

  function api(method, route, body) {
    return fetch('/admin/api/' + route, {
      method: method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'neuraeco' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
  }
  function status(t, cls) { var s = $('#status'); s.textContent = t; s.className = 'status ' + (cls || ''); }
  function markDirty() { dirty = true; status('تغییرات ذخیره نشده', 'bad'); }

  var ICON_HELP = 'کلاس Font Awesome، مثل fa-solid fa-phone';
  var SECTIONS = [
    { id: 'site', title: 'تنظیمات کلی', icon: 'fa-solid fa-gear', path: ['site'], fields: [
      { k: 'name', l: 'نام سایت' }, { k: 'brand', l: 'نام لوگو (لاتین)' },
      { k: 'logo', l: 'لوگو', t: 'image' },
      { k: 'title', l: 'عنوان صفحهٔ اصلی (سئو)' }, { k: 'description', l: 'توضیح سایت (سئو)', t: 'textarea' },
      { k: 'baseUrl', l: 'نشانی کامل سایت', h: 'مثل https://neuraeco.ir — برای canonical' },
      { k: 'defaultTheme', l: 'تم پیش‌فرض', t: 'select', o: [['auto', 'خودکار (تنظیم دستگاه)'], ['light', 'روشن'], ['dark', 'تیره']] },
      { k: 'footerAbout', l: 'متن معرفی فوتر', t: 'textarea' },
      { k: 'copyright', l: 'متن کپی‌رایت' }, { k: 'madeIn', l: 'متن پایین فوتر' },
    ] },
    { id: 'enamad', title: 'اینماد و نمادها', icon: 'fa-solid fa-certificate', path: ['site'], help:
      'کدِ نمادی که اینماد (یا ساماندهی) می‌دهد را عیناً در کادرِ اول بگذارید — در فوترِ همهٔ صفحات نمایش داده می‌شود. ' +
      'اگر اینماد برای تأییدِ مالکیت یک تگِ <code>&lt;meta&gt;</code> داد، در کادرِ دوم بگذارید (داخلِ head همهٔ صفحات می‌رود).', fields: [
      { k: 'enamadHtml', l: 'کد نماد (فوتر)', t: 'code' },
      { k: 'headHtml', l: 'کد داخل head (متای تأیید، آمار و …)', t: 'code' },
    ] },
    { id: 'home', title: 'صفحهٔ اصلی', icon: 'fa-solid fa-house', path: ['home'], fields: [
      { k: 'heroEyebrow', l: 'برچسب بالای تیتر' }, { k: 'heroTitle', l: 'تیتر' }, { k: 'heroTitleAccent', l: 'بخش رنگی تیتر' },
      { k: 'heroP1', l: 'پاراگراف اول', t: 'textarea' }, { k: 'heroP2', l: 'پاراگراف دوم', t: 'textarea' },
      { k: 'heroAvatar', l: 'تصویر کنار تیتر', t: 'image' }, { k: 'heroAccent', l: 'رنگ هالهٔ تصویر', t: 'color' },
      { k: 'heroBtn1', l: 'دکمهٔ اول — متن' }, { k: 'heroBtn1Link', l: 'دکمهٔ اول — لینک', h: 'مثل #agents یا /p/about' },
      { k: 'heroBtn2', l: 'دکمهٔ دوم — متن' }, { k: 'heroBtn2Link', l: 'دکمهٔ دوم — لینک' },
      { k: 'stats', l: 'آمارها', t: 'list', item: [{ k: 'value', l: 'عدد' }, { k: 'label', l: 'عنوان' }], title: 'label' },
      { k: 'showAgents', l: 'نمایش بخش ایجنت‌ها', t: 'bool' },
      { k: 'agentsTitle', l: 'عنوان بخش ایجنت‌ها' }, { k: 'agentsDesc', l: 'توضیح بخش ایجنت‌ها', t: 'textarea' },
      { k: 'showAbout', l: 'نمایش بخش معرفی', t: 'bool' },
      { k: 'aboutTitle', l: 'عنوان بخش معرفی' }, { k: 'aboutText', l: 'متن بخش معرفی', t: 'md' },
      { k: 'pillars', l: 'کارت‌های بخش معرفی', t: 'list', item: [{ k: 'title', l: 'عنوان' }, { k: 'desc', l: 'توضیح', t: 'textarea' }, { k: 'icon', l: 'آیکن', h: ICON_HELP }], title: 'title' },
      { k: 'sections', l: 'بخش‌های دلخواه (زیر بخش معرفی)', t: 'list', title: 'title', item: [
        { k: 'title', l: 'عنوان بخش' }, { k: 'enabled', l: 'نمایش', t: 'bool' }, { k: 'body', l: 'متن', t: 'md' }] },
      { k: 'showContact', l: 'نمایش اطلاعات تماس در صفحهٔ اصلی', t: 'bool' },
    ] },
    { id: 'agents', title: 'ایجنت‌ها', icon: 'fa-solid fa-users-gear', path: [], fields: [
      { k: 'agents', l: 'ایجنت‌ها', t: 'list', title: 'name', item: [
        { k: 'name', l: 'نام' }, { k: 'tagline', l: 'زیرعنوان' }, { k: 'desc', l: 'توضیح', t: 'textarea' },
        { k: 'bullets', l: 'ویژگی‌ها', t: 'textarea', h: 'هر خط یک ویژگی' }, { k: 'avatar', l: 'تصویر', t: 'image' }, { k: 'accent', l: 'رنگ', t: 'color' },
      ] },
    ] },
    { id: 'contact', title: 'اطلاعات تماس', icon: 'fa-solid fa-address-book', path: ['contact'], help:
      'برای اینماد این اطلاعات باید دقیقاً با اطلاعاتِ ثبت‌شده در پرونده (تلفن ثابت، نشانی، ایمیل) یکی باشد.', fields: [
      { k: 'title', l: 'عنوان' }, { k: 'desc', l: 'توضیح', t: 'textarea' },
      { k: 'infoTitle', l: 'عنوان کارت اطلاعات' },
      { k: 'rows', l: 'ردیف‌های تماس', t: 'list', title: 'label', item: [
        { k: 'label', l: 'عنوان' }, { k: 'value', l: 'مقدار', t: 'textarea', h: 'چند مقدار؟ هر کدام یک خط' }, { k: 'icon', l: 'آیکن', h: ICON_HELP }] },
      { k: 'socialTitle', l: 'عنوان کارت شبکه‌ها' },
      { k: 'socials', l: 'شبکه‌های اجتماعی', t: 'list', title: 'label', item: [
        { k: 'label', l: 'نام' }, { k: 'value', l: 'نمایش' }, { k: 'url', l: 'لینک', h: 'مثل https://t.me/…' }, { k: 'icon', l: 'آیکن', h: ICON_HELP }] },
    ] },
    { id: 'pages', title: 'صفحات', icon: 'fa-solid fa-file-lines', custom: 'pages' },
    { id: 'account', title: 'حساب و پشتیبان', icon: 'fa-solid fa-user-shield', custom: 'account' },
  ];
  var NEW_ITEM = {
    sections: function () { return { title: 'بخش تازه', enabled: true, body: '' }; },
    pages: function () { return { title: 'صفحهٔ تازه', slug: 'page-' + Date.now().toString(36), enabled: true, inMenu: false, inFooter: true, showContact: false, body: '' }; },
  };

  function objAt(pathArr) { var o = C; pathArr.forEach(function (k) { o = o[k] || (o[k] = {}); }); return o; }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function fieldEl(obj, f, rerender) {
    var t = f.t || 'text';
    var v = obj[f.k];
    var set = function (val) { obj[f.k] = val; markDirty(); };
    if (t === 'bool') {
      var cb = el('input', { type: 'checkbox', onchange: function () { set(cb.checked); } });
      cb.checked = v !== false && v !== undefined ? !!v : false;
      if (v === undefined && /^show/.test(f.k)) cb.checked = true;
      return el('label', { class: 'check' }, [cb, el('span', { text: f.l })]);
    }
    var wrap = el('div', { class: 'field' }, [el('span', { text: f.l }, f.h ? [el('small', { text: ' — ' + f.h })] : [])]);
    if (t === 'list') {
      var list = Array.isArray(v) ? v : (obj[f.k] = []);
      list.forEach(function (it, i) {
        var head = el('div', { class: 'list-head' }, [
          el('b', { text: (i + 1) + '. ' + (it[f.title] || '') }),
          el('button', { class: 'btn sm', type: 'button', title: 'بالا', onclick: function () { if (i) { list.splice(i - 1, 0, list.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-up' })]),
          el('button', { class: 'btn sm', type: 'button', title: 'پایین', onclick: function () { if (i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-down' })]),
          el('button', { class: 'btn sm danger', type: 'button', title: 'حذف', onclick: function () { if (confirm('حذف شود؟')) { list.splice(i, 1); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-trash' })]),
        ]);
        var box = el('div', { class: 'list-item' }, [head]);
        f.item.forEach(function (sf) { box.appendChild(fieldEl(it, sf, rerender)); });
        wrap.appendChild(box);
      });
      wrap.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () {
        var n = NEW_ITEM[f.k] ? NEW_ITEM[f.k]() : {};
        list.push(n); markDirty(); rerender();
      } }, [el('i', { class: 'fa-solid fa-plus' }), document.createTextNode('افزودن')]));
      return wrap;
    }
    var inp;
    if (t === 'md') { wrap.appendChild(mdEditor(obj, f.k)); return wrap; }
    if (t === 'textarea' || t === 'code' || t === 'big') {
      inp = el('textarea', { class: t === 'code' ? 'code' : t === 'big' ? 'big' : '' });
      inp.value = v == null ? '' : v;
      inp.addEventListener('input', function () { set(inp.value); });
      wrap.appendChild(inp);
    } else if (t === 'select') {
      inp = el('select', { onchange: function () { set(inp.value); } }, f.o.map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
      inp.value = v || f.o[0][0];
      wrap.appendChild(inp);
    } else if (t === 'color') {
      var txt = el('input', { type: 'text', dir: 'ltr' }); txt.value = v || '#8f74ee';
      var col = el('input', { type: 'color' }); col.value = /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#8f74ee';
      col.addEventListener('input', function () { txt.value = col.value; set(col.value); });
      txt.addEventListener('input', function () { set(txt.value); if (/^#[0-9a-f]{6}$/i.test(txt.value)) col.value = txt.value; });
      wrap.appendChild(el('div', { class: 'row' }, [col, txt]));
    } else if (t === 'image') {
      var prev = el('img', { class: 'img-prev', alt: '' }); if (v) prev.src = v;
      var url = el('input', { type: 'text', dir: 'ltr' }); url.value = v || '';
      url.addEventListener('input', function () { set(url.value); prev.src = url.value; });
      var file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', hidden: '' });
      file.addEventListener('change', function () {
        var fl = file.files[0]; if (!fl) return;
        if (fl.size > 5 * 1024 * 1024) { alert('حداکثر ۵ مگابایت'); return; }
        var rd = new FileReader();
        rd.onload = function () {
          status('در حال بارگذاری…');
          api('POST', 'upload', { data: rd.result }).then(function (r) { url.value = r.url; prev.src = r.url; set(r.url); })
            .catch(function (e) { status(e.message, 'bad'); });
        };
        rd.readAsDataURL(fl);
      });
      var up = el('button', { class: 'btn', type: 'button', onclick: function () { file.click(); } }, [el('i', { class: 'fa-solid fa-upload' }), document.createTextNode('بارگذاری')]);
      wrap.appendChild(el('div', { class: 'row' }, [prev, url, up, file]));
    } else {
      inp = el('input', { type: 'text' }); inp.value = v == null ? '' : v;
      inp.addEventListener('input', function () { set(inp.value); });
      wrap.appendChild(inp);
    }
    return wrap;
  }


  // ── ویرایشگرِ متن با نوارِ قالب‌بندی و پیش‌نمایش ─────────────────────────
  function mdEditor(obj, key) {
    var ta = el('textarea', { class: 'big' });
    ta.value = obj[key] == null ? '' : obj[key];
    var prev = el('div', { class: 'md-prev', 'data-site-public': '' });
    var prevBody = el('div', { class: 'body' });
    prev.appendChild(el('div', { class: 'article' }, [prevBody]));
    var timer = 0;
    function refresh() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        api('POST', 'preview', { body: ta.value }).then(function (r) { prevBody.innerHTML = r.html || '<p style="opacity:.5">(خالی)</p>'; }).catch(function () {});
      }, 250);
    }
    function changed() { obj[key] = ta.value; markDirty(); refresh(); }
    ta.addEventListener('input', changed);
    function wrapSel(before, after, ph) {
      var a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b) || ph;
      ta.value = ta.value.slice(0, a) + before + sel + after + ta.value.slice(b);
      ta.focus(); ta.setSelectionRange(a + before.length, a + before.length + sel.length); changed();
    }
    function linePrefix(pre, ph) {
      var a = ta.selectionStart, b = ta.selectionEnd;
      var ls = ta.value.lastIndexOf('\n', a - 1) + 1;
      var block = ta.value.slice(ls, b) || ph;
      var out = block.split('\n').map(function (l) { return pre + l.replace(/^(#{2,3}\s+|[-*]\s+|>\s?)/, ''); }).join('\n');
      var lead = ls > 0 && ta.value.slice(ls - 2, ls) !== '\n\n' ? '\n' : '';
      ta.value = ta.value.slice(0, ls) + lead + out + '\n' + ta.value.slice(b);
      ta.focus(); changed();
    }
    var tools = [
      ['fa-solid fa-heading', 'تیتر', function () { linePrefix('## ', 'تیتر'); }],
      ['fa-solid fa-font', 'زیرتیتر', function () { linePrefix('### ', 'زیرتیتر'); }],
      ['fa-solid fa-bold', 'پررنگ', function () { wrapSel('**', '**', 'متن پررنگ'); }],
      ['fa-solid fa-list-ul', 'فهرست', function () { linePrefix('- ', 'مورد'); }],
      ['fa-solid fa-quote-right', 'نقل‌قول', function () { linePrefix('> ', 'نقل‌قول'); }],
      ['fa-solid fa-link', 'لینک', function () {
        var u = prompt('نشانیِ لینک (مثل https://… یا /p/about):', 'https://');
        if (u) wrapSel('[', '](' + u.trim() + ')', 'متن لینک');
      }],
    ];
    var bar = el('div', { class: 'md-bar' }, tools.map(function (t) {
      return el('button', { class: 'btn sm', type: 'button', title: t[1], onclick: t[2] }, [el('i', { class: t[0] }), document.createTextNode(t[1])]);
    }));
    refresh();
    return el('div', { class: 'md-ed' }, [bar, el('div', { class: 'md-split' }, [ta, prev])]);
  }

  // ── مدیریتِ صفحات: فهرست ← ویرایشگرِ هر صفحه ─────────────────────────────
  var editPage = null;
  function pagesPanel(panel) {
    var list = Array.isArray(C.pages) ? C.pages : (C.pages = []);
    if (editPage !== null && list[editPage]) return pageEditor(panel, list[editPage]);
    editPage = null;
    panel.appendChild(el('div', { class: 'pages-top' }, [
      el('p', { class: 'muted', text: 'هر صفحه در نشانیِ /p/نشانی باز می‌شود. ترتیب این فهرست، ترتیبِ منو و فوتر است.' }),
      el('button', { class: 'btn primary', type: 'button', onclick: function () {
        list.push({ title: 'صفحهٔ تازه', slug: 'page-' + Date.now().toString(36), enabled: true, inMenu: false, inFooter: true, showContact: false, description: '', body: '' });
        editPage = list.length - 1; markDirty(); show('pages');
      } }, [el('i', { class: 'fa-solid fa-plus' }), document.createTextNode('صفحهٔ جدید')]),
    ]));
    var rerender = function () { show('pages'); };
    list.forEach(function (p, i) {
      var chips = el('div', { class: 'chips' }, [
        el('span', { class: 'chip ' + (p.enabled === false ? 'off' : 'on'), text: p.enabled === false ? 'غیرفعال' : 'فعال' }),
        p.inMenu ? el('span', { class: 'chip', text: 'منو' }) : null,
        p.inFooter ? el('span', { class: 'chip', text: 'فوتر' }) : null,
        p.showContact ? el('span', { class: 'chip', text: 'اطلاعات تماس' }) : null,
      ]);
      panel.appendChild(el('div', { class: 'page-row' }, [
        el('div', { class: 'page-info', onclick: function () { editPage = i; show('pages'); window.scrollTo(0, 0); } }, [
          el('b', { text: p.title || '(بی‌عنوان)' }), el('code', { text: '/p/' + (p.slug || '') }), chips]),
        el('div', { class: 'page-acts' }, [
          el('button', { class: 'btn sm', type: 'button', onclick: function () { editPage = i; show('pages'); window.scrollTo(0, 0); } }, [el('i', { class: 'fa-solid fa-pen' }), document.createTextNode('ویرایش')]),
          el('a', { class: 'btn sm', href: '/p/' + (p.slug || ''), target: '_blank', title: 'مشاهده' }, [el('i', { class: 'fa-solid fa-eye' })]),
          el('button', { class: 'btn sm', type: 'button', title: 'بالا', onclick: function () { if (i) { list.splice(i - 1, 0, list.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-up' })]),
          el('button', { class: 'btn sm', type: 'button', title: 'پایین', onclick: function () { if (i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-down' })]),
          el('button', { class: 'btn sm danger', type: 'button', title: 'حذف', onclick: function () { if (confirm('صفحهٔ «' + (p.title || '') + '» حذف شود؟')) { list.splice(i, 1); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-trash' })]),
        ]),
      ]));
    });
    if (!list.length) panel.appendChild(el('p', { class: 'muted', text: 'هنوز صفحه‌ای نیست؛ «صفحهٔ جدید» را بزنید.' }));
  }
  function pageEditor(panel, p) {
    $('#secTitle').textContent = 'ویرایش صفحه';
    panel.appendChild(el('div', { class: 'pages-top' }, [
      el('button', { class: 'btn', type: 'button', onclick: function () { editPage = null; show('pages'); } }, [el('i', { class: 'fa-solid fa-arrow-right' }), document.createTextNode('همهٔ صفحات')]),
      el('a', { class: 'btn', href: '/p/' + (p.slug || ''), target: '_blank' }, [el('i', { class: 'fa-solid fa-eye' }), document.createTextNode('مشاهده (پس از ذخیره)')]),
    ]));
    var noop = function () { show('pages'); };
    var grid = el('div', { class: 'grid2' }, [
      fieldEl(p, { k: 'title', l: 'عنوان صفحه' }, noop),
      fieldEl(p, { k: 'slug', l: 'نشانی (لاتین)', h: 'مثل terms ⇒ /p/terms' }, noop),
    ]);
    panel.appendChild(grid);
    panel.appendChild(fieldEl(p, { k: 'description', l: 'توضیح کوتاه برای گوگل (سئو)', t: 'textarea' }, noop));
    var toggles = el('div', { class: 'toggles' });
    [{ k: 'enabled', l: 'فعال' }, { k: 'inMenu', l: 'در منوی بالا' }, { k: 'inFooter', l: 'در فوتر' }, { k: 'showContact', l: 'اطلاعات تماس زیر متن' }]
      .forEach(function (f) { f.t = 'bool'; toggles.appendChild(fieldEl(p, f, noop)); });
    panel.appendChild(toggles);
    var w = el('div', { class: 'field' }, [el('span', { text: 'متن صفحه' })]);
    w.appendChild(mdEditor(p, 'body'));
    panel.appendChild(w);
  }

  function accountPanel(panel) {
    var cur = el('input', { type: 'password', autocomplete: 'current-password' });
    var nx = el('input', { type: 'password', autocomplete: 'new-password' });
    panel.appendChild(el('div', { class: 'card' }, [
      el('h3', { text: 'تغییر رمز عبور' }),
      el('div', { class: 'field' }, [el('span', { text: 'رمز فعلی' }), cur]),
      el('div', { class: 'field' }, [el('span', { text: 'رمز تازه (حداقل ۸ نویسه)' }), nx]),
      el('button', { class: 'btn primary', type: 'button', onclick: function () {
        api('POST', 'password', { current: cur.value, next: nx.value }).then(function () { status('رمز عوض شد', 'ok'); cur.value = nx.value = ''; })
          .catch(function (e) { status(e.message, 'bad'); });
      } }, [document.createTextNode('ذخیرهٔ رمز')]),
    ]));
    panel.appendChild(el('div', { class: 'card' }, [
      el('h3', { text: 'پشتیبان' }),
      el('div', { class: 'row', style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
        el('button', { class: 'btn', type: 'button', onclick: function () {
          var a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(C, null, 2)], { type: 'application/json' })), download: 'neuraeco-content.json' });
          document.body.appendChild(a); a.click(); a.remove();
        } }, [el('i', { class: 'fa-solid fa-download' }), document.createTextNode('دانلود محتوا')]),
        (function () {
          var f = el('input', { type: 'file', accept: 'application/json', hidden: '' });
          f.addEventListener('change', function () {
            var rd = new FileReader();
            rd.onload = function () { try { C = JSON.parse(rd.result); markDirty(); status('بارگذاری شد؛ «ذخیره» را بزنید', 'bad'); } catch (e) { alert('فایل نامعتبر'); } };
            rd.readAsText(f.files[0]);
          });
          return el('span', {}, [f, el('button', { class: 'btn', type: 'button', onclick: function () { f.click(); } }, [el('i', { class: 'fa-solid fa-upload' }), document.createTextNode('بازگردانی از فایل')])]);
        })(),
        el('button', { class: 'btn danger', type: 'button', onclick: function () {
          if (!confirm('همهٔ محتوا به حالت اولیه برگردد؟')) return;
          api('POST', 'reset').then(function (r) { C = r.content; dirty = false; status('به حالت اولیه برگشت', 'ok'); })
            .catch(function (e) { status(e.message, 'bad'); });
        } }, [el('i', { class: 'fa-solid fa-rotate-left' }), document.createTextNode('بازگشت به محتوای اولیه')]),
      ]),
    ]));
  }

  function show(id) {
    cur = id;
    var sec = SECTIONS.filter(function (s) { return s.id === id; })[0];
    $('#secTitle').textContent = sec.title;
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.dataset.id === id); });
    var panel = $('#panel'); panel.innerHTML = '';
    if (sec.help) panel.appendChild(el('div', { class: 'help', html: sec.help }));
    if (sec.custom === 'account') { accountPanel(panel); return; }
    if (sec.custom === 'pages') { pagesPanel(panel); return; }
    var y = window.scrollY;
    var rerender = function () { show(id); window.scrollTo(0, y); };
    var obj = objAt(sec.path);
    sec.fields.forEach(function (f) { panel.appendChild(fieldEl(obj, f, rerender)); });
    $('.side').classList.remove('open');
  }

  function boot() {
    var tabs = $('#tabs');
    SECTIONS.forEach(function (s) {
      tabs.appendChild(el('button', { type: 'button', 'data-id': s.id, onclick: function () { editPage = null; show(s.id); window.scrollTo(0, 0); } },
        [el('i', { class: s.icon }), document.createTextNode(s.title)]));
    });
    $('#menuBtn').onclick = function () { $('.side').classList.toggle('open'); };
    $('#save').onclick = function () {
      $('#save').disabled = true; status('در حال ذخیره…');
      api('PUT', 'content', { content: C }).then(function (r) { C = r.content; dirty = false; status('ذخیره شد ✓', 'ok'); show(cur); })
        .catch(function (e) { status(e.message, 'bad'); }).then(function () { $('#save').disabled = false; });
    };
    $('#logout').onclick = function () { api('POST', 'logout').then(function () { location.reload(); }); };
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    api('GET', 'content').then(function (r) { C = r.content; $('#app').hidden = false; show('site'); status(''); });
  }

  api('GET', 'me').then(function (r) {
    if (r.user) return boot();
    $('#login').hidden = false;
    if (!r.hasAdmin) $('#loginErr').textContent = 'هنوز سوپرادمین ساخته نشده؛ روی سرور: node server.js set-admin USER PASS';
  });
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    api('POST', 'login', { user: fd.get('user'), pass: fd.get('pass') })
      .then(function () { $('#login').hidden = true; boot(); })
      .catch(function (er) { $('#loginErr').textContent = er.message; });
  });
})();
