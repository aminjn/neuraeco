'use strict';
// سایتِ معرفیِ نورا + سوپرادمین. بدونِ هیچ وابستگیِ npm و بدونِ دیتابیس:
// محتوا در data/content.json، حسابِ مدیر در data/admin.json، فایل‌ها در data/uploads.
//
//   node server.js                       اجرای سرور (PORT پیش‌فرض 3000)
//   node server.js set-admin USER PASS   ساخت/تغییرِ رمزِ سوپرادمین

var http = require('http');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var render = require('./lib/render');
var design = require('./lib/design');

var ROOT = __dirname;
var DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
var UPLOADS = path.join(DATA, 'uploads');
var CONTENT = path.join(DATA, 'content.json');
var ADMIN = path.join(DATA, 'admin.json');
var SECRET_F = path.join(DATA, 'secret');
var PORT = Number(process.env.PORT || 3000);
var HOST = process.env.HOST || '127.0.0.1';

fs.mkdirSync(UPLOADS, { recursive: true });

function readJson(f, dflt) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return dflt; } }
function writeJson(f, v) {
  var tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(v, null, 2));
  fs.renameSync(tmp, f);
}
var DEFAULTS = readJson(path.join(ROOT, 'lib', 'defaults.json'), {});
function content() {
  var c = readJson(CONTENT, null);
  if (!c) { c = JSON.parse(JSON.stringify(DEFAULTS)); writeJson(CONTENT, c); }
  return c;
}
var SECRET = (function () {
  try { return fs.readFileSync(SECRET_F, 'utf8').trim(); } catch (e) {
    var s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_F, s, { mode: 384 }); return s;
  }
})();

function hashPass(pass, salt) { return crypto.scryptSync(String(pass), salt, 64).toString('hex'); }
function setAdmin(user, pass) {
  var salt = crypto.randomBytes(16).toString('hex');
  writeJson(ADMIN, { user: String(user), salt: salt, hash: hashPass(pass, salt) });
  try { fs.chmodSync(ADMIN, 384); } catch (e) { /* — */ }
}

if (process.argv[2] === 'set-admin') {
  var u = process.argv[3], p = process.argv[4];
  if (!u || !p || p.length < 8) { console.error('usage: node server.js set-admin USER PASSWORD(>=8 chars)'); process.exit(1); }
  setAdmin(u, p);
  console.log('admin saved: ' + u);
  process.exit(0);
}

// ── نشست: کوکیِ امضاشده با HMAC ───────────────────────────────────────────
function sign(v) { return crypto.createHmac('sha256', SECRET).update(v).digest('hex'); }
function makeSession(user) {
  var v = Buffer.from(JSON.stringify({ u: user, e: Date.now() + 12 * 3600 * 1000 })).toString('base64url');
  return v + '.' + sign(v);
}
function cookies(req) {
  var out = {};
  String(req.headers.cookie || '').split(';').forEach(function (p) {
    var i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function sessionUser(req) {
  var c = cookies(req).nx_s;
  if (!c) return null;
  var i = c.lastIndexOf('.');
  if (i < 0) return null;
  var v = c.slice(0, i), sg = c.slice(i + 1);
  var good = sign(v);
  if (sg.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sg), Buffer.from(good))) return null;
  try {
    var o = JSON.parse(Buffer.from(v, 'base64url').toString());
    var a = readJson(ADMIN, null);
    return o.e > Date.now() && a && o.u === a.user ? o.u : null;
  } catch (e) { return null; }
}
function isHttps(req) { return req.headers['x-forwarded-proto'] === 'https'; }
function setCookie(req, res, val, maxAge) {
  res.setHeader('Set-Cookie', 'nx_s=' + val + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + (isHttps(req) ? '; Secure' : ''));
}

// محدودیتِ تلاشِ ورود: ۱۰ بار در ۱۵ دقیقه برای هر IP
var fails = {};
function ipOf(req) { return String(req.headers['x-real-ip'] || req.headers['ar-real-ip'] || req.socket.remoteAddress || ''); }
function tooMany(ip) {
  var f = fails[ip];
  if (f && f.until < Date.now()) { delete fails[ip]; return false; }
  return !!(f && f.n >= 10);
}

// ── کمکی‌های HTTP ─────────────────────────────────────────────────────────
var MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8',
};
function send(res, code, body, type, extra) {
  var h = Object.assign({ 'Content-Type': type || 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }, extra || {});
  res.writeHead(code, h);
  res.end(body);
}
function json(res, code, obj) { send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' }); }
function serveFile(res, base, rel, cache) {
  var f = path.normalize(path.join(base, rel));
  if (f.indexOf(base + path.sep) !== 0) return send(res, 404, 'not found', 'text/plain');
  fs.stat(f, function (err, st) {
    if (err || !st.isFile()) return send(res, 404, 'not found', 'text/plain');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(f).pipe(res);
  });
}
function readBody(req, limit, cb) {
  var n = 0, chunks = [], dead = false;
  req.on('data', function (d) {
    if (dead) return;
    n += d.length;
    if (n > limit) { dead = true; cb(new Error('too_large')); req.destroy(); return; }
    chunks.push(d);
  });
  req.on('end', function () {
    if (dead) return;
    try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { cb(e); }
  });
}

// ── اعتبارسنجیِ محتوا (فقط شکل؛ متن آزاد است) ─────────────────────────────
function cleanContent(c) {
  if (!c || typeof c !== 'object') throw new Error('bad_content');
  ['site', 'home', 'contact'].forEach(function (k) { if (!c[k] || typeof c[k] !== 'object') c[k] = {}; });
  if (!Array.isArray(c.agents)) c.agents = [];
  if (!Array.isArray(c.pages)) c.pages = [];
  var seen = {};
  c.pages.forEach(function (p) {
    p.slug = String(p.slug || '').trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!p.slug) throw new Error('هر صفحه نشانیِ (slug) لاتین لازم دارد');
    if (seen[p.slug]) throw new Error('نشانیِ تکراری: ' + p.slug);
    seen[p.slug] = 1;
  });
  return c;
}

var UPLOAD_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/x-icon': '.ico' };

var BACKUPS = path.join(DATA, 'backups');
var MESSAGES = path.join(DATA, 'messages.json');
var STATS = path.join(DATA, 'stats.json');
fs.mkdirSync(BACKUPS, { recursive: true });

// پشتیبانِ خودکار پیش از هر ذخیره؛ ۳۰ نسخهٔ آخر می‌ماند
function backup(reason) {
  try {
    if (!fs.existsSync(CONTENT)) return;
    var name = 'content-' + new Date().toISOString().replace(/[:.]/g, '-') + (reason ? '-' + reason : '') + '.json';
    fs.copyFileSync(CONTENT, path.join(BACKUPS, name));
    var all = fs.readdirSync(BACKUPS).filter(function (f) { return /\.json$/.test(f); }).sort();
    all.slice(0, Math.max(0, all.length - 30)).forEach(function (f) { fs.unlinkSync(path.join(BACKUPS, f)); });
  } catch (e) { console.error('backup', e.message); }
}

// آمارِ بازدید: شمارشِ روزانه در حافظه، هر دقیقه روی دیسک؛ ۹۰ روز نگه داشته می‌شود
var stats = readJson(STATS, { days: {} });
var statsDirty = false;
function dayKey(d) { return new Date(d.getTime() + 3.5 * 3600 * 1000).toISOString().slice(0, 10); }
function countView(req, p) {
  var ua = String(req.headers['user-agent'] || '');
  if (!ua || /bot|crawl|spider|slurp|curl|wget|python|headless|monitor/i.test(ua)) return;
  var k = dayKey(new Date());
  var d = stats.days[k] || (stats.days[k] = { views: 0, pages: {} });
  d.views++; d.pages[p] = (d.pages[p] || 0) + 1;
  statsDirty = true;
}
setInterval(function () {
  if (!statsDirty) return;
  var keys = Object.keys(stats.days).sort();
  keys.slice(0, Math.max(0, keys.length - 90)).forEach(function (k) { delete stats.days[k]; });
  try { writeJson(STATS, stats); statsDirty = false; } catch (e) { /* — */ }
}, 60000).unref();

// پیام‌های فرمِ تماس: محدودیتِ ۵ پیام در ۱۰ دقیقه برای هر IP
var contactHits = {};
function isAdminReq(req) { return !!sessionUser(req); }

// ── مسیرها ────────────────────────────────────────────────────────────────
function handle(req, res) {
  var url = new URL(req.url, 'http://x');
  var p = decodeURIComponent(url.pathname);

  if (p.indexOf('/assets/') === 0) return serveFile(res, path.join(ROOT, 'public', 'assets'), p.slice(8), 'public, max-age=604800');
  if (p.indexOf('/uploads/') === 0) return serveFile(res, UPLOADS, p.slice(9), 'public, max-age=604800');
  var host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  var origin = String((content().site || {}).baseUrl || '').replace(/\/+$/, '') || ((isHttps(req) ? 'https://' : 'http://') + host);
  if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /admin\nSitemap: ' + origin + '/sitemap.xml\n', 'text/plain; charset=utf-8');
  if (p === '/sitemap.xml') return send(res, 200, render.sitemap(content(), origin), 'application/xml; charset=utf-8');
  if (p === '/api/contact' && req.method === 'POST') return contactSubmit(req, res);

  // ── سوپرادمین ──
  if (p === '/admin' || p === '/admin/') return serveFile(res, path.join(ROOT, 'admin'), 'index.html', 'no-store');
  if (p.indexOf('/admin/static/') === 0) return serveFile(res, path.join(ROOT, 'admin'), p.slice(14), 'no-store');
  if (p.indexOf('/admin/api/') === 0) return api(req, res, p.slice(11));

  // ── صفحات عمومی ──
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed', 'text/plain');
  var c = content();
  var html = null;
  if ((c.site || {}).maintenance && !isAdminReq(req)) return send(res, 503, render.maintenance(c), null, { 'Retry-After': '3600' });
  if (p === '/' || p === '/index.html') html = render.home(c);
  else if (/^\/p\/[a-z0-9\-]+\/?$/.test(p)) html = render.page(c, p.replace(/^\/p\/|\/$/g, ''));
  if (!html) return send(res, 404, render.notFound(c));
  countView(req, p.replace(/\/$/, '') || '/');
  send(res, 200, html, null, { 'Cache-Control': 'no-cache' });
}

function contactSubmit(req, res) {
  var ip = ipOf(req), now = Date.now();
  var h = (contactHits[ip] || []).filter(function (t) { return now - t < 10 * 60 * 1000; });
  if (h.length >= 5) return json(res, 429, { error: 'پیام‌های زیادی فرستادید؛ کمی بعد دوباره امتحان کنید.' });
  readBody(req, 20000, function (err, b) {
    if (err || !b) return json(res, 400, { error: 'دادهٔ نامعتبر' });
    if (b.website) return json(res, 200, { ok: true });   // تلهٔ ربات
    var name = String(b.name || '').trim().slice(0, 80), phone = String(b.phone || '').trim().slice(0, 20), msg = String(b.msg || '').trim().slice(0, 3000);
    if (!name || !phone || !msg) return json(res, 400, { error: 'همهٔ بخش‌ها را پر کنید.' });
    if (!/^[0-9۰-۹+\-\s()]{6,20}$/.test(phone)) return json(res, 400, { error: 'شمارهٔ تماس معتبر نیست.' });
    h.push(now); contactHits[ip] = h;
    var all = readJson(MESSAGES, []);
    all.unshift({ id: now.toString(36) + crypto.randomBytes(3).toString('hex'), at: new Date().toISOString(), name: name, phone: phone, msg: msg, ip: ip, read: false });
    writeJson(MESSAGES, all.slice(0, 2000));
    json(res, 200, { ok: true });
  });
}

function api(req, res, route) {
  var ip = ipOf(req);
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'neuraeco') return json(res, 403, { error: 'forbidden' });

  if (route === 'login' && req.method === 'POST') {
    if (tooMany(ip)) return json(res, 429, { error: 'تلاشِ زیاد؛ ۱۵ دقیقهٔ دیگر امتحان کنید' });
    return readBody(req, 10000, function (err, b) {
      var a = readJson(ADMIN, null);
      if (!a) return json(res, 400, { error: 'هنوز سوپرادمین ساخته نشده؛ روی سرور: node server.js set-admin USER PASS' });
      var ok = !err && b && String(b.user) === a.user && hashPass(b.pass || '', a.salt) === a.hash;
      if (!ok) {
        var f = fails[ip] || (fails[ip] = { n: 0, until: 0 });
        f.n++; f.until = Date.now() + 15 * 60 * 1000;
        return json(res, 401, { error: 'نام کاربری یا رمز اشتباه است' });
      }
      delete fails[ip];
      setCookie(req, res, makeSession(a.user), 12 * 3600);
      json(res, 200, { ok: true, user: a.user });
    });
  }
  if (route === 'logout' && req.method === 'POST') { setCookie(req, res, '', 0); return json(res, 200, { ok: true }); }

  var user = sessionUser(req);
  if (route === 'me') return json(res, 200, { user: user, hasAdmin: !!readJson(ADMIN, null) });
  if (!user) return json(res, 401, { error: 'ابتدا وارد شوید' });

  if (route === 'content' && req.method === 'GET') return json(res, 200, { content: content() });
  if (route === 'content' && req.method === 'PUT') {
    return readBody(req, 2 * 1024 * 1024, function (err, b) {
      if (err) return json(res, 400, { error: 'دادهٔ نامعتبر' });
      try {
        var c = cleanContent(b.content);
        backup();
        writeJson(CONTENT, c);
        json(res, 200, { ok: true, content: c });
      } catch (e) { json(res, 400, { error: e.message }); }
    });
  }
  if (route === 'design-meta') return json(res, 200, { presets: design.PRESETS, defaults: design.DEFAULT_DESIGN });
  if (route === 'preview-page' && req.method === 'POST') {
    return readBody(req, 2 * 1024 * 1024, function (err, b) {
      if (err || !b || !b.content) return json(res, 400, { error: 'دادهٔ نامعتبر' });
      try {
        var pc = cleanContent(JSON.parse(JSON.stringify(b.content)));
        var slug = String(b.slug || '');
        var html = slug ? render.page(pc, slug) : render.home(pc);
        json(res, 200, { html: html || render.notFound(pc) });
      } catch (e) { json(res, 400, { error: e.message }); }
    });
  }
  if (route === 'preview' && req.method === 'POST') {
    return readBody(req, 512 * 1024, function (err, b) {
      if (err) return json(res, 400, { error: 'دادهٔ نامعتبر' });
      json(res, 200, { html: render.md(String((b && b.body) || '')) });
    });
  }
  if (route === 'reset' && req.method === 'POST') {
    backup('before-reset');
    writeJson(CONTENT, JSON.parse(JSON.stringify(DEFAULTS)));
    return json(res, 200, { ok: true, content: content() });
  }
  if (route === 'upload' && req.method === 'POST') {
    return readBody(req, 8 * 1024 * 1024, function (err, b) {
      if (err) return json(res, 400, { error: 'فایل بزرگ‌تر از ۵ مگابایت است' });
      var m = /^data:([a-z\/\-]+);base64,(.+)$/.exec(String(b.data || ''));
      var ext = m && UPLOAD_EXT[m[1]];
      if (!ext) return json(res, 400, { error: 'فقط PNG/JPG/WEBP/GIF/ICO' });
      var name = Date.now().toString(36) + crypto.randomBytes(5).toString('hex') + ext;
      fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(m[2], 'base64'));
      json(res, 200, { ok: true, url: '/uploads/' + name });
    });
  }
  if (route === 'dashboard') {
    var days = [], keys = [], now = new Date();
    for (var i = 29; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * 86400000)));
    var top = {};
    keys.forEach(function (k) {
      var d = stats.days[k] || { views: 0, pages: {} };
      days.push({ day: k, views: d.views });
      Object.keys(d.pages).forEach(function (pg) { top[pg] = (top[pg] || 0) + d.pages[pg]; });
    });
    var msgs = readJson(MESSAGES, []);
    return json(res, 200, {
      days: days, top: Object.keys(top).map(function (k) { return { path: k, views: top[k] }; }).sort(function (a, b) { return b.views - a.views; }).slice(0, 10),
      messages: msgs.length, unread: msgs.filter(function (m) { return !m.read; }).length,
    });
  }
  if (route === 'messages' && req.method === 'GET') return json(res, 200, { messages: readJson(MESSAGES, []) });
  if (route === 'messages' && req.method === 'POST') {
    return readBody(req, 20000, function (err, b) {
      if (err || !b) return json(res, 400, { error: 'دادهٔ نامعتبر' });
      var all = readJson(MESSAGES, []);
      var ids = Array.isArray(b.ids) ? b.ids : [];
      if (b.action === 'delete') all = all.filter(function (m) { return ids.indexOf(m.id) < 0; });
      else all.forEach(function (m) { if (ids.indexOf(m.id) >= 0) m.read = b.action !== 'unread'; });
      writeJson(MESSAGES, all);
      json(res, 200, { ok: true, messages: all });
    });
  }
  if (route === 'backups' && req.method === 'GET') {
    var list = fs.readdirSync(BACKUPS).filter(function (f) { return /\.json$/.test(f); }).sort().reverse()
      .map(function (f) { return { name: f, size: fs.statSync(path.join(BACKUPS, f)).size, at: fs.statSync(path.join(BACKUPS, f)).mtime }; });
    return json(res, 200, { backups: list });
  }
  if (route === 'restore' && req.method === 'POST') {
    return readBody(req, 10000, function (err, b) {
      var name = path.basename(String((b && b.name) || ''));
      var f = path.join(BACKUPS, name);
      if (err || !/^content-[\w\-]+\.json$/.test(name) || !fs.existsSync(f)) return json(res, 400, { error: 'نسخه پیدا نشد' });
      var c = readJson(f, null);
      if (!c) return json(res, 400, { error: 'فایل خراب است' });
      backup('before-restore');
      writeJson(CONTENT, c);
      json(res, 200, { ok: true, content: c });
    });
  }
  if (route === 'media' && req.method === 'GET') {
    var files = fs.readdirSync(UPLOADS).filter(function (f) { return /\.(png|jpe?g|webp|gif|ico)$/i.test(f); })
      .map(function (f) { var st = fs.statSync(path.join(UPLOADS, f)); return { name: f, url: '/uploads/' + f, size: st.size, at: st.mtime }; })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    var builtin = fs.readdirSync(path.join(ROOT, 'public', 'assets', 'img')).filter(function (f) { return /\.(png|jpe?g|webp)$/i.test(f); })
      .map(function (f) { return { name: f, url: '/assets/img/' + f, builtin: true }; });
    return json(res, 200, { files: files, builtin: builtin });
  }
  if (route === 'media-delete' && req.method === 'POST') {
    return readBody(req, 10000, function (err, b) {
      var name = path.basename(String((b && b.name) || ''));
      var f = path.join(UPLOADS, name);
      if (err || !name || !fs.existsSync(f)) return json(res, 400, { error: 'فایل پیدا نشد' });
      if (JSON.stringify(content()).indexOf('/uploads/' + name) >= 0) return json(res, 400, { error: 'این تصویر در سایت استفاده شده؛ اول از آن‌جا برش دارید.' });
      fs.unlinkSync(f);
      json(res, 200, { ok: true });
    });
  }
  if (route === 'password' && req.method === 'POST') {
    return readBody(req, 10000, function (err, b) {
      var a = readJson(ADMIN, null);
      if (err || !a || hashPass(b.current || '', a.salt) !== a.hash) return json(res, 400, { error: 'رمزِ فعلی اشتباه است' });
      if (String(b.next || '').length < 8) return json(res, 400, { error: 'رمزِ تازه حداقل ۸ نویسه' });
      setAdmin(a.user, b.next);
      setCookie(req, res, makeSession(a.user), 12 * 3600);
      json(res, 200, { ok: true });
    });
  }
  json(res, 404, { error: 'not_found' });
}

['SIGTERM', 'SIGINT'].forEach(function (sig) {
  process.on(sig, function () { try { if (statsDirty) writeJson(STATS, stats); } catch (e) { /* — */ } process.exit(0); });
});

http.createServer(function (req, res) {
  try { handle(req, res); } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, 'server error', 'text/plain'); }
}).listen(PORT, HOST, function () {
  content();
  console.log('neuraeco on http://' + HOST + ':' + PORT + (readJson(ADMIN, null) ? '' : '  (no admin yet: node server.js set-admin USER PASS)'));
});
