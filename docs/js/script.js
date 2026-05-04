/* ══════════════════════════════════════
   keta1930 — Stardew Valley Theme
   Seasons · Day/Night · Ambient Audio
   ══════════════════════════════════════ */

const LANGUAGES = { en: 'EN', zh: '中文' };

const SEASON_CONFIG = {
    spring: { divider: '🌷', colors: ['#FFB7C5','#FF69B4','#FFC0CB','#FFF','#81C784','#F8BBD0'], movement: 'drift', count: 40, sizeRange: [3,6] },
    summer: { divider: '🌻', colors: ['#FFD700','#FFEB3B','#8BC34A','#FFC107','#FFE082'], movement: 'float', count: 25, sizeRange: [2,4] },
    fall:   { divider: '🍁', colors: ['#FF8C00','#D2691E','#8B4513','#FFD700','#CD853F','#A0522D'], movement: 'fall', count: 35, sizeRange: [3,6] },
    winter: { divider: '❄️', colors: ['#FFF','#E0E0E0','#B0BEC5','#E3F2FD','#BBDEFB'], movement: 'snow', count: 50, sizeRange: [2,5] }
};

const NIGHT_PARTICLES = {
    colors: ['#FFD700','#FFF','#FFE082','#E0E0E0','#FFF8E1','#BBDEFB'],
    movement: 'twinkle', count: 45, sizeRange: [2,4]
};

/* ── State ── */

let lang = localStorage.getItem('lang') || 'en';
let currentSeason = localStorage.getItem('season') || getAutoSeason();
let isNight = localStorage.getItem('night') === 'true';
let data = null;
let bioTyped = false;

let pCtx, pW, pH, particles = [];

/* ── Init ── */

document.addEventListener('DOMContentLoaded', async () => {
    data = await loadData();
    if (!data) return;
    applyLanguage();
    renderAll();
    applySeason(currentSeason, false);
    if (isNight) applyNight(true, false);
    initNav();
    initLangSwitcher();
    initSeasonSwitcher();
    initNightToggle();
    initAudio();
    initParticles();
    initScrollReveal();
    initTypewriter();
});

async function loadData() {
    try { return await (await fetch('./data.json')).json(); }
    catch (e) { console.error('Data load failed:', e); return null; }
}

function getAutoSeason() {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
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
        bioTyped = true;
        applyLanguage();
        renderAll();
    });
}

/* ── Season ── */

function applySeason(season, animate) {
    if (animate) {
        const ov = document.getElementById('seasonOverlay');
        ov.classList.add('active');
        setTimeout(() => { doSeason(season); setTimeout(() => ov.classList.remove('active'), 350); }, 400);
    } else {
        doSeason(season);
    }
}

function doSeason(season) {
    currentSeason = season;
    localStorage.setItem('season', season);

    const classes = [`season-${season}`];
    if (isNight) classes.push('night');
    document.body.className = classes.join(' ');

    document.querySelectorAll('.hero-bg').forEach(i => i.classList.toggle('active', i.dataset.season === season));
    document.querySelectorAll('.season-btn').forEach(b => b.classList.toggle('active', b.dataset.season === season));
    document.querySelectorAll('.divider-icon').forEach(el => { el.textContent = SEASON_CONFIG[season].divider; });

    resetParticles();
    if (ambientAudio.playing) ambientAudio.play(currentSeason, isNight);
}

function initSeasonSwitcher() {
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.season !== currentSeason) applySeason(btn.dataset.season, true);
        });
    });
}

/* ── Night Mode ── */

function applyNight(night, animate) {
    isNight = night;
    localStorage.setItem('night', night);

    if (animate) {
        const ov = document.getElementById('seasonOverlay');
        ov.classList.add('active');
        setTimeout(() => {
            doNight();
            setTimeout(() => ov.classList.remove('active'), 350);
        }, 400);
    } else {
        doNight();
    }
}

function doNight() {
    document.body.classList.toggle('night', isNight);
    document.getElementById('nightToggle').textContent = isNight ? '☀️' : '🌙';
    resetParticles();
    if (ambientAudio.playing) ambientAudio.play(currentSeason, isNight);
}

function initNightToggle() {
    const btn = document.getElementById('nightToggle');
    if (isNight) btn.textContent = '☀️';
    btn.addEventListener('click', () => applyNight(!isNight, true));
}

/* ── Ambient Audio (HTML5 Audio + mp3) ── */

const ambientAudio = {
    tracks: {}, current: null, playing: false, muted: false,
    dayVol: 0.35, nightVol: 0.18,

    init() {
        ['spring', 'summer', 'fall', 'winter'].forEach(s => {
            const a = new Audio(`audio/${s}.mp3`);
            a.loop = true;
            a.volume = 0;
            a.preload = 'auto';
            this.tracks[s] = a;
        });
    },

    play(season, night) {
        if (!this.tracks.spring) this.init();
        const next = this.tracks[season];
        if (!next) return;

        const targetVol = this.muted ? 0 : (night ? this.nightVol : this.dayVol);

        if (this.current && this.current !== next) {
            this._fade(this.current, 0, 800, true);
        }

        next.play().then(() => {
            this._fade(next, targetVol, 1000);
        }).catch(() => {});

        this.current = next;
        this.playing = true;
    },

    mute() {
        this.muted = true;
        if (this.current) this._fade(this.current, 0, 400);
    },

    unmute() {
        this.muted = false;
        if (this.current) {
            this.current.play().catch(() => {});
            const vol = isNight ? this.nightVol : this.dayVol;
            this._fade(this.current, vol, 400);
        }
    },

    _fade(audio, target, ms, pauseAtEnd) {
        const start = audio.volume;
        const diff = target - start;
        const steps = 25;
        const stepMs = ms / steps;
        let i = 0;
        const iv = setInterval(() => {
            i++;
            if (i >= steps) {
                audio.volume = Math.max(0, Math.min(1, target));
                if (pauseAtEnd) audio.pause();
                clearInterval(iv);
            } else {
                audio.volume = Math.max(0, Math.min(1, start + diff * (i / steps)));
            }
        }, stepMs);
    }
};

function initAudio() {
    const btn = document.getElementById('audioToggle');
    let started = false, muted = false;

    const startOnce = () => {
        if (started) return;
        started = true;
        ambientAudio.play(currentSeason, isNight);
        btn.textContent = '🔊';
        document.removeEventListener('click', startOnce);
    };

    document.addEventListener('click', startOnce);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!started) {
            startOnce();
            return;
        }
        muted = !muted;
        if (muted) { ambientAudio.mute(); btn.textContent = '🔇'; }
        else       { ambientAudio.unmute(); btn.textContent = '🔊'; }
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

    const bioEl = document.getElementById('aboutBio');
    bioEl.innerHTML = p.bio[lang].split('\n\n').map(s => `<p>${s}</p>`).join('');

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
    cards.push(phHTML('projects'));
    grid.innerHTML = cards.join('');
}

function renderPapers() {
    const grid = document.getElementById('papersGrid');
    const cards = data.papers.map(p => `<div class="item-card">
        <div class="item-card-header">
            <h3 class="item-card-title"><a href="${p.url}" target="_blank">
                <span data-en="${esc(p.title.en)}" data-zh="${esc(p.title.zh)}">${p.title[lang]}</span>
            </a></h3>
        </div>
        <div>${p.badges.map(b => `<span class="venue-tag">${b.text}</span>`).join('')}</div>
        <div class="item-card-links">${p.links.map(linkHTML).join('')}</div>
    </div>`);
    cards.push(phHTML('papers'));
    grid.innerHTML = cards.join('');
}

function linkHTML(l) {
    const lbl = typeof l.label === 'string' ? l.label : l.label[lang];
    const a = typeof l.label === 'string' ? '' : ` data-en="${esc(l.label.en)}" data-zh="${esc(l.label.zh)}"`;
    return `<a href="${l.url}" target="_blank" class="pixel-link"><i class="${l.icon}"></i><span${a}>${lbl}</span></a>`;
}

function phHTML(type) {
    const t = data.placeholders[type];
    return `<div class="item-card placeholder"><span class="placeholder-text" data-en="${t.en}" data-zh="${t.zh}">${t[lang]}</span></div>`;
}

function esc(s) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

/* ── Typewriter ── */

function initTypewriter() {
    const bio = document.getElementById('aboutBio');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !bioTyped) {
                bioTyped = true;
                typewriterBio(bio);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(bio);
}

async function typewriterBio(container) {
    const paragraphs = data.personal.bio[lang].split('\n\n');
    container.innerHTML = '';

    for (let pi = 0; pi < paragraphs.length; pi++) {
        const p = document.createElement('p');
        if (pi < paragraphs.length - 1) p.style.marginBottom = '14px';
        container.appendChild(p);
        p.classList.add('typewriter-cursor');

        const text = paragraphs[pi];
        for (let i = 0; i < text.length; i++) {
            p.textContent += text[i];
            await sleep(18);
        }
        p.classList.remove('typewriter-cursor');

        if (pi < paragraphs.length - 1) await sleep(300);
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Navigation ── */

function initNav() {
    const links = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.game-panel[id]');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                const hit = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
                if (hit) hit.classList.add('active');
            }
        });
    }, { threshold: 0.25, rootMargin: '-80px 0px -40% 0px' });
    sections.forEach(s => obs.observe(s));

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/* ── Particles ── */

function initParticles() {
    const canvas = document.getElementById('particles');
    pCtx = canvas.getContext('2d');
    function resize() { pW = canvas.width = window.innerWidth; pH = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    resetParticles();
    tickParticles();
}

function getParticleConfig() {
    return isNight ? NIGHT_PARTICLES : SEASON_CONFIG[currentSeason];
}

function resetParticles() {
    const cfg = getParticleConfig();
    particles = Array.from({ length: cfg.count }, () => mkP(cfg, true));
}

function mkP(cfg, randomY) {
    const [lo, hi] = cfg.sizeRange;
    return {
        x: Math.random() * (pW || innerWidth),
        y: randomY ? Math.random() * (pH || innerHeight) : -10,
        s: Math.random() * (hi - lo) + lo,
        c: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        a: Math.random() * 0.5 + 0.15,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.5 + 0.2
    };
}

function tickParticles() {
    if (!pCtx) return;
    const cfg = getParticleConfig();
    const t = Date.now() / 1000;
    pCtx.clearRect(0, 0, pW, pH);

    for (const p of particles) {
        let a = p.a;
        if (cfg.movement === 'float' || cfg.movement === 'twinkle') {
            a = p.a * (0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + p.ph)));
        }
        pCtx.globalAlpha = a;
        pCtx.fillStyle = p.c;
        const sz = Math.round(p.s);
        pCtx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);

        switch (cfg.movement) {
            case 'drift':    p.x += Math.sin(t * 0.5 + p.ph) * 0.4; p.y += p.sp * 0.5; break;
            case 'float':    p.x += Math.sin(t * 0.3 + p.ph) * 0.3; p.y += Math.sin(t * 0.5 + p.ph * 2) * 0.2; break;
            case 'fall':     p.x += Math.sin(t * 0.8 + p.ph) * 0.5; p.y += p.sp * 0.6; break;
            case 'snow':     p.x += Math.sin(t * 0.4 + p.ph) * 0.35; p.y += p.sp * 0.45; break;
            case 'twinkle':  p.x += Math.sin(t * 0.2 + p.ph) * 0.15; p.y += Math.sin(t * 0.3 + p.ph) * 0.1; break;
        }

        if (p.y > pH + 10) { p.y = -10; p.x = Math.random() * pW; }
        if (p.x < -10) p.x = pW + 10;
        if (p.x > pW + 10) p.x = -10;
    }
    pCtx.globalAlpha = 1;
    requestAnimationFrame(tickParticles);
}

/* ── Scroll Reveal ── */

function initScrollReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.game-panel').forEach(p => obs.observe(p));
}

/* ── Console ── */

console.log(
    '%c🌾 Welcome to keta1930\'s Farm!\n%c🎮 Try switching seasons and day/night!',
    'font-size:18px;color:#5C8A4D;font-weight:bold;',
    'font-size:14px;color:#8B6914;'
);

document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🌙 zzz... - keta1930' : 'keta1930';
});
