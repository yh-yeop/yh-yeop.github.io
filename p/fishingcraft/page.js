// 피싱크래프트 소개 페이지: releases 저장소의 최신 Fishingcraft-v 릴리스(테스트 베타 포함)와 릴리스 노트.
// 소스 저장소는 비공개라 받을 파일은 yh-yeop/releases 에서 읽는다 (fishingcraft docs/DISTRIBUTION.md).
import { releasesOf, cleanHTML, formatMB } from '../../js/github.js';

const REPO = 'releases';
const TAG = /^Fishingcraft-v(?=\d)/;
const $ = s => document.querySelector(s);

/* ---------- 최신 릴리스 (프리릴리스 포함) ---------- */

const fmtDate = iso => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
// 0.2.0-beta.1 → '0.2.0 베타 1'
const label = v => v.replace(/-beta(?:\.(\d+))?$/, (_, n) => ` 베타${n ? ` ${n}` : ''}`);
const sha256 = a => (/^sha256:([0-9a-f]{64})$/i.exec(a?.digest || '') || [])[1]?.toLowerCase() || null;

async function loadRelease() {
  const rel = (await releasesOf(REPO)).find(r => !r.draft && TAG.test(r.tag_name));
  if (!rel) throw new Error('no release');
  const ver = label(rel.tag_name.replace(TAG, ''));
  const pack = rel.assets.find(a => a.name.endsWith('.mrpack'));
  const jar = rel.assets.find(a => a.name.endsWith('.jar'));
  const prism = rel.assets.find(a => /prism.*\.zip$/i.test(a.name));
  if (pack) {
    for (const id of ['#dl-hero', '#dl-side']) {
      $(id).href = pack.browser_download_url;
      $(id).setAttribute('aria-label', `피싱크래프트 ${ver} 모드팩 받기 (.mrpack, ${formatMB(pack.size)})`);
    }
    $('#dl-hero-meta').textContent = `.mrpack · ${formatMB(pack.size)}`;
    $('#dl-side-label').textContent = `모드팩 (.mrpack) · ${formatMB(pack.size)}`;
    const sum = sha256(pack);
    if (sum) {
      $('#sha').hidden = false;
      $('#sha-val').textContent = sum;
    }
  }
  if (jar) {
    $('#dl-jar').href = jar.browser_download_url;
    $('#dl-jar-label').textContent = `서버용 모드 (.jar) · ${formatMB(jar.size)}`;
  }
  if (prism) {
    $('#dl-prism').href = prism.browser_download_url;
    $('#dl-prism-label').textContent = `Prism 인스턴스 (자동 업데이트) · ${formatMB(prism.size)}`;
    $('#dl-prism').hidden = false;
  }
  $('#hero-meta').textContent = `${ver} · ${fmtDate(rel.published_at)} 공개 · Minecraft Java 26.3 · Fabric · 무료`;
  $('#info-ver').textContent = ver;
  $('#info-date').textContent = fmtDate(rel.published_at);
  $('#rel-link').href = rel.html_url;
  $('#notes-ver').textContent = ver;
  $('#notes').innerHTML = rel.body_html ? cleanHTML(rel.body_html, REPO) : '<p class="muted">이 버전에는 릴리스 노트가 없습니다.</p>';
}

loadRelease().catch(() => {
  $('#notes').innerHTML = '<p class="muted">릴리스 정보를 불러오지 못했습니다. <a href="https://github.com/yh-yeop/releases/releases?q=Fishingcraft&expanded=true">GitHub 릴리스 페이지</a>에서 확인하세요.</p>';
});

$('#sha-copy').addEventListener('click', async e => {
  try {
    await navigator.clipboard.writeText($('#sha-val').textContent);
    e.target.textContent = '복사됨';
  } catch {
    getSelection().selectAllChildren($('#sha-val'));
    e.target.textContent = '선택됨';
  }
  setTimeout(() => { e.target.textContent = '복사'; }, 1600);
});
