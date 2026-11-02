// Fracture 소개 페이지: 스크린샷 갤러리 + GitHub에서 최신 베타(프리릴리스) 정보와 릴리스 노트를 불러온다.
import { appRelease, releaseNotes, cleanHTML, formatMB, versionLabel } from '../../js/github.js';

const IMG = '../../assets/fracture/';
const SHOTS = [
  ['p_chase2', '천장을 뚫고 떨어진 진압 병기. 시간 앵커로 몸을 당겨 위로 달아난다.'],
  ['device_overload', '시간 간섭 장치 — 가동. 그리고 출력 한계 초과.'],
  ['echo_warn', '첫 보스 에코 헌터. 몇 초 전의 내 움직임을 되풀이하며 쏜다.'],
  ['self_echo', '에코는 과거의 나다. 같은 길, 같은 박자로 덮쳐 온다.'],
  ['sniper', '잔상 저격수. 멈춰 서 있으면 맞는다 — 계속 움직일 것.'],
  ['era_future', '과거와 미래의 발판이 번갈아 나타나는 시간대 블록.'],
  ['p_chase5', '추격은 위로, 더 위로.'],
  ['m_gap1', '외곽 폐허. 건널 수 없는 틈 아래로 불빛이 새어 나온다.'],
  ['z_take', '추락한 수송기. 아직 살아 있는 추진 셀을 되찾는다.'],
  ['s_camp', '폐허에 남은 글씨 — 우리는 아직 여기 있다.'],
  ['lineup', '001, 그리고 도시의 기계들.'],
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

// 두 번째 스크린샷부터는 미리 받아 두어 넘길 때 깜빡이지 않게
addEventListener('load', () => SHOTS.slice(1).forEach(([n]) => { new Image().src = `${IMG}${n}.webp`; }));

/* ---------- 최신 베타 ---------- */

const fmtDate = iso => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

async function loadRelease() {
  const rel = await appRelease('Fracture', { pre: true });
  if (!rel) throw new Error('no release');
  const win = rel.assets.find(a => a.label === 'Windows');
  const ver = versionLabel(rel.version);
  if (win) {
    for (const id of ['#dl-hero', '#dl-side']) {
      $(id).href = win.url;
      $(id).setAttribute('aria-label', `Fracture ${ver} Windows용 받기 (zip, ${formatMB(win.size)})`);
    }
    $('#dl-hero-meta').textContent = `Windows · ${formatMB(win.size)}`;
    $('#dl-side-label').textContent = `Windows용 받기 · ${formatMB(win.size)}`;
    if (win.sha256) {
      $('#sha').hidden = false;
      $('#sha-val').textContent = win.sha256;
    }
  }
  $('#hero-meta').textContent = `${ver} · ${fmtDate(rel.date)} 공개 · Windows 10/11 64비트 · 무료`;
  $('#info-ver').textContent = ver;
  $('#info-date').textContent = fmtDate(rel.date);
  $('#rel-link').href = rel.page;
  $('#notes-ver').textContent = ver;
  const notes = await releaseNotes(rel, 'releases');
  $('#notes').innerHTML = notes ? cleanHTML(notes, 'releases') : '<p class="muted">이 버전에는 릴리스 노트가 없습니다.</p>';
}

loadRelease().catch(() => {
  $('#notes').innerHTML = '<p class="muted">릴리스 정보를 불러오지 못했습니다. <a href="https://github.com/yh-yeop/releases/releases?q=Fracture">GitHub 릴리스 페이지</a>에서 확인하세요.</p>';
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
