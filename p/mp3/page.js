// 받기 단추: releases 저장소가 Pages 로 내는 index.json(js/github.js 의 releaseIndex)에서 최신 정식 판을 찾아
// 설치 파일에 바로 잇고 버전 · 용량을 붙인다. 못 받으면 단추는 HTML 그대로 releases 목록(앱 이름으로 거른 것)으로 간다.
// 단추: <a data-app="<apps.json id>" data-plat="windows|android"><small data-ext=".exe">…</small></a>
// 버전 칸: <dd data-ver="<apps.json id>"> → 'v1.6.0 · 2026년 11월 20일'
// YTDL 소개(p/ytdl/page.js)와 같은 내용이다.
import { releaseIndex, formatMB, versionLabel } from '../../js/github.js';

const day = iso => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

async function load() {
  const apps = (await releaseIndex()).apps;
  const stable = id => apps.find(x => x.id === id)?.stable;
  for (const a of document.querySelectorAll('a[data-app]')) {
    const r = stable(a.dataset.app);
    const f = r?.assets?.[a.dataset.plat];
    if (!f?.url) continue;
    a.href = f.url;
    a.title = f.name;
    const sm = a.querySelector('small');
    if (sm) sm.textContent = `${sm.dataset.ext} · ${versionLabel(r.version)} · ${formatMB(f.size)}`;
  }
  for (const el of document.querySelectorAll('[data-ver]')) {
    const r = stable(el.dataset.ver);
    if (r) el.textContent = `${versionLabel(r.version)} · ${day(r.published_at)}`;
  }
}

load().catch(() => {});
