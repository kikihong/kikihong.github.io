/**
 * RoutinePulse PRO - Complete Workout Sequence Timer Engine
 * Features:
 * - Dynamic Stage Builder with 3 Types (Count Down, Tabata Work/Rest, Count Up)
 * - Named Routine Library (Save/Load/Delete via LocalStorage)
 * - Sporty Neon Visuals & Audio Guidance (Web Audio API)
 * - Mobile / Floor Workout Optimized Display
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_ACTIVE_KEY = 'routinepulse_active_stages_v2';
  const STORAGE_LIBRARY_KEY = 'routinepulse_saved_library_v2';
  const STORAGE_TITLE_KEY = 'routinepulse_active_title_v2';

  // SVG Dial radius is 148, so circumference is 2 * PI * 148
  const CIRCUMFERENCE = 2 * Math.PI * 148; // ~929.91

  // Default Presets Library
  const DEFAULT_LIBRARY_ROUTINES = [
    {
      id: 'lib_tabata_fullbody',
      title: '🔥 4분 정통 타바타 전신',
      createdAt: '2026-10-15',
      stages: [
        { id: 'p1', type: 'tabata', name: '점핑잭', workTime: 20, restTime: 10, rounds: 4 },
        { id: 'p2', type: 'tabata', name: '푸시업', workTime: 20, restTime: 10, rounds: 4 },
        { id: 'p3', type: 'tabata', name: '스쿼트 점프', workTime: 20, restTime: 10, rounds: 4 }
      ]
    },
    {
      id: 'lib_core_master',
      title: '🧘 코어 & 복근 3단계 루틴',
      createdAt: '2026-10-15',
      stages: [
        { id: 'c1', type: 'countdown', name: '엘보우 플랭크', duration: 45, rounds: 3 },
        { id: 'c2', type: 'tabata', name: '마운틴 클라이머', workTime: 30, restTime: 15, rounds: 4 },
        { id: 'c3', type: 'countup', name: '할로우 바디 홀드', duration: 40, rounds: 2 }
      ]
    },
    {
      id: 'lib_hiit_burn',
      title: '⚡ 10분 고강도 HIIT 서킷',
      createdAt: '2026-10-15',
      stages: [
        { id: 'h1', type: 'countdown', name: '하이 니 (무릎 차기)', duration: 40, rounds: 3 },
        { id: 'h2', type: 'tabata', name: '버피 테스트', workTime: 25, restTime: 15, rounds: 5 },
        { id: 'h3', type: 'countup', name: '섀도우 복싱 스프린트', duration: 60, rounds: 2 }
      ]
    },
    {
      id: 'lib_cooldown_stretch',
      title: '🌿 쿨다운 스트레칭',
      createdAt: '2026-10-15',
      stages: [
        { id: 's1', type: 'countdown', name: '햄스트링 & 종아리 스트레칭', duration: 30, rounds: 2 },
        { id: 's2', type: 'countdown', name: '어깨 & 가슴 개방 스트레칭', duration: 30, rounds: 2 },
        { id: 's3', type: 'countdown', name: '차일드 포즈 (아기 자세)', duration: 45, rounds: 2 }
      ]
    }
  ];

  // --- State Variables ---
  let stages = [];
  let currentRoutineTitle = '맞춤형 트레이닝';
  let isRunning = false;
  let isPaused = false;
  let currentStageIndex = 0;
  let currentRound = 1;
  let currentSubPhase = 'work'; // 'work' | 'rest' (used for tabata)
  let currentStepDuration = 0;
  let timeRemaining = 0;
  let timeElapsed = 0;
  let lastBeepSec = null;
  let timerInterval = null;
  let lastTimestamp = null;

  let totalRoutineSeconds = 0;

  // --- DOM Elements ---
  const body = document.body;
  const stageIndicator = document.getElementById('stageIndicator');
  const currentRoutineTitleTag = document.getElementById('currentRoutineTitleTag');
  const totalTimeEstimate = document.getElementById('totalTimeEstimate');
  const totalProgressBar = document.getElementById('totalProgressBar');
  const statusBadge = document.getElementById('statusBadge');
  const typeBadge = document.getElementById('typeBadge');
  const currentExerciseName = document.getElementById('currentExerciseName');
  const dialProgress = document.getElementById('dialProgress');
  const subTimerLabel = document.getElementById('subTimerLabel');
  const timerDigits = document.getElementById('timerDigits');
  const roundIndicator = document.getElementById('roundIndicator');
  const nextExerciseName = document.getElementById('nextExerciseName');
  const nextExerciseMeta = document.getElementById('nextExerciseMeta');
  const stageCountBadge = document.getElementById('stageCountBadge');

  // Control Buttons
  const mainActionBtn = document.getElementById('mainActionBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const mainActionText = document.getElementById('mainActionText');
  const prevBtn = document.getElementById('prevBtn');
  const skipBtn = document.getElementById('skipBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Stage Builder Elements
  const stagesListEl = document.getElementById('stagesList');
  const addStageBtn = document.getElementById('addStageBtn');
  const clearAllStagesBtn = document.getElementById('clearAllStagesBtn');

  // Modals & Popups
  const typeSelectModal = document.getElementById('typeSelectModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Routine Vault Modals
  const openLibraryBtn = document.getElementById('openLibraryBtn');
  const libraryModal = document.getElementById('libraryModal');
  const libraryModalBackdrop = document.getElementById('libraryModalBackdrop');
  const closeLibraryBtn = document.getElementById('closeLibraryBtn');
  const libraryListEl = document.getElementById('libraryList');
  const openSaveFromLibraryBtn = document.getElementById('openSaveFromLibraryBtn');

  const openSaveModalBtn = document.getElementById('openSaveModalBtn');
  const saveRoutineModal = document.getElementById('saveRoutineModal');
  const saveModalBackdrop = document.getElementById('saveModalBackdrop');
  const routineNameInput = document.getElementById('routineNameInput');
  const saveRoutinePreviewSummary = document.getElementById('saveRoutinePreviewSummary');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');

  // Celebration Modal
  const completeModal = document.getElementById('completeModal');
  const summaryStages = document.getElementById('summaryStages');
  const summaryRounds = document.getElementById('summaryRounds');
  const summaryTime = document.getElementById('summaryTime');
  const restartRoutineBtn = document.getElementById('restartRoutineBtn');
  const closeCelebrateBtn = document.getElementById('closeCelebrateBtn');

  // Sound & Fullscreen
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout = null;

  // --- Helper Functions ---
  function generateId() {
    return 'stage_' + Math.random().toString(36).substring(2, 9);
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatDurationKorean(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}초`;
    if (secs === 0) return `${mins}분`;
    return `${mins}분 ${secs}초`;
  }

  function showToast(msg, icon = '✨') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastIcon.textContent = icon;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2800);
  }

  // --- Storage & Library Management ---
  function getLibraryRoutines() {
    try {
      const saved = localStorage.getItem(STORAGE_LIBRARY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load library:', e);
    }
    // Return cloned defaults
    const initial = JSON.parse(JSON.stringify(DEFAULT_LIBRARY_ROUTINES));
    localStorage.setItem(STORAGE_LIBRARY_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveLibraryRoutines(list) {
    try {
      localStorage.setItem(STORAGE_LIBRARY_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save library:', e);
    }
  }

  function loadActiveRoutine() {
    try {
      const savedTitle = localStorage.getItem(STORAGE_TITLE_KEY);
      if (savedTitle) currentRoutineTitle = savedTitle;

      const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          stages = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load active stages:', e);
    }
    // Default fallback
    stages = JSON.parse(JSON.stringify(DEFAULT_LIBRARY_ROUTINES[0].stages));
    currentRoutineTitle = DEFAULT_LIBRARY_ROUTINES[0].title;
  }

  function saveActiveRoutine() {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(stages));
      localStorage.setItem(STORAGE_TITLE_KEY, currentRoutineTitle);
    } catch (e) {
      console.warn('Failed to save active stages:', e);
    }
  }

  // --- Duration Calculations ---
  function calculateTotalRoutineSeconds(stageList = stages) {
    let total = 0;
    stageList.forEach((st) => {
      const rounds = Math.max(1, parseInt(st.rounds, 10) || 1);
      if (st.type === 'tabata') {
        const w = Math.max(1, parseInt(st.workTime, 10) || 20);
        const r = Math.max(0, parseInt(st.restTime, 10) || 10);
        total += (w + r) * rounds;
      } else {
        const d = Math.max(1, parseInt(st.duration, 10) || 30);
        total += d * rounds;
      }
    });
    return total;
  }

  function calculateCompletedRoutineSeconds() {
    let completed = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      const st = stages[i];
      const rounds = Math.max(1, parseInt(st.rounds, 10) || 1);
      if (st.type === 'tabata') {
        const w = Math.max(1, parseInt(st.workTime, 10) || 20);
        const r = Math.max(0, parseInt(st.restTime, 10) || 10);
        completed += (w + r) * rounds;
      } else {
        const d = Math.max(1, parseInt(st.duration, 10) || 30);
        completed += d * rounds;
      }
    }

    if (currentStageIndex < stages.length) {
      const cur = stages[currentStageIndex];
      const completedRounds = currentRound - 1;
      if (cur.type === 'tabata') {
        const w = Math.max(1, parseInt(cur.workTime, 10) || 20);
        const r = Math.max(0, parseInt(cur.restTime, 10) || 10);
        completed += completedRounds * (w + r);
        if (currentSubPhase === 'work') {
          completed += (w - timeRemaining);
        } else {
          completed += w + (r - timeRemaining);
        }
      } else if (cur.type === 'countdown') {
        const d = Math.max(1, parseInt(cur.duration, 10) || 30);
        completed += completedRounds * d + (d - timeRemaining);
      } else if (cur.type === 'countup') {
        completed += completedRounds * (cur.duration || 30) + timeElapsed;
      }
    }

    return Math.max(0, completed);
  }

  // --- Theme & Visual State Updater ---
  function updateThemeAndDisplay() {
    if (stages.length === 0) {
      body.setAttribute('data-state', 'idle');
      currentExerciseName.textContent = '운동 단계를 추가해주세요';
      timerDigits.textContent = '00:00';
      statusBadge.className = 'status-badge status-idle';
      statusBadge.textContent = '단계 없음';
      roundIndicator.textContent = '0 / 0';
      stageIndicator.textContent = 'STAGE 0 / 0';
      nextExerciseName.textContent = '목록이 비어있습니다';
      nextExerciseMeta.textContent = '-';
      currentRoutineTitleTag.textContent = '빈 루틴';
      setDialProgress(0);
      return;
    }

    const currentStage = stages[currentStageIndex] || stages[0];
    const totalStages = stages.length;
    const stageRounds = Math.max(1, parseInt(currentStage.rounds, 10) || 1);

    // Meta titles
    currentRoutineTitleTag.textContent = currentRoutineTitle;
    stageIndicator.textContent = `STAGE ${currentStageIndex + 1} / ${totalStages}`;
    totalRoutineSeconds = calculateTotalRoutineSeconds();
    totalTimeEstimate.textContent = `총 ${formatTime(totalRoutineSeconds)}`;

    // Total sequence progress bar
    const completedSecs = calculateCompletedRoutineSeconds();
    const totalPercent = totalRoutineSeconds > 0 ? Math.min(100, (completedSecs / totalRoutineSeconds) * 100) : 0;
    totalProgressBar.style.width = `${totalPercent.toFixed(1)}%`;

    // Type Badge
    let typeNameText = '카운트다운';
    if (currentStage.type === 'tabata') typeNameText = '타바타 세트';
    if (currentStage.type === 'countup') typeNameText = '랩 타임 (카운트업)';
    typeBadge.textContent = typeNameText;

    // Current Exercise Name & Round
    currentExerciseName.textContent = currentStage.name || '이름 없음';
    roundIndicator.textContent = `${currentRound} / ${stageRounds}`;

    // Color State Switching (Work = Neon Green, Rest = Crimson Red, Paused = Amber, Idle = Slate)
    if (!isRunning && !isPaused) {
      body.setAttribute('data-state', 'idle');
      statusBadge.className = 'status-badge status-idle';
      statusBadge.textContent = '준비 대기';
      subTimerLabel.textContent = '설정 시간';
    } else if (isPaused) {
      body.setAttribute('data-state', 'paused');
      statusBadge.className = 'status-badge status-paused';
      statusBadge.textContent = '⏸ 일시정지';
      subTimerLabel.textContent = '일시 정지됨';
    } else {
      if (currentStage.type === 'tabata' && currentSubPhase === 'rest') {
        body.setAttribute('data-state', 'rest');
        statusBadge.className = 'status-badge status-rest';
        statusBadge.textContent = '☕ REST (휴식 중)';
        subTimerLabel.textContent = '휴식 시간';
      } else {
        body.setAttribute('data-state', 'work');
        statusBadge.className = 'status-badge status-work';
        statusBadge.textContent = '🔥 WORK (운동 중)';
        subTimerLabel.textContent = currentStage.type === 'countup' ? '경과 시간' : '남은 시간';
      }
    }

    // Dial Ring & Digits
    if (currentStage.type === 'countup') {
      timerDigits.textContent = formatTime(timeElapsed);
      const ratio = currentStepDuration > 0 ? Math.min(1, timeElapsed / currentStepDuration) : 0;
      setDialProgress(ratio);
    } else {
      timerDigits.textContent = formatTime(timeRemaining);
      const ratio = currentStepDuration > 0 ? Math.max(0, timeRemaining / currentStepDuration) : 0;
      setDialProgress(ratio);
    }

    updateNextPreview();
    updateStageCardsActiveState();
  }

  function setDialProgress(ratio) {
    const offset = CIRCUMFERENCE * (1 - ratio);
    dialProgress.style.strokeDashoffset = offset;
  }

  function updateNextPreview() {
    if (stages.length === 0) {
      nextExerciseName.textContent = '운동 없음';
      nextExerciseMeta.textContent = '-';
      return;
    }

    const curStage = stages[currentStageIndex];
    const totalRounds = Math.max(1, parseInt(curStage.rounds, 10) || 1);

    if (curStage.type === 'tabata' && currentSubPhase === 'work') {
      const restSec = Math.max(0, parseInt(curStage.restTime, 10) || 10);
      nextExerciseName.textContent = '☕ 휴식 (REST)';
      nextExerciseMeta.textContent = `${restSec}초 쉬는 시간`;
      return;
    }

    if (currentRound < totalRounds) {
      const nextRoundNum = currentRound + 1;
      const stepSec = curStage.type === 'tabata' ? curStage.workTime : curStage.duration;
      nextExerciseName.textContent = `${curStage.name} (라운드 ${nextRoundNum})`;
      nextExerciseMeta.textContent = `${stepSec}초`;
      return;
    }

    if (currentStageIndex + 1 < stages.length) {
      const nextStage = stages[currentStageIndex + 1];
      const sec = nextStage.type === 'tabata' ? nextStage.workTime : nextStage.duration;
      const typeStr = nextStage.type === 'tabata' ? '타바타' : (nextStage.type === 'countup' ? '랩타임' : '카운트다운');
      nextExerciseName.textContent = `[${typeStr}] ${nextStage.name}`;
      nextExerciseMeta.textContent = `${sec}초 · ${nextStage.rounds}라운드`;
      return;
    }

    nextExerciseName.textContent = '🏆 마지막 세트! (완료 임박)';
    nextExerciseMeta.textContent = '루틴 완주가 눈앞입니다!';
  }

  function updateStageCardsActiveState() {
    const cards = stagesListEl.querySelectorAll('.stage-card');
    cards.forEach((card, idx) => {
      if (idx === currentStageIndex) {
        card.classList.add('is-active-stage');
      } else {
        card.classList.remove('is-active-stage');
      }
    });
  }

  // --- Step Setup Logic ---
  function setupCurrentStep() {
    if (stages.length === 0) return;
    const stage = stages[currentStageIndex];

    if (stage.type === 'tabata') {
      if (currentSubPhase === 'work') {
        currentStepDuration = Math.max(1, parseInt(stage.workTime, 10) || 20);
        timeRemaining = currentStepDuration;
      } else {
        currentStepDuration = Math.max(0, parseInt(stage.restTime, 10) || 10);
        timeRemaining = currentStepDuration;
      }
    } else if (stage.type === 'countup') {
      currentStepDuration = Math.max(1, parseInt(stage.duration, 10) || 30);
      timeElapsed = 0;
    } else {
      // Countdown
      currentStepDuration = Math.max(1, parseInt(stage.duration, 10) || 30);
      timeRemaining = currentStepDuration;
    }

    lastBeepSec = null;
    updateThemeAndDisplay();
  }

  // --- Sequence Transition Engine ---
  function advanceToNextStep() {
    if (stages.length === 0) return;
    const curStage = stages[currentStageIndex];
    const totalRounds = Math.max(1, parseInt(curStage.rounds, 10) || 1);

    if (curStage.type === 'tabata') {
      if (currentSubPhase === 'work') {
        const restSec = Math.max(0, parseInt(curStage.restTime, 10) || 0);
        if (restSec > 0) {
          currentSubPhase = 'rest';
          setupCurrentStep();
          return;
        }
      }
      currentSubPhase = 'work';
    }

    if (currentRound < totalRounds) {
      currentRound++;
      setupCurrentStep();
      return;
    }

    if (currentStageIndex + 1 < stages.length) {
      currentStageIndex++;
      currentRound = 1;
      currentSubPhase = 'work';
      setupCurrentStep();
      return;
    }

    finishRoutine();
  }

  function advanceToPreviousStep() {
    if (stages.length === 0) return;

    if (currentRound > 1) {
      currentRound--;
      currentSubPhase = 'work';
      setupCurrentStep();
      return;
    }

    if (currentStageIndex > 0) {
      currentStageIndex--;
      const prevStage = stages[currentStageIndex];
      currentRound = Math.max(1, parseInt(prevStage.rounds, 10) || 1);
      currentSubPhase = 'work';
      setupCurrentStep();
      return;
    }

    currentRound = 1;
    currentSubPhase = 'work';
    setupCurrentStep();
  }

  function finishRoutine() {
    stopTimer();
    body.setAttribute('data-state', 'finished');
    statusBadge.className = 'status-badge status-finished';
    statusBadge.textContent = '🎉 루틴 완주!';
    setDialProgress(1);
    timerDigits.textContent = '00:00';

    if (window.soundEngine) {
      window.soundEngine.playFanfare();
    }

    let totalRoundsSum = 0;
    stages.forEach((st) => {
      totalRoundsSum += Math.max(1, parseInt(st.rounds, 10) || 1);
    });

    summaryStages.textContent = `${stages.length}개`;
    summaryRounds.textContent = `${totalRoundsSum}회`;
    summaryTime.textContent = formatDurationKorean(calculateTotalRoutineSeconds());

    completeModal.classList.remove('hidden');
  }

  // --- Timer Loop with Date.now() Precision ---
  function startTimer() {
    if (stages.length === 0) return;

    if (window.soundEngine) {
      window.soundEngine.init();
    }

    isRunning = true;
    isPaused = false;
    updateActionButtons();
    lastTimestamp = Date.now();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      const curStage = stages[currentStageIndex];
      if (!curStage) return;

      if (curStage.type === 'countup') {
        timeElapsed += deltaSec;
        const targetSec = currentStepDuration;
        const secToFinish = Math.max(0, Math.ceil(targetSec - timeElapsed));

        if (secToFinish <= 3 && secToFinish >= 1 && secToFinish !== lastBeepSec) {
          lastBeepSec = secToFinish;
          if (window.soundEngine) window.soundEngine.playWarningBeep();
        }

        if (timeElapsed >= targetSec) {
          if (window.soundEngine) window.soundEngine.playTransitionBeep();
          advanceToNextStep();
        } else {
          updateThemeAndDisplay();
        }
      } else {
        timeRemaining -= deltaSec;
        const secLeft = Math.ceil(timeRemaining);

        if (secLeft <= 3 && secLeft >= 1 && secLeft !== lastBeepSec) {
          lastBeepSec = secLeft;
          if (window.soundEngine) window.soundEngine.playWarningBeep();
        }

        if (timeRemaining <= 0) {
          timeRemaining = 0;
          if (window.soundEngine) window.soundEngine.playTransitionBeep();
          advanceToNextStep();
        } else {
          updateThemeAndDisplay();
        }
      }
    }, 50);

    updateThemeAndDisplay();
  }

  function pauseTimer() {
    isRunning = false;
    isPaused = true;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateActionButtons();
    updateThemeAndDisplay();
  }

  function stopTimer() {
    isRunning = false;
    isPaused = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateActionButtons();
  }

  function resetRoutine() {
    stopTimer();
    currentStageIndex = 0;
    currentRound = 1;
    currentSubPhase = 'work';
    setupCurrentStep();
    updateThemeAndDisplay();
  }

  function togglePlayPause() {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function updateActionButtons() {
    if (isRunning) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      mainActionText.textContent = '일시정지';
      mainActionBtn.title = '일시정지 (Space)';
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      mainActionText.textContent = isPaused ? '재개' : '시작';
      mainActionBtn.title = isPaused ? '재개 (Space)' : '시작 (Space)';
    }
  }

  // --- Stage Builder List Rendering ---
  function renderStagesList() {
    stagesListEl.innerHTML = '';
    stageCountBadge.textContent = `${stages.length}개 단계`;

    if (stages.length === 0) {
      stagesListEl.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📋</div>
          <p style="font-weight: 700; margin-bottom: 6px;">등록된 운동 단계가 없습니다.</p>
          <p style="font-size: 0.85rem;">상단의 '+ 단계 추가'를 눌러 나만의 루틴을 만들어보세요.</p>
        </div>
      `;
      updateThemeAndDisplay();
      return;
    }

    stages.forEach((stage, idx) => {
      const card = document.createElement('div');
      card.className = `stage-card ${idx === currentStageIndex ? 'is-active-stage' : ''}`;
      card.dataset.id = stage.id;

      let typeTagClass = 'tag-countdown';
      let typeLabel = '카운트다운';
      if (stage.type === 'tabata') {
        typeTagClass = 'tag-tabata';
        typeLabel = '타바타';
      } else if (stage.type === 'countup') {
        typeTagClass = 'tag-countup';
        typeLabel = '랩타임';
      }

      let inputsHtml = '';
      if (stage.type === 'tabata') {
        inputsHtml = `
          <div class="stage-inputs-row is-tabata">
            <div class="input-field">
              <label class="input-label">운동 이름</label>
              <input type="text" class="input-control stage-name-input" value="${escapeHtml(stage.name)}" placeholder="예: 버피 테스트">
            </div>
            <div class="input-field">
              <label class="input-label">운동(초)</label>
              <input type="number" min="1" max="999" class="input-control number stage-work-input" value="${stage.workTime || 20}">
            </div>
            <div class="input-field">
              <label class="input-label">휴식(초)</label>
              <input type="number" min="0" max="999" class="input-control number stage-rest-input" value="${stage.restTime || 10}">
            </div>
            <div class="input-field">
              <label class="input-label">세트</label>
              <input type="number" min="1" max="99" class="input-control number stage-rounds-input" value="${stage.rounds || 4}">
            </div>
          </div>
        `;
      } else {
        const timeLabel = stage.type === 'countup' ? '목표 시간(초)' : '운동 시간(초)';
        inputsHtml = `
          <div class="stage-inputs-row">
            <div class="input-field">
              <label class="input-label">운동 이름</label>
              <input type="text" class="input-control stage-name-input" value="${escapeHtml(stage.name)}" placeholder="예: 플랭크">
            </div>
            <div class="input-field">
              <label class="input-label">${timeLabel}</label>
              <input type="number" min="1" max="999" class="input-control number stage-duration-input" value="${stage.duration || 30}">
            </div>
            <div class="input-field">
              <label class="input-label">라운드</label>
              <input type="number" min="1" max="99" class="input-control number stage-rounds-input" value="${stage.rounds || 1}">
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="stage-card-header">
          <div class="stage-card-title-group">
            <span class="stage-number-badge">${idx + 1}</span>
            <span class="stage-type-tag ${typeTagClass}">${typeLabel}</span>
          </div>
          <div class="stage-actions-group">
            <button class="btn-icon-xs move-up-btn" title="위로 이동" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button class="btn-icon-xs move-down-btn" title="아래로 이동" ${idx === stages.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <button class="btn-icon-xs duplicate-btn" title="단계 복제">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button class="btn-icon-xs delete delete-btn" title="삭제">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        ${inputsHtml}
      `;

      // Inputs Listeners
      const nameInput = card.querySelector('.stage-name-input');
      const roundsInput = card.querySelector('.stage-rounds-input');

      nameInput.addEventListener('input', (e) => {
        stage.name = e.target.value.trim() || '운동';
        saveActiveRoutine();
        updateThemeAndDisplay();
      });

      roundsInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        stage.rounds = isNaN(val) || val < 1 ? 1 : val;
        e.target.value = stage.rounds;
        saveActiveRoutine();
        updateThemeAndDisplay();
      });

      if (stage.type === 'tabata') {
        const workInput = card.querySelector('.stage-work-input');
        const restInput = card.querySelector('.stage-rest-input');

        workInput.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10);
          stage.workTime = isNaN(val) || val < 1 ? 20 : val;
          e.target.value = stage.workTime;
          saveActiveRoutine();
          if (!isRunning) setupCurrentStep();
          updateThemeAndDisplay();
        });

        restInput.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10);
          stage.restTime = isNaN(val) || val < 0 ? 10 : val;
          e.target.value = stage.restTime;
          saveActiveRoutine();
          if (!isRunning) setupCurrentStep();
          updateThemeAndDisplay();
        });
      } else {
        const durationInput = card.querySelector('.stage-duration-input');
        durationInput.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10);
          stage.duration = isNaN(val) || val < 1 ? 30 : val;
          e.target.value = stage.duration;
          saveActiveRoutine();
          if (!isRunning) setupCurrentStep();
          updateThemeAndDisplay();
        });
      }

      // Actions
      card.querySelector('.move-up-btn').addEventListener('click', () => {
        if (idx > 0) {
          const temp = stages[idx];
          stages[idx] = stages[idx - 1];
          stages[idx - 1] = temp;
          saveActiveRoutine();
          renderStagesList();
          if (!isRunning) setupCurrentStep();
        }
      });

      card.querySelector('.move-down-btn').addEventListener('click', () => {
        if (idx < stages.length - 1) {
          const temp = stages[idx];
          stages[idx] = stages[idx + 1];
          stages[idx + 1] = temp;
          saveActiveRoutine();
          renderStagesList();
          if (!isRunning) setupCurrentStep();
        }
      });

      card.querySelector('.duplicate-btn').addEventListener('click', () => {
        const clone = JSON.parse(JSON.stringify(stage));
        clone.id = generateId();
        clone.name = `${stage.name} (복사본)`;
        stages.splice(idx + 1, 0, clone);
        saveActiveRoutine();
        renderStagesList();
        if (!isRunning) setupCurrentStep();
      });

      card.querySelector('.delete-btn').addEventListener('click', () => {
        if (stages.length <= 1) {
          alert('최소 1개 이상의 운동 단계가 유지되어야 합니다.');
          return;
        }
        stages.splice(idx, 1);
        if (currentStageIndex >= stages.length) {
          currentStageIndex = Math.max(0, stages.length - 1);
        }
        saveActiveRoutine();
        renderStagesList();
        if (!isRunning) setupCurrentStep();
      });

      stagesListEl.appendChild(card);
    });

    updateThemeAndDisplay();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
  }

  // --- Add Stage Modal Handlers ---
  function openTypeModal() {
    typeSelectModal.classList.remove('hidden');
  }

  function closeTypeModal() {
    typeSelectModal.classList.add('hidden');
  }

  function addNewStage(type) {
    let newStage = null;
    const count = stages.length + 1;

    if (type === 'tabata') {
      newStage = {
        id: generateId(),
        type: 'tabata',
        name: `타바타 세트 ${count}`,
        workTime: 20,
        restTime: 10,
        rounds: 4
      };
    } else if (type === 'countup') {
      newStage = {
        id: generateId(),
        type: 'countup',
        name: `랩 타임 측정 ${count}`,
        duration: 60,
        rounds: 1
      };
    } else {
      newStage = {
        id: generateId(),
        type: 'countdown',
        name: `카운트다운 운동 ${count}`,
        duration: 30,
        rounds: 2
      };
    }

    stages.push(newStage);
    saveActiveRoutine();
    renderStagesList();
    closeTypeModal();

    if (!isRunning) setupCurrentStep();

    setTimeout(() => {
      stagesListEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  // --- Named Routine Vault: Save Routine Modal ---
  function openSaveRoutineModal() {
    const totalSecs = calculateTotalRoutineSeconds();
    saveRoutinePreviewSummary.textContent = `${stages.length}개 단계 · 총 소요시간 ${formatTime(totalSecs)}`;
    routineNameInput.value = currentRoutineTitle.startsWith('맞춤형') 
      ? `내 커스텀 루틴 #${new Date().toLocaleDateString('ko-KR')}`
      : currentRoutineTitle;
    saveRoutineModal.classList.remove('hidden');
    setTimeout(() => routineNameInput.focus(), 100);
  }

  function closeSaveRoutineModal() {
    saveRoutineModal.classList.add('hidden');
  }

  function handleSaveRoutineConfirm() {
    const name = routineNameInput.value.trim() || '이름 없는 루틴';
    const library = getLibraryRoutines();

    const newRoutineEntry = {
      id: 'routine_' + Date.now(),
      title: name,
      createdAt: new Date().toLocaleDateString('ko-KR'),
      stages: JSON.parse(JSON.stringify(stages))
    };

    // Prepend to top
    library.unshift(newRoutineEntry);
    saveLibraryRoutines(library);

    currentRoutineTitle = name;
    saveActiveRoutine();
    updateThemeAndDisplay();
    closeSaveRoutineModal();

    showToast(`'${name}' 루틴이 보관함에 저장되었습니다!`, '💾');
  }

  // --- Named Routine Vault: Library Modal ---
  function openRoutineLibraryModal() {
    renderLibraryList();
    libraryModal.classList.remove('hidden');
  }

  function closeRoutineLibraryModal() {
    libraryModal.classList.add('hidden');
  }

  function renderLibraryList() {
    const library = getLibraryRoutines();
    libraryListEl.innerHTML = '';

    if (library.length === 0) {
      libraryListEl.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
          보관함이 비어있습니다. 현재 루틴을 저장해보세요!
        </div>
      `;
      return;
    }

    library.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'library-item-card';

      const totalSec = calculateTotalRoutineSeconds(item.stages);
      const isCurrent = (item.title === currentRoutineTitle);

      card.innerHTML = `
        <div class="library-item-info">
          <div class="library-item-title">${escapeHtml(item.title)} ${isCurrent ? '<span style="color:#00ff87; font-size:0.75rem;">(현재 적용됨)</span>' : ''}</div>
          <div class="library-item-meta">
            <span>${item.stages.length}개 단계</span>
            <span>•</span>
            <span>${formatTime(totalSec)}</span>
            <span>•</span>
            <span>${item.createdAt || '최근'}</span>
          </div>
        </div>
        <div class="library-item-actions">
          <button class="btn btn-sport-neon btn-xs load-btn">불러오기</button>
          <button class="btn-icon-xs delete delete-lib-btn" title="삭제">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      // Load action
      card.querySelector('.load-btn').addEventListener('click', () => {
        stages = JSON.parse(JSON.stringify(item.stages));
        currentRoutineTitle = item.title;
        saveActiveRoutine();
        resetRoutine();
        renderStagesList();
        closeRoutineLibraryModal();
        showToast(`'${item.title}' 루틴을 불러왔습니다!`, '📂');
      });

      // Delete action
      card.querySelector('.delete-lib-btn').addEventListener('click', () => {
        if (confirm(`'${item.title}' 루틴을 보관함에서 삭제하시겠습니까?`)) {
          const updated = library.filter((r) => r.id !== item.id);
          saveLibraryRoutines(updated);
          renderLibraryList();
          showToast(`루틴이 삭제되었습니다.`, '🗑️');
        }
      });

      libraryListEl.appendChild(card);
    });
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    // Controls
    mainActionBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      advanceToPreviousStep();
    });
    skipBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      advanceToNextStep();
    });
    resetBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      resetRoutine();
    });

    // Add Stage Modal
    addStageBtn.addEventListener('click', openTypeModal);
    closeModalBtn.addEventListener('click', closeTypeModal);
    modalBackdrop.addEventListener('click', closeTypeModal);

    document.querySelectorAll('.type-select-card').forEach((card) => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        addNewStage(type);
      });
    });

    // Save Routine Modal
    openSaveModalBtn.addEventListener('click', openSaveRoutineModal);
    cancelSaveBtn.addEventListener('click', closeSaveRoutineModal);
    saveModalBackdrop.addEventListener('click', closeSaveRoutineModal);
    confirmSaveBtn.addEventListener('click', handleSaveRoutineConfirm);
    routineNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSaveRoutineConfirm();
    });

    // Routine Library Modal
    openLibraryBtn.addEventListener('click', openRoutineLibraryModal);
    closeLibraryBtn.addEventListener('click', closeRoutineLibraryModal);
    libraryModalBackdrop.addEventListener('click', closeRoutineLibraryModal);
    openSaveFromLibraryBtn.addEventListener('click', () => {
      closeRoutineLibraryModal();
      openSaveRoutineModal();
    });

    // Quick Presets Bar Chips
    document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.preset;
        const library = getLibraryRoutines();
        const found = library.find((r) => r.id.includes(key));
        if (found) {
          stages = JSON.parse(JSON.stringify(found.stages));
          currentRoutineTitle = found.title;
          saveActiveRoutine();
          resetRoutine();
          renderStagesList();
          showToast(`'${found.title}' 프리셋을 불러왔습니다!`, '⚡');
        }
      });
    });

    // Clear All Stages
    clearAllStagesBtn.addEventListener('click', () => {
      if (confirm('현재 작업 영역의 모든 단계를 비우고 1개의 기본 카운트다운 단계로 초기화하시겠습니까?')) {
        stages = [
          { id: generateId(), type: 'countdown', name: '자유 운동', duration: 30, rounds: 1 }
        ];
        currentRoutineTitle = '새로운 루틴';
        saveActiveRoutine();
        resetRoutine();
        renderStagesList();
      }
    });

    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        const isMuted = window.soundEngine.toggleMute();
        if (isMuted) {
          soundOnIcon.classList.add('hidden');
          soundOffIcon.classList.remove('hidden');
          soundToggleBtn.classList.add('btn-secondary');
          showToast('사운드 가이드가 음소거되었습니다.', '🔇');
        } else {
          soundOnIcon.classList.remove('hidden');
          soundOffIcon.classList.add('hidden');
          soundToggleBtn.classList.remove('btn-secondary');
          window.soundEngine.playClick();
          showToast('사운드 가이드가 켜졌습니다.', '🔊');
        }
      }
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    });

    // Celebration Modal
    restartRoutineBtn.addEventListener('click', () => {
      completeModal.classList.add('hidden');
      resetRoutine();
      startTimer();
    });

    closeCelebrateBtn.addEventListener('click', () => {
      completeModal.classList.add('hidden');
      resetRoutine();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'r' || e.key === 'R') {
        resetRoutine();
      } else if (e.key === 'm' || e.key === 'M') {
        soundToggleBtn.click();
      } else if (e.key === 's' || e.key === 'S') {
        openSaveRoutineModal();
      }
    });
  }

  // --- Initializer ---
  function init() {
    loadActiveRoutine();
    renderStagesList();
    setupCurrentStep();
    initEventListeners();
    updateThemeAndDisplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
