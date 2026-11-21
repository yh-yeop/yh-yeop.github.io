// AutoCroper 소개 페이지: 자기 저장소(yh-yeop/AutoCroper)의 최신 정식 릴리스에서 Windows 설치 파일을 찾아 받기 단추에 바로 잇는다.
// 못 받으면(API 횟수 초과 등) 단추는 HTML 그대로 releases/latest 로 간다. 첫 화면 카드와 같은 함수(js/github.js)를 쓴다.
import { releasesOf, latestRelease, formatMB, versionLabel } from '../../js/github.js';

const REPO = 'AutoCroper';

async function loadRelease() {
  const rel = latestRelease(await releasesOf(REPO));
  if (!rel) return;
  const ver = versionLabel(rel.version);
  const win = rel.assets.find(a => a.label === 'Windows');
  if (win) {
    for (const a of document.querySelectorAll('a[data-dl]')) {
      a.href = win.url;
      a.title = win.name;
      a.setAttribute('aria-label', `AutoCroper ${ver} Windows 설치 파일 받기 (${formatMB(win.size)})`);
      const sm = a.querySelector('small');
      if (sm) sm.textContent = `.exe · ${ver}`;
    }
  }
  const info = document.getElementById('info-ver');
  info.textContent = `${ver} · ${new Date(rel.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  if (win) info.textContent += ` · 설치 파일 ${formatMB(win.size)}`;
}

loadRelease().catch(() => {});
