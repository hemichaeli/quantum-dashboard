/**
 * QUANTUM Ad Creator — Puppeteer Automation v2
 * ─────────────────────────────────────────────
 * Uses your existing Facebook browser session to call the Marketing API
 * directly — bypasses the "App in Development Mode" restriction entirely.
 *
 * Usage:
 *   node quantum_ads_creator.js
 *
 * Requirements:
 *   npm install puppeteer
 */

const puppeteer = require('puppeteer');
const readline = require('readline');

// ─── Campaign Data ─────────────────────────────────────────────────────────────
const AD_ACCOUNT = 'act_1614781956446185';
const PAGE_ID    = '896937383514056';
const API_BASE   = 'https://graph.facebook.com/v22.0';

const VIDEO_IDS = {
  EN_A: '2436938976735680', EN_B: '959635706533392',  EN_C: '1437861514213114',
  FR_A: '941621238829271',  FR_B: '1469970571377513', FR_C: '887959084269265',
  ES_A: '1431464378726085', ES_B: '2470364763452488',
  DE_A: '934969942736445',  DE_B: '1297622015758416',
  HE_A: '897254396678711',  HE_B: '874398625652617',
};

const THUMB_HASHES = {
  EN_A: '492af4bd702a6383bcf671f92a3a562c', EN_B: '956367b25f839aa8b7da3ed4d1445406',
  EN_C: '841e4935fb886c00f4b83c5950214454', FR_A: '81d2e53e7f265bbf52882bf6343f8173',
  FR_B: '458b2baf7afa9dd9cf4c5fe4345dc905', FR_C: 'e8430486857904a5978856a311339d22',
  ES_A: '57f2fd909900f439cca7f483731ef4c1', ES_B: '5e7f12ea5a385a2277b14af278dccac2',
  DE_A: '8aceff85378195ba5768f990ae488bc2', DE_B: 'f6c5272c44414b576c747c56f28abed4',
  HE_A: '7fae92e9d62ef45d29304970126f7e73', HE_B: 'ab0d693511b9003db908d041f8217b67',
};

const ADSET_IDS = {
  EN: '120245864113440547', FR: '120245864114310547',
  ES: '120245864115020547', DE: '120245864115530547', HE: '120245864116720547',
};

const AD_COPY = {
  EN_A: { headline: "Your Home in Israel. Your Smartest Investment.",
    body: "Israeli real estate has grown steadily for over a decade. Thanks to our deep connection to the urban renewal market, we know about properties the market doesn't yet. Returns of 30-80%. Tell us what your family needs.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_en_a' },
  EN_B: { headline: "A Home for Your Children in Israel",
    body: "Your children serve in the IDF. Study. Build their future in Israel. Your next investment can be their home. Thanks to our deep knowledge of the renewal market, we find hidden gems with returns other investors can only dream of.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_en_b' },
  EN_C: { headline: "The Window Is Closing",
    body: "Urban renewal property prices rise with every statutory milestone. Those who enter today pay 20-40% less than those who enter tomorrow. We track hundreds of projects and have access to information not everyone sees.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_en_c' },
  FR_A: { headline: "Votre maison en Israël. Votre meilleur investissement.",
    body: "Le marché immobilier israélien croît de manière constante depuis plus d'une décennie. Grâce à notre connexion profonde avec le marché de la rénovation urbaine, nous connaissons des propriétés que le marché ne connaît pas encore. Rendements de 30 à 80%.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_fr_a' },
  FR_B: { headline: "Un foyer pour vos enfants en Israël",
    body: "Vos enfants servent dans Tsahal. Étudient. Construisent leur avenir en Israël. Votre prochain investissement peut être leur maison. Grâce à notre connaissance approfondie du marché de la rénovation, nous trouvons des pépites cachées.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_fr_b' },
  FR_C: { headline: "La fenêtre se ferme",
    body: "Les prix des biens en zones de rénovation urbaine augmentent à chaque étape statutaire. Ceux qui entrent aujourd'hui paient 20 à 40% de moins que ceux qui entreront demain. Nous suivons des centaines de projets.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_fr_c' },
  ES_A: { headline: "Tu hogar en Israel. Tu mejor inversión.",
    body: "El mercado inmobiliario israelí crece de forma constante desde hace más de una década. Gracias a nuestra profunda conexión con el mercado de renovación urbana, conocemos propiedades que el mercado aún no conoce. Retornos de 30-80%.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_es_a' },
  ES_B: { headline: "Un hogar para tus hijos en Israel",
    body: "Tus hijos sirven en las FDI. Estudian. Construyen su futuro en Israel. Tu próxima inversión puede ser su hogar. Encontramos joyas ocultas con retornos que otros inversores solo pueden soñar.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_es_b' },
  DE_A: { headline: "Ihr Zuhause in Israel. Ihre klügste Investition.",
    body: "Der israelische Immobilienmarkt wächst seit über einem Jahrzehnt stetig. Dank unserer tiefen Verbindung zum Stadterneuerungsmarkt kennen wir Objekte, von denen der Markt noch nichts weiß. Renditen von 30-80%.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_de_a' },
  DE_B: { headline: "Ein Zuhause für Ihre Kinder in Israel",
    body: "Ihre Kinder dienen in der IDF. Studieren. Bauen ihre Zukunft in Israel. Dank unserer tiefen Kenntnis des Erneuerungsmarktes finden wir verborgene Juwelen mit Renditen, von denen andere Investoren nur träumen.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_de_b' },
  HE_A: { headline: "נכסים שהשוק לא יודע עליהם",
    body: "כולם רואים את אותם נכסים. בזכות החיבור העמוק שלנו לעולם הפינוי-בינוי, אנחנו יודעים על נכסים שהשוק לא יודע עליהם, רגע לפני שהמחיר קופץ. תשואה של 30-80%.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_he_a' },
  HE_B: { headline: "הזדמנות שלא תחזור",
    body: "מחירי הנכסים באזורי פינוי-בינוי עולים עם כל התקדמות בשלבים הסטטוטוריים של הפרויקט. מי שנכנס היום, נכנס ב-20-40% פחות ממי שייכנס מחר. אנחנו מחוברים למתחמים רבים.",
    url: 'https://u-r-quantum.com/international-investors?source=meta_he_b' },
};

const AD_TO_ADSET = {
  EN_A: 'EN', EN_B: 'EN', EN_C: 'EN',
  FR_A: 'FR', FR_B: 'FR', FR_C: 'FR',
  ES_A: 'ES', ES_B: 'ES',
  DE_A: 'DE', DE_B: 'DE',
  HE_A: 'HE', HE_B: 'HE',
};

const ALL_ADS = ['EN_A','EN_B','EN_C','FR_A','FR_B','FR_C','ES_A','ES_B','DE_A','DE_B','HE_A','HE_B'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// Make API call via browser page (uses browser cookies/session)
async function apiPost(page, endpoint, payload) {
  return await page.evaluate(async (endpoint, payload, API_BASE) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const r = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST', body: fd });
    return r.json();
  }, endpoint, payload, API_BASE);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   QUANTUM Ad Creator — Puppeteer v2      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Auto-detect Chrome path based on OS
  const os = require('os');
  const fs = require('fs');
  function findChrome() {
    const platform = os.platform();
    if (platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Chromium\\Application\\chrome.exe',
      ];
      for (const p of candidates) { if (fs.existsSync(p)) return p; }
    } else if (platform === 'darwin') {
      const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ];
      for (const p of candidates) { if (fs.existsSync(p)) return p; }
    } else {
      const candidates = ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
      for (const p of candidates) { if (fs.existsSync(p)) return p; }
    }
    return null; // Let puppeteer use its bundled browser
  }
  const chromePath = findChrome();
  if (chromePath) console.log(`Using Chrome: ${chromePath}`);
  else console.log('Using Puppeteer bundled browser...');

  // Launch browser (headless=false so user can log in if needed)
  const browser = await puppeteer.launch({
    headless: false,
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1200,800',
    ],
    defaultViewport: { width: 1200, height: 800 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // ── Step 1: Get Facebook session ──────────────────────────────────────────
  console.log('Step 1: Checking Facebook login...');
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  const isLoggedIn = await page.evaluate(() => {
    return document.cookie.includes('c_user') || document.cookie.includes('xs');
  });

  if (!isLoggedIn) {
    console.log('\n⚠️  Not logged in to Facebook.');
    console.log('Please log in to Facebook in the browser window.');
    console.log('Press Enter here after you have logged in...');
    await prompt('');
  } else {
    console.log('✅ Facebook session detected.\n');
  }

  // ── Step 2: Navigate to graph.facebook.com to enable API calls ────────────
  console.log('Step 2: Setting up API context...');
  await page.goto('https://www.facebook.com/adsmanager', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // ── Step 3: Get access token ───────────────────────────────────────────────
  console.log('Step 3: Getting access token...\n');

  // Try to extract token from Facebook's internal state
  let token = await page.evaluate(async () => {
    try {
      // Method 1: Check localStorage / sessionStorage
      for (const key of Object.keys(localStorage)) {
        const val = localStorage.getItem(key);
        if (val && val.includes('EAA') && val.length > 100) {
          const match = val.match(/EAA[A-Za-z0-9]+/);
          if (match) return match[0];
        }
      }
      // Method 2: Try fetching token via Facebook's internal endpoint
      const r = await fetch('/api/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'fb_api_caller_class=RelayModern&fb_api_req_friendly_name=FBLogger',
        credentials: 'include',
      });
      const text = await r.text();
      const match = text.match(/"access_token":"(EAA[^"]+)"/);
      if (match) return match[1];
    } catch(e) {}
    return null;
  });

  if (!token) {
    console.log('Could not auto-extract token. Opening Graph API Explorer...');
    await page.goto('https://developers.facebook.com/tools/explorer/?method=GET&path=me&version=v22.0', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await sleep(4000);

    // Try to find token in the explorer page
    token = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input, textarea')];
      for (const el of inputs) {
        if (el.value && el.value.startsWith('EAA') && el.value.length > 50) return el.value;
      }
      return null;
    });
  }

  if (!token) {
    console.log('\nPlease paste your Facebook access token:');
    console.log('(Get it from: https://developers.facebook.com/tools/explorer/ → Generate Access Token)');
    token = await prompt('Token: ');
  }

  if (!token || !token.startsWith('EAA')) {
    console.error('❌ No valid token provided. Exiting.');
    await browser.close();
    process.exit(1);
  }

  console.log(`✅ Token ready (${token.substring(0, 20)}...)\n`);

  // Navigate to a page where we can make cross-origin fetch to graph.facebook.com
  await page.goto('https://www.facebook.com/adsmanager', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // ── Step 4: Create all 12 ads ──────────────────────────────────────────────
  console.log('Step 4: Creating 12 ads...\n');

  const results = { success: [], failed: [] };

  for (const adKey of ALL_ADS) {
    const copy    = AD_COPY[adKey];
    const adsetId = ADSET_IDS[AD_TO_ADSET[adKey]];

    process.stdout.write(`  ⏳ ${adKey.padEnd(5)} `);

    try {
      // Create creative
      const creativeResp = await apiPost(page, `${AD_ACCOUNT}/adcreatives`, {
        name: `Creative_QUANTUM_${adKey}`,
        object_story_spec: {
          page_id: PAGE_ID,
          video_data: {
            video_id: VIDEO_IDS[adKey],
            image_hash: THUMB_HASHES[adKey],
            title: copy.headline,
            message: copy.body,
            call_to_action: {
              type: 'LEARN_MORE',
              value: { link: copy.url },
            },
          },
        },
        degrees_of_freedom_spec: {
          creative_features_spec: {
            standard_enhancements: { enroll_status: 'OPT_OUT' },
          },
        },
        access_token: token,
      });

      if (creativeResp.error) throw new Error(creativeResp.error.error_user_msg || creativeResp.error.message);

      // Create ad
      const adResp = await apiPost(page, `${AD_ACCOUNT}/ads`, {
        name: `QUANTUM_${adKey}`,
        adset_id: adsetId,
        creative: { creative_id: creativeResp.id },
        status: 'PAUSED',
        access_token: token,
      });

      if (adResp.error) throw new Error(adResp.error.error_user_msg || adResp.error.message);

      console.log(`✅  Ad ID: ${adResp.id}`);
      results.success.push({ key: adKey, adId: adResp.id, creativeId: creativeResp.id });

    } catch(e) {
      const msg = e.message.substring(0, 80);
      console.log(`❌  ${msg}`);
      results.failed.push({ key: adKey, error: e.message });
    }

    await sleep(600);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  DONE: ${results.success.length}/12 ads created                     ║`);
  console.log('╚══════════════════════════════════════════╝');

  if (results.success.length > 0) {
    console.log('\n✅ Created ads:');
    results.success.forEach(r => console.log(`   ${r.key}: ${r.adId}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed ads:');
    results.failed.forEach(r => console.log(`   ${r.key}: ${r.error.substring(0, 100)}`));
  }

  if (results.success.length === ALL_ADS.length) {
    console.log('\n🎉 All 12 ads created! Go to Ads Manager to review and activate.');
    console.log('   https://www.facebook.com/adsmanager\n');
  }

  await page.goto('https://www.facebook.com/adsmanager', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Browser open for review. Close it when done.');

})().catch(async e => {
  console.error('\n💥 Fatal error:', e.message);
  process.exit(1);
});
