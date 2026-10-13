/* כרטיס הזמנה: שלבים, גרפיקה ואישור לקוח, ייצור, התקנה, מסמכים, יומן */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, mono, $, $$ } = X;
  const TABS = [['details', 'פרטים', 'clipboard'], ['graphics', 'גרפיקה', 'pen'], ['production', 'ייצור', 'factory'], ['install', 'התקנה', 'truck'], ['money', 'מסמכים וכסף', 'receipt'], ['log', 'יומן', 'clock']];
  const defaultTab = o => o.stage === 4 || o.stage === 5 ? 'graphics' : o.stage === 6 ? 'production' : o.stage === 7 ? 'install' : o.stage === 8 ? 'money' : 'details';

  function stepper(o) {
    return `<div class="stepper" aria-label="שלבי ההזמנה">${D.stages.map(s => `<div class="step ${s.id < o.stage || o.stage === 8 && s.id === 8 && o.docs.invoiceNo ? 'done' : s.id === o.stage ? 'cur' : ''}"${s.id === o.stage ? ' aria-current="step"' : ''}><span class="s-dot">${s.id < o.stage ? icon('check') : icon(s.icon)}</span><span>${s.name}</span></div>`).join('')}</div>`;
  }
  function details(o) {
    const c = X.cust(o.customer);
    return `<div class="stack">
      <div class="line-items">${o.lines.map(l => `<div class="line-it"><span class="li-name">${esc(l.name)} ${l.size ? `<bdi class="num">${esc(l.size)}</bdi> ס"מ` : ''}</span><span class="strong">${money(l.price * l.qty)}</span>
        <span class="li-meta"><span>כמות <b>${num(l.qty)} ${esc(l.unit)}</b></span>${l.mat ? `<span>חומר <b>${esc(l.mat)}</b></span>` : ''}<span>תהליך <b>${esc(l.after)}</b></span><span>מחיר ליחידה <b>${money(l.price)}</b></span></span></div>`).join('')}</div>
      ${o.note ? `<div class="note warn">${icon('pen')}<span><b>הערות/עדיפות:</b> ${esc(o.note)}</span></div>` : ''}
      <div class="card card-pad"><div class="kv"><div><dt>נכנס דרך</dt><dd>${esc(o.channel)} · ${X.fday(o.createdAt)} ${X.ftime(o.createdAt)}</dd></div><div><dt>הכניס/ה</dt><dd>${esc(o.enteredBy)}</dd></div>
        <div><dt>גרפיקה</dt><dd>${o.needsGraphics ? 'עיצוב בסטודיו (אינה)' : 'קובץ מוכן מהלקוח'}</dd></div><div><dt>יעד</dt><dd>${X.fday(o.due)}</dd></div>
        <div><dt>איש קשר (לדוגמה)</dt><dd>${esc(c.contact.name)} · <bdi class="num">${esc(c.contact.phone)}</bdi></dd></div><div><dt>תנאי תשלום</dt><dd>${esc(c.terms)}</dd></div></div></div>
    </div>`;
  }
  function graphics(o) {
    const g = o.graphics;
    if (o.stage < 4) return `<div class="empty">${icon('pen')}<p>הגרפיקה מתחילה אחרי שהלקוח מאשר את הצעת המחיר.</p><p class="small">כרגע: ${esc(X.stage(o.stage).name)}</p></div>`;
    const status = o.stage === 4 ? `<div class="note">${icon('pen')}<span>${o.needsGraphics ? 'אינה עובדת על הסקיצה.' : 'הלקוח שלח קובץ מוכן. רק לבדוק מידות ולשלוח לאישור.'}</span></div>`
      : o.stage === 5 ? `<div class="note warn">${icon('clock')}<span>נשלח ללקוח לאישור ${X.ago(g.sentAt)}. ${X.hoursSince(g.sentAt) > 20 ? '<b>עבר יותר מיום, כדאי לשלוח תזכורת.</b>' : ''}</span></div>`
      : `<div class="note ok">${icon('check')}<span>הלקוח אישר את הגרפיקה ${X.fday(g.approvedAt)} ב-${X.ftime(g.approvedAt)}. הקובץ עבר ל${esc((X.machine(o.machine) || { name: 'התקנה' }).name)}.</span></div>`;
    const acts = o.stage === 4 ? `<button class="btn btn-outline" type="button" data-g="upload">${icon('upload')}העלאת גרסה</button><button class="btn btn-wa" type="button" data-g="send">${icon('wa')}שליחה ללקוח לאישור</button>`
      : o.stage === 5 ? `<button class="btn btn-ok" type="button" data-g="approve">${icon('check')}הלקוח אישר</button><button class="btn btn-outline" type="button" data-g="fix">${icon('pen')}הלקוח ביקש תיקון</button><button class="btn btn-ghost" type="button" data-g="remind">${icon('bolt')}תזכורת ללקוח</button>` : '';
    return `<div class="stack">${status}
      <div class="versions">${g.versions.slice().reverse().map((v, i) => `<div class="version"><div class="v-img">${X.orderSketch(o, v.v)}</div><div class="v-meta"><span><b>גרסה ${v.v}</b> · ${esc(v.by)}</span><span class="muted">${X.relDay(v.at)} ${X.ftime(v.at)}</span>${v.fix ? `<span class="tag warn" style="inline-size:100%;justify-content:flex-start">${icon('pen')}תיקון: ${esc(v.fix)}</span>` : ''}${i === 0 && o.stage >= 6 ? '<span class="tag ok">' + icon('check') + 'אושרה</span>' : ''}</div></div>`).join('')}</div>
      ${acts ? `<div class="row-wrap">${acts}</div>` : ''}</div>`;
  }
  function production(o) {
    if (o.stage < 6) return `<div class="empty">${icon('factory')}<p>הייצור מתחיל אחרי שהלקוח מאשר את הגרפיקה.</p></div>`;
    const ck = o.production.checklist; const all = Object.values(ck).every(Boolean);
    const L = { material: 'יש חומר במלאי', printed: 'הודפס', cut: 'נחתך / עובד', packed: 'נארז ומוכן' };
    return `<div class="stack">
      <div class="form-grid two"><div class="field"><label for="pm">מכונה</label><select class="select" id="pm" ${o.stage > 6 ? 'disabled' : ''}>${D.machines.map(m => `<option value="${m.id}" ${m.id === o.machine ? 'selected' : ''}>${esc(m.name)} · ${esc(m.desc)}</option>`).join('')}<option value="" ${!o.machine ? 'selected' : ''}>התקנה בלבד</option></select></div>
        <div class="field"><span class="lbl">מטפל</span><div class="input" style="display:flex;align-items:center">${esc(o.production.assignee || '-')}</div></div></div>
      <div class="card card-pad"><div class="checklist">${Object.keys(L).map(k => `<label class="check"><input type="checkbox" data-ck="${k}" ${ck[k] ? 'checked' : ''} ${o.stage > 6 ? 'disabled' : ''}>${L[k]}</label>`).join('')}</div></div>
      <div class="card tbl-wrap"><table class="tbl" aria-label="פרטי ייצור"><thead><tr><th>פריט</th><th>מידה</th><th>כמות</th><th>סוג חומר לחיתוך</th><th>תהליך אחרי חיתוך</th><th>מקדם</th></tr></thead><tbody>
        ${o.lines.map((l, i) => `<tr><td class="td-main" data-label="פריט">${esc(l.name)}</td><td class="td-end" data-label="מידה"><bdi class="num">${esc(l.size || '-')}</bdi></td><td data-label="כמות">${num(l.qty)}</td><td data-label="חומר">${esc(l.mat || '-')}</td><td data-label="תהליך">${esc(l.after)}</td><td data-label="מקדם">${num(4 + (i % 3))}</td></tr>`).join('')}</tbody></table></div>
      ${o.stage === 6 ? `<div class="row-wrap"><button class="btn btn-primary" type="button" data-p="finish" ${all ? '' : 'disabled'}>${icon('truck')}הייצור הסתיים, להתקנה</button>${all ? '' : '<span class="small muted">מסמנים את כל השלבים כדי לסיים</span>'}</div>` : ''}
    </div>`;
  }
  function install(o) {
    if (o.stage < 7 && !o.install) return `<div class="empty">${icon('truck')}<p>ההתקנה משובצת כשהייצור מסתיים.</p></div>`;
    const ins = o.install || {};
    const done = ins.status === 'done';
    return `<div class="stack">
      ${!ins.date ? `<div class="note warn">${icon('alert')}<span><b>מוכן ועדיין לא בסידור.</b> ${esc(o.note || '')}</span></div>` : ''}
      <div class="card card-pad"><div class="kv"><div><dt>צוות</dt><dd>${X.teamTag(ins.team)}</dd></div><div><dt>מתי</dt><dd>${ins.date ? `${X.relDay(ins.date)} · <bdi class="num">${esc(ins.slot || '')}</bdi>` : 'טרם נקבע'}</dd></div>
        <div><dt>כתובת</dt><dd>${esc(o.branch)}, ${esc(o.city)}</dd></div><div><dt>איש קשר בשטח (לדוגמה)</dt><dd>${esc(ins.contact || X.cust(o.customer).contact.name)}</dd></div></div></div>
      ${done ? `<div class="stack"><span class="lbl small strong">תמונות מהשטח</span><div class="photos">${(ins.photos && ins.photos.length ? ins.photos : [1]).map((p, i) => `<div class="photo-pick">${X.photo(i, X.cust(o.customer).name)}</div>`).join('')}</div>
        <div class="note ${o.docs.signed ? 'ok' : 'warn'}">${icon(o.docs.signed ? 'sign' : 'alert')}<span>${o.docs.signed ? `תעודת משלוח ${X.mono(o.docs.deliveryNo || '')} נחתמה בשטח על ידי ${esc(o.docs.signer)} ${X.relDay(o.docs.signedAt)} ב-${X.ftime(o.docs.signedAt)}` : 'התעודה לא נחתמה בשטח. אפשר לשלוח ללקוח קישור לחתימה.'}</span></div></div>` : ''}
      <div class="row-wrap">${!done ? `<button class="btn btn-primary" type="button" data-i="schedule">${icon('calendar')}${ins.date ? 'שינוי שיבוץ' : 'שיבוץ לצוות'}</button>${ins.date ? `<a class="btn btn-outline" href="#/installs/route?team=${ins.team}&day=${ins.date === D.today ? 0 : 1}">${icon('route')}הסידור של ${esc((X.team(ins.team) || {}).name || '')}</a>` : ''}` : ''}${done && !o.docs.signed ? `<button class="btn btn-outline" type="button" data-i="signlink">${icon('send')}קישור לחתימה ללקוח</button>` : ''}</div>
    </div>`;
  }
  function money_(o) {
    const net = o.total, vat = Math.round(net * 0.18);
    const doc = (t, no, ok, extra) => `<div class="doc ${no ? '' : 'missing'}"><span class="d-type">${t}</span><span class="d-no">${no ? mono(no) : 'עוד לא'}</span>${extra || ''}${ok != null ? `<span class="yn ${ok ? 'y' : 'n'}">${icon(ok ? 'check' : 'x')}${ok ? 'תקין' : 'חסר'}</span>` : ''}</div>`;
    const canInv = o.stage === 8 && o.docs.signed && o.docs.po && !o.docs.invoiceNo;
    return `<div class="stack">
      <div class="doc-chain">${doc('הצעת מחיר (רווחית)', o.docs.quoteNo, null)}${doc('הזמנת רכש של הלקוח', o.docs.po, X.cust(o.customer).po ? !!o.docs.po : null, X.cust(o.customer).po ? '' : '<span class="tiny muted">לא נדרש ללקוח הזה</span>')}${doc('תעודת משלוח', o.docs.deliveryNo, o.docs.deliveryNo ? o.docs.signed : null, o.docs.deliveryNo ? `<span class="tiny muted">${o.docs.signed ? 'חתומה' : 'לא חתומה'}</span>` : '')}${doc('חשבונית מס', o.docs.invoiceNo, null)}</div>
      <div class="card tbl-wrap"><table class="tbl" aria-label="שורות"><thead><tr><th>פריט</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr></thead><tbody>${o.lines.map(l => `<tr><td class="td-main" data-label="פריט">${esc(l.name)} ${l.size ? `<bdi class="num">${esc(l.size)}</bdi>` : ''}</td><td class="td-end" data-label="סה&quot;כ">${money(l.price * l.qty)}</td><td data-label="כמות">${num(l.qty)}</td><td data-label="מחיר">${money(l.price)}</td><td class="td-hide-m" data-label="סה&quot;כ">${money(l.price * l.qty)}</td></tr>`).join('')}</tbody></table>
        <div class="between card-pad" style="border-block-start:1px solid var(--line)"><span class="muted small">לפני מע"מ ${money(net)} · מע"מ ${money(vat)}</span><b>סה"כ ${money(net + vat)}</b></div></div>
      <div class="row-wrap">${canInv ? `<button class="btn btn-primary" type="button" data-m="invoice">${icon('receipt')}הפקת חשבונית ברווחית</button>` : ''}<button class="btn btn-outline" type="button" data-m="rivhit">${icon('plug')}פתיחה ברווחית</button></div>
      <p class="tiny muted">המחירים לדוגמה בלבד.</p>
    </div>`;
  }
  function logTab(o) { return `<div class="timeline">${o.log.slice().reverse().map(l => `<div class="tl"><span class="tl-dot"></span><div><div class="tl-text">${esc(l.text)}</div><div class="tl-meta">${esc(l.who)} · ${X.relDay(l.at)} ${X.ftime(l.at)}</div></div></div>`).join('')}</div>`; }

  window.SCREENS.order = {
    nav: 'orders',
    title: r => { const o = X.order(r.parts[1]); return o ? `הזמנה ${o.no}` : 'הזמנה לא נמצאה'; },
    render(r) {
      const o = X.order(r.parts[1]);
      if (!o) return `<div class="card card-pad" style="max-inline-size:34rem;margin:2rem auto;text-align:center"><h1>הזמנה לא נמצאה</h1><p class="muted" style="margin-block:.5rem 1rem">אולי היא נמחקה באיפוס ההדגמה.</p><a class="btn btn-primary" href="#/orders">לכל ההזמנות</a></div>`;
      const tab = r.q.get('tab') || defaultTab(o);
      const body = { details, graphics, production, install, money: money_, log: logTab }[tab] || details;
      const c = X.cust(o.customer);
      const next = o.stage < 8 ? X.stage(o.stage + 1) : null;
      return `<div class="order-head">
        <div class="crumbs"><a href="#/orders">הזמנות</a>${icon('chev', 'chev')}<span>${X.mono(o.no)}</span></div>
        <div class="between" style="align-items:flex-start"><div style="min-inline-size:0"><h1>${esc(o.branch)}</h1><p class="muted" style="margin-block-start:.25rem">${esc(o.title)}</p>
          <div class="row-wrap" style="margin-block-start:.5rem">${X.stTag(o)}${X.stageTag(o)}${X.machineTag(o.machine)}${o.install && o.install.team ? X.teamTag(o.install.team) : ''}<span class="tag outline">${icon(o.channel === 'ווטסאפ' ? 'wa' : o.channel === 'מייל' ? 'mail' : 'call')}${esc(o.channel)}</span></div></div>
          <div class="row-wrap">${next ? `<button class="btn btn-primary" type="button" id="oNext">${icon('arrowL')}ל"${next.name}"</button>` : ''}<button class="btn btn-outline" type="button" id="oUrgent">${icon('flame')}${o.urgent ? 'ביטול דחוף' : 'סימון דחוף'}</button><button class="btn btn-ghost" type="button" id="oMove">${icon('move')}שלב אחר</button></div></div>
        <div class="card card-pad">${stepper(o)}</div>
      </div>
      <div class="grid grid-main section">
        <div class="stack">
          <div class="seg" role="tablist" aria-label="חלקי ההזמנה">${TABS.map(([k, l, ic]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}">${icon(ic)}${l}</button>`).join('')}</div>
          <div class="card card-pad" id="tabBody">${body(o)}</div>
        </div>
        <aside class="stack">
          <section class="card"><div class="card-head"><h2>${icon('user')}${esc(c.name)}</h2><span class="tag ${c.tier === 'A' ? 'brand' : 'outline'}">לקוח ${c.tier}</span></div>
            <div class="card-body"><div class="kv" style="grid-template-columns:1fr 1fr"><div><dt>סה"כ ההזמנה</dt><dd>${money(o.total * 1.18)}</dd></div><div><dt>יעד</dt><dd>${X.relDay(o.due)}</dd></div><div><dt>תנאי תשלום</dt><dd>${esc(c.terms)}</dd></div><div><dt>הזמנות השנה</dt><dd>${num(D.orders.filter(x => x.customer === c.id).length + 30)}</dd></div></div>
            <a class="btn btn-outline btn-block" style="margin-block-start:.75rem" href="#/pricing?c=${c.id}">${icon('tag')}היסטוריית המחירים של ${esc(c.name)}</a></div></section>
          <section class="card d-only"><div class="card-head"><h2>${icon('clock')}יומן</h2></div><div class="card-body">${logTab({ log: o.log.slice(-6) })}</div></section>
        </aside>
      </div>`;
    },
    mount(root, r) {
      const o = X.order(r.parts[1]); if (!o) return;
      const re = () => X.render();
      $$('[data-tab]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'tab', b.dataset.tab)));
      const nx = $('#oNext', root); if (nx) nx.addEventListener('click', () => { const s = o.stage + 1; X.setStage(o, s); X.toast(`עבר ל"${X.stage(s).name}"`); const q = new URLSearchParams(r.q); q.delete('tab'); X.setQuery(Object.assign({}, r, { q }), 'tab', defaultTab(o)); });
      $('#oUrgent', root).addEventListener('click', () => { o.urgent = !o.urgent; X.log(o, 'סמדר', o.urgent ? 'סומן דחוף' : 'בוטל הסימון דחוף'); X.save(); X.toast(o.urgent ? 'סומן דחוף. יופיע באדום אצל כולם' : 'הסימון דחוף בוטל', o.urgent ? 'flame' : 'check'); re(); });
      $('#oMove', root).addEventListener('click', () => X.moveSheet(o.no, re));
      // גרפיקה
      $$('[data-g]', root).forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.g;
        if (a === 'upload') { const v = o.graphics.versions.length + 1; o.graphics.versions.push({ v, by: 'אינה', at: X.now().toISOString() }); X.log(o, 'אינה', `גרפיקה גרסה ${v} הועלתה`); X.save(); X.toast(`גרסה ${v} הועלתה`); re(); }
        if (a === 'send') {
          const c = X.cust(o.customer);
          X.sheet({ title: 'שליחת הסקיצה ללקוח', body: `<p class="muted small" style="margin-block-end:.6rem">כך זה ייראה אצל ${esc(c.contact.name)} בווטסאפ. התשובה שלו חוזרת לכאן, לא לטלפון של מישהו.</p><div class="bubble-preview"><div class="wa-b out">${X.orderSketch(o)}<span>שלום, מצורפת סקיצה לאישור: ${esc(X.shortTitle(o.title, 60))}.<br><b>לאישור השיבו 1</b>, לתיקון כתבו מה לשנות.</span><div class="t">${X.ftime(X.now())} ${icon('checks')}</div></div></div>`,
            foot: `<button class="btn btn-ghost" type="button" data-x="c">ביטול</button><button class="btn btn-wa" type="button" data-x="s">${icon('send')}שליחה</button>`,
            onOpen: el => { $('[data-x="c"]', el).addEventListener('click', X.closeSheet); $('[data-x="s"]', el).addEventListener('click', () => { X.closeSheet(); X.setStage(o, 5); X.log(o, 'סמדר', 'הסקיצה נשלחה ללקוח לאישור בווטסאפ'); X.save(); X.toast('הסקיצה נשלחה ללקוח. השעון מתחיל לרוץ'); re(); }); } });
        }
        if (a === 'approve') { X.setStage(o, 6, 'המערכת'); X.toast('הלקוח אישר. העבודה עברה לתור של ' + ((X.machine(o.machine) || {}).name || 'ההתקנה')); X.setQuery(r, 'tab', 'production'); }
        if (a === 'remind') { X.log(o, 'המערכת', 'נשלחה תזכורת ללקוח בווטסאפ'); X.save(); X.toast('נשלחה תזכורת ללקוח בווטסאפ', 'wa'); re(); }
        if (a === 'fix') {
          X.sheet({ title: 'מה הלקוח ביקש לתקן?', body: `<div class="field"><label for="fixT">התיקון (נשמר בגרסה ומגיע לאינה)</label><input class="input" id="fixT" value="הלוגו גדול יותר"></div>`,
            foot: `<button class="btn btn-ghost" type="button" data-x="c">ביטול</button><button class="btn btn-primary" type="button" data-x="s">${icon('pen')}החזרה לגרפיקה</button>`,
            onOpen: el => { $('[data-x="c"]', el).addEventListener('click', X.closeSheet); $('[data-x="s"]', el).addEventListener('click', () => { const t = $('#fixT', el).value.trim() || 'תיקון'; X.closeSheet(); const v = o.graphics.versions.length + 1; o.graphics.versions.push({ v, by: 'אינה', at: X.now().toISOString(), fix: t }); o.graphics.sentAt = null; o.stage = 4; X.log(o, 'סמדר', `הלקוח ביקש תיקון: ${t}. חזר לגרפיקה`); X.save(); X.toast('התיקון נרשם וחזר לאינה'); re(); }); } });
        }
      }));
      // ייצור
      const pm = $('#pm', root); if (pm) pm.addEventListener('change', () => { o.machine = pm.value || null; o.production.assignee = (X.machine(o.machine) || {}).operator || 'מתן'; X.log(o, 'סמדר', `הועבר ל${(X.machine(o.machine) || { name: 'התקנה בלבד' }).name}`); X.save(); X.toast('המכונה עודכנה'); re(); });
      $$('[data-ck]', root).forEach(c => c.addEventListener('change', () => { o.production.checklist[c.dataset.ck] = c.checked; X.save(); re(); }));
      const pf = $('[data-p="finish"]', root); if (pf) pf.addEventListener('click', () => { X.setStage(o, 7, o.production.assignee || 'מתן'); X.toast('הייצור הסתיים. מחכה לשיבוץ התקנה'); X.setQuery(r, 'tab', 'install'); });
      // התקנה
      const sc = $('[data-i="schedule"]', root); if (sc) sc.addEventListener('click', () => {
        const days = [0, 1, 2, 3, 4].map(n => D.workDay(n));
        X.sheet({ title: 'שיבוץ התקנה', body: `<div class="stack"><div class="field"><span class="lbl">צוות</span><div class="chips" style="flex-wrap:wrap">${D.teams.map(t => `<button class="chip" type="button" data-team="${t.id}" aria-pressed="${o.install && o.install.team === t.id}"><span class="dot" style="background:${t.color}"></span>${esc(t.name)}</button>`).join('')}</div></div>
          <div class="field"><span class="lbl">יום</span><div class="chips" style="flex-wrap:wrap">${days.map((d, i) => `<button class="chip" type="button" data-day="${d}" aria-pressed="${(o.install && o.install.date === d) || (!o.install.date && i === 1)}">${X.relDay(d)}</button>`).join('')}</div></div>
          <p class="small muted">המערכת תכניס את התחנה למקום הנכון במסלול של הצוות לפי הדרך.</p></div>`,
          foot: `<button class="btn btn-ghost" type="button" data-x="c">ביטול</button><button class="btn btn-primary" type="button" data-x="s">${icon('check')}שיבוץ</button>`,
          onOpen: el => {
            let tm = (o.install && o.install.team) || 'noam', dy = (o.install && o.install.date) || days[1];
            $$('[data-team]', el).forEach(b => b.addEventListener('click', () => { tm = b.dataset.team; $$('[data-team]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
            $$('[data-day]', el).forEach(b => b.addEventListener('click', () => { dy = b.dataset.day; $$('[data-day]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
            if (!o.install.team) { const b = $(`[data-team="${tm}"]`, el); if (b) b.setAttribute('aria-pressed', 'true'); }
            $('[data-x="c"]', el).addEventListener('click', X.closeSheet);
            $('[data-x="s"]', el).addEventListener('click', () => { o.install.team = tm; o.install.date = dy; o.install.slot = o.install.slot || D.slots[2]; o.install.status = 'scheduled'; X.log(o, 'סמדר', `שובץ לצוות ${X.team(tm).name}, ${X.relDay(dy)}`); X.save(); X.closeSheet(); X.toast(`שובץ ל${X.team(tm).name}, ${X.relDay(dy)}`); re(); });
          } });
      });
      const sl = $('[data-i="signlink"]', root); if (sl) sl.addEventListener('click', () => { X.log(o, 'המערכת', 'נשלח ללקוח קישור לחתימה על התעודה'); X.save(); X.toast('נשלח ללקוח קישור לחתימה בווטסאפ', 'wa'); re(); });
      // כסף
      const inv = $('[data-m="invoice"]', root); if (inv) inv.addEventListener('click', () => { o.docs.invoiceNo = X.nextNo('invoice'); X.log(o, 'ורד', `חשבונית ${o.docs.invoiceNo} הופקה ברווחית`); X.save(); X.toast(`חשבונית ${o.docs.invoiceNo} הופקה ברווחית`); re(); });
      const rv = $('[data-m="rivhit"]', root); if (rv) rv.addEventListener('click', () => X.go('#/rivhit'));
    }
  };
})();
