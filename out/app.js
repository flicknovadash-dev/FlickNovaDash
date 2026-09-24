const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
let pending = false;
function updateScroll() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--progress', distance > 0 ? scrollY / distance : 0);
  document.documentElement.style.setProperty('--hero-scroll', Math.min(1, scrollY / innerHeight));
  pending = false;
}
addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();
