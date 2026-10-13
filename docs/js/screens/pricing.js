/* מסך "מחירים והיסטוריה": המחיר האחרון ללקוח, בלי לחפש בחשבוניות אחורה */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, $, $$ } = X;

  window.SCREENS.pricing = {
    title: 'מחירים והיסטוריה',
    render(r) {
      const cid = r.q.get('c') || 'delek'; const c = X.cust(cid) || X.cust('delek');
      const itemIds = Array.from(new Set(D.priceHistory.map(p => p.item)));
      const ownItems = itemIds.filter(i => D.priceHistory.some(p => p.customer === c.id && p.item === i));
      const iid = r.q.get('i') && itemIds.indexOf(r.q.get('i')) >= 0 ? r.q.get('i') : (ownItems.indexOf('pach') >= 0 ? 'pach' : (ownItems[0] || 'pach'));
      const sizes = Array.from(new Set(D.priceHistory.filter(p => p.item === iid).map(p => p.size)));
      const size = r.q.get('s') && sizes.indexOf(r.q.get('s')) >= 0 ? r.q.get('s') : (sizes.indexOf('40/30') >= 0 && iid === 'pach' ? '40/30' : sizes[0]);
      const it = D.items.find(x => x.id === iid);
      const mine = D.priceHistory.filter(p => p.customer === c.id && p.item === iid && p.size === size).sort((a, b) => b.date.localeCompare(a.date));
      const others = {}; D.priceHistory.filter(p => p.item === iid && p.size === size).forEach(p => { if (!others[p.customer] || others[p.customer].date < p.date) others[p.customer] = p; });
      const rows = Object.values(others).sort((a, b) => a.price - b.price);
      const max = Math.max.apply(null, rows.map(p => p.price).concat([1]));
      const last = mine[0];
      const myOrders = D.orders.filter(o => o.customer === c.id);
      return `<div class="page-head"><div><div class="eyebrow">תמחור</div><h1>מחירים והיסטוריה</h1><p class="sub">"כדי לתת לו את אותו מחיר כמו בפעם שעברה, היא צריכה ללכת לחשבוניות אחורה עד פברואר." כאן זה שורה אחת.</p></div></div>
        <div class="card card-pad"><div class="form-grid two" style="grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))">
          <div class="field"><label for="pc">לקוח</label><select class="select" id="pc">${D.customers.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="pi">פריט</label><select class="select" id="pi">${itemIds.map(i => `<option value="${i}" ${i === iid ? 'selected' : ''}>${esc(D.items.find(x => x.id === i).name)}${ownItems.indexOf(i) >= 0 ? ' ●' : ''}</option>`).join('')}</select></div>
          <div class="field"><label for="ps">מידה (ס"מ)</label><select class="select" id="ps">${sizes.map(s => `<option value="${esc(s)}" ${s === size ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        </div><p class="tiny muted" style="margin-block-start:.5rem">● פריטים שהלקוח הזה כבר הזמין. המחירים בהדגמה לדוגמה בלבד.</p></div>
        <div class="price-hero section">
          <section class="card card-pad" aria-labelledby="pLast">
            <div class="eyebrow">המחיר האחרון ל${esc(c.name)}</div>
            <h2 id="pLast" style="margin-block-end:.6rem">${esc(it.name)} <bdi class="num">${esc(size)}</bdi></h2>
            ${last ? `<div class="row-wrap" style="align-items:flex-end;gap:1rem"><span class="big-price">${money(last.price)}</span><span class="muted">ליחידה · ${X.fdate(last.date)} ${esc(X.MONTHS[X.toDate(last.date).getMonth()])} · הצעה ${X.mono(last.doc)}</span></div>
              <div class="p-timeline section">${mine.map((p, i) => `<div class="p-point${i === 0 ? ' last' : ''}"><span class="pp-date">${esc(X.MONTHS[X.toDate(p.date).getMonth()])}</span><span class="small muted">${num(p.qty)} יח' · מסמך ${X.mono(p.doc)}</span><span class="pp-price">${money(p.price)}</span></div>`).join('')}</div>
              <div class="row-wrap section"><button class="btn btn-primary" type="button" id="useP">${icon('quote')}להצעת מחיר במחיר הזה</button>${mine.length > 1 && mine[0].price !== mine[mine.length - 1].price ? `<span class="tag warn">${icon('alert')}המחיר עלה ב-${num(mine[0].price - mine[mine.length - 1].price)} ₪ מאז ${esc(X.MONTHS[X.toDate(mine[mine.length - 1].date).getMonth()])}</span>` : ''}</div>`
              : `<div class="note">${icon('info')}<span>ל${esc(c.name)} אין עדיין היסטוריה על הפריט הזה. מחיר מחירון לפי דירוג ${esc(c.tier)}: <b>${money(D.listPrice(iid, size, c.tier))}</b></span></div>`}
          </section>
          <section class="card card-pad" aria-labelledby="pOth">
            <h2 id="pOth" style="margin-block-end:.3rem">אותו פריט, לקוחות אחרים</h2><p class="small muted" style="margin-block-end:.8rem">"לקוח א' אצלי לא מקבל מחיר כמו ב'." המחיר האחרון של כל לקוח, מהזול ליקר.</p>
            <div class="p-bars">${rows.slice(0, 9).map(p => `<div class="p-bar${p.customer === c.id ? ' me' : ''}"><span class="ellipsis${p.customer === c.id ? ' strong' : ''}" data-clip-ok>${esc(X.cust(p.customer).name)}</span><span class="bar"><i style="inline-size:${Math.round(p.price / max * 100)}%"></i></span><span class="strong" style="text-align:end">${money(p.price)}</span></div>`).join('') || '<div class="empty small">אין עוד נתונים</div>'}</div>
          </section>
        </div>
        <section class="card section" aria-labelledby="pCust"><div class="card-head"><h2 id="pCust">${icon('user')}${esc(c.name)}</h2><span class="tag ${c.tier === 'A' ? 'brand' : 'outline'}">דירוג ${esc(c.tier)}</span></div>
          <div class="card-body"><div class="kv" style="grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))"><div><dt>סוג</dt><dd>${esc(c.kind)}</dd></div><div><dt>מחזור שנתי (לדוגמה)</dt><dd>${money(c.volume)}</dd></div><div><dt>הנחה קבועה</dt><dd>${num(c.discount)}%</dd></div><div><dt>תנאי תשלום</dt><dd>${esc(c.terms)}</dd></div><div><dt>הזמנות פתוחות</dt><dd>${num(myOrders.filter(o => o.stage < 8).length)}</dd></div><div><dt>סניפים ואתרים</dt><dd>${num(c.branches.length)}</dd></div></div></div></section>`;
    },
    mount(root, r) {
      const set = (k, v) => { const q = new URLSearchParams(r.q); q.set(k, v); if (k === 'c') { q.delete('i'); q.delete('s'); } if (k === 'i') q.delete('s'); X.setQuery(Object.assign({}, r, { q }), 'keep', '1'); };
      $('#pc', root).addEventListener('change', e => set('c', e.target.value));
      $('#pi', root).addEventListener('change', e => set('i', e.target.value));
      $('#ps', root).addEventListener('change', e => set('s', e.target.value));
      const u = $('#useP', root); if (u) u.addEventListener('click', () => { X.toast('המחיר האחרון הוזן להצעת המחיר'); X.go('#/orders?new=1&step=2'); });
    }
  };
})();
