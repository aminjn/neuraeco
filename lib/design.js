'use strict';
// «ظاهر و گرافیک»: تنظیماتِ سوپرادمین ⇒ یک تکه CSS که بعد از site.css می‌نشیند.
// هر مقدار پیش از رسیدن به CSS پاک‌سازی می‌شود تا نتواند از قالب بیرون بزند.

var DEFAULT_DESIGN = {
  preset: 'neura',
  brand: '#6c4ff0', accent: '#14B8A6', accent2: '#4F46C4',
  bgLight: '#F5F4FB', bgDark: '#15131A', inkLight: '#171422', inkDark: '#FDFDFD',
  font: 'kamand', fontSize: 15, radius: 'round', buttons: 'glass',
  blobs: true, headerStyle: 'glass', width: 1180,
  heroImage: 'left', heroStyle: 'spectrum', heroSize: 340, agentCols: 'auto', cardStyle: 'soft',
  favicon: '', customCss: '',
};

var PRESETS = {
  neura: { title: 'بنفشِ نورا', brand: '#6c4ff0', accent: '#14B8A6', accent2: '#4F46C4', bgLight: '#F5F4FB', bgDark: '#15131A', inkLight: '#171422', inkDark: '#FDFDFD', buttons: 'glass', blobs: true, radius: 'round', font: 'kamand' },
  ocean: { title: 'آبیِ تجاری', brand: '#2563EB', accent: '#06B6D4', accent2: '#1E40AF', bgLight: '#F4F7FC', bgDark: '#0E1420', inkLight: '#0F172A', inkDark: '#F8FAFC', buttons: 'solid', blobs: true, radius: 'soft', font: 'vazir' },
  emerald: { title: 'سبزِ طبیعی', brand: '#059669', accent: '#84CC16', accent2: '#0D9488', bgLight: '#F3FAF6', bgDark: '#0F1714', inkLight: '#0B1F17', inkDark: '#F2FBF6', buttons: 'solid', blobs: true, radius: 'round', font: 'vazir' },
  sunset: { title: 'نارنجیِ گرم', brand: '#EA580C', accent: '#F59E0B', accent2: '#DC2626', bgLight: '#FFF8F3', bgDark: '#1A1310', inkLight: '#24140B', inkDark: '#FFF7F0', buttons: 'solid', blobs: true, radius: 'round', font: 'kamand' },
  luxury: { title: 'تیره و طلایی', brand: '#C9A227', accent: '#E8D48B', accent2: '#8B6B12', bgLight: '#FAF8F1', bgDark: '#0E0D0B', inkLight: '#1C1A14', inkDark: '#F5F1E4', buttons: 'solid', blobs: false, radius: 'sharp', font: 'vazir' },
  minimal: { title: 'مینیمالِ ساده', brand: '#111827', accent: '#6B7280', accent2: '#374151', bgLight: '#FFFFFF', bgDark: '#0B0B0C', inkLight: '#111827', inkDark: '#F9FAFB', buttons: 'outline', blobs: false, radius: 'soft', font: 'vazir' },
};

function color(v, d) { return /^#[0-9a-f]{6}$/i.test(String(v || '')) ? v : d; }
function num(v, min, max, d) { var n = Number(v); return isFinite(n) && n >= min && n <= max ? n : d; }
function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }

function normalize(d) {
  d = d || {};
  var o = {};
  Object.keys(DEFAULT_DESIGN).forEach(function (k) { o[k] = d[k] === undefined ? DEFAULT_DESIGN[k] : d[k]; });
  ['brand', 'accent', 'accent2', 'bgLight', 'bgDark', 'inkLight', 'inkDark'].forEach(function (k) { o[k] = color(o[k], DEFAULT_DESIGN[k]); });
  o.font = pick(o.font, ['kamand', 'vazir', 'system'], 'kamand');
  o.fontSize = num(o.fontSize, 12, 20, 15);
  o.radius = pick(o.radius, ['round', 'soft', 'sharp'], 'round');
  o.buttons = pick(o.buttons, ['glass', 'solid', 'outline'], 'glass');
  o.headerStyle = pick(o.headerStyle, ['glass', 'solid'], 'glass');
  o.width = num(o.width, 900, 1600, 1180);
  o.heroImage = pick(o.heroImage, ['left', 'right', 'none'], 'left');
  o.heroStyle = pick(o.heroStyle, ['spectrum', 'plain'], 'spectrum');
  o.heroSize = num(o.heroSize, 200, 480, 340);
  o.agentCols = pick(String(o.agentCols), ['auto', '2', '3', '4'], 'auto');
  o.cardStyle = pick(o.cardStyle, ['soft', 'border', 'shadow'], 'soft');
  o.blobs = o.blobs !== false;
  o.customCss = String(o.customCss || '');
  o.favicon = String(o.favicon || '');
  return o;
}

function css(raw) {
  var d = normalize(raw);
  var P = '[data-site-public]';
  var out = [];
  // رنگ‌ها: روشن و تیره
  out.push(P + '{--brand:' + d.brand + ';--brand-lo:color-mix(in srgb,' + d.brand + ' 82%,#fff);--brand-hi:color-mix(in srgb,' + d.brand + ' 80%,#000);' +
    '--bg:' + d.bgLight + ';--bg-1:color-mix(in srgb,' + d.bgLight + ' 40%,#fff);--ink:' + d.inkLight + ';--ink-2:color-mix(in srgb,' + d.inkLight + ' 78%,' + d.bgLight + ');' +
    '--mute:color-mix(in srgb,' + d.inkLight + ' 58%,' + d.bgLight + ');--bg-2:color-mix(in srgb,' + d.brand + ' 6%,transparent);--bg-3:color-mix(in srgb,' + d.brand + ' 3.5%,transparent);--wrap:' + d.width + 'px;font-size:' + d.fontSize + 'px}');
  out.push('[data-theme="dark"] ' + P + '{--brand:color-mix(in srgb,' + d.brand + ' 88%,#fff);--brand-lo:color-mix(in srgb,' + d.brand + ' 70%,#fff);--brand-hi:color-mix(in srgb,' + d.brand + ' 55%,#fff);' +
    '--bg:' + d.bgDark + ';--bg-1:' + d.bgDark + ';--ink:' + d.inkDark + ';--ink-2:color-mix(in srgb,' + d.inkDark + ' 80%,' + d.bgDark + ');--mute:color-mix(in srgb,' + d.inkDark + ' 56%,' + d.bgDark + ');' +
    '--bg-2:rgba(255,255,255,.05);--bg-3:rgba(255,255,255,.028)}');
  out.push('html,body{background:var(--bg)}');
  // فونت
  var fam = d.font === 'vazir' ? "'Vazirmatn',system-ui,sans-serif" : d.font === 'system' ? "system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif" : "'Kamand','Vazirmatn',system-ui,sans-serif";
  out.push(P + ',' + P + ' button,' + P + ' input,' + P + ' textarea{font-family:' + fam + '}');
  // پس‌زمینه
  if (!d.blobs) out.push(P + ' .bg{display:none}');
  else out.push(P + ' .bg i:nth-child(2){background:' + d.accent2 + '}' + P + ' .bg i:nth-child(3){background:' + d.accent + '}');
  // سرصفحه
  if (d.headerStyle === 'solid') out.push(P + ' header.site{background:var(--bg);backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 2px 14px var(--shadow-2)}');
  // دکمه‌ها
  if (d.buttons === 'solid') out.push(P + ' .cta:not(.ghost){background:var(--brand);border-color:var(--brand);color:#fff;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 8px 22px color-mix(in srgb,var(--brand) 30%,transparent)}');
  if (d.buttons === 'outline') out.push(P + ' .cta:not(.ghost){background:transparent;border:1.5px solid var(--brand);color:var(--brand-hi);box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}');
  if (d.buttons === 'glass') out.push(P + ' .cta:not(.ghost){color:var(--brand-hi)}[data-theme="dark"] ' + P + ' .cta:not(.ghost){color:#EFEBFF}');
  // گوشه‌ها
  var R = d.radius === 'sharp' ? [4, 4, 6] : d.radius === 'soft' ? [10, 8, 12] : [0, 0, 0];
  if (R[0]) {
    out.push(P + ' .acard,' + P + ' .card,' + P + ' .pillar,' + P + ' .hero-stats,' + P + ' .kv div,' + P + ' .page-cover,' + P + ' .hero-plain img{border-radius:' + R[2] + 'px}');
    out.push(P + ' .cta,' + P + ' .menu a,' + P + ' .eyebrow,' + P + ' .thbtn,' + P + ' .burger,' + P + ' .socials a,' + P + ' .cline .ic{border-radius:' + R[0] + 'px}');
  }
  // کارت‌ها
  if (d.cardStyle === 'border') out.push(P + ' .acard,' + P + ' .card,' + P + ' .pillar{background:var(--bg-1);border:1px solid var(--line);box-shadow:none}');
  if (d.cardStyle === 'shadow') out.push(P + ' .acard,' + P + ' .card,' + P + ' .pillar{background:var(--bg-1);border-color:transparent;box-shadow:0 10px 30px var(--shadow)}');
  // صفحهٔ اصلی
  if (d.heroImage === 'right') out.push('@media (min-width:1001px){' + P + ' .hero-art{order:-1}}');
  if (d.heroImage === 'none') out.push(P + ' .hero-art{display:none}' + P + ' .hero-grid{grid-template-columns:1fr}');
  out.push(P + ' .hero-face{width:' + d.heroSize + 'px;height:' + d.heroSize + 'px}@media (max-width:420px){' + P + ' .hero-face{width:' + Math.min(d.heroSize, 260) + 'px;height:' + Math.min(d.heroSize, 260) + 'px}}');
  if (d.agentCols !== 'auto') out.push('@media (min-width:900px){' + P + ' .agents{grid-template-columns:repeat(' + d.agentCols + ',1fr)}}');
  // CSSِ دلخواه — آخر از همه تا بر بقیه غلبه کند؛ بستنِ تگِ style ممنوع
  if (d.customCss) out.push(d.customCss.replace(/<\/?style/gi, ''));
  return out.join('\n');
}

module.exports = { css: css, normalize: normalize, PRESETS: PRESETS, DEFAULT_DESIGN: DEFAULT_DESIGN };
