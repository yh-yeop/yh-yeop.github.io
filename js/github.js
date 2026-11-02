// GitHub API 호출과 README/릴리스 노트 렌더링. 비로그인 API는 IP당 시간당 60회라 세션 캐시를 둔다.
import { USER } from './data.js';

const API = 'https://api.github.com';
const TTL = 10 * 60 * 1000;

export async function gh(path, { accept = 'application/vnd.github+json', text = false } = {}) {
  const key = `gh:${accept}:${path}`;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key));
    if (hit && Date.now() - hit.t < TTL) return hit.v;
  } catch {}
  const res = await fetch(API + path, { headers: { Accept: accept } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const v = text ? await res.text() : await res.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {}
  return v;
}

const HTML_JSON = 'application/vnd.github.html+json';

export const userRepos = () => gh(`/users/${USER}/repos?per_page=100&type=owner`);
export const releasesOf = repo => gh(`/repos/${USER}/${repo}/releases?per_page=100`, { accept: HTML_JSON });

function assetLabel(name) {
  if (/\.apk$/i.test(name)) return 'Android';
  if (/\.exe$/i.test(name)) return 'Windows';
  return null;
}

// prefix 가 있으면 '<prefix>-v<버전>' 태그 중 최신 정식 릴리스, 없으면 저장소의 최신 정식 릴리스
export function latestRelease(list, prefix) {
  const re = prefix ? new RegExp(`^${prefix}-v\\d`) : /./;
  const rel = list.find(r => !r.draft && !r.prerelease && re.test(r.tag_name));
  if (!rel) return null;
  const assets = [];
  for (const a of rel.assets || []) {
    const label = assetLabel(a.name);
    if (label && !assets.some(x => x.label === label)) assets.push({ label, url: a.browser_download_url });
  }
  assets.sort((a, b) => (b.label === 'Windows') - (a.label === 'Windows'));
  return {
    version: rel.tag_name.replace(/^.*?v(?=\d)/, ''),
    assets, page: rel.html_url, date: rel.published_at, notes: rel.body_html || '',
  };
}

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
