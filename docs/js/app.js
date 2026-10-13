/* איקס מדיה שלטים · הדגמה · הליבה (וניל, בלי תלויות).
   ניתוב לפי hash, מצב ב-localStorage, שלד (סיידבר בדסקטופ, טאבים בתחתית במובייל), שיט, טוסט, סיור, אייקונים, ציורי SVG. */
(function () {
  'use strict';
  const D = window.DATA;
  const Q = new URLSearchParams(location.search);
  const SHOT = Q.has('shot');
  const TEST = Q.has('test');
  if (SHOT) document.documentElement.setAttribute('data-shot', '1');
  const KEY = 'xmedia_demo_v1';
  const SCREENS = window.SCREENS = window.SCREENS || {};

  /* ---------- כלים ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const num = n => `<bdi class="num">${fmt(n)}</bdi>`;
  const money = n => `<bdi class="num">₪${fmt(Math.round(n))}</bdi>`;
  const mono = s => `<span class="mono">${esc(s)}</span>`;
  const nums = s => esc(s).replace(/\d[\d,./:-]*\d|\d/g, m => `<bdi class="num">${m}</bdi>`);
  const pad = n => String(n).padStart(2, '0');
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const toDate = v => { if (v instanceof Date) return v; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); } return new Date(v); };
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fdate = v => { const d = toDate(v); return `${d.getDate()}.${d.getMonth() + 1}`; };
  const ftime = v => { const d = toDate(v); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fday = v => { const d = toDate(v); return `יום ${DAYS[d.getDay()]} ${fdate(d)}`; };
  const fmonth = v => { const d = toDate(v); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const relDay = v => { const k = typeof v === 'string' && v.length === 10 ? v : isoDay(toDate(v)); if (k === D.today) return 'היום'; if (k === D.workDay(1)) return 'מחר'; if (k === D.workDay(-1)) return 'אתמול'; return fday(k); };
  const t0 = Date.now();
  const now = () => new Date(new Date(D.now).getTime() + (SHOT ? 0 : Date.now() - t0));
  const ago = v => {
    const m = Math.max(0, Math.round((now() - toDate(v)) / 60000));
    if (m < 1) return 'עכשיו'; if (m < 60) return `לפני ${m} דק'`;
    const h = Math.round(m / 60); if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
    const d = Math.round(h / 24); return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
  };
  const hoursSince = v => (now() - toDate(v)) / 3600000;
  const sleep = ms => new Promise(r => setTimeout(r, SHOT ? 0 : ms));

  /* ---------- אייקונים ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/>',
    pen: '<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
    truck: '<path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.9 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-1.9 2-1.9H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10" cy="7" r="1.3"/><circle cx="15" cy="7.5" r="1.3"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .9c-1-.4-1.8-1.2-2.2-2.2l.9-1-1-2z"/>',
    plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="M9 6l6 6-6 6"/>', chevDown: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>', checks: '<path d="M2 12.5l4.5 4.5L16 7"/><path d="M11 16.5l.5.5L21 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    inbox: '<path d="M3 13l2.5-8h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    quote: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 15l2.5 2.5L16 12"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
    sign: '<path d="M3 17c3-4 5 2 8-2s4-6 6-2"/><path d="M3 21h18"/>',
    upload: '<path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/>',
    download: '<path d="M12 4v12"/><path d="M6 10l6 6 6-6"/><path d="M4 20h16"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/>',
    kanban: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    move: '<path d="M5 9l-3 3 3 3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    flame: '<path d="M12 22c4.4 0 7-3 7-6.6 0-3-2-5.3-3.6-7.1-.4 1.6-1.3 2.6-2.4 3.1C13.6 8.2 12 5.6 12 2c-3 2.4-7 6.2-7 12 0 4.4 3 8 7 8z"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>', arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M9 7V4h6v3"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18"/><path d="M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>'
  };
  const icon = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.info}</svg>`;

  /* ---------- מצב ---------- */
  function freshState() { return { orders: D.orders, feed: D.feed, counters: D.counters, tourDone: false, chat: null, liveIdx: 0 }; }
  let S = freshState();
  (function load() {
    if (Q.has('fresh')) { try { localStorage.removeItem(KEY); } catch (e) { } return; }
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return;
      const o = JSON.parse(raw);
      if (o && o.v === D.version && o.day === D.today && Array.isArray(o.orders)) { S = Object.assign(freshState(), o); D.orders = S.orders; D.feed = S.feed; D.counters = S.counters; }
    } catch (e) { }
  })();
  let saveT = null;
  function save() { clearTimeout(saveT); if (window.__resetting) return; saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { v: D.version, day: D.today, orders: D.orders, feed: D.feed, counters: D.counters }))); } catch (e) { } }, 120); }
  function resetAll() {
    try { localStorage.removeItem(KEY); } catch (e) { }
    S.tourDone = true; window.__resetting = true; clearTimeout(saveT);
    const u = new URL(location.href); u.searchParams.delete('fresh'); u.searchParams.delete('tour'); u.hash = '#/';
    const target = u.toString();
    if (target.split('#')[0] === location.href.split('#')[0]) { history.replaceState(null, '', target); location.reload(); } else location.replace(target);
  }

  /* ---------- גישה לנתונים ---------- */
  const order = no => D.orders.find(o => o.no === no);
  const cust = id => D.customers.find(c => c.id === id);
  const team = id => D.teams.find(t => t.id === id);
  const machine = id => D.machines.find(m => m.id === id);
  const stage = id => D.stages.find(s => s.id === id);
  const statusOf = o => o.urgent && o.stage < 7 ? 'urgent' : o.stage === 5 ? 'sent' : o.stage >= 6 ? 'done' : o.stage === 4 ? 'wait' : 'new';
  const statusName = s => ({ urgent: 'דחוף', sent: 'נשלח ללקוח לאישור', done: 'בוצע', wait: 'טרם הוכן', new: 'חדש' })[s];
  const shortTitle = (s, n) => { s = String(s || ''); n = n || 46; return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
  const teamTag = id => { const t = team(id); return t ? `<span class="team-tag"><span class="team-dot" style="background:${t.color}"></span>${esc(t.name)}</span>` : '<span class="tag warn">לא שובץ</span>'; };
  const machineTag = id => { const m = machine(id); return m ? `<span class="tag outline">${esc(m.name)}</span>` : '<span class="tag outline">התקנה בלבד</span>'; };
  const stTag = o => { const s = statusOf(o); return `<span class="tag ${s}">${s === 'urgent' ? icon('flame') : ''}${statusName(s)}</span>`; };
  const stageTag = o => `<span class="tag dark">${esc(stage(o.stage).name)}</span>`;
  const nextNo = k => { D.counters[k] += 1; return String(D.counters[k]).padStart(6, '0'); };

  function log(o, who, text) { o.log.push({ at: now().toISOString(), who, text }); }
  function feedPush(f) { D.feed.unshift(Object.assign({ at: now().toISOString() }, f)); if (D.feed.length > 60) D.feed.length = 60; save(); }
  function setStage(o, s, who) {
    who = who || 'סמדר';
    const prev = o.stage; if (s === prev) return;
    o.stage = s;
    const t = now().toISOString();
    if (s >= 2 && !o.docs.quoteNo) { o.docs.quoteNo = nextNo('quote'); log(o, who, `הצעת מחיר ${o.docs.quoteNo} נוצרה ברווחית`); }
    if (s >= 4 && !o.graphics.versions.length) o.graphics.versions.push({ v: 1, by: o.needsGraphics ? 'אינה' : 'קובץ מהלקוח', at: t });
    if (s === 5 && !o.graphics.sentAt) o.graphics.sentAt = t;
    if (s >= 6 && !o.graphics.approvedAt) { o.graphics.approvedAt = t; if (!o.graphics.sentAt) o.graphics.sentAt = t; }
    if (s >= 6 && !o.production.assignee) o.production.assignee = (machine(o.machine) || {}).operator || 'מתן';
    if (s >= 7) { o.production.checklist = { material: true, printed: true, cut: true, packed: true }; if (!o.install) o.install = { team: null, date: null, slot: null, status: 'unscheduled', photos: [], contact: cust(o.customer).contact.name }; }
    if (s >= 8 && !o.docs.deliveryNo) { o.docs.deliveryNo = nextNo('delivery'); if (o.install) o.install.status = 'done'; }
    log(o, who, `עבר לשלב "${stage(s).name}"`);
    feedPush({ type: s === 5 ? 'quote' : s >= 8 ? 'sign' : 'prod', text: `${cust(o.customer).name}: ההזמנה ${o.no} עברה ל"${stage(s).name}"`, link: '#/orders/' + o.no });
    save();
  }
  const routeOf = (teamId, dayIso) => D.orders.filter(o => o.install && o.install.team === teamId && o.install.date === dayIso).sort((a, b) => (a.install.order || 0) - (b.install.order || 0) || String(a.install.slot).localeCompare(String(b.install.slot)));

  /* גאוגרפיה */
  const km = (a, b) => { const A = D.cities[a], B = D.cities[b]; if (!A || !B) return 0; const R = 6371, dLat = (B[0] - A[0]) * Math.PI / 180, dLon = (B[1] - A[1]) * Math.PI / 180; const x = Math.sin(dLat / 2) ** 2 + Math.cos(A[0] * Math.PI / 180) * Math.cos(B[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 1.25); };
  function orderRoute(stops) { // שכן קרוב מנתיבות
    const left = stops.slice(); const out = []; let cur = D.baseCity;
    while (left.length) { left.sort((a, b) => km(cur, a.city) - km(cur, b.city)); const n = left.shift(); out.push(n); cur = n.city; }
    return out;
  }
  function missedFor(stops, dayIso) {
    if (!stops.length) return [];
    return D.orders.filter(o => o.stage === 7 && o.install && !o.install.date && stops.every(s => s.no !== o.no) && stops.some(s => km(s.city, o.city) <= 40));
  }

  /* ---------- ציורי SVG ---------- */
  function sketch(opts) {
    const o = Object.assign({ w: 300, h: 150, bg: '#B81828', fg: '#FFFFFF', title: '', sub: '', band: true }, opts || {});
    const W = 300, H = Math.max(80, Math.min(420, Math.round(W * o.h / o.w)));
    const tt = shortTitle(o.title, 22), ss = shortTitle(o.sub, 34);
    const fs = Math.max(13, Math.min(34, Math.round(H / 4.5), Math.floor((W - 96) / (tt.length * 0.56))));
    const t = esc(tt), s = esc(ss);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${t}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="6" fill="${o.bg}" stroke="rgba(0,0,0,.18)"/>${o.band ? `<rect x="1" y="${H - Math.round(H / 5)}" width="${W - 2}" height="${Math.round(H / 5) - 1}" fill="rgba(0,0,0,.18)"/>` : ''}<circle cx="${W - 38}" cy="${Math.round(H / 2) - (o.band ? 10 : 0)}" r="${Math.min(24, H / 4)}" fill="${o.fg}" opacity=".95"/><path d="M${W - 48} ${Math.round(H / 2) - 20 - (o.band ? 10 : 0)} l20 20 m0 -20 l-20 20" transform="translate(0 10)" stroke="${o.bg}" stroke-width="6" stroke-linecap="round"/><text x="${W - 76}" y="${Math.round(H / 2) - (o.band ? 6 : -4)}" text-anchor="start" font-family="Heebo, Arial" font-weight="800" font-size="${fs}" fill="${o.fg}" direction="rtl">${t}</text>${s ? `<text x="${W - 76}" y="${Math.round(H / 2) + fs - (o.band ? 6 : -4)}" text-anchor="start" font-family="Assistant, Arial" font-weight="600" font-size="${Math.round(fs * .48)}" fill="${o.fg}" opacity=".9" direction="rtl">${s}</text>` : ''}</svg>`;
  }
  const PALETTE = [['#B81828', '#FFFFFF'], ['#0F3D6E', '#FFFFFF'], ['#F2C400', '#1E1E1E'], ['#1E1E1E', '#F2C400'], ['#0E6B3A', '#FFFFFF'], ['#FFFFFF', '#B81828']];
  function orderSketch(o, v) {
    const c = cust(o.customer); const line = o.lines[0]; const m = /^(\d+)\/(\d+)$/.exec(line.size || '');
    const pal = c.id === 'delek' ? ['#F2C400', '#0B4EA2'] : c.id === 'shuk' ? ['#0E6B3A', '#FFD200'] : c.id === 'dimri' ? ['#1E1E1E', '#FFFFFF'] : PALETTE[(o.no.charCodeAt(5) + (v || 0)) % PALETTE.length];
    return sketch({ w: m ? Number(m[1]) : 300, h: m ? Number(m[2]) : 140, bg: pal[0], fg: pal[1], title: c.name, sub: o.branch.replace(c.name, '').trim() || line.name });
  }
  function photo(i, label) {
    const skies = [['#9CC8F0', '#E6F2FC'], ['#7FB2E5', '#DCEBFA'], ['#F3C68E', '#FBE8D0']];
    const sk = skies[i % 3]; const walls = ['#D9D2C5', '#C7CED6', '#E3DED3'][i % 3]; const signC = ['#0E6B3A', '#B81828', '#F2C400'][i % 3];
    const id = 'g' + i + Math.random().toString(36).slice(2, 6);
    return `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk[0]}"/><stop offset="1" stop-color="${sk[1]}"/></linearGradient></defs><rect width="160" height="120" fill="url(#${id})"/><rect x="0" y="92" width="160" height="28" fill="#9A9A9A"/><rect x="${18 + i * 4}" y="34" width="${120 - i * 6}" height="60" fill="${walls}"/><rect x="${24 + i * 4}" y="40" width="${108 - i * 6}" height="16" rx="2" fill="${signC}"/><text x="${78}" y="52" text-anchor="middle" font-family="Heebo,Arial" font-weight="800" font-size="9" fill="#fff">${esc(shortTitle(label || 'שלט', 16))}</text><rect x="${30 + i * 4}" y="62" width="26" height="30" fill="#5E7A8F" opacity=".75"/><rect x="${62 + i * 3}" y="62" width="26" height="30" fill="#5E7A8F" opacity=".75"/><rect x="${96}" y="66" width="18" height="26" fill="#6B5747"/>${i === 1 ? '<path d="M128 92 l6 -40 l4 0 l6 40" stroke="#555" stroke-width="2" fill="none"/>' : ''}</svg>`;
  }

  /* ---------- טוסט ---------- */
  let toastT = null;
  function toast(msg, ic) { const el = $('#toast'); el.innerHTML = `<div class="toast-msg" role="status">${icon(ic || 'check')}<span>${msg}</span></div>`; clearTimeout(toastT); toastT = setTimeout(() => { el.innerHTML = ''; }, SHOT ? 60000 : 3200); }

  /* ---------- שיט / מודאל ---------- */
  let sheetClose = null;
  function sheet(o) {
    const bg = $('#sheet');
    bg.innerHTML = `<div class="sheet${o.wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"><div class="sheet-head"><h2 id="sheetTitle">${o.title}</h2><button class="icon-btn sheet-x" type="button" aria-label="סגירה">${icon('x')}</button></div><div class="sheet-body">${o.body || ''}</div>${o.foot ? `<div class="sheet-foot">${o.foot}</div>` : ''}</div>`;
    bg.classList.add('open'); document.body.style.overflow = 'hidden';
    sheetClose = o.onClose || null;
    $('.sheet-x', bg).addEventListener('click', closeSheet);
    bg.onclick = e => { if (e.target === bg) closeSheet(); };
    const first = $('.sheet-body input, .sheet-body textarea', bg); if (first && !('ontouchstart' in window) && !SHOT) setTimeout(() => first.focus(), 60);
    if (o.onOpen) o.onOpen($('.sheet', bg));
    return $('.sheet', bg);
  }
  function closeSheet() { const bg = $('#sheet'); if (!bg.classList.contains('open')) return; bg.classList.remove('open'); bg.innerHTML = ''; document.body.style.overflow = ''; const f = sheetClose; sheetClose = null; if (f) f(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- פעולות "חיצוניות" (בבדיקות: נרשמות במקום לרוץ) ---------- */
  const actions = [];
  function external(kind, fn) { if (TEST) { actions.push(kind); toast('בדיקה: ' + kind, 'info'); return; } fn(); }
  function download(name, text, type) { external('הורדה ' + name, () => { const b = new Blob([text], { type: type || 'text/plain;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400); }); }
  function openExternal(url) { external('פתיחת קישור', () => window.open(url, '_blank', 'noopener')); }
  function printHtml(html, title) {
    external('הדפסה ' + (title || ''), () => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;inset-inline-start:-9999px;inline-size:10px;block-size:10px;border:0'; document.body.appendChild(f);
      const d = f.contentDocument; d.open(); d.write(html); d.close();
      setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } setTimeout(() => f.remove(), 2000); }, 350);
    });
  }

  /* ---------- ניווט ---------- */
  const NAV = [
    { id: 'home', href: '#/', label: 'היום', icon: 'home', group: 'עבודה יומית' },
    { id: 'orders', href: '#/orders', label: 'הזמנות', icon: 'clipboard', group: 'עבודה יומית' },
    { id: 'graphics', href: '#/graphics', label: 'גרפיקה', icon: 'pen', group: 'עבודה יומית' },
    { id: 'production', href: '#/production', label: 'ייצור', icon: 'factory', group: 'עבודה יומית' },
    { id: 'installs', href: '#/installs', label: 'התקנות', icon: 'truck', group: 'עבודה יומית' },
    { id: 'field', href: '#/field', label: 'אפליקציית מתקין', icon: 'phone', group: 'שטח' },
    { id: 'accounting', href: '#/accounting', label: 'הנהלת חשבונות', icon: 'receipt', group: 'כספים' },
    { id: 'pricing', href: '#/pricing', label: 'מחירים והיסטוריה', icon: 'tag', group: 'כספים' },
    { id: 'studio', href: '#/studio', label: 'סטודיו: שלט מוכן', icon: 'palette', group: 'כלים' },
    { id: 'assistant', href: '#/assistant', label: 'העוזר החכם', icon: 'sparkles', group: 'כלים' },
    { id: 'whatsapp', href: '#/whatsapp', label: 'ווטסאפ', icon: 'wa', group: 'כלים' },
    { id: 'rivhit', href: '#/rivhit', label: 'חיבור לרווחית', icon: 'plug', group: 'כלים' },
    { id: 'about', href: '#/about', label: 'על ההדגמה', icon: 'info', group: 'כלים' }
  ];
  const TABS = ['home', 'orders', 'production', 'installs'];
  function counts() {
    const open = D.orders.filter(o => o.stage < 8);
    return {
      orders: open.length,
      graphics: D.orders.filter(o => o.stage === 4 || o.stage === 5).length,
      production: D.orders.filter(o => o.stage === 6).length,
      installs: D.orders.filter(o => o.stage === 7 && o.install && !o.install.date).length,
      accounting: D.orders.filter(o => o.stage === 8 && !o.docs.signed).length
    };
  }
  function shell() {
    const groups = [];
    NAV.forEach(n => { let g = groups.find(x => x.name === n.group); if (!g) { g = { name: n.group, items: [] }; groups.push(g); } g.items.push(n); });
    $('#app').innerHTML = `<div class="app">
      <aside class="side" aria-label="ניווט ראשי">
        <a class="side-logo" href="#/" aria-label="איקס מדיה, לעמוד הבית"><img src="assets/logo-light.png" alt="איקס מדיה פרסומים" width="560" height="152"></a>
        ${groups.map(g => `<div class="side-label">${g.name}</div><nav>${g.items.map(n => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span><span class="count hide" data-count="${n.id}"></span></a>`).join('')}</nav>`).join('')}
        <div class="side-office"><img src="assets/icon.png" alt="" width="34" height="34"><div><b>איקס מדיה שלטים</b><small>נתיבות · מאז 2002</small></div></div>
      </aside>
      <div class="main">
        <header class="top">
          <a class="top-logo" href="#/" aria-label="איקס מדיה, לעמוד הבית"><img src="assets/logo.png" alt="איקס מדיה פרסומים" width="300" height="76"></a>
          <div class="top-title" id="topTitle"></div>
          <span class="demo-pill">${icon('info')}הדגמה, נתוני דמה</span>
          <span class="top-date">${fday(D.today)}</span>
          <div class="top-actions">
            <button class="icon-btn" type="button" id="btnSearch" aria-label="חיפוש">${icon('search')}</button>
            <button class="avatar-btn" type="button" id="btnMe" aria-label="סמדר, תפריט אישי"><span class="avatar">ס</span></button>
          </div>
        </header>
        <main class="content" id="view" tabindex="-1"></main>
        <footer class="foot">
          <div>הדגמה עם נתוני דמה, שנבנתה בשביל איקס מדיה שלטים לקראת האיפיון. המבנה והזרימה מבוססים על איך שאתם עובדים היום.</div>
          <div class="row-wrap"><button type="button" data-act="tour">סיור מודרך</button><button type="button" data-act="reset">איפוס ההדגמה</button><a href="#/about" class="btn btn-ghost">על ההדגמה</a></div>
        </footer>
      </div>
      <nav class="tabbar" aria-label="ניווט">
        ${TABS.map(id => { const n = NAV.find(x => x.id === id); return `<a href="${n.href}" data-nav="${id}">${icon(n.icon)}<span>${n.label}</span><span class="tab-badge hide" data-tcount="${id}"></span></a>`; }).join('')}
        <button type="button" id="btnMore" data-nav="more">${icon('grid')}<span>עוד</span></button>
      </nav>
    </div>`;
    $('#btnMore').addEventListener('click', moreSheet);
    $('#btnSearch').addEventListener('click', searchSheet);
    $('#btnMe').addEventListener('click', meSheet);
    $$('.foot [data-act]').forEach(b => b.addEventListener('click', () => b.dataset.act === 'reset' ? resetAll() : startTour(true)));
  }
  function refreshBadges() {
    const c = counts();
    [['orders', c.orders, false], ['graphics', c.graphics, false], ['production', c.production, false], ['installs', c.installs, true], ['accounting', c.accounting, false]].forEach(([id, n, hot]) => {
      const el = $(`[data-count="${id}"]`); if (el) { el.textContent = n; el.classList.toggle('hide', !n); el.classList.toggle('hot', hot && n > 0); }
    });
    const tb = $('[data-tcount="installs"]'); if (tb) { tb.textContent = c.installs; tb.classList.toggle('hide', !c.installs); }
  }
  function moreSheet() {
    const rest = NAV.filter(n => TABS.indexOf(n.id) < 0);
    sheet({ title: 'כל המסכים', body: `<div class="list card">${rest.map(n => `<a class="list-item" href="${n.href}"><span class="li-icon">${icon(n.icon)}</span><span class="li-main"><span class="li-title">${n.label}</span></span>${icon('chev', 'chev')}</a>`).join('')}</div>
      <div class="row-wrap" style="margin-block-start:1rem"><button class="btn btn-outline" type="button" data-act="tour">${icon('play')}סיור מודרך</button><button class="btn btn-ghost" type="button" data-act="reset">${icon('refresh')}איפוס ההדגמה</button></div>`,
      onOpen: el => { $$('a', el).forEach(a => a.addEventListener('click', closeSheet)); $$('[data-act]', el).forEach(b => b.addEventListener('click', () => { closeSheet(); b.dataset.act === 'reset' ? resetAll() : startTour(true); })); } });
  }
  function meSheet() {
    sheet({ title: 'סמדר · מנהלת המשרד', body: `<div class="row" style="margin-block-end:1rem"><span class="avatar" style="inline-size:52px;block-size:52px;font-size:1.3rem">ס</span><div><b>סמדר</b><div class="muted small">מחוברת כמנהלת המשרד ומתאמת ההזמנות. כל אחד בצוות רואה את המסך שלו: אינה את הגרפיקה, המתקינים את הסידור.</div></div></div>
      <div class="list card">${D.staff.map(s => `<div class="list-item"><span class="avatar">${s.initial}</span><span class="li-main"><span class="li-title">${s.name}</span><span class="li-sub">${s.role}</span></span></div>`).join('')}</div>`,
      foot: `<button class="btn btn-outline" type="button" data-act="tour">${icon('play')}סיור מודרך</button><button class="btn btn-ghost" type="button" data-act="reset">${icon('refresh')}איפוס ההדגמה</button>`,
      onOpen: el => $$('[data-act]', el).forEach(b => b.addEventListener('click', () => { closeSheet(); b.dataset.act === 'reset' ? resetAll() : startTour(true); })) });
  }
  function searchSheet() {
    sheet({ title: 'חיפוש', body: `<div class="search-box">${icon('search')}<input class="input" id="qInput" type="search" placeholder="מספר הזמנה, לקוח, עיר או עבודה" aria-label="חיפוש"></div><div id="qRes" style="margin-block-start:.75rem"></div>`,
      onOpen: el => {
        const inp = $('#qInput', el), res = $('#qRes', el);
        const run = () => {
          const q = inp.value.trim();
          if (!q) { res.innerHTML = `<p class="muted small">נסו: "דלק", "נשר", "018" או "אותיות"</p>`; return; }
          const os = D.orders.filter(o => [o.no, o.branch, o.title, o.city, cust(o.customer).name].join(' ').indexOf(q) >= 0).slice(0, 12);
          res.innerHTML = os.length ? `<div class="list card">${os.map(o => `<a class="list-item" href="#/orders/${o.no}"><span class="li-main"><span class="li-title">${esc(o.branch)}</span><span class="li-sub">${mono(o.no)} · ${esc(shortTitle(o.title, 40))}</span></span><span class="li-end">${stageTag(o)}</span></a>`).join('')}</div>` : `<div class="empty">${icon('search')}לא נמצאו הזמנות</div>`;
          $$('a', res).forEach(a => a.addEventListener('click', closeSheet));
        };
        inp.addEventListener('input', run); run();
      } });
  }

  /* ---------- נתב ---------- */
  let cleanups = [];
  const onLeave = fn => cleanups.push(fn);
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = (path || '').split('/').filter(Boolean);
    return { parts, q: new URLSearchParams(qs || ''), path: path || '' };
  }
  function screenFor(r) {
    const p0 = r.parts[0] || 'home';
    if (p0 === 'orders' && r.parts[1]) return 'order';
    if (p0 === 'installs' && r.parts[1] === 'route') return 'route';
    return SCREENS[p0] ? p0 : 'notfound';
  }
  let readyResolve; const readyP = new Promise(r => { readyResolve = r; });
  let firstRender = true;
  function render() {
    cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = [];
    sheetClose = null; closeSheet();
    const r = parse(); const id = screenFor(r); const sc = SCREENS[id];
    const view = $('#view');
    const title = typeof sc.title === 'function' ? sc.title(r) : sc.title;
    view.innerHTML = sc.render(r);
    $('#topTitle').textContent = title;
    document.title = `${title} · איקס מדיה`;
    const nav = sc.nav || id;
    $$('[data-nav]').forEach(a => { const on = a.dataset.nav === nav || (a.dataset.nav === 'more' && TABS.indexOf(nav) < 0 && nav !== 'notfound'); a.classList.toggle('active', on); if (a.tagName === 'A') { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
    if (sc.mount) sc.mount(view, r);
    $$('.stepper .step.cur, .seg [aria-selected="true"], .chips [aria-pressed="true"]', view).forEach(el => { const p = el.parentElement; if (p && p.scrollWidth > p.clientWidth + 2) { const pr = p.getBoundingClientRect(), er = el.getBoundingClientRect(); p.scrollLeft += (er.left + er.width / 2) - (pr.left + pr.width / 2); } });
    const side = $('.side'), act = $('.side nav a.active');
    if (side && act) { const top = act.offsetTop, h = act.offsetHeight; if (top < side.scrollTop + 60 || top + h > side.scrollTop + side.clientHeight - 80) side.scrollTop = Math.max(0, top - side.clientHeight / 2); }
    refreshBadges();
    if (!firstRender && !r.q.has('keep')) window.scrollTo(0, 0);
    firstRender = false;
    tourAfterRender();
    readyResolve();
  }
  window.addEventListener('hashchange', render);
  const go = h => { if (location.hash === h) render(); else location.hash = h; };
  function setQuery(r, k, v) { const q = new URLSearchParams(r.q); if (v == null || v === '') q.delete(k); else q.set(k, v); q.set('keep', '1'); const s = q.toString(); const nh = '#/' + r.path + (s ? '?' + s : ''); if (location.hash !== nh) history.replaceState(null, '', nh); render(); }

  /* ---------- סיור מודרך ---------- */
  const TOUR = [
    { hash: '#/', sel: '.kpis', title: 'הלוח של סמדר', text: 'מה שסמדר פותחת ב-8:00 בבוקר. במקום ארבע קבוצות ווטסאפ וגיליון אחד ענק: מה פתוח, מה ממתין ללקוח, מה בייצור ומי בשטח.' },
    { hash: '#/orders', sel: '.view-orders', title: 'כל ההזמנות במקום אחד', text: 'אותם צבעים שאתם מכירים מהגיליון, רק שהם מתעדכנים לבד. גוררים כרטיס לשלב הבא, וכל הצוות רואה.' },
    { hash: '#/installs/route?team=noam&day=1', sel: '.missed', title: 'הסידור של מחר, בלי תחנה שנשכחה', text: 'המערכת מסדרת את התחנות לפי הדרך, ובודקת אם יש עבודה מוכנה באזור שלא נכנסה לסידור. "התחנה ביוקנעם שלא ראיתי" קופצת לבד.' },
    { hash: '#/field?team=noam', sel: '.phone', title: 'הטלפון של המתקין', text: 'נועם רואה את הסידור שלו, מצלם, מחתים את הלקוח על המסך ושולח. התעודה החתומה מגיעה למשרד ולרווחית בלי ווטסאפ.' },
    { hash: '#/accounting', sel: '.month-strip', title: 'סוף החודש, בלי ערימה', text: 'כל תעודת משלוח עם הסימון שלה: חתומה, יש הזמנת רכש, יש חשבונית. מה שחסר, כתוב בשפה של בני אדם.' }
  ];
  let tourStep = -1;
  function startTour(force) { tourStep = 0; S.tourDone = false; save(); const h = TOUR[0].hash; if (location.hash === h || (h === '#/' && (location.hash === '' || location.hash === '#/'))) render(); else location.hash = h; if (force) { } }
  function endTour() { tourStep = -1; S.tourDone = true; save(); $('#tour').classList.remove('open'); $('#tour').innerHTML = ''; $$('.tour-hl').forEach(e => e.classList.remove('tour-hl')); }
  function tourAfterRender() {
    const el = $('#tour'); $$('.tour-hl').forEach(e => e.classList.remove('tour-hl'));
    if (tourStep < 0) { el.classList.remove('open'); el.innerHTML = ''; return; }
    const st = TOUR[tourStep];
    const cur = location.hash || '#/';
    if (cur.split('?')[0] !== st.hash.split('?')[0] && !(st.hash === '#/' && cur === '#/')) { endTour(); return; }
    const target = $(st.sel); if (target) { target.classList.add('tour-hl'); if (!SHOT) { const tall = target.getBoundingClientRect().height > window.innerHeight * 0.55; target.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' }); } }
    el.innerHTML = `<div class="tour-card" role="dialog" aria-label="סיור מודרך"><div class="t-step">שלב ${tourStep + 1} מתוך ${TOUR.length}</div><h2>${st.title}</h2><p>${st.text}</p><div class="t-actions"><button class="btn btn-primary" type="button" id="tourNext">${tourStep === TOUR.length - 1 ? 'סיימנו' : 'הבא'}</button><button class="btn btn-ghost" type="button" id="tourSkip">דלג</button><span class="tour-dots">${TOUR.map((x, i) => `<i class="${i === tourStep ? 'on' : ''}"></i>`).join('')}</span></div></div>`;
    el.classList.add('open');
    $('#tourSkip').addEventListener('click', endTour);
    $('#tourNext').addEventListener('click', () => { if (tourStep >= TOUR.length - 1) { endTour(); go('#/'); return; } tourStep++; location.hash = TOUR[tourStep].hash; });
  }

  /* ---------- מונה עולה ---------- */
  function countUp(root) {
    $$('[data-count-to]', root).forEach(el => {
      const to = Number(el.dataset.countTo); if (SHOT || !to) { el.textContent = fmt(to); return; }
      const t1 = performance.now(); const dur = 900;
      const step = t => { const p = Math.min(1, (t - t1) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ---------- API לבדיקות ---------- */
  window.__demo = { ready: () => readyP.then(() => document.fonts ? document.fonts.ready : null), go, reset: resetAll, state: () => S, now, actions, version: '1.0', scenarioDone: false, data: D };

  window.X = { D, S: () => S, Q, SHOT, TEST, $, $$, esc, fmt, num, money, mono, nums, icon, fdate, ftime, fday, fmonth, relDay, ago, hoursSince, now, isoDay, toDate, sleep, order, cust, team, machine, stage, statusOf, statusName, shortTitle, teamTag, machineTag, stTag, stageTag, nextNo, log, feedPush, setStage, save, toast, sheet, closeSheet, go, setQuery, onLeave, render, refreshBadges, routeOf, orderRoute, missedFor, km, sketch, orderSketch, photo, download, openExternal, printHtml, countUp, MONTHS, DAYS };

  /* ---------- דף לא נמצא ---------- */
  SCREENS.notfound = { title: 'הדף לא נמצא', render: () => `<div class="card card-pad" style="max-inline-size:34rem;margin:3rem auto;text-align:center"><div class="eyebrow">שגיאה 404</div><h1>הדף הזה לא קיים בהדגמה</h1><p class="muted" style="margin-block:.5rem 1.2rem">אולי הקישור השתנה. אפשר לחזור ללוח של היום ולהמשיך משם.</p><a class="btn btn-primary" href="#/">${icon('home')}חזרה ללוח של היום</a></div>` };

  /* ---------- אתחול ---------- */
  function boot() {
    shell();
    if (Q.has('tour') || (!S.tourDone && !SHOT && !TEST)) { tourStep = 0; if (location.hash && location.hash !== '#/' && location.hash !== '#') { tourStep = Q.has('tour') ? 0 : -1; } }
    if (Q.has('tour') && (location.hash === '' || location.hash === '#/' || location.hash === '#')) tourStep = 0;
    if (!location.hash) history.replaceState(null, '', '#/');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
