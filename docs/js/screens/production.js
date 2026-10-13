/* מסך "ייצור": תור לכל מכונה, במקום דרייב לכל מכונה */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;

  function queue(mid) { return D.orders.filter(o => o.machine === mid && o.stage === 6).sort((a, b) => (b.urgent - a.urgent) || a.due.localeCompare(b.due)); }
  function waiting(mid) { return D.orders.filter(o => o.machine === mid && (o.stage === 4 || o.stage === 5)).length; }
  const CK = ['material', 'printed', 'cut', 'packed'];
  const CKL = { material: 'חומר', printed: 'הודפס', cut: 'נחתך', packed: 'נארז' };

  window.SCREENS.production = {
    title: 'ייצור',
    render(r) {
      const sel = r.q.get('m') || '';
      const ms = D.machines.filter(m => !sel || m.id === sel);
      return `<div class="page-head"><div><div class="eyebrow">רצפת הייצור</div><h1>ייצור לפי מכונה</h1><p class="sub">כל מכונה מקבלת תור מסודר במקום דרייב משלה. מי שעומד ליד המכונה רואה מה הבא בתור, ומסמן כשסיים.</p></div>
        <div class="actions"><button class="btn btn-outline" type="button" id="waProd">${icon('wa')}איך זה נראה בקבוצת הייצור</button></div></div>
        <div class="chips" role="group" aria-label="מכונה" style="margin-block-end:1rem"><button class="chip" type="button" data-m="" aria-pressed="${!sel}">כל המכונות</button>${D.machines.map(m => `<button class="chip" type="button" data-m="${m.id}" aria-pressed="${sel === m.id}">${esc(m.name)} <bdi class="num">${queue(m.id).length}</bdi></button>`).join('')}</div>
        <div class="machines">${ms.map(m => {
          const q = queue(m.id); const pct = Math.min(100, Math.round(q.length / m.cap * 100));
          return `<section class="card" aria-label="${esc(m.name)}"><div class="card-head"><div class="row"><span class="m-ic">${esc(m.name.slice(0, 4))}</span><div><h2>${esc(m.name)}</h2><div class="tiny muted">${esc(m.desc)} · מפעיל: ${esc(m.operator)}</div></div></div></div>
            <div class="card-body"><div class="m-load"><span>תפוסה היום</span><span class="bar ${pct > 85 ? 'warn' : 'ok'}"><i style="inline-size:${pct}%"></i></span><b><bdi class="num">${X.fmt(q.length)}/${X.fmt(m.cap)}</bdi></b></div><div class="tiny muted" style="margin-block-start:.3rem">${num(waiting(m.id))} עבודות בדרך מהגרפיקה</div></div>
            <div class="list">${q.length ? q.slice(0, 6).map((o, i) => { const done = CK.filter(k => o.production.checklist[k]).length; const l = o.lines[0];
              return `<div class="list-item" style="align-items:flex-start"><span class="li-icon" style="font-weight:800;font-family:var(--font-h)">${i + 1}</span><span class="li-main"><a class="li-title tap" href="#/orders/${o.no}?tab=production" style="color:var(--ink)">${esc(o.branch)}</a><span class="li-sub">${esc(X.shortTitle(o.title, 54))}${l.size ? ` · <bdi class="num">${esc(l.size)}</bdi>` : ''}</span>
                ${m.id === 'cnc' ? `<span class="li-sub">חומר: ${esc(l.mat)} · אחרי חיתוך: ${esc(l.after)}</span>` : ''}
                <span class="row-wrap" style="margin-block-start:.35rem">${CK.map(k => `<span class="tag ${o.production.checklist[k] ? 'ok' : 'outline'}">${o.production.checklist[k] ? icon('check') : ''}${CKL[k]}</span>`).join('')}</span></span>
                <span class="li-end">${o.urgent ? '<span class="tag urgent">' + icon('flame') + 'דחוף</span>' : ''}<span>יעד ${X.relDay(o.due)}</span><button class="btn ${done >= 3 ? 'btn-primary' : 'btn-outline'} btn-sm" type="button" data-step="${o.no}">${done >= 3 ? 'סיום' : 'הצעד הבא'}</button></span></div>`; }).join('') : `<div class="empty small">${icon('check')}אין עבודות בתור</div>`}${q.length > 6 ? `<a class="kb-more" href="#/orders?view=list&m=${m.id}">עוד ${q.length - 6} בתור</a>` : ''}</div></section>`;
        }).join('')}</div>`;
    },
    mount(root, r) {
      $$('[data-m]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'm', b.dataset.m)));
      $$('[data-step]', root).forEach(b => b.addEventListener('click', () => {
        const o = X.order(b.dataset.step); const k = CK.find(x => !o.production.checklist[x]);
        if (k) { o.production.checklist[k] = true; X.log(o, o.production.assignee || 'מתן', `סומן: ${CKL[k]}`); }
        if (CK.every(x => o.production.checklist[x])) { X.setStage(o, 7, o.production.assignee || 'מתן'); X.toast(`${esc(o.branch)} מוכן. עבר להתקנות`); }
        else { X.save(); X.toast(`${esc(o.branch)}: ${CKL[k]}`); }
        X.render();
      }));
      $('#waProd', root).addEventListener('click', () => {
        const o = D.orders.find(x => x.stage === 6) || D.orders[0];
        X.sheet({ title: 'קבוצת "ייצור איקס מדיה" (איור)', body: `<p class="small muted" style="margin-block-end:.6rem">במקום לכתוב לכולם ולחכות: כל עבודה שנכנסת לייצור יוצאת לקבוצה כסקר. מי שלוחץ, לקח אותה, וזה נרשם במערכת.</p><div class="bubble-preview"><div class="wa-b in"><div class="who" style="color:#B81828">המערכת של איקס מדיה</div>עבודה ${esc(o.no)} · ${esc(o.branch)}<br>${esc(X.shortTitle(o.title, 60))}<br><b>מי מבצע?</b><div class="wa-poll">${['אברהם', 'מירן', 'עידו'].map((n, i) => `<button type="button" class="${i === 0 ? 'voted' : ''}" data-v="${n}">${icon(i === 0 ? 'check' : 'user')}${n}<span class="bar"><i style="inline-size:${i === 0 ? 100 : 0}%"></i></span></button>`).join('')}</div><div class="t">${X.ftime(X.now())}</div></div></div>`,
          onOpen: el => $$('[data-v]', el).forEach(b => b.addEventListener('click', () => { $$('[data-v]', el).forEach(x => { x.classList.toggle('voted', x === b); $('i', x).style.inlineSize = x === b ? '100%' : '0%'; }); X.toast(`${b.dataset.v} לקח את העבודה. נרשם במערכת`); })) });
      });
    }
  };
})();
