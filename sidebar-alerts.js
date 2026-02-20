/**
 * QUANTUM Sidebar Alert Badge - Dynamic loader
 * Replaces hardcoded alert counts with real API data
 * Include this script in any page that has a sidebar with alert badges
 */
(function() {
    var API_BASE = 'https://pinuy-binuy-analyzer-production.up.railway.app';
    
    // Find and update alert badges in sidebar
    function updateBadges(unreadCount) {
        // Find badges with class alert-count-badge
        document.querySelectorAll('.alert-count-badge').forEach(function(el) {
            if (unreadCount > 0) {
                el.textContent = unreadCount;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
        
        // Also find any hardcoded "703" badges and replace them
        document.querySelectorAll('span').forEach(function(el) {
            if (el.textContent.trim() === '703') {
                if (unreadCount > 0) {
                    el.textContent = unreadCount;
                } else {
                    el.style.display = 'none';
                }
            }
        });
    }
    
    fetch(API_BASE + '/api/ssi/dashboard-data')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var alerts = d.recentAlerts || [];
            var unread = alerts.filter(function(a) { return !a.is_read; }).length;
            updateBadges(unread);
        })
        .catch(function() {
            // On error, hide badges rather than show stale data
            updateBadges(0);
        });
})();