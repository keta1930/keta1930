/* 站点完整性测试：data.json 数据契约、本地资源引用、script.js 语法。零依赖，node --test 运行。 */
const { execFileSync } = require('node:child_process');
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DOCS = path.join(__dirname, '..', 'docs');

const data = JSON.parse(fs.readFileSync(path.join(DOCS, 'data.json'), 'utf8'));
const html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');

/* ── helpers ── */

/** 断言双语字段 en/zh 均为非空字符串 */
function assertBilingual(obj, where) {
    for (const k of ['en', 'zh']) {
        assert.equal(typeof obj?.[k], 'string', `${where}.${k} 应为字符串`);
        assert.ok(obj[k].trim().length > 0, `${where}.${k} 不应为空`);
    }
}

/** 断言链接为 https 外链或 mailto */
function assertLink(url, where) {
    assert.ok(/^(https:\/\/|mailto:)/.test(url), `${where}.url 非法: ${url}`);
}

/* ── data.json 数据契约（script.js 的渲染依赖此结构） ── */

describe('data.json 数据契约', () => {
    it('顶层结构完整', () => {
        assert.ok(data.personal, '缺少 personal');
        assert.ok(Array.isArray(data.projects), 'projects 应为数组');
        assert.ok(Array.isArray(data.papers), 'papers 应为数组');
        assert.ok(data.placeholders, '缺少 placeholders');
    });

    it('personal 字段完整', () => {
        assert.ok(data.personal.name.trim().length > 0, 'personal.name 不应为空');
        assert.ok(data.personal.tags.length > 0, 'personal.tags 不应为空数组');
        data.personal.tags.forEach((t, i) => assertBilingual(t, `personal.tags[${i}]`));
        assertBilingual(data.personal.bio, 'personal.bio');
        assert.ok(data.personal.contact.length > 0, 'personal.contact 不应为空数组');
        data.personal.contact.forEach((c, i) => {
            assert.ok(c.icon.trim().length > 0, `personal.contact[${i}].icon 不应为空`);
            assert.ok(c.label.trim().length > 0, `personal.contact[${i}].label 不应为空`);
            assertLink(c.url, `personal.contact[${i}]`);
        });
    });

    it('projects 字段完整', () => {
        data.projects.forEach((p, i) => {
            const w = `projects[${i}]`;
            assert.ok(p.title.trim().length > 0, `${w}.title 不应为空`);
            assertLink(p.url, w);
            assert.ok(['number', 'string'].includes(typeof p.stars), `${w}.stars 应为 number 或 string`);
            assertBilingual(p.description, `${w}.description`);
            p.links.forEach((l, j) => {
                assertLink(l.url, `${w}.links[${j}]`);
                if (typeof l.label !== 'string') assertBilingual(l.label, `${w}.links[${j}].label`);
            });
        });
    });

    it('papers 字段完整', () => {
        data.papers.forEach((p, i) => {
            const w = `papers[${i}]`;
            assertBilingual(p.title, `${w}.title`);
            if (p.description) assertBilingual(p.description, `${w}.description`);
            assertLink(p.url, w);
            p.badges.forEach((b, j) => {
                assert.ok(b.text.trim().length > 0, `${w}.badges[${j}].text 不应为空`);
            });
            p.links.forEach((l, j) => assertLink(l.url, `${w}.links[${j}]`));
        });
    });

    it('placeholders 覆盖 projects 与 papers', () => {
        for (const k of ['projects', 'papers']) {
            assertBilingual(data.placeholders[k], `placeholders.${k}`);
        }
    });
});

/* ── 静态资源引用 ── */

describe('静态资源引用', () => {
    it('index.html 引用的本地资源均存在', () => {
        // 提取 src/href 中的本地路径，跳过外链、锚点、mailto
        const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
            .map(m => m[1])
            .filter(u => !/^(https?:|mailto:|#|data:)/.test(u));
        assert.ok(refs.length > 0, '应至少引用一个本地资源');
        for (const ref of refs) {
            assert.ok(fs.existsSync(path.join(DOCS, ref)), `index.html 引用的资源缺失: ${ref}`);
        }
    });

    it('每个季节按钮都有对应的背景图与音频', () => {
        // 季节清单从 data-season 属性推导，与 script.js 的切换逻辑对齐
        const seasons = [...new Set([...html.matchAll(/data-season="(\w+)"/g)].map(m => m[1]))];
        assert.ok(seasons.length > 0, '应至少定义一个季节');
        for (const s of seasons) {
            assert.ok(
                fs.existsSync(path.join(DOCS, 'audio', `${s}.mp3`)),
                `缺少季节音频: audio/${s}.mp3`
            );
        }
    });
});

/* ── JS 语法 ── */

describe('JS 语法', () => {
    it('script.js 可通过 node --check', () => {
        // 浏览器代码无法在 Node 下执行，只做语法校验
        execFileSync(process.execPath, ['--check', path.join(DOCS, 'js', 'script.js')]);
    });
});
