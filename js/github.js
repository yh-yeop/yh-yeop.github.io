// GitHub API 호출과 README/릴리스 노트 렌더링. 비로그인 API는 IP당 시간당 60회라 세션 캐시를 둔다.
import { USER } from './data.js';

const API = 'https://api.github.com';
const TTL = 10 * 60 * 1000;

export async function gh(path, { accept = 'application/vnd.github+json', text = false, ttl = TTL } = {}) {
  const key = `gh:${accept}:${path}`;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key));
    if (hit && Date.now() - hit.t < ttl) return hit.v;
  } catch {}
  const res = await fetch(API + path, { headers: { Accept: accept } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const v = text ? await res.text() : await res.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {}
  return v;
}

const HTML_JSON = 'application/vnd.github.html+json';

// 저장소 목록은 pushed_at 으로 portfolio.json 갱신을 알아채는 기준이라 짧게(1분) 캐시한다
export const userRepos = () => gh(`/users/${USER}/repos?per_page=100&type=owner`, { ttl: 60 * 1000 });
export const releasesOf = repo => gh(`/repos/${USER}/${repo}/releases?per_page=100`, { accept: HTML_JSON });

// 설치 파일만 고른다 (.sha256 · .sig 같은 부속 파일 제외). 압축본은 Windows 빌드로 본다(예: Fracture-0.9.0-beta-win64.zip)
function assetLabel(name) {
  if (/\.apk$/i.test(name)) return 'Android';
  if (/\.exe$/i.test(name) || /win(dows|32|64)?[^/]*\.zip$/i.test(name)) return 'Windows';
  return null;
}

// prefix 가 있으면 '<prefix>-v<버전>' 태그 중 최신 릴리스, 없으면 저장소의 최신 릴리스.
// 정식 릴리스만 보되, pre 면 프리릴리스(베타)도 포함한다.
export function latestRelease(list, prefix, { pre = false } = {}) {
  const re = prefix ? new RegExp(`^${prefix}-v\\d`) : /./;
  const rel = list.find(r => !r.draft && (pre || !r.prerelease) && re.test(r.tag_name));
  if (!rel) return null;
  const assets = [];
  for (const a of rel.assets || []) {
    const label = assetLabel(a.name);
    if (!label || assets.some(x => x.label === label)) continue;
    const sha = /^sha256:([0-9a-f]{64})$/i.exec(a.digest || '');
    assets.push({ label, url: a.browser_download_url, name: a.name, size: a.size, sha256: sha ? sha[1].toLowerCase() : null });
  }
  assets.sort((a, b) => (b.label === 'Windows') - (a.label === 'Windows'));
  return {
    version: rel.tag_name.replace(/^.*?v(?=\d)/, ''), name: rel.name || rel.tag_name, prerelease: rel.prerelease,
    assets, page: rel.html_url, date: rel.published_at, notes: rel.body_html || '',
  };
}

export const formatMB = bytes => `${(bytes / 1048576).toFixed(1)} MB`;

// 화면에 보일 버전: 0.9.0-beta → '0.9.0 베타', 0.9.1-beta.2 → '0.9.1 베타 2', 1.5.2 → 'v1.5.2'
export const versionLabel = v => /-beta/.test(v) ? v.replace(/-beta(?:\.(\d+))?$/, (_, n) => ` 베타${n ? ` ${n}` : ''}`) : `v${v}`;

const DROP = 'script,style,iframe,object,embed,form,link,meta,base';

// GitHub가 렌더링한 HTML을 정리한다: 위험한 요소 제거, 상대 경로를 저장소 기준 절대 경로로, 링크는 새 탭.
export function cleanHTML(html, repo) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  root.querySelectorAll(DROP).forEach(el => el.remove());
  root.querySelector('#readme')?.removeAttribute('id');
  // 제목 옆 링크 아이콘은 지우되, 그 링크가 갖고 있던 id(목차 이동 대상)는 제목 쪽으로 옮긴다
  root.querySelectorAll('a.anchor').forEach(el => {
    if (el.id && el.parentElement) el.parentElement.id = el.id;
    el.remove();
  });
  for (const el of root.querySelectorAll('*')) {
    for (const { name, value } of [...el.attributes]) {
      if (name.startsWith('on') || /^\s*javascript:/i.test(value)) el.removeAttribute(name);
    }
  }
  const isAbs = u => /^([a-z][a-z\d+.-]*:|\/\/)/i.test(u);
  for (const img of root.querySelectorAll('img[src]')) {
    const src = img.getAttribute('src');
    if (!isAbs(src)) img.src = `https://raw.githubusercontent.com/${USER}/${repo}/HEAD/${src.replace(/^\.?\//, '')}`;
    img.loading = 'lazy';
    img.decoding = 'async';
  }
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (href.startsWith('#')) { a.dataset.anchor = decodeURIComponent(href.slice(1)); continue; }
    if (!isAbs(href)) a.href = `https://github.com/${USER}/${repo}/blob/HEAD/${href.replace(/^\.?\//, '')}`;
    a.target = '_blank';
    a.rel = 'noopener';
  }
  // 넓은 표는 페이지 대신 표 자체가 가로로 스크롤되게 감싼다
  for (const t of root.querySelectorAll('table')) {
    const box = doc.createElement('div');
    box.className = 'table-scroll';
    box.tabIndex = 0;
    t.replaceWith(box);
    box.append(t);
  }
  return root.innerHTML;
}

export const rawUrl = (repo, path) => `https://raw.githubusercontent.com/${USER}/${repo}/HEAD/${path.replace(/^\.?\//, '')}`;

// 공개 저장소 루트의 portfolio.json — 프로젝트가 스스로 들고 있는 소개 사이트 등록 정보(형식은 README). 없으면(404) null.
// 고치면 바로 반영되게: raw.githubusercontent.com 은 CDN 이 5분 캐시하고 쿼리로도 못 깨므로 API(캐시 60초)로 받는다.
// 대신 저장소의 pushed_at(version)이 바뀔 때만 다시 받고 그 사이엔 localStorage 값을 써서 API 횟수를 아낀다.
export async function portfolioOf(repo, version = '') {
  const key = `pf:${repo}`;
  let hit = null;
  try { hit = JSON.parse(localStorage.getItem(key)); } catch {}
  if (hit && version && hit.version === version) return hit.v;
  try {
    const res = await fetch(`${API}/repos/${USER}/${repo}/contents/portfolio.json`, { headers: { Accept: 'application/vnd.github.raw' } });
    if (!res.ok && res.status !== 404) throw new Error(`portfolio.json ${res.status}`);
    let v = null;
    if (res.ok) { try { v = JSON.parse(await res.text()); } catch { v = null; } }
    if (version) { try { localStorage.setItem(key, JSON.stringify({ version, v })); } catch {} }
    return v;
  } catch (e) {
    if (hit) return hit.v; // API 횟수 초과 등 → 지난 값이라도
    throw e;
  }
}

// 서브페이지에서 data-embed 가 붙은 부분과 대표 이미지(og:image)를 가져온다 → 첫 화면 카드에서 펼쳐 보기.
// 상대 경로는 서브페이지 기준으로 풀고, id 는 첫 화면의 id 와 겹치지 않게 지운다.
export async function pageEmbed(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`page ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  const parts = [...doc.querySelectorAll('[data-embed]')];
  const box = doc.createElement('div');
  box.append(...parts);
  box.querySelectorAll(DROP).forEach(el => el.remove());
  for (const el of box.querySelectorAll('*')) {
    el.removeAttribute('id');
    el.removeAttribute('aria-labelledby');
    for (const attr of ['src', 'href']) {
      const v = el.getAttribute(attr);
      if (v && !v.startsWith('#')) el.setAttribute(attr, new URL(v, url).href);
    }
  }
  const og = doc.querySelector('meta[property="og:image"]')?.content;
  return { image: og ? new URL(og, url).href : null, html: box.innerHTML };
}

export async function readmeHTML(repo) {
  const html = await gh(`/repos/${USER}/${repo}/readme`, { accept: 'application/vnd.github.html', text: true });
  return cleanHTML(html, repo);
}

// README 안의 '#제목' 링크: GitHub는 제목 id 앞에 'user-content-'를 붙인다. 주소창은 건드리지 않는다.
export function wireAnchors(container) {
  container.addEventListener('click', e => {
    const a = e.target.closest('a[data-anchor]');
    if (!a) return;
    const id = a.dataset.anchor;
    const target = container.querySelector(`[id="user-content-${CSS.escape(id)}"], [id="${CSS.escape(id)}"]`);
    if (!target) return;
    e.preventDefault();
    (target.closest('.markdown-heading') || target).scrollIntoView({ block: 'start' });
  });
}
