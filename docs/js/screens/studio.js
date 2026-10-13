/* מסך "סטודיו": שלט סטנדרטי מוכן למכונה, בלי לעבור דרך הגרפיקה */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;
  const ICONS = {
    helmet: { name: 'קסדה', svg: c => `<path d="M18 64 C18 38 32 24 50 24 C68 24 82 38 82 64 Z" fill="${c}"/><path d="M6 64 H94 C94 70 90 74 84 74 H12 C8 74 6 70 6 64 Z" fill="${c}"/><path d="M44 24 V50 M56 24 V50" stroke="${c === '#111111' || c === '#1E1E1E' ? '#FFD200' : '#ffffff'}" stroke-width="5" opacity=".55"/><path d="M50 18 V26" stroke="${c}" stroke-width="10" stroke-linecap="round"/>` },
    danger: { name: 'סכנה', svg: c => `<path d="M50 10 L92 86 H8 Z" fill="none" stroke="${c}" stroke-width="8" stroke-linejoin="round"/><rect x="45" y="36" width="10" height="28" rx="4" fill="${c}"/><circle cx="50" cy="74" r="6" fill="${c}"/>` },
    noentry: { name: 'אין כניסה', svg: () => `<circle cx="50" cy="50" r="40" fill="#D21F26"/><rect x="22" y="43" width="56" height="14" rx="3" fill="#fff"/>` },
    electric: { name: 'חשמל', svg: c => `<path d="M50 10 L92 86 H8 Z" fill="none" stroke="${c}" stroke-width="8" stroke-linejoin="round"/><path d="M54 32 L40 58 H52 L46 76 L62 48 H50 Z" fill="${c}"/>` },
    fire: { name: 'מטף', svg: () => `<rect x="34" y="30" width="32" height="58" rx="10" fill="#D21F26"/><rect x="42" y="18" width="16" height="14" fill="#333"/><path d="M58 22 H76 V30" stroke="#333" stroke-width="5" fill="none"/>` },
    wc: { name: 'שירותים', svg: c => `<circle cx="32" cy="22" r="8" fill="${c}"/><rect x="24" y="34" width="16" height="30" rx="4" fill="${c}"/><rect x="25" y="62" width="6" height="26" fill="${c}"/><rect x="33" y="62" width="6" height="26" fill="${c}"/><circle cx="68" cy="22" r="8" fill="${c}"/><path d="M58 34 H78 L84 66 H52 Z" fill="${c}"/><rect x="61" y="64" width="6" height="24" fill="${c}"/><rect x="69" y="64" width="6" height="24" fill="${c}"/><rect x="48" y="10" width="4" height="80" fill="${c}"/>` }
  };
  const BG = { yellow: ['#FFD200', '#111111', 'צהוב'], red: ['#C8102E', '#FFFFFF', 'אדום'], blue: ['#0B4EA2', '#FFFFFF', 'כחול'], white: ['#FFFFFF', '#111111', 'לבן'], green: ['#00843D', '#FFFFFF', 'ירוק'] };
  const PRESETS = {
    safety: { label: 'בטיחות', main: 'סכנה', sub: 'כאן בונים', icon: 'helmet', bg: 'yellow', size: '50/70' },
    entry: { label: 'אין כניסה', main: 'הכניסה', sub: 'לבעלי תפקיד בלבד', icon: 'noentry', bg: 'white', size: '40/30' },
    electric: { label: 'חשמל', main: 'זהירות', sub: 'חשמל, סכנת חיים', icon: 'electric', bg: 'yellow', size: '40/30' },
    fire: { label: 'מטף', main: 'מטף כיבוי', sub: 'אין לחסום את הגישה', icon: 'fire', bg: 'white', size: '30/40' },
    wc: { label: 'שירותים', main: 'שירותים', sub: 'לעובדי האתר', icon: 'wc', bg: 'blue', size: '40/30' }
  };
  const SIZES = ['50/70', '40/30', '30/40', '60/40', '100/70', '70/50'];
  const MATS = { pach: ['פח 0.8 מ"מ', 'efi'], pvc: ['PVC 5 מ"מ', 'efi'], sticker: ['מדבקה', 'mimaki'], kapa: ['קאפה 5 מ"מ', 'efi'] };
  const st = { type: 'safety', main: 'סכנה', sub: 'כאן בונים', icon: 'helmet', bg: 'yellow', size: '50/70', w: 50, h: 70, mat: 'pach', qty: 6, customer: 'dimri' };

  function wrap(t, max) { const w = String(t).split(/\s+/).filter(Boolean); const L = []; let cur = ''; w.forEach(x => { if ((cur + ' ' + x).trim().length > max && cur) { L.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) L.push(cur); return L.slice(0, 3); }
  function signSvg(forPrint) {
    const W = st.w * 10, H = st.h * 10; const pad = forPrint ? 0 : 60; const [bg, fg] = BG[st.bg]; const ic = ICONS[st.icon];
    const portrait = H > W * 1.05;
    const frame = Math.min(W, H) * 0.035;
    const icS = portrait ? W * 0.62 : Math.min(H * 0.62, W * 0.34);
    const icX = portrait ? (W - icS) / 2 : W - icS - W * 0.06; const icY = portrait ? H * 0.1 : (H - icS) / 2;
    const textW = portrait ? W * 0.84 : W - icS - W * 0.16; const textX = portrait ? W / 2 : (W - icS - W * 0.1) / 2 + W * 0.02;
    const mainL = wrap(st.main, portrait ? 9 : Math.max(6, Math.round(textW / (H * 0.12)))); const subL = wrap(st.sub, portrait ? 16 : 18);
    const mfs = Math.min(textW / Math.max(3, Math.max.apply(null, mainL.map(l => l.length))) * 1.55, (portrait ? H * 0.14 : H * 0.24));
    const sfs = Math.min(textW / Math.max(6, Math.max.apply(null, subL.map(l => l.length))) * 1.6, mfs * 0.55);
    const blockH = mainL.length * mfs * 1.05 + subL.length * sfs * 1.2 + sfs * 0.4;
    let ty = portrait ? icY + icS + (H - icY - icS - blockH) / 2 + mfs * 0.85 : (H - blockH) / 2 + mfs * 0.85;
    const txt = mainL.map((l, i) => `<text x="${textX}" y="${ty + i * mfs * 1.05}" text-anchor="middle" font-family="Heebo,Arial" font-weight="800" font-size="${mfs}" fill="${fg}" direction="rtl">${esc(l)}</text>`).join('')
      + subL.map((l, i) => `<text x="${textX}" y="${ty + (mainL.length - 1) * mfs * 1.05 + sfs * 1.5 + i * sfs * 1.2}" text-anchor="middle" font-family="Heebo,Arial" font-weight="700" font-size="${sfs}" fill="${fg}" direction="rtl">${esc(l)}</text>`).join('');
    const crop = forPrint ? '' : [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => `<path d="M${x + pad} ${y + pad - (y ? -14 : 14)} v${y ? 30 : -30} M${x + pad - (x ? -14 : 14)} ${y + pad} h${x ? 30 : -30}" stroke="#555" stroke-width="2"/>`).join('');
    const dims = forPrint ? '' : `<text x="${pad + W / 2}" y="${pad - 24}" text-anchor="middle" font-family="Assistant,Arial" font-size="26" font-weight="700" fill="#555">${st.w} ס"מ</text><text x="${pad - 24}" y="${pad + H / 2}" text-anchor="middle" font-family="Assistant,Arial" font-size="26" font-weight="700" fill="#555" transform="rotate(-90 ${pad - 24} ${pad + H / 2})">${st.h} ס"מ</text>`;
    const body = `<g transform="translate(${pad} ${pad})"><rect width="${W}" height="${H}" fill="${bg}"/>${st.bg === 'yellow' ? `<rect x="${frame}" y="${frame}" width="${W - frame * 2}" height="${H - frame * 2}" fill="none" stroke="#111" stroke-width="${frame * 0.6}" rx="${frame}"/>` : st.bg === 'white' ? `<rect x="${frame * .5}" y="${frame * .5}" width="${W - frame}" height="${H - frame}" fill="none" stroke="#D0D0D0" stroke-width="3"/>` : ''}
      <g transform="translate(${icX} ${icY}) scale(${icS / 100})">${ic.svg(fg)}</g>${txt}</g>`;
    const VW = W + pad * 2, VH = H + pad * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" ${forPrint ? `width="${st.w}cm" height="${st.h}cm"` : ''} role="img" aria-label="תצוגה מקדימה: ${esc(st.main + ' ' + st.sub)}">${forPrint ? '' : `<rect x="${pad - 3}" y="${pad - 3}" width="${W + 6}" height="${H + 6}" fill="none" stroke="#E58A1F" stroke-width="2" stroke-dasharray="8 6"/>`}${body}${crop}${dims}</svg>`;
  }
  function specs() { return `<span>${icon('scan')}<bdi class="num">${st.w}x${st.h}</bdi> ס"מ</span><span>בליד 3 מ"מ</span><span>CMYK, 150 dpi</span><span>${esc(MATS[st.mat][0])}</span><span>${esc((X.machine(MATS[st.mat][1]) || {}).name || '')}</span><span>כמות <bdi class="num">${st.qty}</bdi></span>`; }

  window.SCREENS.studio = {
    title: 'סטודיו',
    render() {
      return `<div class="page-head"><div><div class="eyebrow">המודול שאורן ביקש בהמשך</div><h1>שלט מוכן, בלי לעבור דרך הגרפיקה</h1><p class="sub">"שלט 50 על 70, סכנה כאן בונים, עם אייקון מצד ימין, וקובץ PDF שמתאים כבר למכונה." ממלאים, רואים, שולחים לייצור.</p></div></div>
        <div class="studio">
          <section class="card card-pad stack studio-form" aria-label="פרטי השלט">
            <div class="field"><span class="lbl">סוג השלט</span><div class="chips" role="group" aria-label="סוג" style="flex-wrap:wrap">${Object.keys(PRESETS).map(k => `<button class="chip" type="button" data-pre="${k}" aria-pressed="${st.type === k}">${PRESETS[k].label}</button>`).join('')}</div></div>
            <div class="form-grid two"><div class="field"><label for="sMain">טקסט ראשי</label><input class="input" id="sMain" value="${esc(st.main)}" maxlength="24"></div><div class="field"><label for="sSub">טקסט משני</label><input class="input" id="sSub" value="${esc(st.sub)}" maxlength="40"></div></div>
            <div class="field"><span class="lbl">אייקון (מצד ימין)</span><div class="icon-pick">${Object.keys(ICONS).map(k => `<button type="button" data-ic="${k}" aria-pressed="${st.icon === k}" aria-label="${ICONS[k].name}"><svg viewBox="0 0 100 100" aria-hidden="true">${ICONS[k].svg('#1E1E1E')}</svg></button>`).join('')}</div></div>
            <div class="form-grid two"><div class="field"><label for="sSize">מידה (רוחב/גובה ס"מ)</label><select class="select" id="sSize">${SIZES.map(s => `<option ${s === st.size ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
              <div class="field"><label for="sMat">חומר</label><select class="select" id="sMat">${Object.keys(MATS).map(k => `<option value="${k}" ${k === st.mat ? 'selected' : ''}>${esc(MATS[k][0])}</option>`).join('')}</select></div></div>
            <div class="field"><span class="lbl">צבע רקע</span><div class="color-pick">${Object.keys(BG).map(k => `<button type="button" data-bg="${k}" aria-pressed="${st.bg === k}" aria-label="${BG[k][2]}" style="background:${BG[k][0]}"></button>`).join('')}</div></div>
            <div class="form-grid two"><div class="field"><label for="sQty">כמות</label><input class="input" type="number" min="1" id="sQty" value="${st.qty}" inputmode="numeric"></div>
              <div class="field"><label for="sCust">ללקוח</label><select class="select" id="sCust">${D.customers.map(c => `<option value="${c.id}" ${c.id === st.customer ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div></div>
          </section>
          <div class="card card-pad studio-prev-card"><div class="studio-preview" id="sPrev">${signSvg(false)}</div><div class="spec-row" id="sSpec">${specs()}</div></div>
          <div class="stack studio-actions">
            <div class="row-wrap"><button class="btn btn-dark grow" type="button" id="sPdf">${icon('download')}קובץ PDF מוכן למכונה</button><button class="btn btn-primary grow" type="button" id="sSend">${icon('factory')}ישר לייצור</button></div>
            <p class="tiny muted">הקו הכתום המקווקו הוא קו החיתוך. הקובץ יוצא בגודל אמיתי עם בליד. במערכת האמיתית: התבניות של איקס מדיה, הפונטים והלוגואים של הלקוחות.</p>
          </div>
        </div>`;
    },
    mount(root) {
      const upd = () => { $('#sPrev', root).innerHTML = signSvg(false); $('#sSpec', root).innerHTML = specs(); };
      $$('[data-pre]', root).forEach(b => b.addEventListener('click', () => { const p = PRESETS[b.dataset.pre]; Object.assign(st, { type: b.dataset.pre, main: p.main, sub: p.sub, icon: p.icon, bg: p.bg, size: p.size }); const [w, h] = p.size.split('/').map(Number); st.w = w; st.h = h; X.render(); }));
      $('#sMain', root).addEventListener('input', e => { st.main = e.target.value; upd(); });
      $('#sSub', root).addEventListener('input', e => { st.sub = e.target.value; upd(); });
      $$('[data-ic]', root).forEach(b => b.addEventListener('click', () => { st.icon = b.dataset.ic; $$('[data-ic]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); }));
      $$('[data-bg]', root).forEach(b => b.addEventListener('click', () => { st.bg = b.dataset.bg; $$('[data-bg]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); }));
      $('#sSize', root).addEventListener('change', e => { st.size = e.target.value; const [w, h] = st.size.split('/').map(Number); st.w = w; st.h = h; upd(); });
      $('#sMat', root).addEventListener('change', e => { st.mat = e.target.value; upd(); });
      $('#sQty', root).addEventListener('input', e => { st.qty = Math.max(1, Number(e.target.value) || 1); upd(); });
      $('#sCust', root).addEventListener('change', e => { st.customer = e.target.value; });
      $('#sPdf', root).addEventListener('click', () => {
        const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${esc(st.main)} ${st.w}x${st.h}</title><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@700;800&display=swap" rel="stylesheet"><style>@page{size:${st.w}cm ${st.h}cm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style></head><body>${signSvg(true)}</body></html>`;
        X.printHtml(html, 'שלט'); X.toast('חלון ההדפסה נפתח. בוחרים "שמירה כ-PDF" והקובץ בגודל אמיתי', 'download');
      });
      $('#sSend', root).addEventListener('click', () => {
        const c = X.cust(st.customer); const machineId = MATS[st.mat][1];
        const o = X.createOrder({ customer: c.id, lines: [{ item: 'safety', size: `${st.w}/${st.h}`, qty: st.qty, price: D.listPrice('safety', `${st.w}/${st.h}`, c.tier) }], stage: 6, needsGraphics: false, machine: machineId, title: `שלט "${st.main} ${st.sub}" ${st.w}/${st.h} מהסטודיו`, note: 'נוצר בסטודיו. הקובץ מוכן למכונה', channel: 'טלפון' });
        X.feedPush({ type: 'prod', text: `מהסטודיו: ${o.title} נכנס לתור של ${(X.machine(machineId) || {}).name}`, link: '#/orders/' + o.no });
        X.toast(`הזמנה ${o.no} נכנסה ישר לתור של ${(X.machine(machineId) || {}).name}, בלי גרפיקה`); X.go('#/orders/' + o.no + '?tab=production');
      });
    }
  };
})();
