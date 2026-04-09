╔══════════════════════════════════════════════════════════════╗
║         QUANTUM Ad Creator — הוראות הפעלה                   ║
╚══════════════════════════════════════════════════════════════╝

דרישות מקדימות (חד פעמי):
  1. התקן Node.js מ: https://nodejs.org (גרסה 18+)
  2. פתח Terminal / Command Prompt בתיקייה שבה שמרת את הקובץ
  3. הרץ: npm install puppeteer

הפעלה:
  node quantum_ads_creator.js

מה הסקריפט עושה:
  1. פותח דפדפן Chrome
  2. עובר ל-Facebook — אם לא מחובר, תתחבר ידנית
  3. מבקש ממך להדביק Access Token (מ-Graph API Explorer)
  4. יוצר אוטומטית 12 מודעות וידאו ב-5 Ad Sets
  5. כל המודעות נשמרות כ-PAUSED לבדיקה לפני הפעלה

לאחר הרצה:
  עבור ל-Ads Manager ובדוק את המודעות לפני הפעלה.
  https://www.facebook.com/adsmanager
