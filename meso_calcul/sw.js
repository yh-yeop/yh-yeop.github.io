/* 옛 주소(/meso_calcul/)의 서비스 워커를 끄는 워커.
   메소노믹스 저장소 이름을 meso_calcul → mesonomics 로 바꾸면서(2026-11-16) 옛 주소에는 이 넘김 폴더만 남았다.
   옛 워커가 캐시한 계산기를 계속 보여 주지 않게, 브라우저가 이 파일로 업데이트하면 스스로 등록을 풀고
   열린 창을 다시 불러 넘김 페이지(index.html)로 보낸다. 새 주소의 캐시(meso-calc-v32 이상)는 건드리지 않는다. */
self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){
      var m = /^meso-calc-v(\d+)$/.exec(k);
      return m && +m[1] <= 31;
    }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.registration.unregister(); })
    .then(function(){ return self.clients.matchAll({type: "window"}); })
    .then(function(cs){ cs.forEach(function(c){ c.navigate(c.url); }); }));
});
