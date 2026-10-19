/**
 * Sylvan Calc - Forest Canvas Effects (Falling Leaves & Fireflies)
 * 고성능 60fps 캔버스 나뭇잎/반딧불이 파티클 시스템
 */

class ForestParticles {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.leaves = [];
        this.fireflies = [];
        this.theme = 'morning'; // 'morning' | 'twilight' | 'midnight'
        this.mouseX = -1000;
        this.mouseY = -1000;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        });

        this.createParticles();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    setTheme(theme) {
        this.theme = theme;
        this.createParticles();
    }

    createParticles() {
        this.leaves = [];
        this.fireflies = [];

        // 나뭇잎 개수
        const leafCount = Math.min(28, Math.floor(this.width / 45));
        for (let i = 0; i < leafCount; i++) {
            this.leaves.push(this.createLeaf());
        }

        // 반딧불이 개수 (밤/황혼 모드에서 더 많음)
        const fireflyCount = this.theme === 'midnight' ? 45 : (this.theme === 'twilight' ? 30 : 15);
        for (let i = 0; i < fireflyCount; i++) {
            this.fireflies.push(this.createFirefly());
        }
    }

    createLeaf() {
        const leafTypes = ['oak', 'maple', 'willow', 'pine'];
        const colors = this.getLeafColors();
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height - this.height,
            size: Math.random() * 14 + 10,
            speedY: Math.random() * 1.2 + 0.6,
            speedX: Math.random() * 0.8 - 0.4,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            swingPhase: Math.random() * Math.PI * 2,
            swingSpeed: Math.random() * 0.02 + 0.01,
            swingAmp: Math.random() * 1.8 + 0.8,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.5 + 0.35,
            type: leafTypes[Math.floor(Math.random() * leafTypes.length)]
        };
    }

    createFirefly() {
        const colors = this.getFireflyColors();
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: Math.random() * 2.2 + 1.2,
            speedX: (Math.random() - 0.5) * 0.8,
            speedY: (Math.random() - 0.5) * 0.8,
            glowIntensity: Math.random(),
            glowSpeed: Math.random() * 0.03 + 0.015,
            color: colors[Math.floor(Math.random() * colors.length)],
            maxGlow: Math.random() * 0.6 + 0.4
        };
    }

    getLeafColors() {
        if (this.theme === 'twilight') {
            return ['#d97706', '#b45309', '#f59e0b', '#78350f', '#ca8a04'];
        } else if (this.theme === 'midnight') {
            return ['#14532d', '#166534', '#065f46', '#047857', '#0f766e'];
        }
        // morning
        return ['#15803d', '#22c55e', '#4ade80', '#84cc16', '#a3e635', '#166534'];
    }

    getFireflyColors() {
        if (this.theme === 'twilight') {
            return ['#fde047', '#facc15', '#fb923c'];
        } else if (this.theme === 'midnight') {
            return ['#86efac', '#6ee7b7', '#a7f3d0', '#fef08a'];
        }
        return ['#fef08a', '#facc15', '#bbf7d0'];
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. 나뭇잎 렌더링 및 업데이트
        this.leaves.forEach(leaf => {
            leaf.swingPhase += leaf.swingSpeed;
            leaf.x += Math.sin(leaf.swingPhase) * leaf.swingAmp + leaf.speedX;
            leaf.y += leaf.speedY;
            leaf.rotation += leaf.rotSpeed;

            // 마우스 반발 효과
            const dx = leaf.x - this.mouseX;
            const dy = leaf.y - this.mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const force = (100 - dist) / 100;
                leaf.x += (dx / dist) * force * 3;
                leaf.y += (dy / dist) * force * 3;
            }

            // 화면 아래로 나가면 상단에서 재생성
            if (leaf.y > this.height + 30) {
                leaf.y = -30;
                leaf.x = Math.random() * this.width;
            }
            if (leaf.x < -30) leaf.x = this.width + 30;
            if (leaf.x > this.width + 30) leaf.x = -30;

            this.drawLeaf(leaf);
        });

        // 2. 반딧불이 렌더링 및 업데이트
        this.fireflies.forEach(f => {
            f.x += f.speedX;
            f.y += f.speedY;
            f.glowIntensity += f.glowSpeed;

            // 마우스 호버 시 살짝 이끌림
            const dx = this.mouseX - f.x;
            const dy = this.mouseY - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 20) {
                f.x += (dx / dist) * 0.4;
                f.y += (dy / dist) * 0.4;
            }

            if (f.x < 0) f.x = this.width;
            if (f.x > this.width) f.x = 0;
            if (f.y < 0) f.y = this.height;
            if (f.y > this.height) f.y = 0;

            this.drawFirefly(f);
        });

        requestAnimationFrame(this.animate);
    }

    drawLeaf(leaf) {
        this.ctx.save();
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.rotation);
        this.ctx.globalAlpha = leaf.opacity;
        this.ctx.fillStyle = leaf.color;

        // 예쁜 나뭇잎 모양 패스
        this.ctx.beginPath();
        this.ctx.moveTo(0, -leaf.size);
        this.ctx.bezierCurveTo(leaf.size * 0.7, -leaf.size * 0.5, leaf.size * 0.7, leaf.size * 0.5, 0, leaf.size);
        this.ctx.bezierCurveTo(-leaf.size * 0.7, leaf.size * 0.5, -leaf.size * 0.7, -leaf.size * 0.5, 0, -leaf.size);
        this.ctx.fill();

        // 나뭇잎 잎맥
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -leaf.size * 0.8);
        this.ctx.lineTo(0, leaf.size * 0.8);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawFirefly(f) {
        const pulse = (Math.sin(f.glowIntensity) + 1) / 2; // 0 to 1
        const alpha = pulse * f.maxGlow;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // 외부 은은한 글로우
        const glowGrad = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 5);
        glowGrad.addColorStop(0, f.color);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.radius * 5, 0, Math.PI * 2);
        this.ctx.fill();

        // 중심 발광 코어
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.radius * 0.8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }
}

window.ForestParticles = ForestParticles;
