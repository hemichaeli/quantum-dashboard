/**
 * QUANTUM State Store - Centralized state management with sessionStorage persistence
 * Fixes cross-page state loss bugs (e.g., "no complex selected")
 */
const QuantumState = (function() {
  const STORAGE_KEY = 'quantum_state';
  const listeners = {};

  // Hydrate from sessionStorage
  let state = {};
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved);
  } catch (e) {
    console.warn('[QuantumState] Failed to hydrate:', e.message);
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[QuantumState] Failed to persist:', e.message);
    }
  }

  function get(key) {
    return key ? state[key] : { ...state };
  }

  function set(key, value) {
    var oldValue = state[key];
    state[key] = value;
    persist();
    if (listeners[key]) {
      listeners[key].forEach(function(fn) {
        try { fn(value, oldValue, key); } catch (e) { console.error('[QuantumState] Listener error:', e); }
      });
    }
    if (listeners['*']) {
      listeners['*'].forEach(function(fn) {
        try { fn(value, oldValue, key); } catch (e) { console.error('[QuantumState] Wildcard listener error:', e); }
      });
    }
  }

  function subscribe(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    return function() {
      listeners[key] = listeners[key].filter(function(fn) { return fn !== callback; });
    };
  }

  function remove(key) {
    delete state[key];
    persist();
  }

  function clear() {
    state = {};
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return { get: get, set: set, subscribe: subscribe, remove: remove, clear: clear };
})();
