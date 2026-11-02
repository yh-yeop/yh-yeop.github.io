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
- `PROJECTS`에 없는 공개 저장소는 그 저장소 루트의 `portfolio.json`(아래)으로 카드가 자동으로 만들어진다. 없으면 GitHub 설명으로 '기타' 카드. 버린 저장소는 보관(archive) + 비공개로 돌리면 사라진다.
- 서브페이지가 있는 프로젝트(`page`)는 카드에서 '소개 펼치기'로 서브페이지의 `data-embed` 부분과 대표 이미지(`og:image`)를 보여 준다.
- `release.pre: true`면 프리릴리스(베타)도 최신으로 본다 (Fracture). `.exe` · `.apk` 외에 `*win64.zip` 같은 압축본도 Windows 설치 파일로 친다.
- `featured`가 있는 프로젝트는 첫 화면 맨 위 배너로 알린다 (한 번에 하나).
- 주소: `#maple` `#web` `#app` `#game` = 분류 걸러 보기, `#p/<id>` = 그 프로젝트 펼쳐 보기.
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
| `icon` | | 저장소 안 경로(`icon.svg`) 또는 `https://` 주소. 없으면 제목 첫 글자 |
| `live` | | 바로 열 주소. 없으면 GitHub homepage → Pages 주소 순 |
| `id` | | 주소(`#p/<id>`)에 쓰는 이름. 없으면 저장소 이름 소문자 |
| `hidden` | | `true`면 목록에 띄우지 않는다 |

**바로 반영:** `portfolio.json`을 고쳐 푸시하면 1분 안에 카드가 바뀐다. 사이트는 GitHub API(캐시 60초)로 이 파일을 받고,
브라우저에는 저장소의 `pushed_at`과 함께 저장해 두었다가 그 값이 바뀔 때만 다시 받는다(API 횟수 절약). 저장소 목록은 1분 캐시.
`raw.githubusercontent.com`은 CDN이 5분 캐시하고 쿼리로도 못 깨므로 쓰지 않는다.

