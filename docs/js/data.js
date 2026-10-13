/* איקס מדיה שלטים · הדגמה · נתוני דמה.
   הכל נבנה מחדש לפי "היום" כדי שההדגמה לא תתיישן. המבנה, המכונות, הצוותים והזרימה אמיתיים
   (מהפגישה ומהגיליון של אורן). טלפונים, מחירים, אנשי קשר ולקוחות שאינם המותגים: דמה. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  /* דגל אחד: false מחליף את שמות המותגים (דלק, מחסני השוק, דימרי, מנטה) בשמות דמה */
  const USE_BRAND_NAMES = true;

  /* ---------- אקראיות קבועה (אותם נתונים בכל טעינה) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(2002);
  const pick = a => a[Math.floor(R() * a.length)];
  const between = (a, b) => a + Math.floor(R() * (b - a + 1));

  /* ---------- זמן ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function baseDay() {
    let d; const t = Q.get('today');
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) { const [y, m, dd] = t.split('-').map(Number); d = new Date(y, m - 1, dd); }
    else { const n = new Date(); d = new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
    if (d.getDay() === 6) d.setDate(d.getDate() + 1); // שבת: מתחילים ביום ראשון
    return d;
  }
  const TODAY = baseDay();
  const FIXED = Q.has('today');
  const NOW = (function () {
    const n = new Date(); const d = new Date(TODAY);
    if (FIXED || iso(n) !== iso(TODAY) || n.getHours() < 8 || n.getHours() > 18) d.setHours(10, 40, 0, 0);
    else d.setHours(n.getHours(), n.getMinutes(), 0, 0);
    return d;
  })();
  function addWork(d, n) { const x = new Date(d); const step = n >= 0 ? 1 : -1; let left = Math.abs(n); while (left > 0) { x.setDate(x.getDate() + step); if (x.getDay() !== 6) left--; } return x; }
  const day = n => iso(addWork(TODAY, n));
  const at = (dayOffset, h, m) => { const d = addWork(TODAY, dayOffset); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const minsAgo = m => new Date(NOW.getTime() - m * 60000).toISOString();

  /* ---------- גאוגרפיה ---------- */
  const REGIONS = [
    { id: 'north', name: 'צפון' }, { id: 'haifa', name: 'חיפה והקריות' }, { id: 'sharon', name: 'שרון ונתניה' },
    { id: 'center', name: 'מרכז ושפלה' }, { id: 'jerusalem', name: 'ירושלים' }, { id: 'south', name: 'דרום' }
  ];
  const CITIES = {
    'נתיבות': [31.42, 34.59, 'south'], 'באר שבע': [31.25, 34.79, 'south'], 'אופקים': [31.31, 34.62, 'south'], 'אשקלון': [31.67, 34.57, 'south'],
    'קריית גת': [31.61, 34.76, 'south'], 'אשדוד': [31.80, 34.65, 'center'], 'רחובות': [31.89, 34.81, 'center'], 'ראשון לציון': [31.96, 34.80, 'center'],
    'מודיעין': [31.90, 35.01, 'center'], 'תל אביב': [32.08, 34.78, 'center'], 'פתח תקווה': [32.09, 34.88, 'center'], 'כפר סבא': [32.18, 34.91, 'sharon'],
    'הרצליה': [32.16, 34.84, 'sharon'], 'נתניה': [32.33, 34.86, 'sharon'], 'חדרה': [32.43, 34.92, 'sharon'], 'חיפה': [32.79, 34.99, 'haifa'],
    'נשר': [32.77, 35.04, 'haifa'], 'קריית אתא': [32.81, 35.11, 'haifa'], 'יוקנעם': [32.66, 35.11, 'haifa'], 'עפולה': [32.61, 35.29, 'north'],
    'נוף הגליל': [32.71, 35.32, 'north'], 'כרמיאל': [32.92, 35.30, 'north'], 'מירון': [32.98, 35.44, 'north'], 'טבריה': [32.79, 35.53, 'north'],
    'ירושלים': [31.77, 35.21, 'jerusalem'], 'בית שמש': [31.75, 34.99, 'jerusalem'], 'מעלה אדומים': [31.78, 35.30, 'jerusalem']
  };
  const BASE_CITY = 'נתיבות';

  /* ---------- אנשים ---------- */
  const STAFF = [
    { id: 'smadar', name: 'סמדר', role: 'מנהלת המשרד ומתאמת ההזמנות', initial: 'ס' },
    { id: 'oren', name: 'אורן', role: 'בעלים', initial: 'א' },
    { id: 'ina', name: 'אינה', role: 'גרפיקה (סטודיו)', initial: 'א' },
    { id: 'vered', name: 'ורד', role: 'משרד', initial: 'ו' },
    { id: 'matan', name: 'מתן', role: 'הזמנות וייצור', initial: 'מ' },
    { id: 'avi', name: 'אבי', role: 'הזמנות', initial: 'א' }
  ];
  const ENTERERS = ['סמדר', 'סמדר', 'סמדר', 'אורן', 'אורן', 'מתן', 'אבי'];
  const TEAMS = [
    { id: 'nisim', name: 'ניסים', color: '#E040C8', members: 'ניסים + עוזר', vehicle: 'טנדר עם סל' },
    { id: 'tzita', name: 'ציטה', color: '#F2A57A', members: 'ציטה + עוזר', vehicle: 'טנדר' },
    { id: 'noam', name: 'נועם', color: '#F59E0B', members: 'נועם + שגיא', vehicle: 'משאית עם מנוף' },
    { id: 'meir', name: 'מאיר', color: '#E2B800', members: 'מאיר + עוזר', vehicle: 'טנדר' },
    { id: 'ido', name: 'עידו', color: '#3B82F6', members: 'עידו + עוזר', vehicle: 'טנדר עם סולם' }
  ];
  const MACHINES = [
    { id: 'mimaki', name: 'מימאקי', desc: 'הדפסת גלילים ומדבקות', cap: 9, operator: 'מירן' },
    { id: 'efi', name: 'EFI', desc: 'הדפסה ישירה על חומר', cap: 10, operator: 'אברהם' },
    { id: 'cnc', name: 'CNC', desc: 'חיתוך אלומיניום, פרספקס, פייסי ו-PVC', cap: 8, operator: 'מתן' },
    { id: 'dtf', name: 'DTF', desc: 'הדפסת העברה לטקסטיל', cap: 6, operator: 'מירן' },
    { id: 'shirts', name: 'חולצות', desc: 'הדפסה על חולצות', cap: 5, operator: 'עידו' },
    { id: 'glass', name: 'זכוכית', desc: 'הדפסה והדבקה על זכוכית', cap: 4, operator: 'אברהם' }
  ];

  /* ---------- שלבים ומקרא ---------- */
  const STAGES = [
    { id: 1, name: 'התקבלה', icon: 'inbox' }, { id: 2, name: 'הצעת מחיר', icon: 'quote' }, { id: 3, name: 'אושרה', icon: 'check' },
    { id: 4, name: 'גרפיקה', icon: 'pen' }, { id: 5, name: 'אישור לקוח', icon: 'eye' }, { id: 6, name: 'ייצור', icon: 'factory' },
    { id: 7, name: 'התקנה', icon: 'truck' }, { id: 8, name: 'תעודה וחשבונית', icon: 'doc' }
  ];
  const LEGEND = [
    { id: 'urgent', name: 'דחוף', sheet: 'אדום בגיליון' },
    { id: 'sent', name: 'נשלח ללקוח לאישור', sheet: 'שמנת בגיליון' },
    { id: 'done', name: 'בוצע', sheet: 'סגול בגיליון' },
    { id: 'wait', name: 'טרם הוכן', sheet: 'ירוק בגיליון' },
    { id: 'new', name: 'חדש', sheet: 'לבן בגיליון' }
  ];

  /* ---------- לקוחות ---------- */
  let phoneSeq = 1100;
  const phone = () => `05${pick([0, 2, 3, 4, 8])}-000-${String(phoneSeq++)}`;
  const CONTACTS = ['יוסי כ.', 'מיכל ל.', 'רונן א.', 'שירן ב.', 'דוד מ.', 'אלינור ש.', 'אבי ר.', 'מורן ד.', 'עמית ג.', 'ליאת ח.', 'גיל פ.', 'נטע ז.', 'יעקב ס.', 'הדר ק.', 'בני ט.'];
  const brand = (real, fake) => USE_BRAND_NAMES ? real : fake;
  const CUSTOMERS = [
    { id: 'delek', name: brand('דלק', 'רשת תחנות דלק (דמה)'), kind: 'רשת תחנות דלק', tier: 'A', terms: 'שוטף + 60', discount: 12, volume: 480000, brand: true, po: true,
      branches: ['קריית אתא', 'עפולה', 'כרמיאל', 'מירון', 'טבריה', 'יוקנעם', 'חדרה', 'בית שמש', 'אשדוד', 'באר שבע', 'נשר', 'נתניה'] },
    { id: 'shuk', name: brand('מחסני השוק', 'רשת סופרמרקטים (דמה)'), kind: 'רשת קמעונאית', tier: 'A', terms: 'שוטף + 90', discount: 10, volume: 520000, brand: true, po: true,
      branches: ['נשר', 'כפר סבא', 'נתניה', 'מודיעין', 'עפולה', 'באר שבע', 'ירושלים', 'אופקים', 'קריית אתא'] },
    { id: 'dimri', name: brand('דימרי', 'חברת בנייה גדולה (דמה)'), kind: 'קבלן ויזם', tier: 'A', terms: 'שוטף + 60', discount: 8, volume: 310000, brand: true, po: true,
      branches: ['קריית גת', 'אשקלון', 'באר שבע'] },
    { id: 'menta', name: brand('מנטה', 'רשת חנויות (דמה)'), kind: 'רשת קמעונאית', tier: 'B', terms: 'שוטף + 60', discount: 5, volume: 90000, brand: true, po: true,
      branches: ['באר שבע', 'אשדוד'] },
    { id: 'galor', name: 'גל-אור מבנים', kind: 'קבלן', tier: 'B', terms: 'שוטף + 30', discount: 4, volume: 120000, branches: ['חיפה', 'נשר'] },
    { id: 'ad', name: 'א.ד. פרויקטים והנדסה', kind: 'קבלן', tier: 'B', terms: 'שוטף + 60', discount: 5, volume: 95000, po: true, branches: ['אשדוד', 'רחובות'] },
    { id: 'rom', name: 'רום הנגב יזמות', kind: 'יזם', tier: 'B', terms: 'שוטף + 45', discount: 3, volume: 70000, branches: ['באר שבע', 'נתיבות'] },
    { id: 'alondor', name: 'קבוצת אלון-דור בנייה', kind: 'קבלן', tier: 'B', terms: 'שוטף + 60', discount: 4, volume: 88000, po: true, branches: ['ירושלים', 'מעלה אדומים'] },
    { id: 'shaked', name: 'מרכז רפואי שקד', kind: 'מוסד', tier: 'B', terms: 'שוטף + 90', discount: 0, volume: 64000, po: true, branches: ['ירושלים'] },
    { id: 'ofek', name: 'מכללת אופק דרום', kind: 'מוסד', tier: 'B', terms: 'שוטף + 90', discount: 0, volume: 52000, po: true, branches: ['באר שבע'] },
    { id: 'koltov', name: 'סופר כל-טוב', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 18000, branches: ['נתיבות'] },
    { id: 'lechem', name: 'מאפיית לחם הבית', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 9000, branches: ['אשקלון'] },
    { id: 'optika', name: 'אופטיקה עין טובה', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 7000, branches: ['רחובות'] },
    { id: 'derech', name: 'מוסך הדרך', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 6000, branches: ['באר שבע'] },
    { id: 'barzel', name: 'ברזל הנגב', kind: 'תעשייה', tier: 'B', terms: 'שוטף + 30', discount: 2, volume: 41000, branches: ['קריית גת'] },
    { id: 'boker', name: 'קפה בוקר טוב', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 5000, branches: ['תל אביב'] },
    { id: 'or', name: 'רשת גני אור', kind: 'רשת', tier: 'C', terms: 'שוטף + 30', discount: 0, volume: 15000, branches: ['פתח תקווה', 'ראשון לציון'] },
    { id: 'nir', name: 'פארק התעשייה ניר', kind: 'יזם', tier: 'B', terms: 'שוטף + 60', discount: 3, volume: 58000, po: true, branches: ['נוף הגליל'] },
    { id: 'tamar', name: 'בית ספר תמר', kind: 'מוסד', tier: 'C', terms: 'שוטף + 60', discount: 0, volume: 12000, po: true, branches: ['מודיעין'] },
    { id: 'oranim', name: 'מתנ"ס אורנים', kind: 'מוסד', tier: 'C', terms: 'שוטף + 60', discount: 0, volume: 11000, po: true, branches: ['הרצליה'] },
    { id: 'shemesh', name: 'חוות השמש אנרגיה', kind: 'תעשייה', tier: 'B', terms: 'שוטף + 45', discount: 2, volume: 36000, branches: ['אופקים'] },
    { id: 'shili', name: 'שי-לי קוסמטיקה', kind: 'עסק מקומי', tier: 'C', terms: 'מזומן או אשראי', discount: 0, volume: 4000, branches: ['כפר סבא'] },
    { id: 'tchelet', name: 'מלון ים התכלת', kind: 'מלונאות', tier: 'B', terms: 'שוטף + 30', discount: 3, volume: 47000, branches: ['טבריה', 'אשקלון'] },
    { id: 'zahav', name: 'אולמי זהב', kind: 'אירועים', tier: 'C', terms: 'שוטף + 30', discount: 0, volume: 16000, branches: ['ראשון לציון'] },
    { id: 'givaa', name: 'יקבי הגבעה', kind: 'תעשייה', tier: 'C', terms: 'שוטף + 30', discount: 0, volume: 13000, branches: ['בית שמש'] },
    { id: 'technogas', name: 'טכנו-גז שירותים', kind: 'תעשייה', tier: 'B', terms: 'שוטף + 45', discount: 2, volume: 29000, po: true, branches: ['חדרה'] },
    { id: 'merkaz', name: 'מרכז מסחרי הגפן', kind: 'נדל"ן מסחרי', tier: 'B', terms: 'שוטף + 60', discount: 3, volume: 66000, po: true, branches: ['פתח תקווה'] },
    { id: 'aviv', name: 'אביב שיווק והפצה', kind: 'הפצה', tier: 'C', terms: 'שוטף + 30', discount: 0, volume: 14000, branches: ['קריית אתא'] }
  ];
  CUSTOMERS.forEach((c, i) => {
    c.contact = { name: CONTACTS[i % CONTACTS.length], role: c.brand ? 'רכש ותפעול' : 'בעלים', phone: phone(), email: `orders${i + 1}@example.co.il` };
    const multi = c.branches.length > 1;
    c.branches = c.branches.map(city => ({ name: c.brand || multi ? `${c.name} ${city}` : c.name, city, region: CITIES[city][2] }));
    if (c.id === 'dimri') { c.branches[0].name = `${c.name} - מגרש כרמי גת צפון`; c.legal = 'י.ח. דמרי בניה ופיתוח בע"מ'; }
    if (c.id === 'delek') c.branches.forEach(b => { if (b.city === 'מירון') b.name = `${c.name} תחנת מירון`; });
    if (c.id === 'shuk') c.branches.forEach(b => { if (b.city === 'נתניה') b.name = `${c.name} לב יסמין נתניה`; if (b.city === 'מודיעין') b.name = `${c.name} מליבו מודיעין`; if (b.city === 'ירושלים') b.name = `${c.name} תלפיות`; });
  });
  const cust = id => CUSTOMERS.find(c => c.id === id);
  const branchOf = (cid, city) => (cust(cid).branches.find(b => b.city === city) || cust(cid).branches[0]);

  /* ---------- קטלוג פריטים ---------- */
  const ITEMS = [
    { id: 'pach', name: 'שלט פח', machine: 'efi', unit: 'יח\'', base: 110, m2: 1250, mat: 'פח 0.8 מ"מ', after: 'הדפסה ב-EFI + למינציה' },
    { id: 'safety', name: 'שלט בטיחות', machine: 'efi', unit: 'יח\'', base: 70, m2: 900, mat: 'פח 0.8 מ"מ', after: 'הדפסה ב-EFI' },
    { id: 'pvc', name: 'שלט PVC', machine: 'cnc', unit: 'יח\'', base: 90, m2: 950, mat: 'PVC 10 מ"מ', after: 'הדפסת EFI + חיתוך CNC' },
    { id: 'letters', name: 'אותיות בנויות', machine: 'cnc', unit: 'סט', base: 900, m2: 3800, mat: 'אלומיניום 1.5 מ"מ', after: 'חיתוך + צביעה בתנור' },
    { id: 'lit', name: 'אותיות מוארות', machine: 'cnc', unit: 'סט', base: 2400, m2: 6200, mat: 'פרספקס 4 מ"מ + לד', after: 'חיתוך + הרכבת תאורה' },
    { id: 'lightbox', name: 'ארגז תאורה', machine: 'cnc', unit: 'יח\'', base: 1500, m2: 3200, mat: 'אלומיניום + פרספקס חלבי', after: 'חיתוך + הרכבה' },
    { id: 'vitrine', name: 'מדבקת ויטרינה', machine: 'mimaki', unit: 'יח\'', base: 60, m2: 260, mat: 'ויניל מונומרי', after: 'חיתוך פלוטר' },
    { id: 'frost', name: 'מדבקה חלבית לחלון', machine: 'mimaki', unit: 'מ"ר', base: 40, m2: 210, mat: 'ויניל חלבי', after: 'חיתוך פלוטר' },
    { id: 'car', name: 'שילוט רכב', machine: 'mimaki', unit: 'רכב', base: 450, m2: 380, mat: 'ויניל יצוק + למינציה', after: 'חיתוך + הדבקה' },
    { id: 'mesh', name: 'רשת בניין (מש)', machine: 'mimaki', unit: 'מ"ר', base: 0, m2: 48, mat: 'מש 270 גר\'', after: 'אילתורים כל 50 ס"מ' },
    { id: 'fence', name: 'גדר איסכורית מודפסת', machine: 'efi', unit: 'מטר', base: 115, m2: 0, mat: 'איסכורית + מדבקה', after: 'הדפסה + הדבקה' },
    { id: 'flags', name: 'דגלים לאתר בנייה', machine: 'mimaki', unit: 'יח\'', base: 85, m2: 160, mat: 'בד דגלים', after: 'תפירה + כיס לעמוד' },
    { id: 'kapa', name: 'שלט קאפה', machine: 'efi', unit: 'יח\'', base: 45, m2: 380, mat: 'קאפה 5 מ"מ', after: 'הדפסה ישירה' },
    { id: 'perspex', name: 'הדפסה על פרספקס', machine: 'efi', unit: 'יח\'', base: 120, m2: 1450, mat: 'פרספקס 4 מ"מ', after: 'הדפסה הפוכה + ריווח' },
    { id: 'glass', name: 'הדפסה על זכוכית', machine: 'glass', unit: 'מ"ר', base: 380, m2: 0, mat: 'זכוכית לקוח', after: 'הדפסה UV + הדבקה' },
    { id: 'openclose', name: 'שלט סגור / פתוח', machine: 'efi', unit: 'יח\'', base: 65, m2: 0, mat: 'פרספקס 3 מ"מ', after: 'הדפסה דו צדדית' },
    { id: 'rollup', name: 'רול-אפ', machine: 'mimaki', unit: 'יח\'', base: 260, m2: 0, mat: 'מתקן + הדפסה', after: 'הרכבה במתקן' },
    { id: 'shirts', name: 'חולצות מודפסות', machine: 'shirts', unit: 'יח\'', base: 28, m2: 0, mat: 'כותנה', after: 'הדפסה' },
    { id: 'dtf', name: 'הדפסת DTF', machine: 'dtf', unit: 'יח\'', base: 14, m2: 0, mat: 'סרט DTF', after: 'כבישה' },
    { id: 'pole', name: 'שלט עמוד', machine: 'cnc', unit: 'יח\'', base: 850, m2: 1500, mat: 'אלומיניום + עמוד 3"', after: 'חיתוך + ריתוך' },
    { id: 'alucobond', name: 'חיפוי לוקובונד', machine: 'cnc', unit: 'מ"ר', base: 620, m2: 0, mat: 'לוקובונד 4 מ"מ', after: 'כרסום וכיפוף' },
    { id: 'crane', name: 'שילוט מנוף', machine: 'mimaki', unit: 'יח\'', base: 350, m2: 140, mat: 'מש מחוזק', after: 'אילתורים + חבקים' },
    { id: 'fuelprice', name: 'מתקן מחירי דלק', machine: 'efi', unit: 'יח\'', base: 380, m2: 0, mat: 'פרספקס + מספרים מתחלפים', after: 'הדפסה + חיתוך' },
    { id: 'replace', name: 'החלפת הדבקה בשטח', machine: null, unit: 'שירות', base: 280, m2: 0, mat: '', after: 'התקנה בלבד' }
  ];
  const item = id => ITEMS.find(i => i.id === id);
  const area = size => { const m = /^(\d+)\/(\d+)$/.exec(size || ''); return m ? (Number(m[1]) * Number(m[2])) / 10000 : 0; };
  const round5 = n => Math.round(n / 5) * 5;
  const TIER = { A: 0.86, B: 1, C: 1.18 };
  function listPrice(itemId, size, tier) { const it = item(itemId); return Math.max(round5((it.base + it.m2 * area(size)) * TIER[tier || 'B']), 10); }

  /* ---------- תבניות עבודה (בסגנון הגיליון) ---------- */
  const JOBS = [
    { item: 'pach', size: '300/150', qty: [1, 2], desc: 'שלט פח 300/150 ס"מ עם מסגרת עץ', for: ['dimri', 'ad', 'alondor', 'rom', 'galor'] },
    { item: 'pach', size: '40/30', qty: [4, 20], desc: 'שלטי פח 40/30 לפי רשימה', for: ['delek', 'shuk', 'dimri', 'menta'] },
    { item: 'safety', size: '50/70', qty: [2, 10], desc: 'שלטי "סכנה כאן בונים" 50/70 עם אייקון', for: ['dimri', 'ad', 'alondor', 'galor', 'rom'] },
    { item: 'fuelprice', size: '', qty: [1, 2], desc: 'אספקת מתקן מחירים כולל מספרי הנחה', for: ['delek'] },
    { item: 'vitrine', size: '60/40', qty: [2, 6], desc: 'מדבקות ויטרינה למבצע החודשי', for: ['shuk', 'menta', 'koltov', 'optika', 'shili'] },
    { item: 'replace', size: '', qty: [1, 1], desc: 'החלפת הדבקה בחלון הראווה', for: ['shuk', 'delek', 'menta'] },
    { item: 'lightbox', size: '200/70', qty: [1, 1], desc: 'ארגז תאורה לחזית + החלפת פנים', for: ['shuk', 'koltov', 'lechem', 'derech'] },
    { item: 'letters', size: '540/90', qty: [1, 1], desc: 'אותיות בנויות לחזית, 13 אותיות, חיתוך לפי קובץ', for: ['shuk', 'nir', 'merkaz', 'tchelet', 'barzel'] },
    { item: 'lit', size: '400/80', qty: [1, 1], desc: 'אותיות מוארות לחזית הבניין', for: ['merkaz', 'tchelet', 'zahav', 'shaked'] },
    { item: 'mesh', size: '1200/800', qty: [1, 2], desc: 'רשת בניין מודפסת לפי ההדמיה', for: ['dimri', 'alondor', 'rom', 'ad'] },
    { item: 'fence', size: '', qty: [40, 120], desc: 'גדר איסכורית מודפסת לאורך המגרש', for: ['dimri', 'alondor', 'ad', 'galor'] },
    { item: 'flags', size: '100/300', qty: [6, 20], desc: 'דגלים לאתר בנייה עם לוגו', for: ['dimri', 'rom', 'alondor'] },
    { item: 'pvc', size: '120/50', qty: [1, 6], desc: 'שלטי הכוונה PVC לפי הנחיה', for: ['shaked', 'ofek', 'tamar', 'oranim', 'nir'] },
    { item: 'kapa', size: '70/50', qty: [5, 30], desc: 'שלטי קאפה לאירוע', for: ['zahav', 'ofek', 'tamar', 'oranim', 'or'] },
    { item: 'perspex', size: '60/40', qty: [1, 4], desc: 'שלט כניסה מפרספקס עם ריווח', for: ['shaked', 'optika', 'shili', 'merkaz'] },
    { item: 'glass', size: '', qty: [4, 18], desc: 'הדפסה על זכוכית למשרדים', for: ['merkaz', 'nir', 'technogas'] },
    { item: 'car', size: '', qty: [1, 4], desc: 'שילוט רכבי שירות', for: ['technogas', 'aviv', 'derech', 'shemesh'] },
    { item: 'shirts', size: '', qty: [20, 120], desc: 'חולצות עובדים עם לוגו', for: ['barzel', 'technogas', 'aviv', 'shemesh', 'or'] },
    { item: 'dtf', size: '', qty: [30, 200], desc: 'הדפסות DTF לביגוד', for: ['or', 'zahav', 'aviv'] },
    { item: 'pole', size: '150/100', qty: [1, 2], desc: 'שלט עמוד דו צדדי בכניסה', for: ['nir', 'ofek', 'shaked', 'merkaz'] },
    { item: 'alucobond', size: '', qty: [12, 40], desc: 'חיפוי לוקובונד לחזית', for: ['merkaz', 'nir', 'tchelet'] },
    { item: 'crane', size: '600/150', qty: [1, 2], desc: 'שילוט מנוף עם שם הפרויקט', for: ['dimri', 'alondor'] },
    { item: 'openclose', size: '', qty: [1, 3], desc: 'שלט סגור / פתוח', for: ['koltov', 'lechem', 'boker', 'optika', 'shili'] },
    { item: 'rollup', size: '', qty: [1, 4], desc: 'רול-אפ לכנס', for: ['ofek', 'shaked', 'zahav', 'technogas'] },
    { item: 'frost', size: '', qty: [6, 20], desc: 'מדבקה חלבית לחדרי ישיבות', for: ['merkaz', 'nir', 'shaked'] }
  ];
  const NOTES = ['שלחי 2 דוגמאות לפני ביצוע', 'ההתקנה השבוע!', 'לפי המייל ששלחו', 'לבדוק מידות מול הצילום מהשטח', 'לוגו לפי הקובץ שהלקוח שלח', 'לשאול את אורן לגבי הצבע', 'קובץ במייל', 'אותו דבר כמו בפעם הקודמת', 'מידה סופית אחרי מדידה בשטח', 'לתאם הגעה מראש, צריך אישור כניסה לרכב', 'הלקוח ביקש לראות סקיצה בווטסאפ', '', '', ''];
  const CHANNELS = ['ווטסאפ', 'ווטסאפ', 'ווטסאפ', 'מייל', 'מייל', 'טלפון'];
  const SLOTS = ['07:30-09:30', '09:30-11:30', '11:30-13:30', '13:30-15:30', '15:30-17:30'];
  const FIXES = ['הלוגו גדול יותר', 'להחליף לצבע של החברה', 'לתקן את הטלפון בתחתית', 'להוסיף "בהנהלת"'];

  /* ---------- הזמנות ---------- */
  const ORDERS = [];
  let orderNo = 18840, quoteNo = 24410, deliveryNo = 34700, invoiceNo = 30120;
  const machineName = id => (MACHINES.find(m => m.id === id) || { name: 'התקנה בלבד' }).name;

  function makeOrder(o) {
    const job = o.job || pick(JOBS);
    const cid = o.customer || pick(job.for);
    const c = cust(cid);
    const br = o.city ? branchOf(cid, o.city) : pick(c.branches);
    const qty = o.qty || between(job.qty[0], job.qty[1]);
    const it = item(job.item);
    const lines = [{ item: job.item, name: it.name, size: job.size, qty, unit: it.unit, mat: it.mat, after: it.after, price: listPrice(job.item, job.size, c.tier) }];
    (o.extra || []).forEach(x => { const xi = item(x.item); lines.push({ item: x.item, name: xi.name, size: x.size || '', qty: x.qty, unit: xi.unit, mat: xi.mat, after: xi.after, price: listPrice(x.item, x.size, c.tier) }); });
    const no = String(++orderNo).padStart(6, '0');
    const stage = o.stage;
    const createdDays = o.createdDays != null ? o.createdDays : (stage >= 8 ? between(3, 18) : between(0, 6));
    const g = Math.max(createdDays - 1, 0);
    const order = {
      no, customer: cid, branch: br.name, city: br.city, region: br.region,
      title: o.title || job.desc, lines, channel: o.channel || pick(CHANNELS), enteredBy: o.enteredBy || pick(ENTERERS),
      stage, urgent: !!o.urgent, machine: job.item === 'replace' ? null : it.machine,
      note: o.note != null ? o.note : pick(NOTES), createdAt: at(-createdDays, between(8, 15), pick([5, 12, 20, 34, 41, 48, 55])),
      due: day(o.dueDays != null ? o.dueDays : between(0, 5)),
      needsGraphics: job.item === 'replace' ? false : (o.needsGraphics != null ? o.needsGraphics : R() < 0.38),
      graphics: { versions: [], sentAt: null, approvedAt: null },
      production: { assignee: null, checklist: { material: false, printed: false, cut: false, packed: false } },
      install: null,
      docs: { quoteNo: null, deliveryNo: null, invoiceNo: null, signed: false, signedAt: null, signer: null, po: null },
      log: []
    };
    order.total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    if (stage >= 2) order.docs.quoteNo = String(++quoteNo).padStart(6, '0');
    if (stage >= 4) {
      order.graphics.versions.push({ v: 1, by: order.needsGraphics ? 'אינה' : 'קובץ מהלקוח', at: at(-g, 11, 10) });
      if (stage >= 5) order.graphics.sentAt = o.sentAt || at(-g, 12, 5);
      if (stage >= 5 && order.needsGraphics && R() < 0.5) order.graphics.versions.push({ v: 2, by: 'אינה', at: at(-g, 13, 30), fix: pick(FIXES) });
      if (stage >= 6) order.graphics.approvedAt = at(-g, 14, 32);
    }
    if (stage >= 6) order.production.assignee = (MACHINES.find(m => m.id === order.machine) || {}).operator || 'מתן';
    if (stage >= 7) order.production.checklist = { material: true, printed: true, cut: true, packed: true };
    if (stage === 6) { ['material', 'printed', 'cut', 'packed'].slice(0, between(0, 3)).forEach(x => { order.production.checklist[x] = true; }); }
    if (o.install) order.install = Object.assign({ team: null, date: null, slot: null, status: 'scheduled', photos: [], contact: c.contact.name }, o.install);
    if (stage >= 8) order.docs.deliveryNo = String(++deliveryNo).padStart(6, '0');
    if (c.po && stage >= 3) order.docs.po = `${between(4500, 4599)}-${between(1000, 9999)}`;
    const L = order.log;
    L.push({ at: order.createdAt, who: order.enteredBy, text: `ההזמנה נפתחה (${order.channel})` });
    if (stage >= 2) L.push({ at: order.createdAt, who: 'סמדר', text: `הצעת מחיר ${order.docs.quoteNo} נוצרה ברווחית ונשלחה ללקוח` });
    if (stage >= 3) L.push({ at: order.createdAt, who: 'המערכת', text: 'הלקוח אישר את הצעת המחיר' });
    order.graphics.versions.forEach(v => L.push({ at: v.at, who: v.by, text: `גרפיקה גרסה ${v.v}${v.fix ? ' (תיקון: ' + v.fix + ')' : ''}` }));
    if (order.graphics.sentAt) L.push({ at: order.graphics.sentAt, who: 'סמדר', text: 'הסקיצה נשלחה ללקוח לאישור בווטסאפ' });
    if (order.graphics.approvedAt) L.push({ at: order.graphics.approvedAt, who: 'המערכת', text: 'הלקוח אישר את הגרפיקה' });
    if (stage >= 7) L.push({ at: order.graphics.approvedAt || order.createdAt, who: order.production.assignee || 'מתן', text: `הייצור הסתיים (${machineName(order.machine)})` });
    ORDERS.push(order);
    return order;
  }

  /* ----- הושלמו החודש (שלב 8): 84 תעודות משלוח ----- */
  // 40 עם חשבונית, 15 מוכנות לחשבונית, 6 חתומות בלי הזמנת רכש, 15 עם הזמנת רכש בלי חתימה, 8 בלי שניהם
  const DN_PLAN = [].concat(Array(40).fill('inv'), Array(15).fill('ready'), Array(6).fill('signedOnly'), Array(15).fill('poOnly'), Array(8).fill('none'));
  for (let i = DN_PLAN.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = DN_PLAN[i]; DN_PLAN[i] = DN_PLAN[j]; DN_PLAN[j] = t; }
  const POOL = ['delek', 'delek', 'shuk', 'shuk', 'shuk', 'dimri', 'dimri', 'menta', 'ad', 'alondor', 'shaked', 'ofek', 'nir', 'merkaz', 'technogas', 'tamar', 'oranim'];
  DN_PLAN.forEach(kind => {
    const cid = pick(POOL); const jobs = JOBS.filter(j => j.for.includes(cid)); const job = jobs.length ? pick(jobs) : pick(JOBS);
    const done = between(1, 11);
    const teamId = pick(TEAMS).id;
    const o = makeOrder({ job, customer: cid, stage: 8, createdDays: done + between(1, 4), dueDays: -done, install: { team: teamId, date: day(-done), slot: pick(SLOTS), status: 'done', photos: [1, 2] } });
    const signed = kind === 'inv' || kind === 'ready' || kind === 'signedOnly';
    const po = kind === 'inv' || kind === 'ready' || kind === 'poOnly';
    o.docs.signed = signed; o.docs.signedAt = signed ? at(-done, between(9, 16), 20) : null; o.docs.signer = signed ? cust(cid).contact.name : null;
    o.docs.po = po ? `${between(4500, 4599)}-${between(1000, 9999)}` : null;
    if (kind === 'inv') o.docs.invoiceNo = String(++invoiceNo).padStart(6, '0');
    o.log.push({ at: at(-done, 12, 0), who: TEAMS.find(t => t.id === teamId).name, text: signed ? 'הותקן. תעודת משלוח נחתמה בשטח' : 'הותקן. התעודה נשלחה בווטסאפ בלי חתימה' });
    if (kind === 'inv') o.log.push({ at: at(-done + 1 > 0 ? 0 : -done + 1, 9, 0), who: 'ורד', text: `חשבונית ${o.docs.invoiceNo} הופקה ברווחית` });
  });

  /* ----- הזמנות פתוחות לפי שלב ----- */
  [[1, 6], [2, 9], [3, 6], [4, 10], [5, 9], [6, 14]].forEach(([stage, n]) => {
    for (let i = 0; i < n; i++) makeOrder({ stage, urgent: R() < 0.12, dueDays: stage <= 3 ? between(2, 8) : between(0, 5) });
  });

  /* ----- הזמנות "גיבור" של הסיפור ----- */
  const J = s => JOBS.find(j => j.desc.indexOf(s) === 0) || JOBS[0];
  const H = {};
  H.delekAta = makeOrder({ job: J('אספקת מתקן מחירים'), customer: 'delek', city: 'קריית אתא', stage: 5, urgent: true, channel: 'ווטסאפ', enteredBy: 'סמדר', needsGraphics: true, createdDays: 2, dueDays: 2, note: 'הלקוח ביקש לראות סקיצה בווטסאפ', sentAt: minsAgo(60 * 26), extra: [{ item: 'vitrine', size: '60/40', qty: 2 }] });
  H.dimriGat = makeOrder({ job: J('שלט פח 300/150'), customer: 'dimri', city: 'קריית גת', stage: 4, channel: 'מייל', enteredBy: 'אורן', needsGraphics: true, createdDays: 1, dueDays: 4, note: 'לפי ההדמיה ששלחו במייל', extra: [{ item: 'fence', qty: 80 }, { item: 'safety', size: '50/70', qty: 6 }] });
  H.dimriGat.title = 'שלט פרויקט 300/150 + גדר איסכורית כ-80 מטר + שלטי בטיחות';

  /* ----- התקנות: היום, מחר, ובהמשך השבוע ----- */
  const ROUTES = {
    0: { noam: [['shuk', 'נתניה'], ['shuk', 'כפר סבא'], ['oranim', 'הרצליה'], ['delek', 'חדרה']],
         meir: [['shuk', 'נשר'], ['delek', 'קריית אתא'], ['galor', 'חיפה']],
         nisim: [['shuk', 'ירושלים'], ['shaked', 'ירושלים'], ['delek', 'בית שמש']],
         tzita: [['menta', 'באר שבע'], ['lechem', 'אשקלון'], ['koltov', 'נתיבות']],
         ido: [['menta', 'אשדוד'], ['optika', 'רחובות']] },
    1: { noam: [['shuk', 'עפולה'], ['nir', 'נוף הגליל'], ['delek', 'כרמיאל'], ['delek', 'מירון'], ['tchelet', 'טבריה']],
         meir: [['shuk', 'באר שבע'], ['dimri', 'קריית גת'], ['tchelet', 'אשקלון']],
         nisim: [['alondor', 'ירושלים'], ['alondor', 'מעלה אדומים']],
         tzita: [['zahav', 'ראשון לציון'], ['shuk', 'מודיעין']],
         ido: [['merkaz', 'פתח תקווה'], ['boker', 'תל אביב']] }
  };
  const kmD = (a, b) => { const A = CITIES[a], B = CITIES[b]; const dLat = (B[0] - A[0]) * Math.PI / 180, dLon = (B[1] - A[1]) * Math.PI / 180; const x = Math.sin(dLat / 2) ** 2 + Math.cos(A[0] * Math.PI / 180) * Math.cos(B[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(x)); };
  Object.keys(ROUTES).forEach(k => Object.keys(ROUTES[k]).forEach(team => { const left = ROUTES[k][team].slice(); const out = []; let cur = BASE_CITY; while (left.length) { left.sort((a, b) => kmD(cur, a[1]) - kmD(cur, b[1])); const n = left.shift(); out.push(n); cur = n[1]; } ROUTES[k][team] = out; }));
  const doneToday = { meir: 1, nisim: 1, tzita: 2, noam: 1, ido: 0 };
  const SKIP = ['shirts', 'dtf', 'rollup', 'kapa'];
  Object.keys(ROUTES).forEach(k => {
    const dOff = Number(k);
    Object.keys(ROUTES[k]).forEach(team => {
      ROUTES[k][team].forEach(([cid, city], idx) => {
        const jobs = JOBS.filter(j => j.for.includes(cid) && SKIP.indexOf(j.item) < 0); const job = jobs.length ? pick(jobs) : J('שלטי פח 40/30');
        const isDone = dOff === 0 && idx < doneToday[team];
        const o = makeOrder({ job, customer: cid, city, stage: isDone ? 8 : 7, createdDays: between(2, 6), dueDays: dOff, urgent: !isDone && R() < 0.12,
          install: { team, date: day(dOff), slot: SLOTS[Math.min(idx, SLOTS.length - 1)], status: isDone ? 'done' : 'scheduled', photos: isDone ? [1, 2] : [] } });
        if (isDone) { o.docs.signed = true; o.docs.signedAt = at(0, 8 + idx, 50); o.docs.signer = cust(cid).contact.name; o.docs.po = o.docs.po || null; o.log.push({ at: o.docs.signedAt, who: TEAMS.find(t => t.id === team).name, text: 'הותקן. תעודת משלוח נחתמה דיגיטלית בשטח' }); }
        if (cid === 'shuk' && city === 'נשר') {
          H.shukNesher = o; o.title = 'שלט חזית חיצוני + 4 יחידות לקופות';
          o.lines = [
            { item: 'lightbox', name: 'ארגז תאורה', size: '400/90', qty: 1, unit: 'יח\'', mat: 'אלומיניום + פרספקס חלבי', after: 'חיתוך + הרכבה', price: listPrice('lightbox', '400/90', 'A') },
            { item: 'perspex', name: 'הדפסה על פרספקס', size: '200/40', qty: 4, unit: 'יח\'', mat: 'פרספקס 4 מ"מ', after: 'הדפסה הפוכה + ריווח', price: listPrice('perspex', '200/40', 'A') }
          ];
          o.total = o.lines.reduce((s, l) => s + l.price * l.qty, 0); o.machine = 'cnc';
          o.note = 'יש יחידה אחת מהגדול ו-4 יחידות מהקטן, כל יחידה 2 מטר';
        }
      });
    });
  });
  // שתי התחנות שנשכחו: מוכנות להתקנה, באזור של מסלול מחר, ולא שובצו
  H.missedYokneam = makeOrder({ job: J('החלפת הדבקה'), customer: 'delek', city: 'יוקנעם', stage: 7, createdDays: 5, dueDays: -1, note: 'מוכן במחסן כבר 3 ימים', install: { team: null, date: null, slot: null, status: 'unscheduled' } });
  H.missedYokneam.title = 'החלפת הדבקה במתקן המחירים + 2 מדבקות ויטרינה';
  H.missedOfakim = makeOrder({ job: J('ארגז תאורה'), customer: 'shuk', city: 'אופקים', stage: 7, createdDays: 4, dueDays: 0, note: 'מוכן, ממתין לשיבוץ', install: { team: null, date: null, slot: null, status: 'unscheduled' } });
  // בהמשך השבוע
  [[2, 'nisim', 'givaa', 'בית שמש'], [2, 'ido', 'or', 'ראשון לציון'], [3, 'noam', 'technogas', 'חדרה'], [3, 'tzita', 'rom', 'באר שבע'], [4, 'meir', 'barzel', 'קריית גת'], [4, 'nisim', 'shaked', 'ירושלים']].forEach(([d, team, cid, city], i) => {
    const jobs = JOBS.filter(j => j.for.includes(cid) && SKIP.indexOf(j.item) < 0);
    makeOrder({ job: jobs.length ? pick(jobs) : JOBS[0], customer: cid, city, stage: 7, dueDays: d, install: { team, date: day(d), slot: SLOTS[i % 3], status: 'scheduled' } });
  });

  ORDERS.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /* ---------- היסטוריית מחירים ---------- */
  const PRICE_HISTORY = [];
  const monthsAgo = n => { const d = new Date(TODAY); d.setDate(1); d.setMonth(d.getMonth() - n); d.setDate(between(3, 26)); if (d.getDay() === 6) d.setDate(d.getDate() + 1); return iso(d); };
  let phDoc = 23900;
  // הגיבור: דלק, שלט פח 40/30. "היא צריכה ללכת לחשבוניות אחורה עד פברואר"
  [[8, 260], [6, 260], [4, 260], [1, 275]].forEach(([m, p]) => PRICE_HISTORY.push({ customer: 'delek', item: 'pach', size: '40/30', price: p, date: monthsAgo(m), doc: String(++phDoc).padStart(6, '0'), qty: between(6, 20) }));
  [['shuk', 245], ['dimri', 285], ['menta', 295], ['ad', 310], ['koltov', 340], ['galor', 305]].forEach(([cid, p], i) => PRICE_HISTORY.push({ customer: cid, item: 'pach', size: '40/30', price: p, date: monthsAgo(1 + i % 5), doc: String(++phDoc).padStart(6, '0'), qty: between(2, 12) }));
  const SIZED = JOBS.filter(j => j.size);
  for (let i = 0; i < 120; i++) {
    const job = pick(SIZED); const cid = pick(job.for); const c = cust(cid);
    if (cid === 'delek' && job.item === 'pach' && job.size === '40/30') continue;
    PRICE_HISTORY.push({ customer: cid, item: job.item, size: job.size, price: round5(listPrice(job.item, job.size, c.tier) * (0.94 + R() * 0.12)), date: monthsAgo(between(0, 11)), doc: String(++phDoc).padStart(6, '0'), qty: between(job.qty[0], job.qty[1]) });
  }
  PRICE_HISTORY.sort((a, b) => b.date.localeCompare(a.date));

  /* ---------- פיד "נכנס עכשיו" ---------- */
  const FEED = [
    { type: 'wa', m: 4, text: 'ווטסאפ מדלק קריית אתא: "מה עם הסקיצה של המתקן? צריכים עד חמישי"', link: '#/orders/' + H.delekAta.no },
    { type: 'sign', m: 11, text: 'נועם: תעודת משלוח נחתמה בשטח, מחסני השוק לב יסמין נתניה', link: '#/field?team=noam' },
    { type: 'mail', m: 19, text: 'מייל מדימרי: הדמיה מעודכנת לשלט הפרויקט בכרמי גת', link: '#/orders/' + H.dimriGat.no },
    { type: 'approve', m: 33, text: 'מנטה באר שבע אישרו את הגרפיקה בווטסאפ (לחצו 1)', link: '#/graphics' },
    { type: 'prod', m: 47, text: 'CNC: האותיות הבנויות לפארק התעשייה ניר מוכנות לצביעה', link: '#/production' },
    { type: 'quote', m: 58, text: 'הצעת מחיר נשלחה לקבוצת אלון-דור בנייה, ממתינה לאישור', link: '#/orders?view=list&stage=2' },
    { type: 'sign', m: 72, text: 'מאיר: תעודת משלוח נחתמה בשטח, מחסני השוק נשר', link: '#/orders/' + H.shukNesher.no },
    { type: 'wa', m: 90, text: 'ווטסאפ ממרכז מסחרי הגפן: "אפשר להקדים את ההתקנה למחר?"', link: '#/installs' },
    { type: 'alert', m: 118, text: '3 הצעות מחיר לא נענו כבר 3 ימים', link: '#/orders?view=list&stage=2' }
  ].map(f => Object.assign(f, { at: minsAgo(f.m) }));
  const LIVE = [
    { type: 'wa', text: 'ווטסאפ חדש ממחסני השוק עפולה: "צריכים עוד 2 מדבקות מבצע לשבוע הבא"', link: '#/orders?new=1' },
    { type: 'approve', text: 'גל-אור מבנים אישרו את הסקיצה של שלט הפרויקט', link: '#/graphics' },
    { type: 'sign', text: 'ציטה: תעודת משלוח נחתמה בשטח, סופר כל-טוב נתיבות', link: '#/accounting' },
    { type: 'mail', text: 'מייל עם הזמנת רכש 4521-7730 מדלק, הוצמד אוטומטית לתעודה', link: '#/accounting' },
    { type: 'prod', text: 'מימאקי: מדבקות הוויטרינה לדלק קריית אתא הודפסו', link: '#/production' },
    { type: 'wa', text: 'ווטסאפ ממלון ים התכלת: "שולח תמונה של הקיר למדידה"', link: '#/orders' },
    { type: 'sign', text: 'ניסים: תעודת משלוח נחתמה בשטח, מרכז רפואי שקד', link: '#/accounting' },
    { type: 'quote', text: 'רום הנגב יזמות אישרו הצעת מחיר. ההזמנה עברה לגרפיקה', link: '#/graphics' }
  ];

  /* ---------- חשבונית ספק לדמו קליטה בצילום ---------- */
  const SUPPLIER_INVOICE = {
    supplier: 'מתכות הדרום (דמה)', no: '58213', date: day(-2),
    lines: [{ d: 'פח מגולוון 0.8 מ"מ 125/250', q: 20, p: 96 }, { d: 'פרופיל אלומיניום 40/20', q: 36, p: 22 }, { d: 'ברגים ודיבלים לשילוט, קרטון', q: 4, p: 85 }]
  };
  SUPPLIER_INVOICE.net = SUPPLIER_INVOICE.lines.reduce((s, l) => s + l.q * l.p, 0);
  SUPPLIER_INVOICE.vat = Math.round(SUPPLIER_INVOICE.net * 0.18);
  SUPPLIER_INVOICE.total = SUPPLIER_INVOICE.net + SUPPLIER_INVOICE.vat;

  window.DATA = {
    version: 4, today: iso(TODAY), now: NOW.toISOString(), fixedToday: FIXED, useBrandNames: USE_BRAND_NAMES,
    regions: REGIONS, cities: CITIES, baseCity: BASE_CITY, staff: STAFF, teams: TEAMS, machines: MACHINES, stages: STAGES, legend: LEGEND,
    customers: CUSTOMERS, items: ITEMS, jobs: JOBS, orders: ORDERS, priceHistory: PRICE_HISTORY, feed: FEED, live: LIVE, supplierInvoice: SUPPLIER_INVOICE, slots: SLOTS,
    heroes: { delekAta: H.delekAta.no, dimriGat: H.dimriGat.no, shukNesher: H.shukNesher.no, missedYokneam: H.missedYokneam.no, missedOfakim: H.missedOfakim.no },
    counters: { order: orderNo, quote: quoteNo, delivery: deliveryNo, invoice: invoiceNo },
    workDay: day, listPrice: listPrice, area: area
  };
})();
