// 소개 사이트 첫 화면 · 서브페이지가 같이 쓰는 "공유" 버튼. <script src="/share.js" defer></script> 한 줄과 [data-share] 버튼을 둔다.
// - 공유하는 주소는 지금 보고 있는 그대로(location.href): 첫 화면에서 카드를 펼쳐 둔 #p/<id> · 분류 걸러 보기 #game 도 그대로 간다.
// - 터치 기기에서 브라우저가 공유 창(navigator.share)을 지원하면 바로 띄운다 (카카오톡 · 메시지 · 링크 복사가 모두 거기 있다).
// - 그 밖에는 버튼 아래에 작은 메뉴: 주소 보기 · 링크 복사 · (지원하면) 다른 앱으로 공유.
// - 메뉴 색은 페이지의 --surface/--panel · --text · --line · --muted 를 따른다 (첫 화면 밝은/어두운 테마, 서브페이지 어두운 테마 모두).
(() => {
  const canShare = typeof navigator.share === 'function';
  const touch = matchMedia('(pointer: coarse)').matches;

  // 첫 화면에서 카드를 펼쳐 둔 상태(#p/<id>)면 그 프로젝트 이름을 제목으로
  function info() {
    const url = location.href;
    const m = location.hash.match(/^#p\/([\w-]+)$/);
    const card = m && document.getElementById('t-' + m[1]);
    const title = card ? `${card.textContent.trim()} · yeop 프로젝트` : document.title;
    return { url, title };
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 클립보드 API를 못 쓰는 환경(http, 오래된 브라우저): 숨긴 입력칸으로 복사
      const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      return ok;
    }
  }

  async function nativeShare() {
    const { url, title } = info();
    try {
      await navigator.share({ title, url });
      return true;
    } catch (e) {
      return e?.name === 'AbortError'; // 사용자가 닫은 건 실패가 아니다
    }
  }

  let host = null, root = null, opener = null;

  function build() {
    host = document.createElement('div');
    host.style.cssText = 'position:absolute;z-index:2147483000;top:0;left:0';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { all: initial; }
      .menu {
        --bg: var(--surface, var(--panel, #1c1c20)); --fg: var(--text, #ececef); --ln: var(--line, #303036); --mu: var(--muted, #a2a3ad);
        width: min(320px, calc(100vw - 32px)); padding: 12px; border-radius: 10px; border: 1px solid var(--ln);
        background: var(--bg); color: var(--fg); box-shadow: 0 8px 28px rgba(0,0,0,.22);
        font: 14px/1.45 "Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
      }
      .t { margin: 0 0 8px; font-weight: 600; }
      input {
        box-sizing: border-box; width: 100%; min-height: 38px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--ln);
        background: transparent; color: var(--mu); font: 13px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
      }
      .row { display: flex; gap: 8px; margin-top: 10px; }
      button {
        flex: 1; min-height: 40px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--ln);
        background: transparent; color: var(--fg); font: inherit; font-weight: 600; cursor: pointer;
      }
      button:hover { border-color: var(--mu); }
      button.main { background: var(--fg); border-color: var(--fg); color: var(--bg); }
      button.main:hover { opacity: .88; }
      button[hidden] { display: none; }
      :focus-visible { outline: 3px solid var(--focus, #8fb0ff); outline-offset: 2px; }
    </style>
    <div class="menu" role="dialog" aria-label="이 페이지 공유">
      <p class="t">이 페이지 공유</p>
      <input class="url" type="text" readonly aria-label="페이지 주소">
      <div class="row">
        <button class="main copy" type="button">링크 복사</button>
        <button class="more" type="button">다른 앱으로</button>
      </div>
      <p class="sr" role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"></p>
    </div>`;
    root.querySelector('.more').hidden = !canShare;
    const field = root.querySelector('.url');
    field.addEventListener('focus', () => field.select());
    root.querySelector('.copy').addEventListener('click', async e => {
      const b = e.currentTarget;
      const ok = await copy(info().url);
      b.textContent = ok ? '복사했습니다' : '복사하지 못했습니다';
      root.querySelector('.sr').textContent = ok ? '링크를 복사했습니다' : '링크를 복사하지 못했습니다. 주소를 직접 복사하세요.';
      if (ok) setTimeout(close, 900);
      else { field.focus(); field.select(); }
    });
    root.querySelector('.more').addEventListener('click', async () => {
      close(false);
      await nativeShare();
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    });
    document.body.append(host);
  }

  function place() {
    const r = opener.getBoundingClientRect();
    const mw = root.querySelector('.menu').offsetWidth || 320;
    const vw = document.documentElement.clientWidth;
    let left = r.right - mw; // 버튼 오른쪽 끝에 맞춘다 (머리글 오른쪽 · 서브페이지 위쪽 오른쪽)
    left = Math.max(16, Math.min(left, vw - mw - 16));
    host.style.left = left + scrollX + 'px';
    host.style.top = r.bottom + 8 + scrollY + 'px';
  }

  function open(btn) {
    if (!host) build();
    opener = btn;
    host.hidden = false;
    const { url } = info();
    root.querySelector('.url').value = url;
    root.querySelector('.copy').textContent = '링크 복사';
    root.querySelector('.sr').textContent = '';
    place();
    btn.setAttribute('aria-expanded', 'true');
    root.querySelector('.copy').focus();
  }

  function close(refocus = true) {
    if (!host || host.hidden) return;
    host.hidden = true;
    opener?.setAttribute('aria-expanded', 'false');
    if (refocus) opener?.focus();
  }

  document.addEventListener('click', async e => {
    const btn = e.target.closest?.('[data-share]');
    if (btn) {
      e.preventDefault();
      if (host && !host.hidden && opener === btn) return close();
      if (touch && canShare && await nativeShare()) return;
      return open(btn);
    }
    if (host && !host.hidden && !e.composedPath().includes(host)) close(false);
  });
  addEventListener('resize', () => { if (host && !host.hidden) place(); });
  addEventListener('hashchange', () => { if (host && !host.hidden) root.querySelector('.url').value = info().url; });

  const init = () => {
    for (const b of document.querySelectorAll('[data-share]')) {
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-expanded', 'false');
    }
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
