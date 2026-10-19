/**
 * 동창회 모바일 초대장 웹 애플리케이션 (app.js)
 * 1. [사진 섹션] 부드러운 슬라이더 / 터치 스와이프 / 라이트박스
 * 2. [카운트다운 섹션] 실시간 카운트다운 타이머 & 캘린더 등록
 * 3. [지도 섹션] 300x300 창경궁 지도 (Leaflet + 네이버 연동)
 * 4. 파티클 애니메이션, BGM 오디오 합성, RSVP 및 방명록 관리
 */

// ==========================================
// 1. 전역 데이터 및 상태 관리
// ==========================================
const photosData = [
  {
    src: 'img/입학.jpg',
    title: '새로운 시작, 풋풋했던 입학식',
    tag: '01. 설레임의 시작',
    desc: '모든 것이 낯설고 설레었던 첫 만남의 순간'
  },
  {
    src: 'img/봄소풍.jpg',
    title: '웃음꽃 가득했던 봄소풍',
    tag: '02. 푸르른 청춘',
    desc: '도시락 나눠먹으며 잔디밭을 뛰놀던 찬란한 봄날'
  },
  {
    src: 'img/장기자랑.jpg',
    title: '우리 모두가 주인공, 장기자랑',
    tag: '03. 뜨거웠던 열기',
    desc: '함께 목청껏 환호하고 무대를 빛내던 뜨거운 열정'
  },
  {
    src: 'img/졸업.jpg',
    title: '눈물과 감동의 졸업식',
    tag: '04. 아름다운 매듭',
    desc: '더 큰 세상으로 나아가며 훗날을 기약하던 그날'
  }
];

// 동창회 행사 일시: 2026년 10월 24일 17:00:00 (KST)
const TARGET_DATE = new Date('2026-10-24T17:00:00+09:00').getTime();

// 창경궁 좌표
const CHANGGYEONGGUNG_COORDS = [37.579617, 126.994849];

// ==========================================
// 2. [사진 섹션] 부드러운 슬라이더 로직
// ==========================================
let currentSlide = 0;
let slideInterval = null;
let isAutoPlaying = true;
let touchStartX = 0;
let touchEndX = 0;

function initSlider() {
  const track = document.getElementById('slider-track');
  const slides = document.querySelectorAll('.slide-item');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const playToggle = document.getElementById('slider-play-toggle');
  const playText = document.getElementById('play-status-text');

  if (!track || slides.length === 0) return;

  function updateSlider() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlide);
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
  }

  function startAutoPlay() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3800);
    isAutoPlaying = true;
    if (playToggle) {
      playToggle.innerHTML = '<i class="fa-solid fa-pause"></i> <span id="play-status-text">자동 재생 중</span>';
    }
  }

  function stopAutoPlay() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
    isAutoPlaying = false;
    if (playToggle) {
      playToggle.innerHTML = '<i class="fa-solid fa-play"></i> <span id="play-status-text">일시 정지됨</span>';
    }
  }

  // 버튼 이벤트
  if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    if (isAutoPlaying) startAutoPlay(); // 타이머 리셋
  });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    if (isAutoPlaying) startAutoPlay();
  });

  // 도트 클릭 이벤트
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentSlide = parseInt(e.target.getAttribute('data-index'), 10);
      updateSlider();
      if (isAutoPlaying) startAutoPlay();
    });
  });

  // 자동 재생 토글 버튼
  if (playToggle) {
    playToggle.addEventListener('click', () => {
      if (isAutoPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  // 모바일 터치 스와이프 제스처
  const sliderContainer = document.getElementById('photo-slider');
  if (sliderContainer) {
    sliderContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide(); // 왼쪽으로 밀기 -> 다음 사진
      } else {
        prevSlide(); // 오른쪽으로 밀기 -> 이전 사진
      }
      if (isAutoPlaying) startAutoPlay();
    }
  }

  // 초기 자동 재생 시작
  startAutoPlay();
}

// ==========================================
// 라이트박스 팝업 (사진 확대 보기)
// ==========================================
let currentLightboxIndex = 0;

function openLightbox(index) {
  currentLightboxIndex = index;
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lb-counter');

  if (!modal || !img || !caption) return;

  const data = photosData[currentLightboxIndex];
  img.src = data.src;
  caption.innerHTML = `<strong>${data.title}</strong><br><span style="font-size: 0.8rem; opacity: 0.8;">${data.desc}</span>`;
  if (counter) counter.innerText = `${currentLightboxIndex + 1} / ${photosData.length}`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function navigateLightbox(step) {
  currentLightboxIndex = (currentLightboxIndex + step + photosData.length) % photosData.length;
  openLightbox(currentLightboxIndex);
}

// ==========================================
// 3. [카운트다운 섹션] 실시간 카운트다운 타이머
// ==========================================
let lastDays = -1, lastHours = -1, lastMins = -1, lastSecs = -1;

function initCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const ddayEl = document.getElementById('d-day-display');
  const msgEl = document.getElementById('countdown-msg');

  function updateTimer() {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;

    if (distance <= 0) {
      if (ddayEl) ddayEl.innerText = 'D-DAY';
      if (daysEl) daysEl.innerText = '00';
      if (hoursEl) hoursEl.innerText = '00';
      if (minutesEl) minutesEl.innerText = '00';
      if (secondsEl) secondsEl.innerText = '00';
      if (msgEl) msgEl.innerHTML = '🎉 <strong>동창회가 진행 중입니다! 즐거운 시간 되세요!</strong>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // D-Day 텍스트
    if (ddayEl) {
      ddayEl.innerText = `D-${days === 0 ? 'DAY' : days}`;
    }

    // 숫자 애니메이션 및 텍스트 갱신
    updateDigit(daysEl, days, lastDays);
    updateDigit(hoursEl, hours, lastHours);
    updateDigit(minutesEl, minutes, lastMins);
    updateDigit(secondsEl, seconds, lastSecs);

    lastDays = days;
    lastHours = hours;
    lastMins = minutes;
    lastSecs = seconds;
  }

  function updateDigit(element, newVal, oldVal) {
    if (!element) return;
    const formatted = String(newVal).padStart(2, '0');
    if (newVal !== oldVal) {
      element.innerText = formatted;
      element.classList.remove('flip');
      void element.offsetWidth; // Trigger reflow
      element.classList.add('flip');
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);

  // 캘린더 등록 버튼
  const calBtn = document.getElementById('add-to-cal-btn');
  if (calBtn) {
    calBtn.addEventListener('click', addToCalendar);
  }
}

// 캘린더 등록 (구글 캘린더 / .ics 파일 다운로드)
function addToCalendar() {
  const title = encodeURIComponent('2026 동창회 (창경궁)');
  const details = encodeURIComponent('그리운 친구들과의 만남! 서울 창경궁 일대에서 만나요.');
  const location = encodeURIComponent('서울특별시 종로구 창경궁로 185 (창경궁)');
  const startDate = '20261024T170000';
  const endDate = '20261024T213000';

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  
  window.open(googleCalUrl, '_blank');
  showToast('구글 캘린더에 일정을 추가합니다.');
}

// ==========================================
// 4. [지도 섹션] 300×300픽셀 창경궁 지도 렌더링
// ==========================================
function initMap() {
  const mapElement = document.getElementById('naver-custom-map');
  if (!mapElement) return;

  try {
    // Leaflet 맵 초기화 (정확한 300x300 컨테이너에 맞춤)
    const map = L.map('naver-custom-map', {
      center: CHANGGYEONGGUNG_COORDS,
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    });

    // 고해상도 OSM / CartoDB 타일 레이어 적용
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // 네이버 스타일 커스텀 마커 생성
    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background: #03c75a;
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
        ">
          <span style="transform: rotate(45deg); font-weight: 800; font-size: 13px;">N</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32]
    });

    const marker = L.marker(CHANGGYEONGGUNG_COORDS, { icon: customIcon }).addTo(map);

    // 팝업 내용
    const popupContent = `
      <div style="text-align: center; padding: 4px;">
        <strong style="color: #2b2623; font-size: 14px;">창경궁 (동창회 장소)</strong>
        <p style="margin: 4px 0 8px; font-size: 11px; color: #666;">서울 종로구 창경궁로 185</p>
        <a href="https://map.naver.com/p/search/%EC%B0%BD%EA%B2%BD%EA%B6%81" target="_blank" style="
          display: inline-block;
          background: #03c75a;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          text-decoration: none;
          font-weight: bold;
        ">네이버 지도로 보기</a>
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();

    // 300x300 크기 정확한 렌더링을 위해 리사이즈 보정
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

  } catch (err) {
    console.error('지도 초기화 오류:', err);
  }

  // 주소 복사 버튼
  const copyAddrBtn = document.getElementById('copy-addr-btn');
  if (copyAddrBtn) {
    copyAddrBtn.addEventListener('click', () => {
      const address = '서울특별시 종로구 창경궁로 185';
      copyToClipboard(address, '창경궁 주소가 복사되었습니다.');
    });
  }
}

// ==========================================
// 5. RSVP (참석 여부 알리기)
// ==========================================
function handleRSVPSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('rsvp-name').value.trim();
  const phone = document.getElementById('rsvp-phone').value.trim();
  const attendance = document.querySelector('input[name="attendance"]:checked')?.value || 'attend';
  const memo = document.getElementById('rsvp-memo').value.trim();

  if (!name || !phone) {
    alert('이름과 연락처를 입력해주세요.');
    return;
  }

  const rsvpData = {
    name,
    phone,
    attendance,
    memo,
    date: new Date().toISOString()
  };

  // 로컬 스토리지에 저장
  const existing = JSON.parse(localStorage.getItem('alumni_rsvp_list') || '[]');
  existing.push(rsvpData);
  localStorage.setItem('alumni_rsvp_list', JSON.stringify(existing));

  // 축하 폭죽 효과 (참석 시)
  if (attendance === 'attend' && typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  showToast(`${name}님의 참석 정보가 성공적으로 전달되었습니다! 🎉`);
  event.target.reset();
}

// ==========================================
// 6. 방명록 (Guestbook)
// ==========================================
const DEFAULT_GUESTBOOK = [
  {
    id: 1,
    author: '강민수 (반장)',
    content: '모두 오랜만이다! 벌써 동창회 날이 다가오네. 한 명도 빠짐없이 얼굴 보고 옛날 이야기 나누자!',
    date: '2026. 09. 20.'
  },
  {
    id: 2,
    author: '이지은',
    content: '사진들 보니 학창시절 기억이 새록새록 떠오르네요 🌸 창경궁 가을 단풍 보며 즐거운 시간 보내요!',
    date: '2026. 09. 22.'
  }
];

function getGuestbookList() {
  const data = localStorage.getItem('alumni_guestbook_list');
  return data ? JSON.parse(data) : DEFAULT_GUESTBOOK;
}

function saveGuestbookList(list) {
  localStorage.setItem('alumni_guestbook_list', JSON.stringify(list));
}

function renderGuestbook() {
  const container = document.getElementById('guestbook-list');
  if (!container) return;

  const list = getGuestbookList();
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align: center; font-size: 0.85rem; color: #9c928a; padding: 20px;">가장 먼저 친구들에게 인사를 남겨보세요!</p>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="gb-item" data-id="${item.id}">
      <div class="gb-item-header">
        <span class="gb-item-author"><i class="fa-regular fa-comment-dots" style="color: var(--primary);"></i> ${escapeHTML(item.author)}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="gb-item-date">${item.date}</span>
          <button class="gb-delete-btn" onclick="deleteGuestbookItem(${item.id})" title="삭제">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      <p class="gb-item-content">${escapeHTML(item.content)}</p>
    </div>
  `).join('');
}

function handleGuestbookSubmit(event) {
  event.preventDefault();

  const author = document.getElementById('gb-author').value.trim();
  const pwd = document.getElementById('gb-pwd').value.trim();
  const content = document.getElementById('gb-content').value.trim();

  if (!author || !pwd || !content) {
    alert('모든 항목을 입력해주세요.');
    return;
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}.`;

  const newItem = {
    id: Date.now(),
    author,
    pwd,
    content,
    date: dateStr
  };

  const list = getGuestbookList();
  list.unshift(newItem);
  saveGuestbookList(list);

  renderGuestbook();
  event.target.reset();

  const charCounter = document.getElementById('gb-char-counter');
  if (charCounter) charCounter.innerText = '0 / 150';

  showToast('소중한 응원의 한마디가 등록되었습니다!');
}

function deleteGuestbookItem(id) {
  const pwd = prompt('글 작성 시 입력한 비밀번호를 입력해주세요:');
  if (!pwd) return;

  let list = getGuestbookList();
  const target = list.find(item => item.id === id);

  if (!target) return;

  // 기본 더미글이거나 비번 일치시 삭제
  if (!target.pwd || target.pwd === pwd) {
    list = list.filter(item => item.id !== id);
    saveGuestbookList(list);
    renderGuestbook();
    showToast('메시지가 삭제되었습니다.');
  } else {
    alert('비밀번호가 일치하지 않습니다.');
  }
}

// ==========================================
// 7. 감성 파티클 배경 효과 (Canvas API)
// ==========================================
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 28;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: Math.random() * 0.8 + 0.4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.4 + 0.2,
      color: Math.random() > 0.4 ? 'rgba(235, 175, 150,' : 'rgba(255, 220, 180,'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      if (p.y > height) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      if (p.x > width) p.x = 0;
      if (p.x < 0) p.x = width;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = `${p.color} ${p.opacity})`;
      ctx.beginPath();
      // 꽃잎 모양 드로잉
      ctx.ellipse(0, 0, p.size, p.size * 1.5, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}

// ==========================================
// 8. 감성 BGM 신디사이저 (Web Audio API)
// ==========================================
let audioCtx = null;
let isBgmPlaying = false;
let bgmTimer = null;

function toggleBGM() {
  const btn = document.getElementById('bgm-toggle-btn');
  
  if (isBgmPlaying) {
    stopBGM();
    if (btn) btn.classList.remove('playing');
    showToast('배경음악이 정지되었습니다.');
  } else {
    startBGM();
    if (btn) btn.classList.add('playing');
    showToast('잔잔한 추억의 멜로디가 재생됩니다 🎵');
  }
}

function startBGM() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isBgmPlaying = true;
  playReunionChords();
}

function stopBGM() {
  isBgmPlaying = false;
  if (bgmTimer) {
    clearTimeout(bgmTimer);
    bgmTimer = null;
  }
}

// 감성적인 피아노 코드 진행 (C - G/B - Am - F)
function playReunionChords() {
  if (!isBgmPlaying || !audioCtx) return;

  const chords = [
    [261.63, 329.63, 392.00, 523.25], // C Major
    [246.94, 293.66, 392.00, 493.88], // G/B
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [174.61, 220.00, 261.63, 349.23]  // F Major
  ];

  let chordIndex = 0;

  function nextChord() {
    if (!isBgmPlaying) return;

    const chord = chords[chordIndex];
    chord.forEach((freq, idx) => {
      playPianoNote(freq, idx * 0.12, 2.5);
    });

    chordIndex = (chordIndex + 1) % chords.length;
    bgmTimer = setTimeout(nextChord, 2800);
  }

  nextChord();
}

function playPianoNote(frequency, delay, duration) {
  if (!audioCtx || audioCtx.state !== 'running') return;

  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// ==========================================
// 9. 공유 및 유틸리티
// ==========================================
function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || '클립보드에 복사되었습니다.');
    }).catch(() => {
      fallbackCopyText(text, successMsg);
    });
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function fallbackCopyText(text, successMsg) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg || '복사되었습니다.');
  } catch (err) {
    prompt('내용을 복사하세요:', text);
  }
  document.body.removeChild(textArea);
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================
// 10. DOM 로드 완료 후 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 슬라이더 초기화
  initSlider();

  // 카운트다운 초기화
  initCountdown();

  // 지도 초기화
  initMap();

  // 방명록 렌더링
  renderGuestbook();

  // 감성 파티클 배경
  initParticles();

  // BGM 버튼 이벤트
  const bgmBtn = document.getElementById('bgm-toggle-btn');
  if (bgmBtn) {
    bgmBtn.addEventListener('click', toggleBGM);
  }

  // 상단 공유 & 하단 공유 버튼
  const quickShareBtn = document.getElementById('quick-share-btn');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const kakaoBtn = document.getElementById('share-kakao-btn');

  function handleShare() {
    const url = window.location.href;
    const title = '2026 동창회 초대장 - 우리들의 찬란했던 날들';
    const text = '친구야 보고 싶다! 2026년 10월 24일 창경궁에서 만나요.';

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      copyToClipboard(url, '초대장 링크가 복사되었습니다. 친구들에게 전달해보세요!');
    }
  }

  if (quickShareBtn) quickShareBtn.addEventListener('click', handleShare);
  if (copyUrlBtn) copyUrlBtn.addEventListener('click', () => {
    copyToClipboard(window.location.href, '초대장 링크가 복사되었습니다!');
  });
  if (kakaoBtn) kakaoBtn.addEventListener('click', handleShare);

  // 글자수 카운터
  const gbTextarea = document.getElementById('gb-content');
  const gbCharCounter = document.getElementById('gb-char-counter');
  if (gbTextarea && gbCharCounter) {
    gbTextarea.addEventListener('input', () => {
      gbCharCounter.innerText = `${gbTextarea.value.length} / 150`;
    });
  }

  // 키보드 ESC로 라이트박스 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
});
