// سوپرادمینِ سایتِ نورا — فرم‌ها از روی یک شِما ساخته می‌شوند.
(function () {
  var C = null, dirty = false, cur = 'dash';
  var $ = function (s) { return document.querySelector(s); };

  function api(method, route, body) {
    return fetch('/admin/api/' + route, {
      method: method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'neuraeco' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
  }
  function status(t, cls) { var s = $('#status'); s.textContent = t; s.className = 'status ' + (cls || ''); }
  function markDirty() { dirty = true; status('تغییرات ذخیره نشده', 'bad'); window.dispatchEvent(new Event('neura:dirty')); }

  var ICON_HELP = 'کلاس Font Awesome، مثل fa-solid fa-phone';
  var SECTIONS = [
    { id: 'dash', title: 'داشبورد', icon: 'fa-solid fa-chart-line', custom: 'dash' },
    { id: 'messages', title: 'پیام‌ها', icon: 'fa-solid fa-inbox', custom: 'messages' },
    { id: 'site', title: 'تنظیمات کلی', icon: 'fa-solid fa-gear', groups: [
      { title: 'هویت و سئو', path: ['site'], fields: [
        { k: 'name', l: 'نام سایت' }, { k: 'brand', l: 'متن کنار لوگو' },
        { k: 'logo', l: 'لوگو (رنگش در «ظاهر و گرافیک»)', t: 'image' },
        { k: 'title', l: 'عنوان صفحهٔ اصلی (سئو)' }, { k: 'description', l: 'توضیح سایت (سئو)', t: 'textarea' },
        { k: 'ogImage', l: 'تصویر اشتراک‌گذاری (شبکه‌های اجتماعی)', t: 'image' },
        { k: 'baseUrl', l: 'نشانی کامل سایت', h: 'مثل https://neuraeco.ir — برای canonical و sitemap' },
      ] },
      { title: 'نوار اطلاع‌رسانی بالای سایت', path: ['site', 'announce'], fields: [
        { k: 'enabled', l: 'نمایش نوار', t: 'bool' }, { k: 'text', l: 'متن' }, { k: 'link', l: 'لینک (اختیاری)', h: 'مثل /p/about یا https://…' },
      ] },
      { title: 'منو و تم', path: ['site'], fields: [
        { k: 'homeLabel', l: 'نام «خانه» در منو', ph: 'خانه' },
        { k: 'defaultTheme', l: 'تم پیش‌فرض', t: 'select', o: [['auto', 'خودکار (تنظیم دستگاه)'], ['light', 'روشن'], ['dark', 'تیره']] },
        { k: 'showThemeToggle', l: 'دکمهٔ تغییر تم برای بازدیدکننده', t: 'bool', def: true },
        { k: 'menuLinks', l: 'لینک‌های اضافهٔ منو (صفحه‌ها خودکار می‌آیند)', t: 'list', title: 'label', item: [
          { k: 'label', l: 'متن' }, { k: 'url', l: 'لینک' }, { k: 'newTab', l: 'باز شدن در تب جدید', t: 'bool' }, { k: 'highlight', l: 'به‌شکل دکمه', t: 'bool' }] },
      ] },
      { title: 'فوتر', path: ['site'], fields: [
        { k: 'footerAbout', l: 'متن معرفی فوتر', t: 'textarea' },
        { k: 'footerSocials', l: 'آیکن شبکه‌های اجتماعی در فوتر (آن‌هایی که لینک دارند)', t: 'bool', def: true },
        { k: 'footerLinksTitle', l: 'عنوان ستون لینک‌ها', ph: 'دسترسی سریع' }, { k: 'footerContactTitle', l: 'عنوان ستون تماس', ph: 'تماس' },
        { k: 'footerLinks', l: 'لینک‌های اضافهٔ فوتر', t: 'list', title: 'label', item: [{ k: 'label', l: 'متن' }, { k: 'url', l: 'لینک' }] },
        { k: 'copyright', l: 'متن کپی‌رایت' }, { k: 'madeIn', l: 'متن پایین فوتر' },
      ] },
      { title: 'دکمه‌های شناور تماس (گوشهٔ صفحه)', path: ['site', 'floating'], fields: [
        { k: 'enabled', l: 'نمایش', t: 'bool' }, { k: 'whatsapp', l: 'شمارهٔ واتساپ', h: 'مثل 989121234567' },
        { k: 'telegram', l: 'آیدی تلگرام', h: 'مثل neura_support' }, { k: 'phone', l: 'شمارهٔ تماس' },
      ] },
      { title: 'صفحهٔ ۴۰۴ و حالت تعمیر', path: ['site'], fields: [
        { k: 'notFoundTitle', l: 'عنوان صفحهٔ پیدا نشد', ph: 'صفحه پیدا نشد' }, { k: 'notFoundText', l: 'متن صفحهٔ پیدا نشد' },
        { k: 'maintenance', l: 'حالت تعمیر (سایت برای بازدیدکننده بسته؛ شما که وارد ادمین هستید سایت را می‌بینید)', t: 'bool' },
        { k: 'maintenanceTitle', l: 'عنوان حالت تعمیر', ph: 'به‌زودی برمی‌گردیم' }, { k: 'maintenanceText', l: 'متن حالت تعمیر' },
      ] },
      { title: 'کدهای اضافه', path: ['site'], fields: [
        { k: 'bodyHtml', l: 'کد پایان صفحه (چت آنلاین، آمار و …)', t: 'code' },
      ] },
    ] },
    { id: 'enamad', title: 'اینماد و نمادها', icon: 'fa-solid fa-certificate', path: ['site'], help:
      'کدِ نمادی که اینماد (یا ساماندهی) می‌دهد را عیناً در کادرِ اول بگذارید — در فوترِ همهٔ صفحات نمایش داده می‌شود. ' +
      'اگر اینماد برای تأییدِ مالکیت یک تگِ <code>&lt;meta&gt;</code> داد، در کادرِ دوم بگذارید (داخلِ head همهٔ صفحات می‌رود).', fields: [
      { k: 'enamadHtml', l: 'کد نماد (فوتر)', t: 'code' },
      { k: 'headHtml', l: 'کد داخل head (متای تأیید، آمار و …)', t: 'code' },
    ] },
    { id: 'design', title: 'ظاهر و گرافیک', icon: 'fa-solid fa-palette', custom: 'design' },
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
      { k: 'order', l: 'ترتیب بخش‌های صفحهٔ اصلی', t: 'order' },
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
      { k: 'formEnabled', l: 'فرم «ارسال پیام» زیر اطلاعات تماس (پیام‌ها در منوی «پیام‌ها» می‌آیند)', t: 'bool' },
      { k: 'formTitle', l: 'عنوان فرم', ph: 'ارسال پیام' }, { k: 'formSubmit', l: 'متن دکمه', ph: 'ارسال' },
      { k: 'formOk', l: 'پیام پس از ارسال', ph: 'پیام شما ثبت شد؛ به‌زودی با شما تماس می‌گیریم.' },
    ] },
    { id: 'pages', title: 'صفحات', icon: 'fa-solid fa-file-lines', custom: 'pages' },
    { id: 'media', title: 'رسانه‌ها', icon: 'fa-solid fa-images', custom: 'media' },
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
      if (v === undefined && (/^show/.test(f.k) || f.def === true)) cb.checked = true;
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
    if (t === 'order') {
      var NAMES = { agents: 'ایجنت‌ها', about: 'معرفی', custom: 'بخش‌های دلخواه', contact: 'اطلاعات تماس' };
      var ord = (Array.isArray(v) ? v : []).filter(function (x) { return NAMES[x]; });
      Object.keys(NAMES).forEach(function (x) { if (ord.indexOf(x) < 0) ord.push(x); });
      obj[f.k] = ord;
      var box = el('div', { class: 'order' });
      ord.forEach(function (x, i) {
        box.appendChild(el('div', { class: 'order-row' }, [
          el('span', { class: 'n', text: String(i + 1) }), el('b', { text: NAMES[x] }),
          el('button', { class: 'btn sm', type: 'button', onclick: function () { if (i) { ord.splice(i - 1, 0, ord.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-up' })]),
          el('button', { class: 'btn sm', type: 'button', onclick: function () { if (i < ord.length - 1) { ord.splice(i + 1, 0, ord.splice(i, 1)[0]); markDirty(); rerender(); } } }, [el('i', { class: 'fa-solid fa-arrow-down' })]),
        ]));
      });
      wrap.appendChild(el('small', { class: 'muted', text: 'بخش اول صفحه (تیتر و تصویر) همیشه بالاست.' }));
      wrap.appendChild(box);
      return wrap;
    }
    if (t === 'number') {
      inp = el('input', { type: 'number', min: f.min, max: f.max, step: f.step || 1, dir: 'ltr' });
      inp.value = v == null ? '' : v;
      inp.addEventListener('input', function () { set(Number(inp.value)); });
      wrap.appendChild(inp); return wrap;
    }
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
      var txt = el('input', { type: 'text', dir: 'ltr', placeholder: 'خودکار' }); txt.value = v || '';
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
      var lib = el('button', { class: 'btn', type: 'button', title: 'انتخاب از رسانه‌ها', onclick: function () {
        pickMedia(function (u) { url.value = u; prev.src = u; set(u); });
      } }, [el('i', { class: 'fa-solid fa-images' })]);
      var clr = el('button', { class: 'btn', type: 'button', title: 'حذف تصویر', onclick: function () { url.value = ''; prev.removeAttribute('src'); set(''); } }, [el('i', { class: 'fa-solid fa-xmark' })]);
      wrap.appendChild(el('div', { class: 'row' }, [prev, url, up, lib, clr, file]));
    } else {
      inp = el('input', { type: 'text', placeholder: f.ph || '' }); inp.value = v == null ? '' : v;
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
          el('button', { class: 'btn sm', type: 'button', title: 'کپی از این صفحه', onclick: function () {
            var cp = JSON.parse(JSON.stringify(p)); cp.title = (p.title || '') + ' (کپی)'; cp.slug = (p.slug || 'page') + '-copy-' + Date.now().toString(36).slice(-4); cp.inMenu = false;
            list.splice(i + 1, 0, cp); markDirty(); rerender();
          } }, [el('i', { class: 'fa-solid fa-copy' })]),
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
    panel.appendChild(el('div', { class: 'grid2' }, [
      fieldEl(p, { k: 'cover', l: 'تصویر بالای صفحه (اختیاری)', t: 'image' }, noop),
      fieldEl(p, { k: 'width', l: 'عرض متن', t: 'select', o: [['narrow', 'باریک (خواناتر)'], ['wide', 'تمام‌عرض']] }, noop),
    ]));
    var toggles = el('div', { class: 'toggles' });
    [{ k: 'enabled', l: 'فعال' }, { k: 'inMenu', l: 'در منوی بالا' }, { k: 'inFooter', l: 'در فوتر' }, { k: 'showContact', l: 'اطلاعات تماس زیر متن' }]
      .forEach(function (f) { f.t = 'bool'; toggles.appendChild(fieldEl(p, f, noop)); });
    panel.appendChild(toggles);
    var w = el('div', { class: 'field' }, [el('span', { text: 'متن صفحه' })]);
    w.appendChild(mdEditor(p, 'body'));
    panel.appendChild(w);
  }


  // ── ظاهر و گرافیک: طرح‌های آماده + تنظیمات + پیش‌نمایشِ زندهٔ تغییراتِ ذخیره‌نشده ──
  var META = null, prevSlug = '', prevDevice = 'desktop';
  function designPanel(panel) {
    if (!META) {
      panel.appendChild(el('p', { class: 'muted', text: 'در حال بارگذاری…' }));
      api('GET', 'design-meta').then(function (m) { META = m; show('design'); });
      return;
    }
    var D = C.design || (C.design = {});
    Object.keys(META.defaults).forEach(function (k) { if (D[k] === undefined) D[k] = META.defaults[k]; });
    panel.classList.add('wide');
    var form = el('div', { class: 'design-form' });
    var side = el('div', { class: 'design-prev' });
    panel.appendChild(el('div', { class: 'design-grid' }, [form, side]));
    var re = function () { var y = window.scrollY; show('design'); window.scrollTo(0, y); };

    var presets = el('div', { class: 'presets' });
    Object.keys(META.presets).forEach(function (id) {
      var pr = META.presets[id];
      presets.appendChild(el('button', { type: 'button', class: 'preset' + (D.preset === id ? ' on' : ''), onclick: function () {
        Object.keys(pr).forEach(function (k) { if (k !== 'title') D[k] = pr[k]; });
        D.preset = id; if (C.home) C.home.heroAccent = pr.brand; markDirty(); re();
      } }, [
        el('span', { class: 'sw' }, [pr.brand, pr.accent, pr.bgLight, pr.bgDark].map(function (c) { return el('i', { style: 'background:' + c }); })),
        el('b', { text: pr.title }),
      ]));
    });
    form.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'طرح‌های آماده' }), el('p', { class: 'muted', text: 'یکی را بزنید، بعد هر جزئی را پایین‌تر عوض کنید.' }), presets]));

    function group(title, fields) {
      var box = el('div', { class: 'card' }, [el('h3', { text: title })]);
      var g = el('div', { class: 'grid2' });
      fields.forEach(function (f) { (f.full ? box : g).appendChild(fieldEl(D, f, re)); });
      box.insertBefore(g, box.children[1] || null);
      form.appendChild(box);
    }
    // لوگو
    (function () {
      var box = el('div', { class: 'card' }, [el('h3', { text: 'لوگو' })]);
      var logoSrc = (C.site && C.site.logo) || '/assets/img/neura-logo-gradient.png';
      var pv = el('div', { class: 'logo-pv' });
      function paint() {
        var c1 = D.logoColor1 || D.brand, c2 = D.logoColor2 || D.accent, bg = '';
        if (D.logoMode === 'solid') bg = c1; else if (D.logoMode === 'gradient') bg = 'linear-gradient(' + (D.logoAngle || 135) + 'deg,' + c1 + ',' + c2 + ')'; else if (D.logoMode === 'brand') bg = D.brand;
        pv.innerHTML = '';
        [['#ffffff', D.inkLight || '#171422'], [D.bgDark || '#15131A', D.inkDark || '#fff']].forEach(function (th) {
          var mark = D.logoMode === 'original' ? el('img', { src: logoSrc, alt: '' })
            : el('span', { class: 'mm', style: '-webkit-mask-image:url(' + logoSrc + ');mask-image:url(' + logoSrc + ');background:' + bg });
          mark.style.width = mark.style.height = Math.min(64, D.logoSize || 48) + 'px';
          var txt = D.logoText === false ? null : el('b', { text: (C.site && C.site.brand) || '', style: 'color:' + (D.logoTextColor || th[1]) + ';font-size:' + Math.min(26, D.logoTextSize || 19) + 'px' + (D.logoFont === 'site' ? ';font-family:inherit;font-weight:800' : '') });
          pv.appendChild(el('div', { class: 'lp', style: 'background:' + th[0] }, [mark, txt]));
        });
      }
      var g = el('div', { class: 'grid2' });
      var onCh = function () { paint(); };
      [
        { k: 'logoMode', l: 'رنگ لوگو', t: 'select', o: [['original', 'رنگ اصلی تصویر'], ['brand', 'رنگ اصلی سایت'], ['solid', 'یک رنگ دلخواه'], ['gradient', 'گرادیان دلخواه']] },
        { k: 'logoSize', l: 'اندازهٔ لوگو (px)', t: 'number', min: 24, max: 96 },
        { k: 'logoColor1', l: 'رنگ اول (خالی = رنگ اصلی)', t: 'color' }, { k: 'logoColor2', l: 'رنگ دوم گرادیان', t: 'color' },
        { k: 'logoAngle', l: 'زاویهٔ گرادیان (درجه)', t: 'number', min: 0, max: 360, step: 15 },
        { k: 'logoText', l: 'نمایش متن کنار لوگو', t: 'bool' },
        { k: 'logoTextColor', l: 'رنگ متن لوگو (خالی = رنگ متن)', t: 'color' },
        { k: 'logoTextSize', l: 'اندازهٔ متن لوگو (px)', t: 'number', min: 12, max: 36 },
        { k: 'logoFont', l: 'فونت متن لوگو', t: 'select', o: [['neogrey', 'لاتین نورا (Neogrey)'], ['site', 'فونت سایت']] },
      ].forEach(function (f) { g.appendChild(fieldEl(D, f, re)); });
      box.appendChild(pv); box.appendChild(g);
      box.appendChild(el('p', { class: 'muted', text: 'تصویر لوگو را از «تنظیمات کلی» عوض کنید. برای رنگ‌پذیری، لوگو باید PNG با پس‌زمینهٔ شفاف باشد.' }));
      form.appendChild(box);
      paint();
      box.addEventListener('input', function () { setTimeout(onCh, 0); });
      box.addEventListener('change', function () { setTimeout(onCh, 0); });
    })();
    group('رنگ‌ها', [
      { k: 'brand', l: 'رنگ اصلی', t: 'color' }, { k: 'accent', l: 'رنگ مکمل', t: 'color' },
      { k: 'accent2', l: 'رنگ مکمل دوم', t: 'color' },
      { k: 'bgLight', l: 'پس‌زمینه (تم روشن)', t: 'color' }, { k: 'inkLight', l: 'متن (تم روشن)', t: 'color' },
      { k: 'bgDark', l: 'پس‌زمینه (تم تیره)', t: 'color' }, { k: 'inkDark', l: 'متن (تم تیره)', t: 'color' },
    ]);
    group('فونت و اندازه', [
      { k: 'font', l: 'فونت', t: 'select', o: [['kamand', 'کمند (فونت نورا)'], ['vazir', 'وزیرمتن'], ['system', 'فونت سیستم']] },
      { k: 'fontSize', l: 'اندازهٔ متن (px)', t: 'number', min: 12, max: 20 },
      { k: 'width', l: 'حداکثر عرض صفحه (px)', t: 'number', min: 900, max: 1600, step: 20 },
    ]);
    group('شکل و سبک', [
      { k: 'radius', l: 'گوشه‌ها', t: 'select', o: [['round', 'خیلی گرد'], ['soft', 'کمی گرد'], ['sharp', 'تیز']] },
      { k: 'buttons', l: 'دکمه‌ها', t: 'select', o: [['glass', 'شیشه‌ای'], ['solid', 'توپر'], ['outline', 'خطی']] },
      { k: 'cardStyle', l: 'کارت‌ها', t: 'select', o: [['soft', 'ملایم'], ['border', 'با حاشیه'], ['shadow', 'با سایه']] },
      { k: 'headerStyle', l: 'نوار بالا', t: 'select', o: [['glass', 'شیشه‌ای'], ['solid', 'توپر']] },
      { k: 'blobs', l: 'لکه‌های رنگیِ پس‌زمینه', t: 'bool' },
    ]);
    group('صفحهٔ اصلی', [
      { k: 'heroImage', l: 'جای تصویر اصلی', t: 'select', o: [['left', 'چپ'], ['right', 'راست'], ['none', 'بدون تصویر']] },
      { k: 'heroStyle', l: 'سبک تصویر', t: 'select', o: [['spectrum', 'دایره با هالهٔ متحرک'], ['plain', 'تصویر ساده']] },
      { k: 'heroSize', l: 'اندازهٔ تصویر (px)', t: 'number', min: 200, max: 480, step: 10 },
      { k: 'agentCols', l: 'ستون‌های کارت ایجنت', t: 'select', o: [['auto', 'خودکار'], ['2', '۲'], ['3', '۳'], ['4', '۴']] },
    ]);
    group('آیکن و CSS دلخواه', [
      { k: 'favicon', l: 'آیکن تب مرورگر (favicon)', t: 'image', full: true },
      { k: 'customCss', l: 'CSS دلخواه (برای تغییرات پیشرفته)', t: 'code', full: true, h: 'انتخابگرها را با [data-site-public] شروع کنید' },
    ]);
    form.appendChild(el('button', { class: 'btn danger', type: 'button', onclick: function () {
      if (!confirm('ظاهر به حالت اولیه برگردد؟')) return;
      C.design = JSON.parse(JSON.stringify(META.defaults)); markDirty(); re();
    } }, [el('i', { class: 'fa-solid fa-rotate-left' }), document.createTextNode('ظاهرِ پیش‌فرض')]));

    // پیش‌نمایش
    var sel = el('select', { onchange: function () { prevSlug = sel.value; load(); } },
      [el('option', { value: '', text: 'صفحهٔ اصلی' })].concat((C.pages || []).filter(function (p) { return p.slug; })
        .map(function (p) { return el('option', { value: p.slug, text: p.title }); })));
    sel.value = prevSlug;
    var devBtns = el('div', { class: 'dev' }, [['desktop', 'fa-solid fa-desktop'], ['mobile', 'fa-solid fa-mobile-screen']].map(function (d) {
      return el('button', { type: 'button', class: 'btn sm' + (prevDevice === d[0] ? ' primary' : ''), onclick: function () { prevDevice = d[0]; re(); } }, [el('i', { class: d[1] })]);
    }));
    var frame = el('iframe', { sandbox: 'allow-scripts', class: 'pv-frame ' + prevDevice, title: 'پیش‌نمایش' });
    side.appendChild(el('div', { class: 'pv-bar' }, [el('b', { text: 'پیش‌نمایش زنده' }), sel, devBtns]));
    side.appendChild(el('div', { class: 'pv-wrap ' + prevDevice }, [frame]));
    side.appendChild(el('p', { class: 'muted', text: 'تغییرات قبل از ذخیره همین‌جا دیده می‌شوند؛ برای اعمال روی سایت «ذخیره» را بزنید.' }));
    function fit() {
      var w = frame.parentNode;
      if (!w) return;
      if (prevDevice === 'desktop') {
        var sc = Math.min(1, w.clientWidth / 1280);
        frame.style.width = '1280px'; frame.style.height = (w.clientHeight / sc) + 'px';
        frame.style.transform = 'scale(' + sc + ')'; frame.style.transformOrigin = 'top right';
      } else { frame.style.width = ''; frame.style.height = ''; frame.style.transform = ''; }
    }
    setTimeout(fit, 0);
    if (designPanel._r) window.removeEventListener('resize', designPanel._r);
    designPanel._r = fit; window.addEventListener('resize', fit);
    var t = 0;
    function load() {
      clearTimeout(t);
      t = setTimeout(function () {
        api('POST', 'preview-page', { content: C, slug: prevSlug }).then(function (r) { frame.srcdoc = r.html; }).catch(function (e) { status(e.message, 'bad'); });
      }, 350);
    }
    if (designPanel._h) window.removeEventListener('neura:dirty', designPanel._h);
    designPanel._h = function () { if (cur === 'design') load(); };
    window.addEventListener('neura:dirty', designPanel._h);
    load();
  }


  // ── داشبورد ───────────────────────────────────────────────────────────────
  var FA_D = '۰۱۲۳۴۵۶۷۸۹';
  function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return FA_D[+d]; }); }
  function jdate(iso) { try { return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }); } catch (e) { return iso; } }
  function jdt(iso) { try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }
  function dashPanel(panel) {
    panel.appendChild(el('p', { class: 'muted', text: 'در حال بارگذاری…' }));
    api('GET', 'dashboard').then(function (d) {
      panel.innerHTML = '';
      var v = d.days.map(function (x) { return x.views; });
      var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
      var kpis = [['امروز', v[v.length - 1]], ['دیروز', v[v.length - 2]], ['۷ روز اخیر', sum(v.slice(-7))], ['۳۰ روز اخیر', sum(v)]];
      panel.appendChild(el('div', { class: 'kpis' }, kpis.map(function (k) {
        return el('div', { class: 'kpi' }, [el('span', { text: k[0] }), el('b', { text: fa(k[1] || 0) }), el('small', { text: 'بازدید' })]);
      }).concat([el('div', { class: 'kpi link', onclick: function () { show('messages'); } }, [el('span', { text: 'پیام‌های خوانده‌نشده' }), el('b', { text: fa(d.unread) }), el('small', { text: 'از ' + fa(d.messages) + ' پیام' })])])));
      var max = Math.max.apply(null, v.concat([1]));
      var chart = el('div', { class: 'bars' }, d.days.map(function (x) {
        return el('div', { class: 'bar', title: jdate(x.day) + ' — ' + fa(x.views) + ' بازدید' }, [el('i', { style: 'height:' + Math.max(2, Math.round(x.views / max * 100)) + '%' })]);
      }));
      panel.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'بازدید ۳۰ روز اخیر' }), chart,
        el('div', { class: 'bars-x' }, [el('span', { text: jdate(d.days[0].day) }), el('span', { text: jdate(d.days[d.days.length - 1].day) })])]));
      panel.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'پربازدیدترین صفحه‌ها (۳۰ روز)' })].concat(d.top.length ? d.top.map(function (t) {
        return el('div', { class: 'toprow' }, [el('a', { href: t.path, target: '_blank', text: t.path }), el('b', { text: fa(t.views) })]);
      }) : [el('p', { class: 'muted', text: 'هنوز بازدیدی ثبت نشده است.' })])));
      panel.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'دسترسی سریع' }), el('div', { class: 'quick' }, [
        el('a', { class: 'btn', href: '/', target: '_blank' }, [el('i', { class: 'fa-solid fa-globe' }), document.createTextNode('مشاهدهٔ سایت')]),
        el('a', { class: 'btn', href: '/sitemap.xml', target: '_blank' }, [el('i', { class: 'fa-solid fa-sitemap' }), document.createTextNode('نقشهٔ سایت (sitemap)')]),
        el('button', { class: 'btn', type: 'button', onclick: function () { show('pages'); } }, [el('i', { class: 'fa-solid fa-file-circle-plus' }), document.createTextNode('مدیریت صفحات')]),
        el('button', { class: 'btn', type: 'button', onclick: function () { show('design'); } }, [el('i', { class: 'fa-solid fa-palette' }), document.createTextNode('ظاهر سایت')]),
      ])]));
      panel.appendChild(el('p', { class: 'muted', text: 'آمار بدون کوکی و بدون ربات‌ها شمرده می‌شود و هر دقیقه ذخیره می‌شود.' }));
    }).catch(function (e) { status(e.message, 'bad'); });
  }

  // ── پیام‌ها ───────────────────────────────────────────────────────────────
  function setBadge(n) { var b = document.querySelector('#tabs button[data-id=messages] .badge'); if (b) { b.textContent = n ? fa(n) : ''; b.hidden = !n; } }
  function refreshBadge() { api('GET', 'dashboard').then(function (d) { setBadge(d.unread); }).catch(function () {}); }
  function messagesPanel(panel) {
    panel.appendChild(el('p', { class: 'muted', text: 'در حال بارگذاری…' }));
    var q = '';
    function draw(all) {
      panel.innerHTML = '';
      var search = el('input', { type: 'text', placeholder: 'جست‌وجو در نام، شماره یا متن…', class: 'search' });
      search.value = q;
      var listBox = el('div');
      function paint() {
        listBox.innerHTML = '';
        var shown = all.filter(function (m) { return !q || (m.name + ' ' + m.phone + ' ' + m.msg).indexOf(q) >= 0; });
        if (!shown.length) listBox.appendChild(el('p', { class: 'muted', text: all.length ? 'چیزی پیدا نشد.' : 'هنوز پیامی نرسیده است. فرم را از «اطلاعات تماس» روشن کنید.' }));
        shown.forEach(function (m) {
          var act = function (a) { api('POST', 'messages', { action: a, ids: [m.id] }).then(function (r) { all = r.messages; paint(); setBadge(all.filter(function (x) { return !x.read; }).length); }); };
          listBox.appendChild(el('div', { class: 'msg-row' + (m.read ? '' : ' unread') }, [
            el('div', { class: 'msg-head' }, [el('b', { text: m.name }), el('a', { href: 'tel:' + m.phone, dir: 'ltr', text: m.phone }), el('span', { class: 'muted', text: jdt(m.at) })]),
            el('p', { text: m.msg }),
            el('div', { class: 'msg-acts' }, [
              el('button', { class: 'btn sm', type: 'button', onclick: function () { act(m.read ? 'unread' : 'read'); } }, [el('i', { class: m.read ? 'fa-solid fa-envelope' : 'fa-solid fa-envelope-open' }), document.createTextNode(m.read ? 'خوانده‌نشده' : 'خوانده شد')]),
              el('button', { class: 'btn sm danger', type: 'button', onclick: function () { if (confirm('این پیام حذف شود؟')) act('delete'); } }, [el('i', { class: 'fa-solid fa-trash' }), document.createTextNode('حذف')]),
            ]),
          ]));
        });
      }
      search.addEventListener('input', function () { q = search.value.trim(); paint(); });
      var unread = all.filter(function (m) { return !m.read; }).map(function (m) { return m.id; });
      panel.appendChild(el('div', { class: 'pages-top' }, [search,
        el('button', { class: 'btn', type: 'button', onclick: function () {
          if (!unread.length) return;
          api('POST', 'messages', { action: 'read', ids: unread }).then(function (r) { setBadge(0); draw(r.messages); });
        } }, [el('i', { class: 'fa-solid fa-check-double' }), document.createTextNode('همه خوانده شد')]),
        el('button', { class: 'btn', type: 'button', onclick: function () {
          var rows = [['تاریخ', 'نام', 'شماره', 'پیام']].concat(all.map(function (m) { return [jdt(m.at), m.name, m.phone, m.msg]; }));
          var csv = '﻿' + rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
          var a = el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'messages.csv' });
          document.body.appendChild(a); a.click(); a.remove();
        } }, [el('i', { class: 'fa-solid fa-file-excel' }), document.createTextNode('خروجی اکسل')]),
      ]));
      panel.appendChild(listBox);
      paint();
    }
    api('GET', 'messages').then(function (r) { draw(r.messages); }).catch(function (e) { status(e.message, 'bad'); });
  }

  // ── رسانه‌ها ──────────────────────────────────────────────────────────────
  function uploadFile(fl) {
    return new Promise(function (ok, bad) {
      if (fl.size > 5 * 1024 * 1024) return bad(new Error('حداکثر ۵ مگابایت'));
      var rd = new FileReader();
      rd.onload = function () { api('POST', 'upload', { data: rd.result }).then(function (r) { ok(r.url); }, bad); };
      rd.readAsDataURL(fl);
    });
  }
  function mediaGrid(onPick, onDone) {
    var wrap = el('div');
    var file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', multiple: '', hidden: '' });
    var grid = el('div', { class: 'media-grid' });
    function load() {
      grid.innerHTML = '';
      api('GET', 'media').then(function (r) {
        var items = r.files.concat(r.builtin);
        if (!items.length) grid.appendChild(el('p', { class: 'muted', text: 'هنوز تصویری بارگذاری نشده.' }));
        items.forEach(function (f) {
          var acts = [];
          if (onPick) acts.push(el('button', { class: 'btn sm primary', type: 'button', onclick: function () { onPick(f.url); } }, [document.createTextNode('انتخاب')]));
          acts.push(el('button', { class: 'btn sm', type: 'button', title: 'کپی نشانی', onclick: function () {
            try { navigator.clipboard.writeText(f.url); status('نشانی کپی شد', 'ok'); } catch (e) { prompt('نشانی:', f.url); }
          } }, [el('i', { class: 'fa-solid fa-link' })]));
          if (!f.builtin && !onPick) acts.push(el('button', { class: 'btn sm danger', type: 'button', title: 'حذف', onclick: function () {
            if (confirm('این تصویر حذف شود؟')) api('POST', 'media-delete', { name: f.name }).then(load).catch(function (e) { alert(e.message); });
          } }, [el('i', { class: 'fa-solid fa-trash' })]));
          grid.appendChild(el('div', { class: 'media-item' }, [el('img', { src: f.url, alt: '', loading: 'lazy' }),
            el('small', { text: f.builtin ? 'تصویر پیش‌فرض' : (Math.round(f.size / 1024) + ' KB') }), el('div', { class: 'media-acts' }, acts)]));
        });
      });
    }
    file.addEventListener('change', function () {
      var fs = Array.prototype.slice.call(file.files);
      status('در حال بارگذاری…');
      Promise.all(fs.map(uploadFile)).then(function (urls) { status('بارگذاری شد', 'ok'); if (onPick && urls.length === 1) onPick(urls[0]); else load(); })
        .catch(function (e) { status(e.message, 'bad'); load(); });
    });
    wrap.appendChild(el('div', { class: 'pages-top' }, [el('p', { class: 'muted', text: 'PNG، JPG، WEBP یا GIF تا ۵ مگابایت. تصویری که در سایت استفاده شده حذف نمی‌شود.' }),
      el('button', { class: 'btn primary', type: 'button', onclick: function () { file.click(); } }, [el('i', { class: 'fa-solid fa-upload' }), document.createTextNode('بارگذاری تصویر')]), file]));
    wrap.appendChild(grid);
    load();
    return wrap;
  }
  function mediaPanel(panel) { panel.appendChild(mediaGrid(null)); }
  function pickMedia(cb) {
    var ov = el('div', { class: 'modal' });
    var close = function () { ov.remove(); };
    ov.appendChild(el('div', { class: 'modal-box' }, [
      el('div', { class: 'modal-head' }, [el('b', { text: 'انتخاب تصویر' }), el('button', { class: 'btn sm', type: 'button', onclick: close }, [el('i', { class: 'fa-solid fa-xmark' })])]),
      mediaGrid(function (u) { cb(u); close(); }),
    ]));
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov);
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
    var bk = el('div', { class: 'card' }, [el('h3', { text: 'نسخه‌های قبلی (پشتیبان خودکار هر ذخیره، ۳۰ نسخهٔ آخر)' })]);
    panel.appendChild(bk);
    api('GET', 'backups').then(function (r) {
      if (!r.backups.length) { bk.appendChild(el('p', { class: 'muted', text: 'هنوز نسخه‌ای نیست؛ با اولین ذخیره ساخته می‌شود.' })); return; }
      r.backups.forEach(function (b) {
        bk.appendChild(el('div', { class: 'toprow' }, [el('span', { text: jdt(b.at) + (/before-/.test(b.name) ? ' (پیش از بازگردانی)' : '') }),
          el('button', { class: 'btn sm', type: 'button', onclick: function () {
            if (!confirm('محتوای سایت به این نسخه برگردد؟ (نسخهٔ فعلی هم پشتیبان می‌شود)')) return;
            api('POST', 'restore', { name: b.name }).then(function (x) { C = x.content; dirty = false; status('بازگردانی شد ✓', 'ok'); show('account'); })
              .catch(function (e) { status(e.message, 'bad'); });
          } }, [el('i', { class: 'fa-solid fa-clock-rotate-left' }), document.createTextNode('بازگردانی')])]));
      });
    });
  }

  function show(id) {
    cur = id;
    var sec = SECTIONS.filter(function (s) { return s.id === id; })[0];
    $('#secTitle').textContent = sec.title;
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.dataset.id === id); });
    var panel = $('#panel'); panel.innerHTML = ''; panel.classList.remove('wide');
    if (sec.help) panel.appendChild(el('div', { class: 'help', html: sec.help }));
    if (sec.custom === 'account') { accountPanel(panel); return; }
    if (sec.custom === 'pages') { pagesPanel(panel); return; }
    if (sec.custom === 'design') { designPanel(panel); return; }
    if (sec.custom === 'dash') { dashPanel(panel); return; }
    if (sec.custom === 'messages') { messagesPanel(panel); return; }
    if (sec.custom === 'media') { mediaPanel(panel); return; }
    if (sec.groups) {
      var yy = window.scrollY;
      var rr = function () { show(id); window.scrollTo(0, yy); };
      sec.groups.forEach(function (g) {
        var o = objAt(g.path);
        var card = el('div', { class: 'card' }, [el('h3', { text: g.title })]);
        g.fields.forEach(function (f) { card.appendChild(fieldEl(o, f, rr)); });
        panel.appendChild(card);
      });
      $('.side').classList.remove('open');
      return;
    }
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
        [el('i', { class: s.icon }), document.createTextNode(s.title)].concat(s.id === 'messages' ? [el('span', { class: 'badge', hidden: '' })] : [])));
    });
    $('#menuBtn').onclick = function () { $('.side').classList.toggle('open'); };
    $('#save').onclick = function () {
      $('#save').disabled = true; status('در حال ذخیره…');
      api('PUT', 'content', { content: C }).then(function (r) { C = r.content; dirty = false; status('ذخیره شد ✓', 'ok'); show(cur); })
        .catch(function (e) { status(e.message, 'bad'); }).then(function () { $('#save').disabled = false; });
    };
    $('#logout').onclick = function () { api('POST', 'logout').then(function () { location.reload(); }); };
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    api('GET', 'content').then(function (r) { C = r.content; $('#app').hidden = false; show('dash'); status(''); refreshBadge(); setInterval(refreshBadge, 60000); });
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
