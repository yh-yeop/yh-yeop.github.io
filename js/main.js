import { GH, PAGES, CATS, PROJECTS, HIDE } from './data.js';
import { userRepos, releasesOf, latestRelease, releaseIndex, fromIndex, releaseNotes, platformLabel, readmeHTML, cleanHTML, wireAnchors, formatMB, versionLabel, portfolioOf, rawUrl, pageEmbed } from './github.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = {
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
};

const state = { cat: 'all', q: '', sort: 'pick', repos: {}, releases: {}, open: new Set(), docs: {} };
const byId = id => PROJECTS.find(p => p.id === id);

function ago(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d < 1) return '오늘';
  if (d < 30) return `${d}일 전`;
  if (d < 365) return `${Math.floor(d / 30)}개월 전`;
  return `${Math.floor(d / 365)}년 전`;
}

function updatedAt(p) {
  const times = p.repos.map(r => state.repos[r]?.pushed_at).filter(Boolean);
  const rel = state.releases[p.id];
  if (rel?.date) times.push(rel.date);
  return times.sort().pop() || '';
}

// 아이콘 파일이 있으면 그림, 없으면 분류 색 위에 글자 하나
function icon(p, size) {
  return p.icon
    ? `<img class="ico" src="${esc(p.icon)}" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="ico mono" aria-hidden="true">${esc(p.mono)}</span>`;
}

// 펼쳐 읽을 문서: 소스가 공개면 README, 비공개 앱이면 최신 릴리스 노트
function docKind(p) {
  if (p.page) return 'page';
  if (p.closed) return p.release ? 'notes' : null;
  return p.repos.length ? 'readme' : null;
}

function downloads(p) {
  const rel = state.releases[p.id];
  const fallback = p.release.prefix
    ? `${GH}/releases/releases?q=${encodeURIComponent(p.release.prefix)}`
    : `${GH}/${p.release.repo}/releases/latest`;
  if (!rel || !rel.assets.length) return [`<a class="btn primary" href="${fallback}">${ICON.down} 다운로드</a>`];
  const out = rel.assets.map(a =>
    `<a class="btn primary" href="${esc(a.url)}" aria-label="${esc(p.title)} ${esc(a.label)}용 ${esc(versionLabel(rel.version))} 받기">${ICON.down} ${esc(a.label)}</a>`);
  if (!p.closed) out.push(`<a class="btn" href="${esc(rel.page)}">릴리스 노트</a>`);
  return out;
}

// 이 사이트(yh-yeop.github.io) 아래 웹 프로젝트는 manifest 와 /install.js 를 갖춰 앱으로 설치할 수 있다.
// ?install 을 붙여 열면 그 페이지가 설치 버튼을 바로 띄운다. 설치를 지원하지 않는 프로젝트는 pwa: false.
// 베타: data.js · portfolio.json 의 beta: true, 또는 프리릴리스를 최신으로 보는 앱
const isBeta = p => Boolean(p.beta || p.release?.pre);
// 개발 단계: stage 가 있으면 그것, 없으면 베타 여부로. null 이면 개발 완료
const STAGES = { planning: '개발 기획 중', alpha: '알파', beta: '베타' };
const stageOf = p => (STAGES[p.stage] ? p.stage : isBeta(p) ? 'beta' : null);
const stageBadge = p => { const s = stageOf(p); return s ? ` <span class="beta stage-${s}">${STAGES[s]}</span>` : ''; };
const installable = p => p.live && p.pwa !== false && p.live.startsWith(PAGES + '/');
function installUrl(live) {
  const u = new URL(live);
  u.search += (u.search ? '&' : '?') + 'install';
  return u.href;
}

function card(p) {
  const c = CATS[p.cat];
  const main = state.repos[p.repos[0]];
  const rel = state.releases[p.id];
  const open = state.open.has(p.id);
  const kind = docKind(p);

  const actions = [];
  if (p.page) actions.push(`<a class="btn primary" href="${esc(p.page)}" aria-label="${esc(p.title)} 소개 페이지">${ICON.open} 소개 페이지</a>`);
  if (p.live) actions.push(`<a class="btn primary" href="${p.live}" aria-label="${esc(p.title)} 열기">${ICON.open} 열기</a>`);
  if (installable(p)) actions.push(`<a class="btn" href="${installUrl(p.live)}" aria-label="${esc(p.title)} 앱으로 설치">${ICON.down} 앱으로 설치</a>`);
  if (p.release) actions.push(...downloads(p));
  const sources = p.sources || p.repos.map(r => ['소스', r]);
  for (const [label, r] of sources) actions.push(`<a class="btn" href="${GH}/${r}" aria-label="${esc(p.title)} ${label} (GitHub)">${ICON.code} ${label}</a>`);
  if (p.closed) actions.push('<span class="note">소스 비공개</span>');

  const meta = [];
  const up = updatedAt(p);
  if (up) meta.push(`<span>업데이트 ${ago(up)}</span>`);
  if (rel?.version) meta.push(`<span>최신 ${esc(versionLabel(rel.version))}</span>`);
  if (main?.stargazers_count) meta.push(`<span>★ ${main.stargazers_count}</span>`);
  if (main?.license?.spdx_id && main.license.spdx_id !== 'NOASSERTION') meta.push(`<span>${esc(main.license.spdx_id)}</span>`);

  const docLabel = kind === 'page' ? '소개'
    : kind === 'notes' ? `릴리스 노트${rel?.version ? ` ${esc(versionLabel(rel.version))}` : ''}` : 'README';
  const doc = kind ? `<div class="doc">
      <button class="doc-toggle" type="button" aria-expanded="${open}" aria-controls="doc-${p.id}" data-doc="${p.id}">
        ${ICON.doc}<span>${docLabel} ${open ? '접기' : '펼치기'}</span>${ICON.chev}
      </button>
      <div class="doc-body" id="doc-${p.id}" role="region" aria-label="${esc(p.title)} ${docLabel}"${open ? '' : ' hidden'}></div>
    </div>` : '';

  return `<article class="card${open ? ' open' : ''}" id="p-${p.id}" style="--cat:${c.color}" aria-labelledby="t-${p.id}">
    <div class="card-head">
      ${icon(p, 48)}
      <div class="head-text">
        <span class="cat">${c.label}</span>
        <h4 id="t-${p.id}">${esc(p.title)}${stageBadge(p)}</h4>
        ${p.repos.length ? `<span class="repo">${p.repos.map(esc).join(' · ')}</span>` : ''}
      </div>
    </div>
    ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
    ${p.points?.length ? `<ul>${p.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${p.tags?.length ? `<div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}
    <div class="actions">${actions.join('')}</div>
    ${doc}
  </article>`;
}

/* ---------- README / 릴리스 노트 펼치기 ---------- */

function docFooter(p) {
  const kind = docKind(p);
  const rel = state.releases[p.id];
  const src = kind === 'notes'
    ? (rel?.page || `${GH}/releases/releases?q=${encodeURIComponent(p.release.prefix)}`)
    : `${GH}/${p.repos[0]}#readme`;
  const more = kind === 'page'
    ? `<a class="btn primary" href="${esc(p.page)}">${ICON.open} 소개 페이지 전체 보기</a>`
    : `<a class="btn" href="${esc(src)}">${ICON.code} GitHub에서 보기</a>`;
  return `<div class="doc-foot">
    ${more}
    <button class="btn" type="button" data-doc="${p.id}">접기</button>
  </div>`;
}

async function fillDoc(p) {
  const body = document.getElementById('doc-' + p.id);
  if (!body) return;
  if (state.docs[p.id]) { body.innerHTML = state.docs[p.id] + docFooter(p); return; }
  body.innerHTML = '<p class="doc-status" role="status">불러오는 중…</p>';
  try {
    const kind = docKind(p);
    if (kind === 'page') {
      const { image, html } = await pageEmbed(new URL(p.page, location.href).href);
      state.docs[p.id] = `<div class="embed">${image ? `<img class="embed-hero" src="${esc(image)}" alt="" loading="lazy">` : ''}${html}</div>`;
    } else if (kind === 'notes') {
      const rel = state.releases[p.id];
      if (!rel) throw new Error('no release');
      const notes = await releaseNotes(rel, p.release.repo);
      state.docs[p.id] = `<div class="markdown">${notes ? cleanHTML(notes, p.release.repo) : '<p>이 버전에는 릴리스 노트가 없습니다.</p>'}</div>`;
    } else {
      state.docs[p.id] = `<div class="markdown">${await readmeHTML(p.repos[0])}</div>`;
    }
    if (document.getElementById('doc-' + p.id) === body) body.innerHTML = state.docs[p.id] + docFooter(p);
  } catch {
    body.innerHTML = `<p class="doc-status">불러오지 못했습니다. 잠시 뒤 다시 펼치거나 GitHub에서 보세요.</p>${docFooter(p)}`;
  }
}

function setHash(h) { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); }

function toggleDoc(id, force) {
  const p = byId(id);
  const cardEl = document.getElementById('p-' + id);
  if (!p || !cardEl) return;
  const open = force ?? !state.open.has(id);
  open ? state.open.add(id) : state.open.delete(id);
  const btn = cardEl.querySelector('.doc-toggle');
  const body = document.getElementById('doc-' + id);
  cardEl.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
  btn.querySelector('span').textContent = btn.querySelector('span').textContent.replace(/(펼치기|접기)$/, open ? '접기' : '펼치기');
  body.hidden = !open;
  if (open) {
    fillDoc(p);
    setHash('p/' + id);
  } else {
    if (location.hash === '#p/' + id) setHash(state.cat === 'all' ? '' : state.cat);
    cardEl.scrollIntoView({ block: 'nearest' });
    btn.focus({ preventScroll: true });
  }
}

/* ---------- 목록 ---------- */

function matches(p) {
  if (state.cat !== 'all' && p.cat !== state.cat) return false;
  if (!state.q) return true;
  const hay = [p.title, p.desc, ...(p.points || []), ...(p.tags || []), ...p.repos, CATS[p.cat].label].join(' ').toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every(w => hay.includes(w));
}

function renderChips() {
  const counts = { all: PROJECTS.length };
  for (const p of PROJECTS) counts[p.cat] = (counts[p.cat] || 0) + 1;
  const keys = ['all', ...Object.keys(CATS).filter(k => counts[k])];
  $('#chips').innerHTML = keys.map(k =>
    `<button class="chip" type="button" data-cat="${k}" aria-pressed="${state.cat === k}">${k === 'all' ? '전체' : CATS[k].label}<span class="n">${counts[k]}</span></button>`
  ).join('');
}

// 개발 완료 / 개발 중 묶음 하나. 비어 있으면 묶음째 숨긴다
function group(id, title, note, list) {
  if (!list.length) return '';
  return `<div class="group" aria-labelledby="g-${id}">
    <h3 class="group-h" id="g-${id}">${title}${note ? ` <small>${note}</small>` : ''}<span class="n">${list.length}개</span></h3>
    <div class="grid">${list.map(card).join('')}</div>
  </div>`;
}

function renderGrid() {
  let list = PROJECTS.filter(matches);
  if (state.sort === 'recent') list = [...list].sort((a, b) => updatedAt(b).localeCompare(updatedAt(a)));
  const done = list.filter(p => !stageOf(p)), dev = list.filter(p => stageOf(p));
  $('#grid').innerHTML = list.length
    ? group('done', '개발 완료', '', done) + group('dev', '개발 중', '알파 · 베타 · 기획 단계', dev)
    : `<div class="empty">찾는 프로젝트가 없습니다. 검색어를 바꾸거나 <button class="btn" type="button" id="reset">전체 보기</button></div>`;
  $('#count').textContent = `프로젝트 ${list.length}개 표시 중`;
  for (const p of list) if (state.open.has(p.id)) fillDoc(p);
}

function renderQuick() {
  const items = PROJECTS.filter(p => p.live || p.release);
  $('#quick').innerHTML = items.map(p => {
    const c = CATS[p.cat];
    const href = p.page || p.live || '#p/' + p.id;
    return `<a class="tile" style="--cat:${c.color}" href="${href}"${p.page || p.live ? '' : ` data-jump="${p.id}"`}>
      ${icon(p, 40)}
      <span class="tile-text"><b>${esc(p.title)}</b><span>${c.label}</span></span>
      <span class="kind">${p.live ? (stageOf(p) ? `웹 · ${STAGES[stageOf(p)]}` : '웹') : stageOf(p) ? STAGES[stageOf(p)] : '설치'}</span>
    </a>`;
  }).join('');
}

// featured 가 있는 프로젝트는 맨 위 배너로 알린다 (새 베타·출시 소식)
function renderFeatured() {
  const p = PROJECTS.find(x => x.featured);
  const box = $('#featured');
  if (!p) { box.hidden = true; return; }
  const f = p.featured;
  const rel = state.releases[p.id];
  const win = rel?.assets.find(a => a.label === 'Windows');
  box.hidden = false;
  // CSS 변수 안의 상대 경로는 site.css 기준으로 풀리므로 절대 주소로 넘긴다
  box.style.setProperty('--feat-img', `url("${new URL(f.image, location.href).href}")`);
  box.innerHTML = `<div class="feat-inner">
      <span class="feat-kicker">${esc(f.kicker)}${rel ? ` · ${esc(versionLabel(rel.version))}` : ''}</span>
      <h2 id="feat-h">${esc(p.title)}</h2>
      <p>${esc(f.tagline)}</p>
      <div class="feat-actions">
        <a class="btn primary" href="${esc(p.page)}">소개 페이지</a>
        ${win ? `<a class="btn feat-ghost" href="${esc(win.url)}" aria-label="${esc(p.title)} ${esc(versionLabel(rel.version))} Windows용 받기">${ICON.down} 받기 · ${formatMB(win.size)}</a>` : ''}
      </div>
    </div>`;
}

function render() { renderChips(); renderGrid(); }

// data.js 에 없는 공개 저장소는 그 저장소의 portfolio.json 으로 카드를 만든다 (없으면 GitHub 설명으로 '기타')
async function addUnknownRepos() {
  const known = new Set([...PROJECTS.flatMap(p => p.repos), ...HIDE]);
  const fresh = Object.values(state.repos).filter(r => !known.has(r.name) && !r.fork && !r.archived);
  const infos = await Promise.all(fresh.map(r => portfolioOf(r.name, r.pushed_at).catch(() => null)));
  fresh.forEach((r, i) => {
    const pf = infos[i] && typeof infos[i] === 'object' ? infos[i] : {};
    if (pf.hidden) return;
    const title = String(pf.title || r.name);
    let id = String(pf.id || r.name).toLowerCase().replace(/[^\w-]/g, '');
    if (byId(id)) id = 'x-' + id;
    const list = v => (Array.isArray(v) ? v.map(String) : null);
    PROJECTS.push({
      id, cat: CATS[pf.category] ? pf.category : 'etc', title, mono: String(pf.mono || title)[0].toUpperCase(),
      icon: typeof pf.icon === 'string' ? (/^https:\/\//.test(pf.icon) ? pf.icon : rawUrl(r.name, pf.icon)) : undefined,
      repos: [r.name],
      live: typeof pf.live === 'string' ? pf.live : (r.homepage || (r.has_pages ? `${PAGES}/${r.name}/` : '')),
      pwa: pf.pwa === false ? false : undefined,
      beta: pf.beta === true || undefined,
      stage: STAGES[pf.stage] ? pf.stage : undefined,
      desc: String(pf.desc || r.description || '설명이 아직 없습니다.'),
      points: list(pf.points) || undefined,
      tags: list(pf.tags) || (r.language ? [r.language] : []),
    });
  });
}

// releases 저장소의 apps.json 에만 있는 앱은 index.json 으로 카드를 만든다 (data.js 에 같은 앱이 있으면 그쪽이 우선)
function addIndexApps(index) {
  const known = new Set(PROJECTS.filter(p => p.release?.repo === 'releases').map(p => p.release.prefix));
  for (const a of index.apps) {
    if (known.has(a.id)) continue;
    let id = String(a.site || a.id).toLowerCase().replace(/[^\w-]/g, '');
    if (byId(id)) id = 'r-' + id;
    const list = v => (Array.isArray(v) ? v.map(String) : undefined);
    PROJECTS.push({
      id, cat: CATS[a.category] ? a.category : 'app', title: String(a.name), mono: String(a.name)[0].toUpperCase(),
      icon: typeof a.icon === 'string' ? a.icon : undefined,
      repos: [], release: { repo: 'releases', prefix: a.id, pre: Boolean(a.beta) }, closed: true,
      // 기본값(#p/<site>)이 아닌 소개 페이지 주소가 있으면 서브페이지로 다룬다
      ...(a.page && !a.page.includes('/#p/') ? { page: a.page } : {}),
      desc: String(a.desc || '설명이 아직 없습니다.'),
      points: list(a.points),
      tags: list(a.tags) || (a.platforms || []).map(platformLabel),
    });
  }
}

// 주소 끝 '#p/<id>' 로 들어오면 그 프로젝트를 펼쳐서 보여 준다. 서브페이지가 생긴 프로젝트는 그쪽으로 보낸다.
function openFromHash() {
  const m = location.hash.match(/^#p\/([\w-]+)$/);
  const p = m && byId(m[1]);
  if (!p) return false;
  if (p.page) { location.replace(p.page); return true; }
  state.cat = 'all'; state.q = ''; $('#q').value = '';
  if (docKind(p)) state.open.add(p.id);
  render();
  const el = document.getElementById('p-' + p.id);
  el.scrollIntoView({ block: 'start' });
  el.querySelector('h4').setAttribute('tabindex', '-1');
  el.querySelector('h4').focus({ preventScroll: true });
  return true;
}

// 소스 비공개 앱(releases 저장소)은 index.json 하나로, 자기 저장소에 릴리스가 있는 앱(ListUp)은 API 로 최신 릴리스를 고른다
async function loadLive() {
  const repoNames = [...new Set(PROJECTS.filter(p => p.release && p.release.repo !== 'releases').map(p => p.release.repo))];
  const [repos, index, ...rels] = await Promise.allSettled([userRepos(), releaseIndex(), ...repoNames.map(releasesOf)]);
  if (repos.status === 'fulfilled') {
    for (const r of repos.value) if (!r.private) state.repos[r.name] = r;
    await addUnknownRepos();
  }
  const relBy = Object.fromEntries(repoNames.map((n, i) => [n, rels[i].status === 'fulfilled' ? rels[i].value : null]));
  const apps = index.status === 'fulfilled' ? new Map(index.value.apps.map(a => [a.id, a])) : null;
  if (apps) addIndexApps(index.value);
  else relBy.releases = await releasesOf('releases').catch(() => null); // index.json 을 못 받으면 예전처럼 API 목록에서
  for (const p of PROJECTS) {
    if (!p.release) continue;
    const { repo, prefix, pre } = p.release;
    const app = repo === 'releases' && apps?.get(prefix);
    const rel = app ? fromIndex(app, { pre }) : relBy[repo] && latestRelease(relBy[repo], prefix, { pre });
    if (rel) state.releases[p.id] = rel;
  }
  renderFeatured(); renderQuick(); render();
}

/* ---------- 이벤트 ---------- */

const root = document.documentElement;
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch {}
$('#theme').addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
});

$('#chips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.cat = b.dataset.cat;
  setHash(state.cat === 'all' ? '' : state.cat);
  render();
});
$('#q').addEventListener('input', e => { state.q = e.target.value.trim(); renderGrid(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
$('#grid').addEventListener('click', e => {
  const t = e.target.closest('[data-doc]');
  if (t) { toggleDoc(t.dataset.doc); return; }
  if (e.target.id === 'reset') { state.cat = 'all'; state.q = ''; $('#q').value = ''; render(); }
});
wireAnchors($('#grid'));
$('#quick').addEventListener('click', e => {
  const t = e.target.closest('[data-jump]'); if (!t) return;
  e.preventDefault();
  state.cat = 'all'; state.q = ''; $('#q').value = ''; render();
  const el = document.getElementById('p-' + t.dataset.jump);
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  el.querySelector('.actions a')?.focus({ preventScroll: true });
});
document.addEventListener('keydown', e => {
  if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); }
  if (e.key === 'Escape' && document.activeElement === $('#q') && $('#q').value) { $('#q').value = ''; state.q = ''; renderGrid(); }
});
addEventListener('hashchange', openFromHash);

const hashCat = location.hash.slice(1);
if (CATS[hashCat]) state.cat = hashCat;
renderFeatured(); renderQuick(); render();
openFromHash();
loadLive().catch(() => {}).finally(() => {
  // 릴리스 정보가 늦게 오면 펼쳐 둔 릴리스 노트를 다시 채운다
  for (const id of state.open) if (docKind(byId(id)) === 'notes' && !state.docs[id]) fillDoc(byId(id));
});
