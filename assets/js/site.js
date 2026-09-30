/* Menu mobile e anno nel footer (prima erano script inline nel layout). */
(function () {
  const burger = document.getElementById('burger');
  const navlinks = document.getElementById('navlinks');
  if (burger && navlinks) {
    const root = document.documentElement;
    const setMenu = (open) => {
      navlinks.classList.toggle('open', open);
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    };
    burger.addEventListener('click', () => setMenu(!navlinks.classList.contains('open')));
    navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navlinks.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
