/**
 * yad2-proxy - Cloudflare Worker
 * Proxies requests to yad2 API to bypass IP blocking on Railway.
 *
 * Usage:
 *   GET https://yad2-proxy.SUBDOMAIN.workers.dev/?city=5000&page=1&key=pinuy-binuy-2026
 *   GET https://yad2-proxy.SUBDOMAIN.workers.dev/phone?itemId=xxxxx&key=pinuy-binuy-2026
 *   GET https://yad2-proxy.SUBDOMAIN.workers.dev/health
 */

const YAD2_FEED_BASE = 'https://gw.yad2.co.il/feed-search-legacy/realestate/forsale';
const YAD2_PHONE_BASE = 'https://gw.yad2.co.il/feed-search/item';
const SECRET_KEY = 'pinuy-binuy-2026';

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://www.yad2.co.il/realestate/forsale',
  'Origin': 'https://www.yad2.co.il',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Secret-Key',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', worker: 'yad2-proxy', timestamp: new Date().toISOString() });
    }

    // Verify secret key
    const secretKey = request.headers.get('X-Secret-Key') || url.searchParams.get('key');
    if (secretKey !== (env.SECRET_KEY || SECRET_KEY)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Phone endpoint
    if (url.pathname === '/phone') {
      return handlePhoneRequest(url);
    }

    // Feed/search endpoint (default)
    return handleFeedRequest(url);
  }
};

async function handleFeedRequest(url) {
  const params = new URLSearchParams();
  for (const [k, v] of url.searchParams.entries()) {
    if (k !== 'key') params.set(k, v);
  }

  const targetUrl = YAD2_FEED_BASE + '?' + params.toString();

  try {
    const response = await fetch(targetUrl, { headers: COMMON_HEADERS, redirect: 'follow' });
    const body = await response.text();

    // Check for bot challenge
    if (body.includes('Bot Manager') || body.includes('CAPTCHA') || body.includes('captcha')) {
      return jsonResponse({ error: 'bot_challenge', message: 'yad2 returned a bot challenge', status: response.status }, 503);
    }

    // Try to strip for(;;); prefix if present
    let cleanBody = body;
    if (body.startsWith('for')) {
      cleanBody = body.replace(/^for\s*\(;;\);?\s*/, '');
    }

    return new Response(cleanBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...CORS_HEADERS,
        'X-Proxied-By': 'yad2-proxy-worker',
      },
    });
  } catch (err) {
    return jsonResponse({ error: 'fetch_failed', message: err.message }, 500);
  }
}

async function handlePhoneRequest(url) {
  const itemId = url.searchParams.get('itemId');
  if (!itemId) {
    return jsonResponse({ error: 'itemId parameter required' }, 400);
  }

  // Try multiple phone endpoints
  const endpoints = [
    `${YAD2_PHONE_BASE}/${itemId}/phone`,
    `https://gw.yad2.co.il/feed-search-legacy/item/${itemId}/phone`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          ...COMMON_HEADERS,
          'Referer': `https://www.yad2.co.il/item/${itemId}`,
        },
        redirect: 'follow',
      });

      if (response.status === 200) {
        const body = await response.text();
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
            'X-Proxied-By': 'yad2-proxy-worker',
            'X-Phone-Endpoint': endpoint,
          },
        });
      }
    } catch (err) {
      // Try next endpoint
    }
  }

  return jsonResponse({ error: 'phone_not_found', itemId }, 404);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
