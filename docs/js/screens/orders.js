/* מסך "הזמנות": רשימה, קנבן, לפי מכונה + אשף הזמנה חדשה */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, mono, $, $$ } = X;

  /* ---------- כלים משותפים להזמנות ---------- */
  function lastPrice(cid, itemId, size) {
    const h = D.priceHistory.filter(p => p.customer === cid && p.item === itemId && (!size || p.size === size));
    if (h.length) return { price: h[0].price, date: h[0].date, doc: h[0].doc, from: 'history' };
    const c = X.cust(cid); return { price: D.listPrice(itemId, size, c.tier), date: null, from: 'list' };
  }
  function createOrder(o) {
    const c = X.cust(o.customer); const br = c.branches.find(b => b.city === o.city) || c.branches[0];
    const no = X.nextNo('order'); const t = X.now().toISOString();
    const lines = o.lines.map(l => { const it = D.items.find(i => i.id === l.item); return { item: l.item, name: it.name, size: l.size || '', qty: Number(l.qty) || 1, unit: it.unit, mat: it.mat, after: it.after, price: Number(l.price) || D.listPrice(l.item, l.size, c.tier) }; });
    const first = D.items.find(i => i.id === lines[0].item);
    const ord = {
      no, customer: c.id, branch: br.name, city: br.city, region: br.region, title: o.title || lines.map(l => `${l.name}${l.size ? ' ' + l.size : ''} x${l.qty}`).join(' + '),
      lines, channel: o.channel || 'ווטסאפ', enteredBy: o.enteredBy || 'סמדר', stage: o.stage || 1, urgent: !!o.urgent, machine: o.machine !== undefined ? o.machine : first.machine,
      note: o.note || '', createdAt: t, due: o.due || D.workDay(3), needsGraphics: o.needsGraphics != null ? o.needsGraphics : true,
      graphics: { versions: [], sentAt: null, approvedAt: null }, production: { assignee: null, checklist: { material: false, printed: false, cut: false, packed: false } },
      install: null, docs: { quoteNo: null, deliveryNo: null, invoiceNo: null, signed: false, signedAt: null, signer: null, po: null }, log: []
    };
    ord.total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    X.log(ord, ord.enteredBy, `ההזמנה נפתחה (${ord.channel})`);
    D.orders.unshift(ord);
    const target = ord.stage; ord.stage = 1;
    if (target > 1) X.setStage(ord, target, ord.enteredBy); else X.save();
    return ord;
  }
  X.lastPrice = lastPrice; X.createOrder = createOrder;

  function kbCard(o) {
    const s = X.statusOf(o); const c = X.cust(o.customer);
    return `<a class="kb-card ${s}" href="#/orders/${o.no}" draggable="true" data-no="${o.no}">
      <span class="k-top">${X.mono(o.no)}<span>${o.urgent && o.stage < 7 ? '<span class="tag urgent">' + icon('flame') + 'דחוף</span>' : ''}</span></span>
      <span class="k-cust">${esc(o.branch)}</span>
      <span class="k-desc">${esc(X.shortTitle(o.title, 64))}</span>
      <span class="k-foot">${X.machineTag(o.machine)}${o.install && o.install.team ? X.teamTag(o.install.team) : ''}<span class="tiny muted">יעד ${X.relDay(o.due)}</span><button class="k-move" type="button" data-move="${o.no}" aria-label="העבר את ${esc(o.branch)} לשלב אחר">${icon('move')}</button></span>
    </a>`;
  }
  function moveSheet(no, after) {
    const o = X.order(no);
    X.sheet({ title: `העברת ${esc(o.branch)} לשלב`, body: `<p class="muted small" style="margin-block-end:.75rem">${X.mono(o.no)} · ${esc(X.shortTitle(o.title, 60))}</p><div class="list card">${D.stages.map(s => `<button class="list-item" type="button" data-stage="${s.id}" ${s.id === o.stage ? 'aria-current="step"' : ''}><span class="li-icon">${icon(s.icon)}</span><span class="li-main"><span class="li-title">${s.name}</span></span>${s.id === o.stage ? '<span class="tag dark">השלב הנוכחי</span>' : ''}</button>`).join('')}</div>`,
      onOpen: el => $$('[data-stage]', el).forEach(b => b.addEventListener('click', () => { const s = Number(b.dataset.stage); X.closeSheet(); if (s !== o.stage) { X.setStage(o, s); X.toast(`${esc(o.branch)} עבר ל"${X.stage(s).name}"`); } if (after) after(); })) });
  }
  X.moveSheet = moveSheet;

  /* ---------- אשף הזמנה חדשה ---------- */
  const SAMPLE = 'היי סמדי, צריכים לתחנה בקריית אתא 2 שלטי פח 40/30 "אסור לעשן" + מדבקת ויטרינה 60/40 למבצע. דחוף לשבוע הבא. תודה, יוסי מדלק';
  function wizard(opts) {
    const st = { step: 1, channel: 'ווטסאפ', text: SAMPLE, parsed: false, customer: 'delek', city: 'קריית אתא', urgent: true, due: D.workDay(5), lines: [{ item: 'pach', size: '40/30', qty: 2 }, { item: 'vitrine', size: '60/40', qty: 1 }] };
    let el;
    const priceLines = () => st.lines.map(l => { const lp = lastPrice(st.customer, l.item, l.size); if (l.price == null) l.price = lp.price; return Object.assign({ lp }, l); });
    function body() {
      const steps = `<div class="f-steps" style="padding:0 0 1rem">${[1, 2, 3].map(i => `<span class="${i <= st.step ? 'on' : ''}"></span>`).join('')}</div>`;
      if (st.step === 1) {
        const c = X.cust(st.customer);
        return `${steps}<div class="stack">
          <div class="field"><span class="lbl">מאיפה זה הגיע?</span><div class="chips" role="group" aria-label="ערוץ">${['ווטסאפ', 'מייל', 'טלפון'].map(ch => `<button class="chip" type="button" data-ch="${ch}" aria-pressed="${st.channel === ch}">${icon(ch === 'ווטסאפ' ? 'wa' : ch === 'מייל' ? 'mail' : 'call')}${ch}</button>`).join('')}</div></div>
          <div class="field"><label for="wzText">ההודעה כמו שהיא (הדבקה מהווטסאפ או מהמייל)</label><textarea class="textarea" id="wzText">${esc(st.text)}</textarea></div>
          <button class="btn btn-dark" type="button" id="wzParse">${icon('sparkles')}${st.parsed ? 'פענח שוב' : 'פענח את ההודעה'}</button>
          <div id="wzParsed">${st.parsed ? parsedForm(c) : '<p class="muted small">המערכת קוראת את ההודעה ומזהה לקוח, סניף, פריטים, מידות ודחיפות. אחר כך רק מאשרים.</p>'}</div>
        </div>`;
      }
      if (st.step === 2) {
        const pl = priceLines(); const net = pl.reduce((s, l) => s + l.price * l.qty, 0);
        return `${steps}<div class="stack">
          <div class="note">${icon('tag')}<span>המחיר שמולא הוא <b>המחיר האחרון שהלקוח הזה קיבל</b> על אותו פריט ואותה מידה. לא צריך לחפש בחשבוניות אחורה.</span></div>
          ${pl.map((l, i) => `<div class="line-it"><span class="li-name">${esc(D.items.find(x => x.id === l.item).name)} ${l.size ? `<bdi class="num">${esc(l.size)}</bdi>` : ''}</span><span class="strong">${money(l.price * l.qty)}</span>
            <span class="li-meta">${l.lp.from === 'history' ? `<span class="tag ok">${icon('check')}אחרון: ${money(l.lp.price)} ב-${X.fdate(l.lp.date)}, הצעה ${X.mono(l.lp.doc)}</span>` : '<span class="tag outline">מחירון</span>'}</span>
            <span class="li-meta" style="gap:.5rem"><label class="field" style="flex:1 1 6rem"><span class="lbl">כמות</span><input class="input" type="number" min="1" value="${l.qty}" data-q="${i}" inputmode="numeric"></label><label class="field" style="flex:1 1 7rem"><span class="lbl">מחיר ליחידה</span><input class="input" type="number" min="0" value="${l.price}" data-p="${i}" inputmode="numeric"></label></span></div>`).join('')}
          <div class="between card card-pad"><span class="muted">לפני מע"מ <b style="color:var(--ink)">${money(net)}</b></span><span class="strong">כולל מע"מ ${money(net * 1.18)}</span></div>
          <p class="tiny muted">המחירים בהדגמה לדוגמה בלבד.</p>
        </div>`;
      }
      const c = X.cust(st.customer); const pl = priceLines(); const net = pl.reduce((s, l) => s + l.price * l.qty, 0); const qn = String(D.counters.quote + 1).padStart(6, '0');
      return `${steps}<div class="stack">
        <div class="kv card card-pad"><div><dt>לקוח</dt><dd>${esc((c.branches.find(b => b.city === st.city) || c.branches[0]).name)}</dd></div><div><dt>הצעת מחיר</dt><dd>${X.mono(qn)} · נוצרת ברווחית</dd></div><div><dt>סה"כ כולל מע"מ</dt><dd>${money(net * 1.18)}</dd></div><div><dt>יעד</dt><dd>${X.fday(st.due)}${st.urgent ? ' · <span class="tag urgent">דחוף</span>' : ''}</dd></div></div>
        <div class="field"><span class="lbl">ההודעה שתצא ללקוח בווטסאפ</span><div class="bubble-preview"><div class="wa-b out">שלום ${esc(c.contact.name.split(' ')[0])}, מצורפת הצעת מחיר ${esc(qn)} מאיקס מדיה:<br>${pl.map(l => `• ${esc(D.items.find(x => x.id === l.item).name)} ${esc(l.size)} x${l.qty}`).join('<br>')}<br>סה"כ ${esc(X.fmt(Math.round(net * 1.18)))} ₪ כולל מע"מ.<br><b>לאישור השיבו 1</b>, לשינוי השיבו 2.<div class="t">${X.ftime(X.now())} ${icon('checks')}</div></div></div></div>
        <p class="tiny muted">כשהלקוח עונה 1, ההזמנה עוברת לבד ל"אושרה" ונכנסת לתור של אינה.</p>
      </div>`;
    }
    function parsedForm(c) {
      return `<div class="stack" style="margin-block-start:.5rem">
        <div class="note ok">${icon('check')}<span>זוהה: <b>${esc(c.name)}</b>, סניף <b>${esc(st.city)}</b>, ${num(st.lines.length)} פריטים${st.urgent ? ', <b>דחוף</b>' : ''}. הלקוח מוכר, ${num(D.orders.filter(o => o.customer === c.id).length)} הזמנות קודמות.</span></div>
        <div class="form-grid two">
          <div class="field"><label for="wzCust">לקוח</label><select class="select" id="wzCust">${D.customers.map(x => `<option value="${x.id}" ${x.id === st.customer ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="wzBranch">סניף / אתר</label><select class="select" id="wzBranch">${c.branches.map(b => `<option value="${esc(b.city)}" ${b.city === st.city ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="wzDue">יעד</label><input class="input" type="date" id="wzDue" value="${st.due}"></div>
          <label class="check" style="align-self:end"><input type="checkbox" id="wzUrgent" ${st.urgent ? 'checked' : ''}>דחוף (אדום)</label>
        </div>
        <div class="field"><span class="lbl">פריטים</span>${st.lines.map((l, i) => `<div class="form-grid two" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr);gap:.4rem;margin-block-end:.4rem"><select class="select" data-li="${i}" aria-label="פריט ${i + 1}">${D.items.map(it => `<option value="${it.id}" ${it.id === l.item ? 'selected' : ''}>${esc(it.name)}</option>`).join('')}</select><input class="input" data-ls="${i}" value="${esc(l.size)}" placeholder="מידה" aria-label="מידה"><input class="input" type="number" min="1" data-lq="${i}" value="${l.qty}" aria-label="כמות" inputmode="numeric"></div>`).join('')}
          <button class="btn btn-ghost" type="button" id="wzAdd" style="align-self:flex-start">${icon('plus')}הוסף שורה</button></div>
      </div>`;
    }
    function foot() {
      if (st.step === 1) return `<button class="btn btn-ghost" type="button" data-wz="close">ביטול</button><button class="btn btn-primary" type="button" data-wz="next" ${st.parsed ? '' : 'disabled'}>להצעת המחיר${icon('arrowL')}</button>`;
      if (st.step === 2) return `<button class="btn btn-ghost" type="button" data-wz="back">${icon('arrowR')}חזרה</button><button class="btn btn-primary" type="button" data-wz="next">לשליחה ללקוח${icon('arrowL')}</button>`;
      return `<button class="btn btn-ghost" type="button" data-wz="back">${icon('arrowR')}חזרה</button><button class="btn btn-wa" type="button" data-wz="send">${icon('send')}צור הזמנה ושלח ללקוח</button>`;
    }
    function draw() {
      $('.sheet-body', el).innerHTML = body(); $('.sheet-foot', el).innerHTML = foot(); $('#sheetTitle').textContent = ['', 'הזמנה חדשה: מה הלקוח ביקש', 'הזמנה חדשה: הצעת מחיר', 'הזמנה חדשה: שליחה ללקוח'][st.step];
      wire();
    }
    function readLines() {
      $$('[data-li]', el).forEach(s => { st.lines[+s.dataset.li].item = s.value; st.lines[+s.dataset.li].price = null; });
      $$('[data-ls]', el).forEach(s => { st.lines[+s.dataset.ls].size = s.value.trim(); st.lines[+s.dataset.ls].price = null; });
      $$('[data-lq]', el).forEach(s => { st.lines[+s.dataset.lq].qty = Math.max(1, Number(s.value) || 1); });
    }
    async function parse() {
      const b = $('#wzParse', el); b.disabled = true; b.innerHTML = `<span class="spinner"></span>קורא את ההודעה...`;
      await X.sleep(1300);
      const txt = st.text;
      const found = D.customers.find(c => txt.indexOf(c.name) >= 0) || X.cust('delek');
      st.customer = found.id;
      const city = Object.keys(D.cities).find(ct => txt.indexOf(ct) >= 0 && found.branches.some(br => br.city === ct));
      st.city = city || found.branches[0].city;
      st.urgent = /דחוף/.test(txt);
      st.parsed = true; draw();
    }
    function wire() {
      $$('[data-ch]', el).forEach(b => b.addEventListener('click', () => { st.channel = b.dataset.ch; $$('[data-ch]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
      const ta = $('#wzText', el); if (ta) ta.addEventListener('input', () => { st.text = ta.value; });
      const pb = $('#wzParse', el); if (pb) pb.addEventListener('click', parse);
      const cs = $('#wzCust', el); if (cs) cs.addEventListener('change', () => { readLines(); st.customer = cs.value; st.city = X.cust(cs.value).branches[0].city; st.lines.forEach(l => { l.price = null; }); draw(); });
      const bs = $('#wzBranch', el); if (bs) bs.addEventListener('change', () => { st.city = bs.value; });
      const du = $('#wzDue', el); if (du) du.addEventListener('change', () => { if (du.value) st.due = du.value; });
      const ur = $('#wzUrgent', el); if (ur) ur.addEventListener('change', () => { st.urgent = ur.checked; });
      const ad = $('#wzAdd', el); if (ad) ad.addEventListener('click', () => { readLines(); st.lines.push({ item: 'safety', size: '50/70', qty: 1 }); draw(); });
      $$('[data-q]', el).forEach(i => i.addEventListener('input', () => { st.lines[+i.dataset.q].qty = Math.max(1, Number(i.value) || 1); }));
      $$('[data-p]', el).forEach(i => i.addEventListener('input', () => { st.lines[+i.dataset.p].price = Math.max(0, Number(i.value) || 0); }));
      $$('[data-wz]', el).forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.wz;
        if (a === 'close') { X.closeSheet(); return; }
        if (st.step === 1 && st.parsed) readLines();
        if (a === 'next') { st.step = Math.min(3, st.step + 1); draw(); }
        if (a === 'back') { st.step = Math.max(1, st.step - 1); draw(); }
        if (a === 'send') {
          const pl = priceLines();
          const o = createOrder({ customer: st.customer, city: st.city, urgent: st.urgent, due: st.due, channel: st.channel, lines: pl.map(l => ({ item: l.item, size: l.size, qty: l.qty, price: l.price })), stage: 2, note: 'נפתח מהודעה: ' + X.shortTitle(st.text, 60) });
          X.feedPush({ type: 'quote', text: `הצעת מחיר ${o.docs.quoteNo} נשלחה ל${o.branch} בווטסאפ`, link: '#/orders/' + o.no });
          X.closeSheet(); X.toast(`הזמנה ${o.no} נפתחה והצעת המחיר נשלחה`); X.go('#/orders/' + o.no);
        }
      }));
    }
    const stripNew = () => { const h = location.hash; if (!/[?&]new=/.test(h)) return; const [p, qs] = h.split('?'); const q = new URLSearchParams(qs); ['new', 'run', 'step'].forEach(k => q.delete(k)); history.replaceState(null, '', p + (q.toString() ? '?' + q.toString() : '')); };
    el = X.sheet({ title: 'הזמנה חדשה', wide: true, body: '', foot: ' ', onClose: stripNew });
    if (opts && opts.run) { st.parsed = true; }
    if (opts && opts.step) st.step = Math.min(3, Math.max(1, Number(opts.step) || 1));
    if (st.step > 1) st.parsed = true;
    draw();
  }
  X.newOrderWizard = wizard;

  /* ---------- התצוגות ---------- */
  function filters(r) {
    const q = r.q; let list = D.orders.slice();
    const stg = q.get('stage');
    if (stg === 'done') list = list.filter(o => o.stage === 8); else if (stg) list = list.filter(o => o.stage === Number(stg)); else list = list.filter(o => o.stage < 8);
    if (q.get('urgent')) list = list.filter(o => o.urgent && o.stage < 8);
    if (q.get('m')) list = list.filter(o => o.machine === q.get('m'));
    if (q.get('c')) list = list.filter(o => o.customer === q.get('c'));
    const s = (q.get('q') || '').trim(); if (s) list = list.filter(o => [o.no, o.branch, o.title, o.city, o.enteredBy].join(' ').indexOf(s) >= 0);
    const sort = q.get('sort') || 'due';
    const key = { due: o => o.due + (o.urgent ? '0' : '1'), no: o => o.no, cust: o => o.branch, stage: o => String(o.stage) + o.due }[sort] || (o => o.due);
    list.sort((a, b) => (a.urgent && a.stage < 7 ? 0 : 1) - (b.urgent && b.stage < 7 ? 0 : 1) || String(key(a)).localeCompare(String(key(b)), 'he'));
    if (sort !== 'due') list.sort((a, b) => String(key(a)).localeCompare(String(key(b)), 'he'));
    return list;
  }
  function listView(r) {
    const list = filters(r); const q = r.q; const stg = q.get('stage') || ''; const lim = q.get('all') ? 500 : 40;
    const cnt = s => D.orders.filter(o => o.stage === s).length;
    const th = (k, label) => `<th scope="col"><button type="button" data-sort="${k}">${label}${(q.get('sort') || 'due') === k ? icon('chevDown') : ''}</button></th>`;
    return `<div class="stack">
      <div class="chips" role="group" aria-label="סינון לפי שלב">
        <button class="chip" type="button" data-stagef="" aria-pressed="${!stg}">כל הפתוחות <bdi class="num">${D.orders.filter(o => o.stage < 8).length}</bdi></button>
        ${D.stages.slice(0, 7).map(s => `<button class="chip" type="button" data-stagef="${s.id}" aria-pressed="${stg === String(s.id)}">${s.name} <bdi class="num">${cnt(s.id)}</bdi></button>`).join('')}
        <button class="chip" type="button" data-stagef="done" aria-pressed="${stg === 'done'}">הושלמו החודש <bdi class="num">${cnt(8)}</bdi></button>
      </div>
      <div class="row-wrap">
        <div class="search-box grow" style="min-inline-size:12rem">${icon('search')}<input class="input" type="search" id="oq" value="${esc(q.get('q') || '')}" placeholder="חיפוש: לקוח, עיר, מספר, עבודה" aria-label="חיפוש הזמנות"></div>
        <select class="select" id="om" style="inline-size:auto;min-inline-size:9rem" aria-label="סינון לפי מכונה"><option value="">כל המכונות</option>${D.machines.map(m => `<option value="${m.id}" ${q.get('m') === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
        <button class="chip" type="button" id="ou" aria-pressed="${!!q.get('urgent')}"><span class="dot" style="background:#FF3B30"></span>רק דחופות</button>
      </div>
      <div class="card tbl-wrap"><table class="tbl" aria-label="הזמנות">
        <thead><tr>${th('no', 'מס\'')}${th('cust', 'לקוח וסניף')}<th scope="col">עבודה</th><th scope="col">הכניס</th>${th('stage', 'שלב')}<th scope="col">סטטוס</th><th scope="col">מכונה</th>${th('due', 'יעד')}<th scope="col">צוות</th></tr></thead>
        <tbody>${list.length ? list.slice(0, lim).map(o => `<tr class="clickable" data-href="#/orders/${o.no}">
          <td class="td-hide-m" data-label="מס'">${X.mono(o.no)}</td>
          <td class="td-main" data-label="לקוח"><a class="tap" href="#/orders/${o.no}" style="color:inherit">${esc(o.branch)}</a><div class="tiny muted m-only">${X.mono(o.no)} · ${X.relDay(o.due)}</div></td>
          <td class="td-full" data-label="עבודה"><span class="small">${esc(X.shortTitle(o.title, 70))}</span></td>
          <td class="td-hide-m" data-label="הכניס">${esc(o.enteredBy)}</td>
          <td class="td-full" data-label="שלב">${X.stageTag(o)} <span class="m-only">${X.machineTag(o.machine)} ${o.install && o.install.team ? X.teamTag(o.install.team) : ''}</span></td>
          <td class="td-end" data-label="סטטוס">${X.stTag(o)}</td>
          <td class="td-hide-m" data-label="מכונה">${X.machineTag(o.machine)}</td>
          <td class="td-hide-m" data-label="יעד">${X.relDay(o.due)}</td>
          <td class="td-hide-m" data-label="צוות">${o.install && o.install.team ? X.teamTag(o.install.team) : '<span class="muted-2">-</span>'}</td></tr>`).join('') : `<tr><td class="td-full"><div class="empty">${icon('search')}אין הזמנות שמתאימות לסינון</div></td></tr>`}</tbody>
      </table></div>
      ${list.length > lim ? `<button class="btn btn-outline btn-block" type="button" id="oAll">${icon('chevDown')}הצגת כל ${num(list.length)} ההזמנות</button>` : ''}
    </div>`;
  }
  function kanbanView() {
    return `<div class="note brand" style="margin-block-end:.75rem">${icon('move')}<span><span class="d-only">גוררים כרטיס לעמודה הבאה</span><span class="m-only">לוחצים על החצים בכרטיס</span> כדי להעביר שלב. השינוי נרשם ביומן ההזמנה ומופיע לכולם.</span></div>
      <div class="kb" id="kb">${D.stages.map(s => { const all = D.orders.filter(o => o.stage === s.id).sort((a, b) => (b.urgent - a.urgent) || a.due.localeCompare(b.due)); const show = s.id === 8 ? all.slice(0, 5) : all.slice(0, 12);
        return `<section class="kb-col" data-col="${s.id}" aria-label="${s.name}"><div class="kb-head">${icon(s.icon)}${s.name}<span class="n">${all.length}</span></div>${show.map(kbCard).join('')}${all.length > show.length ? `<a class="kb-more" href="#/orders?view=list&stage=${s.id === 8 ? 'done' : s.id}">עוד ${all.length - show.length}</a>` : ''}</section>`; }).join('')}</div>`;
  }
  function machinesView() {
    return `<div class="machines">${D.machines.map(m => {
      const q = D.orders.filter(o => o.machine === m.id && o.stage >= 4 && o.stage <= 6).sort((a, b) => (b.urgent - a.urgent) || b.stage - a.stage);
      const prod = q.filter(o => o.stage === 6).length; const pct = Math.min(100, Math.round(prod / m.cap * 100));
      return `<section class="card"><div class="card-head"><div class="row"><span class="m-ic">${esc(m.name.slice(0, 4))}</span><div><h2>${esc(m.name)}</h2><div class="tiny muted">${esc(m.desc)} · ${esc(m.operator)}</div></div></div></div>
        <div class="card-body"><div class="m-load"><span>עומס היום</span><span class="bar ${pct > 85 ? 'warn' : 'ok'}"><i style="inline-size:${pct}%"></i></span><b><bdi class="num">${X.fmt(prod)}/${X.fmt(m.cap)}</bdi></b></div></div>
        <div class="list">${q.slice(0, 5).map(o => `<a class="list-item" href="#/orders/${o.no}"><span class="li-main"><span class="li-title">${esc(o.branch)}</span><span class="li-sub">${esc(X.shortTitle(o.title, 50))}</span></span><span class="li-end">${X.stTag(o)}</span></a>`).join('') || `<div class="empty small">אין עבודות בתור</div>`}</div></section>`;
    }).join('')}
    <section class="card"><div class="card-head"><div class="row"><span class="m-ic" style="background:var(--brand)">${icon('truck')}</span><div><h2>התקנה בלבד</h2><div class="tiny muted">החלפות הדבקה ושירות בשטח</div></div></div></div>
      <div class="list">${D.orders.filter(o => !o.machine && o.stage < 8).slice(0, 5).map(o => `<a class="list-item" href="#/orders/${o.no}"><span class="li-main"><span class="li-title">${esc(o.branch)}</span><span class="li-sub">${esc(X.shortTitle(o.title, 50))}</span></span><span class="li-end">${X.stageTag(o)}</span></a>`).join('')}</div></section></div>`;
  }
  function defaultView() { return window.matchMedia('(min-width: 65rem)').matches ? 'kanban' : 'list'; }

  window.SCREENS.orders = {
    title: 'הזמנות',
    render(r) {
      const v = r.q.get('view') || defaultView();
      return `<div class="page-head"><div><div class="eyebrow">המודול הראשון: הבסיס</div><h1>הזמנות</h1><p class="sub">הגיליון של אינה, הדרייב של המכונות והקבוצות, במקום אחד. כל הזמנה יודעת באיזה שלב היא.</p></div>
        <div class="actions"><button class="btn btn-primary" type="button" id="newOrder">${icon('plus')}הזמנה חדשה</button></div></div>
        <div class="between" style="margin-block-end:1rem"><div class="seg" role="tablist" aria-label="תצוגה">${[['list', 'רשימה', 'list'], ['kanban', 'לוח שלבים', 'kanban'], ['machines', 'לפי מכונה', 'factory']].map(([k, l, ic]) => `<button type="button" role="tab" data-view="${k}" aria-selected="${v === k}" class="${v === k ? 'on' : ''}">${icon(ic)}${l}</button>`).join('')}</div>
        <div class="legend" aria-label="מקרא">${D.legend.map(l => `<span><i class="swatch sw-${l.id}"></i>${l.name}</span>`).join('')}</div></div>
        <div class="view-orders">${v === 'kanban' ? kanbanView() : v === 'machines' ? machinesView() : listView(r)}</div>`;
    },
    mount(root, r) {
      $('#newOrder', root).addEventListener('click', () => wizard());
      $$('[data-view]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'view', b.dataset.view)));
      $$('[data-stagef]', root).forEach(b => b.addEventListener('click', () => { X.setQuery(Object.assign({}, r, { q: (() => { const q = new URLSearchParams(r.q); q.set('view', 'list'); return q; })() }), 'stage', b.dataset.stagef); }));
      $$('[data-sort]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'sort', b.dataset.sort)));
      const oq = $('#oq', root); if (oq) { let t; oq.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { X.setQuery(r, 'q', oq.value.trim()); const n = $('#oq'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); }); }
      const om = $('#om', root); if (om) om.addEventListener('change', () => X.setQuery(r, 'm', om.value));
      const oa = $('#oAll', root); if (oa) oa.addEventListener('click', () => X.setQuery(r, 'all', '1'));
      const ou = $('#ou', root); if (ou) ou.addEventListener('click', () => X.setQuery(r, 'urgent', r.q.get('urgent') ? '' : '1'));
      $$('tr[data-href]', root).forEach(tr => tr.addEventListener('click', e => { if (e.target.closest('a,button')) return; X.go(tr.dataset.href); }));
      $$('[data-move]', root).forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); moveSheet(b.dataset.move, () => X.render()); }));
      // גרירה בקנבן
      const kb = $('#kb', root);
      if (kb) {
        let dragNo = null;
        $$('.kb-card', kb).forEach(c => {
          c.addEventListener('dragstart', e => { dragNo = c.dataset.no; c.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', dragNo); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
          c.addEventListener('dragend', () => { c.classList.remove('dragging'); $$('.kb-col', kb).forEach(col => col.classList.remove('drop')); });
        });
        $$('.kb-col', kb).forEach(col => {
          col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drop'); });
          col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop'); });
          col.addEventListener('drop', e => {
            e.preventDefault(); col.classList.remove('drop');
            let no = dragNo; try { no = e.dataTransfer.getData('text/plain') || dragNo; } catch (x) { }
            const o = X.order(no); const s = Number(col.dataset.col);
            if (o && s !== o.stage) { X.setStage(o, s); X.toast(`${esc(o.branch)} עבר ל"${X.stage(s).name}"`); X.render(); }
          });
        });
      }
      if (r.q.get('new')) wizard({ run: r.q.get('run'), step: r.q.get('step') });
    }
  };
})();
