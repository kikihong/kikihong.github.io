/**
 * Sylvan Calc - Calculation History & Memory Manager
 * 로컬스토리지 연동, 메모 라벨링, 즐겨찾기 고정, 클립보드 복사 및 내보내기
 */

class HistoryManager {
    constructor() {
        this.storageKey = 'sylvan_calc_history_v1';
        this.items = this.load();
        this.onUpdateCallback = null;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            if (this.onUpdateCallback) {
                this.onUpdateCallback(this.items);
            }
        } catch (e) {
            console.error('Failed to save history', e);
        }
    }

    addItem(expression, result, memo = '') {
        const item = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            formattedTime: this.formatTime(new Date()),
            expression,
            result,
            memo,
            isPinned: false
        };

        this.items.unshift(item);
        if (this.items.length > 80) {
            // 핀 안 된 오래된 항목 정리
            const unpinnedIdx = this.items.map((it, idx) => (!it.isPinned ? idx : -1)).filter(idx => idx !== -1);
            if (unpinnedIdx.length > 0) {
                const lastIdx = unpinnedIdx[unpinnedIdx.length - 1];
                this.items.splice(lastIdx, 1);
            }
        }
        this.save();
        return item;
    }

    togglePin(id) {
        const item = this.items.find(it => it.id === id);
        if (item) {
            item.isPinned = !item.isPinned;
            // 핀된 항목을 위쪽으로 정렬
            this.items.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
            this.save();
        }
    }

    updateMemo(id, memo) {
        const item = this.items.find(it => it.id === id);
        if (item) {
            item.memo = memo;
            this.save();
        }
    }

    deleteItem(id) {
        this.items = this.items.filter(it => it.id !== id);
        this.save();
    }

    clearAll() {
        // 핀된 항목은 유지 여부 또는 전체 삭제
        this.items = this.items.filter(it => it.isPinned);
        this.save();
    }

    formatTime(date) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        return `${hours}:${mins}:${secs}`;
    }

    exportToText() {
        if (this.items.length === 0) return '기록이 없습니다.';
        return this.items.map(it => {
            const pinStr = it.isPinned ? '⭐ [고정] ' : '';
            const memoStr = it.memo ? ` (${it.memo})` : '';
            return `${pinStr}[${it.formattedTime}] ${it.expression} = ${it.result}${memoStr}`;
        }).join('\n');
    }

    exportToCSV() {
        if (this.items.length === 0) return '';
        const header = '시간,수식,결과,메모,고정여부\n';
        const rows = this.items.map(it => {
            const cleanExpr = `"${(it.expression || '').replace(/"/g, '""')}"`;
            const cleanRes = `"${(it.result || '').replace(/"/g, '""')}"`;
            const cleanMemo = `"${(it.memo || '').replace(/"/g, '""')}"`;
            return `${it.formattedTime},${cleanExpr},${cleanRes},${cleanMemo},${it.isPinned ? 'Y' : 'N'}`;
        }).join('\n');
        return header + rows;
    }
}

window.historyManager = new HistoryManager();
