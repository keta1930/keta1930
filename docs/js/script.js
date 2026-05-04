const LANGUAGES = { en: 'EN', zh: '中文' };
let lang = localStorage.getItem('lang') || 'en';
let data = null;
let currentSeason = localStorage.getItem('season') || getAutoSeason();
let particleCtx, particleW, particleH, particles = [];

const SEASON_CONFIG = {
    spring: {
        divider: '🌷',
        colors: ['#FFB7C5', '#FF69B4', '#FFC0CB', '#FFFFFF', '#81C784', '#F8BBD0'],
        movement: 'drift',
        count: 40,
        sizeRange: [3, 6]
    },
    summer: {
        divider: '🌻',
        colors: ['#FFD700', '#FFEB3B', '#8BC34A', '#FFC107', '#FFE082'],
        movement: 'float',
        count: 25,
        sizeRange: [2, 4]
    },
    fall: {
        divider: '🍁',
        colors: ['#FF8C00', '#D2691E', '#8B4513', '#FFD700', '#CD853F', '#A0522D'],
        movement: 'fall',
        count: 35,
        sizeRange: [3, 6]
    },
    winter: {
        divider: '❄️',
        colors: ['#FFFFFF', '#E0E0E0', '#B0BEC5', '#E3F2FD', '#BBDEFB'],
        movement: 'snow',
        count: 50,
        sizeRange: [2, 5]
    }
};

function getAutoSeason() {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
}

/* ── Init ── */

document.addEventListener('DOMContentLoaded', async () => {
    data = await loadData();
    if (!data) return;
    applyLanguage();
    renderAll();
    applySeason(currentSeason, false);
    initNav();
    initLangSwitcher();
    initSeasonSwitcher();
    initParticles();
    initScrollReveal();
});

async function loadData() {
    try {
        const res = await fetch('./data.json');
        return await res.json();
    } catch (e) {
        console.error('Failed to load data:', e);
        return null;
    }
}

/* ── Language ── */

function applyLanguage() {
    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.getElementById('currentLang').textContent = LANGUAGES[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

function initLangSwitcher() {
    document.getElementById('langSwitcher').addEventListener('click', () => {
        lang = lang === 'en' ? 'zh' : 'en';
        localStorage.setItem('lang', lang);
        applyLanguage();
        renderAll();
    });
}

/* ── Season ── */

function applySeason(season, animate) {
    if (animate) {
        const overlay = document.getElementById('seasonOverlay');
        overlay.classList.add('active');
        setTimeout(() => {
            doApplySeason(season);
            setTimeout(() => overlay.classList.remove('active'), 350);
        }, 400);
    } else {
        doApplySeason(season);
    }
}

function doApplySeason(season) {
    currentSeason = season;
    localStorage.setItem('season', season);

    document.body.className = `season-${season}`;

    document.querySelectorAll('.hero-bg').forEach(img => {
        img.classList.toggle('active', img.dataset.season === season);
    });

    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.season === season);
    });

    const cfg = SEASON_CONFIG[season];
    document.querySelectorAll('.divider-icon').forEach(el => {
        el.textContent = cfg.divider;
    });

    resetParticles();
}

function initSeasonSwitcher() {
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const season = btn.dataset.season;
            if (season === currentSeason) return;
            applySeason(season, true);
        });
    });
}

/* ── Render ── */

function renderAll() {
    renderAbout();
    renderProjects();
    renderPapers();
}

function renderAbout() {
    const p = data.personal;

    document.getElementById('aboutTags').innerHTML = p.tags
        .map(t => `<span class="pixel-tag" data-en="${esc(t.en)}" data-zh="${esc(t.zh)}">${t[lang]}</span>`)
        .join('');

    document.getElementById('aboutBio').innerHTML = p.bio[lang]
        .split('\n\n')
        .map(para => `<p>${para}</p>`)
        .join('');

    document.getElementById('aboutContact').innerHTML = p.contact
        .map(c => `<a href="${c.url}" class="contact-item"${c.type !== 'email' ? ' target="_blank"' : ''}>
            <i class="${c.icon}"></i><span>${c.label}</span></a>`)
        .join('');
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const cards = data.projects.map(p => {
        const stars = typeof p.stars === 'number' ? `⭐ ${p.stars}` : p.stars;
        return `<div class="item-card">
            <div class="item-card-header">
                <h3 class="item-card-title"><a href="${p.url}" target="_blank">${p.title}</a></h3>
                <span class="star-badge">${stars}</span>
            </div>
            <p class="item-card-desc" data-en="${esc(p.description.en)}" data-zh="${esc(p.description.zh)}">${p.description[lang]}</p>
            <div class="item-card-links">${p.links.map(linkHTML).join('')}</div>
        </div>`;
    });
    cards.push(placeholderHTML('projects'));
    grid.innerHTML = cards.join('');
}

function renderPapers() {
    const grid = document.getElementById('papersGrid');
    const cards = data.papers.map(p => {
        return `<div class="item-card">
            <div class="item-card-header">
                <h3 class="item-card-title"><a href="${p.url}" target="_blank">
                    <span data-en="${esc(p.title.en)}" data-zh="${esc(p.title.zh)}">${p.title[lang]}</span>
                </a></h3>
            </div>
            <div>${p.badges.map(b => `<span class="venue-tag">${b.text}</span>`).join('')}</div>
            <div class="item-card-links">${p.links.map(linkHTML).join('')}</div>
        </div>`;
    });
    cards.push(placeholderHTML('papers'));
    grid.innerHTML = cards.join('');
}

function linkHTML(l) {
    const label = typeof l.label === 'string' ? l.label : l.label[lang];
    const attrs = typeof l.label === 'string' ? '' : ` data-en="${esc(l.label.en)}" data-zh="${esc(l.label.zh)}"`;
    return `<a href="${l.url}" target="_blank" class="pixel-link">
        <i class="${l.icon}"></i><span${attrs}>${label}</span></a>`;
}

function placeholderHTML(type) {
    const t = data.placeholders[type];
    return `<div class="item-card placeholder">
        <span class="placeholder-text" data-en="${t.en}" data-zh="${t.zh}">${t[lang]}</span>
    </div>`;
}

function esc(s) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

/* ── Navigation ── */

function initNav() {
    const links = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.game-panel[id]');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                const hit = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
                if (hit) hit.classList.add('active');
            }
        });
    }, { threshold: 0.25, rootMargin: '-80px 0px -40% 0px' });

    sections.forEach(s => observer.observe(s));

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/* ── Particles ── */

function initParticles() {
    const canvas = document.getElementById('particles');
    particleCtx = canvas.getContext('2d');

    function resize() {
        particleW = canvas.width = window.innerWidth;
        particleH = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    resetParticles();
    animateParticles();
}

function resetParticles() {
    const cfg = SEASON_CONFIG[currentSeason];
    particles = Array.from({ length: cfg.count }, () => makeParticle(cfg, true));
}

function makeParticle(cfg, randomY) {
    const [minS, maxS] = cfg.sizeRange;
    return {
        x: Math.random() * (particleW || window.innerWidth),
        y: randomY ? Math.random() * (particleH || window.innerHeight) : -10,
        s: Math.random() * (maxS - minS) + minS,
        c: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        a: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.2
    };
}

function animateParticles() {
    if (!particleCtx) return;
    const ctx = particleCtx;
    const W = particleW, H = particleH;
    const cfg = SEASON_CONFIG[currentSeason];
    const t = Date.now() / 1000;

    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
        let alpha = p.a;

        if (cfg.movement === 'float') {
            alpha = p.a * (0.5 + 0.5 * Math.sin(t * 2 + p.phase));
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        const sz = Math.round(p.s);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);

        switch (cfg.movement) {
            case 'drift':
                p.x += Math.sin(t * 0.5 + p.phase) * 0.4;
                p.y += p.speed * 0.5;
                break;
            case 'float':
                p.x += Math.sin(t * 0.3 + p.phase) * 0.3;
                p.y += Math.sin(t * 0.5 + p.phase * 2) * 0.2;
                break;
            case 'fall':
                p.x += Math.sin(t * 0.8 + p.phase) * 0.5;
                p.y += p.speed * 0.6;
                break;
            case 'snow':
                p.x += Math.sin(t * 0.4 + p.phase) * 0.35;
                p.y += p.speed * 0.45;
                break;
        }

        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(animateParticles);
}

/* ── Scroll Reveal ── */

function initScrollReveal() {
    const panels = document.querySelectorAll('.game-panel');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    panels.forEach(p => observer.observe(p));
}

/* ── Console ── */

console.log(
    '%c🌾 Welcome to keta1930\'s Farm!\n%c🎮 Stardew Valley themed portfolio — try switching seasons!',
    'font-size:18px;color:#5C8A4D;font-weight:bold;',
    'font-size:14px;color:#8B6914;'
);

document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🌙 zzz... - keta1930' : 'keta1930';
});
