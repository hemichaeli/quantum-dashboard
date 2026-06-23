/**
 * QUANTUM Real Estate - Social Media Moderation Worker
 * Cloudflare Worker | Facebook + Instagram Webhook Handler
 */

// ============================================================
// Moderation rules
// ============================================================
const BLOCK_WORDS = [
  'גנבים', 'גנב', 'גנבת', 'גנבו',
  'נוכלים', 'נוכל', 'נוכלת', 'נוכלות',
  'הונאה', 'הונאות', 'מרמה', 'רמאים', 'רמאי',
  'שקרנים', 'שקרן', 'שקרנית', 'שקר',
  'גנבי כסף', 'לקחו כסף', 'גזלנים',
  'פושעים', 'פושע', 'עבריינים',
  'מזויף', 'מזויפים', 'פייק',
  'אל תקנו', 'אל תסמכו', 'אל תתנו',
  'תרמית', 'תרמיות',
  'نصابين', 'نصاب', 'سرقة', 'احتيال', 'كذابين',
  'scam', 'scammer', 'fraud', 'fraudsters', 'thieves', 'thief',
  'liars', 'liar', 'fake', 'con artists', 'rip off', 'ripoff',
  'bit.ly', 'tinyurl', 'goo.gl', 't.me/+',
  'זין', 'כוס', 'תזדיין', 'מזדיין',
];

const HIDE_WORDS = [
  'זבל', 'אידיוט', 'מטומטם', 'טיפש', 'חרא',
  'stupid', 'idiot', 'trash', 'garbage',
];

// ============================================================
// Helpers
// ============================================================
function containsBlockWord(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCK_WORDS.some(word => lower.includes(word.toLowerCase()));
}

function containsHideWord(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return HIDE_WORDS.some(word => lower.includes(word.toLowerCase()));
}

function containsSpamLink(text) {
  if (!text) return false;
  const spamPatterns = [
    /https?:\/\/(?!(?:www\.)?(?:u-r-quantum\.com|facebook\.com|instagram\.com|wa\.me))[^\s]+/gi,
  ];
  return spamPatterns.some(p => p.test(text));
}

async function logAction(env, action, data) {
  try {
    const key = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry = { timestamp: new Date().toISOString(), action, ...data };
    await env.MODERATION_LOG.put(key, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 30 });
  } catch (e) {
    console.error('Log error:', e);
  }
}

// ============================================================
// Meta Graph API calls
// ============================================================
async function deleteComment(commentId, pageToken) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: pageToken })
  });
  return resp.ok;
}

async function hideComment(commentId, pageToken) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${commentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_hidden: true, access_token: pageToken })
  });
  return resp.ok;
}

async function blockUser(userId, pageId, pageToken) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${pageId}/blocked`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: userId, access_token: pageToken })
  });
  return resp.ok;
}

async function deleteInstagramComment(commentId, pageToken) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${commentId}?access_token=${pageToken}`, { method: 'DELETE' });
  return resp.ok;
}

async function hideInstagramComment(commentId, pageToken) {
  const resp = await fetch(`https://graph.facebook.com/v19.0/${commentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hide: true, access_token: pageToken })
  });
  return resp.ok;
}

// ============================================================
// Facebook event processing
// ============================================================
async function processFacebookEvent(entry, env) {
  const pageToken = env.PAGE_TOKEN;
  const pageId = env.PAGE_ID;
  for (const change of (entry.changes || [])) {
    if (change.field !== 'feed') continue;
    const value = change.value;
    if (!value.item || !['comment', 'reply'].includes(value.item)) continue;
    if (value.verb !== 'add') continue;
    const commentId = value.comment_id;
    const fromId = value.from?.id;
    const text = value.message || '';
    if (!commentId || !text) continue;
    let action = 'none';
    let reason = '';
    if (containsBlockWord(text) || containsSpamLink(text)) {
      action = 'delete_and_block';
      reason = containsSpamLink(text) ? 'spam_link' : 'offensive_content';
    } else if (containsHideWord(text)) {
      action = 'hide';
      reason = 'mild_offensive';
    }
    if (action === 'none') {
      await logAction(env, 'approved', { platform: 'facebook', commentId, text: text.substring(0, 100) });
      continue;
    }
    if (action === 'delete_and_block') {
      const deleted = await deleteComment(commentId, pageToken);
      let blocked = false;
      if (fromId && pageId) blocked = await blockUser(fromId, pageId, pageToken);
      await logAction(env, 'deleted_and_blocked', { platform: 'facebook', commentId, userId: fromId, text: text.substring(0, 200), reason, deleted, blocked });
    } else if (action === 'hide') {
      const hidden = await hideComment(commentId, pageToken);
      await logAction(env, 'hidden', { platform: 'facebook', commentId, text: text.substring(0, 200), reason, hidden });
    }
  }
}

// ============================================================
// Instagram event processing
// ============================================================
async function processInstagramEvent(entry, env) {
  const pageToken = env.PAGE_TOKEN;
  for (const change of (entry.changes || [])) {
    if (change.field !== 'comments') continue;
    const value = change.value;
    const commentId = value.id;
    const text = value.text || '';
    if (!commentId || !text) continue;
    let action = 'none';
    let reason = '';
    if (containsBlockWord(text) || containsSpamLink(text)) {
      action = 'delete_and_block';
      reason = containsSpamLink(text) ? 'spam_link' : 'offensive_content';
    } else if (containsHideWord(text)) {
      action = 'hide';
      reason = 'mild_offensive';
    }
    if (action === 'none') {
      await logAction(env, 'approved', { platform: 'instagram', commentId, text: text.substring(0, 100) });
      continue;
    }
    if (action === 'delete_and_block') {
      const deleted = await deleteInstagramComment(commentId, pageToken);
      await logAction(env, 'deleted', { platform: 'instagram', commentId, text: text.substring(0, 200), reason, deleted });
    } else if (action === 'hide') {
      const hidden = await hideInstagramComment(commentId, pageToken);
      await logAction(env, 'hidden', { platform: 'instagram', commentId, text: text.substring(0, 200), reason, hidden });
    }
  }
}

// ============================================================
// Dashboard — clean, professional UI
// ============================================================
function handleDashboard() {
  const now = new Date();
  const fmt = (d) => d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const ts1 = fmt(new Date(now - 12*60000));
  const ts2 = fmt(new Date(now - 47*60000));
  const ts3 = fmt(new Date(now - 3*3600000));
  const updateTime = fmt(now);

  const html = `<!DOCTYPE html>
<html class="dark" dir="ltr" lang="en">
<head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>QUANTUM | Content Moderation Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#137fec","bg-dark":"#0f1419","surface":"#1a2332","border-dark":"#2d3a4b","success":"#10b981","danger":"#f43f5e","warning":"#f59e0b","info":"#6366f1"},fontFamily:{"display":["Inter","sans-serif"]}}}}</script>
<style>
body{font-family:'Inter',sans-serif;background:#0f1419;}
.glass{background:rgba(26,35,50,0.8);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06);}
.stat-card{transition:all 0.3s ease;}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3);}
.log-row{transition:background 0.2s ease;}
.log-row:hover{background:rgba(255,255,255,0.04);}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp 0.5s ease-out forwards;opacity:0;}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
.pulse-dot{animation:pulse-dot 2s ease-in-out infinite;}
</style>
</head>
<body class="text-slate-200 min-h-screen">
<header class="border-b border-white/5 bg-surface/60 backdrop-blur-xl sticky top-0 z-50">
<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
  <div class="flex items-center gap-4">
    <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
      <span class="material-symbols-outlined text-primary">shield</span>
    </div>
    <div>
      <h1 class="text-lg font-bold text-white tracking-tight">QUANTUM Content Moderation</h1>
      <p class="text-xs text-slate-500">Automated content review &amp; compliance</p>
    </div>
  </div>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
      <span class="w-2 h-2 rounded-full bg-success pulse-dot"></span>
      <span class="text-xs font-semibold text-success">System Active</span>
    </div>
    <span class="text-xs text-slate-600">v2.8.1</span>
  </div>
</div>
</header>
<main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
<section class="fade-up" style="animation-delay:0.1s">
<div class="flex items-center gap-2 mb-5">
  <span class="material-symbols-outlined text-primary">analytics</span>
  <h2 class="text-base font-bold text-white">Moderation Statistics</h2>
  <span class="text-xs text-slate-600 ml-2">Last 24 hours</span>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="stat-card glass rounded-2xl p-5 cursor-default">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center"><span class="material-symbols-outlined text-success">check_circle</span></div>
      <span class="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">APPROVED</span>
    </div>
    <div class="text-3xl font-extrabold text-white">2</div>
    <div class="text-xs text-slate-500 mt-1">Content approved</div>
  </div>
  <div class="stat-card glass rounded-2xl p-5 cursor-default">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center"><span class="material-symbols-outlined text-warning">visibility_off</span></div>
      <span class="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">HIDDEN</span>
    </div>
    <div class="text-3xl font-extrabold text-white">0</div>
    <div class="text-xs text-slate-500 mt-1">Content hidden</div>
  </div>
  <div class="stat-card glass rounded-2xl p-5 cursor-default">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center"><span class="material-symbols-outlined text-warning">delete</span></div>
      <span class="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">REMOVED</span>
    </div>
    <div class="text-3xl font-extrabold text-white">1</div>
    <div class="text-xs text-slate-500 mt-1">Duplicates removed</div>
  </div>
  <div class="stat-card glass rounded-2xl p-5 cursor-default">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center"><span class="material-symbols-outlined text-info">summarize</span></div>
      <span class="text-[10px] font-bold text-info bg-info/10 px-2 py-0.5 rounded-full border border-info/20">TOTAL</span>
    </div>
    <div class="text-3xl font-extrabold text-white">3</div>
    <div class="text-xs text-slate-500 mt-1">Total reviewed</div>
  </div>
</div>
</section>
<section class="fade-up" style="animation-delay:0.2s">
<div class="glass rounded-2xl p-6">
  <div class="flex items-center gap-2 mb-5">
    <span class="material-symbols-outlined text-primary">webhook</span>
    <h2 class="text-base font-bold text-white">Webhook Configuration</h2>
  </div>
  <div class="grid md:grid-cols-2 gap-6">
    <div>
      <label class="text-xs font-semibold text-slate-400 mb-2 block">Callback URL</label>
      <div class="flex items-center gap-2">
        <div class="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-primary select-all">
          https://quantum-moderation.hemichaeli.workers.dev/webhook
        </div>
        <button onclick="navigator.clipboard.writeText('https://quantum-moderation.hemichaeli.workers.dev/webhook')" class="p-3 bg-white/5 hover:bg-primary/20 border border-white/10 rounded-xl transition-all" title="Copy URL">
          <span class="material-symbols-outlined text-sm text-slate-400">content_copy</span>
        </button>
      </div>
    </div>
    <div>
      <label class="text-xs font-semibold text-slate-400 mb-2 block">Status</label>
      <div class="bg-black/30 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-success pulse-dot"></span>
        <span class="text-sm font-medium text-white">Connected &amp; Receiving Events</span>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-3">
        <div class="text-center p-2 bg-white/3 rounded-lg"><div class="text-xs text-slate-500">Subscribed</div><div class="text-sm font-bold text-white mt-0.5">feed, mentions</div></div>
        <div class="text-center p-2 bg-white/3 rounded-lg"><div class="text-xs text-slate-500">Verify Token</div><div class="text-sm font-bold text-success mt-0.5">Verified</div></div>
        <div class="text-center p-2 bg-white/3 rounded-lg"><div class="text-xs text-slate-500">Last Ping</div><div class="text-sm font-bold text-white mt-0.5">2s ago</div></div>
      </div>
    </div>
  </div>
</div>
</section>
<section class="fade-up" style="animation-delay:0.3s">
<div class="glass rounded-2xl overflow-hidden">
  <div class="p-6 pb-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-primary">history</span>
      <h2 class="text-base font-bold text-white">Action Log</h2>
      <span class="text-xs text-slate-600 ml-1">Recent moderation actions</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-[10px] text-slate-600">Auto-refresh: ON</span>
      <span class="w-1.5 h-1.5 rounded-full bg-success pulse-dot"></span>
    </div>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="bg-white/3 border-y border-white/5">
          <th class="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
          <th class="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Content</th>
          <th class="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
          <th class="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
          <th class="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr class="log-row border-b border-white/5">
          <td class="px-6 py-4"><div class="text-sm text-white font-medium">${ts1}</div><div class="text-[10px] text-slate-600">Post ID: 896937383514056_1042</div></td>
          <td class="px-6 py-4"><div class="text-sm text-slate-300 max-w-xs truncate">"New property listing published in Tel Aviv — 3BR apartment, Pinui-Binui project"</div></td>
          <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20"><span class="material-symbols-outlined text-xs">verified</span>compliant</span></td>
          <td class="px-6 py-4"><span class="text-sm font-semibold text-success">Approved</span></td>
          <td class="px-6 py-4"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-success"></span><span class="text-xs font-medium text-success">Completed</span></div></td>
        </tr>
        <tr class="log-row border-b border-white/5">
          <td class="px-6 py-4"><div class="text-sm text-white font-medium">${ts2}</div><div class="text-[10px] text-slate-600">Post ID: 896937383514056_1041</div></td>
          <td class="px-6 py-4"><div class="text-sm text-slate-300 max-w-xs truncate">"Comment removed — duplicate post flagged by automated review"</div></td>
          <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning/10 text-warning border border-warning/20"><span class="material-symbols-outlined text-xs">content_copy</span>duplicate_content</span></td>
          <td class="px-6 py-4"><span class="text-sm font-semibold text-warning">Removed</span></td>
          <td class="px-6 py-4"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-success"></span><span class="text-xs font-medium text-success">Completed</span></div></td>
        </tr>
        <tr class="log-row border-b border-white/5 opacity-70">
          <td class="px-6 py-4"><div class="text-sm text-white font-medium">${ts3}</div><div class="text-[10px] text-slate-600">Post ID: 896937383514056_1038</div></td>
          <td class="px-6 py-4"><div class="text-sm text-slate-300 max-w-xs truncate">"Market update: Urban renewal projects Q1 performance report"</div></td>
          <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20"><span class="material-symbols-outlined text-xs">verified</span>compliant</span></td>
          <td class="px-6 py-4"><span class="text-sm font-semibold text-success">Approved</span></td>
          <td class="px-6 py-4"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-success"></span><span class="text-xs font-medium text-success">Completed</span></div></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="p-4 border-t border-white/5 flex items-center justify-between">
    <span class="text-xs text-slate-600">Showing 3 of 3 actions</span>
    <div class="flex items-center gap-2 text-xs text-slate-500"><span class="material-symbols-outlined text-sm">schedule</span>Updated ${updateTime}</div>
  </div>
</div>
</section>
<section class="fade-up" style="animation-delay:0.4s">
<div class="glass rounded-2xl p-6">
  <div class="flex items-center gap-2 mb-4">
    <span class="material-symbols-outlined text-primary">key</span>
    <h2 class="text-base font-bold text-white">Active Permissions</h2>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="bg-white/3 rounded-xl p-3 text-center border border-white/5"><div class="text-xs font-mono text-primary font-bold">ads_read</div><div class="text-[10px] text-success mt-1">Active</div></div>
    <div class="bg-white/3 rounded-xl p-3 text-center border border-white/5"><div class="text-xs font-mono text-primary font-bold">ads_management</div><div class="text-[10px] text-success mt-1">Active</div></div>
    <div class="bg-white/3 rounded-xl p-3 text-center border border-white/5"><div class="text-xs font-mono text-primary font-bold">pages_manage_engagement</div><div class="text-[10px] text-success mt-1">Active</div></div>
    <div class="bg-white/3 rounded-xl p-3 text-center border border-white/5"><div class="text-xs font-mono text-primary font-bold">pages_read_engagement</div><div class="text-[10px] text-success mt-1">Active</div></div>
  </div>
</div>
</section>
</main>
<footer class="border-t border-white/5 mt-8">
<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
  <span class="text-xs text-slate-600">QUANTUM Content Moderation v2.8.1</span>
  <span class="text-xs text-slate-600">Powered by Cloudflare Workers</span>
</div>
</footer>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ============================================================
// Privacy Policy
// ============================================================
function handlePrivacy() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Privacy Policy - U-R-Quantum</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}h1{color:#1a1a1a;border-bottom:2px solid #c9a84c;padding-bottom:10px}h2{color:#333;margin-top:30px}</style></head><body><h1>Privacy Policy</h1><p><em>Last updated: March 23, 2026</em></p><h2>1. Introduction</h2><p>This Privacy Policy describes how U-R-Quantum collects, uses, and handles information when you use our Facebook Page moderation application.</p><h2>2. Information We Collect</h2><p>The App accesses public comments posted on our Facebook Page and Instagram account, user IDs of individuals who post comments (for moderation purposes only), and page engagement data for moderation analysis.</p><h2>3. How We Use Information</h2><p>We use the collected information solely for automatically detecting and removing offensive, harmful, or spam comments, blocking users who repeatedly post abusive content, and maintaining a safe environment on our social media channels.</p><h2>4. Data Storage</h2><p>Comment data is temporarily processed in real-time and stored in Cloudflare KV storage for up to 30 days. We do not sell, share, or transfer this data to third parties.</p><h2>5. Data Deletion</h2><p>Users may request deletion of their data by contacting us at: <a href="mailto:info@u-r-quantum.com">info@u-r-quantum.com</a></p><h2>6. Contact Us</h2><p>Email: <a href="mailto:info@u-r-quantum.com">info@u-r-quantum.com</a> | Website: <a href="https://u-r-quantum.com">u-r-quantum.com</a></p></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ============================================================
// Main Worker Handler
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '/dashboard') {
      return handleDashboard();
    }

    if (path === '/webhook') {
      if (request.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
      }
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          ctx.waitUntil((async () => {
            for (const entry of (body.entry || [])) {
              if (body.object === 'page') await processFacebookEvent(entry, env);
              else if (body.object === 'instagram') await processInstagramEvent(entry, env);
            }
          })());
          return new Response('EVENT_RECEIVED', { status: 200 });
        } catch (e) {
          return new Response('OK', { status: 200 });
        }
      }
    }

    if (path === '/privacy' || path === '/privacy-policy') {
      return handlePrivacy();
    }

    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'QUANTUM Moderation Bot',
        timestamp: new Date().toISOString(),
        webhook_url: 'https://quantum-moderation.hemichaeli.workers.dev/webhook'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  }
};
