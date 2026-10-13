#!/usr/bin/env node
// לוחץ על כל מה שאפשר ללחוץ עליו בכל מסך (כפתורים, קישורים, טאבים, שדות, רשימות), פותח כל שיט וסוגר אותו,
// ומריץ את הזרימות המרכזיות מקצה לקצה. נכשל על כל שגיאת JS, גלילה אופקית, שיט שלא נסגר, או זרימה שלא הגיעה לתוצאה.
// הרצה:  node tools/clickthrough.mjs            (file://)
//        node tools/clickthrough.mjs --url https://smartscale-biz.github.io/oren-tadgi-demo/
//        node tools/clickthrough.mjs --vp mobile --only orders
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = arg('--url', pathToFileURL(path.join(ROOT, 'docs', 'index.html')).href).replace(/#.*$/, '');
const VP = arg('--vp', 'desktop,mobile');
const ONLY = (arg('--only', '') || '').split(',').filter(Boolean);
const TODAY = '2026-10-19';
const PER_KIND = Number(arg('--per-kind', '2'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.waits = new Map(); this.handlers = new Map(); }
  static async attach(port) {
    for (let i = 0; i < 100; i++) {
      try { const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()); const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (page) { const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')); }); const c = new CDP(ws); ws.onmessage = ev => c._msg(JSON.parse(ev.data)); return c; } } catch (e) { }
      await sleep(250);
    }
    throw new Error('לא הצלחתי להתחבר ל-Chrome');
  }
  _msg(m) { if (m.id && this.waits.has(m.id)) { const { res, rej } = this.waits.get(m.id); this.waits.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; } const h = this.handlers.get(m.method); if (h) Promise.resolve(h(m.params)).catch(() => { }); }
  on(method, cb) { this.handlers.set(method, cb); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { this.waits.set(id, { res, rej }); setTimeout(() => { if (this.waits.has(id)) { this.waits.delete(id); rej(new Error('CDP timeout: ' + method)); } }, 30000); }); }
  async ev(expr) { const r = await this.send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('שגיאה בדף: ' + JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; }
}
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xmedia-click-'));
const port = 9800 + Math.floor(Math.random() * 150);
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio', '--lang=he', '--allow-file-access-from-files', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });

const STATES = [
  '#/', '#/orders?view=list', '#/orders?view=kanban', '#/orders?view=machines', '#/orders/{delekAta}', '#/orders/{dimriGat}?tab=graphics', '#/orders/{prod6}?tab=production',
  '#/orders/{missedYokneam}?tab=install', '#/orders/{ready8}?tab=money', '#/graphics', '#/production', '#/installs?view=board', '#/installs?view=teams',
  '#/installs/route?team=noam&day=1', '#/field?team=noam', '#/accounting', '#/pricing', '#/studio', '#/assistant', '#/whatsapp', '#/rivhit', '#/about', '#/nope'
].filter(s => !ONLY.length || ONLY.some(o => s.indexOf(o) >= 0));

// JS שרץ בדף: אוסף את כל מה שלוחצים עליו, עם "סוג" לצמצום חזרות ו"מפתח" לאיתור אחרי רינדור מחדש
const COLLECT = (scope, skipShell) => `
  const root = ${scope === 'sheet' ? "document.querySelector('#sheet .sheet')" : 'document'};
  if (!root) return [];
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('.hide'); };
  const els = [...root.querySelectorAll('button, a[href], [role=tab], input, select, textarea')].filter(vis).filter(el => !el.disabled && !(${skipShell} && el.closest('.side, .tabbar, .top, .foot')) && (${scope === 'sheet'} || !el.closest('#sheet')) && !el.closest('#tour'));
  const seen = {};
  return els.map(el => {
    const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(c => c && !/^(on|active|flash|voted|over|dragging)$/.test(c)).slice(0, 2).join('.');
    const da = [...el.attributes].filter(a => a.name.indexOf('data-') === 0 && a.name !== 'data-w').map(a => a.name).join(',');
    const kind = el.tagName.toLowerCase() + '|' + cls + '|' + da + '|' + (el.getAttribute('href') || '').replace(/\\d+/g, '#').replace(/\\?.*/, '') + '|' + (el.type || '');
    const key = kind + '|' + (el.innerText || el.value || '').trim().slice(0, 40) + '|' + (el.getAttribute('aria-label') || '') + '|' + [...el.attributes].filter(a => a.name.indexOf('data-') === 0).map(a => a.value).join(',');
    seen[key] = (seen[key] || 0) + 1;
    return { kind, key, occ: seen[key] - 1, label: ((el.innerText || el.getAttribute('aria-label') || el.placeholder || el.id || el.tagName) + '').trim().replace(/\\s+/g, ' ').slice(0, 40), tag: el.tagName.toLowerCase(), type: el.type || '', reset: el.dataset.act === 'reset' || el.id === 'aReset' };
  });`;
const FIND = (key, occ, scope) => `
  const root = ${scope === 'sheet' ? "document.querySelector('#sheet .sheet')" : 'document'}; if (!root) return null;
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('.hide'); };
  const all = [...root.querySelectorAll('button, a[href], [role=tab], input, select, textarea')].filter(vis).filter(el => ${scope === 'sheet'} || !el.closest('#sheet'));
  let n = 0;
  for (const el of all) {
    const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(c => c && !/^(on|active|flash|voted|over|dragging)$/.test(c)).slice(0, 2).join('.');
    const da = [...el.attributes].filter(a => a.name.indexOf('data-') === 0 && a.name !== 'data-w').map(a => a.name).join(',');
    const kind = el.tagName.toLowerCase() + '|' + cls + '|' + da + '|' + (el.getAttribute('href') || '').replace(/\\d+/g, '#').replace(/\\?.*/, '') + '|' + (el.type || '');
    const key = kind + '|' + (el.innerText || el.value || '').trim().slice(0, 40) + '|' + (el.getAttribute('aria-label') || '') + '|' + [...el.attributes].filter(a => a.name.indexOf('data-') === 0).map(a => a.value).join(',');
    if (key === ${JSON.stringify(key)}) { if (n === ${occ}) { window.__ctEl = el; return true; } n++; }
  }
  return false;`;
const ACT = `
  const el = window.__ctEl; if (!el) return 'missing';
  if (el.disabled) return 'disabled';
  const t = el.tagName.toLowerCase();
  if (t === 'select') { el.selectedIndex = el.options.length > 1 ? el.options.length - 1 : 0; el.dispatchEvent(new Event('change', { bubbles: true })); return 'select'; }
  if (t === 'textarea' || (t === 'input' && !['checkbox', 'radio', 'submit', 'button'].includes(el.type))) {
    el.focus(); if (el.type === 'number') el.value = '3'; else if (el.type === 'date') el.value = '2026-10-23'; else el.value = (el.value ? el.value + ' ' : '') + 'בדיקה 12';
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    if (el.form) el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'type';
  }
  el.scrollIntoView({ block: 'center' }); el.click(); return 'click';`;
const STATUS = `return { hash: location.hash, sheet: !!document.querySelector('#sheet.open'), overflow: document.documentElement.scrollWidth > innerWidth + 1, demo: !!window.__demo, h1: document.querySelectorAll('h1').length, leak: /undefined|NaN|\\[object|Invalid Date/.test(document.body.innerText) };`;

const fails = []; const log = []; let errs = []; let clicks = 0;
const fail = (where, what) => { fails.push(`${where}: ${what}`); console.log(`   ✗ ${where}: ${what}`); };
try {
  const c = await CDP.attach(port);
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable').catch(() => { });
  await c.send('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => { });
  await c.send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => { });
  c.on('Runtime.exceptionThrown', p => errs.push('JS: ' + String(((p.exceptionDetails || {}).exception || {}).description || (p.exceptionDetails || {}).text || '').slice(0, 240)));
  c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error') errs.push('console.error ' + JSON.stringify((p.args || []).map(a => a.value || a.description)).slice(0, 200)); });
  c.on('Page.javascriptDialogOpening', () => { errs.push('דיאלוג דפדפן נפתח'); c.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => { }); });
  let nav = 0;
  const load = async (hash) => { await c.send('Page.navigate', { url: `${BASE}?shot=1&test=1&fresh=1&today=${TODAY}&n=${++nav}${hash}` }); for (let i = 0; i < 60; i++) { await sleep(100); const ok = await c.ev('return !!(window.__demo && document.querySelector("#view") && document.querySelector("#view").children.length);').catch(() => false); if (ok) break; } await sleep(120); };
  const go = async (hash) => { await c.ev(`document.querySelector('#sheet').classList.contains('open') && document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); if (location.hash !== ${JSON.stringify(hash)}) location.hash = ${JSON.stringify(hash)}; else window.dispatchEvent(new HashChangeEvent('hashchange')); return true;`); await sleep(160); };
  const st = () => c.ev(STATUS).catch(() => ({ demo: false }));

  for (const vp of VP.split(',')) {
    const mobile = vp !== 'desktop';
    await c.send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
    await c.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 }).catch(() => { });
    await load('#/');
    const H = await c.ev(`const X = window.X, D = X.D; const p6 = D.orders.find(o => o.stage === 6); const r8 = D.orders.find(o => o.stage === 8 && o.docs.signed && o.docs.po && !o.docs.invoiceNo); return Object.assign({}, D.heroes, { prod6: p6 && p6.no, ready8: r8 && r8.no });`);
    console.log(`── ${vp}`);
    let first = true;
    for (const raw of STATES) {
      const hash = raw.replace(/\{(\w+)\}/g, (m, k) => H[k]);
      await load(hash); errs = [];
      const list = await c.ev(COLLECT('page', !first));
      const per = {}; const pick = list.filter(x => { per[x.kind] = (per[x.kind] || 0) + 1; return per[x.kind] <= PER_KIND; });
      let n = 0, skipped = 0;
      for (const it of pick) {
        const where = `${vp} ${raw} › ${it.label}`;
        await go(hash);
        const found = await c.ev(FIND(it.key, it.occ, 'page')).catch(() => false);
        if (!found) { skipped++; continue; }
        errs = [];
        if (it.reset) {
          await c.ev('window.__ctMark = 1; return 1;');
          await c.ev(ACT).catch(() => { });
          let okReset = false;
          for (let i = 0; i < 60; i++) { await sleep(200); const s = await c.ev('return { mark: !!window.__ctMark, demo: !!window.__demo, view: document.querySelector("#view") ? document.querySelector("#view").children.length : 0 };').catch(() => null); if (s && !s.mark && s.demo && s.view) { okReset = true; break; } }
          if (!okReset) fail(where, 'האיפוס לא טען את האפליקציה מחדש');
          await load(hash); n++; clicks++; continue;
        }
        const r = await c.ev(ACT).catch(e => 'err ' + e.message);
        await sleep(220); n++; clicks++;
        const s = await st();
        if (errs.length) fail(where, errs.join(' | '));
        if (s.overflow) fail(where, 'גלילה אופקית אחרי הלחיצה');
        if (s.leak) fail(where, 'תבנית דלפה (undefined/NaN) אחרי הלחיצה');
        if (s.h1 < 1) fail(where, 'אין h1 אחרי הלחיצה');
        if (s.sheet) {
          // לוחצים על כל מה שבתוך השיט, ואז בודקים שהוא נסגר ב-Escape
          const inner = await c.ev(COLLECT('sheet', false));
          const iper = {}; const ipick = inner.filter(x => { iper[x.kind] = (iper[x.kind] || 0) + 1; return iper[x.kind] <= PER_KIND && !/sheet-x/.test(x.kind); });
          for (const ii of ipick) {
            const s0 = await st();
            if (!s0.sheet) { await go(hash); if (await c.ev(FIND(it.key, it.occ, 'page')).catch(() => false)) { await c.ev(ACT).catch(() => { }); await sleep(200); } }
            if (!(await c.ev(FIND(ii.key, ii.occ, 'sheet')).catch(() => false))) continue;
            errs = [];
            if (ii.reset) { await c.ev(ACT).catch(() => { }); await sleep(900); await load(hash); clicks++; continue; }
            await c.ev(ACT).catch(() => { }); await sleep(220); clicks++;
            const s2 = await st();
            if (errs.length) fail(`${where} › ${ii.label}`, errs.join(' | '));
            if (s2.overflow) fail(`${where} › ${ii.label}`, 'גלילה אופקית');
            if (s2.leak) fail(`${where} › ${ii.label}`, 'תבנית דלפה');
          }
          const s3 = await st();
          if (s3.sheet) { await c.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return 1;`); await sleep(150); if ((await st()).sheet) fail(where, 'השיט לא נסגר ב-Escape'); }
          // וגם בכפתור הסגירה
          await go(hash);
          if (await c.ev(FIND(it.key, it.occ, 'page')).catch(() => false)) { await c.ev(ACT).catch(() => { }); await sleep(200); if ((await st()).sheet) { const ok = await c.ev(`const x = document.querySelector('#sheet .sheet-x'); if (!x) return false; x.click(); return true;`); await sleep(150); if (!ok || (await st()).sheet) fail(where, 'השיט לא נסגר בכפתור X'); } }
        }
      }
      first = false;
      console.log(`  ${raw.padEnd(40)} ${String(n).padStart(3)} פעולות${skipped ? ` (${skipped} נעלמו אחרי רינדור, תקין)` : ''}`);
    }

    /* ── זרימות מקצה לקצה ── */
    const flow = async (name, fn) => { errs = []; try { const r = await fn(); if (r !== true) fail(`${vp} זרימה: ${name}`, String(r)); else console.log(`  ✓ זרימה: ${name}`); } catch (e) { fail(`${vp} זרימה: ${name}`, e.message); } if (errs.length) fail(`${vp} זרימה: ${name}`, errs.join(' | ')); };
    await flow('הזמנה חדשה מהודעת ווטסאפ עד הצעת מחיר', async () => {
      await load('#/orders?new=1'); const before = await c.ev('return window.X.D.orders.length;');
      await c.ev(`document.querySelector('#wzParse').click(); return 1;`); await sleep(300);
      await c.ev(`document.querySelector('[data-wz="next"]').click(); return 1;`); await sleep(150);
      const price = await c.ev(`return document.querySelector('[data-p="0"]').value;`);
      await c.ev(`document.querySelector('[data-wz="next"]').click(); return 1;`); await sleep(150);
      await c.ev(`document.querySelector('[data-wz="send"]').click(); return 1;`); await sleep(300);
      const r = await c.ev(`const o = window.X.D.orders[0]; return { n: window.X.D.orders.length, hash: location.hash, no: o.no, stage: o.stage, q: o.docs.quoteNo, c: o.customer };`);
      return r.n === before + 1 && r.hash === '#/orders/' + r.no && r.stage === 2 && r.q && r.c === 'delek' && price === '275' ? true : JSON.stringify(Object.assign(r, { price }));
    });
    await flow('גרירה בלוח השלבים', async () => {
      if (mobile) { await load('#/orders?view=kanban'); const no = await c.ev(`const b = document.querySelector('.kb-col[data-col="1"] [data-move]'); const no = b.dataset.move; b.click(); return no;`); await sleep(200); await c.ev(`document.querySelector('#sheet [data-stage="3"]').click(); return 1;`); await sleep(250); const st3 = await c.ev('return window.X.order(' + JSON.stringify(no) + ').stage;'); return st3 === 3 ? true : 'שלב אחרי העברה: ' + st3; }
      await load('#/orders?view=kanban');
      const r = await c.ev(`const card = document.querySelector('.kb-col[data-col="1"] .kb-card'); const no = card.dataset.no; const col = document.querySelector('.kb-col[data-col="4"]'); const dt = new DataTransfer(); card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); col.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); col.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); card.dispatchEvent(new DragEvent('dragend', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); return { stage: window.X.order(no).stage, inCol: !!document.querySelector('.kb-col[data-col="4"] [data-no="' + no + '"]') };`);
      return r.stage === 4 && r.inCol ? true : JSON.stringify(r);
    });
    await flow('הסידור של מחר: צירוף התחנה שנשכחה', async () => {
      await load('#/installs/route?team=noam&day=1');
      const b = await c.ev(`return document.querySelectorAll('.stops .stop').length;`);
      await c.ev(`document.querySelector('[data-add]').click(); return 1;`); await sleep(250);
      const a = await c.ev(`return { stops: document.querySelectorAll('.stops .stop').length, missed: !!document.querySelector('.missed'), yok: [...document.querySelectorAll('.stops .stop')].some(s => s.innerText.indexOf('יוקנעם') >= 0) };`);
      return a.stops === b + 1 && !a.missed && a.yok ? true : JSON.stringify(Object.assign(a, { b }));
    });
    await flow('ייצוא לאאוטלוק (ics)', async () => { await load('#/installs/route?team=noam&day=1'); await c.ev(`document.querySelector('#rIcs').click(); return 1;`); await sleep(150); const a = await c.ev(`return window.__demo.actions.join(',');`); return /הורדה .*\.ics/.test(a) ? true : 'לא נרשמה הורדה: ' + a; });
    await flow('המתקין: הגעתי, צילום, חתימה, שליחה', async () => {
      await load('#/field?team=noam');
      const no = await c.ev(`const b = document.querySelector('[data-arrive]'); const no = b.dataset.arrive; b.click(); return no;`); await sleep(200);
      await c.ev(`document.querySelector('[data-finish]').click(); return 1;`); await sleep(200);
      await c.ev(`document.querySelector('[data-ph="1"]').click(); return 1;`); await sleep(200);
      await c.ev(`document.querySelector('[data-tosign]').click(); return 1;`); await sleep(250);
      const dis = await c.ev(`return document.querySelector('#sigOk').disabled;`);
      // ציור אמיתי על הקנבס בעכבר/מגע
      const box = await c.ev(`const r = document.querySelector('#sig').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height };`);
      const type = mobile ? 'touch' : 'mouse';
      await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + 30, y: box.y + 60, button: 'left', clickCount: 1, pointerType: type });
      for (let i = 1; i <= 12; i++) await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 30 + i * 18, y: box.y + 60 + Math.sin(i) * 25, button: 'left', buttons: 1, pointerType: type });
      await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 250, y: box.y + 70, button: 'left', clickCount: 1, pointerType: type });
      await sleep(100);
      const en = await c.ev(`return !document.querySelector('#sigOk').disabled;`);
      await c.ev(`document.querySelector('#sigOk').click(); return 1;`); await sleep(500);
      const r = await c.ev(`const o = window.X.order(${JSON.stringify(no)}); return { stage: o.stage, signed: o.docs.signed, dn: o.docs.deliveryNo, sent: location.hash.indexOf('step=sent') >= 0 };`);
      return dis && en && r.stage === 8 && r.signed && r.dn && r.sent ? true : JSON.stringify(Object.assign(r, { dis, en }));
    });
    await flow('סוף חודש: הפקת כל החשבוניות המוכנות', async () => { await load('#/accounting'); await c.ev(`document.querySelector('#bulkInv').click(); return 1;`); await sleep(500); const r = await c.ev(`const D = window.X.D; return { ready: D.orders.filter(o => o.stage === 8 && o.docs.signed && (!window.X.cust(o.customer).po || o.docs.po) && !o.docs.invoiceNo).length, btn: !!document.querySelector('#bulkInv'), sheet: !!document.querySelector('#sheet.open') };`); return r.ready === 0 && !r.btn && !r.sheet ? true : JSON.stringify(r); });
    await flow('קליטת חשבונית ספק בצילום', async () => { await load('#/accounting'); await c.ev(`document.querySelector('#ocrGo').click(); return 1;`); await sleep(300); const r = await c.ev(`return { filled: document.querySelectorAll('.ocr-field.filled').length, ok: !!document.querySelector('#ocrOk') };`); if (r.filled !== 8 || !r.ok) return JSON.stringify(r); await c.ev(`document.querySelector('#ocrOk').click(); return 1;`); await sleep(100); return (await c.ev(`return document.querySelector('#ocrOk').disabled;`)) ? true : 'הכפתור לא ננעל אחרי הקליטה'; });
    await flow('סטודיו: שינוי שלט, PDF, וישר לייצור', async () => {
      await load('#/studio');
      await c.ev(`const i = document.querySelector('#sMain'); i.value = 'אין כניסה'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(100);
      const txt = await c.ev(`return document.querySelector('#sPrev').innerHTML.indexOf('אין כניסה') >= 0;`);
      await c.ev(`document.querySelector('#sPdf').click(); return 1;`); await sleep(100);
      const pr = await c.ev(`return window.__demo.actions.some(a => a.indexOf('הדפסה') === 0);`);
      await c.ev(`document.querySelector('#sSend').click(); return 1;`); await sleep(300);
      const r = await c.ev(`const o = window.X.D.orders[0]; return { stage: o.stage, machine: o.machine, hash: location.hash, title: o.title };`);
      return txt && pr && r.stage === 6 && r.hash.indexOf('#/orders/') === 0 && r.title.indexOf('אין כניסה') >= 0 ? true : JSON.stringify(Object.assign(r, { txt, pr }));
    });
    await flow('העוזר: שאלה חופשית', async () => { await load('#/assistant'); await c.ev(`const i = document.querySelector('#chatIn'); i.value = 'מה הסידור של נועם?'; document.querySelector('#chatForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); return 1;`); await sleep(300); const t = await c.ev(`const m = [...document.querySelectorAll('.msg.bot')].pop(); return m ? m.innerText : '';`); return /לנועם/.test(t) ? true : 'תשובה: ' + t.slice(0, 80); });
    await flow('כרטיס הזמנה: מעבר שלב, גרפיקה ואישור לקוח', async () => {
      await load('#/orders/' + H.dimriGat + '?tab=graphics');
      await c.ev(`document.querySelector('[data-g="send"]').click(); return 1;`); await sleep(150); await c.ev(`document.querySelector('#sheet [data-x="s"]').click(); return 1;`); await sleep(200);
      const s5 = await c.ev(`return window.X.order(${JSON.stringify(H.dimriGat)}).stage;`);
      await c.ev(`document.querySelector('[data-g="approve"]').click(); return 1;`); await sleep(200);
      const s6 = await c.ev(`return { s: window.X.order(${JSON.stringify(H.dimriGat)}).stage, tab: location.hash };`);
      return s5 === 5 && s6.s === 6 && /tab=production/.test(s6.tab) ? true : JSON.stringify({ s5, s6 });
    });
    await flow('סיור מודרך מתחילתו ועד סופו', async () => {
      await load('#/');
      await c.ev(`document.querySelector('.foot [data-act="tour"]').click(); return 1;`); await sleep(200);
      for (let i = 0; i < 5; i++) { const ok = await c.ev(`const b = document.querySelector('#tourNext'); if (!b) return false; b.click(); return true;`); if (!ok) return 'הסיור נעצר בשלב ' + (i + 1); await sleep(260); }
      const r = await c.ev(`return { hash: location.hash, open: document.querySelector('#tour').classList.contains('open') };`);
      return r.hash === '#/' && !r.open ? true : JSON.stringify(r);
    });
    await flow('חיפוש מהכותרת', async () => { await load('#/'); await c.ev(`document.querySelector('#btnSearch').click(); return 1;`); await sleep(150); await c.ev(`const i = document.querySelector('#qInput'); i.value = 'נשר'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(100); const n = await c.ev(`return document.querySelectorAll('#qRes a').length;`); await c.ev(`document.querySelector('#qRes a').click(); return 1;`); await sleep(250); const r = await c.ev(`return { hash: location.hash, sheet: !!document.querySelector('#sheet.open') };`); return n > 0 && /^#\/orders\/\d+/.test(r.hash) && !r.sheet ? true : JSON.stringify(Object.assign(r, { n })); });
    await flow('מצב נשמר אחרי רענון', async () => { await load('#/orders/' + H.delekAta); await c.ev(`document.querySelector('#oUrgent').click(); return 1;`); await sleep(300); await c.send('Page.navigate', { url: `${BASE}?shot=1&test=1&today=${TODAY}&n=${++nav}#/orders/${H.delekAta}` }); await sleep(900); const u = await c.ev(`return window.X.order(${JSON.stringify(H.delekAta)}).urgent;`); return u === false ? true : 'הסימון דחוף לא נשמר'; });
  }
} catch (e) { fail('כללי', e.message); }
finally { try { proc.kill(); } catch (e) { } await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { } }
console.log(`── ${fails.length ? fails.length + ' כשלים' : 'נקי'} · ${clicks} פעולות`);
process.exit(fails.length ? 1 : 0);
