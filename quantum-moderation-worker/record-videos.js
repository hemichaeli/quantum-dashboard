const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const LIVE_URL = 'https://quantum-moderation.hemichaeli.workers.dev';
const OUTPUT_DIR = path.resolve(__dirname, 'recordings');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function smoothScroll(page, pixels, duration) {
  const steps = 40;
  const stepPx = pixels / steps;
  const stepMs = duration / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((px) => window.scrollBy(0, px), stepPx);
    await sleep(stepMs);
  }
}

(async () => {
  // Clean old recordings
  if (fs.existsSync(OUTPUT_DIR)) {
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, f));
    }
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });

  // ──────────────────────────────────────────────
  // 1. ads_read.mp4 — Dashboard + Action Log
  //    Show stats cards, hover each, scroll to log
  // ──────────────────────────────────────────────
  console.log('\n1/3 Recording: ads_read');
  {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: OUTPUT_DIR, size: { width: 1920, height: 1080 } }
    });
    const page = await ctx.newPage();
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
    await sleep(2500);

    // Hover stat cards one by one
    const cards = await page.$$('.stat-card');
    for (const card of cards) {
      await card.hover();
      await sleep(2000);
    }
    await sleep(1000);

    // Scroll down to action log
    await smoothScroll(page, 500, 3000);
    await sleep(1500);

    // Hover over each log row
    const rows = await page.$$('.log-row');
    for (const row of rows) {
      await row.hover();
      await sleep(2000);
    }
    await sleep(2000);

    await page.close();
    await ctx.close();
    console.log('   ads_read done');
  }

  // ──────────────────────────────────────────────
  // 2. ads_management.mp4 — Manage ads/actions
  //    Show webhook config, copy URL, scroll to log
  // ──────────────────────────────────────────────
  console.log('\n2/3 Recording: ads_management');
  {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: OUTPUT_DIR, size: { width: 1920, height: 1080 } }
    });
    const page = await ctx.newPage();
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    // Scroll to webhook section
    await page.evaluate(() => {
      const el = document.querySelector('[class*="webhook"]') || document.querySelectorAll('section')[1];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(2000);

    // Hover over the webhook URL
    const urlBox = await page.$('.font-mono.text-primary');
    if (urlBox) { await urlBox.hover(); await sleep(2500); }

    // Click copy button
    const copyBtn = await page.$('button[title="Copy URL"]');
    if (copyBtn) { await copyBtn.click(); await sleep(1500); }

    // Hover over status fields
    const statusBox = await page.$('.pulse-dot');
    if (statusBox) {
      const parent = await statusBox.evaluateHandle(el => el.closest('div'));
      if (parent) { await parent.hover(); await sleep(2000); }
    }

    // Scroll to action log
    await smoothScroll(page, 500, 3000);
    await sleep(1500);

    // Hover over log rows
    const rows = await page.$$('.log-row');
    for (const row of rows) {
      await row.hover();
      await sleep(2000);
    }

    // Scroll to permissions section
    await smoothScroll(page, 400, 2500);
    await sleep(2500);

    await page.close();
    await ctx.close();
    console.log('   ads_management done');
  }

  // ──────────────────────────────────────────────
  // 3. pages_manage_engagement.mp4 — Manage comments/content
  //    Focus on action log, show moderation actions
  // ──────────────────────────────────────────────
  console.log('\n3/3 Recording: pages_manage_engagement');
  {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: OUTPUT_DIR, size: { width: 1920, height: 1080 } }
    });
    const page = await ctx.newPage();
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    // Full slow scroll — top to bottom, showing everything
    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    await smoothScroll(page, totalHeight * 0.35, 3000);
    await sleep(1500);

    // Pause on webhook
    await sleep(2000);

    // Continue scroll to log
    await smoothScroll(page, totalHeight * 0.35, 3000);
    await sleep(1500);

    // Hover over each log row slowly
    const rows = await page.$$('.log-row');
    for (const row of rows) {
      await row.hover();
      await sleep(3000);
    }
    await sleep(1500);

    // Scroll to bottom (permissions)
    await smoothScroll(page, totalHeight * 0.3, 2500);
    await sleep(3000);

    await page.close();
    await ctx.close();
    console.log('   pages_manage_engagement done');
  }

  await browser.close();

  // ──────────────────────────────────────────────
  // Rename + convert to mp4
  // ──────────────────────────────────────────────
  console.log('\nRenaming & converting...');
  const webmFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  webmFiles.sort((a, b) => {
    return fs.statSync(path.join(OUTPUT_DIR, a)).mtimeMs - fs.statSync(path.join(OUTPUT_DIR, b)).mtimeMs;
  });

  const names = ['ads_read', 'ads_management', 'pages_manage_engagement'];
  const ffmpeg = 'C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

  for (let i = 0; i < Math.min(webmFiles.length, names.length); i++) {
    const src = path.join(OUTPUT_DIR, webmFiles[i]);
    const dst = path.join(OUTPUT_DIR, names[i] + '.mp4');
    console.log(`  Converting: ${names[i]}.mp4`);
    try {
      execSync(`"${ffmpeg}" -y -i "${src}" -c:v libx264 -preset fast -crf 23 -c:a aac "${dst}"`, { stdio: 'ignore' });
      fs.unlinkSync(src); // remove webm
    } catch (e) {
      console.log(`  Warning: ffmpeg failed for ${names[i]}, keeping .webm`);
      fs.renameSync(src, path.join(OUTPUT_DIR, names[i] + '.webm'));
    }
  }

  console.log(`\nAll videos saved to: ${OUTPUT_DIR}`);
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    const size = (fs.statSync(path.join(OUTPUT_DIR, f)).size / 1024 / 1024).toFixed(1);
    console.log(`  ${f} (${size} MB)`);
  }
})();
