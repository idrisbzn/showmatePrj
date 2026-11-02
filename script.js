// Highlight the nav link of the section currently in view
const navLinks = [...document.querySelectorAll('nav a')];
const navSections = navLinks
  .map(link => document.querySelector(link.hash))
  .filter(section => section !== null);

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link =>
        link.classList.toggle('active', link.hash === '#' + entry.target.id)
      );
    }
  });
}, { rootMargin: '-20% 0px -60% 0px' });

navSections.forEach(section => navObserver.observe(section));

// Click pulse ripple on cards
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      card.classList.remove('clicked');
      void card.offsetWidth; // restart the animation
      card.classList.add('clicked');
    });
    card.addEventListener('animationend', e => {
      if (e.animationName === 'clickPulse') card.classList.remove('clicked');
    });
  });
}
