/* מסך "היום": הלוח של סמדר */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, money, mono } = X;
  const FEED_IC = { wa: 'wa', mail: 'mail', sign: 'sign', approve: 'check', prod: 'factory', quote: 'quote', alert: 'alert' };

  function greet() { const h = X.now().getHours(); return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב'; }
  function feedItem(f, flash) {
    return `<a class="feed-item${flash ? ' flash' : ''}" href="${esc(f.link || '#/')}"><span class="feed-ic ${f.type}">${icon(FEED_IC[f.type] || 'info')}</span><span class="grow"><span class="feed-text">${esc(f.text)}</span><span class="feed-time" style="display:block">${X.ago(f.at)}</span></span></a>`;
  }

  window.SCREENS.home = {
    title: 'היום',
    render() {
      const open = D.orders.filter(o => o.stage < 8);
      const waitCust = D.orders.filter(o => o.stage === 5 || o.stage === 2);
      const inProd = D.orders.filter(o => o.stage === 6);
      const insToday = D.orders.filter(o => o.install && o.install.date === D.today);
      const insDone = insToday.filter(o => o.install.status === 'done');
      const todayIn = D.orders.filter(o => X.isoDay(new Date(o.createdAt)) === D.today);
      const ch = { 'ווטסאפ': 0, 'מייל': 0, 'טלפון': 0 }; todayIn.forEach(o => { ch[o.channel] = (ch[o.channel] || 0) + 1; });
      const stale2 = D.orders.filter(o => o.stage === 2 && X.hoursSince(o.createdAt) > 48);
      const stale5 = D.orders.filter(o => o.stage === 5 && o.graphics.sentAt && X.hoursSince(o.graphics.sentAt) > 20);
      const unsigned = D.orders.filter(o => o.stage === 8 && !o.docs.signed);
      const unsched = D.orders.filter(o => o.stage === 7 && o.install && !o.install.date);
      const urgent = D.orders.filter(o => o.urgent && o.stage < 7);
      const todos = [
        { n: unsched.length, c: 'amber', ic: 'route', t: 'עבודות מוכנות שלא נכנסו לסידור', s: unsched.map(o => o.city).join(', '), href: '#/installs/route?team=noam&day=1' },
        { n: stale5.length, c: 'violet', ic: 'eye', t: 'סקיצות שהלקוח לא אישר כבר יותר מיום', s: 'אפשר לשלוח תזכורת בלחיצה', href: '#/graphics' },
        { n: stale2.length, c: 'blue', ic: 'quote', t: 'הצעות מחיר בלי תשובה יותר מיומיים', s: 'מסודר לפי סכום', href: '#/orders?view=list&stage=2' },
        { n: unsigned.length, c: 'red', ic: 'sign', t: 'תעודות משלוח בלי חתימה החודש', s: 'בלי חתימה אין חשבונית', href: '#/accounting?f=sign' },
        { n: urgent.length, c: 'red', ic: 'flame', t: 'הזמנות דחופות פתוחות', s: 'מסומנות באדום, כמו בגיליון', href: '#/orders?view=list&urgent=1' }
      ].filter(t => t.n > 0);
      const teams = D.teams.map(t => { const r = X.routeOf(t.id, D.today); const d = r.filter(o => o.install.status === 'done').length; const regs = Array.from(new Set(r.map(o => D.regions.find(g => g.id === o.region).name))); return { t, r, d, regs }; });
      return `
      <div class="hello">
        <div><div class="eyebrow">${X.fday(D.today)}</div><h1>${greet()}, סמדר</h1><p class="sub">${num(todayIn.length)} הזמנות נכנסו היום · ${num(insToday.length)} התקנות בשטח · ${num(inProd.length)} עבודות בייצור</p></div>
        <div class="quick">
          <a class="btn btn-primary" href="#/orders?new=1">${icon('plus')}הזמנה חדשה</a>
          <a class="btn btn-outline" href="#/installs/route?team=noam&day=1">${icon('route')}סידור מחר</a>
          <a class="btn btn-outline" href="#/studio">${icon('palette')}שלט מוכן</a>
        </div>
      </div>
      <div class="kpis">
        <a class="card kpi" href="#/orders"><div class="k-label">${icon('clipboard')}הזמנות פתוחות</div><div class="k-val" data-count-to="${open.length}">${open.length}</div><div class="k-sub">${num(urgent.length)} מסומנות דחוף</div></a>
        <a class="card kpi" href="#/graphics"><div class="k-label">${icon('eye')}ממתינות ללקוח</div><div class="k-val" data-count-to="${waitCust.length}">${waitCust.length}</div><div class="k-sub">הצעות מחיר וסקיצות</div></a>
        <a class="card kpi" href="#/production"><div class="k-label">${icon('factory')}בייצור עכשיו</div><div class="k-val" data-count-to="${inProd.length}">${inProd.length}</div><div class="k-sub">ב-6 מכונות</div></a>
        <a class="card kpi" href="#/installs"><div class="k-label">${icon('truck')}התקנות היום</div><div class="k-val" data-count-to="${insToday.length}">${insToday.length}</div><div class="k-sub">${num(insDone.length)} כבר הותקנו ונחתמו</div></a>
      </div>
      <div class="grid grid-main section">
        <div class="stack gap-l">
          <section class="card" aria-labelledby="hTodo">
            <div class="card-head"><h2 id="hTodo">${icon('alert')}דורש טיפול</h2><span class="muted small">המערכת זוכרת בשבילכם</span></div>
            <div class="list">${todos.map(t => `<a class="list-item" href="${t.href}"><span class="todo-ic ${t.c}">${icon(t.ic)}</span><span class="li-main"><span class="li-title">${esc(t.t)}</span><span class="li-sub">${esc(t.s)}</span></span><span class="todo-count">${num(t.n)}</span>${icon('chev', 'chev')}</a>`).join('')}</div>
          </section>
          <section class="card" aria-labelledby="hFeed">
            <div class="card-head"><h2 id="hFeed"><span class="live-dot" aria-hidden="true"></span>נכנס עכשיו</h2><button class="btn btn-ghost btn-sm" type="button" id="feedAll">כל העדכונים</button></div>
            <div id="feed">${D.feed.slice(0, 6).map(f => feedItem(f)).join('')}</div>
          </section>
        </div>
        <div class="stack gap-l">
          <section class="card" aria-labelledby="hTeams">
            <div class="card-head"><h2 id="hTeams">${icon('truck')}היום בשטח</h2><a class="btn btn-ghost btn-sm" href="#/installs?view=teams">כל הצוותים</a></div>
            <div class="card-body teams-today">${teams.map(x => `<a class="team-row" href="#/field?team=${x.t.id}"><span class="team-av" style="background:${x.t.color}">${esc(x.t.name[0])}</span><span style="min-inline-size:0"><b>${esc(x.t.name)}</b> <span class="muted small">· ${esc(x.regs.join(', ') || 'אין התקנות')}</span><span class="bar ok" style="margin-block-start:.35rem;display:block"><i style="inline-size:${x.r.length ? Math.round(x.d / x.r.length * 100) : 0}%"></i></span></span><span class="small strong"><bdi class="num">${X.fmt(x.d)}/${X.fmt(x.r.length)}</bdi></span></a>`).join('')}</div>
          </section>
          <section class="card" aria-labelledby="hCh">
            <div class="card-head"><h2 id="hCh">${icon('inbox')}נכנס היום, מכל הערוצים</h2></div>
            <div class="card-body"><div class="source-strip">
              <div class="source">${icon('wa')}<span><b>${num(ch['ווטסאפ'])} בווטסאפ</b>נפתחו אוטומטית</span></div>
              <div class="source">${icon('mail')}<span><b>${num(ch['מייל'])} במייל</b>קובץ מצורף נשמר</span></div>
              <div class="source">${icon('call')}<span><b>${num(ch['טלפון'])} בטלפון</b>נרשמו ידנית</span></div>
              <div class="source">${icon('palette')}<span><b>${num(2)} מהסטודיו</b>שלט מוכן, בלי גרפיקה</span></div>
            </div><p class="tiny muted" style="margin-block-start:.6rem">שלושת הערוצים נכנסים לאותה רשימה. אף הזמנה לא נשארת בטלפון של מישהו.</p></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      X.countUp(root);
      X.$('#feedAll', root).addEventListener('click', () => X.sheet({ title: 'כל העדכונים של היום', body: `<div class="card">${D.feed.map(f => feedItem(f)).join('')}</div>`, onOpen: el => X.$$('a', el).forEach(a => a.addEventListener('click', X.closeSheet)) }));
      if (X.SHOT || X.TEST) return;
      const S = X.S();
      const iv = setInterval(() => {
        const f = D.live[(S.liveIdx || 0) % D.live.length]; S.liveIdx = (S.liveIdx || 0) + 1;
        X.feedPush(Object.assign({}, f));
        const box = X.$('#feed'); if (!box) return;
        box.insertAdjacentHTML('afterbegin', feedItem(D.feed[0], true));
        while (box.children.length > 6) box.lastElementChild.remove();
      }, 9000);
      X.onLeave(() => clearInterval(iv));
    }
  };
})();
