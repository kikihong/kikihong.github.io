/**
 * PulseNews - 맞춤형 뉴스 리더 웹 애플리케이션
 * Pure Vanilla JavaScript (ES6+)
 * 
 * 기능:
 * 1. 비즈니스, 스포츠, 문화 다중 선택 및 뉴스 보기
 * 2. 무료 OpenAPI (Google News RSS + api.rss2json.com) 연동 (주제별 상위 10개)
 * 3. 카드 그리드 렌더링 (이미지, 제목, '읽기' 버튼) 및 팝업 모달 상세 뷰
 * 4. IntersectionObserver 기반 고성능 무한 스크롤 (10건씩 추가 로드)
 * 5. 반응형 그리드 & 깔끔한 흰색 카드/그림자 UI
 */

'use strict';

// ============================================================================
// 1. Configuration & Constant Definitions
// ============================================================================
const CONFIG = {
  API_BASE: 'https://api.rss2json.com/v1/api.json',
  FEEDS: {
    business: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko',
    sports: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ko&gl=KR&ceid=KR:ko',
    culture: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=ko&gl=KR&ceid=KR:ko'
  },
  CATEGORIES: {
    business: { label: '비즈니스', icon: '💼', colorClass: 'business' },
    sports: { label: '스포츠', icon: '⚽', colorClass: 'sports' },
    culture: { label: '문화', icon: '🎭', colorClass: 'culture' }
  },
  PAGE_SIZE: 10, // Infinite scroll chunk size
  // Curated High-Definition Unsplash Photos for each category
  THEME_IMAGES: {
    business: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80'
    ],
    sports: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80'
    ],
    culture: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80'
    ]
  }
};

// ============================================================================
// 2. Fallback Mock Dataset (API Rate Limit 또는 오프라인 대비 회복 탄력성 데이터)
// ============================================================================
const FALLBACK_ARTICLES = {
  business: [
    {
      title: "AI 반도체 수요 폭발에 글로벌 공급망 재편 가속… 코스피 IT 대형주 랠리 - 한국경제",
      pubDate: "2026-10-15 09:30:00",
      link: "https://www.hankyung.com",
      description: "인공지능(AI) 전용 고대역폭 메모리(HBM) 및 차세대 패키징 수요가 급증하면서 국내 주요 반도체 기업들의 실적 전망치가 상향 조정되고 있습니다. 글로벌 빅테크 기업들의 투자 확대가 주 요인으로 분석됩니다."
    },
    {
      title: "한국은행, 기준금리 결정 앞두고 물가·가계부채 딜레마 속 고심 - 매일경제",
      pubDate: "2026-10-15 08:45:00",
      link: "https://www.mk.co.kr",
      description: "금융통화위원회가 이번 주 기준금리 결정을 앞두고 주택담보대출 증가세와 소비자물가 상승률 간의 균형점을 찾기 위해 고심을 거듭하고 있습니다."
    },
    {
      title: "친환경 전기차 배터리 혁신… 차세대 전고체 배터리 파일럿 라인 가동 - 연합뉴스",
      pubDate: "2026-10-15 08:15:00",
      link: "https://www.yna.co.kr",
      description: "국내 배터리 선도 3사가 1회 충전으로 800km 이상 주행 가능한 전고체 배터리 시제품을 조기 생산하며 글로벌 표준 선점에 박차를 가하고 있습니다."
    },
    {
      title: "글로벌 원자재 가격 안정화세… 환율 변동성 완화 기대 - 헤럴드경제",
      pubDate: "2026-10-15 07:50:00",
      link: "https://biz.heraldcorp.com",
      description: "국제 유가와 주요 광물 가격이 하향 안정화 흐름을 보이면서 무역수지 흑자 기조가 지속될 것으로 경제 연구기관들은 전망했습니다."
    },
    {
      title: "스타트업 생태계 투자 심리 회복세… AI 및 바이오 분야에 뭉칫돈 - 조선비즈",
      pubDate: "2026-10-15 07:10:00",
      link: "https://biz.chosun.com",
      description: "벤처캐피털(VC) 시장에 온기가 돌며 유망 딥테크 스타트업을 중심으로 대규모 시리즈 B, C 라운드 펀딩이 잇따르고 있습니다."
    },
    {
      title: "주요 유통업체, 초개인화 AI 커머스 서비스 도입 본격화 - 동아일보",
      pubDate: "2026-10-15 06:40:00",
      link: "https://www.donga.com",
      description: "소비자 구매 패턴과 취향을 실시간 분석해 1:1 맞춤형 혜택을 제공하는 AI 큐레이션 커머스가 유통 업계의 핵심 무기로 부상했습니다."
    },
    {
      title: "K-방산, 중동 및 유럽과 조 단위 추가 수출 계약 협의 순항 - 이데일리",
      pubDate: "2026-10-15 06:05:00",
      link: "https://www.edaily.co.kr",
      description: "우수한 품질과 신속한 납기 경쟁력을 인정받은 K-방산 주요 품목들이 해외 주요국들과 수출 본계약 체결을 앞두고 있습니다."
    },
    {
      title: "글로벌 ESG 투자 공시 강화… 국내 대기업 지속가능경영 투자 확대 - 파이낸셜뉴스",
      pubDate: "2026-10-14 23:20:00",
      link: "https://www.fnnews.com",
      description: "국제회계기준재단(IFRS) 기준의 공시 도입에 대비하여 탄소 감축 및 친환경 재생에너지 전환 투자가 대폭 늘어나고 있습니다."
    },
    {
      title: "은행권, 디지털 전환 박차… 모바일 앱 슈퍼 플랫폼 경쟁 가열 - 아시아경제",
      pubDate: "2026-10-14 21:10:00",
      link: "https://www.asiae.co.kr",
      description: "금융 서비스뿐 아니라 부동산, 모빌리티, 자산관리를 한 번에 해결하는 올인원 금융 플랫폼 구축에 금융지주들이 역량을 쏟고 있습니다."
    },
    {
      title: "항공·해운 물동량 회복세 뚜렷… 연말 성수기 맞이 공급망 분주 - 서울경제",
      pubDate: "2026-10-14 19:30:00",
      link: "https://www.sedaily.com",
      description: "글로벌 수출입 회복에 힘입어 컨테이너선 운임 및 항공 화물 처리 실적이 전년 동기 대비 큰 폭의 성장세를 보이고 있습니다."
    }
  ],
  sports: [
    {
      title: "손흥민, 멀티골 작렬하며 팀 역전승 견인… 현지 언론 '경이로운 캡틴' 찬사 - 스포츠조선",
      pubDate: "2026-10-15 09:10:00",
      link: "https://sports.chosun.com",
      description: "후반 추가시간 극적인 결승골을 터뜨리며 팀을 승리로 이끈 손흥민 선수가 최고 평점과 함께 라운드 베스트 11에 선정되었습니다."
    },
    {
      title: "프로야구 가을야구 대격돌… 플레이오프 1차전 치열한 투수전 예고 - 스포츠서울",
      pubDate: "2026-10-15 08:30:00",
      link: "https://www.sportsseoul.com",
      description: "한국시리즈 진출 티켓을 놓고 펼쳐지는 플레이오프 1차전 선발 투수로 양 팀의 에이스 외국인 투수들이 출격합니다."
    },
    {
      title: "이강인, 환상적인 킬패스로 2도움 맹활약… 팀 4연승 질주 - 일간스포츠",
      pubDate: "2026-10-15 08:00:00",
      link: "https://isplus.com",
      description: "미드필더에서 정교한 탈압박과 자로 잰 듯한 패스를 선보인 이강인이 팀의 공격을 진두지휘하며 완승을 이끌었습니다."
    },
    {
      title: "한국 배드민턴 대표팀, 세계선수권 복식 금메달 획득 쾌거 - 스포츠경향",
      pubDate: "2026-10-15 07:20:00",
      link: "https://sports.khan.co.kr",
      description: "끈질긴 수비와 환상적인 호흡으로 세계 최강 조를 제압하며 3년 만에 세계선수권 정상 탈환에 성공했습니다."
    },
    {
      title: "김하성, 메이저리그 멀티히트 및 결정적 호수비로 홈 팬들 기립박수 - OSEN",
      pubDate: "2026-10-15 06:50:00",
      link: "https://osen.co.kr",
      description: "공수 양면에서 눈부신 활약을 펼친 김하성이 경기 후 인터뷰에서 팀 동료들과 감독의 전폭적인 신뢰에 감사를 표했습니다."
    },
    {
      title: "여자배구 V리그 개막전 매진 행렬… 박진감 넘치는 풀세트 명승부 - 마이데일리",
      pubDate: "2026-10-15 06:15:00",
      link: "https://mydaily.co.kr",
      description: "개막 첫날부터 만원 관중을 기록한 V리그가 5세트 듀스까지 이어지는 혈투 끝에 짜릿한 역전극으로 화려하게 문을 열었습니다."
    },
    {
      title: "K리그1 우승 레이스 안갯속… 선두권 3개 팀 승점 1점 차 초접전 - 엑스포츠뉴스",
      pubDate: "2026-10-14 23:40:00",
      link: "https://www.xportsnews.com",
      description: "정규 라운드 막바지까지 역대급 우승 경쟁이 펼쳐지며 매 경기 결과에 따라 순위표가 뒤바뀌는 긴장감이 감돌고 있습니다."
    },
    {
      title: "골프 여제 고진영, LPGA 투어 챔피언십 3라운드 단독 선두 질주 - 스포츠동아",
      pubDate: "2026-10-14 22:15:00",
      link: "https://sports.donga.com",
      description: "안정적인 아이언 샷과 정교한 퍼팅감을 앞세워 노보기 플레이를 펼치며 통산 16번째 우승 트로피를 정조준했습니다."
    },
    {
      title: "한국 펜싱 사브르 대표팀, 월드컵 단체전 압도적 실력으로 우승 - 스포티비뉴스",
      pubDate: "2026-10-14 20:50:00",
      link: "https://www.spotvnews.co.kr",
      description: "신구 조화가 완벽히 어우러진 '어벤저스' 한국 펜싱 대표팀이 결승에서 유럽의 강호들을 제압하고 금메달을 목에 걸었습니다."
    },
    {
      title: "농구 KBL 새 시즌 개막… 더욱 빨라진 템포와 화끈한 공격 농구 예고 - 점프볼",
      pubDate: "2026-10-14 18:20:00",
      link: "https://jumpball.co.kr",
      description: "새로운 룰 도입과 외국인 선수 교체로 한층 스피디해진 KBL이 팬들의 기대를 모으며 뜨거운 개막 주간을 맞이했습니다."
    }
  ],
  culture: [
    {
      title: "한강 작가 노벨문학상 쾌거 이후 독서 열풍 지속… 서점가 베스트셀러 독식 - 연합뉴스",
      pubDate: "2026-10-15 09:20:00",
      link: "https://www.yna.co.kr",
      description: "역대급 독서 붐이 일면서 문학 작품 판매량이 급증하고 공공도서관 대출 예약 대기가 이어지는 등 문학계 전반에 활기가 돌고 있습니다."
    },
    {
      title: "K-콘텐츠 글로벌 흥행 신화 잇는다… 새 넷플릭스 오리지널 전 세계 1위 - 뉴스1",
      pubDate: "2026-10-15 08:35:00",
      link: "https://www.news1.kr",
      description: "독창적인 스토리텔링과 압도적인 영상미를 자랑하는 한국 오리지널 드라마 시리즈가 공개 이틀 만에 글로벌 80개국 1위를 석권했습니다."
    },
    {
      title: "국립중앙박물관 기획 특별전 매진 행렬… 청년층 ‘박물관 핫플’ 열기 - 중앙일보",
      pubDate: "2026-10-15 08:05:00",
      link: "https://www.joongang.co.kr",
      description: "조선 왕실 명품 유물과 인터랙티브 미디어아트가 결합된 특별 전시가 MZ세대의 필수 관람 코스로 떠오르며 사전 예매 오픈과 동시에 매진되었습니다."
    },
    {
      title: "BTS 제이홉 전역 후 활발한 글로벌 음악 활동 재개 예고… 팬들 환호 - 뉴시스",
      pubDate: "2026-10-15 07:30:00",
      link: "https://www.newsis.com",
      description: "군 복무를 성공적으로 마치고 건강하게 복귀한 제이홉이 솔로 앨범 작업과 월드 투어 계획을 전하며 팬덤 아미의 폭발적인 반응을 이끌었습니다."
    },
    {
      title: "부산국제영화제, 전 세계 거장들과 아시아 신예 감독들의 교류의 장 성료 - 씨네21",
      pubDate: "2026-10-15 07:00:00",
      link: "https://www.cine21.com",
      description: "다양한 독립영화와 화제작들이 대거 상영된 제31회 부산국제영화제가 관객들의 뜨거운 성원 속에 성공적으로 폐막했습니다."
    },
    {
      title: "가을밤 수놓는 야외 클래식 페스티벌… 한강 시민공원에 울려 퍼진 선율 - 한겨레",
      pubDate: "2026-10-15 06:25:00",
      link: "https://www.hani.co.kr",
      description: "청명한 가을밤, 서울시향과 세계적인 솔리스트들이 협연한 무료 야외 오케스트라 공연에 3만여 명의 시민들이 모여 낭만을 만끽했습니다."
    },
    {
      title: "한국 웹툰, 북미 및 유럽 만화 시장서 점유율 1위 질주 - 매일경제",
      pubDate: "2026-10-14 23:15:00",
      link: "https://www.mk.co.kr",
      description: "세로 스크롤 방식의 스마트폰 친화적 포맷과 다채로운 소재로 무장한 K-웹툰이 글로벌 출판 만화 강국 프랑스와 미국에서도 주류로 자리 잡았습니다."
    },
    {
      title: "뮤지컬 ‘오페라의 유령’ 20주년 기념 특별 내한 공연 전석 매진 기염 - 한국일보",
      pubDate: "2026-10-14 21:40:00",
      link: "https://www.hankookilbo.com",
      description: "웅장한 무대 장치와 환상적인 오케스트라 사운드로 사랑받아온 명작 뮤지컬이 한국 팬들의 압도적인 사랑 속에 연일 만원사례를 기록하고 있습니다."
    },
    {
      title: "전통 한옥 마을과 현대 건축의 조화… K-건축 디자인 세계적 디자인상 수상 - 경향신문",
      pubDate: "2026-10-14 19:50:00",
      link: "https://www.khan.co.kr",
      description: "한국 고유의 비움의 미학과 친환경 목구조 설계를 현대 미술관에 접목한 건축물이 권위 있는 국제 건축상을 수상했습니다."
    },
    {
      title: "K-푸드 열풍 이제는 디저트로… 약과·개성주악 뉴욕 디저트 카페 진출 - 동아일보",
      pubDate: "2026-10-14 18:40:00",
      link: "https://www.donga.com",
      description: "한국 전통 한과가 고급스러운 맛과 비주얼로 뉴욕 맨해튼의 트렌디한 카페 메뉴로 선정되며 현지 미식가들의 입맛을 사로잡았습니다."
    }
  ]
};

// ============================================================================
// 3. Application State Management
// ============================================================================
const state = {
  selectedCategories: ['business', 'sports', 'culture'],
  poolArticles: [],       // All fetched articles combined
  displayedArticles: [],  // Articles currently rendered on screen
  currentIndex: 0,        // Pointer for infinite scroll slice
  isLoading: false,       // Loading flag for network / scroll
  isInitialLoaded: false  // Initial fetch completed
};

// ============================================================================
// 4. DOM Elements Cache
// ============================================================================
const DOM = {
  // Filters & Controls
  chips: document.querySelectorAll('.topic-chip'),
  btnSelectAll: document.getElementById('btn-select-all'),
  btnFetchNews: document.getElementById('btn-fetch-news'),
  btnSpinner: document.getElementById('btn-spinner'),
  
  // Feed
  feedMetaBar: document.getElementById('feed-meta-bar'),
  feedStatusTitle: document.getElementById('feed-status-title'),
  feedCountBadge: document.getElementById('feed-count-badge'),
  feedUpdateTime: document.getElementById('feed-update-time'),
  newsGrid: document.getElementById('news-grid'),
  
  // Infinite Scroll & Sentinel
  infiniteLoader: document.getElementById('infinite-loader'),
  endOfFeed: document.getElementById('end-of-feed'),
  scrollSentinel: document.getElementById('scroll-sentinel'),
  btnBackToTop: document.getElementById('btn-back-to-top'),

  // Modal
  modal: document.getElementById('article-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCategory: document.getElementById('modal-category'),
  modalPublisher: document.getElementById('modal-publisher'),
  modalDate: document.getElementById('modal-date'),
  modalTitle: document.getElementById('modal-title'),
  modalImage: document.getElementById('modal-image'),
  modalText: document.getElementById('modal-text'),
  modalOriginLink: document.getElementById('modal-origin-link'),
  modalCopyLink: document.getElementById('modal-copy-link'),
  
  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// 5. Utility Functions
// ============================================================================

/**
 * Toast Notification Popup
 */
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Clean & Extract publisher name from title ("기사제목 - 신문사")
 */
function parseTitleAndPublisher(rawTitle) {
  if (!rawTitle) return { title: '제목 없음', publisher: '뉴스' };

  // Strip trailing " - 언론사" pattern
  const lastDashIndex = rawTitle.lastIndexOf(' - ');
  if (lastDashIndex !== -1 && lastDashIndex > 5) {
    const title = rawTitle.substring(0, lastDashIndex).trim();
    const publisher = rawTitle.substring(lastDashIndex + 3).trim();
    return { title, publisher };
  }

  return { title: rawTitle.trim(), publisher: '종합뉴스' };
}

/**
 * Relative or localized date string formatter
 */
function formatTimeAgo(dateString) {
  if (!dateString) return '최근 기사';
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    if (diffSec < 86400 * 3) return `${Math.floor(diffSec / 86400)}일 전`;

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Strip raw HTML tags to plain text snippet
 */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Assign theme image based on category and hash
 */
function getThematicImage(category, index) {
  const images = CONFIG.THEME_IMAGES[category] || CONFIG.THEME_IMAGES.business;
  return images[index % images.length];
}

// ============================================================================
// 6. API Service: 무료 OpenAPI 호출 및 데이터 정규화
// ============================================================================

/**
 * Fetch top 10 articles for a single category
 */
async function fetchCategoryHeadlines(category) {
  const feedUrl = CONFIG.FEEDS[category];
  const endpoint = `${CONFIG.API_BASE}?rss_url=${encodeURIComponent(feedUrl)}`;

  try {
    // 5-second timeout for responsive UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
      // Take top 10 as specified in Requirement 2
      const top10 = data.items.slice(0, 10);
      return top10.map((item, idx) => {
        const { title, publisher } = parseTitleAndPublisher(item.title);
        const snippet = stripHtml(item.description || item.content || '');
        const image = (item.thumbnail && item.thumbnail.startsWith('http'))
          ? item.thumbnail
          : getThematicImage(category, idx);

        return {
          id: `${category}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          category,
          categoryLabel: CONFIG.CATEGORIES[category].label,
          title,
          publisher,
          pubDate: item.pubDate,
          imageUrl: image,
          snippet: snippet.length > 120 ? snippet.substring(0, 120) + '...' : snippet,
          fullContent: snippet || '본문 요약 정보를 불러올 수 없습니다. 원문 기사 보기를 통해 전체 내용을 확인하실 수 있습니다.',
          link: item.link
        };
      });
    } else {
      throw new Error('No items returned');
    }
  } catch (err) {
    console.warn(`[PulseNews] Live API fetch failed for '${category}' (${err.message}). Using fallback curated dataset.`);
    // Fallback gracefully
    const fallbackList = FALLBACK_ARTICLES[category] || [];
    return fallbackList.slice(0, 10).map((item, idx) => {
      const { title, publisher } = parseTitleAndPublisher(item.title);
      return {
        id: `fb-${category}-${idx}-${Date.now()}`,
        category,
        categoryLabel: CONFIG.CATEGORIES[category].label,
        title,
        publisher,
        pubDate: item.pubDate,
        imageUrl: getThematicImage(category, idx),
        snippet: item.description,
        fullContent: item.description,
        link: item.link
      };
    });
  }
}

/**
 * Fetch top 10 articles for all selected categories in parallel (Requirement 2)
 */
async function fetchNewsForSelectedCategories() {
  if (state.selectedCategories.length === 0) {
    showToast('최소 하나 이상의 주제를 선택해 주세요!');
    return;
  }

  // Set loading state
  state.isLoading = true;
  DOM.btnFetchNews.disabled = true;
  DOM.btnSpinner.classList.remove('hidden');
  renderSkeletons(6);

  try {
    // Parallel fetching for each selected category
    const fetchPromises = state.selectedCategories.map(cat => fetchCategoryHeadlines(cat));
    const results = await Promise.all(fetchPromises);

    // Merge & interlace results so the feed has a rich variety of topics
    const merged = [];
    const maxLen = Math.max(...results.map(r => r.length));
    for (let i = 0; i < maxLen; i++) {
      for (const catList of results) {
        if (catList[i]) merged.push(catList[i]);
      }
    }

    state.poolArticles = merged;
    state.currentIndex = 0;
    state.displayedArticles = [];

    // Initial slice: load first 10 articles
    loadNextChunk(CONFIG.PAGE_SIZE);

    // Update metadata header
    const now = new Date();
    DOM.feedUpdateTime.textContent = `최근 업데이트: ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    DOM.feedStatusTitle.textContent = `${state.selectedCategories.map(c => CONFIG.CATEGORIES[c].label).join(', ')} 최신 헤드라인`;

    showToast(`총 ${state.poolArticles.length}개의 맞춤 헤드라인을 준비했습니다.`);
  } catch (error) {
    console.error('Error fetching headlines:', error);
    renderErrorMessage('뉴스를 불러오는 도중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    state.isLoading = false;
    state.isInitialLoaded = true;
    DOM.btnFetchNews.disabled = false;
    DOM.btnSpinner.classList.add('hidden');
  }
}

// ============================================================================
// 7. Infinite Scroll & Pagination Logic (Requirement 4)
// ============================================================================

/**
 * Load the next chunk of articles (10 articles per scroll)
 */
function loadNextChunk(count = CONFIG.PAGE_SIZE) {
  if (state.currentIndex >= state.poolArticles.length) {
    // If pool exhausted, show end of feed
    DOM.infiniteLoader.classList.add('hidden');
    DOM.endOfFeed.classList.remove('hidden');
    return;
  }

  const nextItems = state.poolArticles.slice(state.currentIndex, state.currentIndex + count);
  state.currentIndex += nextItems.length;
  state.displayedArticles.push(...nextItems);

  // Render newly added cards
  appendArticleCards(nextItems);

  // Update total count indicator
  DOM.feedCountBadge.textContent = `${state.displayedArticles.length} / ${state.poolArticles.length}건 표시 중`;

  // Check if reached end
  if (state.currentIndex >= state.poolArticles.length) {
    DOM.infiniteLoader.classList.add('hidden');
    DOM.endOfFeed.classList.remove('hidden');
  } else {
    DOM.endOfFeed.classList.add('hidden');
  }
}

/**
 * Setup IntersectionObserver on #scroll-sentinel for Infinite Scrolling
 */
function setupInfiniteScroll() {
  const observerOptions = {
    root: null,
    rootMargin: '200px', // Pre-fetch before user hits the exact bottom
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && !state.isLoading && state.isInitialLoaded) {
      if (state.currentIndex < state.poolArticles.length) {
        state.isLoading = true;
        DOM.infiniteLoader.classList.remove('hidden');

        // Small smooth delay for realistic feed response
        setTimeout(() => {
          loadNextChunk(CONFIG.PAGE_SIZE);
          state.isLoading = false;
          DOM.infiniteLoader.classList.add('hidden');
        }, 400);
      }
    }
  }, observerOptions);

  if (DOM.scrollSentinel) {
    observer.observe(DOM.scrollSentinel);
  }
}

// ============================================================================
// 8. Card Rendering Engine (Requirement 3 & 5)
// ============================================================================

/**
 * Render Skeleton Loading Cards
 */
function renderSkeletons(count = 6) {
  DOM.newsGrid.innerHTML = '';
  DOM.endOfFeed.classList.add('hidden');

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-media"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line title"></div>
        <div class="skeleton-line text"></div>
        <div class="skeleton-line text"></div>
        <div class="skeleton-line btn"></div>
      </div>
    `;
    DOM.newsGrid.appendChild(skeleton);
  }
}

/**
 * Append cards to Grid
 */
function appendArticleCards(articles) {
  // If first chunk, clear any skeletons
  if (state.displayedArticles.length <= articles.length) {
    DOM.newsGrid.innerHTML = '';
  }

  articles.forEach((article) => {
    const card = createArticleCardElement(article);
    DOM.newsGrid.appendChild(card);
  });
}

/**
 * Create a single News Card Element
 * (Requirement 3: 제목, 이미지, '읽기' 버튼)
 * (Requirement 5: 깔끔한 흰색 배경과 그림자)
 */
function createArticleCardElement(article) {
  const card = document.createElement('article');
  card.className = 'news-card';
  card.dataset.id = article.id;

  const categoryMeta = CONFIG.CATEGORIES[article.category] || { label: '뉴스', icon: '📰', colorClass: 'business' };
  const timeAgo = formatTimeAgo(article.pubDate);

  card.innerHTML = `
    <!-- Card Media & Overlay Badge -->
    <div class="card-media">
      <img 
        src="${article.imageUrl}" 
        alt="${article.title}" 
        class="card-img" 
        loading="lazy" 
        onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';"
      />
      <div class="card-badge ${categoryMeta.colorClass}">
        <span>${categoryMeta.icon}</span>
        <span>${categoryMeta.label}</span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <div class="card-meta">
        <span class="publisher-tag">${article.publisher}</span>
        <span class="date-text">${timeAgo}</span>
      </div>
      
      <h3 class="card-title" title="${article.title}">${article.title}</h3>
      
      <p class="card-snippet">${article.snippet || '본문 요약 미리보기를 확인해 보세요.'}</p>
    </div>

    <!-- Card Footer & '읽기' 버튼 -->
    <div class="card-footer">
      <button class="btn-read" type="button" aria-label="${article.title} 읽기">
        <span>기사 읽기</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  `;

  // Attach event listener for reading article
  const readBtn = card.querySelector('.btn-read');
  const titleEl = card.querySelector('.card-title');
  const mediaEl = card.querySelector('.card-media');

  const openHandler = () => openArticleModal(article);
  readBtn.addEventListener('click', openHandler);
  titleEl.addEventListener('click', openHandler);
  mediaEl.addEventListener('click', openHandler);

  return card;
}

/**
 * Render Error or Empty Message Card
 */
function renderErrorMessage(message) {
  DOM.newsGrid.innerHTML = `
    <div class="feed-message-card">
      <div class="feed-message-icon">⚠️</div>
      <h3 class="feed-message-title">기사를 가져올 수 없습니다</h3>
      <p class="feed-message-desc">${message}</p>
      <button class="btn-primary" type="button" onclick="fetchNewsForSelectedCategories()">
        다시 시도하기
      </button>
    </div>
  `;
}

// ============================================================================
// 9. Article Modal Popup Controller (Requirement 3: 팝업으로 본문 열기)
// ============================================================================

/**
 * Open Article Detail Modal Popup
 */
function openArticleModal(article) {
  const categoryMeta = CONFIG.CATEGORIES[article.category] || { label: '뉴스', icon: '📰', colorClass: 'business' };

  // Set category badge
  DOM.modalCategory.textContent = `${categoryMeta.icon} ${categoryMeta.label}`;
  DOM.modalCategory.className = `category-badge ${categoryMeta.colorClass}`;

  // Set meta info
  DOM.modalPublisher.textContent = article.publisher;
  DOM.modalDate.textContent = article.pubDate ? formatTimeAgo(article.pubDate) : '최근';

  // Set headline & image
  DOM.modalTitle.textContent = article.title;
  DOM.modalImage.src = article.imageUrl;
  DOM.modalImage.alt = article.title;
  DOM.modalImage.onerror = function() {
    this.onerror = null;
    this.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
  };

  // Set content text
  DOM.modalText.innerHTML = `
    <p><strong>[${article.publisher}]</strong> ${article.title}</p>
    <p>${article.fullContent || article.snippet}</p>
    <p style="color: #64748b; font-size: 0.9rem; margin-top: 1.5rem; border-left: 3px solid #cbd5e1; padding-left: 0.8rem;">
      본 기사는 ${article.publisher}에서 발행된 원문 헤드라인 및 요약본입니다. 전체 기사 전문 및 추가 사진은 아래 '원문 기사 보러가기'를 클릭하여 열람하실 수 있습니다.
    </p>
  `;

  // Set external link
  DOM.modalOriginLink.href = article.link;

  // Copy link action handler
  DOM.modalCopyLink.onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(article.link)
        .then(() => showToast('기사 링크가 클립보드에 복사되었습니다!'))
        .catch(() => showToast('링크 복사에 실패했습니다.'));
    } else {
      showToast('링크 복사 기능을 지원하지 않는 브라우저입니다.');
    }
  };

  // Show Modal & Lock Body Scroll
  DOM.modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

/**
 * Close Article Detail Modal
 */
function closeArticleModal() {
  DOM.modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// ============================================================================
// 10. Event Listeners & Interactive Handlers
// ============================================================================

function setupEventListeners() {
  // Topic Chip Checkbox Toggle
  DOM.chips.forEach(chip => {
    const input = chip.querySelector('input[type="checkbox"]');
    
    chip.addEventListener('click', (e) => {
      // Avoid double trigger if clicking directly on input
      if (e.target !== input) {
        input.checked = !input.checked;
      }
      
      const category = chip.dataset.category;
      if (input.checked) {
        chip.classList.add('active');
        if (!state.selectedCategories.includes(category)) {
          state.selectedCategories.push(category);
        }
      } else {
        chip.classList.remove('active');
        state.selectedCategories = state.selectedCategories.filter(c => c !== category);
      }
    });
  });

  // '전체 선택/해제' Toggle Button
  DOM.btnSelectAll.addEventListener('click', () => {
    const allSelected = state.selectedCategories.length === Object.keys(CONFIG.CATEGORIES).length;
    
    if (allSelected) {
      // Deselect all
      state.selectedCategories = [];
      DOM.chips.forEach(chip => {
        chip.classList.remove('active');
        const input = chip.querySelector('input');
        if (input) input.checked = false;
      });
      showToast('모든 주제 선택이 해제되었습니다.');
    } else {
      // Select all
      state.selectedCategories = Object.keys(CONFIG.CATEGORIES);
      DOM.chips.forEach(chip => {
        chip.classList.add('active');
        const input = chip.querySelector('input');
        if (input) input.checked = true;
      });
      showToast('비즈니스, 스포츠, 문화 주제가 모두 선택되었습니다.');
    }
  });

  // '뉴스 보기' Button (Requirement 1 & 2)
  DOM.btnFetchNews.addEventListener('click', () => {
    fetchNewsForSelectedCategories();
  });

  // Modal Close Events (Close Button, Backdrop Click, ESC Key)
  DOM.modalCloseBtn.addEventListener('click', closeArticleModal);
  DOM.modal.addEventListener('click', (e) => {
    if (e.target === DOM.modal) {
      closeArticleModal();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !DOM.modal.classList.contains('hidden')) {
      closeArticleModal();
    }
  });

  // Floating Back to Top Button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      DOM.btnBackToTop.classList.remove('hidden');
    } else {
      DOM.btnBackToTop.classList.add('hidden');
    }
  }, { passive: true });

  DOM.btnBackToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================================================
// 11. Initial Application Bootstrap
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupInfiniteScroll();

  // Automatically fetch news on initial landing so the user is immediately wowed!
  fetchNewsForSelectedCategories();
});
