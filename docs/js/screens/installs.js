/* מסכי "התקנות": לוח שבועי לפי אזור, לפי צוות, והסידור של יום עם בדיקת תחנות שנשכחו */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, num, $, $$ } = X;
  const regionName = id => (D.regions.find(r => r.id === id) || { name: id }).name;
  const DAYS = [0, 1, 2, 3, 4];

  function insCard(o) {
    const t = X.team(o.install.team);
    const un = !o.install.date;
    return `<a class="ins-card${un ? ' unsched' : ''}" href="#/orders/${o.no}?tab=install" style="${t ? `border-inline-start-color:${t.color}` : ''}">
      <span class="i-day">${un ? 'מוכן, לא שובץ' : `${X.relDay(o.install.date)} · <bdi class="num">${esc(o.install.slot || '')}</bdi>`}</span>
      <span class="i-cust">${esc(o.branch)}</span><span class="i-desc">${esc(X.shortTitle(o.title, 58))}</span>
      <span class="row-wrap">${X.teamTag(o.install.team)}${o.install.status === 'done' ? '<span class="tag ok">' + icon('check') + 'הותקן</span>' : ''}${o.urgent ? '<span class="tag urgent">דחוף</span>' : ''}</span></a>`;
  }
  function boardView(r) {
    const dsel = r.q.get('d');
    const days = DAYS.map(n => D.workDay(n));
    const inRange = o => o.install && (!o.install.date ? true : days.indexOf(o.install.date) >= 0 && (dsel == null || dsel === '' || o.install.date === D.workDay(Number(dsel))));
    const list = D.orders.filter(o => (o.stage === 7 || (o.stage === 8 && o.install && o.install.date === D.today)) && inRange(o));
    const reg = r.q.get('reg') || '';
    return `<div class="stack">
      <div class="chips" role="group" aria-label="יום"><button class="chip" type="button" data-d="" aria-pressed="${dsel == null || dsel === ''}">כל השבוע</button>${DAYS.map(n => `<button class="chip" type="button" data-d="${n}" aria-pressed="${dsel === String(n)}">${X.relDay(D.workDay(n))}</button>`).join('')}</div>
      <div class="chips m-only" role="group" aria-label="אזור"><button class="chip" type="button" data-reg="" aria-pressed="${!reg}">כל האזורים</button>${D.regions.map(g => `<button class="chip" type="button" data-reg="${g.id}" aria-pressed="${reg === g.id}">${g.name} <bdi class="num">${list.filter(o => o.region === g.id).length}</bdi></button>`).join('')}</div>
      <div class="board">${D.regions.filter(g => !reg || g.id === reg || window.matchMedia('(min-width: 65rem)').matches).map(g => { const items = list.filter(o => o.region === g.id).sort((a, b) => (a.install.date || '0').localeCompare(b.install.date || '0'));
        return `<section class="board-col" aria-label="${g.name}"><div class="board-head">${g.name}</div>${items.map(insCard).join('') || '<div class="empty small">אין התקנות</div>'}</section>`; }).join('')}</div>
      <div class="legend">${D.teams.map(t => `<span><span class="team-dot" style="background:${t.color}"></span>${esc(t.name)}</span>`).join('')}<span><i class="swatch" style="background:#FFF8EE;border:1.5px dashed #E58A1F"></i>מוכן ולא שובץ</span></div>
    </div>`;
  }
  function teamsView(r) {
    const dOff = Number(r.q.get('day') || 0); const di = D.workDay(dOff);
    return `<div class="stack"><div class="chips" role="group" aria-label="יום">${[0, 1, 2].map(n => `<button class="chip" type="button" data-tday="${n}" aria-pressed="${dOff === n}">${X.relDay(D.workDay(n))}</button>`).join('')}</div>
      <div class="team-cards">${D.teams.map(t => { const stops = X.orderRoute(X.routeOf(t.id, di)); const done = stops.filter(o => o.install.status === 'done').length;
        return `<section class="card"><div class="team-card-head"><span class="team-av" style="background:${t.color}">${esc(t.name[0])}</span><div class="grow"><h2>${esc(t.name)}</h2><div class="tiny muted">${esc(t.members)} · ${esc(t.vehicle)}</div></div><span class="small strong"><bdi class="num">${X.fmt(done)}/${X.fmt(stops.length)}</bdi></span></div>
          <div class="stops">${stops.map((o, i) => `<a class="stop${o.install.status === 'done' ? ' done' : ''}" href="#/orders/${o.no}?tab=install"><span class="s-num">${o.install.status === 'done' ? icon('check') : i + 1}</span><span style="min-inline-size:0"><span class="s-t">${esc(o.city)} · ${esc(o.branch)}</span><span class="s-s" style="display:block">${esc(X.shortTitle(o.title, 46))}</span></span><span class="tiny muted"><bdi class="num">${esc((o.install.slot || '').split('-')[0])}</bdi></span></a>`).join('') || '<div class="empty small">אין התקנות ביום הזה</div>'}</div>
          <div class="row-wrap card-body" style="padding-block-start:.75rem"><a class="btn btn-primary btn-sm" href="#/installs/route?team=${t.id}&day=${dOff}">${icon('route')}הסידור</a><a class="btn btn-outline btn-sm" href="#/field?team=${t.id}">${icon('phone')}הטלפון של ${esc(t.name)}</a></div></section>`; }).join('')}</div></div>`;
  }

  window.SCREENS.installs = {
    title: 'התקנות',
    render(r) {
      const v = r.q.get('view') || (window.matchMedia('(min-width: 65rem)').matches ? 'board' : 'teams');
      const un = D.orders.filter(o => o.stage === 7 && o.install && !o.install.date);
      return `<div class="page-head"><div><div class="eyebrow">המודול השני: התקנות</div><h1>התקנות</h1><p class="sub">אותו טאב "התקנות לביצוע", לפי אזורים ובצבעים של הצוותים, רק שכל תחנה מחוברת להזמנה שלה. מה שמוכן ולא שובץ, בולט.</p></div>
        <div class="actions"><a class="btn btn-primary" href="#/installs/route?team=noam&day=1">${icon('route')}הסידור של מחר</a></div></div>
        ${un.length ? `<div class="note warn" style="margin-block-end:1rem">${icon('alert')}<span><b>${num(un.length)} עבודות מוכנות ולא נכנסו לסידור:</b> ${un.map(o => esc(o.branch)).join(', ')}. <a class="ilink" href="#/installs/route?team=noam&day=1" style="font-weight:800">לבדיקה בסידור</a></span></div>` : ''}
        <div class="seg" role="tablist" aria-label="תצוגה" style="margin-block-end:1rem;inline-size:max-content">${[['board', 'לוח לפי אזור', 'grid'], ['teams', 'לפי צוות', 'users']].map(([k, l, ic]) => `<button type="button" role="tab" data-view="${k}" aria-selected="${v === k}" class="${v === k ? 'on' : ''}">${icon(ic)}${l}</button>`).join('')}</div>
        ${v === 'teams' ? teamsView(r) : boardView(r)}`;
    },
    mount(root, r) {
      $$('[data-view]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'view', b.dataset.view)));
      $$('[data-d]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'd', b.dataset.d)));
      $$('[data-reg]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'reg', b.dataset.reg)));
      $$('[data-tday]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'day', b.dataset.tday)));
    }
  };

  /* ---------- מפה סכמטית ---------- */
  const OUTLINE = [[33.28, 35.62], [33.1, 35.1], [32.83, 34.97], [32.6, 34.9], [32.3, 34.84], [32.08, 34.76], [31.8, 34.63], [31.6, 34.52], [31.45, 34.38], [31.22, 34.26], [31.1, 34.25], [31.1, 35.4], [31.5, 35.45], [31.9, 35.5], [32.4, 35.55], [32.7, 35.57], [32.95, 35.6], [33.28, 35.62]];
  function map(stops, missed, color) {
    const pts0 = stops.concat(missed).map(o => D.cities[o.city]);
    const base = D.cities[D.baseCity];
    let la0 = 31.1, la1 = 33.35, lo0 = 34.15, lo1 = 35.75;
    if (pts0.length) {
      const lats = pts0.map(p => p[0]), lons = pts0.map(p => p[1]);
      la0 = Math.min.apply(null, lats); la1 = Math.max.apply(null, lats); lo0 = Math.min.apply(null, lons); lo1 = Math.max.apply(null, lons);
      if (base[0] >= la0 - .35 && base[0] <= la1 + .35) { la0 = Math.min(la0, base[0]); la1 = Math.max(la1, base[0]); lo0 = Math.min(lo0, base[1]); lo1 = Math.max(lo1, base[1]); }
      const padLa = Math.max(.12, (la1 - la0) * .18), padLo = Math.max(.14, (lo1 - lo0) * .3);
      la0 -= padLa; la1 += padLa; lo0 -= padLo; lo1 += padLo;
    }
    const W = 320, k = Math.cos(32 * Math.PI / 180);
    let H = Math.round(W * (la1 - la0) / ((lo1 - lo0) * k));
    if (H < 260) { const need = 260 * (lo1 - lo0) * k / W - (la1 - la0); la0 -= need / 2; la1 += need / 2; H = 260; }
    if (H > 480) { const need = (la1 - la0) * W / (480 * k) - (lo1 - lo0); lo0 -= need / 2; lo1 += need / 2; H = 480; }
    const pj = (lat, lon) => [Math.round((lon - lo0) / (lo1 - lo0) * W), Math.round((la1 - lat) / (la1 - la0) * H)];
    const inside = p => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;
    const bp = pj(base[0], base[1]); const baseIn = inside(bp);
    const sp = stops.map(o => pj(D.cities[o.city][0], D.cities[o.city][1]));
    const halo = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
    const lab = (x, y, t, w, c) => { const left = x > W * .62; return `<text x="${left ? x - 15 : x + 15}" y="${y + 4}" text-anchor="${left ? 'start' : 'end'}" direction="rtl" font-family="Heebo,Arial" font-weight="${w}" font-size="12" fill="${c}" ${halo}>${esc(t)}</text>`; };
    let entry = '';
    if (!baseIn && sp.length) { const f = sp[0]; const dx = bp[0] - f[0], dy = bp[1] - f[1]; const t = Math.min(Math.abs((dy > 0 ? H - f[1] : f[1]) / (dy || 1)), Math.abs((dx > 0 ? W - f[0] : f[0]) / (dx || 1))); const ex = Math.round(f[0] + dx * t * .92), ey = Math.round(f[1] + dy * t * .92); entry = `<line x1="${ex}" y1="${ey}" x2="${f[0]}" y2="${f[1]}" stroke="${color}" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/><text x="${ex}" y="${ey > H / 2 ? ey - 8 : ey + 16}" text-anchor="middle" font-family="Heebo,Arial" font-weight="700" font-size="11.5" fill="#555" ${halo}>מנתיבות</text>`; }
    const line = (baseIn ? [bp] : []).concat(sp);
    const outline = OUTLINE.map(p => pj(p[0], p[1]).join(' ')).join(' L');
    const dots = Object.keys(D.cities).map(c => { const [x, y] = pj(D.cities[c][0], D.cities[c][1]); return inside([x, y]) ? `<circle cx="${x}" cy="${y}" r="2.4" fill="#BDBDC2"/>` : ''; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="מפה סכמטית של המסלול" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden">
      <defs><clipPath id="mapClip"><rect width="${W}" height="${H}" rx="10"/></clipPath></defs>
      <g clip-path="url(#mapClip)"><rect width="${W}" height="${H}" fill="#ECECEF"/><path d="M${outline}Z" fill="#FFFFFF" stroke="#CFCFD3" stroke-width="2"/>${dots}
      ${entry}<polyline points="${line.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      ${missed.map(o => { const [x, y] = pj(D.cities[o.city][0], D.cities[o.city][1]); return `<circle cx="${x}" cy="${y}" r="16" fill="rgba(229,138,31,.18)" stroke="#E58A1F" stroke-width="2.5" stroke-dasharray="4 3"/><circle cx="${x}" cy="${y}" r="6" fill="#E58A1F"/>${lab(x, y, o.city + '?', 800, '#8A4508')}`; }).join('')}
      ${baseIn ? `<circle cx="${bp[0]}" cy="${bp[1]}" r="11" fill="#B81828"/><text x="${bp[0]}" y="${bp[1] + 4}" text-anchor="middle" font-family="Heebo,Arial" font-weight="800" font-size="11" fill="#fff">X</text>${lab(bp[0], bp[1], 'נתיבות', 700, '#1E1E1E')}` : ''}
      ${sp.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="11" fill="#1E1E1E" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Heebo,Arial" font-weight="800" font-size="11" fill="#fff">${i + 1}</text>${lab(x, y, stops[i].city, 700, '#1E1E1E')}`).join('')}
      <text x="${W - 10}" y="${H - 10}" text-anchor="start" direction="rtl" font-family="Assistant,Arial" font-size="11" fill="#6B6B6B" ${halo}>מפה סכמטית</text></g>
    </svg>`;
  }
  function ics(team, dayIso, stops) {
    const d = dayIso.replace(/-/g, ''); const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//X-Media demo//HE', 'CALSCALE:GREGORIAN'];
    stops.forEach((o, i) => { const [s, e] = (o.install.slot || '08:00-10:00').split('-'); L.push('BEGIN:VEVENT', `UID:${o.no}-${d}@xmedia-demo`, `DTSTAMP:${d}T060000Z`, `DTSTART:${d}T${s.replace(':', '')}00`, `DTEND:${d}T${e.replace(':', '')}00`, `SUMMARY:${i + 1}. התקנה: ${o.branch}`, `LOCATION:${o.city}`, `DESCRIPTION:${o.title} (הזמנה ${o.no})`, 'END:VEVENT'); });
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }

  window.SCREENS.route = {
    nav: 'installs',
    title: r => { const t = X.team(r.q.get('team') || 'noam'); return `הסידור של ${t ? t.name : ''}`; },
    render(r) {
      const t = X.team(r.q.get('team')) || X.team('noam'); const dOff = Math.max(0, Math.min(4, Number(r.q.get('day') || 0))); const di = D.workDay(dOff);
      const stops = X.orderRoute(X.routeOf(t.id, di));
      const missed = X.missedFor(stops, di);
      let tot = 0, prev = D.baseCity; const legs = stops.map(o => { const k = X.km(prev, o.city); tot += k; prev = o.city; return k; });
      const back = X.km(prev, D.baseCity); tot += back;
      const hrs = Math.round((tot / 70 + stops.length * 0.9) * 10) / 10;
      return `<div class="order-head"><div class="crumbs"><a href="#/installs">התקנות</a>${icon('chev', 'chev')}<span>סידור</span></div>
        <div class="between" style="align-items:flex-start"><div><h1>הסידור של ${esc(t.name)} · ${X.relDay(di)}</h1><p class="muted">${num(stops.length)} תחנות · כ-${num(tot)} ק"מ הלוך וחזור · כ-${num(hrs)} שעות עם ההתקנות · יציאה מנתיבות 07:00</p></div>
        <div class="row-wrap"><button class="btn btn-wa" type="button" id="rWa">${icon('wa')}שליחה לצוות</button><button class="btn btn-outline" type="button" id="rIcs">${icon('calendar')}ייצוא לאאוטלוק</button></div></div>
        <div class="chips" role="group" aria-label="צוות">${D.teams.map(x => `<button class="chip" type="button" data-team="${x.id}" aria-pressed="${x.id === t.id}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div>
        <div class="chips" role="group" aria-label="יום">${DAYS.map(n => `<button class="chip" type="button" data-day="${n}" aria-pressed="${n === dOff}">${X.relDay(D.workDay(n))}</button>`).join('')}</div></div>
        <div class="route-grid section">
          <div class="stack">
            ${missed.length ? `<section class="missed" aria-labelledby="mH"><h3 id="mH">${icon('alert')}רגע לפני שסוגרים: ${missed.length === 1 ? 'יש עבודה מוכנה על הדרך' : `יש ${num(missed.length)} עבודות מוכנות על הדרך`}</h3>
              ${missed.map(o => `<div class="between" style="background:#fff;border-radius:11px;padding:.6rem .75rem"><div style="min-inline-size:0"><b>${esc(o.city)}: ${esc(o.branch)}</b><div class="small muted">${esc(o.title)} · ${esc(o.note || '')} · ${num(X.km(o.city, stops.reduce((b, s) => X.km(s.city, o.city) < X.km(b, o.city) ? s.city : b, stops[0].city)))} ק"מ מהמסלול</div></div><button class="btn btn-primary btn-sm" type="button" data-add="${o.no}">${icon('plus')}לצרף לסידור</button></div>`).join('')}
              <p class="small" style="color:#8A4508">בלי זה, מישהו היה צריך לעבור על הגיליון שוב ושוב, ואם פספס, לשלוח אוטו נוסף.</p></section>` : stops.length ? `<div class="note ok">${icon('check')}<span>נבדק: אין עבודות מוכנות באזור שנשארו מחוץ לסידור.</span></div>` : ''}
            <section class="card"><div class="card-head"><h2>${icon('route')}סדר התחנות לפי הדרך</h2><span class="tag outline">${esc(t.vehicle)}</span></div>
              <div class="stops">${stops.length ? `<div class="stop"><span class="s-num" style="background:var(--brand)">X</span><span><span class="s-t">יציאה מהמפעל, נתיבות</span><span class="s-s" style="display:block">07:00 · העמסה לפי סדר הפריקה</span></span><span></span></div>` + stops.map((o, i) => `<div class="leg">${num(legs[i])} ק"מ · כ-${num(Math.max(10, Math.round(legs[i] / 70 * 60)))} דק' נסיעה</div><a class="stop${o.install.status === 'done' ? ' done' : ''}" href="#/orders/${o.no}?tab=install"><span class="s-num">${o.install.status === 'done' ? icon('check') : i + 1}</span><span style="min-inline-size:0"><span class="s-t">${esc(o.city)} · ${esc(o.branch)}</span><span class="s-s" style="display:block">${esc(X.shortTitle(o.title, 60))}</span></span><span class="tiny muted"><bdi class="num">${esc(o.install.slot || '')}</bdi></span></a>`).join('') + `<div class="leg">${num(back)} ק"מ חזרה למפעל</div>` : `<div class="empty">${icon('truck')}אין התקנות לצוות הזה ביום הזה</div>`}</div></section>
          </div>
          <section class="card card-pad"><div class="map-wrap">${map(stops, missed, t.color)}</div><p class="tiny muted" style="margin-block-start:.5rem">במערכת האמיתית: מפה אמיתית וזמני נסיעה מ-Waze או מגוגל.</p></section>
        </div>`;
    },
    mount(root, r) {
      const t = X.team(r.q.get('team')) || X.team('noam'); const dOff = Math.max(0, Math.min(4, Number(r.q.get('day') || 0))); const di = D.workDay(dOff);
      $$('[data-team]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'team', b.dataset.team)));
      $$('[data-day]', root).forEach(b => b.addEventListener('click', () => X.setQuery(r, 'day', b.dataset.day)));
      $$('[data-add]', root).forEach(b => b.addEventListener('click', () => {
        const o = X.order(b.dataset.add); o.install.team = t.id; o.install.date = di; o.install.slot = D.slots[Math.min(4, X.routeOf(t.id, di).length)]; o.install.status = 'scheduled';
        X.log(o, 'סמדר', `צורף לסידור של ${t.name}, ${X.relDay(di)}`); X.save(); X.toast(`${esc(o.city)} צורף לסידור של ${esc(t.name)}. נחסכה נסיעה נוספת`); X.render();
      }));
      $('#rIcs', root).addEventListener('click', () => { const stops = X.orderRoute(X.routeOf(t.id, di)); X.download(`סידור-${t.name}-${di}.ics`, ics(t, di, stops), 'text/calendar;charset=utf-8'); X.toast('קובץ היומן ירד. פותחים אותו והתחנות נכנסות לאאוטלוק', 'calendar'); });
      $('#rWa', root).addEventListener('click', () => {
        const stops = X.orderRoute(X.routeOf(t.id, di));
        X.sheet({ title: `הודעה ל${esc(t.name)} (איור)`, body: `<p class="small muted" style="margin-block-end:.6rem">יוצא לבד ב-18:00 בערב שלפני, עם קישור לאפליקציה של המתקין. אף אחד לא מעתיק ומדביק.</p><div class="bubble-preview"><div class="wa-b in"><div class="who" style="color:#B81828">איקס מדיה · סידור עבודה</div>ערב טוב ${esc(t.name)}, הסידור ל${esc(X.relDay(di))}:<br>${stops.map((o, i) => `${i + 1}. ${esc(o.city)} · ${esc(o.branch)} · ${esc(o.install.slot || '')}`).join('<br>')}<br><br>יציאה 07:00. הכל בקישור, כולל סקיצות ואנשי קשר:<br><span style="color:#027EB5">x-media.app/field/${esc(t.id)}</span><div class="t">18:00</div></div></div>`,
          foot: `<a class="btn btn-primary" href="#/field?team=${t.id}">${icon('phone')}לאפליקציה של ${esc(t.name)}</a>`, onOpen: el => $$('a', el).forEach(a => a.addEventListener('click', X.closeSheet)) });
      });
    }
  };
})();
