/**
 * Sylvan Calc - Main Application Controller
 * UI 인터랙션, 탭 관리, 키패드 렌더링, 키보드 이벤트, 툴킷 연동
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 코어 인스턴스 초기화
    const calc = new SmartCalculator();
    const toolkit = window.smartToolkit;
    const historyMgr = window.historyManager;
    const audio = window.forestAudio;
    const particles = new ForestParticles('forest-canvas');

    // UI 상태
    let currentTheme = 'morning'; // morning | twilight | midnight
    let isSciMode = false;

    // =========================================================================
    // 1. 테마 관리 (Morning / Twilight / Midnight)
    // =========================================================================
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    const themes = [
        { id: 'morning', name: '아침 숲', icon: '☀️' },
        { id: 'twilight', name: '노을빛 숲', icon: '🌅' },
        { id: 'midnight', name: '밤하늘 숲', icon: '🌌' }
    ];

    btnThemeToggle.addEventListener('click', () => {
        const curIdx = themes.findIndex(t => t.id === currentTheme);
        const nextTheme = themes[(curIdx + 1) % themes.length];
        setTheme(nextTheme.id);
        audio.playKeySound('action', 'theme');
    });

    function setTheme(themeId) {
        currentTheme = themeId;
        document.body.setAttribute('data-theme', themeId);
        const cur = themes.find(t => t.id === themeId);
        if (cur) {
            themeIcon.textContent = cur.icon;
            themeText.textContent = cur.name;
        }
        particles.setTheme(themeId);
        showToast(`🌿 테마가 [${cur.name}]으로 변경되었습니다.`);
    }

    // =========================================================================
    // 2. 사운드 및 앰비언스 제어
    // =========================================================================
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnAmbienceToggle = document.getElementById('btn-ambience-toggle');
    const ambienceText = document.getElementById('ambience-text');

    let soundActive = true;
    btnSoundToggle.addEventListener('click', () => {
        soundActive = !soundActive;
        audio.setSoundEnabled(soundActive);
        btnSoundToggle.classList.toggle('active', soundActive);
        showToast(soundActive ? '🔊 타건 효과음이 켜졌습니다.' : '🔇 타건 효과음이 꺼졌습니다.');
    });

    btnAmbienceToggle.addEventListener('click', () => {
        const isPlaying = audio.toggleAmbience();
        btnAmbienceToggle.classList.toggle('active', isPlaying);
        ambienceText.textContent = isPlaying ? '자연음 재생 중' : '자연의 소리';
        showToast(isPlaying ? '🍃 숲속 앰비언스 사운드가 재생됩니다.' : '🍃 숲속 앰비언스 사운드가 정지되었습니다.');
    });

    // =========================================================================
    // 3. 내비게이션 탭 전환
    // =========================================================================
    const navTabs = document.querySelectorAll('.nav-tab');
    const calcViews = document.querySelectorAll('.calc-view');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetViewId = tab.dataset.view;
            
            navTabs.forEach(t => t.classList.remove('active'));
            calcViews.forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            const targetView = document.getElementById(targetViewId);
            if (targetView) targetView.classList.add('active');

            audio.playKeySound('action', 'tab');
        });
    });

    // =========================================================================
    // 4. 계산기 키패드 렌더링 및 인터랙션
    // =========================================================================
    const keypadContainer = document.getElementById('keypad');
    const exprDisplay = document.getElementById('calc-expression');
    const prevDisplay = document.getElementById('calc-preview');
    const resultDisplay = document.getElementById('calc-result');
    const badgeAngle = document.getElementById('badge-angle');
    const badgeMemory = document.getElementById('badge-memory');
    const btnModeBasic = document.getElementById('btn-mode-basic');
    const btnModeSci = document.getElementById('btn-mode-sci');
    const btnToggleRad = document.getElementById('btn-toggle-rad');

    // 키패드 레이아웃 정의
    const basicKeypad = [
        { label: 'C', type: 'clear', action: 'c' },
        { label: 'AC', type: 'clear', action: 'ac' },
        { label: '⌫', type: 'action', action: 'backspace' },
        { label: '÷', type: 'op', value: '÷' },
        
        { label: '7', type: 'num', value: '7' },
        { label: '8', type: 'num', value: '8' },
        { label: '9', type: 'num', value: '9' },
        { label: '×', type: 'op', value: '×' },
        
        { label: '4', type: 'num', value: '4' },
        { label: '5', type: 'num', value: '5' },
        { label: '6', type: 'num', value: '6' },
        { label: '−', type: 'op', value: '−' },
        
        { label: '1', type: 'num', value: '1' },
        { label: '2', type: 'num', value: '2' },
        { label: '3', type: 'num', value: '3' },
        { label: '+', type: 'op', value: '+' },
        
        { label: '±', type: 'fn', action: 'negate' },
        { label: '0', type: 'num', value: '0' },
        { label: '.', type: 'num', value: '.' },
        { label: '=', type: 'equals', action: 'calc' }
    ];

    const scientificKeypad = [
        { label: '(', type: 'fn', action: 'paren_open' },
        { label: ')', type: 'fn', action: 'paren_close' },
        { label: 'x²', type: 'fn', action: 'sq' },
        { label: 'AC', type: 'clear', action: 'ac' },
        { label: '⌫', type: 'action', action: 'backspace' },

        { label: 'sin', type: 'fn', action: 'sin' },
        { label: 'cos', type: 'fn', action: 'cos' },
        { label: 'tan', type: 'fn', action: 'tan' },
        { label: '%', type: 'fn', action: 'percent' },
        { label: '÷', type: 'op', value: '÷' },

        { label: 'ln', type: 'fn', action: 'ln' },
        { label: 'log', type: 'fn', action: 'log' },
        { label: '7', type: 'num', value: '7' },
        { label: '8', type: 'num', value: '8' },
        { label: '9', type: 'num', value: '9' },
        
        { label: '√', type: 'fn', action: 'sqrt' },
        { label: 'xʸ', type: 'op', value: '^' },
        { label: '4', type: 'num', value: '4' },
        { label: '5', type: 'num', value: '5' },
        { label: '6', type: 'num', value: '6' },

        { label: 'π', type: 'fn', action: 'pi' },
        { label: 'e', type: 'fn', action: 'e' },
        { label: '1', type: 'num', value: '1' },
        { label: '2', type: 'num', value: '2' },
        { label: '3', type: 'num', value: '3' },

        { label: 'n!', type: 'fn', action: 'fact' },
        { label: '1/x', type: 'fn', action: 'recip' },
        { label: '±', type: 'fn', action: 'negate' },
        { label: '0', type: 'num', value: '0' },
        { label: '.', type: 'num', value: '.' },

        { label: '×', type: 'op', value: '×' },
        { label: '−', type: 'op', value: '−' },
        { label: '+', type: 'op', value: '+' },
        { label: '00', type: 'num', value: '00' },
        { label: '=', type: 'equals', action: 'calc' }
    ];

    function renderKeypad() {
        keypadContainer.innerHTML = '';
        const keys = isSciMode ? scientificKeypad : basicKeypad;
        keypadContainer.className = isSciMode ? 'keypad-container scientific' : 'keypad-container';

        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.className = `calc-btn ${k.type}-btn`;
            btn.innerHTML = k.label;
            btn.dataset.type = k.type;
            if (k.value) btn.dataset.val = k.value;
            if (k.action) btn.dataset.act = k.action;

            btn.addEventListener('click', () => handleKeyClick(k, btn));
            keypadContainer.appendChild(btn);
        });
    }

    // 버튼 클릭 처리
    function handleKeyClick(key, btnElem) {
        if (btnElem) {
            btnElem.classList.add('pressed');
            setTimeout(() => btnElem.classList.remove('pressed'), 120);
        }

        audio.playKeySound(key.type, key.value || key.action);

        let state;
        if (key.type === 'num') {
            state = calc.inputDigit(key.value);
        } else if (key.type === 'op') {
            state = calc.inputOperator(key.value);
        } else if (key.type === 'clear') {
            if (key.action === 'ac') state = calc.clearAll();
            else state = calc.clearEntry();
        } else if (key.type === 'action') {
            if (key.action === 'backspace') state = calc.backspace();
        } else if (key.type === 'equals') {
            const res = calc.calculate();
            state = res;
            if (res.success && res.historyItem) {
                historyMgr.addItem(res.historyItem.expression, res.historyItem.result);
                renderHistory();
            }
        } else if (key.type === 'fn') {
            if (key.action === 'paren_open') state = calc.inputParenthesis('(');
            else if (key.action === 'paren_close') state = calc.inputParenthesis(')');
            else if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(key.action)) state = calc.inputFunction(key.action);
            else if (['pi', 'e'].includes(key.action)) state = calc.inputConstant(key.action === 'pi' ? 'π' : 'e');
            else if (['sq', 'cube', 'recip', 'fact', 'percent', 'negate'].includes(key.action)) state = calc.inputUnary(key.action);
        }

        updateDisplay(state);
    }

    function updateDisplay(state) {
        if (!state) state = calc.getState();

        exprDisplay.textContent = state.expression;
        prevDisplay.textContent = state.previewValue ? `≈ ${state.previewValue}` : '';
        resultDisplay.textContent = state.currentValue;

        badgeAngle.textContent = state.isRadian ? 'RAD' : 'DEG';
        badgeMemory.style.display = state.hasMemory ? 'inline-block' : 'none';
    }

    // 모드 토글 (기본 vs 공학용)
    btnModeBasic.addEventListener('click', () => {
        isSciMode = false;
        btnModeBasic.classList.add('active');
        btnModeSci.classList.remove('active');
        renderKeypad();
        audio.playKeySound('action', 'mode');
    });

    btnModeSci.addEventListener('click', () => {
        isSciMode = true;
        btnModeSci.classList.add('active');
        btnModeBasic.classList.remove('active');
        renderKeypad();
        audio.playKeySound('action', 'mode');
    });

    // Radian / Degree 토글
    btnToggleRad.addEventListener('click', () => {
        const state = calc.toggleAngleMode();
        updateDisplay(state);
        audio.playKeySound('action', 'rad');
        showToast(state.isRadian ? '📐 라디안(RAD) 모드로 변경되었습니다.' : '📐 도(DEG) 모드로 변경되었습니다.');
    });

    // 메모리 버튼들 (MC, MR, M+, M-)
    document.getElementById('btn-mem-mc').addEventListener('click', () => {
        const s = calc.memoryAction('mc');
        updateDisplay(s);
        audio.playKeySound('action', 'mc');
        showToast('메모리가 초기화되었습니다 (MC)');
    });
    document.getElementById('btn-mem-mr').addEventListener('click', () => {
        const s = calc.memoryAction('mr');
        updateDisplay(s);
        audio.playKeySound('action', 'mr');
    });
    document.getElementById('btn-mem-mplus').addEventListener('click', () => {
        const s = calc.memoryAction('m+');
        updateDisplay(s);
        audio.playKeySound('action', 'm+');
        showToast('현재 값이 메모리에 추가되었습니다 (M+)');
    });
    document.getElementById('btn-mem-mminus').addEventListener('click', () => {
        const s = calc.memoryAction('m-');
        updateDisplay(s);
        audio.playKeySound('action', 'm-');
        showToast('현재 값이 메모리에서 차감되었습니다 (M-)');
    });

    // 결과값 클립보드 복사
    document.getElementById('btn-copy-calc').addEventListener('click', () => {
        const textToCopy = resultDisplay.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(`📋 계산 결과 [${textToCopy}] 복사 완료!`);
        });
    });

    // =========================================================================
    // 5. 물리 키보드 단축키 지원
    // =========================================================================
    window.addEventListener('keydown', (e) => {
        // 활성화된 뷰가 표준 계산기가 아닐 때 또는 입력 폼(input) 포커스 시 계산기 단축키 무시
        const activeTab = document.querySelector('.nav-tab.active');
        const isStandardView = activeTab && activeTab.dataset.view === 'view-standard';
        const isInputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);

        if (!isStandardView || isInputFocused) return;

        const key = e.key;
        let matchedKey = null;

        if (/^[0-9]$/.test(key)) {
            matchedKey = { type: 'num', value: key };
        } else if (key === '.') {
            matchedKey = { type: 'num', value: '.' };
        } else if (key === '+') {
            matchedKey = { type: 'op', value: '+' };
        } else if (key === '-') {
            matchedKey = { type: 'op', value: '−' };
        } else if (key === '*' || key === 'x' || key === 'X') {
            matchedKey = { type: 'op', value: '×' };
        } else if (key === '/') {
            e.preventDefault();
            matchedKey = { type: 'op', value: '÷' };
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            matchedKey = { type: 'equals', action: 'calc' };
        } else if (key === 'Backspace') {
            matchedKey = { type: 'action', action: 'backspace' };
        } else if (key === 'Escape') {
            matchedKey = { type: 'clear', action: 'ac' };
        } else if (key === '(') {
            matchedKey = { type: 'fn', action: 'paren_open' };
        } else if (key === ')') {
            matchedKey = { type: 'fn', action: 'paren_close' };
        } else if (key === '%') {
            matchedKey = { type: 'fn', action: 'percent' };
        } else if (key === '^') {
            matchedKey = { type: 'op', value: '^' };
        }

        if (matchedKey) {
            handleKeyClick(matchedKey);
        }
    });

    // =========================================================================
    // 6. 히스토리 렌더링 및 관리
    // =========================================================================
    const historyList = document.getElementById('history-list');

    function renderHistory() {
        const items = historyMgr.items;
        if (items.length === 0) {
            historyList.innerHTML = '<div class="history-empty">기록된 계산이 없습니다.<br>수식을 계산하면 자동으로 저장됩니다.</div>';
            return;
        }

        historyList.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item ${item.isPinned ? 'pinned' : ''}`;
            
            div.innerHTML = `
                <div class="history-item-top">
                    <span>${item.isPinned ? '⭐ ' : ''}${item.formattedTime}</span>
                </div>
                <div class="history-item-expr">${escapeHtml(item.expression)}</div>
                <div class="history-item-res">= ${escapeHtml(item.result)}</div>
                ${item.memo ? `<div class="history-item-memo">${escapeHtml(item.memo)}</div>` : ''}
                <div class="history-item-ctrls">
                    <button class="item-icon-btn btn-pin" title="상단 고정/해제">${item.isPinned ? '★' : '☆'}</button>
                    <button class="item-icon-btn btn-memo" title="메모 추가/수정">✏️</button>
                    <button class="item-icon-btn btn-del" title="삭제">&times;</button>
                </div>
            `;

            // 클릭 시 수식 불러오기
            div.addEventListener('click', (e) => {
                if (e.target.closest('.item-icon-btn')) return;
                calc.expression = item.expression;
                calc.currentValue = item.result;
                calc.isEvaluated = true;
                updateDisplay();
                audio.playKeySound('action', 'recall');
                showToast(`수식 [${item.expression}] 불러옴`);
            });

            // 핀 토글
            div.querySelector('.btn-pin').addEventListener('click', (e) => {
                e.stopPropagation();
                historyMgr.togglePin(item.id);
                renderHistory();
            });

            // 메모 작성
            div.querySelector('.btn-memo').addEventListener('click', (e) => {
                e.stopPropagation();
                const newMemo = prompt('이 계산 기록에 남길 메모를 입력하세요:', item.memo || '');
                if (newMemo !== null) {
                    historyMgr.updateMemo(item.id, newMemo.trim());
                    renderHistory();
                }
            });

            // 삭제
            div.querySelector('.btn-del').addEventListener('click', (e) => {
                e.stopPropagation();
                historyMgr.deleteItem(item.id);
                renderHistory();
            });

            historyList.appendChild(div);
        });
    }

    document.getElementById('btn-copy-history').addEventListener('click', () => {
        const text = historyMgr.exportToText();
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 전체 계산 기록이 텍스트로 복사되었습니다.');
        });
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const csv = historyMgr.exportToCSV();
        if (!csv) {
            showToast('내보낼 기록이 없습니다.');
            return;
        }
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sylvan_calc_history_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📥 CSV 파일로 내보냈습니다.');
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
        if (confirm('고정되지 않은 계산 기록을 모두 지우시겠습니까?')) {
            historyMgr.clearAll();
            renderHistory();
            showToast('기록이 정리되었습니다.');
        }
    });

    // =========================================================================
    // 7. 스마트 툴킷 1: 더치페이 & 팁 계산기
    // =========================================================================
    const splitTotal = document.getElementById('split-total');
    const splitPeople = document.getElementById('split-people');
    const splitPeopleMinus = document.getElementById('split-people-minus');
    const splitPeoplePlus = document.getElementById('split-people-plus');
    const splitTipPills = document.querySelectorAll('#split-tip-pills .pill-btn');
    const splitRoundPills = document.querySelectorAll('#split-round-pills .pill-btn');
    const btnCopySplit = document.getElementById('btn-copy-split');

    let splitTipVal = 0;
    let splitRoundVal = 100;

    function updateSplitBill() {
        const res = toolkit.calculateSplitBill({
            totalAmount: splitTotal.value,
            peopleCount: splitPeople.value,
            tipPercent: splitTipVal,
            roundUnit: splitRoundVal
        });

        document.getElementById('split-res-per-person').textContent = res.formattedPerPerson;
        document.getElementById('split-res-base').textContent = toolkit.formatCurrency(res.totalAmount);
        document.getElementById('split-res-tip').textContent = res.formattedTip;
        document.getElementById('split-res-people').textContent = `${res.peopleCount}명`;
        document.getElementById('split-res-remainder').textContent = `${res.remainder >= 0 ? '+' : ''}${toolkit.formatCurrency(res.remainder)}`;
        document.getElementById('split-res-total').textContent = res.formattedTotal;
    }

    splitTotal.addEventListener('input', updateSplitBill);
    splitPeople.addEventListener('input', updateSplitBill);
    splitPeopleMinus.addEventListener('click', () => {
        splitPeople.value = Math.max(1, (parseInt(splitPeople.value, 10) || 1) - 1);
        updateSplitBill();
    });
    splitPeoplePlus.addEventListener('click', () => {
        splitPeople.value = (parseInt(splitPeople.value, 10) || 1) + 1;
        updateSplitBill();
    });

    splitTipPills.forEach(pill => {
        pill.addEventListener('click', () => {
            splitTipPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            splitTipVal = parseFloat(pill.dataset.val) || 0;
            updateSplitBill();
        });
    });

    splitRoundPills.forEach(pill => {
        pill.addEventListener('click', () => {
            splitRoundPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            splitRoundVal = parseInt(pill.dataset.val, 10) || 1;
            updateSplitBill();
        });
    });

    btnCopySplit.addEventListener('click', () => {
        const perPerson = document.getElementById('split-res-per-person').textContent;
        const total = document.getElementById('split-res-total').textContent;
        const people = splitPeople.value;
        const text = `🌿 [정산 알림]\n총 금액: ${total}\n인원: ${people}명\n👉 1인당 보내실 금액: ${perPerson}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 정산 안내 문구가 복사되었습니다.');
        });
    });

    // =========================================================================
    // 8. 스마트 툴킷 2: 할인율 및 부가세 계산기
    // =========================================================================
    const discPrice = document.getElementById('disc-price');
    const discCustomRate = document.getElementById('disc-custom-rate');
    const discExtra = document.getElementById('disc-extra');
    const discRatePills = document.querySelectorAll('#disc-rate-pills .pill-btn');
    const discVatPills = document.querySelectorAll('#disc-vat-pills .pill-btn');

    let discVatMode = 'included';

    function updateDiscountCalc() {
        const res = toolkit.calculateDiscountAndTax({
            originalPrice: discPrice.value,
            discountRate: discCustomRate.value,
            extraDiscount: discExtra.value,
            vatMode: discVatMode
        });

        document.getElementById('disc-res-final').textContent = res.formattedFinal;
        document.getElementById('disc-res-orig').textContent = toolkit.formatCurrency(res.originalPrice);
        document.getElementById('disc-res-saved').textContent = `-${res.formattedSaved}`;
        document.getElementById('disc-res-eff-rate').textContent = `${res.effectiveDiscountRate}%`;
        document.getElementById('disc-res-supply').textContent = toolkit.formatCurrency(res.supplyValue);
        document.getElementById('disc-res-vat').textContent = res.formattedVat;
    }

    discPrice.addEventListener('input', updateDiscountCalc);
    discExtra.addEventListener('input', updateDiscountCalc);
    discCustomRate.addEventListener('input', () => {
        discRatePills.forEach(p => p.classList.remove('active'));
        updateDiscountCalc();
    });

    discRatePills.forEach(pill => {
        pill.addEventListener('click', () => {
            discRatePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            discCustomRate.value = pill.dataset.val;
            updateDiscountCalc();
        });
    });

    discVatPills.forEach(pill => {
        pill.addEventListener('click', () => {
            discVatPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            discVatMode = pill.dataset.val;
            updateDiscountCalc();
        });
    });

    // =========================================================================
    // 9. 스마트 툴킷 3: D-Day 및 날짜 계산기
    // =========================================================================
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');
    const dateBase = document.getElementById('date-base');
    const dateDaysAdd = document.getElementById('date-days-add');
    const datePresetPills = document.querySelectorAll('#date-preset-pills .pill-btn');

    // 오늘 날짜 기본 세팅
    const todayStr = new Date().toISOString().slice(0, 10);
    dateStart.value = todayStr;
    dateBase.value = todayStr;

    // 100일 후 목표 날짜 기본 세팅
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 100);
    dateEnd.value = defaultEnd.toISOString().slice(0, 10);

    function updateDateCalc() {
        const diff = toolkit.calculateDateDiff(dateStart.value, dateEnd.value);
        if (diff) {
            const prefix = diff.totalDays > 0 ? 'D-' : (diff.totalDays === 0 ? 'D-Day' : 'D+');
            document.getElementById('date-res-dday').textContent = diff.totalDays === 0 ? '오늘 (D-Day)' : `${prefix}${diff.absDays}일`;
            document.getElementById('date-res-weeks').textContent = `${diff.weeks}주 ${diff.remainingDaysAfterWeeks}일 (${diff.absDays}일)`;
            document.getElementById('date-res-months').textContent = `${diff.approxMonths}개월`;
            document.getElementById('date-res-workdays').textContent = `${diff.workDays}일 (주말 제외)`;
        }

        const addRes = toolkit.calculateAddDays(dateBase.value, dateDaysAdd.value);
        if (addRes) {
            document.getElementById('date-res-target').textContent = addRes.formatted;
        }
    }

    dateStart.addEventListener('change', updateDateCalc);
    dateEnd.addEventListener('change', updateDateCalc);
    dateBase.addEventListener('change', updateDateCalc);
    dateDaysAdd.addEventListener('input', updateDateCalc);

    datePresetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            dateDaysAdd.value = pill.dataset.val;
            updateDateCalc();
        });
    });

    // =========================================================================
    // 10. 스마트 툴킷 4: 단위 변환기
    // =========================================================================
    const unitCatPills = document.querySelectorAll('#unit-cat-pills .pill-btn');
    const unitInputVal = document.getElementById('unit-input-val');
    const unitFromSelect = document.getElementById('unit-from-select');
    const unitToSelect = document.getElementById('unit-to-select');
    const btnUnitSwap = document.getElementById('btn-unit-swap');
    const unitResValue = document.getElementById('unit-res-value');
    const unitAllConversions = document.getElementById('unit-all-conversions');

    let currentUnitCat = 'length';

    function setupUnitOptions() {
        const cat = toolkit.unitCategories[currentUnitCat];
        if (!cat) return;

        unitFromSelect.innerHTML = '';
        unitToSelect.innerHTML = '';

        const units = Object.keys(cat.units);
        units.forEach((u, idx) => {
            const optFrom = document.createElement('option');
            optFrom.value = u;
            optFrom.textContent = cat.units[u].name;
            unitFromSelect.appendChild(optFrom);

            const optTo = document.createElement('option');
            optTo.value = u;
            optTo.textContent = cat.units[u].name;
            unitToSelect.appendChild(optTo);
        });

        if (units.length > 1) {
            unitFromSelect.selectedIndex = 0;
            unitToSelect.selectedIndex = 1;
        }

        updateUnitConversion();
    }

    function updateUnitConversion() {
        const val = unitInputVal.value;
        const from = unitFromSelect.value;
        const to = unitToSelect.value;

        const converted = toolkit.convertUnit(currentUnitCat, val, from, to);
        const cat = toolkit.unitCategories[currentUnitCat];
        const toUnitName = cat?.units[to]?.name || '';

        unitResValue.textContent = `${converted.toLocaleString()} ${to}`;

        // 전체 단위 비교 목록 렌더링
        if (cat) {
            unitAllConversions.innerHTML = '';
            Object.keys(cat.units).forEach(u => {
                const subConverted = toolkit.convertUnit(currentUnitCat, val, from, u);
                const row = document.createElement('div');
                row.className = 'summary-row';
                row.innerHTML = `
                    <span>${cat.units[u].name}</span>
                    <span style="font-weight: 600; color: ${u === to ? 'var(--accent-emerald)' : 'var(--text-primary)'};">${subConverted.toLocaleString()} ${u}</span>
                `;
                unitAllConversions.appendChild(row);
            });
        }
    }

    unitCatPills.forEach(pill => {
        pill.addEventListener('click', () => {
            unitCatPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentUnitCat = pill.dataset.cat;
            setupUnitOptions();
        });
    });

    unitInputVal.addEventListener('input', updateUnitConversion);
    unitFromSelect.addEventListener('change', updateUnitConversion);
    unitToSelect.addEventListener('change', updateUnitConversion);

    btnUnitSwap.addEventListener('click', () => {
        const temp = unitFromSelect.value;
        unitFromSelect.value = unitToSelect.value;
        unitToSelect.value = temp;
        updateUnitConversion();
    });

    // =========================================================================
    // 11. 스마트 툴킷 5: 적금 & 복리이자 계산기
    // =========================================================================
    const savTypePills = document.querySelectorAll('#sav-type-pills .pill-btn');
    const savAmount = document.getElementById('sav-amount');
    const savAmountLabel = document.getElementById('sav-amount-label');
    const savPeriod = document.getElementById('sav-period');
    const savRate = document.getElementById('sav-rate');
    const savTaxPills = document.querySelectorAll('#sav-tax-pills .pill-btn');

    let savType = 'installment';
    let savTaxType = 'general';

    function updateSavingsCalc() {
        const res = toolkit.calculateSavings({
            type: savType,
            monthlyAmount: savAmount.value,
            interestRate: savRate.value,
            periodMonths: savPeriod.value,
            taxType: savTaxType
        });

        document.getElementById('sav-res-final').textContent = res.formattedFinal;
        document.getElementById('sav-res-principal').textContent = res.formattedPrincipal;
        document.getElementById('sav-res-pre-tax').textContent = toolkit.formatCurrency(res.beforeTaxInterest);
        document.getElementById('sav-res-tax').textContent = `-${res.formattedTax} (${res.taxRatePercent}%)`;
        document.getElementById('sav-res-net-interest').textContent = `+${res.formattedInterest}`;

        document.getElementById('sav-res-p-pct').textContent = `${res.principalRatio}%`;
        document.getElementById('sav-res-i-pct').textContent = `${res.interestRatio}%`;
        document.getElementById('sav-bar-p').style.width = `${res.principalRatio}%`;
        document.getElementById('sav-bar-i').style.width = `${res.interestRatio}%`;
    }

    savTypePills.forEach(pill => {
        pill.addEventListener('click', () => {
            savTypePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            savType = pill.dataset.val;
            savAmountLabel.textContent = savType === 'installment' ? '월 납입액' : '목돈 예치액';
            updateSavingsCalc();
        });
    });

    savTaxPills.forEach(pill => {
        pill.addEventListener('click', () => {
            savTaxPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            savTaxType = pill.dataset.val;
            updateSavingsCalc();
        });
    });

    savAmount.addEventListener('input', updateSavingsCalc);
    savPeriod.addEventListener('input', updateSavingsCalc);
    savRate.addEventListener('input', updateSavingsCalc);

    // =========================================================================
    // 12. 단축키 모달 및 토스트 알림 유틸
    // =========================================================================
    const modal = document.getElementById('shortcuts-modal');
    const btnShortcuts = document.getElementById('btn-shortcuts-modal');
    const btnFooterShortcuts = document.getElementById('btn-footer-shortcuts');
    const btnCloseModal = document.getElementById('btn-close-modal');

    function openModal() { modal.classList.add('active'); }
    function closeModal() { modal.classList.remove('active'); }

    btnShortcuts.addEventListener('click', openModal);
    btnFooterShortcuts.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>🌿</span><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // 초기 렌더링 호출
    renderKeypad();
    renderHistory();
    updateSplitBill();
    updateDiscountCalc();
    updateDateCalc();
    setupUnitOptions();
    updateSavingsCalc();
});
