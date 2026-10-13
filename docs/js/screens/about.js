/* מסך "על ההדגמה": מה אמיתי, מה דמה, והמודולים */
(function () {
  'use strict';
  const X = window.X, D = X.D, { icon, esc, $ } = X;
  window.SCREENS.about = {
    title: 'על ההדגמה',
    render() {
      const mods = [
        ['1', 'הזמנות', 'הבסיס: מכל הערוצים, דרך הצעת מחיר, גרפיקה ואישור לקוח, עד הייצור.', '#/orders'],
        ['2', 'התקנות בשטח', 'סידור לפי הדרך, בדיקת תחנות שנשכחו, ואפליקציה למתקין עם חתימה דיגיטלית.', '#/installs/route?team=noam&day=1'],
        ['3', 'הנהלת חשבונות', 'סוף חודש בלי ערימה: חתימה, הזמנת רכש וחשבונית לכל תעודה. וקליטת חשבוניות ספק בצילום.', '#/accounting'],
        ['4', 'סטודיו', 'שלט סטנדרטי לקובץ מוכן למכונה, בלי לעבור דרך הגרפיקה.', '#/studio']
      ];
      return `<div class="card card-pad"><div class="about-hero"><div><div class="eyebrow">הדגמה לקראת האיפיון</div><h1>המערכת של איקס מדיה, כמו שהיא יכולה להיראות</h1>
        <p class="muted" style="margin-block-start:.5rem">ההדגמה הזאת נבנתה אחרי פגישת ההיכרות, לפי מה שאורן הראה בשיתוף המסך: הגיליון, הטאבים של המכונות, טאב ההתקנות לפי אזורים וצוותים, רווחית והקבוצות. היא לא מערכת של לקוח אחר. היא נקודת פתיחה לאיפיון, שבו נעבור על כל שלב יחד עם אורן וסמדר.</p></div>
        <img src="assets/logo.png" alt="איקס מדיה פרסומים" width="300" height="76"></div></div>
        <div class="modules section">${mods.map(m => `<a class="card module" href="${m[3]}"><span class="mod-n">מודול ${m[0]}</span><h2>${m[1]}</h2><span class="small muted">${m[2]}</span></a>`).join('')}</div>
        <div class="real-fake section">
          <section class="card card-pad"><h2 style="margin-block-end:.75rem">מה כאן אמיתי</h2><ul>
            ${['הזרימה: הזמנה, הצעת מחיר, גרפיקה, אישור לקוח, ייצור, התקנה, תעודה, חשבונית', 'המקרא: אדום דחוף, שמנת נשלח לאישור, סגול בוצע, ירוק טרם הוכן', 'המכונות: מימאקי, EFI, CNC, DTF, חולצות, זכוכית', 'הצוותים והצבעים שלהם: ניסים, ציטה, נועם, מאיר, עידו', 'האזורים מטאב ההתקנות, ושמות האנשים בצוות', 'המותגים שאורן הזכיר: דלק, מחסני השוק, דימרי, מנטה'].map(t => `<li><span class="li-row">${icon('check')}<span>${esc(t)}</span></span></li>`).join('')}</ul></section>
          <section class="card card-pad"><h2 style="margin-block-end:.75rem">מה כאן דמה</h2><ul>
            ${['כל המחירים והסכומים', 'אנשי הקשר אצל הלקוחות והטלפונים שלהם', 'לקוחות שאינם המותגים שהוזכרו', 'מספרי המסמכים והתאריכים (מתעדכנים לפי היום)', 'הבוט, העוזר והחיבור לרווחית: איורים של מה שייבנה', 'שום דבר לא נשלח ולא נשמר מחוץ לדפדפן שלכם'].map(t => `<li><span class="li-row">${icon('info')}<span>${esc(t)}</span></span></li>`).join('')}</ul></section>
        </div>
        <section class="card card-pad section"><div class="between"><div><h2>איקס מדיה שלטים</h2><p class="small muted">רבי עקיבא 3, נתיבות · <bdi class="num">08-9934431</bdi> · מאז 2002 · שירות בפריסה ארצית</p></div>
          <div class="row-wrap"><button class="btn btn-outline" type="button" id="aTour">${icon('play')}סיור מודרך</button><button class="btn btn-ghost" type="button" id="aReset">${icon('refresh')}איפוס ההדגמה</button></div></div>
          <p class="tiny muted" style="margin-block-start:.75rem">נבנה על ידי Smart Scale. כל הלחיצות בהדגמה נשמרות רק בדפדפן הזה, ו"איפוס" מחזיר הכל להתחלה.</p></section>`;
    },
    mount(root) {
      $('#aReset', root).addEventListener('click', () => window.__demo.reset());
      $('#aTour', root).addEventListener('click', () => { const b = document.querySelector('.foot [data-act="tour"]'); if (b) b.click(); });
    }
  };
})();
