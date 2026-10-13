#!/usr/bin/env node
// צילומי מסך ובדיקות אוטומטיות להדגמה של איקס מדיה. Chrome headless דרך CDP, בלי תלויות.
// הרצה:  node tools/shots.mjs                         (קובץ מקומי, file://)
//        node tools/shots.mjs --url https://smartscale-biz.github.io/oren-tadgi-demo/
//        node tools/shots.mjs --only home,orders-kanban --vp mobile
// פלט:   _screens/<viewport>-<state>.png · _screens/index.html · _screens/report.json
// קוד יציאה 1 אם בדיקה קשה נכשלה.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, '_screens');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = (arg('--url', pathToFileURL(path.join(DOCS, 'index.html')).href)).replace(/#.*$/, '');
const ONLY = (arg('--only', '') || '').split(',').filter(Boolean);
const VP = arg('--vp', 'all');
const TODAY = arg('--today', '2026-10-19');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── בדיקות סטטיות על קבצי המקור ── */
const staticIssues = [];
const DASH = /[\u2013\u2014]/;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const srcFiles = walk(DOCS).filter(f => /\.(html|css|js)$/.test(f)).concat([path.join(ROOT, 'README.md'), ...walk(path.join(ROOT, 'tools')).filter(f => /\.(mjs|js|html)$/.test(f))]).filter(f => fs.existsSync(f));
const hebWord = w => new RegExp(`(^|[^\\u0590-\\u05FF])${w}([^\\u0590-\\u05FF]|$)`);
const BANNED = ['בן גוריון', 'בוני הנגב', 'קק"ל', 'הקרן לפיתוח', 'יקב נתיב', 'מטב', 'אלקטרה', 'עוטף הנגב', 'גושן', 'רחביה', 'צרפתי', 'יהב', 'מני ליין', 'נגב פרינט', 'אנשי העיר', 'מוסרות'];
const OK_MAIL = ['xmedia@x-media.co.il', 'oren@x-media.co.il', 'noreply@anthropic.com'];
let totalSize = 0;
for (const f of srcFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const txt = fs.readFileSync(f, 'utf8'); if (rel.startsWith('docs/')) totalSize += txt.length;
  if (rel === 'tools/shots.mjs' || rel === 'tools/clickthrough.mjs') continue; // מכילים את רשימות האיסור עצמן
  txt.split('\n').forEach((line, i) => { if (DASH.test(line)) staticIssues.push(`מקף ארוך/בינוני ב-${rel}:${i + 1}`); });
  if (/לידה|לידות/.test(txt)) staticIssues.push(`"לידה/לידות" ב-${rel}`);
  if (/sk-ant-|AIza[0-9A-Za-z_-]{30,}|cfat_|xai-[A-Za-z0-9]{20,}|apify_api_|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}/.test(txt)) staticIssues.push(`דמוי סוד ב-${rel}`);
  (txt.match(/\b0(?:5\d|[2-9])[- ]?\d{3}[- ]?\d{4}\b/g) || []).forEach(p => { if (!/^05\d-000-\d{4}$/.test(p) && p !== '08-9934431') staticIssues.push(`טלפון שנראה אמיתי ב-${rel}: ${p}`); });
  (txt.match(/[\w.+-]+@[\w-]+\.[\w.-]+[a-z]/gi) || []).forEach(m => { if (!/@example\.co\.il$/.test(m) && OK_MAIL.indexOf(m.toLowerCase()) < 0 && !/@xmedia-demo$/.test(m)) staticIssues.push(`מייל שנראה אמיתי ב-${rel}: ${m}`); });
  BANNED.forEach(w => { if (hebWord(w).test(txt)) staticIssues.push(`שם לקוח שהוחלט להחליף ("${w}") ב-${rel}`); });
}
console.log(`── shots: בדיקות סטטיות על ${srcFiles.length} קבצים: ${staticIssues.length ? staticIssues.length + ' בעיות' : 'נקי'} · קוד האתר ${(totalSize / 1024).toFixed(0)}KB`);
staticIssues.forEach(s => console.log('   ✗ ' + s));

/* ── מצבים לצילום. {x} מוחלף במספרי הזמנות שנשלפים מהדף ── */
const STATES = [
  { id: 'home', hash: '#/', title: 'היום: הלוח של סמדר' },
  { id: 'home-tour', hash: '#/', search: 'tour=1&fresh=1', title: 'היום + סיור מודרך (כניסה ראשונה)' },
  { id: 'orders-list', hash: '#/orders?view=list', title: 'הזמנות: רשימה' },
  { id: 'orders-urgent', hash: '#/orders?view=list&urgent=1', title: 'הזמנות: רק דחופות' },
  { id: 'orders-kanban', hash: '#/orders?view=kanban', title: 'הזמנות: לוח שלבים' },
  { id: 'orders-machines', hash: '#/orders?view=machines', title: 'הזמנות: לפי מכונה' },
  { id: 'orders-new-1', hash: '#/orders?view=list&new=1', title: 'הזמנה חדשה: ההודעה' },
  { id: 'orders-new-parsed', hash: '#/orders?view=list&new=1&run=1', title: 'הזמנה חדשה: אחרי פענוח' },
  { id: 'orders-new-2', hash: '#/orders?view=list&new=1&step=2', title: 'הזמנה חדשה: הצעת מחיר עם מחיר אחרון' },
  { id: 'orders-new-3', hash: '#/orders?view=list&new=1&step=3', title: 'הזמנה חדשה: שליחה בווטסאפ' },
  { id: 'order-sent', hash: '#/orders/{delekAta}', title: 'כרטיס הזמנה: נשלח ללקוח לאישור' },
  { id: 'order-graphics', hash: '#/orders/{dimriGat}?tab=graphics', title: 'כרטיס הזמנה: גרפיקה' },
  { id: 'order-details', hash: '#/orders/{dimriGat}?tab=details', title: 'כרטיס הזמנה: פרטים' },
  { id: 'order-production', hash: '#/orders/{prod6}?tab=production', title: 'כרטיס הזמנה: ייצור' },
  { id: 'order-install', hash: '#/orders/{missedYokneam}?tab=install', title: 'כרטיס הזמנה: מוכן ולא שובץ' },
  { id: 'order-money', hash: '#/orders/{shukNesher}?tab=money', title: 'כרטיס הזמנה: מסמכים (נחתם בשטח)' },
  { id: 'order-log', hash: '#/orders/{shukNesher}?tab=log', title: 'כרטיס הזמנה: יומן' },
  { id: 'order-missing', hash: '#/orders/999999', title: 'הזמנה שלא קיימת' },
  { id: 'graphics', hash: '#/graphics', title: 'גרפיקה: התור של אינה' },
  { id: 'graphics-sent', hash: '#/graphics?f=sent', title: 'גרפיקה: נשלח לאישור' },
  { id: 'production', hash: '#/production', title: 'ייצור לפי מכונה' },
  { id: 'production-cnc', hash: '#/production?m=cnc', title: 'ייצור: CNC' },
  { id: 'installs-board', hash: '#/installs?view=board', title: 'התקנות: לוח לפי אזור' },
  { id: 'installs-teams', hash: '#/installs?view=teams&day=1', title: 'התקנות: לפי צוות, מחר' },
  { id: 'route-noam', hash: '#/installs/route?team=noam&day=1', title: 'הסידור של נועם מחר + יוקנעם שנשכחה' },
  { id: 'route-meir', hash: '#/installs/route?team=meir&day=1', title: 'הסידור של מאיר מחר + אופקים' },
  { id: 'route-ido-today', hash: '#/installs/route?team=ido&day=0', title: 'הסידור של עידו היום' },
  { id: 'field-day', hash: '#/field?team=noam', title: 'אפליקציית המתקין: היום של נועם' },
  { id: 'field-photo', hash: '#/field?team=noam&stop={noamStop}&step=photo', title: 'מתקין: צילום' },
  { id: 'field-sign', hash: '#/field?team=noam&stop={noamStop}&step=sign', search: 'signed=1', title: 'מתקין: חתימת הלקוח' },
  { id: 'field-sent', hash: '#/field?team=noam&stop={noamStop}&step=sent', title: 'מתקין: נשלח' },
  { id: 'accounting', hash: '#/accounting', title: 'הנהלת חשבונות: סוף החודש' },
  { id: 'accounting-sign', hash: '#/accounting?f=sign', title: 'הנהלת חשבונות: חסרה חתימה' },
  { id: 'accounting-ocr', hash: '#/accounting?ocr=run', title: 'הנהלת חשבונות: קליטת חשבונית בצילום', waitFor: '#ocrOk' },
  { id: 'pricing', hash: '#/pricing', title: 'מחירים: דלק, שלט פח 40/30' },
  { id: 'pricing-dimri', hash: '#/pricing?c=dimri', title: 'מחירים: דימרי' },
  { id: 'studio', hash: '#/studio', title: 'סטודיו: סכנה כאן בונים 50/70' },
  { id: 'assistant', hash: '#/assistant', title: 'העוזר: פתיחה' },
  { id: 'assistant-price', hash: '#/assistant?scenario=price', title: 'העוזר: מחיר אחרון לדלק', scenario: true },
  { id: 'assistant-route', hash: '#/assistant?scenario=route', title: 'העוזר: הסידור של נועם', scenario: true },
  { id: 'whatsapp', hash: '#/whatsapp?run=1', title: 'ווטסאפ (איור)' },
  { id: 'rivhit', hash: '#/rivhit', title: 'חיבור לרווחית (איור)' },
  { id: 'about', hash: '#/about', title: 'על ההדגמה' },
  { id: 'notfound', hash: '#/nope', title: 'דף לא נמצא' },
  { id: 'sheet-search', hash: '#/', title: 'חיפוש (שיט)', click: '#btnSearch', type: ['#qInput', 'דלק'] },
  { id: 'sheet-me', hash: '#/', title: 'תפריט אישי (שיט)', click: '#btnMe' },
  { id: 'sheet-more', hash: '#/', title: 'כל המסכים (שיט, מובייל)', click: '#btnMore', mobileOnly: true }
].filter(s => !ONLY.length || ONLY.includes(s.id));
const VIEWPORTS = [{ id: 'desktop', w: 1440, h: 900, mobile: false }, { id: 'mobile', w: 390, h: 844, mobile: true }, { id: 'narrow', w: 360, h: 760, mobile: true }].filter(v => VP === 'all' || VP.split(',').includes(v.id));

/* ── CDP ── */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.waits = new Map(); this.handlers = new Map(); }
  static async attach(port) {
    for (let i = 0; i < 100; i++) {
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
        const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) { const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')); }); const c = new CDP(ws); ws.onmessage = ev => c._msg(JSON.parse(ev.data)); return c; }
      } catch (e) { }
      await sleep(250);
    }
    throw new Error('לא הצלחתי להתחבר ל-Chrome');
  }
  _msg(m) { if (m.id && this.waits.has(m.id)) { const { res, rej } = this.waits.get(m.id); this.waits.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; } const h = this.handlers.get(m.method); if (h) Promise.resolve(h(m.params)).catch(() => { }); }
  on(method, cb) { this.handlers.set(method, cb); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { this.waits.set(id, { res, rej }); setTimeout(() => { if (this.waits.has(id)) { this.waits.delete(id); rej(new Error('CDP timeout: ' + method)); } }, 60000); }); }
  async evaluate(expr) { const r = await this.send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('שגיאה בדף: ' + JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; }
}
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chrome לא נמצא'); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xmedia-shots-'));
const port = 9543 + Math.floor(Math.random() * 200);
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1', '--force-color-profile=srgb', '--lang=he', '--allow-file-access-from-files', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });

const CHECKS = (mobile) => `
  const vw = window.innerWidth; const bad = [];
  document.querySelectorAll('body *').forEach(el => { if (bad.length > 6) return; const r = el.getBoundingClientRect(); if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') { let p = el.parentElement, ok = false; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { ok = true; break; } p = p.parentElement; } if (!ok) bad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' ' + Math.round(r.right - vw) + 'px'); } });
  const leftBad = []; document.querySelectorAll('body *').forEach(el => { if (leftBad.length > 4) return; const r = el.getBoundingClientRect(); if (r.width > 0 && r.left < -1 && getComputedStyle(el).position !== 'fixed') { let p = el.parentElement, ok = false; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { ok = true; break; } p = p.parentElement; } if (!ok && !el.closest('.sr')) leftBad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' ' + Math.round(r.left) + 'px'); } });
  const txt = document.body.innerText || '';
  const imgs = [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src'));
  const liFlex = [...document.querySelectorAll('li')].filter(li => /flex|grid/.test(getComputedStyle(li).display)).length;
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('.hide'); };
  const small = ${mobile} ? [...document.querySelectorAll('button, a[href], select, input:not([type=checkbox]):not([type=radio]), textarea')].filter(el => vis(el) && !el.classList.contains('ilink') && !el.closest('svg') && !el.closest('.sr')).filter(el => { const r = el.getBoundingClientRect(); return r.height < 40 || r.width < 36; }).slice(0, 8).map(el => el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '') + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height) + ' "' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 18) + '"') : [];
  const clipped = [...document.querySelectorAll('body *')].filter(el => { if (!vis(el) || el.classList.contains('sr') || el.hasAttribute('data-clip-ok') || el.closest('[data-clip-ok]')) return false; const cs = getComputedStyle(el); if (cs.overflowX !== 'hidden' && cs.overflow !== 'hidden') return false; if (cs.textOverflow === 'ellipsis') return false; const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); return own && el.scrollWidth > el.clientWidth + 2; }).slice(0, 5).map(el => el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''));
  let behindBar = false;
  if (${mobile}) { const bar = document.querySelector('.tabbar'); const foot = document.querySelector('.foot'); if (bar && foot && getComputedStyle(bar).display !== 'none') { window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 60)); const last = foot.lastElementChild.getBoundingClientRect(); behindBar = last.bottom > bar.getBoundingClientRect().top + 1; window.scrollTo(0, 0); } }
  const h1 = [...document.querySelectorAll('h1')].filter(vis).length;
  return {
    overflow: document.documentElement.scrollWidth > vw + 1, scrollWidth: document.documentElement.scrollWidth, vw, offenders: bad, leftOffenders: leftBad,
    dash: /[\\u2013\\u2014]/.test(txt), lida: /לידה|לידות/.test(txt), h1,
    rtl: document.documentElement.dir === 'rtl' && document.documentElement.lang === 'he', liFlex, brokenImgs: imgs,
    leak: /\\{\\{|undefined|NaN|\\[object|Invalid Date/.test(txt),
    fonts: document.fonts.check('700 16px Heebo') && document.fonts.check('16px Assistant'),
    small, clipped, behindBar, title: document.title, hash: location.hash
  };`;

const shots = []; const allErrors = []; let netFails = [];
try {
  const cdp = await CDP.attach(port);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable'); await cdp.send('Log.enable').catch(() => { });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }).catch(() => { });
  cdp.on('Runtime.exceptionThrown', p => allErrors.push('JS: ' + String((p.exceptionDetails || {}).text || '') + ' ' + String(((p.exceptionDetails || {}).exception || {}).description || '').slice(0, 300)));
  cdp.on('Runtime.consoleAPICalled', p => { if (p.type === 'error') allErrors.push('JS: console.error ' + JSON.stringify((p.args || []).map(a => a.value || a.description)).slice(0, 300)); });
  cdp.on('Log.entryAdded', p => { const e = p.entry || {}; if (e.level === 'error' && !/favicon|fonts\.g/.test(e.text + (e.url || ''))) allErrors.push('LOG: ' + String(e.text || '').slice(0, 300) + ' ' + (e.url || '')); });
  cdp.on('Network.loadingFailed', p => { if (!/net::ERR_ABORTED/.test(p.errorText)) netFails.push(p.errorText + ' ' + (p.type || '')); });
  cdp.on('Network.responseReceived', p => { const r = p.response || {}; if (r.status >= 400 && !/favicon/.test(r.url)) netFails.push(r.status + ' ' + r.url.slice(0, 140)); });

  const setViewport = v => cdp.send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: v.mobile });
  const waitReady = async (st) => {
    await cdp.evaluate(`await new Promise(r => setTimeout(r, 80)); if (window.__demo) await window.__demo.ready(); return true;`).catch(() => { });
    for (let i = 0; i < 40; i++) { const ok = await cdp.evaluate(`return [...document.images].every(i => i.complete) && !!window.__demo;`).catch(() => false); if (ok) break; await sleep(120); }
    if (st && st.scenario) { for (let i = 0; i < 60; i++) { const ok = await cdp.evaluate(`return !!(window.__demo && window.__demo.scenarioDone);`).catch(() => false); if (ok) break; await sleep(120); } }
    if (st && st.waitFor) { for (let i = 0; i < 60; i++) { const ok = await cdp.evaluate(`return !!document.querySelector(${JSON.stringify(st.waitFor)});`).catch(() => false); if (ok) break; await sleep(120); } }
    await sleep(250);
  };
  const shot = async (file) => {
    const m = await cdp.send('Page.getLayoutMetrics'); const cs = m.cssContentSize || m.contentSize; const vis = m.cssVisualViewport || m.visualViewport;
    const sheetOpen = await cdp.evaluate(`return !!document.querySelector('.sheet-bg.open');`).catch(() => false);
    const h = Math.min(Math.ceil(sheetOpen ? vis.clientHeight : cs.height), 9000);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !sheetOpen, clip: { x: 0, y: 0, width: Math.ceil(vis.clientWidth), height: h, scale: 1 } });
    fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, 'base64')); return h;
  };

  let heroes = null; let navN = 0;
  for (const v of VIEWPORTS) {
    await setViewport(v); await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: v.mobile, maxTouchPoints: v.mobile ? 5 : 1 }).catch(() => { });
    let currentSearch = null;
    for (const st of STATES) {
      if (st.mobileOnly && !v.mobile) continue;
      const before = allErrors.length; netFails = [];
      const search = `?shot=1&today=${TODAY}${st.search ? '&' + st.search : ''}`;
      const needsLoad = search !== currentSearch || st.search || st.click;
      if (!heroes) {
        await cdp.send('Page.navigate', { url: BASE + `?shot=1&fresh=1&today=${TODAY}#/` }); await sleep(700); await waitReady();
        heroes = await cdp.evaluate(`const X = window.X, D = X.D; const p6 = D.orders.find(o => o.stage === 6 && o.lines.length); const ns = X.orderRoute(X.routeOf('noam', D.today)).find(o => o.install.status !== 'done'); return Object.assign({}, D.heroes, { prod6: p6 && p6.no, noamStop: ns && ns.no });`);
        currentSearch = null;
      }
      const hash = st.hash.replace(/\{(\w+)\}/g, (m, k) => heroes[k] || m);
      if (needsLoad) { await cdp.send('Page.navigate', { url: BASE + search + '&fresh=1&n=' + (++navN) + hash }); currentSearch = st.search || st.click ? null : search; await sleep(600); }
      else { await cdp.evaluate(`const h = ${JSON.stringify(hash)}; if (location.hash === h) { window.dispatchEvent(new HashChangeEvent('hashchange')); } else { location.hash = h; } return true;`); }
      await waitReady(st);
      if (st.click) { const hit = await cdp.evaluate(`const el = document.querySelector(${JSON.stringify(st.click)}); if (el && el.getBoundingClientRect().width) { el.click(); return true; } return false;`); if (!hit) allErrors.push('JS: click target missing ' + st.click); await sleep(350); }
      if (st.type) { await cdp.evaluate(`const el = document.querySelector(${JSON.stringify(st.type[0])}); if (el) { el.value = ${JSON.stringify(st.type[1])}; el.dispatchEvent(new Event('input', { bubbles: true })); } return true;`); await sleep(200); }
      let checks = {}; try { checks = await cdp.evaluate(CHECKS(v.mobile)); } catch (e) { checks = { error: String(e.message) }; }
      const file = `${v.id}-${st.id}.png`; const height = await shot(file);
      const errors = allErrors.slice(before).concat(netFails.filter(x => !/fonts\.(googleapis|gstatic)/.test(x)).map(x => 'NET: ' + x));
      const hard = [];
      if (errors.some(e => e.startsWith('JS:') || e.startsWith('LOG:'))) hard.push('שגיאת JS: ' + errors.filter(e => e.startsWith('JS:') || e.startsWith('LOG:')).join(' | ').slice(0, 300));
      if (errors.some(e => e.startsWith('NET:'))) hard.push('כשל רשת: ' + errors.filter(e => e.startsWith('NET:')).join(' | ').slice(0, 200));
      if (checks.overflow) hard.push('גלילה אופקית ' + (checks.scrollWidth - checks.vw) + 'px: ' + (checks.offenders || []).join(', '));
      if ((checks.offenders || []).length) hard.push('חריגה מימין למסך: ' + checks.offenders.join(', '));
      if ((checks.leftOffenders || []).length) hard.push('חריגה משמאל למסך: ' + checks.leftOffenders.join(', '));
      if (checks.dash) hard.push('מקף ארוך בטקסט'); if (checks.lida) hard.push('"לידה" בטקסט'); if (checks.h1 !== 1) hard.push('h1 x' + checks.h1);
      if (!checks.rtl) hard.push('dir/lang'); if (checks.liFlex) hard.push('li flex x' + checks.liFlex); if ((checks.brokenImgs || []).length) hard.push('תמונות שבורות: ' + checks.brokenImgs.join(', ')); if (checks.leak) hard.push('תבנית דלפה (undefined/NaN)');
      if ((checks.small || []).length) hard.push('יעדי מגע קטנים: ' + checks.small.join(' ; '));
      if ((checks.clipped || []).length) hard.push('טקסט חתוך: ' + checks.clipped.join(', '));
      if (checks.behindBar) hard.push('תוכן מוסתר מאחורי סרגל הטאבים');
      if (checks.error) hard.push('בדיקות נכשלו: ' + checks.error);
      const soft = []; if (!checks.fonts) soft.push('פונטים לא נטענו');
      shots.push({ vp: v.id, id: st.id, title: st.title, file, height, hard, soft, errors, checks });
      console.log(`  ${hard.length ? '✗' : '✓'} ${v.id.padEnd(7)} ${st.id.padEnd(18)} ${String(height).padStart(5)}px ${hard.join(' · ')}${soft.length ? '  (' + soft.join(' · ') + ')' : ''}`);
    }
  }
} catch (e) { console.error('כשל:', e.message); process.exitCode = 1; }
finally { try { proc.kill(); } catch (e) { } await sleep(400); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { } }

/* ── דוח וגלריה ── */
const hardCount = shots.filter(s => s.hard.length).length + staticIssues.length;
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), staticIssues, shots }, null, 2), 'utf8');
const byState = {}; shots.forEach(s => { (byState[s.id] = byState[s.id] || { title: s.title, vps: {} }).vps[s.vp] = s; });
const gal = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>גלריית צילומים: הדגמת איקס מדיה</title>
<style>body{font-family:Heebo,Assistant,Arial,sans-serif;background:#F4F4F5;margin:0;padding:24px;color:#1E1E1E}h1{font-size:22px}.sum{padding:12px 16px;border-radius:12px;background:${hardCount ? '#FEE4E2' : '#E3F3EA'};margin-block:12px 20px}
.st{background:#fff;border:1px solid #E6E6E6;border-radius:16px;padding:16px;margin-block-end:22px}.st h2{font-size:17px;margin:0 0 10px}.row{display:grid;grid-template-columns:1fr 390px 360px;gap:16px;align-items:start}
img{max-width:100%;border:1px solid #ddd;border-radius:8px;display:block}.ok{color:#0F7A4A}.bad{color:#C4271B}.chk{font-size:12.5px;color:#555;margin-block-start:6px}code{font-size:12px}</style></head><body>
<h1>גלריית צילומים: הדגמת איקס מדיה</h1><div class="sum">${hardCount ? `<b class="bad">${hardCount} תקלות קשות</b>` : '<b class="ok">כל הבדיקות הקשות עברו</b>'} · ${shots.length} צילומים · ${new Date().toLocaleString('he-IL')} · מקור: <code>${BASE}</code>${staticIssues.length ? '<br>' + staticIssues.map(s => '✗ ' + s).join('<br>') : ''}</div>
${Object.entries(byState).map(([id, s]) => `<div class="st"><h2>${s.title} <code>${id}</code></h2><div class="row">${['desktop', 'mobile', 'narrow'].map(vp => { const x = s.vps[vp]; if (!x) return '<div></div>'; return `<div><img src="${x.file}" alt="${x.title}" loading="lazy"><div class="chk">${vp} · ${x.height}px ${x.hard.length ? `<b class="bad">✗ ${x.hard.join(' · ')}</b>` : '<b class="ok">✓</b>'}${x.soft.length ? ' · ' + x.soft.join(' · ') : ''}</div></div>`; }).join('')}</div></div>`).join('')}
</body></html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), gal, 'utf8');
console.log(`── ${hardCount ? hardCount + ' תקלות קשות' : 'נקי'} · ${shots.length} צילומים · ${path.join(OUT, 'index.html')}`);
process.exit(hardCount ? 1 : 0);
