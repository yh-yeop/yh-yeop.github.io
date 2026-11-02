# yh-yeop.github.io

공개 저장소와 홍보할 프로젝트를 소개하고 바로 열어 볼 수 있게 모아 둔 페이지.

👉 https://yh-yeop.github.io/

빌드 없음. ES 모듈이라 로컬에서는 `file://` 대신 `python -m http.server`로 띄워서 본다.

| 파일 | |
|---|---|
| `index.html` | 첫 화면 마크업 |
| `css/site.css` | 공용 스타일 (README 렌더링 스타일 포함) |
| `js/data.js` | 프로젝트 소개 데이터 `PROJECTS` — 카드 내용은 여기서 고친다 |
| `js/github.js` | GitHub API(10분 세션 캐시), 최신 릴리스 고르기, README · 릴리스 노트 HTML 정리 |
| `js/main.js` | 첫 화면 동작 |
| `assets/icons/` | 프로젝트 아이콘 (`<id>.svg/png/jpg`) |
| `p/<id>/` | 프로젝트 서브페이지 (지금은 `p/fracture/` — 게임 소개, 갤러리 · 최신 베타 · 릴리스 노트) |
| `assets/<id>/` | 서브페이지 이미지 (스크린샷 1600px webp + `-t` 썸네일 400px) |

- 업데이트 날짜 · 별 · 라이선스 · 최신 버전과 설치 파일 링크, README는 GitHub API에서 그때그때 불러온다.
- 소스가 공개된 프로젝트는 카드에서 README를, 비공개 앱(`closed: true`)은 `releases` 저장소의 최신 릴리스 노트를 펼쳐 읽는다.
- `PROJECTS`에 없는 새 공개 저장소는 '기타' 카드로 자동 추가된다. 버린 저장소는 보관(archive) + 비공개로 돌리면 사라진다.
- `release.pre: true`면 프리릴리스(베타)도 최신으로 본다 (Fracture). `.exe` · `.apk` 외에 `*win64.zip` 같은 압축본도 Windows 설치 파일로 친다.
- `featured`가 있는 프로젝트는 첫 화면 맨 위 배너로 알린다 (한 번에 하나).
- 주소: `#maple` `#web` `#app` `#game` = 분류 걸러 보기, `#p/<id>` = 그 프로젝트 펼쳐 보기.
- 서브페이지: `p/<id>/index.html`을 만들고 `PROJECTS`의 해당 항목에 `page: 'p/<id>/'`를 적으면 카드에 '자세히'가 붙고 `#p/<id>` 링크도 그쪽으로 넘어간다. 서브페이지는 `js/data.js` · `js/github.js` · `css/site.css`를 그대로 불러 쓴다.
