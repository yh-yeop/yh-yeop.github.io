// 사이트 전체가 같이 쓰는 프로젝트 정보. 나중에 서브페이지(p/<id>/)도 이 파일을 불러 쓴다.
export const USER = 'yh-yeop';
export const GH = `https://github.com/${USER}`;
export const PAGES = `https://${USER}.github.io`;

export const CATS = {
  maple: { label: '메이플스토리', color: 'var(--c-maple)' },
  web:   { label: '웹 도구',     color: 'var(--c-web)' },
  app:   { label: '설치형 앱',   color: 'var(--c-app)' },
  game:  { label: '게임',        color: 'var(--c-game)' },
  etc:   { label: '기타',        color: 'var(--c-etc)' },
};

// id: 주소(#p/<id>)와 아이콘 파일 이름에 쓰는 고정 값. 바꾸면 공유된 링크가 깨진다.
// repos: 이 카드가 소개하는 저장소들(첫 번째가 대표, README도 여기서 읽는다).
// release: { repo, prefix } 로 최신 설치 파일을 찾는다. closed: 소스 비공개(README 대신 릴리스 노트).
// icon: 없으면 회색 대체 아이콘을 쓴다. page: 서브페이지가 생기면 그 경로('p/meso/')를 적는다.
// stage: 'planning'(개발 기획 중) · 'alpha'(알파) · 'beta'(베타) 이면 '개발 중' 묶음에 들어간다. 없으면 '개발 완료'.
//   beta: true 나 release.pre(프리릴리스를 최신으로 보는 앱)도 베타로 친다.
export const PROJECTS = [
  {
    id: 'meso', cat: 'maple', title: '메소 계산기', icon: 'assets/icons/meso.svg',
    repos: ['meso_calcul'], live: `${PAGES}/meso_calcul/`,
    desc: '메소 수입 · 지출 장부와 목표 메소 도달일 계산기.',
    points: ['장부 · 통계 · 예산과 이번 주 보스 체크', '캐릭터별 주간/월간 보스 수익으로 도달일 계산', '넥슨 Open API 연동, 백업 · 복원 · CSV'],
    tags: ['JavaScript', '설치·서버 없음'],
  },
  {
    id: 'aut', cat: 'maple', title: '어센틱심볼 강화 계산기', icon: 'assets/icons/aut.svg',
    repos: ['AUTCalcul'], live: `${PAGES}/AUTCalcul/`,
    desc: '보유 심볼 현황을 넣으면 가장 적은 메소로 강화하는 지역·레벨 조합을 알려 줍니다.',
    points: ['N회 강화 최소 비용 조합', '예산 안에서 가능한 최대 강화 횟수', '목표 레벨 비용과 일퀘 기준 소요 일수'],
    tags: ['JavaScript'],
  },
  {
    id: 'boss', cat: 'maple', title: '배율 페이스 계산기', icon: 'assets/icons/boss.svg',
    repos: ['BossPaceCalcul'], live: `${PAGES}/BossPaceCalcul/`,
    desc: '보스 배율 대비 내 컨트롤이 몇 %인지, 그 컨트롤로 어느 배율까지 20분 컷이 되는지 계산합니다.',
    points: ['클리어 타임 또는 남은 HP로 컨트롤 % 계산', '파티 합산 배율과 각자의 기여 비율', '기록 히스토리와 컨트롤 추이 그래프'],
    tags: ['JavaScript'],
  },
  {
    id: 'latex', cat: 'web', title: '수식 빌더 · PBPK 투여 모델링', icon: 'assets/icons/latex.svg',
    repos: ['LaTeXBuilder'], live: `${PAGES}/LaTeXBuilder/`,
    desc: '미분방정식을 편집하면서 LaTeX 수식, 시뮬레이션 그래프, 비교 지표를 바로 확인하는 도구.',
    points: ['GS-441524 PBPK 모델 단계별 예시 (0~6단계)', 'Python · R · Julia 코드와 SBML 내보내기', '실측 데이터에 상수 맞추기 (Nelder–Mead)'],
    tags: ['HTML', 'ODE', 'LaTeX'],
  },
  {
    id: 'cal', cat: 'web', title: 'Simple Calendar', icon: 'assets/icons/cal.png',
    repos: ['calendar-app', 'SimpleCalendar'], live: `${PAGES}/calendar-app/`,
    desc: '개인 일정과 업무 일정을 나눠 쓰는 가벼운 달력. 안드로이드 앱(TWA)으로도 제공합니다.',
    points: ['공공데이터포털 API로 공휴일 표시', '날짜별 짧은 메모와 배경색'],
    tags: ['JavaScript', 'Kotlin (TWA)'],
    sources: [['웹 소스', 'calendar-app'], ['안드로이드 소스', 'SimpleCalendar']],
  },
  {
    id: 'listup', cat: 'app', title: 'ListUp', icon: 'assets/icons/listup.png',
    repos: ['ListUp'], release: { repo: 'ListUp' },
    desc: '초대 코드로 다른 사람의 저장소에 참여해 파일을 공유하고, 변경 사항은 제안 · 검토를 거쳐 반영하는 공용 클라우드.',
    points: ['파일용 제안 → 리뷰 → 병합 흐름', '한 파일 2GB까지, 끊겨도 이어 올리기·받기', '내 폴더와 비교해 빠진 파일만 주고받기'],
    tags: ['TypeScript', 'Expo', 'Electron', 'Windows · Android'],
  },
  {
    id: 'ytdl', cat: 'app', title: 'YTDL', icon: 'assets/icons/ytdl.png',
    repos: [], release: { repo: 'releases', prefix: 'YTDL' }, closed: true,
    desc: '유튜브 영상을 커버 이미지 · 싱크 가사(LRC)가 들어간 MP3로 추출하는 Windows 앱.',
    points: ['링크만 넣으면 아티스트 · 앨범 · 커버 자동 채움', '검색어 · 재생목록 일괄 다운로드, MP4도 지원', 'ffmpeg 내장 단일 실행 파일, 자동 업데이트'],
    tags: ['Python', 'pywebview', 'yt-dlp', 'Windows'],
  },
  {
    id: 'mp3', cat: 'app', title: 'MP3 Checker', icon: 'assets/icons/mp3.png',
    repos: [], release: { repo: 'releases', prefix: 'MP3Checker' }, closed: true,
    desc: '폴더 안 MP3의 가사(LRC) · 커버 · 태그 상태를 한눈에 보고 고치는 점검 도구.',
    points: ['곡별 상태 대시보드와 아티스트 → 앨범 브라우저', '태그 편집 · 커버 일괄 지정 · 원본 링크 자동 검색', 'YTDL 스타일 규칙 기준으로 라이브러리 정리'],
    tags: ['Python', 'pywebview', 'Windows'],
  },
  {
    id: 'tododoo', cat: 'app', title: 'Tododoo', icon: 'assets/icons/tododoo.svg',
    repos: [], release: { repo: 'releases', prefix: 'Tododoo' }, closed: true,
    desc: '로컬 우선 할 일 정리 앱. 데이터는 기기에 저장되고, 로그인하면 기기 간 동기화됩니다.',
    points: ['"보고서 쓰기 #업무 !3 @내일" 같은 빠른 입력', '리스트 / 칸반 보드, 프로젝트 · 태그별 보기', '오프라인에서도 그대로 쓰고 다시 연결되면 동기화'],
    tags: ['React', 'TypeScript', 'Tauri', 'Windows · Android'],
  },
  {
    id: 'fracture', cat: 'game', title: 'Fracture', icon: 'assets/icons/fracture.png',
    repos: [], release: { repo: 'releases', prefix: 'Fracture', pre: true }, closed: true, page: 'p/fracture/',
    featured: {
      kicker: '첫 공개',
      tagline: '시간을 건너뛰고, 멈추고, 되감으며 무너진 기계도시를 탐험하는 2D 메트로배니아.',
      image: 'assets/fracture/hero.webp',
    },
    desc: '시간을 건너뛰는 대시와, 벤 적을 멈춰 발판으로 쓰는 공중 연계가 특징인 2D 플랫포머 메트로배니아.',
    points: ['프롤로그부터 엔딩까지 포함된 공개 베타', '시간 도약 · 시간 정지 베기 · 시간 앵커 · 회귀', '보스마다 다른 패턴과 공략'],
    tags: ['Unity 6', '메트로배니아', 'Windows', '베타'],
  },
  // 개발 기획 중 — 설명 없이 이름과 표시만 둔다
  { id: 'danbi', cat: 'game', title: 'Danbi', repos: [], stage: 'planning' },
  { id: 'soliquid', cat: 'game', title: 'Soliquid', repos: [], stage: 'planning' },
  {
    id: 'sanupcraft', cat: 'game', title: '산업크래프트', icon: 'assets/icons/sanupcraft.svg',
    repos: ['sanupcraft'], page: 'p/sanupcraft/', stage: 'beta',
    desc: '보스를 잡아 공장을 열고, 공장으로 모험대를 무장시키는 자작 마인크래프트 모드팩. 친구 최대 10명이 함께 합니다.',
    points: ['보스 전리품이 다음 기계를 여는 공장 · 모험 순환', '증기 동력 · 컨베이어 · 굴착기, 네더 · 엔드와 이어진 진행', '인원수만큼 강해지는 보스와 기여자별 보상'],
    tags: ['Java', 'Fabric', 'Minecraft 26.3', '멀티플레이'],
  },
  {
    id: 'duet', cat: 'game', title: 'Duet 모작', icon: 'assets/icons/duet.jpg',
    repos: ['Duet_copy'],
    desc: 'Kumobius의 게임 Duet을 Pygame으로 다시 만든 모작. 원작에 없는 커스텀 레벨 제작 · 공유를 목표로 했습니다.',
    points: ['run.bat 또는 main.py로 실행', 'pygame, numpy 필요'],
    tags: ['Python', 'Pygame'],
  },
];

// 목록에 카드로 띄우지 않는 공개 저장소. 버린 저장소는 여기 넣지 말고 보관(archive) + 비공개로 돌린다.
export const HIDE = new Set([`${USER}.github.io`, 'releases']);
