// 산업크래프트 소개 페이지: 스크린샷 갤러리 + sanupcraft 저장소의 최신 릴리스(테스트 베타 포함)와 릴리스 노트.
import { releasesOf, cleanHTML, formatMB } from '../../js/github.js';

const REPO = 'sanupcraft';
const IMG = '../../assets/sanupcraft/';
const SHOTS = [
  ['factory', '증기 공장. 보일러의 증기가 파이프를 타고 분쇄기 · 합금로 · 압착기 · 조립대로 간다.'],
  ['factory-close', '컨베이어 벨트와 증기 굴착기. 굴착기는 아래 9x9를 파서 광석만 올려 보낸다.'],
  ['bosses', '녹슨 수호자와 용광로 파수꾼. 보스마다 전용 모델과 빛나는 부분이 있다.'],
  ['guardian', '첫 보스 녹슨 수호자. 강철 한 벌을 갖추고 여럿이 맞선다.'],
  ['shrine', '숲속의 녹슨 사당. 가운데 수호자 제단, 상자에는 소환석이 들어 있다.'],
  ['gear', '강철 장비와 그 윗단계인 내열 장비.'],
  ['warden', '네더에서만 깨어나는 용광로 파수꾼.'],
  ['outpost', '네더 전초기지. 용암 옆 지열 분출구의 증기로 드릴 굴착기와 심장 제련로를 돌린다.'],
  ['colossus', '마지막 보스 공허 거상. 공허 수정 넷이 지키는 동안은 상처 하나 나지 않는다.'],
  ['end', '엔드에서 얻은 재료로 만든 엔더 수신기와 엔더 닻.'],
  ['alloy-screen', '합금로: 철가루와 석탄 가루로 강철 주괴를 만든다.'],
  ['guide', '"산업크래프트" 발전 과제 탭이 다음에 할 일을 알려 준다.'],
];

const $ = s => document.querySelector(s);
let cur = 0;

function show(i, { focusThumb = false } = {}) {
  cur = (i + SHOTS.length) % SHOTS.length;
  const [name, caption] = SHOTS[cur];
  $('#shot-img').src = `${IMG}${name}.webp`;
  $('#shot-img').alt = caption;
  $('#shot-caption').textContent = `${cur + 1} / ${SHOTS.length} · ${caption}`;
  document.querySelectorAll('.thumb').forEach((t, k) => t.setAttribute('aria-current', k === cur));
  const t = document.querySelectorAll('.thumb')[cur];
  t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (focusThumb) t.focus();
  if ($('#lightbox').open) {
    $('#lb-img').src = `${IMG}${name}.webp`;
    $('#lb-img').alt = caption;
    $('#lb-caption').textContent = `${cur + 1} / ${SHOTS.length} · ${caption}`;
  }
}

$('#thumbs').innerHTML = SHOTS.map(([name, caption], i) =>
  `<button class="thumb" type="button" data-i="${i}" aria-label="${i + 1}번째 스크린샷: ${caption}">
     <img src="${IMG}${name}-t.webp" alt="" width="400" height="225" loading="lazy">
   </button>`).join('');
$('#thumbs').addEventListener('click', e => { const b = e.target.closest('.thumb'); if (b) show(+b.dataset.i); });
$('#thumbs').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(cur + (e.key === 'ArrowRight' ? 1 : -1), { focusThumb: true }); }
});
$('#shot-prev').addEventListener('click', () => show(cur - 1));
$('#shot-next').addEventListener('click', () => show(cur + 1));
$('#lb-prev').addEventListener('click', () => show(cur - 1));
$('#lb-next').addEventListener('click', () => show(cur + 1));
$('#shot-open').addEventListener('click', () => { $('#lightbox').showModal(); show(cur); });
$('#lb-close').addEventListener('click', () => $('#lightbox').close());
$('#lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#lightbox').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') show(cur + 1);
  if (e.key === 'ArrowLeft') show(cur - 1);
});
show(0);

addEventListener('load', () => SHOTS.slice(1).forEach(([n]) => { new Image().src = `${IMG}${n}.webp`; }));

/* ---------- 최신 릴리스 (프리릴리스 포함) ---------- */

const fmtDate = iso => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
// 0.2.0-beta.1 → '0.2.0 베타 1'
const label = v => v.replace(/-beta(?:\.(\d+))?$/, (_, n) => ` 베타${n ? ` ${n}` : ''}`);
const sha256 = a => (/^sha256:([0-9a-f]{64})$/i.exec(a?.digest || '') || [])[1]?.toLowerCase() || null;

async function loadRelease() {
  const rel = (await releasesOf(REPO)).find(r => !r.draft);
  if (!rel) throw new Error('no release');
  const ver = label(rel.tag_name.replace(/^v/, ''));
  const pack = rel.assets.find(a => a.name.endsWith('.mrpack'));
  const jar = rel.assets.find(a => a.name.endsWith('.jar'));
  if (pack) {
    for (const id of ['#dl-hero', '#dl-side']) {
      $(id).href = pack.browser_download_url;
      $(id).setAttribute('aria-label', `산업크래프트 ${ver} 모드팩 받기 (.mrpack, ${formatMB(pack.size)})`);
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
  $('#hero-meta').textContent = `${ver} · ${fmtDate(rel.published_at)} 공개 · Minecraft Java 26.3 · Fabric · 무료`;
  $('#info-ver').textContent = ver;
  $('#info-date').textContent = fmtDate(rel.published_at);
  $('#rel-link').href = rel.html_url;
  $('#notes-ver').textContent = ver;
  $('#notes').innerHTML = rel.body_html ? cleanHTML(rel.body_html, REPO) : '<p class="muted">이 버전에는 릴리스 노트가 없습니다.</p>';
}

loadRelease().catch(() => {
  $('#notes').innerHTML = '<p class="muted">릴리스 정보를 불러오지 못했습니다. <a href="https://github.com/yh-yeop/sanupcraft/releases">GitHub 릴리스 페이지</a>에서 확인하세요.</p>';
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
