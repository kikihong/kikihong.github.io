/**
 * Sylvan Calc - Smart Scientific Calculation Engine
 * 실시간 수식 파싱, 공학용 함수, 연산자 우선순위, 부동소수점 보정, 메모리 관리
 */

class SmartCalculator {
    constructor() {
        this.expression = '';
        this.currentValue = '0';
        this.previewValue = '';
        this.memory = 0;
        this.isRadian = false; // Degree 기본
        this.isEvaluated = false;
        this.history = [];
        this.maxDigits = 16;
    }

    // 초기화
    clearAll() {
        this.expression = '';
        this.currentValue = '0';
        this.previewValue = '';
        this.isEvaluated = false;
        return this.getState();
    }

    // 현재 입력만 지우기
    clearEntry() {
        this.currentValue = '0';
        this.updatePreview();
        return this.getState();
    }

    // 백스페이스 (한 글자 지우기)
    backspace() {
        if (this.isEvaluated) {
            this.clearAll();
            return this.getState();
        }

        if (this.expression.length > 0) {
            // 함수 토큰 지우기 (예: 'sin(', 'log(', 'sqrt(' 등)
            const funcMatches = ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'cbrt(', 'abs('];
            let removed = false;
            for (const fn of funcMatches) {
                if (this.expression.endsWith(fn)) {
                    this.expression = this.expression.slice(0, -fn.length);
                    removed = true;
                    break;
                }
            }
            if (!removed) {
                this.expression = this.expression.slice(0, -1);
            }
        }
        
        this.updatePreview();
        return this.getState();
    }

    // 숫자 및 소수점 입력
    inputDigit(digit) {
        if (this.isEvaluated) {
            this.expression = '';
            this.isEvaluated = false;
        }

        if (digit === '.') {
            const tokens = this.expression.split(/[\+\-\×\÷\*\/\^\(\)]/);
            const lastToken = tokens[tokens.length - 1];
            if (lastToken.includes('.')) return this.getState();
            if (!lastToken || lastToken === '') {
                this.expression += '0.';
            } else {
                this.expression += '.';
            }
        } else if (digit === '00') {
            if (this.expression === '' || this.expression === '0') {
                this.expression = '0';
            } else {
                const tokens = this.expression.split(/[\+\-\×\÷\*\/\^\(\)]/);
                const lastToken = tokens[tokens.length - 1];
                if (lastToken !== '0') {
                    this.expression += '00';
                }
            }
        } else {
            // 일반 숫자
            if (this.expression === '0') {
                this.expression = digit;
            } else {
                this.expression += digit;
            }
        }

        this.updatePreview();
        return this.getState();
    }

    // 연산자 (+, -, ×, ÷, ^, %) 입력
    inputOperator(op) {
        if (this.isEvaluated) {
            this.isEvaluated = false;
        }

        if (this.expression === '' && (op === '−' || op === '-')) {
            this.expression = '-';
            this.updatePreview();
            return this.getState();
        }

        if (this.expression === '' || this.expression === '-') {
            return this.getState();
        }

        const lastChar = this.expression.slice(-1);
        const operators = ['+', '-', '−', '×', '*', '÷', '/', '^'];

        if (operators.includes(lastChar)) {
            // 마지막 연산자 교체
            this.expression = this.expression.slice(0, -1) + op;
        } else {
            this.expression += op;
        }

        this.updatePreview();
        return this.getState();
    }

    // 괄호 '(' 또는 ')'
    inputParenthesis(paren) {
        if (this.isEvaluated) {
            if (paren === '(') {
                this.expression = '(';
            } else {
                this.expression += paren;
            }
            this.isEvaluated = false;
            this.updatePreview();
            return this.getState();
        }

        const lastChar = this.expression.slice(-1);
        if (paren === '(') {
            if (/\d|\)/.test(lastChar)) {
                this.expression += '×(';
            } else {
                this.expression += '(';
            }
        } else {
            // ')' 닫는 괄호는 여는 괄호 개수가 더 많을 때만 가능
            const openCount = (this.expression.match(/\(/g) || []).length;
            const closeCount = (this.expression.match(/\)/g) || []).length;
            if (openCount > closeCount && !/[\+\-\×\÷\*\/\^\(]/.test(lastChar)) {
                this.expression += ')';
            }
        }

        this.updatePreview();
        return this.getState();
    }

    // 공학용 함수 (sin, cos, tan, log, ln, sqrt 등)
    inputFunction(fn) {
        if (this.isEvaluated) {
            this.expression = '';
            this.isEvaluated = false;
        }

        const lastChar = this.expression.slice(-1);
        if (/\d|\)/.test(lastChar)) {
            this.expression += '×' + fn + '(';
        } else {
            this.expression += fn + '(';
        }

        this.updatePreview();
        return this.getState();
    }

    // 상수 (π, e)
    inputConstant(constant) {
        if (this.isEvaluated) {
            this.expression = '';
            this.isEvaluated = false;
        }

        const lastChar = this.expression.slice(-1);
        if (/\d|\)/.test(lastChar)) {
            this.expression += '×' + constant;
        } else {
            this.expression += constant;
        }

        this.updatePreview();
        return this.getState();
    }

    // 단항 연산 (제곱, 세제곱, 역수, 팩토리얼, 부호반전)
    inputUnary(action) {
        if (this.expression === '' && !this.isEvaluated) return this.getState();

        let val = this.isEvaluated ? this.currentValue : this.previewValue || this.expression;

        switch (action) {
            case 'sq': // x²
                if (this.isEvaluated) {
                    this.expression = `(${this.currentValue})^2`;
                } else {
                    this.expression += '^2';
                }
                break;
            case 'cube': // x³
                if (this.isEvaluated) {
                    this.expression = `(${this.currentValue})^3`;
                } else {
                    this.expression += '^3';
                }
                break;
            case 'recip': // 1/x
                if (this.isEvaluated) {
                    this.expression = `1/(${this.currentValue})`;
                } else {
                    this.expression = `1/(${this.expression})`;
                }
                break;
            case 'fact': // n!
                this.expression += '!';
                break;
            case 'percent': // %
                this.expression += '%';
                break;
            case 'negate': // ±
                if (this.isEvaluated) {
                    const num = -parseFloat(this.currentValue);
                    this.currentValue = this.formatNumber(num);
                    this.expression = this.currentValue;
                    return this.getState();
                } else if (this.expression !== '') {
                    this.expression = `-(${this.expression})`;
                }
                break;
        }

        this.isEvaluated = false;
        this.updatePreview();
        return this.getState();
    }

    // 각도 모드 토글 (Rad <-> Deg)
    toggleAngleMode() {
        this.isRadian = !this.isRadian;
        this.updatePreview();
        return this.getState();
    }

    // 메모리 기능 (MC, MR, M+, M-)
    memoryAction(action) {
        const currentNum = parseFloat(this.isEvaluated ? this.currentValue : (this.previewValue || '0'));
        switch (action) {
            case 'mc':
                this.memory = 0;
                break;
            case 'mr':
                if (this.memory !== 0) {
                    this.inputDigit(this.formatNumber(this.memory));
                }
                break;
            case 'm+':
                if (!isNaN(currentNum)) {
                    this.memory += currentNum;
                }
                break;
            case 'm-':
                if (!isNaN(currentNum)) {
                    this.memory -= currentNum;
                }
                break;
        }
        return this.getState();
    }

    // 실시간 프리뷰 계산
    updatePreview() {
        if (!this.expression || this.expression.trim() === '') {
            this.previewValue = '';
            return;
        }

        try {
            const evaluated = this.evaluateExpression(this.expression);
            if (evaluated !== null && !isNaN(evaluated) && isFinite(evaluated)) {
                this.previewValue = this.formatNumber(evaluated);
            } else {
                this.previewValue = '';
            }
        } catch (e) {
            this.previewValue = '';
        }
    }

    // 최종 결과 계산 (=)
    calculate() {
        if (!this.expression || this.expression.trim() === '') return this.getState();

        try {
            const rawExpr = this.expression;
            const result = this.evaluateExpression(rawExpr);

            if (result === null || isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }

            const formattedResult = this.formatNumber(result);
            
            // 히스토리에 기록
            const historyItem = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                timestamp: new Date(),
                expression: rawExpr,
                result: formattedResult,
                memo: ''
            };
            this.history.unshift(historyItem);
            if (this.history.length > 50) this.history.pop();

            this.currentValue = formattedResult;
            this.previewValue = '';
            this.isEvaluated = true;

            // 글로벌 이벤트 발생 (히스토리 업데이트 등)
            if (window.onCalculationComplete) {
                window.onCalculationComplete(historyItem);
            }

            return {
                ...this.getState(),
                success: true,
                historyItem
            };
        } catch (err) {
            return {
                ...this.getState(),
                error: '수식이 올바르지 않습니다'
            };
        }
    }

    // 수식 파싱 및 안전한 수학 연산 파서
    evaluateExpression(rawExpr) {
        if (!rawExpr || rawExpr.trim() === '') return null;

        // 괄호 자동 닫기 보정
        let expr = rawExpr;
        const openCount = (expr.match(/\(/g) || []).length;
        const closeCount = (expr.match(/\)/g) || []).length;
        if (openCount > closeCount) {
            expr += ')'.repeat(openCount - closeCount);
        }

        // 연산자 표준화
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

        // 상수 치환
        expr = expr.replace(/π/g, `(${Math.PI})`);
        expr = expr.replace(/\be\b/g, `(${Math.E})`);

        // 백분율 (%) 치환 (예: 50% -> (50/100), 200 + 10% -> 200 + (200 * 0.1))
        expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

        // 팩토리얼 (n!) 치환
        expr = expr.replace(/(\d+)!/g, (match, n) => {
            return `factorial(${n})`;
        });

        // 거듭제곱 (^) 치환 -> Math.pow
        expr = this.transformPowers(expr);

        // 삼각함수 및 공학 함수 변환
        const isRad = this.isRadian;

        const context = {
            sin: (x) => Math.sin(isRad ? x : (x * Math.PI) / 180),
            cos: (x) => Math.cos(isRad ? x : (x * Math.PI) / 180),
            tan: (x) => {
                const deg = isRad ? (x * 180) / Math.PI : x;
                if (Math.abs(deg % 180 - 90) < 1e-9) throw new Error('Undefined');
                return Math.tan(isRad ? x : (x * Math.PI) / 180);
            },
            asin: (x) => isRad ? Math.asin(x) : (Math.asin(x) * 180) / Math.PI,
            acos: (x) => isRad ? Math.acos(x) : (Math.acos(x) * 180) / Math.PI,
            atan: (x) => isRad ? Math.atan(x) : (Math.atan(x) * 180) / Math.PI,
            log: (x) => Math.log10(x),
            ln: (x) => Math.log(x),
            sqrt: (x) => {
                if (x < 0) throw new Error('Square root of negative number');
                return Math.sqrt(x);
            },
            cbrt: (x) => Math.cbrt(x),
            abs: (x) => Math.abs(x),
            factorial: (n) => {
                n = Math.floor(n);
                if (n < 0 || n > 170) throw new Error('Overflow/Invalid factorial');
                let f = 1;
                for (let i = 2; i <= n; i++) f *= i;
                return f;
            },
            pow: (a, b) => Math.pow(a, b)
        };

        // 안전한 Function 생성기
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `"use strict"; return (${expr});`);
        const result = fn(...values);

        // 부동 소수점 오차 정밀 보정 (0.1 + 0.2 = 0.3)
        return this.cleanFloat(result);
    }

    transformPowers(expr) {
        // 간단한 a^b 정규식 치환
        while (expr.includes('^')) {
            const replaced = expr.replace(/([a-zA-Z0-9_\.]+|\([^\(\)]+\))\^([a-zA-Z0-9_\.]+|\([^\(\)]+\))/, 'pow($1,$2)');
            if (replaced === expr) break;
            expr = replaced;
        }
        return expr;
    }

    cleanFloat(num) {
        if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return num;
        return parseFloat(num.toPrecision(14));
    }

    formatNumber(num) {
        if (num === null || isNaN(num)) return '0';
        if (!isFinite(num)) return '오류 (범위 초과)';

        const str = num.toString();
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-7 && num !== 0)) {
            return num.toExponential(6).replace('e+', 'e');
        }

        const parts = str.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    getState() {
        return {
            expression: this.expression,
            currentValue: this.currentValue,
            previewValue: this.previewValue,
            memory: this.memory,
            hasMemory: this.memory !== 0,
            isRadian: this.isRadian,
            isEvaluated: this.isEvaluated
        };
    }
}

window.SmartCalculator = SmartCalculator;
