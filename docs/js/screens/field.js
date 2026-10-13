/* "אפליקציית המתקין": הסידור של היום, צילום, החתמה דיגיטלית על תעודת משלוח, שליחה למשרד ולרווחית */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;
  const picked = {}; let sigOK = false; let sending = false;

  function stopsFor(teamId) { return X.orderRoute(X.routeOf(teamId, D.today)); }
  function stopCard(o, i, cur) {
    const done = o.install.status === 'done'; const onsite = o.install.status === 'onsite'; const c = X.cust(o.customer);
    return `<article class="f-stop${done ? ' done' : ''}${cur ? ' cur' : ''}" aria-label="תחנה ${i + 1}">
      <div class="f-stop-head"><span class="s-num">${done ? icon('check') : i + 1}</span><div class="grow"><div class="strong">${esc(o.branch)}</div><div class="small muted">${esc(o.city)} · <bdi class="num">${esc(o.install.slot || '')}</bdi></div>
        ${done ? `<div class="tag ok" style="margin-block-start:.3rem">${icon('sign')}נחתם ${X.ftime(o.docs.signedAt || X.now())} · ${esc(o.docs.signer || '')}</div>` : `<div class="small" style="margin-block-start:.25rem">${esc(o.title)}</div>`}</div></div>
      ${cur ? `<div style="padding:0 .85rem .7rem"><div style="background:#F1F1F2;border-radius:10px;padding:.6rem;display:grid;place-items:center">${X.orderSketch(o)}</div><div class="small" style="margin-block-start:.5rem;display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><span>איש קשר: <b>${esc(o.install.contact || c.contact.name)}</b> <span class="muted tiny">(לדוגמה)</span></span><span class="tag ${onsite ? 'info' : 'outline'}">${onsite ? 'במקום' : 'בדרך'}</span></div>
        ${o.note ? `<div class="note warn" style="margin-block-start:.5rem;padding:.55rem .7rem;font-size:.82rem">${icon('pen')}<span>${esc(o.note)}</span></div>` : ''}</div>
        <div class="f-actions"><button class="btn btn-outline" type="button" data-go="${o.no}">${icon('nav')}ניווט</button><button class="btn btn-outline" type="button" data-call="${o.no}">${icon('call')}התקשרות</button>
          ${onsite ? `<button class="btn btn-primary" type="button" data-finish="${o.no}" style="grid-column:1/-1">${icon('camera')}סיימתי, לצילום וחתימה</button>` : `<button class="btn btn-dark" type="button" data-arrive="${o.no}" style="grid-column:1/-1">${icon('pin')}הגעתי</button>`}
          <button class="btn btn-ghost" type="button" data-issue="${o.no}" style="grid-column:1/-1">${icon('alert')}בעיה בשטח</button></div>` : ''}
    </article>`;
  }
  function listScreen(t) {
    const stops = stopsFor(t.id); const cur = stops.find(o => o.install.status !== 'done'); const done = stops.filter(o => o.install.status === 'done').length;
    return `<div class="app-bar"><img src="assets/icon.png" alt="" width="34" height="34"><div class="grow"><div class="ab-title">בוקר טוב, ${esc(t.name)}</div><div class="ab-sub">${X.fday(D.today)} · ${esc(t.vehicle)}</div></div></div>
      <div class="f-body"><div class="between"><b>הסידור שלי היום</b><span class="small muted">${num(done)} מתוך ${num(stops.length)} הושלמו</span></div><div class="bar ok"><i style="inline-size:${stops.length ? Math.round(done / stops.length * 100) : 0}%"></i></div>
        ${stops.length ? stops.map((o, i) => stopCard(o, i, o === cur)).join('') : `<div class="empty">${icon('truck')}אין התקנות היום</div>`}
        ${stops.length && !cur ? `<div class="note ok">${icon('check')}<span><b>כל התחנות של היום הושלמו.</b> כל התעודות כבר במשרד וברווחית.</span></div>` : ''}</div>`;
  }
  function photoScreen(o) {
    const sel = picked[o.no] || [];
    return `<div class="app-bar"><button class="icon-btn" type="button" data-back aria-label="חזרה" style="color:#fff">${icon('arrowR')}</button><div class="grow"><div class="ab-title">סיום התקנה</div><div class="ab-sub">${esc(o.branch)}</div></div></div>
      <div class="f-steps"><span class="on"></span><span></span><span></span></div>
      <div class="f-body"><b>1. צילום ההתקנה</b><p class="small muted">בוחרים לפחות תמונה אחת. בהדגמה: תמונות לדוגמה במקום המצלמה.</p>
        <div class="photos">${[0, 1, 2].map(i => `<button type="button" class="photo-pick${sel.indexOf(i) >= 0 ? ' on' : ''}" data-ph="${i}" aria-pressed="${sel.indexOf(i) >= 0}" aria-label="תמונה ${i + 1}">${X.photo(i, X.cust(o.customer).name)}</button>`).join('')}</div>
        <button class="btn btn-primary btn-block" type="button" data-tosign ${sel.length ? '' : 'disabled'}>${icon('sign')}המשך לחתימת הלקוח</button></div>`;
  }
  function signScreen(o, t) {
    const c = X.cust(o.customer); const dn = o.docs.deliveryNo || String(D.counters.delivery + 1).padStart(6, '0');
    return `<div class="app-bar"><button class="icon-btn" type="button" data-back aria-label="חזרה" style="color:#fff">${icon('arrowR')}</button><div class="grow"><div class="ab-title">תעודת משלוח</div><div class="ab-sub">${esc(o.branch)}</div></div></div>
      <div class="f-steps"><span class="on"></span><span class="on"></span><span></span></div>
      <div class="f-body"><b>2. חתימת הלקוח</b>
        <div class="dn-paper"><div class="dn-head"><img src="assets/logo.png" alt="איקס מדיה" width="300" height="76"><div style="text-align:end"><b>תעודת משלוח</b><div class="mono">${esc(dn)}</div></div></div>
          <div class="between tiny"><span>לכבוד: <b>${esc(c.legal || c.name)}</b></span><span>${X.fdate(D.today)}</span></div><div class="tiny">אתר: ${esc(o.branch)}, ${esc(o.city)}${o.docs.po ? ` · הזמנת רכש <bdi class="num">${esc(o.docs.po)}</bdi>` : ''}</div>
          <table><thead><tr><th>פריט</th><th>מידה</th><th>כמות</th></tr></thead><tbody>${o.lines.map(l => `<tr><td>${esc(l.name)}</td><td><bdi class="num">${esc(l.size || '-')}</bdi></td><td>${num(l.qty)}</td></tr>`).join('')}</tbody></table>
          <div class="tiny muted">הותקן על ידי צוות ${esc(t.name)}. הסחורה התקבלה במצב תקין.</div></div>
        <div class="sig-wrap" id="sigWrap"><canvas id="sig" aria-label="משטח חתימה"></canvas><span class="sig-line"></span><span class="sig-hint" id="sigHint">חתמו כאן באצבע</span></div>
        <div class="field"><label for="signer">שם החותם</label><input class="input" id="signer" value="${esc(o.install.contact || c.contact.name)}"></div>
        <div class="row" style="gap:.5rem"><button class="btn btn-ghost" type="button" id="sigClear">${icon('refresh')}ניקוי</button><button class="btn btn-primary grow" type="button" id="sigOk" ${sigOK ? '' : 'disabled'}>${icon('check')}אישור ושליחה</button></div></div>`;
  }
  function sentScreen(o) {
    return `<div class="app-bar"><div class="grow"><div class="ab-title">נשלח</div><div class="ab-sub">${esc(o.branch)}</div></div></div>
      <div class="f-steps"><span class="on"></span><span class="on"></span><span class="on"></span></div>
      <div class="f-body" style="text-align:center"><div class="big-ok">${icon('check')}</div><h2>התעודה נחתמה ונשלחה</h2>
        <div class="sent-steps" style="text-align:start;margin-block:.75rem" id="sentSteps">
          <div class="sent-step on"><span class="ss-ic">${icon('check')}</span>נשלח למשרד עם ${num((picked[o.no] || [0]).length)} תמונות</div>
          <div class="sent-step on"><span class="ss-ic">${icon('check')}</span>נרשם ברווחית: תעודה ${X.mono(o.docs.deliveryNo || '')}</div>
          <div class="sent-step on"><span class="ss-ic">${icon('check')}</span>עותק חתום נשלח ללקוח במייל</div></div>
        <button class="btn btn-primary btn-block" type="button" data-back>${icon('arrowL')}לתחנה הבאה</button>
        <a class="btn btn-ghost btn-block" href="#/accounting?f=ready">${icon('receipt')}איך זה נראה בהנהלת החשבונות</a></div>`;
  }
  function signature(root) {
    const cv = $('#sig', root); if (!cv) return;
    const dpr = window.devicePixelRatio || 1; const rect = cv.getBoundingClientRect();
    cv.width = Math.max(10, rect.width * dpr); cv.height = Math.max(10, rect.height * dpr);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#13235B';
    let drawing = false, last = null, len = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const enable = () => { if (len > 40 && !sigOK) { sigOK = true; const b = $('#sigOk'); if (b) b.disabled = false; } const h = $('#sigHint'); if (h) h.style.display = 'none'; };
    cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); len += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; enable(); e.preventDefault(); });
    const up = () => { drawing = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    const demo = () => { const w = rect.width, h = rect.height; ctx.beginPath(); ctx.moveTo(w * .22, h * .62); for (let i = 0; i <= 40; i++) { const x = w * .22 + i * w * .014; const y = h * .55 + Math.sin(i / 2.2) * h * .16 - (i > 30 ? (i - 30) * 2 : 0); ctx.lineTo(x, y); } ctx.stroke(); ctx.beginPath(); ctx.moveTo(w * .5, h * .7); ctx.quadraticCurveTo(w * .62, h * .35, w * .76, h * .62); ctx.stroke(); len = 200; enable(); };
    window.__demo.signDemo = demo;
    $('#sigClear', root).addEventListener('click', () => { ctx.clearRect(0, 0, cv.width, cv.height); len = 0; sigOK = false; $('#sigOk').disabled = true; const h = $('#sigHint'); if (h) h.style.display = ''; });
    if (X.Q.has('signed')) demo();
  }

  window.SCREENS.field = {
    title: 'אפליקציית המתקין',
    render(r) {
      const t = X.team(r.q.get('team')) || X.team('noam');
      const o = r.q.get('stop') ? X.order(r.q.get('stop')) : null; const step = r.q.get('step');
      let inner = listScreen(t);
      if (o && step === 'photo' && X.SHOT && !(picked[o.no] || []).length) picked[o.no] = [0, 1];
      if (o && step === 'photo') inner = photoScreen(o); else if (o && step === 'sign') inner = signScreen(o, t); else if (o && step === 'sent') inner = sentScreen(o);
      return `<div class="field-stage">
        <div class="stack field-explain">
          <div class="page-head" style="margin:0"><div><div class="eyebrow">המודול השני: השטח</div><h1>הטלפון של המתקין</h1><p class="sub">"אין לי איך להחתים". עכשיו יש: הסידור, הסקיצה המאושרת, צילום, וחתימה של הלקוח על המסך. התעודה החתומה מגיעה למשרד ולרווחית באותה שנייה.</p></div></div>
          <div class="card card-pad"><div class="field"><span class="lbl">להציג את הטלפון של</span><div class="chips" role="group" aria-label="צוות" style="flex-wrap:wrap">${D.teams.map(x => `<button class="chip" type="button" data-team="${x.id}" aria-pressed="${x.id === t.id}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)} <bdi class="num">${stopsFor(x.id).length}</bdi></button>`).join('')}</div></div></div>
          <div class="card card-pad"><h2 style="margin-block-end:.5rem">מה זה חוסך</h2><ul class="stack" style="gap:.45rem">
            <li><span class="li-row">${icon('check')}<span>אין יותר תמונה של תעודה בווטסאפ שצריך להעביר לרווחית ידנית.</span></span></li>
            <li><span class="li-row">${icon('check')}<span>בסוף החודש כל תעודה כבר חתומה ומצורפת, ולא חוזרים לבדוק "מה קרה באותו תאריך".</span></span></li>
            <li><span class="li-row">${icon('check')}<span>בעיה בשטח מגיעה למשרד עם תמונה, ונכנסת לרשימת "דורש טיפול".</span></span></li></ul></div>
        </div>
        <div class="phone" aria-label="מסך הטלפון של ${esc(t.name)}"><div class="phone-notch" aria-hidden="true"></div><div class="phone-scroll" id="phoneScroll">${inner}</div></div>
      </div>`;
    },
    mount(root, r) {
      const t = X.team(r.q.get('team')) || X.team('noam');
      const set = (k, v) => { const q = new URLSearchParams(r.q); q.set('team', t.id); Object.keys(k).forEach(x => { if (k[x] == null) q.delete(x); else q.set(x, k[x]); }); X.setQuery(Object.assign({}, r, { q }), 'keep', '1'); const ps = $('#phoneScroll'); if (ps) ps.scrollTop = 0; };
      $$('[data-team]', root).forEach(b => b.addEventListener('click', () => { const q = new URLSearchParams(); q.set('team', b.dataset.team); X.setQuery(Object.assign({}, r, { q }), 'team', b.dataset.team); }));
      $$('[data-back]', root).forEach(b => b.addEventListener('click', () => set({ stop: null, step: null })));
      $$('[data-arrive]', root).forEach(b => b.addEventListener('click', () => { const o = X.order(b.dataset.arrive); o.install.status = 'onsite'; X.log(o, t.name, 'הצוות הגיע לאתר'); X.save(); X.toast('נרשם: הצוות במקום'); set({}); }));
      $$('[data-finish]', root).forEach(b => b.addEventListener('click', () => { sigOK = false; set({ stop: b.dataset.finish, step: 'photo' }); }));
      $$('[data-go]', root).forEach(b => { b.addEventListener('click', () => { const o = X.order(b.dataset.go); X.openExternal('https://waze.com/ul?q=' + encodeURIComponent(o.city) + '&navigate=yes'); }); });
      $$('[data-call]', root).forEach(b => b.addEventListener('click', () => X.toast('בהדגמה לא מחייגים. במערכת: חיוג ישיר לאיש הקשר', 'call')));
      $$('[data-issue]', root).forEach(b => b.addEventListener('click', () => {
        const o = X.order(b.dataset.issue);
        X.sheet({ title: 'בעיה בשטח', body: `<div class="stack"><div class="field"><label for="issueT">מה קרה?</label><textarea class="textarea" id="issueT">הקיר לא מתאים למידה, צריך מסגרת נוספת של 20 ס"מ</textarea></div><div class="photos">${[0, 1, 2].map(i => `<div class="photo-pick${i === 0 ? ' on' : ''}">${X.photo(i, X.cust(o.customer).name)}</div>`).join('')}</div></div>`,
          foot: `<button class="btn btn-ghost" type="button" data-x="c">ביטול</button><button class="btn btn-primary" type="button" data-x="s">${icon('send')}שליחה למשרד</button>`,
          onOpen: el => { $('[data-x="c"]', el).addEventListener('click', X.closeSheet); $('[data-x="s"]', el).addEventListener('click', () => { const txt = $('#issueT', el).value.trim(); X.log(o, t.name, 'בעיה בשטח: ' + txt); X.feedPush({ type: 'alert', text: `${t.name} מ${o.branch}: ${X.shortTitle(txt, 60)}`, link: '#/orders/' + o.no }); X.closeSheet(); X.toast('נשלח למשרד עם תמונה. סמדר תראה את זה ב"דורש טיפול"'); }); } });
      }));
      $$('[data-ph]', root).forEach(b => b.addEventListener('click', () => { const no = r.q.get('stop'); const s = picked[no] = picked[no] || []; const i = Number(b.dataset.ph); const k = s.indexOf(i); if (k >= 0) s.splice(k, 1); else s.push(i); set({}); }));
      const ts = $('[data-tosign]', root); if (ts) ts.addEventListener('click', () => { sigOK = false; set({ step: 'sign' }); });
      if (r.q.get('step') === 'sign') {
        signature(root);
        $('#sigOk', root).addEventListener('click', async () => {
          if (!sigOK || sending) return; sending = true;
          const o = X.order(r.q.get('stop')); const signer = ($('#signer', root).value || '').trim() || 'הלקוח';
          const b = $('#sigOk', root); b.disabled = true; b.innerHTML = '<span class="spinner"></span>שולח...';
          await X.sleep(900);
          o.docs.signed = true; o.docs.signedAt = X.now().toISOString(); o.docs.signer = signer; o.install.photos = (picked[o.no] || [0]).slice(); o.install.status = 'done';
          X.log(o, t.name, `הותקן. תעודת משלוח נחתמה דיגיטלית על ידי ${signer}`);
          X.setStage(o, 8, t.name);
          X.feedPush({ type: 'sign', text: `${t.name}: תעודת משלוח נחתמה בשטח, ${o.branch}`, link: '#/orders/' + o.no });
          sending = false; set({ step: 'sent' });
        });
      }
    }
  };
})();
