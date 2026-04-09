/**
 * QUANTUM API Client - Fetch wrapper with timeout, retry, and error handling
 * Fixes loading state hangs from missing .catch() and network errors
 */
var QuantumAPI = (function() {
  var API_BASE = 'https://pinuy-binuy-analyzer-production.up.railway.app';
  var DEFAULT_TIMEOUT = 30000;
  var MAX_RETRIES = 1;
  var RETRY_DELAY = 1000;

  // Simple response cache
  var cache = {};
  var CACHE_TTL = {
    '/api/complexes': 5 * 60 * 1000,
    '/api/ssi/dashboard-data': 2 * 60 * 1000,
    '/api/opportunities': 5 * 60 * 1000
  };
  var DEFAULT_TTL = 60 * 1000;

  function getCacheTTL(url) {
    for (var path in CACHE_TTL) {
      if (url.indexOf(path) !== -1) return CACHE_TTL[path];
    }
    return DEFAULT_TTL;
  }

  function request(endpoint, options) {
    options = options || {};
    var url = endpoint.indexOf('http') === 0 ? endpoint : API_BASE + endpoint;
    var method = (options.method || 'GET').toUpperCase();

    // Check cache for GET requests
    if (method === 'GET' && !options.noCache && cache[url]) {
      if (Date.now() - cache[url].timestamp < getCacheTTL(url)) {
        return Promise.resolve(cache[url].data);
      }
    }

    var controller = new AbortController();
    var timeout = options.timeout || DEFAULT_TIMEOUT;
    var timeoutId = setTimeout(function() { controller.abort(); }, timeout);

    var fetchOptions = {
      method: method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
      signal: controller.signal
    };
    if (options.body && method !== 'GET') {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    function attempt(retryCount) {
      var delay = retryCount > 0 ? RETRY_DELAY * retryCount : 0;
      var doFetch = function() {
        return fetch(url, fetchOptions).then(function(response) {
          clearTimeout(timeoutId);
          if (!response.ok) {
            return response.text().then(function(body) {
              throw new Error('HTTP ' + response.status + ': ' + (body || response.statusText));
            });
          }
          return response.json().then(function(data) {
            if (method === 'GET') {
              cache[url] = { data: data, timestamp: Date.now() };
            }
            return data;
          });
        }).catch(function(err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            throw new Error('Request timeout after ' + timeout + 'ms: ' + endpoint);
          }
          if (retryCount < (method === 'GET' ? MAX_RETRIES : 0)) {
            console.warn('[QuantumAPI] Retry ' + (retryCount + 1) + ' for ' + endpoint + ':', err.message);
            return attempt(retryCount + 1);
          }
          throw err;
        });
      };
      if (delay > 0) {
        return new Promise(function(resolve) { setTimeout(resolve, delay); }).then(doFetch);
      }
      return doFetch();
    }

    return attempt(0);
  }

  function get(endpoint, options) { return request(endpoint, Object.assign({}, options, { method: 'GET' })); }
  function post(endpoint, body, options) { return request(endpoint, Object.assign({}, options, { method: 'POST', body: body })); }
  function put(endpoint, body, options) { return request(endpoint, Object.assign({}, options, { method: 'PUT', body: body })); }
  function del(endpoint, options) { return request(endpoint, Object.assign({}, options, { method: 'DELETE' })); }

  function showLoading(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.dataset.qapiLoading = '1';
      el.innerHTML = '<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';
    }
  }

  function showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (el) {
      var safeMsg = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      el.innerHTML = '<div class="text-center py-8 text-slate-400">' +
        '<span class="material-symbols-outlined text-3xl text-alert-rose block mb-2">error</span>' +
        '<p>' + safeMsg + '</p>' +
        '<button onclick="location.reload()" class="mt-3 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 text-sm">\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1</button></div>';
    }
  }

  function fetchInto(elementId, endpoint, renderFn, options) {
    showLoading(elementId);
    return request(endpoint, options).then(function(data) {
      var el = document.getElementById(elementId);
      if (el && renderFn) renderFn(el, data);
      return data;
    }).catch(function(err) {
      console.error('[QuantumAPI] Failed to fetch ' + endpoint + ':', err.message);
      showError(elementId, '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD: ' + err.message);
      if (typeof QuantumToast !== 'undefined') QuantumToast.error('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD');
      throw err;
    });
  }

  function clearCache(pattern) {
    if (!pattern) { cache = {}; return; }
    for (var key in cache) {
      if (key.indexOf(pattern) !== -1) delete cache[key];
    }
  }

  return {
    request: request, get: get, post: post, put: put, del: del,
    fetchInto: fetchInto, showLoading: showLoading, showError: showError,
    clearCache: clearCache, API_BASE: API_BASE
  };
})();
