/* מסך "חיבור לרווחית" (איור): רווחית נשארת, המערכת מסביב */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;

  function syncRows() {
    const rows = [];
    D.orders.forEach(o => o.log.forEach(l => { if (/רווחית|נחתמה|חשבונית/.test(l.text)) rows.push({ at: l.at, text: `${l.text} · ${o.branch}`, no: o.no }); }));
    const n = X.now().toISOString(); return rows.filter(x => String(x.at) <= n).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 10);
  }
  window.SCREENS.rivhit = {
    title: 'חיבור לרווחית',
    render() {
      const rows = syncRows();
      const arrow = (dir, t) => `<div class="flow-arrow">${icon(dir === 'in' ? 'arrowR' : 'arrowL')}<span>${t}</span></div>`;
      return `<div class="page-head"><div><div class="eyebrow">איור · לא מזיזים את הגבינה</div><h1>רווחית נשארת. המערכת עובדת סביבה</h1><p class="sub">רווחית היא מערכת הנהלת החשבונות שלכם, בהתחלה ובסוף. היא נשארת. כל מה שקורה באמצע, הגיליון, הקבוצות וההתקנות, עובר למערכת, והמסמכים נרשמים ברווחית לבד.</p></div></div>
        <div class="flow">
          <div class="stack">
            <div class="flow-node"><h3>${icon('wa')}ווטסאפ, מייל וטלפון</h3><span class="small muted">כל הזמנה שנכנסת נפתחת אוטומטית</span></div>
            <div class="flow-node"><h3>${icon('phone')}אפליקציית המתקין</h3><span class="small muted">תמונות ותעודה חתומה מהשטח</span></div>
            <div class="flow-node"><h3>${icon('palette')}הסטודיו</h3><span class="small muted">שלטים סטנדרטיים ישר לייצור</span></div>
          </div>
          <div class="flow-node core"><img src="assets/logo-light.png" alt="איקס מדיה" width="560" height="152"><b>המערכת של איקס מדיה</b><span class="small" style="color:#BDBDBD">הזמנות · גרפיקה · ייצור · התקנות · מסמכים</span></div>
          <div class="stack">
            <div class="flow-node rivhit"><h3>${icon('db')}רווחית</h3><span class="small muted">הנהלת חשבונות כפולה, נשארת כמו שהיא</span></div>
            ${arrow('out', 'הצעת מחיר נוצרת ברווחית')}${arrow('out', 'הזמנה ותעודת משלוח')}${arrow('out', 'תעודה חתומה + תמונות')}${arrow('out', 'חשבונית מס, אחרי בדיקה')}${arrow('out', 'חשבונית ספק מצילום')}${arrow('in', 'לקוחות, פריטים ומחירים')}
          </div>
        </div>
        <div class="grid grid-2 section">
          <section class="card" aria-labelledby="syncH"><div class="card-head"><h2 id="syncH"><span class="live-dot" aria-hidden="true"></span>יומן סנכרון</h2><span class="tag ok">${icon('check')}מחובר</span></div>
            <div class="sync-log">${rows.map(x => `<a class="sl" href="#/orders/${x.no}" style="color:inherit"><time>${X.isoDay(new Date(x.at)) === D.today ? X.ftime(x.at) : X.fdate(x.at)}</time><span class="small">${esc(x.text)}</span><span class="yn y">${icon('check')}</span></a>`).join('')}</div></section>
          <section class="card" aria-labelledby="whatH"><div class="card-head"><h2 id="whatH">${icon('layers')}מה עובר לאן</h2></div>
            <div class="tbl-wrap"><table class="tbl" aria-label="מה עובר לאן"><thead><tr><th>מה</th><th>היום</th><th>אחרי</th></tr></thead><tbody>
              ${[['הצעות מחיר, הזמנות, חשבוניות', 'רווחית', 'רווחית (בלי הקלדה כפולה)'], ['הטבלה של אינה ומחלקת ייצור', 'גיליון גוגל', 'המערכת'], ['טאב לכל מכונה', 'גיליון גוגל', 'המערכת, תור לכל מכונה'], ['התקנות לביצוע', 'גיליון + אאוטלוק', 'המערכת + אפליקציית מתקין'], ['תעודה חתומה', 'צילום בווטסאפ', 'חתימה דיגיטלית, ישר לרווחית'], ['עדכונים בין הצוות', 'קבוצות ווטסאפ', 'הקבוצות נשארות, מחוברות'], ['מחיר אחרון ללקוח', 'חיפוש בחשבוניות', 'שורה אחת']].map(([a, b, c]) => `<tr><td class="td-main" data-label="מה">${a}</td><td class="td-full" data-label="היום"><span class="muted">${b}</span></td><td class="td-full" data-label="אחרי"><b>${c}</b></td></tr>`).join('')}
            </tbody></table></div></section>
        </div>
        <div class="note section">${icon('info')}<span>רווחית חושפת ממשק API, וזה נבדק כבר במהלך הפגישה הראשונה. באיפיון נמפה בדיוק אילו מסמכים נכתבים אוטומטית ואילו עוברים אישור של אורן או של ורד לפני שהם יוצאים.</span></div>`;
    }
  };
})();
