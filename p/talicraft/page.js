// 탈리크래프트 소개: 위쪽 목차에서 지금 읽는 절을 표시한다 (스크립트가 없어도 목차 링크는 그대로 동작)
(() => {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const secs = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || !secs.length) return;
  const seen = new Set();
  const io = new IntersectionObserver(es => {
    for (const e of es) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id);
    const cur = secs.find(s => seen.has(s.id));
    for (const [id, a] of map) {
      if (cur && id === cur.id) {
        a.setAttribute('aria-current', 'true');
        const box = a.parentElement;
        if (box.scrollWidth > box.clientWidth) box.scrollLeft = a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2;
      } else a.removeAttribute('aria-current');
    }
  }, { rootMargin: '-64px 0px -55% 0px' });
  secs.forEach(s => io.observe(s));
})();
