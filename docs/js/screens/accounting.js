/* מסך "הנהלת חשבונות": סוף חודש בלי ערימה + קליטת חשבונית ספק בצילום */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, $, $$ } = X;
  const poOk = o => !X.cust(o.customer).po || !!o.docs.po;
  const ready = o => o.docs.signed && poOk(o) && !o.docs.invoiceNo;
  const FILTERS = [['all', 'הכל'], ['sign', 'חסרה חתימה'], ['po', 'חסרה הזמנת רכש'], ['ready', 'מוכן לחשבונית'], ['inv', 'חשבונית הופקה']];
  const match = (o, f) => f === 'sign' ? !o.docs.signed : f === 'po' ? !poOk(o) : f === 'ready' ? ready(o) : f === 'inv' ? !!o.docs.invoiceNo : true;
  function missing(o) {
    if (o.docs.invoiceNo) return `<span class="yn y">${icon('check')}הושלם</span>`;
    const m = [];
    if (!o.docs.signed) { const t = X.team(o.install && o.install.team); m.push(`חסרה חתימה${t ? `, ${esc(t.name)} היה שם ${X.relDay(o.install.date)}` : ''}`); }
    if (!poOk(o)) m.push('חסרה הזמנת רכש מהלקוח');
    return m.length ? `<span class="small" style="color:var(--st-urgent);font-weight:700">${m.join(' · ')}</span>` : `<span class="yn y">${icon('check')}מוכן לחשבונית</span>`;
  }
  const yn = (v, na) => na ? `<span class="yn p">לא נדרש</span>` : `<span class="yn ${v ? 'y' : 'n'}">${icon(v ? 'check' : 'x')}${v ? 'יש' : 'אין'}</span>`;

  function invoiceSvg() {
    const s = D.supplierInvoice;
    return `<svg viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg" style="direction:ltr" role="img" aria-label="צילום של חשבונית ספק"><rect width="300" height="380" fill="#DADAD6"/><g transform="rotate(-2.2 150 190)"><rect x="22" y="16" width="256" height="350" fill="#FFFFFE" stroke="#C9C9C4"/>
      <rect x="22" y="16" width="256" height="40" fill="#2F4858"/><text x="262" y="42" text-anchor="end" font-family="Heebo,Arial" font-weight="800" font-size="15" fill="#fff">${esc(s.supplier)}</text>
      <text x="262" y="76" text-anchor="end" font-family="Heebo,Arial" font-weight="800" font-size="13" fill="#222">חשבונית מס ${esc(s.no)}</text><text x="40" y="76" font-family="Arial" font-size="11" fill="#444">${esc(X.fdate(s.date))}</text>
      <text x="262" y="96" text-anchor="end" font-family="Assistant,Arial" font-size="10" fill="#555">לכבוד: איקס מדיה פרסומים בע"מ</text>
      <line x1="36" y1="108" x2="264" y2="108" stroke="#999"/>
      ${s.lines.map((l, i) => `<text x="262" y="${130 + i * 24}" text-anchor="end" font-family="Assistant,Arial" font-size="10.5" fill="#222">${esc(l.d)}</text><text x="40" y="${130 + i * 24}" font-family="Arial" font-size="10.5" fill="#222">${X.fmt(l.q * l.p)}</text><text x="${92}" y="${130 + i * 24}" font-family="Arial" font-size="10" fill="#666">${l.q} x ${l.p}</text>`).join('')}
      <line x1="36" y1="210" x2="264" y2="210" stroke="#999"/>
      <text x="262" y="232" text-anchor="end" font-family="Assistant,Arial" font-size="11" fill="#333">סה"כ לפני מע"מ</text><text x="40" y="232" font-family="Arial" font-size="11" fill="#333">${X.fmt(s.net)}</text>
      <text x="262" y="252" text-anchor="end" font-family="Assistant,Arial" font-size="11" fill="#333">מע"מ 18%</text><text x="40" y="252" font-family="Arial" font-size="11" fill="#333">${X.fmt(s.vat)}</text>
      <rect x="36" y="262" width="228" height="26" fill="#F1F1EC"/><text x="262" y="280" text-anchor="end" font-family="Heebo,Arial" font-weight="800" font-size="12.5" fill="#111">סה"כ לתשלום</text><text x="40" y="280" font-family="Arial" font-weight="700" font-size="12.5" fill="#111">${X.fmt(s.total)}</text>
      <text x="150" y="340" text-anchor="middle" font-family="Assistant,Arial" font-size="9" fill="#999">מסמך לדוגמה בלבד</text></g></svg>`;
  }
  const OCR_FIELDS = () => { const s = D.supplierInvoice; return [['ספק', s.supplier, 99], ['מספר חשבונית', s.no, 99], ['תאריך', X.fdate(s.date), 97], ['לפני מע"מ', '₪' + X.fmt(s.net), 98], ['מע"מ', '₪' + X.fmt(s.vat), 98], ['סה"כ', '₪' + X.fmt(s.total), 99], ['שורות', `${s.lines.length} פריטים זוהו`, 94], ['סיווג', 'חומרי גלם · ייצור', 91]]; };

  window.SCREENS.accounting = {
    title: 'הנהלת חשבונות',
    render(r) {
      const f = r.q.get('f') || 'all';
      const all = D.orders.filter(o => o.stage === 8).sort((a, b) => (b.install && b.install.date || '').localeCompare(a.install && a.install.date || ''));
      const list = all.filter(o => match(o, f));
      const signed = all.filter(o => o.docs.signed).length, po = all.filter(poOk).length, rd = all.filter(ready).length, inv = all.filter(o => o.docs.invoiceNo).length;
      const ocrRun = r.q.get('ocr') === 'run';
      const byC = {}; all.filter(o => o.docs.invoiceNo).forEach(o => { byC[o.customer] = (byC[o.customer] || 0) + o.total * 1.18; });
      const due = Object.keys(byC).map(id => ({ c: X.cust(id), sum: byC[id] })).sort((a, b) => b.sum - a.sum).slice(0, 5);
      return `<div class="page-head"><div><div class="eyebrow">המודול השלישי: הנהלת חשבונות</div><h1>סוף החודש · ${esc(X.fmonth(D.today))}</h1><p class="sub">לכל תעודת משלוח צריך הזמנת רכש ותעודה חתומה, ורק אז חשבונית. כאן רואים בשנייה מה מוכן ומה חסר, בלי לחפש בווטסאפ.</p></div>
        <div class="actions">${rd ? `<button class="btn btn-primary" type="button" id="bulkInv">${icon('receipt')}הפקת ${num(rd)} חשבוניות</button>` : ''}</div></div>
        <div class="month-strip">
          <div class="ms"><div class="ms-v">${num(all.length)}</div><div class="ms-l">תעודות משלוח החודש</div></div>
          <div class="ms"><div class="ms-v">${num(signed)}</div><div class="ms-l">חתומות</div></div>
          <div class="ms"><div class="ms-v">${num(po)}</div><div class="ms-l">עם הזמנת רכש תקינה</div></div>
          <div class="ms hi"><div class="ms-v">${num(rd)}</div><div class="ms-l">מוכנות לחשבונית</div></div>
          <div class="ms"><div class="ms-v">${num(inv)}</div><div class="ms-l">חשבוניות שהופקו</div></div>
        </div>
        <div class="chips section" role="group" aria-label="סינון">${FILTERS.map(([k, l]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${f === k}">${l} <bdi class="num">${all.filter(o => match(o, k)).length}</bdi></button>`).join('')}</div>
        <div class="card tbl-wrap" style="margin-block-start:.75rem"><table class="tbl" aria-label="תעודות משלוח החודש">
          <thead><tr><th>תעודה</th><th>לקוח ואתר</th><th>הותקן</th><th>סכום</th><th>חתומה</th><th>הזמנת רכש</th><th>חשבונית</th><th>מה חסר</th><th><span class="sr">פעולה</span></th></tr></thead>
          <tbody>${list.slice(0, 60).map(o => `<tr>
            <td class="td-hide-m" data-label="תעודה"><a href="#/orders/${o.no}?tab=money">${X.mono(o.docs.deliveryNo)}</a></td>
            <td class="td-main" data-label="לקוח"><a class="tap" href="#/orders/${o.no}?tab=money" style="color:inherit">${esc(o.branch)}</a><div class="tiny muted m-only">תעודה ${X.mono(o.docs.deliveryNo)} · ${X.relDay(o.install && o.install.date || o.due)}</div></td>
            <td class="td-hide-m" data-label="הותקן">${X.relDay(o.install && o.install.date || o.due)}</td>
            <td class="td-end" data-label="סכום">${money(o.total * 1.18)}</td>
            <td data-label="חתומה">${yn(o.docs.signed)}</td><td data-label="הזמנת רכש">${yn(!!o.docs.po, !X.cust(o.customer).po)}</td><td data-label="חשבונית">${o.docs.invoiceNo ? X.mono(o.docs.invoiceNo) : yn(false)}</td>
            <td class="td-full" data-label="מה חסר">${missing(o)}</td>
            <td class="td-full" data-label="פעולה">${o.docs.invoiceNo ? '' : ready(o) ? `<button class="btn btn-primary btn-sm" type="button" data-inv="${o.no}">${icon('receipt')}הפקת חשבונית</button>` : `<button class="btn btn-outline btn-sm" type="button" data-rem="${o.no}">${icon('wa')}${!o.docs.signed ? 'קישור לחתימה' : 'בקשת הזמנת רכש'}</button>`}</td></tr>`).join('') || `<tr><td class="td-full"><div class="empty">${icon('check')}אין תעודות בסינון הזה</div></td></tr>`}</tbody></table></div>
        ${list.length > 60 ? `<p class="small muted" style="margin-block-start:.5rem">מוצגות 60 מתוך ${num(list.length)}.</p>` : ''}
        <div class="grid grid-main section">
          <section class="card" aria-labelledby="ocrH"><div class="card-head"><h2 id="ocrH">${icon('scan')}קליטת חשבונית ספק בצילום</h2><span class="tag info">פיצ'ר אחד מתוך המערכת</span></div>
            <div class="card-body"><div class="ocr" id="ocr">${ocrRun ? '' : `<button class="drop-zone" type="button" id="ocrGo">${icon('camera')}<b>מצלמים חשבונית ספק</b><span class="small">או גוררים קובץ לכאן. בהדגמה נטענת חשבונית לדוגמה.</span></button><div class="stack"><p class="small muted">במקום להקליד כל חשבונית לרווחית: מצלמים, המערכת קוראת את השדות, ומה שבטוח נקלט לבד. מה שלא בטוח, מסומן לבדיקה.</p></div>`}</div></div></section>
          <section class="card" aria-labelledby="payH"><div class="card-head"><h2 id="payH">${icon('clock')}צפי תשלומים מחשבוניות החודש</h2></div>
            <div class="list">${due.map(x => { const d = Number((x.c.terms.match(/\d+/) || [30])[0]); return `<div class="list-item"><span class="li-main"><span class="li-title">${esc(x.c.name)}</span><span class="li-sub">${esc(x.c.terms)} · צפוי סביב ${X.fdate(new Date(X.toDate(D.today).getTime() + (d + 30) * 864e5))}</span></span><span class="strong">${money(x.sum)}</span></div>`; }).join('')}</div>
            <p class="tiny muted card-body" style="padding-block-start:.5rem">חשבונית מס בלי קבלה, הקבלה יוצאת רק אחרי התשלום בפועל. הסכומים לדוגמה.</p></section>
        </div>`;
    },
    mount(root, r) {
      const re = () => X.render();
      $$('[data-f]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'f', b.dataset.f === 'all' ? '' : b.dataset.f)));
      $$('[data-inv]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.inv); o.docs.invoiceNo = X.nextNo('invoice'); X.log(o, 'ורד', `חשבונית ${o.docs.invoiceNo} הופקה ברווחית`); X.save(); X.toast(`חשבונית ${o.docs.invoiceNo} הופקה ברווחית`); re(); }));
      $$('[data-rem]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.rem); const what = !o.docs.signed ? 'קישור לחתימה על התעודה' : 'בקשה להזמנת רכש'; X.log(o, 'המערכת', `נשלח ללקוח: ${what}`); X.save(); X.toast(`נשלח ל${esc(X.cust(o.customer).contact.name)}: ${what}`, 'wa'); }));
      const bulk = $('#bulkInv', root);
      if (bulk) bulk.addEventListener('click', async () => {
        const list = D.orders.filter(o => o.stage === 8 && ready(o));
        const el = X.sheet({ title: `הפקת ${list.length} חשבוניות ברווחית`, body: `<div class="stack"><div class="bar ok"><i id="bulkBar" style="inline-size:0%"></i></div><div id="bulkLog" class="small muted">מתחיל...</div></div>` });
        for (let i = 0; i < list.length; i++) {
          const o = list[i]; o.docs.invoiceNo = X.nextNo('invoice'); X.log(o, 'ורד', `חשבונית ${o.docs.invoiceNo} הופקה ברווחית`);
          const bar = $('#bulkBar', el), lg = $('#bulkLog', el); if (!bar) break;
          bar.style.inlineSize = Math.round((i + 1) / list.length * 100) + '%'; lg.innerHTML = `חשבונית ${X.mono(o.docs.invoiceNo)} · ${esc(o.branch)}`;
          await X.sleep(110);
        }
        X.save(); X.closeSheet(); X.toast(`${list.length} חשבוניות הופקו ברווחית ונשלחו ללקוחות`); re();
      });
      const box = $('#ocr', root);
      async function run() {
        box.innerHTML = `<div class="ocr-img">${invoiceSvg()}<span class="scanline" id="scanline"></span></div><div class="stack" id="ocrF">${OCR_FIELDS().map(([l]) => `<div class="ocr-field pending"><span class="of-l">${l}</span><span class="of-v">...</span><span class="of-c"></span></div>`).join('')}</div>`;
        const els = $$('.ocr-field', box);
        for (let i = 0; i < els.length; i++) { await X.sleep(260); const [l, v, c] = OCR_FIELDS()[i]; const e = els[i]; if (!e.isConnected) return; e.classList.remove('pending'); e.classList.add('filled'); $('.of-v', e).textContent = v; const cc = $('.of-c', e); cc.textContent = `${c}%`; if (c < 95) cc.style.color = 'var(--warn)'; }
        const sl = $('#scanline', box); if (sl) sl.remove();
        $('#ocrF', box).insertAdjacentHTML('beforeend', `<div class="note ok">${icon('check')}<span>6 שדות נקלטו בביטחון גבוה. 2 מסומנים לבדיקה מהירה.</span></div><button class="btn btn-primary" type="button" id="ocrOk">${icon('plug')}אישור וקליטה לרווחית</button>`);
        $('#ocrOk', box).addEventListener('click', () => { X.toast(`חשבונית ${D.supplierInvoice.no} של ${D.supplierInvoice.supplier} נקלטה לרווחית`); X.feedPush({ type: 'mail', text: `חשבונית ספק ${D.supplierInvoice.no} נקלטה מצילום`, link: '#/accounting' }); const b = $('#ocrOk', box); b.disabled = true; b.innerHTML = icon('check') + 'נקלטה'; });
      }
      const go = $('#ocrGo', root);
      if (go) { go.addEventListener('click', run); go.addEventListener('dragover', e => { e.preventDefault(); go.classList.add('over'); }); go.addEventListener('dragleave', () => go.classList.remove('over')); go.addEventListener('drop', e => { e.preventDefault(); run(); }); }
      if (r.q.get('ocr') === 'run') run();
    }
  };
})();
