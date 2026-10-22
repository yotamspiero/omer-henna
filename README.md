# הזמנה · ערב המקווה חינה של עומר

## מה יש בתיקייה
| קובץ | מה זה |
|---|---|
| `index.html` | גרסה 1: עמוד גלילה ארוך |
| `stage.html` | גרסה 2: קשת קבועה שהתוכן מתחלף בתוכה |
| `host.html` | רשימת האישורים לבעלת האירוע |
| `hamsa3d.js` | החמסה המוזהבת בתלת-ממד |
| `music.mp3` | השיר (Tamr Henna) |
| `config.js` | הכתובת של הגיליון: שורה אחת למלא |
| `apps-script.gs` | הקוד שמדביקים בגיליון Google |

שתי הגרסאות שומרות לאותו גיליון. לא משנה מאיזה לינק אורחת אישרה, היא תופיע באותה רשימה.

## שלב 1: גיליון Google
1. נכנסים ל-sheets.new. נפתח גיליון חדש, ונותנים לו שם: "אישורי הגעה עומר".
2. בתפריט: Extensions → Apps Script.
3. מוחקים את כל מה שיש בעורך, ומדביקים את כל התוכן של `apps-script.gs`.
4. בשורה 6 (`HOST_KEY`) מחליפים את `CHANGE-ME-omer-2611` במילה סודית משלך, באותיות באנגלית ומספרים בלבד. שומרים אותה בצד.
5. שומרים (Ctrl+S).

## שלב 2: פרסום הסקריפט
1. Deploy → New deployment.
2. בגלגל השיניים ליד "Select type" בוחרים Web app.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Deploy → Authorize access → בוחרים את חשבון ה-Google שלך.
5. תופיע אזהרה "Google hasn't verified this app". לוחצים Advanced → Go to … (unsafe) → Allow. זה בסדר, זה הקוד שלך.
6. מעתיקים את ה-Web app URL (מסתיים ב-`/exec`).

## שלב 3: חיבור ההזמנה לגיליון
פותחים את `config.js` בכל עורך טקסט ומדביקים את הכתובת בין המירכאות:
```js
window.OMER_CONFIG = {
  endpoint: "https://script.google.com/macros/s/XXXX/exec"
};
```

## שלב 4: העלאה ל-GitHub
1. ב-github.com לוחצים + → New repository.
2. Repository name: `omer-henna`. מסמנים **Public** ← Create repository.
3. בעמוד שנפתח: "uploading an existing file". גוררים את כל הקבצים מהתיקייה (גם `music.mp3`), ← Commit changes.
4. Settings → Pages. ב-Branch בוחרים `main` ו-`/ (root)` ← Save.
5. מחכים 1–2 דקות ומרעננים. למעלה תופיע הכתובת של האתר.

## שלב 5: בדיקה לפני ששולחים
1. פותחים בטלפון את שתי הגרסאות (הלינקים למטה).
2. מאשרים הגעה בשם "בדיקה" מאחת מהן.
3. נכנסים לגיליון. אמורה להופיע שורה בלשונית "אישורים".
4. פותחים את הלינק של בעלת האירוע ובודקים שהבדיקה מופיעה שם.
5. מוחקים את שורת הבדיקה מהגיליון.

## הלינקים
- גרסה 1: `https://<שם-המשתמש>.github.io/omer-henna/`
- גרסה 2: `https://<שם-המשתמש>.github.io/omer-henna/stage.html`
- בעלת האירוע: `https://<שם-המשתמש>.github.io/omer-henna/host.html?key=<המילה-הסודית>`

הגיליון עצמו נשאר אצלך ב-Google Drive. להורדה כאקסל: File → Download → Microsoft Excel. גם בדף של בעלת האירוע יש כפתור "הורדה לאקסל".

## טוב לדעת
- המוזיקה מתחילה בנגיעה הראשונה של האורחת בדף, כי דפדפנים חוסמים ניגון אוטומטי. בפינה יש כפתור להשתקה.
- אורחת שמאשרת שוב מאותו טלפון מעדכנת את השורה שלה ולא יוצרת כפילות.
- אם משנים את `apps-script.gs` אחרי הפרסום: Deploy → Manage deployments → ✏️ → Version: New version → Deploy. ככה הכתובת נשארת אותה כתובת.
- שינוי בקבצים ב-GitHub (טקסט, צבע וכו') מתעדכן באתר תוך דקה-שתיים.
