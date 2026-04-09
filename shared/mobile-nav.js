/**
 * QUANTUM Mobile Navigation
 * Adds hamburger toggle for sidebar on screens < lg (1024px)
 * Auto-injects button into header and handles sidebar show/hide
 */
(function() {
  var sidebar = document.querySelector('aside');
  if (!sidebar) return;

  // Create hamburger button and inject into header
  var header = document.querySelector('header');
  if (!header) return;

  var btn = document.createElement('button');
  btn.id = 'mobile-nav-toggle';
  btn.className = 'lg:hidden flex items-center justify-center size-10 rounded-xl bg-surface border border-white/10 text-slate-300 hover:text-white transition-all flex-shrink-0';
  btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
  btn.setAttribute('aria-label', 'תפריט');
  header.insertBefore(btn, header.firstChild);

  // Create overlay
  var overlay = document.createElement('div');
  overlay.id = 'mobile-nav-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40;display:none;';
  document.body.appendChild(overlay);

  var isOpen = false;

  function openNav() {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex');
    sidebar.style.cssText = 'position:fixed;top:0;right:0;z-index:50;height:100vh;width:16rem;';
    overlay.style.display = 'block';
    isOpen = true;
  }

  function closeNav() {
    sidebar.classList.add('hidden');
    sidebar.classList.remove('flex');
    sidebar.style.cssText = '';
    overlay.style.display = 'none';
    isOpen = false;
    // Re-apply lg:flex behavior via media query
    checkWidth();
  }

  function checkWidth() {
    if (window.innerWidth >= 1024) {
      // Desktop: show sidebar normally
      sidebar.classList.remove('hidden');
      sidebar.classList.add('flex');
      sidebar.style.cssText = '';
      overlay.style.display = 'none';
      isOpen = false;
    } else if (!isOpen) {
      // Mobile: hide sidebar
      sidebar.classList.add('hidden');
      sidebar.classList.remove('flex');
      sidebar.style.cssText = '';
    }
  }

  btn.addEventListener('click', function() {
    if (isOpen) closeNav(); else openNav();
  });
  overlay.addEventListener('click', closeNav);

  // Close on nav link click (mobile)
  sidebar.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth < 1024) closeNav();
    });
  });

  window.addEventListener('resize', checkWidth);
})();
