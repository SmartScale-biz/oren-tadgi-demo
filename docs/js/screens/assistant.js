/* מסך "העוזר החכם": שאלות על הנתונים. בתסריט: התשובות מחושבות מנתוני הדמה, בלי מודל חי */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, $, $$ } = X;
  let log = null;

  const Q = [
    { id: 'price', q: 'כמה מכרנו לדלק שלט פח 40/30 בפעם האחרונה?', re: /דלק|40\/30|מחיר|מכרנו/ },
    { id: 'route', q: 'מה הסידור של נועם מחר?', re: /סידור|נועם|מחר|מסלול/ },
    { id: 'unsigned', q: 'אילו תעודות משלוח חסרות חתימה?', re: /חתימ|תעוד|חתומ/ },
    { id: 'status', q: 'מה המצב של מחסני השוק נשר?', re: /נשר|מצב|איפה/ },
    { id: 'week', q: 'כמה הזמנות נכנסו השבוע לעומת שבוע שעבר?', re: /שבוע|כמה הזמנות|נכנסו/ },
    { id: 'quote', q: 'תכין הצעת מחיר לדימרי לפי הפעם הקודמת', re: /דימרי|הצעת|הצעה/ }
  ];
  function answer(id) {
    if (id === 'price') {
      const h = D.priceHistory.filter(p => p.customer === 'delek' && p.item === 'pach' && p.size === '40/30').sort((a, b) => b.date.localeCompare(a.date));
      return `בפעם האחרונה מכרנו לדלק שלט פח 40/30 ב-<b>${money(h[0].price)}</b> ליחידה (${X.fdate(h[0].date)}, הצעה ${X.mono(h[0].doc)}).<table><tbody>${h.map(p => `<tr><td>${esc(X.MONTHS[X.toDate(p.date).getMonth()])}</td><td>${num(p.qty)} יח'</td><td><b>${money(p.price)}</b></td></tr>`).join('')}</tbody></table>המחיר עלה ב-${num(h[0].price - h[h.length - 1].price)} ₪ מאז ${esc(X.MONTHS[X.toDate(h[h.length - 1].date).getMonth()])}. <span class="tiny muted">(מחירים לדוגמה)</span><br><a class="btn btn-outline btn-sm" href="#/pricing?c=delek&i=pach&s=40%2F30">${icon('tag')}לכל ההיסטוריה</a>`;
    }
    if (id === 'route') {
      const di = D.workDay(1); const stops = X.orderRoute(X.routeOf('noam', di)); const missed = X.missedFor(stops, di);
      return `לנועם ${X.relDay(di)} יש ${num(stops.length)} תחנות, לפי הדרך:<ul>${stops.map(o => `<li>${esc(o.city)}: ${esc(o.branch)} (<bdi class="num">${esc(o.install.slot)}</bdi>)</li>`).join('')}</ul>${missed.length ? `<b style="color:var(--warn)">שימי לב:</b> ${missed.map(o => esc(o.city) + ' (' + esc(o.branch) + ')').join(', ')} מוכן ולא בסידור, וזה על הדרך.<br>` : ''}<a class="btn btn-outline btn-sm" href="#/installs/route?team=noam&day=1">${icon('route')}לסידור</a>`;
    }
    if (id === 'unsigned') {
      const u = D.orders.filter(o => o.stage === 8 && !o.docs.signed);
      return `יש <b>${num(u.length)}</b> תעודות משלוח החודש בלי חתימה. בלי חתימה אין חשבונית:<ul>${u.slice(0, 5).map(o => `<li>${X.mono(o.docs.deliveryNo)} · ${esc(o.branch)} · ${X.relDay(o.install.date)}</li>`).join('')}</ul>${u.length > 5 ? `ועוד ${num(u.length - 5)}. ` : ''}אני יכול לשלוח לכל הלקוחות קישור לחתימה.<br><a class="btn btn-outline btn-sm" href="#/accounting?f=sign">${icon('receipt')}לרשימה המלאה</a>`;
    }
    if (id === 'status') {
      const o = X.order(D.heroes.shukNesher);
      const last = o.log.slice(-3).reverse();
      return `${esc(o.branch)}, הזמנה ${X.mono(o.no)}: <b>${esc(o.title)}</b>.<br>שלב: <b>${esc(X.stage(o.stage).name)}</b>${o.docs.signed ? `. הותקן ${X.relDay(o.install.date)} על ידי ${esc(X.team(o.install.team).name)}, והתעודה נחתמה בשטח ב-${X.ftime(o.docs.signedAt)}` : ''}.<ul>${last.map(l => `<li>${esc(l.text)} · ${esc(l.who)}</li>`).join('')}</ul><a class="btn btn-outline btn-sm" href="#/orders/${o.no}">${icon('clipboard')}לכרטיס ההזמנה</a>`;
    }
    if (id === 'week') {
      const start = X.toDate(D.workDay(-4)); const prevStart = X.toDate(D.workDay(-9));
      const tw = D.orders.filter(o => new Date(o.createdAt) >= start).length;
      const pw = D.orders.filter(o => new Date(o.createdAt) >= prevStart && new Date(o.createdAt) < start).length;
      const ch = {}; D.orders.filter(o => new Date(o.createdAt) >= start).forEach(o => { ch[o.channel] = (ch[o.channel] || 0) + 1; });
      return `השבוע נכנסו <b>${num(tw)}</b> הזמנות, לעומת ${num(pw)} בשבוע שעבר (${tw >= pw ? 'עלייה' : 'ירידה'} של ${num(Math.abs(tw - pw))}).<table><tbody>${Object.keys(ch).map(k => `<tr><td>${esc(k)}</td><td><b>${num(ch[k])}</b></td></tr>`).join('')}</tbody></table>רוב העבודות נסגרות ביום אחד, ולכן הכי חשוב שהן לא ייתקעו בין גרפיקה לאישור הלקוח.`;
    }
    if (id === 'quote') {
      const pts = {}; D.priceHistory.filter(p => p.customer === 'dimri').forEach(p => { const k = p.item + p.size; if (!pts[k]) pts[k] = p; });
      const items = Object.values(pts).slice(0, 3); const net = items.reduce((s, p) => s + p.price * Math.max(1, Math.round(p.qty / 2)), 0);
      return `הכנתי טיוטה לדימרי לפי המחירים האחרונים שלהם:<table><tbody>${items.map(p => `<tr><td>${esc(D.items.find(i => i.id === p.item).name)} <bdi class="num">${esc(p.size)}</bdi></td><td>x${Math.max(1, Math.round(p.qty / 2))}</td><td><b>${money(p.price)}</b></td></tr>`).join('')}</tbody></table>סה"כ לפני מע"מ ${money(net)}. שולחים לאורן לאישור לפני שזה יוצא ללקוח? <span class="tiny muted">(מחירים לדוגמה)</span><br><a class="btn btn-outline btn-sm" href="#/pricing?c=dimri">${icon('tag')}למחירים של דימרי</a>`;
    }
    return 'בהדגמה אני עונה על השאלות המוכנות למטה. במערכת האמיתית אני מחובר לכל ההזמנות, המחירים, הסידורים והתעודות, ועונה על כל שאלה בעברית רגילה.';
  }
  const bot = h => `<div class="msg bot"><div class="bot-name">${icon('sparkles')}העוזר של איקס מדיה</div>${h}</div>`;
  const me = t => `<div class="msg me">${esc(t)}</div>`;

  window.SCREENS.assistant = {
    title: 'העוזר החכם',
    render() {
      if (!log) log = [bot('שלום סמדר. אני מחובר לכל ההזמנות, המחירים, הסידורים והתעודות. אפשר לשאול אותי כמו שכותבים לאורן בווטסאפ, או לבחור שאלה למטה.')];
      return `<div class="page-head" style="margin-block-end:.75rem"><div><div class="eyebrow">כלים</div><h1>העוזר החכם</h1><p class="sub">במקום לשאול את אורן בווטסאפ "כמה מכרנו לו בפעם הקודמת". בהדגמה התשובות מחושבות מנתוני הדמה.</p></div></div>
        <section class="card chat" aria-label="שיחה עם העוזר"><div class="chat-log" id="chatLog" aria-live="polite">${log.join('')}</div>
          <div class="chat-suggest" role="group" aria-label="שאלות מוכנות">${Q.map(x => `<button class="chip" type="button" data-q="${x.id}">${esc(x.q)}</button>`).join('')}</div>
          <form class="chat-input" id="chatForm"><input class="input" id="chatIn" placeholder="כתבו שאלה..." aria-label="שאלה לעוזר" autocomplete="off"><button class="btn btn-primary" type="submit" aria-label="שליחה">${icon('send')}</button></form></section>`;
    },
    mount(root, r) {
      const box = $('#chatLog', root);
      const scroll = () => { box.scrollTop = box.scrollHeight; };
      scroll();
      let busy = false;
      async function ask(text, id) {
        if (busy) return; busy = true;
        log.push(me(text)); box.insertAdjacentHTML('beforeend', me(text)); scroll();
        box.insertAdjacentHTML('beforeend', `<div class="msg bot" id="typing"><span class="typing"><i></i><i></i><i></i></span></div>`); scroll();
        await X.sleep(800);
        const t = $('#typing', box); if (t) t.remove();
        const a = bot(answer(id)); log.push(a); box.insertAdjacentHTML('beforeend', a); scroll();
        busy = false; return true;
      }
      $$('[data-q]', root).forEach(b => b.addEventListener('click', () => { const x = Q.find(y => y.id === b.dataset.q); ask(x.q, x.id); }));
      $('#chatForm', root).addEventListener('submit', e => { e.preventDefault(); const inp = $('#chatIn', root); const t = inp.value.trim(); if (!t) return; inp.value = ''; const m = Q.find(x => x.re.test(t)); ask(t, m ? m.id : null); });
      const sc = r.q.get('scenario');
      if (sc) { const x = Q.find(y => y.id === sc); log = [log[0]]; box.innerHTML = log.join(''); if (x) ask(x.q, x.id).then(() => { window.__demo.scenarioDone = true; }); }
    }
  };
})();
