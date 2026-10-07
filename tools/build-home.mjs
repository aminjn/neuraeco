// ساختِ index.htmlِ ایستای neuraeco از محتوای خانهٔ سایتِ نورا (بدونِ ورود/خرید/دستیار).
import fs from 'node:fs';
const U = '/home/user/Neurauidesign/server/src/';
const { SITE_CONTENT_DEFAULT: c } = await import(U + 'site-content-default.js');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const { nav, home, agents, contact, footer, seo, about } = c;
const items = agents.items;
const img = (k) => `assets/img/${k}.png`;
const assistant = items.find((a) => a.id === 'assistant') || items[0];

const links = [
  ['#top', 'خانه'], ['#about', 'درباره نورا'], ['#agents', 'ایجنت‌ها'], ['#contact', 'تماس با ما'],
];
const card = (a) => `
        <article class="acard" style="--ac:${esc(a.accent)};text-align:start">
          <div class="body">
            <div class="col">
              <h3>${esc(a.name)}</h3>
              <div class="tag">${esc(a.tagline)}</div>
              <p>${esc(a.desc)}</p>
              <ul class="feats">
${(a.bullets || []).slice(0, 3).map((f) => `                <li><i class="fa-solid fa-circle"></i>${esc(f)}</li>`).join('\n')}
              </ul>
            </div>
            <span class="face"><img src="${img(a.avatar)}" alt="${esc(a.name)}" loading="lazy" width="60" height="60"></span>
          </div>
        </article>`;

const pillarIcons = ['fa-solid fa-bolt-lightning', 'fa-solid fa-shield-halved', 'fa-solid fa-diagram-project', 'fa-solid fa-fingerprint'];
const rowIcons = ['fa-solid fa-phone', 'fa-solid fa-mobile-screen', 'fa-solid fa-envelope', 'fa-solid fa-location-dot', 'fa-regular fa-clock', 'fa-solid fa-hashtag'];
const socIcons = ['fa-brands fa-whatsapp', 'fa-brands fa-telegram', 'fa-brands fa-instagram', 'fa-brands fa-linkedin'];

const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(seo.titleHome)}</title>
  <meta name="description" content="${esc(seo.defaultDescription)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${esc(seo.titleHome)}">
  <meta property="og:description" content="${esc(seo.defaultDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:site_name" content="${esc(seo.siteName)}">
  <!-- کدِ تأییدِ اینماد (اگر اینماد متا داد) را این‌جا بگذارید -->
  <link rel="icon" type="image/png" href="assets/img/neura-logo-gradient.png">
  <link rel="stylesheet" href="assets/fa/css/all.min.css">
  <link rel="stylesheet" href="assets/css/site.css">
  <style>
    @font-face{font-family:'Neogrey';src:url('assets/fonts/NeogreyMedium.otf') format('opentype');font-weight:400 700;font-display:swap}
    html,body{margin:0}
    html{scroll-behavior:smooth}
    [data-site-public] section[id]{scroll-margin-top:80px}
    [data-site-public] .acard:hover{transform:none}
    [data-site-public] .enamad{display:flex;align-items:center;gap:12px;margin-top:4px}
    [data-site-public] .enamad:empty{display:none}
  </style>
  <script>
    (function(){var t='';try{t=localStorage.getItem('neura_site_theme')||''}catch(e){}
    if(!t)t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
    document.documentElement.setAttribute('data-theme',t)})();
  </script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: seo.siteName, description: seo.defaultDescription, inLanguage: 'fa-IR' })}</script>
</head>
<body data-site-public data-site-page="home" id="top">
  <div class="bg"><i></i><i></i><i></i><i></i></div>

  <header class="site">
    <div class="wrap nav">
      <a class="logo" href="#top">
        <img class="mark" src="assets/img/neura-logo-gradient.png" alt="">
        <span class="txt"><b>${esc(nav.brand)}</b></span>
      </a>
      <nav class="menu" data-site-menu aria-label="${esc(nav.menuAria)}">
${links.map(([h, l], i) => `        <a href="${h}"${i === 0 ? ' aria-current="page"' : ''}>${esc(l)}</a>`).join('\n')}
      </nav>
      <span style="margin-inline-start:auto"></span>
      <button type="button" class="thbtn" data-theme-btn aria-label="تغییر تم"><i class="fa-solid fa-moon"></i></button>
      <button type="button" class="burger" data-site-burger aria-label="${esc(nav.menuAria)}" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
    </div>
  </header>

  <main>
    <section class="hero"><div class="wrap hero-grid">
      <div>
        <span class="eyebrow"><i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px"></i>${esc(home.heroEyebrow)}</span>
        <h1>${esc(home.heroTitle)} <em>${esc(home.heroTitleAccent)}</em></h1>
        <p class="lead">${esc(home.heroP1)}</p>
        <p class="sub">${esc(home.heroP2)}</p>
        <div class="hero-btns">
          <a class="cta" href="#agents"><i class="fa-solid fa-users-gear"></i>${esc(home.heroCtaSecondary)}</a>
          <a class="cta ghost" href="#contact"><i class="fa-solid fa-phone"></i>تماس با ما</a>
        </div>
        <div class="hero-stats">
${home.stats.map((s) => `          <div><b class="num">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('\n')}
        </div>
      </div>
      <div class="hero-art">
        <span class="detail-face hero-face" data-spectrum="#8f74ee" style="position:relative;display:grid;place-items:center">
          <canvas aria-hidden="true"></canvas>
          <img src="${img(assistant.avatar)}" alt="${esc(footer.assistantName)}">
        </span>
      </div>
    </div></section>

    <section class="band" id="agents"><div class="wrap">
      <div class="band-head"><h2>${esc(home.agentsTitle)}</h2><p>${esc(home.agentsDesc)}</p></div>
      <div class="agents">${items.map(card).join('')}
      </div>
    </div></section>

    <section class="band" id="about"><div class="wrap about-grid">
      <div>
        <h2 style="font-size:30px;font-weight:800;margin-bottom:13px">${esc(home.changesTitle)}</h2>
        <p style="font-size:14.5px;color:var(--ink-2);margin-bottom:14px">${esc(home.changesP1)}</p>
        <p style="font-size:14.5px;color:var(--ink-2);margin-bottom:14px">${esc(home.changesP2)}</p>
        <p style="font-size:14.5px;color:var(--ink-2)">${esc(about.p1)}</p>
      </div>
      <div class="pillars">
${home.changeCards.map((k, i) => `        <div class="pillar"><i class="${pillarIcons[i % 4]}"></i><b>${esc(k.title)}</b><span>${esc(k.desc)}</span></div>`).join('\n')}
      </div>
    </div></section>

    <section class="band" id="contact"><div class="wrap">
      <div class="band-head"><h2>${esc(contact.title)}</h2><p>${esc(contact.desc)}</p></div>
      <div class="contact-grid">
        <div class="card">
          <h3><i class="fa-solid fa-address-card"></i>${esc(contact.infoTitle)}</h3>
${contact.rows.map((r, i) => `          <div class="cline"><span class="ic"><i class="${rowIcons[i % 6]}"></i></span><div><b>${esc(r.label)}</b>${String(r.value).split('\n').map((v) => `<span>${esc(v)}</span>`).join('')}</div></div>`).join('\n')}
        </div>
        <div class="card">
          <h3><i class="fa-solid fa-comments"></i>${esc(contact.socialTitle)}</h3>
${contact.socials.map((s, i) => `          <div class="cline"><span class="ic"><i class="${socIcons[i % 4]}"></i></span><div><b>${esc(s.label)}</b><span>${esc(s.value)}</span></div></div>`).join('\n')}
        </div>
      </div>
    </div></section>
  </main>

  <footer class="site">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-about">
          <a class="logo" href="#top">
            <img class="mark" src="assets/img/neura-logo-gradient.png" alt="">
            <span class="txt"><b>${esc(nav.brand)}</b></span>
          </a>
          <p>${esc(footer.about)}</p>
        </div>
        <div>
          <h4>${esc(footer.colProductTitle)}</h4>
          <nav><a href="#agents">همهٔ ایجنت‌ها</a>${items.filter((a) => ['assistant', 'dine', 'finance'].includes(a.id)).map((a) => `<a href="#agents">${esc(a.name)}</a>`).join('')}</nav>
        </div>
        <div>
          <h4>${esc(footer.colCompanyTitle)}</h4>
          <nav><a href="#about">درباره نورا</a><a href="#contact">تماس با ما</a></nav>
        </div>
        <div>
          <h4>${esc(footer.colContactTitle)}</h4>
          <nav>${footer.colContact.map((t) => `<span style="font-size:13px;color:var(--ink-2)">${esc(t)}</span>`).join('')}</nav>
          <!-- نمادِ اینماد: کدِ <a><img></a>ی که اینماد می‌دهد را عیناً داخلِ همین div بگذارید -->
          <div class="enamad" data-enamad></div>
        </div>
      </div>
      <div class="foot-bar">
        <span>${esc(footer.copyright)}</span>
        <span class="end">${esc(footer.madeIn)}</span>
      </div>
    </div>
  </footer>

  <script src="assets/js/site.js" defer></script>
</body>
</html>
`;
fs.writeFileSync('/home/user/neuraeco/index.html', html);
console.log('ok', html.length);
