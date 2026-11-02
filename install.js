// yh-yeop.github.io 의 웹 프로젝트가 같이 쓰는 "앱으로 설치" 안내.
// 각 프로젝트 index.html <head> 에 manifest 링크 다음 <script src="/install.js"></script> 한 줄을 둔다.
// defer 를 붙이지 않는다: 페이지 스크립트가 주소의 쿼리를 지우기(공유 링크 처리 등) 전에 ?install 을 읽어야 한다.
// - 페이지에 [data-pwa-install] 요소가 있으면 그것을 설치 버튼으로 쓰고(hidden 을 풀어 줌), 없으면 화면 아래에 작은 버튼을 띄운다.
// - 주소에 ?install 이 붙어 오면(소개 사이트의 "앱으로 설치") 버튼을 오래 띄우고, 설치할 수 없는 브라우저면 이유를 알려 준다.
// - iOS 는 설치 창을 띄울 수 없으므로 "공유 → 홈 화면에 추가" 를 안내한다. 이미 앱으로 실행 중이면 아무것도 하지 않는다.
(() => {
  const app = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone;
  if (app || !document.querySelector('link[rel="manifest"]')) return;

  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const scope = location.pathname.replace(/[^/]*$/, '');
  const key = 'pwa-install-closed:' + scope;
  // ?install 은 이 탭이 열려 있는 동안 기억한다: 첫 방문에 서비스 워커가 페이지를 새로 고치거나 앱이 주소의 쿼리를 지워도 이어지게
  const flag = 'pwa-install-wanted:' + scope;
  const params = location.search.slice(1).split('&').filter(Boolean);
  const rest = params.filter(s => s !== 'install' && !s.startsWith('install='));
  let wanted = rest.length < params.length;
  if (wanted) history.replaceState(history.state, '', location.pathname + (rest.length ? '?' + rest.join('&') : '') + location.hash);
  try {
    if (wanted) sessionStorage.setItem(flag, '1');
    else wanted = sessionStorage.getItem(flag) === '1';
  } catch {}
  let closed = false;
  try { closed = !wanted && localStorage.getItem(key) === '1'; } catch {}

  let deferred = null;
  let pill = null;
  let started = false; // 본문이 준비되기 전에는 버튼을 붙이지 않는다
  const own = () => [...document.querySelectorAll('[data-pwa-install]')];

  async function install() {
    if (deferred) {
      const ev = deferred;
      deferred = null;
      ev.prompt();
      const { outcome } = await ev.userChoice.catch(() => ({}));
      if (outcome === 'accepted') hideAll();
      else refresh();
      return;
    }
    if (ios) showPill('iOS', true);
  }

  function refresh() {
    if (!started) return;
    const can = !!deferred || ios;
    for (const el of own()) el.hidden = !can;
    if (!own().length && can && !closed) showPill(deferred ? 'prompt' : 'iOS', wanted);
  }

  function hideAll() {
    try { sessionStorage.removeItem(flag); } catch {}
    deferred = null;
    for (const el of own()) el.hidden = true;
    pill?.remove();
    pill = null;
  }

  const TIP = {
    iOS: 'Safari 아래쪽의 공유 버튼(네모에 위쪽 화살표)을 누르고 <b>홈 화면에 추가</b>를 고르세요.',
    none: '이미 설치했거나, 이 브라우저는 앱 설치를 지원하지 않습니다. Chrome·Edge·삼성 인터넷에서 열면 설치할 수 있습니다.',
  };

  // mode: 'prompt'(설치 창) · 'iOS'(홈 화면 추가 안내) · 'none'(설치 불가 안내), tip: 안내 문구를 펼칠지
  function showPill(mode, tip = false) {
    if (!pill) {
      pill = document.createElement('div');
      pill.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;max-width:calc(100vw - 32px)';
      const root = pill.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        :host { all: initial; }
        .box { display: flex; flex-direction: column; gap: 8px; align-items: center; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
        .tip { display: none; background: #1f2433; color: #f3f4f8; padding: 10px 14px; border-radius: 12px; max-width: 320px; box-shadow: 0 6px 24px #0006; }
        .tip.on { display: block; }
        .row { display: flex; align-items: center; background: #1f2433f2; color: #fff; border-radius: 999px; box-shadow: 0 6px 24px #0006; }
        button { all: unset; cursor: pointer; padding: 9px 14px; display: flex; gap: 7px; align-items: center; border-radius: 999px; }
        button[hidden] { display: none; }
        button:focus-visible { outline: 2px solid #8ab4ff; outline-offset: 2px; }
        .x { padding: 9px 12px 9px 6px; opacity: .7; }
        .x:hover { opacity: 1; }
        svg { width: 16px; height: 16px; }
      </style>
      <div class="box">
        <div class="tip" role="status"></div>
        <div class="row">
          <button class="go" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>앱으로 설치</button>
          <button class="x" type="button" aria-label="설치 안내 닫기">✕</button>
        </div>
      </div>`;
      root.querySelector('.go').addEventListener('click', install);
      root.querySelector('.x').addEventListener('click', () => {
        try { localStorage.setItem(key, '1'); } catch {}
        closed = true;
        hideAll();
      });
      document.body.append(pill);
      // 일부러 찾아온 게 아니면 잠깐만 보여 준다 (게임 화면을 오래 가리지 않게)
      if (!wanted) setTimeout(() => { if (pill && !pill.shadowRoot.querySelector('.tip.on')) hideAll(); }, 12000);
    }
    const box = pill.shadowRoot.querySelector('.tip');
    box.innerHTML = TIP[mode] || '';
    box.classList.toggle('on', !!TIP[mode] && (tip || mode === 'none'));
    pill.shadowRoot.querySelector('.go').hidden = mode === 'none';
  }

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    refresh();
  });
  addEventListener('appinstalled', hideAll);

  const start = () => {
    started = true;
    for (const el of own()) el.addEventListener('click', install);
    refresh();
    // 설치하러 왔는데 설치 창을 띄울 수 없으면(이미 설치됨·미지원 브라우저) 이유를 알려 준다
    if (wanted && !ios) setTimeout(() => { if (!deferred) own().length ? alert(TIP.none) : showPill('none'); }, 2500);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
