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
| `p/<id>/` | 프로젝트 서브페이지 (`p/fracture/` — 게임 소개, 갤러리 · 최신 베타 · 릴리스 노트 / `p/sanupcraft/` — 모드팩 소개, 갤러리 · sanupcraft 저장소의 최신 테스트 베타 · 설치 방법 / `p/talicraft/` — 친구 서버 전용 모드 소개, 스크립트 · API 호출 없음, 갤러리 크게 보기는 `popover` / `p/fishingcraft/` — 소스 비공개 낚시 모드팩 소개(개발 중), 스크립트 · API 호출 없음, 히어로 그림 · 대표 이미지는 fishingcraft 저장소 `tools/make_icon.py` · `make_og.py`로 만듦) |
| `assets/<id>/` | 서브페이지 이미지 (스크린샷 1600px webp + `-t` 썸네일 400px) |
| `install.js` | 웹 프로젝트가 같이 쓰는 "앱으로 설치" 안내 (아래) |
| `share.js` | 첫 화면 · 서브페이지의 "공유" 버튼(`[data-share]`): 지금 주소(`#p/<id>` · `#game` 포함)를 링크 복사 · 다른 앱으로 공유. 터치 기기에서 공유 창을 지원하면 바로 띄운다 |
| `manifest.webmanifest` | 이 사이트를 앱으로 설치할 때의 정보 |

- 업데이트 날짜 · 별 · 라이선스 · 최신 버전과 설치 파일 링크, README는 GitHub API에서 그때그때 불러온다.
- 소스가 공개된 프로젝트는 카드에서 README를, 비공개 앱(`closed: true`)은 `releases` 저장소의 최신 릴리스 노트를 펼쳐 읽는다.
- 소스 비공개 앱(`release.repo: 'releases'`)의 최신 버전 · 다운로드는 releases 저장소가 Pages로 내는 `https://yh-yeop.github.io/releases/index.json` 하나로 받는다 (API 횟수 제한 없음, 못 받으면 API 릴리스 목록으로). 릴리스 노트는 펼칠 때 그 릴리스만 받는다.
  releases 저장소 `apps.json`에만 있고 `PROJECTS`에 없는 앱은 index.json 내용으로 카드가 자동으로 생긴다 — 새 비공개 앱은 `apps.json` 한 줄이면 되고, 꾸밀 때만 `PROJECTS`에 같은 `release.prefix`로 항목을 둔다.
- `PROJECTS`에 없는 공개 저장소는 그 저장소 루트의 `portfolio.json`(아래)으로 카드가 자동으로 만들어진다. 없으면 GitHub 설명으로 '기타' 카드. 버린 저장소는 보관(archive) + 비공개로 돌리면 사라진다.
- 서브페이지가 있는 프로젝트(`page`)는 카드에서 '소개 펼치기'로 서브페이지의 `data-embed` 부분과 대표 이미지(`og:image`)를 보여 준다.
- `release.pre: true`면 프리릴리스(베타)도 최신으로 본다 (Fracture). `.exe` · `.apk` 외에 `*win64.zip` 같은 압축본도 Windows 설치 파일로 친다.
- `featured`가 있는 프로젝트는 첫 화면 맨 위 배너로 알린다 (한 번에 하나).
- 프로젝트 목록은 **개발 완료**와 **개발 중**(알파 · 베타 · 기획 단계) 두 묶음으로 나눠 보여 준다. `stage: 'planning' | 'alpha' | 'beta'`가 있으면 개발 중, `beta: true`나 `release.pre`도 베타로 친다. 기획 단계 프로젝트는 설명 없이 이름과 "개발 기획 중" 표시만 둘 수 있다 (`desc` 생략).
- 주소: `#maple` `#web` `#app` `#game` = 분류 걸러 보기, `#done` `#dev` = 개발 완료 / 개발 중만 보기 (분류와 함께면 `#game+dev`), `#p/<id>` = 그 프로젝트로 바로 가서 펼쳐 보기 (portfolio.json으로 생긴 카드도 됨, 예: `#p/sanupcraft`).
- 서브페이지: `p/<id>/index.html`을 만들고 `PROJECTS`의 해당 항목에 `page: 'p/<id>/'`를 적으면 카드에 '자세히'가 붙고 `#p/<id>` 링크도 그쪽으로 넘어간다. 서브페이지는 `js/data.js` · `js/github.js` · `css/site.css`를 그대로 불러 쓴다.

## portfolio.json — 공개 저장소가 들고 있는 등록 정보

새 공개 프로젝트는 만들 때 저장소 루트에 이 파일을 두면, 이 사이트를 고치지 않아도 알맞은 분류로 카드가 뜬다
(`js/data.js`에 직접 적은 저장소는 그쪽이 우선). 소스가 비공개인 프로젝트는 이 파일을 읽을 수 없으므로 `js/data.js`에 적는다.

```json
{
  "category": "game",
  "title": "궤도 점프",
  "desc": "탭 한 번으로 행성에서 행성으로 뛰어오르는 한 손 웹게임.",
  "points": ["카드에 보일 특징 한 줄", "두세 개까지"],
  "tags": ["HTML", "캔버스"],
  "icon": "icon.svg"
}
```

| 필드 | 필수 | 뜻 |
|---|---|---|
| `category` | ✔ | `maple` 메이플스토리 · `web` 웹 도구 · `app` 설치형 앱 · `game` 게임 · `etc` 기타. 틀리면 `etc` |
| `title` | | 카드 제목 (없으면 저장소 이름) |
| `desc` | | 한두 문장 소개 (없으면 GitHub 설명) |
| `points` · `tags` | | 특징 줄 · 기술 태그 (tags 가 없으면 GitHub 주 언어) |
| `icon` | | 저장소 안 경로(`icon.svg`) 또는 `https://` 주소. 없으면 회색 대체 아이콘 |
| `live` | | 바로 열 주소. 없으면 GitHub homepage → Pages 주소 순 |
| `id` | | 주소(`#p/<id>`)에 쓰는 이름. 없으면 저장소 이름 소문자 |
| `hidden` | | `true`면 목록에 띄우지 않는다 |
| `beta` | | `true`면 카드 제목 옆 · 바로 가기에 "베타" 표시 (개발 중 플레이테스트 등) |
| `stage` | | `planning`(개발 기획 중) · `alpha`(알파) · `beta`(베타). 있으면 '개발 중' 묶음에 들어간다 |
| `pwa` | | `false`면 "앱으로 설치" 버튼을 달지 않는다 (아래 "앱으로 설치") |

**바로 반영:** `portfolio.json`을 고쳐 푸시하면 1분 안에 카드가 바뀐다. 사이트는 GitHub API(캐시 60초)로 이 파일을 받고,
브라우저에는 저장소의 `pushed_at`과 함께 저장해 두었다가 그 값이 바뀔 때만 다시 받는다(API 횟수 절약). 저장소 목록은 1분 캐시.
`raw.githubusercontent.com`은 CDN이 5분 캐시하고 쿼리로도 못 깨므로 쓰지 않는다.

## 앱으로 설치 (PWA)

이 사이트와 그 아래 웹 프로젝트(`https://yh-yeop.github.io/<저장소>/`)는 홈 화면·바탕화면에 앱으로 설치할 수 있다.

- 각 프로젝트 `index.html` `<head>`에 세 줄: `<link rel="manifest" href="manifest.json">`, `<link rel="apple-touch-icon" href="apple-touch-icon.png">`, `<script src="/install.js"></script>(defer 없이 — 페이지가 쿼리를 지우기 전에 읽어야 함)`.
  `manifest.json`의 `icons`에는 `icon-192.png` · `icon-512.png`(PNG 필수 — Android 설치용), iOS용 `apple-touch-icon.png`(180px, 불투명)도 둔다.
- `install.js`는 브라우저가 설치 가능하다고 알려 줄 때(`beforeinstallprompt`) 화면 아래에 "앱으로 설치" 버튼을 잠깐 띄운다. iOS는 "공유 → 홈 화면에 추가"를 안내한다.
  페이지에 `[data-pwa-install]` 요소가 있으면 떠 있는 버튼 대신 그 요소를 쓴다 (이 사이트 머리글의 버튼). ✕로 닫으면 그 프로젝트에서는 다시 띄우지 않는다.
- 카드의 "앱으로 설치"는 `<주소>?install`로 연다 → 그 페이지가 버튼을 계속 띄우고, 설치할 수 없는 브라우저(이미 설치 · Firefox 등)면 이유를 보여 준다.
  이 버튼은 이 사이트 아래 주소(`live`)인 프로젝트에 자동으로 붙는다. 설치를 지원하지 않는 프로젝트는 `pwa: false`(data.js · portfolio.json).
- 이 사이트에는 서비스 워커를 두지 않는다. 범위가 `/` 라 모든 프로젝트 페이지의 요청까지 가로채게 되기 때문 (설치에는 manifest만 있으면 된다).
