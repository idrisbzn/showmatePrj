// Slide deck controls for presentation.html
const slides = document.querySelectorAll('.slide');
const counter = document.getElementById('slideCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentSlide = 0;

const goTo = index => {
  if (index < 0 || index >= slides.length) return;

  slides[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');

  counter.textContent = `${currentSlide + 1} / ${slides.length}`;
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === slides.length - 1;
};

prevBtn?.addEventListener('click', () => goTo(currentSlide - 1));
nextBtn?.addEventListener('click', () => goTo(currentSlide + 1));

window.addEventListener('keydown', e => {
  if (e.target.closest('button')) return; // buttons handle their own clicks, avoids double-step on Space
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    goTo(currentSlide + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    goTo(currentSlide - 1);
  } else if (e.key === ' ') {
    e.preventDefault(); // space advances slides instead of scrolling the page
    goTo(currentSlide + 1);
  }
});
