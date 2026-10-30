// Animated grid background for the hero section
(() => {
  const canvas = document.getElementById('gridCanvas');
  if (!canvas) return;
  const hero = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const config = {
    gridSize: 80,
    particleCount: 50,
    particleSpeedMin: 0.5,
    particleSpeedMax: 5,
    particleColors: ['#06ff5d', '#4fff15', '#3e770d'],
    trailLength: 300,
    backgroundColor: '#080A08',
    rippleDuration: 2000,
    rippleMaxRadius: 200,
    characterSize: 16
  };

  const occupiedLines = { horizontal: new Set(), vertical: new Set() };
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";
  const rand = (min, max) => Math.random() * (max - min) + min;

  function resize() {
    canvas.width = hero.clientWidth;
    canvas.height = hero.clientHeight;
    occupiedLines.horizontal.clear();
    occupiedLines.vertical.clear();
    particles.forEach(p => p.reset());
  }

  function drawGrid() {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgb(51, 85, 51)');
    gradient.addColorStop(1, 'rgba(51, 85, 52, 0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += config.gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    for (let x = 0; x < canvas.width; x += config.gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();
  }

  class Particle {
    constructor() {
      this.color = config.particleColors[Math.floor(Math.random() * config.particleColors.length)];
      this.reset();
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > config.trailLength) this.trail.shift();

      if (this.active) {
        if (this.direction === 'horizontal') {
          this.x += this.speed;
          if (this.x > canvas.width) {
            this.active = false;
            occupiedLines.horizontal.delete(this.y);
          }
        } else {
          this.y += this.speed;
          if (this.y > canvas.height) {
            this.active = false;
            occupiedLines.vertical.delete(this.x);
          }
        }
      } else if (this.trail.every(p =>
        (this.direction === 'horizontal' && p.x > canvas.width) ||
        (this.direction === 'vertical' && p.y > canvas.height) ||
        !this.direction)) {
        this.reset();
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      for (let i = 0; i < this.trail.length; i++) {
        ctx.globalAlpha = i / this.trail.length;
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    findAvailableLine() {
      for (let attempts = 0; attempts < 100; attempts++) {
        if (Math.random() > 0.5) {
          const y = Math.round(Math.random() * canvas.height / config.gridSize) * config.gridSize;
          if (!occupiedLines.horizontal.has(y)) {
            this.direction = 'horizontal';
            this.x = 0;
            this.y = y;
            occupiedLines.horizontal.add(y);
            return true;
          }
        } else {
          const x = Math.round(Math.random() * canvas.width / config.gridSize) * config.gridSize;
          if (!occupiedLines.vertical.has(x)) {
            this.direction = 'vertical';
            this.x = x;
            this.y = 0;
            occupiedLines.vertical.add(x);
            return true;
          }
        }
      }
      return false;
    }

    reset() {
      this.trail = [];
      this.speed = rand(config.particleSpeedMin, config.particleSpeedMax);
      this.active = this.findAvailableLine();
    }
  }

  class Ripple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 0;
      this.startTime = Date.now();
    }
    update() {
      this.radius = ((Date.now() - this.startTime) / config.rippleDuration) * config.rippleMaxRadius;
    }
    draw() {
      const alpha = Math.max(0, 1 - this.radius / config.rippleMaxRadius);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (Math.random() < 0.15) {
        ctx.fillStyle = `rgba(172, 255, 172, ${alpha})`;
        ctx.font = `${config.characterSize}px monospace`;
        ctx.fillText(
          characters[Math.floor(Math.random() * characters.length)],
          this.x + (Math.random() - 0.5) * this.radius * 2,
          this.y + (Math.random() - 0.5) * this.radius * 2
        );
      }
    }
    isComplete() { return this.radius >= config.rippleMaxRadius; }
  }

  const particles = Array.from({ length: config.particleCount }, () => new Particle());
  let ripples = [];
  let running = false;

  function animate() {
    if (!running) return;
    drawGrid();
    particles.forEach(p => { p.update(); p.draw(); });
    ripples = ripples.filter(r => !r.isComplete());
    ripples.forEach(r => { r.update(); r.draw(); });
    requestAnimationFrame(animate);
  }

  // Keep canvas matched to the hero's size
  new ResizeObserver(() => {
    resize();
    if (reduceMotion) drawGrid();
  }).observe(hero);

  if (reduceMotion) return; // static grid only

  // Only animate while the hero is on screen
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      animate();
    } else if (!entry.isIntersecting) {
      running = false;
    }
  }).observe(hero);

  // Click anywhere on the hero (except links/buttons) to spawn a ripple
  hero.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const rect = canvas.getBoundingClientRect();
    ripples.push(new Ripple(e.clientX - rect.left, e.clientY - rect.top));
  });
})();
