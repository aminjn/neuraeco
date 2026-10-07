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

// ── مسیرها ────────────────────────────────────────────────────────────────
function handle(req, res) {
  var url = new URL(req.url, 'http://x');
  var p = decodeURIComponent(url.pathname);

  if (p.indexOf('/assets/') === 0) return serveFile(res, path.join(ROOT, 'public', 'assets'), p.slice(8), 'public, max-age=604800');
  if (p.indexOf('/uploads/') === 0) return serveFile(res, UPLOADS, p.slice(9), 'public, max-age=604800');
  if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /admin\n', 'text/plain; charset=utf-8');

  // ── سوپرادمین ──
  if (p === '/admin' || p === '/admin/') return serveFile(res, path.join(ROOT, 'admin'), 'index.html', 'no-store');
  if (p.indexOf('/admin/static/') === 0) return serveFile(res, path.join(ROOT, 'admin'), p.slice(14), 'no-store');
  if (p.indexOf('/admin/api/') === 0) return api(req, res, p.slice(11));

  // ── صفحات عمومی ──
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed', 'text/plain');
  var c = content();
  var html = null;
  if (p === '/' || p === '/index.html') html = render.home(c);
  else if (/^\/p\/[a-z0-9\-]+\/?$/.test(p)) html = render.page(c, p.replace(/^\/p\/|\/$/g, ''));
  if (!html) return send(res, 404, render.notFound(c));
  send(res, 200, html, null, { 'Cache-Control': 'no-cache' });
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
        try { fs.copyFileSync(CONTENT, CONTENT + '.bak'); } catch (e) { /* — */ }
        writeJson(CONTENT, c);
        json(res, 200, { ok: true, content: c });
      } catch (e) { json(res, 400, { error: e.message }); }
    });
  }
  if (route === 'reset' && req.method === 'POST') {
    try { fs.copyFileSync(CONTENT, CONTENT + '.bak'); } catch (e) { /* — */ }
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

http.createServer(function (req, res) {
  try { handle(req, res); } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, 'server error', 'text/plain'); }
}).listen(PORT, HOST, function () {
  content();
  console.log('neuraeco on http://' + HOST + ':' + PORT + (readJson(ADMIN, null) ? '' : '  (no admin yet: node server.js set-admin USER PASS)'));
});
