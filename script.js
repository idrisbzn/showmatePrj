// Mobile menu
const burger = document.querySelector('.burger');
const menu = document.getElementById('links');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

// Highlight nav link of the section in view
const navLinks = [...menu.querySelectorAll('a')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l =>
        l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)
      );
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => s && observer.observe(s));
