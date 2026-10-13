/* מסך "ווטסאפ" (איור): הקבוצות נשארות, אבל מחוברות למערכת */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, $, $$ } = X;
  let tab = 'orders';
  const nO = () => String(D.counters.order + 1).padStart(6, '0');

  function scripts() {
    const prod = D.orders.find(o => o.stage === 6 && o.machine === 'efi') || D.orders.find(o => o.stage === 6);
    const di = D.workDay(1); const stops = X.orderRoute(X.routeOf('noam', di));
    return {
      orders: { title: 'איקס מדיה · הזמנות', sub: 'הבוט של המשרד, 24/7', msgs: [
        { in: true, who: 'יוסי (דלק)', t: '08:41', h: 'בוקר טוב, צריך לתחנה בעפולה 2 מדבקות מבצע 60/40 לשבוע הבא' },
        { t: '08:41', h: `קיבלתי, תודה יוסי. פתחתי הזמנה <b>${esc(nO())}</b> לדלק עפולה: 2 מדבקות ויטרינה 60/40. סמדר תשלח הצעת מחיר עד 10:00.` },
        { t: '09:12', h: `הצעת מחיר ${esc(String(D.counters.quote + 1).padStart(6, '0'))} מצורפת: 2 x מדבקת ויטרינה 60/40, סה"כ 245 ₪ כולל מע"מ (לדוגמה).<br><b>לאישור השיבו 1</b>` },
        { in: true, who: 'יוסי (דלק)', t: '09:20', h: '1' },
        { t: '09:20', h: 'מעולה, אושר. ההזמנה עברה לגרפיקה, נשלח סקיצה לאישור עוד היום.' }
      ] },
      prod: { title: 'ייצור איקס מדיה', sub: 'אברהם, מירן, עידו, סמדר, משרד', msgs: [
        { t: '10:05', who: 'המערכת', h: `עבודה ${esc(prod.no)} · ${esc(prod.branch)}<br>${esc(X.shortTitle(prod.title, 60))}<br><b>מי מבצע?</b>`, poll: ['אברהם', 'מירן', 'עידו'] },
        { in: true, who: 'אברהם', t: '10:07', h: 'לקחתי, מסיים עד 13:00' },
        { t: '13:02', who: 'המערכת', h: `${esc(prod.branch)}: אברהם סימן "הודפס". נשאר: חיתוך ואריזה.` }
      ] },
      install: { title: 'התקנות', sub: 'נועם, ניסים, מאיר, עידו, ציטה, משרד', msgs: [
        { t: '18:00', who: 'המערכת', h: `הסידור של נועם ל${esc(X.relDay(di))}:<br>${stops.map((o, i) => `${i + 1}. ${esc(o.city)} · ${esc(o.branch)}`).join('<br>')}<br>הקישור לאפליקציה: <span style="color:#027EB5">x-media.app/field/noam</span>` },
        { in: true, who: 'נועם', t: '18:04', h: 'קיבלתי 👍' },
        { t: '11:26', who: 'המערכת', h: 'נועם: הותקן בעפולה, התעודה נחתמה על ידי הלקוח.', att: true }
      ] }
    };
  }
  function phone(key, s, on) {
    return `<section class="wa-phone${on ? ' on' : ''}" aria-label="${esc(s.title)}"><div class="wa-head"><span class="wa-av"><img src="assets/icon.png" alt="" width="36" height="36"></span><div style="min-inline-size:0"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></div></div>
      <div class="wa-body" data-body="${key}"><span class="wa-sys">איור. במערכת האמיתית זה קורה בווטסאפ העסקי של המשרד</span></div>
      <div class="wa-foot"><span class="wa-fake">הקלדת הודעה</span><button class="btn btn-wa btn-sm" type="button" data-run="${key}">${icon('play')}הפעלה</button></div></section>`;
  }
  function bubble(m) {
    return `<div class="wa-b ${m.in ? 'in' : 'out'} flash">${m.who ? `<div class="who" style="color:${m.in ? '#1F7A8C' : '#B81828'}">${esc(m.who)}</div>` : ''}${m.att ? X.photo(0, 'דלק') : ''}${m.h}${m.poll ? `<div class="wa-poll">${m.poll.map((p, i) => `<button type="button" data-vote="${esc(p)}">${icon('user')}${esc(p)}<span class="bar"><i style="inline-size:0%"></i></span></button>`).join('')}</div>` : ''}<div class="t">${esc(m.t)}${m.in ? '' : ' ' + icon('checks')}</div></div>`;
  }

  window.SCREENS.whatsapp = {
    title: 'ווטסאפ',
    render(r) {
      const S = scripts(); if (r.q.get('tab')) tab = r.q.get('tab');
      return `<div class="page-head"><div><div class="eyebrow">איור</div><h1>הקבוצות נשארות, רק מחוברות</h1><p class="sub">לא מבקשים מאף אחד להפסיק לעבוד בווטסאפ. הלקוח כותב כרגיל, הצוות עונה כרגיל, והכל נכנס למערכת לבד. כולל הסקר שאורן הציע לקבוצת הייצור.</p></div>
        <div class="actions"><button class="btn btn-primary" type="button" id="runAll">${icon('play')}הפעלת שלוש השיחות</button></div></div>
        <div class="seg wa-tabs" role="tablist" aria-label="שיחה" style="margin-block-end:1rem">${[['orders', 'הזמנות'], ['prod', 'ייצור'], ['install', 'התקנות']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="phones">${Object.keys(S).map(k => phone(k, S[k], tab === k)).join('')}</div>`;
    },
    mount(root, r) {
      const S = scripts(); const timers = [];
      X.onLeave(() => timers.forEach(clearTimeout));
      function play(key, instant) {
        const body = $(`[data-body="${key}"]`, root); if (!body) return;
        body.innerHTML = `<span class="wa-sys">איור. במערכת האמיתית זה קורה בווטסאפ העסקי של המשרד</span>`;
        S[key].msgs.forEach((m, i) => {
          const add = () => { body.insertAdjacentHTML('beforeend', bubble(m)); body.scrollTop = body.scrollHeight; wire(body); };
          if (instant || X.SHOT) add(); else timers.push(setTimeout(add, 450 + i * 1100));
        });
      }
      function wire(body) {
        $$('[data-vote]', body).forEach(b => { if (b.dataset.w) return; b.dataset.w = '1'; b.addEventListener('click', () => { const poll = b.closest('.wa-poll'); $$('button', poll).forEach(x => { x.classList.toggle('voted', x === b); $('i', x).style.inlineSize = x === b ? '100%' : '0%'; }); X.toast(`${b.dataset.vote} לקח את העבודה. זה כבר מעודכן במסך הייצור`); }); });
      }
      $$('[data-run]', root).forEach(b => b.addEventListener('click', () => play(b.dataset.run)));
      $('#runAll', root).addEventListener('click', () => Object.keys(S).forEach(k => play(k)));
      $$('[data-tab]', root).forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; $$('[data-tab]', root).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }); $$('.wa-phone', root).forEach((p, i) => p.classList.toggle('on', Object.keys(S)[i] === tab)); }));
      if (r.q.get('run') || X.SHOT) Object.keys(S).forEach(k => play(k, true));
    }
  };
})();
