const LANGUAGES = { en: 'EN', zh: '中文' };
let lang = localStorage.getItem('lang') || 'en';
let data = null;

document.addEventListener('DOMContentLoaded', async () => {
    data = await loadData();
    if (!data) return;
    applyLanguage();
    renderAll();
    initNav();
    initLangSwitcher();
    initParticles();
    initScrollReveal();
    initSeason();
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

function renderAll() {
    renderAbout();
    renderProjects();
    renderPapers();
}

function renderAbout() {
    const p = data.personal;

    document.getElementById('aboutTags').innerHTML = p.tags
        .map(t => `<span class="pixel-tag" data-en="${t.en}" data-zh="${t.zh}">${t[lang]}</span>`)
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

    cards.push(`<div class="item-card placeholder">
        <span class="placeholder-text" data-en="${data.placeholders.projects.en}" data-zh="${data.placeholders.projects.zh}">${data.placeholders.projects[lang]}</span>
    </div>`);

    grid.innerHTML = cards.join('');
}

function renderPapers() {
    const grid = document.getElementById('papersGrid');
    const cards = data.papers.map(p => {
        const title = p.title[lang];
        return `<div class="item-card">
            <div class="item-card-header">
                <h3 class="item-card-title"><a href="${p.url}" target="_blank">
                    <span data-en="${esc(p.title.en)}" data-zh="${esc(p.title.zh)}">${title}</span>
                </a></h3>
            </div>
            <div>${p.badges.map(b => `<span class="venue-tag">${b.text}</span>`).join('')}</div>
            <div class="item-card-links">${p.links.map(linkHTML).join('')}</div>
        </div>`;
    });

    cards.push(`<div class="item-card placeholder">
        <span class="placeholder-text" data-en="${data.placeholders.papers.en}" data-zh="${data.placeholders.papers.zh}">${data.placeholders.papers[lang]}</span>
    </div>`);

    grid.innerHTML = cards.join('');
}

function linkHTML(l) {
    const label = typeof l.label === 'string' ? l.label : l.label[lang];
    const enAttr = typeof l.label === 'string' ? '' : ` data-en="${esc(l.label.en)}" data-zh="${esc(l.label.zh)}"`;
    return `<a href="${l.url}" target="_blank" class="pixel-link">
        <i class="${l.icon}"></i><span${enAttr}>${label}</span></a>`;
}

function esc(s) {
    return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ── Navigation ── */

function initNav() {
    const links = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.game-panel');

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

/* ── Pixel Particles ── */

function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    const colors = ['#5C8A4D', '#7CB868', '#FFD700', '#E87E4D', '#87CEEB'];

    let W, H;
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 35 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        s: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        c: colors[Math.floor(Math.random() * colors.length)],
        a: Math.random() * 0.4 + 0.15
    }));

    (function loop() {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
            ctx.globalAlpha = p.a;
            ctx.fillStyle = p.c;
            const sz = Math.round(p.s);
            ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
            if (p.x < -12) p.x = W + 12;
            if (p.x > W + 12) p.x = -12;
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(loop);
    })();
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

/* ── Season Badge ── */

function initSeason() {
    const m = new Date().getMonth();
    const seasons = [
        { en: 'Winter', zh: '冬', icon: '❄️' },
        { en: 'Winter', zh: '冬', icon: '❄️' },
        { en: 'Spring', zh: '春', icon: '🌸' },
        { en: 'Spring', zh: '春', icon: '🌸' },
        { en: 'Spring', zh: '春', icon: '🌸' },
        { en: 'Summer', zh: '夏', icon: '☀️' },
        { en: 'Summer', zh: '夏', icon: '☀️' },
        { en: 'Summer', zh: '夏', icon: '☀️' },
        { en: 'Fall', zh: '秋', icon: '🍂' },
        { en: 'Fall', zh: '秋', icon: '🍂' },
        { en: 'Fall', zh: '秋', icon: '🍂' },
        { en: 'Winter', zh: '冬', icon: '❄️' }
    ];
    const s = seasons[m];
    const badge = document.getElementById('seasonBadge');
    badge.textContent = `${s.icon} ${s[lang]}`;
    badge.setAttribute('data-en', `${s.icon} ${s.en}`);
    badge.setAttribute('data-zh', `${s.icon} ${s.zh}`);
}

/* ── Console ── */

console.log(
    '%c🌾 Welcome to keta1930\'s Farm!\n%c🎮 Stardew Valley themed portfolio',
    'font-size:18px;color:#5C8A4D;font-weight:bold;',
    'font-size:14px;color:#8B6914;'
);

document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🌙 zzz... - keta1930' : 'keta1930';
});
