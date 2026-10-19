/**
 * ==========================================================================
 * NAVER Style Portal Starter Homepage JavaScript
 * Features:
 *  - Naver Search Engine Integration & Autocomplete & History
 *  - Realtime Gyeonggi-do Weather via Open-Meteo API & Multiple Cities
 *  - Entertainment News Engine (Categories, Featured, Likes, Star Gallery)
 *  - Real-time Trending Keywords Rolling Ticker
 *  - Customizable Quick Shortcuts (LocalStorage)
 *  - Live Korean Clock & Dark/Light Theme Switcher
 *  - Auto-saving Quick Scratchpad Memo
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  initNaverSearch();
  initGyeonggiWeather();
  initEntertainmentNews();
  initTrendingTicker();
  initShortcuts();
  initQuickMemo();
  initGuideModal();
});

/* ==========================================================================
   1. Live Korean Clock & Calendar
   ========================================================================== */
function initClock() {
  const dateEl = document.getElementById('currentDateText');
  const timeEl = document.getElementById('currentTimeText');
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  function update() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = weekDays[now.getDay()];

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    if (dateEl) dateEl.textContent = `${year}.${month}.${date} (${day})`;
    if (timeEl) timeEl.textContent = `${hours}:${minutes}`;
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   2. Dark / Light Theme Controller
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('naver_portal_theme') || 'light';
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      localStorage.setItem('naver_portal_theme', nextTheme);
    });
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun';
        themeIcon.style.color = '#f59e0b';
      } else {
        themeIcon.className = 'fa-solid fa-moon';
        themeIcon.style.color = '';
      }
    }
  }
}

/* ==========================================================================
   3. Naver Search Engine & Autocomplete
   ========================================================================== */
function initNaverSearch() {
  const searchForm = document.getElementById('naverSearchForm');
  const searchInput = document.getElementById('naverSearchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  const dropdown = document.getElementById('autocompleteDropdown');
  const toggleBtn = document.getElementById('autocompleteToggleBtn');
  const arrowIcon = document.getElementById('autocompleteArrow');
  const closeDropdownBtn = document.getElementById('closeDropdownBtn');
  const recentList = document.getElementById('recentSearchesList');
  const trendingList = document.getElementById('trendingSearchesList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const tabBtns = document.querySelectorAll('.dropdown-tab');

  let recentSearches = JSON.parse(localStorage.getItem('naver_recent_searches') || '["경기도 날씨", "아이유 신곡", "오늘의 연예 뉴스", "수원 가볼만한곳"]');

  const popularKeywords = [
    "경기도 날씨 예보", "네이버 웹툰 목요웹툰", "넷플릭스 추천 영화", "아이유 콘서트 일정",
    "뉴진스 컴백 소식", "수원 화성행궁 축제", "손흥민 경기 일정", "환율 실시간 시세",
    "스타벅스 신메뉴", "치지직 라이브 방송", "판교 테크노밸리 채용", "경기도 드라이브 코스"
  ];

  // Input input listener
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearBtn) {
        clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
      }
      renderAutocompleteSuggestions(searchInput.value.trim());
    });

    searchInput.addEventListener('focus', () => {
      openDropdown();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      searchInput.focus();
      renderRecentSearches();
    });
  }

  // Toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.style.display === 'none') {
        openDropdown();
      } else {
        closeDropdown();
      }
    });
  }

  if (closeDropdownBtn) {
    closeDropdownBtn.addEventListener('click', closeDropdown);
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-wrapper')) {
      closeDropdown();
    }
  });

  // Form submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      const query = searchInput.value.trim();
      if (!query) {
        e.preventDefault();
        searchInput.focus();
        return;
      }
      saveRecentSearch(query);
    });
  }

  // Dropdown Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'recent') {
        recentList.style.display = 'block';
        trendingList.style.display = 'none';
        if (clearRecentBtn) clearRecentBtn.style.display = 'block';
      } else {
        recentList.style.display = 'none';
        trendingList.style.display = 'block';
        if (clearRecentBtn) clearRecentBtn.style.display = 'none';
        renderTrendingSearches();
      }
    });
  });

  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', () => {
      recentSearches = [];
      localStorage.setItem('naver_recent_searches', JSON.stringify(recentSearches));
      renderRecentSearches();
    });
  }

  function openDropdown() {
    if (dropdown) dropdown.style.display = 'block';
    if (arrowIcon) arrowIcon.className = 'fa-solid fa-chevron-up';
    renderRecentSearches();
    renderTrendingSearches();
  }

  function closeDropdown() {
    if (dropdown) dropdown.style.display = 'none';
    if (arrowIcon) arrowIcon.className = 'fa-solid fa-chevron-down';
  }

  function saveRecentSearch(keyword) {
    recentSearches = [keyword, ...recentSearches.filter(k => k !== keyword)].slice(0, 10);
    localStorage.setItem('naver_recent_searches', JSON.stringify(recentSearches));
  }

  function renderRecentSearches() {
    if (!recentList) return;
    if (recentSearches.length === 0) {
      recentList.innerHTML = '<li class="autocomplete-item" style="color:var(--text-muted); justify-content:center;">최근 검색어 내역이 없습니다.</li>';
      return;
    }

    recentList.innerHTML = recentSearches.map(k => `
      <li class="autocomplete-item">
        <div class="item-left" onclick="executeSearch('${encodeURIComponent(k)}')">
          <i class="fa-regular fa-clock"></i>
          <span>${escapeHtml(k)}</span>
        </div>
        <button type="button" class="item-remove-btn" onclick="removeRecentSearch(event, '${escapeHtml(k)}')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </li>
    `).join('');
  }

  function renderTrendingSearches() {
    if (!trendingList) return;
    trendingList.innerHTML = popularKeywords.map((k, idx) => `
      <li class="autocomplete-item" onclick="executeSearch('${encodeURIComponent(k)}')">
        <div class="item-left">
          <span class="r-num ${idx < 3 ? 'top3' : ''}">${idx + 1}</span>
          <span>${escapeHtml(k)}</span>
        </div>
        <i class="fa-solid fa-arrow-trend-up" style="color:var(--naver-green); font-size:0.75rem;"></i>
      </li>
    `).join('');
  }

  function renderAutocompleteSuggestions(query) {
    if (!query) {
      renderRecentSearches();
      return;
    }
    const matched = popularKeywords.filter(k => k.toLowerCase().includes(query.toLowerCase()));
    if (!recentList) return;

    if (matched.length === 0) {
      recentList.innerHTML = `
        <li class="autocomplete-item" onclick="executeSearch('${encodeURIComponent(query)}')">
          <div class="item-left">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span><strong>${escapeHtml(query)}</strong> 검색</span>
          </div>
        </li>
      `;
      return;
    }

    recentList.innerHTML = matched.map(k => {
      const regex = new RegExp(`(${query})`, 'gi');
      const highlighted = k.replace(regex, '<span class="highlight">$1</span>');
      return `
        <li class="autocomplete-item" onclick="executeSearch('${encodeURIComponent(k)}')">
          <div class="item-left">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>${highlighted}</span>
          </div>
        </li>
      `;
    }).join('');
  }

  window.executeSearch = function(query) {
    const decoded = decodeURIComponent(query);
    if (searchInput) searchInput.value = decoded;
    saveRecentSearch(decoded);
    window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(decoded)}`, '_blank');
    closeDropdown();
  };

  window.removeRecentSearch = function(e, keyword) {
    e.stopPropagation();
    recentSearches = recentSearches.filter(k => k !== keyword);
    localStorage.setItem('naver_recent_searches', JSON.stringify(recentSearches));
    renderRecentSearches();
  };
}

/* ==========================================================================
   4. ⭐ [핵심 요구사항] 오늘의 날씨 [경기도] Engine ⭐
   ========================================================================== */
function initGyeonggiWeather() {
  const citySelect = document.getElementById('gyeonggiCitySelect');
  const refreshBtn = document.getElementById('weatherRefreshBtn');

  // Gyeonggi-do Region Coordinates & Data Dictionary
  const gyeonggiCities = {
    suwon: { name: "수원시 팔달구", lat: 37.2636, lon: 127.0286, dust: 18, ultra: 8, dustStatus: "good", ultraStatus: "good" },
    seongnam: { name: "성남시 분당구", lat: 37.3827, lon: 127.1189, dust: 21, ultra: 9, dustStatus: "good", ultraStatus: "good" },
    goyang: { name: "고양시 일산동구", lat: 37.6584, lon: 126.8320, dust: 24, ultra: 11, dustStatus: "good", ultraStatus: "good" },
    yongin: { name: "용인시 수지구", lat: 37.2411, lon: 127.1776, dust: 19, ultra: 8, dustStatus: "good", ultraStatus: "good" },
    bucheon: { name: "부천시 원미구", lat: 37.5034, lon: 126.7660, dust: 29, ultra: 14, dustStatus: "normal", ultraStatus: "normal" },
    anyang: { name: "안양시 동안구", lat: 37.3943, lon: 126.9568, dust: 20, ultra: 9, dustStatus: "good", ultraStatus: "good" },
    hwaseong: { name: "화성시 동탄", lat: 37.1995, lon: 126.8315, dust: 22, ultra: 10, dustStatus: "good", ultraStatus: "good" },
    namyangju: { name: "남양주시 다산", lat: 37.6360, lon: 127.2165, dust: 16, ultra: 7, dustStatus: "good", ultraStatus: "good" },
    pyeongtaek: { name: "평택시 고덕", lat: 36.9921, lon: 127.1129, dust: 31, ultra: 15, dustStatus: "normal", ultraStatus: "normal" },
    uijeongbu: { name: "의정부시", lat: 37.7381, lon: 127.0337, dust: 20, ultra: 9, dustStatus: "good", ultraStatus: "good" },
    gimpo: { name: "김포시", lat: 37.6153, lon: 126.7156, dust: 26, ultra: 13, dustStatus: "normal", ultraStatus: "normal" },
    paju: { name: "파주시 운정", lat: 37.7599, lon: 126.7800, dust: 18, ultra: 8, dustStatus: "good", ultraStatus: "good" }
  };

  const savedCity = localStorage.getItem('naver_gyeonggi_city') || 'suwon';
  if (citySelect) {
    citySelect.value = savedCity;
    citySelect.addEventListener('change', () => {
      const cityKey = citySelect.value;
      localStorage.setItem('naver_gyeonggi_city', cityKey);
      fetchWeatherData(cityKey);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const cityKey = citySelect ? citySelect.value : 'suwon';
      fetchWeatherData(cityKey);
    });
  }

  // Initial Fetch
  fetchWeatherData(savedCity);

  async function fetchWeatherData(cityKey) {
    const loc = gyeonggiCities[cityKey] || gyeonggiCities.suwon;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API error');
      const data = await response.json();
      renderLiveWeather(data, loc);
    } catch (err) {
      console.warn('Live weather fetch failed, rendering fallback model:', err);
      renderFallbackWeather(loc);
    }
  }

  function getWeatherInfo(code) {
    // WMO Weather interpretation codes (WW)
    if (code === 0) {
      return {
        desc: "맑음",
        icon: `<i class="fa-solid fa-sun weather-icon-sun"></i>`,
        tip: "맑고 화창한 날씨예요. 야외 활동하기 좋습니다!"
      };
    } else if (code === 1 || code === 2) {
      return {
        desc: "구름 조금",
        icon: `<i class="fa-solid fa-cloud-sun weather-icon-sun"></i>`,
        tip: "구름 사이로 햇살이 비치는 온화한 날씨입니다."
      };
    } else if (code === 3) {
      return {
        desc: "흐림",
        icon: `<i class="fa-solid fa-cloud weather-icon-cloud"></i>`,
        tip: "선선하고 다소 흐린 날씨가 이어집니다."
      };
    } else if (code === 45 || code === 48) {
      return {
        desc: "안개",
        icon: `<i class="fa-solid fa-smog weather-icon-cloud"></i>`,
        tip: "시야가 다소 흐리니 안전 운전하세요."
      };
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return {
        desc: "비",
        icon: `<i class="fa-solid fa-cloud-showers-heavy weather-icon-rain"></i>`,
        tip: "외출 시 우산을 꼭 챙겨가세요!"
      };
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return {
        desc: "눈",
        icon: `<i class="fa-solid fa-snowflake weather-icon-rain"></i>`,
        tip: "눈길 미끄럼에 주의하세요."
      };
    } else if ([95, 96, 99].includes(code)) {
      return {
        desc: "천둥번개",
        icon: `<i class="fa-solid fa-bolt weather-icon-rain"></i>`,
        tip: "천둥번개를 동반한 비가 예상됩니다. 안전에 유의하세요."
      };
    }
    return {
      desc: "구름많음",
      icon: `<i class="fa-solid fa-cloud-sun weather-icon-sun"></i>`,
      tip: "활동하기 무난한 날씨입니다."
    };
  }

  function renderLiveWeather(data, loc) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherInfo = getWeatherInfo(current.weather_code);

    // Current Temp & Condition
    setText('currentTemp', Math.round(current.temperature_2m));
    setText('weatherConditionText', weatherInfo.desc);
    setText('feelsLikeTemp', `${Math.round(current.apparent_temperature)}°`);
    setText('weatherTipText', weatherInfo.tip);
    setHtml('weatherIconDisplay', weatherInfo.icon);

    // Min / Max
    if (daily && daily.temperature_2m_min && daily.temperature_2m_max) {
      setText('minTemp', `${Math.round(daily.temperature_2m_min[0])}°`);
      setText('maxTemp', `${Math.round(daily.temperature_2m_max[0])}°`);
    }

    // Environmental metrics
    setText('humidityVal', `<i class="fa-solid fa-droplet"></i> ${current.relative_humidity_2m}%`);
    setText('precipProbVal', `<i class="fa-solid fa-umbrella"></i> ${daily?.precipitation_probability_max?.[0] || 0}%`);
    setText('windVal', `<i class="fa-solid fa-wind"></i> ${current.wind_speed_10m}m/s`);

    // Air Quality Status
    renderDust(loc);

    // Hourly Forecast (Next 8 slots)
    renderHourlyForecast(hourly);

    // Weekly Forecast (7 days)
    renderWeeklyForecast(daily);
  }

  function renderFallbackWeather(loc) {
    const weatherInfo = getWeatherInfo(0);
    setText('currentTemp', '24');
    setText('weatherConditionText', '맑음');
    setText('feelsLikeTemp', '25.2°');
    setText('minTemp', '18°');
    setText('maxTemp', '28°');
    setText('weatherTipText', '경기도 날씨가 화창하고 맑아요. 산책하기 좋은 날씨입니다.');
    setHtml('weatherIconDisplay', weatherInfo.icon);

    setText('humidityVal', '<i class="fa-solid fa-droplet"></i> 54%');
    setText('precipProbVal', '<i class="fa-solid fa-umbrella"></i> 0%');
    setText('windVal', '<i class="fa-solid fa-wind"></i> 1.9m/s');

    renderDust(loc);

    // Mock hourly
    const hourlySlider = document.getElementById('hourlyForecastSlider');
    if (hourlySlider) {
      const mockHours = [
        { time: "지금", temp: "24°", icon: '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>' },
        { time: "14시", temp: "26°", icon: '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>' },
        { time: "16시", temp: "25°", icon: '<i class="fa-solid fa-cloud-sun" style="color:#f59e0b;"></i>' },
        { time: "18시", temp: "22°", icon: '<i class="fa-solid fa-cloud" style="color:#94a3b8;"></i>' },
        { time: "20시", temp: "20°", icon: '<i class="fa-solid fa-moon" style="color:#8b5cf6;"></i>' },
        { time: "22시", temp: "19°", icon: '<i class="fa-solid fa-moon" style="color:#8b5cf6;"></i>' },
        { time: "내일", temp: "18°", icon: '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>' },
      ];
      hourlySlider.innerHTML = mockHours.map((h, i) => `
        <div class="hourly-item ${i === 0 ? 'now' : ''}">
          <span class="hourly-time">${h.time}</span>
          <span class="hourly-icon">${h.icon}</span>
          <span class="hourly-temp">${h.temp}</span>
        </div>
      `).join('');
    }

    // Mock weekly
    const weeklyList = document.getElementById('weeklyForecastList');
    if (weeklyList) {
      const days = ['오늘', '내일', '모레', '일', '월', '화', '수'];
      weeklyList.innerHTML = days.map((day, idx) => `
        <li class="weekly-item">
          <span class="weekly-day">${day}</span>
          <div class="weekly-icon-pop">
            <i class="fa-solid fa-sun" style="color:#f59e0b; font-size:0.95rem;"></i>
            <span class="weekly-pop">0%</span>
          </div>
          <div class="weekly-bar-wrap">
            <span class="w-min">${17 + (idx % 2)}°</span>
            <span class="temp-sep">/</span>
            <span class="w-max">${27 + (idx % 3)}°</span>
          </div>
        </li>
      `).join('');
    }
  }

  function renderDust(loc) {
    const dustBadge = document.getElementById('dustBadge');
    const dustVal = document.getElementById('dustVal');
    const ultraDustBadge = document.getElementById('ultraDustBadge');
    const ultraDustVal = document.getElementById('ultraDustVal');

    if (dustBadge && dustVal) {
      dustVal.textContent = `좋음 (${loc.dust}㎍)`;
      dustBadge.className = `env-status-badge status-${loc.dustStatus}`;
    }
    if (ultraDustBadge && ultraDustVal) {
      ultraDustVal.textContent = `좋음 (${loc.ultra}㎍)`;
      ultraDustBadge.className = `env-status-badge status-${loc.ultraStatus}`;
    }
  }

  function renderHourlyForecast(hourly) {
    const slider = document.getElementById('hourlyForecastSlider');
    if (!slider || !hourly || !hourly.time) return;

    const currentHour = new Date().getHours();
    let itemsHtml = '';

    for (let i = 0; i < 10; i++) {
      const targetIdx = currentHour + i;
      if (targetIdx >= hourly.time.length) break;

      const timeStr = hourly.time[targetIdx];
      const hour = new Date(timeStr).getHours();
      const label = i === 0 ? '지금' : `${hour}시`;
      const temp = Math.round(hourly.temperature_2m[targetIdx]);
      const wInfo = getWeatherInfo(hourly.weather_code[targetIdx]);

      itemsHtml += `
        <div class="hourly-item ${i === 0 ? 'now' : ''}">
          <span class="hourly-time">${label}</span>
          <span class="hourly-icon">${wInfo.icon}</span>
          <span class="hourly-temp">${temp}°</span>
        </div>
      `;
    }
    slider.innerHTML = itemsHtml;
  }

  function renderWeeklyForecast(daily) {
    const list = document.getElementById('weeklyForecastList');
    if (!list || !daily || !daily.time) return;

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    let listHtml = '';

    for (let i = 0; i < Math.min(daily.time.length, 7); i++) {
      const dateObj = new Date(daily.time[i]);
      let dayLabel = weekDays[dateObj.getDay()] + '요일';
      if (i === 0) dayLabel = '오늘';
      else if (i === 1) dayLabel = '내일';

      const minT = Math.round(daily.temperature_2m_min[i]);
      const maxT = Math.round(daily.temperature_2m_max[i]);
      const pop = daily.precipitation_probability_max?.[i] || 0;
      const wInfo = getWeatherInfo(daily.weather_code[i]);

      listHtml += `
        <li class="weekly-item">
          <span class="weekly-day">${dayLabel}</span>
          <div class="weekly-icon-pop">
            ${wInfo.icon}
            <span class="weekly-pop">${pop}%</span>
          </div>
          <div class="weekly-bar-wrap">
            <span class="w-min">${minT}°</span>
            <span class="temp-sep">/</span>
            <span class="w-max">${maxT}°</span>
          </div>
        </li>
      `;
    }
    list.innerHTML = listHtml;
  }
}

/* ==========================================================================
   5. Entertainment News Section Engine
   ========================================================================== */
function initEntertainmentNews() {
  const categoryTabs = document.getElementById('entCategoryTabs');
  const bannerContainer = document.getElementById('entFeaturedBanner');
  const newsGrid = document.getElementById('entNewsGrid');
  const photoSlider = document.getElementById('starPhotoSlider');
  const mostViewedList = document.getElementById('mostViewedNewsList');
  const starKeywordTags = document.getElementById('starKeywordTags');
  const refreshBtn = document.getElementById('refreshNewsBtn');
  const savedCountEl = document.getElementById('savedArticlesCount');

  let savedArticles = JSON.parse(localStorage.getItem('naver_saved_articles') || '[]');
  let likedArticles = JSON.parse(localStorage.getItem('naver_liked_articles') || '{}');

  updateSavedCount();

  // Rich Curated Celebrity News Dataset
  const newsData = [
    {
      id: "ent_01",
      category: "music",
      title: "아이유, 월드투어 앙코르 콘서트 서울서 성황리 개최... '팬 향한 진심 가득한 180분'",
      summary: "가수 아이유가 상암 월드컵경기장에서 10만 팬들과 함께 뜨거운 무대를 완성하며 대규모 월드투어의 피날레를 장식했다.",
      press: "스타뉴스",
      time: "15분 전",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
      featured: true,
      views: "18.4만",
      likes: 3420,
      badge: "단독"
    },
    {
      id: "ent_02",
      category: "broadcast",
      title: "‘유퀴즈’ 천만 배우 송중기 출격... 솔직담백 인생 2막과 차기작 비하인드 공개",
      summary: "배우 송중기가 유재석, 조세호와 함께 유쾌한 입담을 선보이며 방송 최고 시청률을 경신했다.",
      press: "OSEN",
      time: "32분 전",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      views: "12.8만",
      likes: 1850,
      badge: "방송"
    },
    {
      id: "ent_03",
      category: "music",
      title: "뉴진스(NewJeans), 빌보드 글로벌 차트 1위 탈환... K-POP 새 역사 썼다",
      summary: "독보적인 레트로 Y2K 감성으로 무장한 신곡이 전 세계 음원 차트를 휩쓸며 막강한 음원 파워를 입증했다.",
      press: "스포츠조선",
      time: "1시간 전",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
      views: "22.5만",
      likes: 4210,
      badge: "가요"
    },
    {
      id: "ent_04",
      category: "movie",
      title: "봉준호 감독 차기 SF 대작 드디어 베일 벗다... '미키 17' 압도적 비주얼 예고편 공개",
      summary: "로버트 패틴슨 주연의 봉준호 신작 영화가 예고편 공개 24시간 만에 조회수 1000만을 돌파하며 글로벌 기대감을 모았다.",
      press: "마이데일리",
      time: "1시간 전",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
      views: "15.1만",
      likes: 2190,
      badge: "영화"
    },
    {
      id: "ent_05",
      category: "photo",
      title: "[포토] 차은우, 비현실적인 조각 비주얼 '밀라노 패션위크 런웨이 압도'",
      summary: "명품 앰버서더로 참석한 차은우가 이탈리아 밀라노 현지 팬들의 환호 속에 눈부신 아우라를 발산했다.",
      press: "디스패치",
      time: "2시간 전",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
      views: "31.2만",
      likes: 5890,
      badge: "HD포토"
    },
    {
      id: "ent_06",
      category: "global",
      title: "방탄소년단(BTS) 정국, 英 오피셜 싱글 차트 최장기 진입 대기록 작성",
      summary: "솔로 앨범 수록곡들이 영국과 미국 메인 차트에서 굳건한 롱런 인기를 유지하며 월드 스타의 위엄을 과시했다.",
      press: "뉴스엔",
      time: "2시간 전",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      views: "19.8만",
      likes: 4780,
      badge: "해외"
    },
    {
      id: "ent_07",
      category: "broadcast",
      title: "임영웅, 단독 예능 '영웅시대와 함께' 첫방부터 분당 최고 12.4% 돌파",
      summary: "전국을 감동으로 물들인 임영웅의 따뜻한 힐링 토크와 감미로운 라이브 공연이 시청자들의 마음을 사로잡았다.",
      press: "스포츠서울",
      time: "3시간 전",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      views: "27.4만",
      likes: 6200,
      badge: "화제"
    },
    {
      id: "ent_08",
      category: "music",
      title: "에스파(aespa), 초동 150만 장 돌파하며 5연속 밀리언셀러 등극 '슈퍼노바 열풍'",
      summary: "쇠맛 신드롬을 일으키고 있는 에스파가 자체 최고 음반 판매량을 경신하며 글로벌 대세 걸그룹 굳히기에 나섰다.",
      press: "엑스포츠뉴스",
      time: "4시간 전",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      views: "14.3만",
      likes: 2980,
      badge: "가요"
    }
  ];

  // Star Photos for Visual Carousel
  const starPhotos = [
    { name: "아이유", role: "가수/배우", caption: "상암 앙코르 무대 빛낸 요정미", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80" },
    { name: "차은우", role: "배우", caption: "밀라노를 사로잡은 얼굴천재", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80" },
    { name: "뉴진스 민지", role: "가수", caption: "청량한 여름 화보 B컷", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80" },
    { name: "김수현", role: "배우", caption: "아시아 팬미팅 투어 열기", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80" }
  ];

  // Star Trending Keywords
  const starKeywords = [
    { tag: "#아이유_월드투어", count: "18.4만" },
    { tag: "#뉴진스_빌보드", count: "14.2만" },
    { tag: "#송중기_유퀴즈", count: "12.8만" },
    { tag: "#차은우_밀라노", count: "10.5만" },
    { tag: "#임영웅_영웅시대", count: "9.7만" },
    { tag: "#에스파_슈퍼노바", count: "8.9만" },
    { tag: "#봉준호_미키17", count: "7.6만" },
    { tag: "#손흥민_토트넘", count: "6.8만" }
  ];

  let currentCategory = 'all';

  renderNews();
  renderStarPhotos();
  renderMostViewedNews();
  renderStarKeywords();

  // Tab Filtering
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.ent-tab-btn');
      if (!btn) return;

      document.querySelectorAll('.ent-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderNews();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderNews();
      renderStarPhotos();
    });
  }

  function renderNews() {
    const filtered = currentCategory === 'all' 
      ? newsData 
      : newsData.filter(item => item.category === currentCategory);

    // Featured Hero Banner
    const featuredItem = filtered.find(item => item.featured) || filtered[0] || newsData[0];
    if (bannerContainer && featuredItem) {
      bannerContainer.innerHTML = `
        <div class="featured-card-inner" style="background-image: url('${featuredItem.image}');" onclick="openNaverSearchNews('${encodeURIComponent(featuredItem.title)}')">
          <div class="featured-gradient"></div>
          <div class="featured-text-content">
            <div class="featured-top-meta">
              <span class="featured-badge">${featuredItem.badge || 'HOT'}</span>
              <span class="featured-press">${featuredItem.press} • ${featuredItem.time}</span>
            </div>
            <h3 class="featured-title">${escapeHtml(featuredItem.title)}</h3>
            <p class="featured-desc">${escapeHtml(featuredItem.summary)}</p>
          </div>
        </div>
      `;
    }

    // Grid Articles (exclude featured from grid if all)
    const gridItems = filtered.filter(item => item.id !== featuredItem.id);
    if (newsGrid) {
      if (gridItems.length === 0) {
        newsGrid.innerHTML = `
          <div class="news-card-item" style="grid-column: span 2; justify-content: center; padding: 24px;">
            <p style="color:var(--text-muted);">해당 카테고리의 최신 뉴스를 불러오는 중입니다.</p>
          </div>
        `;
        return;
      }

      newsGrid.innerHTML = gridItems.map(item => {
        const isLiked = likedArticles[item.id];
        const likeCount = item.likes + (isLiked ? 1 : 0);

        return `
          <article class="news-card-item" onclick="openNaverSearchNews('${encodeURIComponent(item.title)}')">
            <div class="news-thumb-wrap">
              <img src="${item.image}" alt="기사 썸네일" class="news-thumb-img" loading="lazy">
              <span class="news-type-badge">${item.badge || '연예'}</span>
            </div>
            <div class="news-body">
              <h4 class="news-item-title">${escapeHtml(item.title)}</h4>
              <div class="news-meta-row">
                <div class="meta-left">
                  <span class="press-name">${item.press}</span>
                  <span>•</span>
                  <span>${item.time}</span>
                </div>
                <button type="button" class="news-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(event, '${item.id}')">
                  <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
                  <span>${likeCount}</span>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  function renderStarPhotos() {
    if (!photoSlider) return;
    photoSlider.innerHTML = starPhotos.map(photo => `
      <div class="star-photo-card" onclick="openNaverSearchNews('${encodeURIComponent(photo.name + ' 화보')}')">
        <img src="${photo.img}" alt="${escapeHtml(photo.name)}" class="star-photo-img" loading="lazy">
        <div class="star-photo-caption">
          <strong>${escapeHtml(photo.name)}</strong> · ${escapeHtml(photo.caption)}
        </div>
      </div>
    `).join('');
  }

  function renderMostViewedNews() {
    if (!mostViewedList) return;
    const sorted = [...newsData].sort((a, b) => parseFloat(b.views) - parseFloat(a.views)).slice(0, 5);
    mostViewedList.innerHTML = sorted.map((item, idx) => `
      <li class="ranked-news-item" onclick="openNaverSearchNews('${encodeURIComponent(item.title)}')">
        <span class="rank-idx">${idx + 1}</span>
        <span class="news-headline">${escapeHtml(item.title)}</span>
      </li>
    `).join('');
  }

  function renderStarKeywords() {
    if (!starKeywordTags) return;
    starKeywordTags.innerHTML = starKeywords.map(k => `
      <button type="button" class="star-tag-pill" onclick="openNaverSearchNews('${encodeURIComponent(k.tag.replace('#', ''))}')">
        <i class="fa-solid fa-hashtag"></i>
        <span>${escapeHtml(k.tag.replace('#', ''))}</span>
      </button>
    `).join('');
  }

  window.toggleLike = function(e, articleId) {
    e.stopPropagation();
    if (likedArticles[articleId]) {
      delete likedArticles[articleId];
    } else {
      likedArticles[articleId] = true;
    }
    localStorage.setItem('naver_liked_articles', JSON.stringify(likedArticles));
    renderNews();
  };

  window.openNaverSearchNews = function(encodedQuery) {
    const query = decodeURIComponent(encodedQuery);
    window.open(`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}`, '_blank');
  };

  function updateSavedCount() {
    if (savedCountEl) {
      savedCountEl.innerHTML = `${savedArticles.length} <small>개</small>`;
    }
  }
}

/* ==========================================================================
   6. Real-time Trending Search Keywords Rolling Ticker
   ========================================================================== */
function initTrendingTicker() {
  const rankEl = document.getElementById('tickerRank');
  const keywordEl = document.getElementById('tickerKeyword');
  const moreBtn = document.getElementById('tickerMoreBtn');
  const popover = document.getElementById('rankingPopover');
  const rankingList = document.getElementById('rankingTop10List');

  const trendingItems = [
    { rank: 1, text: "경기도 날씨 전망", diff: "up" },
    { rank: 2, text: "아이유 신곡 앙코르", diff: "up" },
    { rank: 3, text: "손흥민 골 하이라이트", diff: "same" },
    { rank: 4, text: "뉴진스 빌보드 1위", diff: "up" },
    { rank: 5, text: "수원 화성행궁 야간개장", diff: "new" },
    { rank: 6, text: "미국 증시 환율 시세", diff: "down" },
    { rank: 7, text: "봉준호 미키17 예고편", diff: "up" },
    { rank: 8, text: "송중기 유퀴즈 풀버전", diff: "up" },
    { rank: 9, text: "넷플릭스 신작 드라마", diff: "same" },
    { rank: 10, text: "판교 맛집 베스트10", diff: "new" }
  ];

  let currentIndex = 0;

  function updateTicker() {
    const item = trendingItems[currentIndex];
    if (rankEl) rankEl.textContent = item.rank;
    if (keywordEl) {
      keywordEl.textContent = item.text;
      keywordEl.href = `https://search.naver.com/search.naver?query=${encodeURIComponent(item.text)}`;
    }
    currentIndex = (currentIndex + 1) % trendingItems.length;
  }

  setInterval(updateTicker, 3200);

  // Popover Toggle
  if (moreBtn && popover) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
      renderRankingPopover();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.trending-ticker-bar')) {
        popover.style.display = 'none';
      }
    });
  }

  function renderRankingPopover() {
    if (!rankingList) return;
    rankingList.innerHTML = trendingItems.map(item => `
      <li class="ranking-item" onclick="executeSearch('${encodeURIComponent(item.text)}')">
        <div class="rank-left">
          <span class="r-num ${item.rank <= 3 ? 'top3' : ''}">${item.rank}</span>
          <span class="r-text">${escapeHtml(item.text)}</span>
        </div>
        <span class="ticker-diff ${item.diff}"><i class="fa-solid fa-arrow-up"></i></span>
      </li>
    `).join('');
  }
}

/* ==========================================================================
   7. Quick Shortcuts Manager (Add/Remove Custom Bookmarks)
   ========================================================================== */
function initShortcuts() {
  const grid = document.getElementById('shortcutsGrid');
  const modal = document.getElementById('shortcutModal');
  const closeBtn = document.getElementById('closeShortcutModalBtn');
  const cancelBtn = document.getElementById('cancelShortcutBtn');
  const saveBtn = document.getElementById('saveShortcutBtn');
  const titleInput = document.getElementById('shortcutTitleInput');
  const urlInput = document.getElementById('shortcutUrlInput');
  const colorDots = document.querySelectorAll('.color-dot');

  let selectedColor = '#03C75A';

  const defaultShortcuts = [
    { title: "유튜브", url: "https://www.youtube.com", icon: "fa-brands fa-youtube", bg: "#FF0000" },
    { title: "네이버 웹툰", url: "https://comic.naver.com", icon: "fa-solid fa-book-open", bg: "#03C75A" },
    { title: "ChatGPT", url: "https://chatgpt.com", icon: "fa-solid fa-robot", bg: "#10A37F" },
    { title: "Google", url: "https://www.google.com", icon: "fa-brands fa-google", bg: "#4285F4" },
    { title: "넷플릭스", url: "https://www.netflix.com", icon: "fa-solid fa-film", bg: "#E50914" },
    { title: "쿠팡", url: "https://www.coupang.com", icon: "fa-solid fa-cart-shopping", bg: "#F57224" },
    { title: "GitHub", url: "https://github.com", icon: "fa-brands fa-github", bg: "#24292e" },
    { title: "인스타그램", url: "https://www.instagram.com", icon: "fa-brands fa-instagram", bg: "#E1306C" }
  ];

  let userShortcuts = JSON.parse(localStorage.getItem('naver_user_shortcuts') || JSON.stringify(defaultShortcuts));

  renderShortcuts();

  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      selectedColor = dot.dataset.color;
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      let url = urlInput.value.trim();

      if (!title || !url) {
        alert('사이트 이름과 URL을 모두 입력해 주세요.');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      userShortcuts.push({
        title,
        url,
        icon: "fa-solid fa-globe",
        bg: selectedColor,
        custom: true
      });

      localStorage.setItem('naver_user_shortcuts', JSON.stringify(userShortcuts));
      closeModal();
      renderShortcuts();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  function renderShortcuts() {
    if (!grid) return;
    const itemsHtml = userShortcuts.map((sc, idx) => `
      <div class="shortcut-item" onclick="window.open('${sc.url}', '_blank')">
        <div class="shortcut-icon" style="background-color: ${sc.bg};">
          <i class="${sc.icon}"></i>
        </div>
        <span class="shortcut-title">${escapeHtml(sc.title)}</span>
        ${sc.custom ? `
          <button type="button" class="shortcut-delete-btn" onclick="deleteShortcut(event, ${idx})" title="삭제">
            <i class="fa-solid fa-xmark"></i>
          </button>
        ` : ''}
      </div>
    `).join('');

    grid.innerHTML = itemsHtml + `
      <div class="shortcut-item add-shortcut-item" onclick="openShortcutModal()">
        <div class="shortcut-icon add-icon">
          <i class="fa-solid fa-plus"></i>
        </div>
        <span class="shortcut-title">추가</span>
      </div>
    `;
  }

  window.openShortcutModal = function() {
    if (modal) modal.style.display = 'flex';
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
  };

  function closeModal() {
    if (modal) modal.style.display = 'none';
  }

  window.deleteShortcut = function(e, idx) {
    e.stopPropagation();
    userShortcuts.splice(idx, 1);
    localStorage.setItem('naver_user_shortcuts', JSON.stringify(userShortcuts));
    renderShortcuts();
  };
}

/* ==========================================================================
   8. Quick Scratchpad Memo Widget
   ========================================================================== */
function initQuickMemo() {
  const memoArea = document.getElementById('quickMemoInput');
  const clearBtn = document.getElementById('clearMemoBtn');
  const statusEl = document.getElementById('memoSaveStatus');

  if (memoArea) {
    memoArea.value = localStorage.getItem('naver_quick_memo') || '';

    memoArea.addEventListener('input', () => {
      localStorage.setItem('naver_quick_memo', memoArea.value);
      if (statusEl) {
        statusEl.textContent = '저장 중...';
        setTimeout(() => {
          statusEl.textContent = '자동 저장됨';
        }, 500);
      }
    });
  }

  if (clearBtn && memoArea) {
    clearBtn.addEventListener('click', () => {
      if (confirm('메모를 모두 지우시겠습니까?')) {
        memoArea.value = '';
        localStorage.removeItem('naver_quick_memo');
        if (statusEl) statusEl.textContent = '비워짐';
      }
    });
  }
}

/* ==========================================================================
   9. Start Page Guide Modal
   ========================================================================== */
function initGuideModal() {
  const openBtn = document.getElementById('startPageGuideBtn');
  const modal = document.getElementById('startPageGuideModal');
  const closeBtn = document.getElementById('closeGuideModalBtn');
  const confirmBtn = document.getElementById('confirmGuideBtn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.style.display = 'flex');
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }
  if (confirmBtn && modal) {
    confirmBtn.addEventListener('click', () => modal.style.display = 'none');
  }
}

/* ==========================================================================
   Utility Helpers
   ========================================================================== */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
