/**
 * QUANTUM Toast Notifications
 * Replaces alert() with non-blocking toast messages
 */
var QuantumToast = (function() {
  var container;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'quantum-toast-container';
    container.style.cssText = 'position:fixed;top:16px;left:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:400px;';
    document.body.appendChild(container);
    // Add fadeOut keyframe
    if (!document.getElementById('quantum-toast-style')) {
      var style = document.createElement('style');
      style.id = 'quantum-toast-style';
      style.textContent = '@keyframes qtFadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}';
      document.head.appendChild(style);
    }
    return container;
  }

  function show(message, type, duration) {
    type = type || 'info';
    duration = duration || 5000;
    var c = ensureContainer();
    var toast = document.createElement('div');
    var colors = {
      success: 'bg-emerald-500/90 border-emerald-400',
      error: 'bg-red-500/90 border-red-400',
      warning: 'bg-amber-500/90 border-amber-400',
      info: 'bg-blue-500/90 border-blue-400'
    };
    var icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    var safeMsg = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    toast.className = 'flex items-center gap-2 px-4 py-3 rounded-xl border text-white text-sm shadow-lg backdrop-blur-sm pointer-events-auto ' + (colors[type] || colors.info);
    toast.style.cssText = 'animation:fadeIn 0.3s ease-out;direction:ltr;';
    toast.innerHTML = '<span class="material-symbols-outlined text-lg">' + (icons[type] || 'info') + '</span><span>' + safeMsg + '</span>';
    c.appendChild(toast);
    setTimeout(function() {
      toast.style.animation = 'qtFadeOut 0.3s ease-in forwards';
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
    return toast;
  }

  return {
    show: show,
    success: function(msg, dur) { return show(msg, 'success', dur); },
    error: function(msg, dur) { return show(msg, 'error', dur || 8000); },
    warning: function(msg, dur) { return show(msg, 'warning', dur); },
    info: function(msg, dur) { return show(msg, 'info', dur); }
  };
})();
