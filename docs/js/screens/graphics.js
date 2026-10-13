/* מסך "גרפיקה": התור של אינה, באותם צבעים של הגיליון */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;
  const FILTERS = [['all', 'הכל'], ['wait', 'טרם הוכן'], ['sent', 'נשלח ללקוח לאישור'], ['urgent', 'דחוף'], ['done', 'אושר לאחרונה']];

  function rows(f) {
    let list = D.orders.filter(o => o.stage === 4 || o.stage === 5 || (o.stage >= 6 && o.stage <= 7 && o.graphics.approvedAt && X.hoursSince(o.graphics.approvedAt) < 72));
    if (f !== 'all') list = list.filter(o => X.statusOf(o) === f || (f === 'urgent' && o.urgent && o.stage < 7));
    const rank = o => (o.urgent && o.stage < 6 ? 0 : o.stage === 5 ? 1 : o.stage === 4 ? 2 : 3);
    return list.sort((a, b) => rank(a) - rank(b) || (b.graphics.sentAt || '').localeCompare(a.graphics.sentAt || '') || a.due.localeCompare(b.due));
  }
  window.SCREENS.graphics = {
    title: 'גרפיקה',
    render(r) {
      const f = r.q.get('f') || 'all'; const list = rows(f);
      const cnt = k => rows(k).length;
      return `<div class="page-head"><div><div class="eyebrow">הסטודיו של אינה</div><h1>גרפיקה ואישורי לקוח</h1><p class="sub">אותה טבלה שאינה מנהלת היום, רק שהצבע משתנה לבד: כשנשלח ללקוח, כשהלקוח אישר, וכשמשהו דחוף.</p></div></div>
        <div class="card card-pad" style="margin-block-end:1rem"><div class="between"><span class="small strong">אותו מקרא כמו בגיליון שלכם:</span><div class="legend">${D.legend.map(l => `<span><i class="swatch sw-${l.id}"></i>${l.name}</span>`).join('')}</div></div></div>
        <div class="chips" role="group" aria-label="סינון" style="margin-block-end:1rem">${FILTERS.map(([k, l]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${f === k}">${l} <bdi class="num">${cnt(k)}</bdi></button>`).join('')}</div>
        <div class="card">${list.length ? list.map(o => {
          const s = X.statusOf(o); const l = o.lines[0];
          return `<div class="g-row ${s}"><span class="g-stripe" aria-hidden="true"></span><div class="g-body">
            <a class="g-thumb" href="#/orders/${o.no}?tab=graphics" aria-label="הסקיצה של ${esc(o.branch)}">${X.orderSketch(o)}</a>
            <div style="min-inline-size:0"><div class="row-wrap"><a href="#/orders/${o.no}?tab=graphics" class="strong tap" style="color:var(--ink)">${esc(o.branch)}</a>${X.stTag(o)}<span class="tiny muted">${X.mono(o.no)} · ${esc(o.enteredBy)} · ${X.relDay(o.createdAt)} ${X.ftime(o.createdAt)}</span></div>
              <div class="small" style="margin-block-start:.2rem">${esc(o.title)}${l.size ? ` · <bdi class="num">${esc(l.size)}</bdi>` : ''}</div>
              <div class="row-wrap tiny muted" style="margin-block-start:.25rem">${o.note ? `<span>${icon('pen')} ${esc(o.note)}</span>` : ''}<span>גרסה ${num(o.graphics.versions.length || 0)}</span>${o.stage === 5 && o.graphics.sentAt ? `<span class="clock">${icon('clock')}הלקוח לא ענה ${X.ago(o.graphics.sentAt).replace('לפני ', '')}</span>` : ''}${o.stage >= 6 ? `<span class="tag ok">${icon('check')}אושר ${X.ago(o.graphics.approvedAt)}</span>` : ''}</div></div>
            <div class="g-actions">${o.stage === 4 ? `<button class="btn btn-outline btn-sm" type="button" data-up="${o.no}">${icon('upload')}גרסה חדשה</button><button class="btn btn-wa btn-sm" type="button" data-send="${o.no}">${icon('wa')}לאישור הלקוח</button>` : o.stage === 5 ? `<button class="btn btn-ok btn-sm" type="button" data-ok="${o.no}">${icon('check')}אושר</button><button class="btn btn-ghost btn-sm" type="button" data-rem="${o.no}">${icon('bolt')}תזכורת</button>` : `<a class="btn btn-ghost btn-sm" href="#/orders/${o.no}?tab=production">${icon('factory')}לייצור</a>`}</div>
          </div></div>`;
        }).join('') : `<div class="empty">${icon('check')}אין עבודות בסינון הזה</div>`}</div>`;
    },
    mount(root, r) {
      const re = () => X.render();
      $$('[data-f]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'f', b.dataset.f === 'all' ? '' : b.dataset.f)));
      $$('[data-up]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.up); const v = o.graphics.versions.length + 1; o.graphics.versions.push({ v, by: 'אינה', at: X.now().toISOString() }); X.log(o, 'אינה', `גרפיקה גרסה ${v} הועלתה`); X.save(); X.toast(`גרסה ${v} הועלתה ל${esc(o.branch)}`); re(); }));
      $$('[data-send]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.send); X.setStage(o, 5); X.toast(`הסקיצה נשלחה ל${esc(o.branch)} בווטסאפ`, 'wa'); re(); }));
      $$('[data-ok]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.ok); X.setStage(o, 6, 'המערכת'); X.toast(`${esc(o.branch)} אישר. עבר לייצור`); re(); }));
      $$('[data-rem]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.rem); X.log(o, 'המערכת', 'נשלחה תזכורת ללקוח בווטסאפ'); X.save(); X.toast(`נשלחה תזכורת ל${esc(o.branch)}`, 'wa'); }));
    }
  };
})();
