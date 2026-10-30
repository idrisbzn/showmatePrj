
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration
const config = {
    gridSize: 80,
    gridColor: '#39FF14',
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

// Grid tracking
const occupiedLines = {
    horizontal: new Set(),
    vertical: new Set()
};

// Random characters
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";

function createGrid() {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgb(51, 85, 51)');
    gradient.addColorStop(1, 'rgba(51, 85, 52, 0)');

    ctx.strokeStyle = gradient;

    for (let y = 0; y < canvas.height; y += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    for (let x = 0; x < canvas.width; x += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

class Particle {
    constructor() {
        this.color = config.particleColors[
            Math.floor(Math.random() * config.particleColors.length)
        ];

        this.speed = Math.random() * (
            config.particleSpeedMax - config.particleSpeedMin
        ) + config.particleSpeedMin;

        this.reset();
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });

        if (this.trail.length > config.trailLength) {
            this.trail.shift();
        }

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
        } else {
            const allTrailPointsOffScreen = this.trail.every(point =>
                (this.direction === 'horizontal' && point.x > canvas.width) ||
                (this.direction === 'vertical' && point.y > canvas.height)
            );

            if (allTrailPointsOffScreen) {
                this.reset();
            }
        }
    }

    draw() {
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;

            ctx.fillStyle = this.color.replace('1)', `${alpha})`);

            ctx.beginPath();
            ctx.arc(point.x, point.y, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    findAvailableLine() {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (Math.random() > 0.5) {
                const y = Math.round(
                    Math.random() * canvas.height / config.gridSize
                ) * config.gridSize;

                if (!occupiedLines.horizontal.has(y)) {
                    this.direction = 'horizontal';
                    this.x = 0;
                    this.y = y;

                    occupiedLines.horizontal.add(y);
                    return true;
                }
            } else {
                const x = Math.round(
                    Math.random() * canvas.width / config.gridSize
                ) * config.gridSize;

                if (!occupiedLines.vertical.has(x)) {
                    this.direction = 'vertical';
                    this.x = x;
                    this.y = 0;

                    occupiedLines.vertical.add(x);
                    return true;
                }
            }

            attempts++;
        }

        return false;
    }

    reset() {
        if (this.findAvailableLine()) {
            this.trail = [];
            this.active = true;

            this.speed = Math.random() * (
                config.particleSpeedMax - config.particleSpeedMin
            ) + config.particleSpeedMin;
        } else {
            this.active = false;
            this.trail = [];
        }
    }
}

const particles = Array(config.particleCount)
    .fill()
    .map(() => new Particle());

// Ripple effect
let ripples = [];

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = config.rippleMaxRadius;
        this.startTime = Date.now();
    }

    update() {
        const elapsed = Date.now() - this.startTime;

        this.radius = (
            elapsed / config.rippleDuration
        ) * this.maxRadius;
    }

    draw() {
        const alpha = 1 - (this.radius / this.maxRadius);

        // Draw ripple circle
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw random characters
        if (Math.random() < 0.15) {
            ctx.fillStyle = `rgba(172, 255, 172, ${alpha})`;
            ctx.font = `${config.characterSize}px monospace`;

            const char = characters[
                Math.floor(Math.random() * characters.length)
            ];

            const x = this.x + (Math.random() - 0.5) * this.radius * 2;
            const y = this.y + (Math.random() - 0.5) * this.radius * 2;

            ctx.fillText(char, x, y);
        }
    }

    isComplete() {
        return this.radius >= this.maxRadius;
    }
}

// Animation loop
function animate() {
    createGrid();

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    ripples = ripples.filter(ripple => !ripple.isComplete());

    ripples.forEach(ripple => {
        ripple.update();
        ripple.draw();
    });

    requestAnimationFrame(animate);
}

// Window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    occupiedLines.horizontal.clear();
    occupiedLines.vertical.clear();

    particles.forEach(particle => particle.reset());
});

// Click event
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ripples.push(new Ripple(x, y));
});

animate();