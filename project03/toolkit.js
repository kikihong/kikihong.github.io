/**
 * Sylvan Calc - Smart Life Toolkit Module
 * 더치페이/팁, 할인/부가세, 날짜/D-day, 단위변환, 적금/복리이자 계산기
 */

class SmartToolkit {
    constructor() {
        this.initUnitDefinitions();
    }

    /* ----------------------------------------------------
     * 1. 더치페이 & 팁 계산기 (Split Bill & Tip)
     * ---------------------------------------------------- */
    calculateSplitBill({ totalAmount, peopleCount, tipPercent = 0, roundUnit = 100 }) {
        totalAmount = Math.max(0, parseFloat(totalAmount) || 0);
        peopleCount = Math.max(1, parseInt(peopleCount, 10) || 1);
        tipPercent = Math.max(0, parseFloat(tipPercent) || 0);
        roundUnit = parseInt(roundUnit, 10) || 1;

        const tipAmount = Math.round(totalAmount * (tipPercent / 100));
        const grandTotal = totalAmount + tipAmount;
        let perPersonExact = grandTotal / peopleCount;
        
        let perPersonRounded = perPersonExact;
        if (roundUnit > 1) {
            perPersonRounded = Math.ceil(perPersonExact / roundUnit) * roundUnit;
        }

        const totalCollected = perPersonRounded * peopleCount;
        const remainder = totalCollected - grandTotal;

        return {
            totalAmount,
            peopleCount,
            tipPercent,
            tipAmount,
            grandTotal,
            perPersonExact: Math.round(perPersonExact),
            perPerson: perPersonRounded,
            remainder,
            formattedTotal: this.formatCurrency(grandTotal),
            formattedPerPerson: this.formatCurrency(perPersonRounded),
            formattedTip: this.formatCurrency(tipAmount)
        };
    }

    /* ----------------------------------------------------
     * 2. 할인율 및 부가세(VAT) 계산기 (Discount & Tax)
     * ---------------------------------------------------- */
    calculateDiscountAndTax({ originalPrice, discountRate, extraDiscount = 0, vatMode = 'included' }) {
        originalPrice = Math.max(0, parseFloat(originalPrice) || 0);
        discountRate = Math.min(100, Math.max(0, parseFloat(discountRate) || 0));
        extraDiscount = Math.max(0, parseFloat(extraDiscount) || 0);

        const discountAmount = originalPrice * (discountRate / 100);
        let afterPercentPrice = originalPrice - discountAmount;
        let discountedPrice = Math.max(0, afterPercentPrice - extraDiscount);
        const totalSaved = originalPrice - discountedPrice;

        let supplyValue = discountedPrice;
        let vatAmount = 0;
        let finalPayPrice = discountedPrice;

        if (vatMode === 'included') {
            // 부가세 포함: 최종가에서 공급가액과 부가세 10% 분리
            supplyValue = Math.round(discountedPrice / 1.1);
            vatAmount = discountedPrice - supplyValue;
            finalPayPrice = discountedPrice;
        } else if (vatMode === 'excluded') {
            // 부가세 10% 별도 추가
            supplyValue = discountedPrice;
            vatAmount = Math.round(discountedPrice * 0.1);
            finalPayPrice = discountedPrice + vatAmount;
        } else {
            // 면세 (No VAT)
            supplyValue = discountedPrice;
            vatAmount = 0;
            finalPayPrice = discountedPrice;
        }

        const effectiveDiscountRate = originalPrice > 0 ? ((totalSaved / originalPrice) * 100).toFixed(1) : 0;

        return {
            originalPrice,
            discountRate,
            discountAmount: Math.round(discountAmount),
            extraDiscount,
            totalSaved: Math.round(totalSaved),
            effectiveDiscountRate,
            supplyValue: Math.round(supplyValue),
            vatAmount: Math.round(vatAmount),
            finalPayPrice: Math.round(finalPayPrice),
            formattedFinal: this.formatCurrency(Math.round(finalPayPrice)),
            formattedSaved: this.formatCurrency(Math.round(totalSaved)),
            formattedVat: this.formatCurrency(Math.round(vatAmount))
        };
    }

    /* ----------------------------------------------------
     * 3. D-Day 및 날짜 간격 계산기 (Date / D-Day)
     * ---------------------------------------------------- */
    calculateDateDiff(startDateStr, endDateStr, includeEndDay = true) {
        if (!startDateStr || !endDateStr) return null;
        
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        const msPerDay = 1000 * 60 * 60 * 24;
        let diffMs = end.getTime() - start.getTime();
        let totalDays = Math.round(diffMs / msPerDay) + (includeEndDay ? (diffMs >= 0 ? 1 : -1) : 0);

        const absDays = Math.abs(totalDays);
        const weeks = Math.floor(absDays / 7);
        const remainingDaysAfterWeeks = absDays % 7;
        const approxMonths = (absDays / 30.4375).toFixed(1);

        // 평일(영업일) 계산
        let workDays = 0;
        let cur = new Date(Math.min(start.getTime(), end.getTime()));
        const target = new Date(Math.max(start.getTime(), end.getTime()));
        while (cur <= target) {
            const dayOfWeek = cur.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workDays++;
            }
            cur.setDate(cur.getDate() + 1);
        }

        return {
            totalDays,
            absDays,
            weeks,
            remainingDaysAfterWeeks,
            approxMonths,
            workDays,
            isPast: diffMs < 0,
            isToday: diffMs === 0
        };
    }

    calculateAddDays(baseDateStr, daysToAdd) {
        if (!baseDateStr) return null;
        const base = new Date(baseDateStr);
        if (isNaN(base.getTime())) return null;

        daysToAdd = parseInt(daysToAdd, 10) || 0;
        const target = new Date(base);
        target.setDate(target.getDate() + daysToAdd);

        const year = target.getFullYear();
        const month = String(target.getMonth() + 1).padStart(2, '0');
        const day = String(target.getDate()).padStart(2, '0');
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[target.getDay()];

        return {
            targetDateStr: `${year}-${month}-${day}`,
            formatted: `${year}년 ${month}월 ${day}일 (${dayName}요일)`,
            daysAdded: daysToAdd
        };
    }

    /* ----------------------------------------------------
     * 4. 스마트 단위 변환기 (Unit Converter)
     * ---------------------------------------------------- */
    initUnitDefinitions() {
        this.unitCategories = {
            length: {
                name: '길이 (Length)',
                base: 'm',
                units: {
                    mm: { name: '밀리미터 (mm)', rate: 0.001 },
                    cm: { name: '센티미터 (cm)', rate: 0.01 },
                    m: { name: '미터 (m)', rate: 1 },
                    km: { name: '킬로미터 (km)', rate: 1000 },
                    inch: { name: '인치 (in)', rate: 0.0254 },
                    ft: { name: '피트 (ft)', rate: 0.3048 },
                    yd: { name: '야드 (yd)', rate: 0.9144 },
                    mile: { name: '마일 (mi)', rate: 1609.344 },
                    ri: { name: '리 (里)', rate: 392.727 }
                }
            },
            weight: {
                name: '무게 (Weight)',
                base: 'kg',
                units: {
                    mg: { name: '밀리그램 (mg)', rate: 0.000001 },
                    g: { name: '그램 (g)', rate: 0.001 },
                    kg: { name: '킬로그램 (kg)', rate: 1 },
                    t: { name: '톤 (t)', rate: 1000 },
                    oz: { name: '온스 (oz)', rate: 0.0283495 },
                    lb: { name: '파운드 (lb)', rate: 0.453592 },
                    geun: { name: '근 (斤)', rate: 0.6 },
                    don: { name: '돈', rate: 0.00375 }
                }
            },
            area: {
                name: '넓이 (Area)',
                base: 'm2',
                units: {
                    m2: { name: '제곱미터 (㎡)', rate: 1 },
                    pyeong: { name: '평 (坪)', rate: 3.305785 },
                    ft2: { name: '제곱피트 (sq ft)', rate: 0.092903 },
                    ha: { name: '헥타르 (ha)', rate: 10000 },
                    acre: { name: '에이커 (ac)', rate: 4046.86 },
                    km2: { name: '제곱킬로미터 (㎢)', rate: 1000000 }
                }
            },
            temperature: {
                name: '온도 (Temperature)',
                isCustom: true,
                units: {
                    c: { name: '섭씨 (℃)' },
                    f: { name: '화씨 (℉)' },
                    k: { name: '켈빈 (K)' }
                }
            },
            data: {
                name: '데이터 용량 (Data)',
                base: 'B',
                units: {
                    B: { name: '바이트 (B)', rate: 1 },
                    KB: { name: '킬로바이트 (KB)', rate: 1024 },
                    MB: { name: '메가바이트 (MB)', rate: 1024 * 1024 },
                    GB: { name: '기가바이트 (GB)', rate: 1024 * 1024 * 1024 },
                    TB: { name: '테라바이트 (TB)', rate: 1024 * 1024 * 1024 * 1024 },
                    PB: { name: '페타바이트 (PB)', rate: 1024 * 1024 * 1024 * 1024 * 1024 }
                }
            },
            speed: {
                name: '속도 (Speed)',
                base: 'mps',
                units: {
                    mps: { name: 'm/s (초속)', rate: 1 },
                    kmh: { name: 'km/h (시속)', rate: 1 / 3.6 },
                    mph: { name: 'mph (마일/시)', rate: 0.44704 },
                    knot: { name: '노트 (kn)', rate: 0.514444 }
                }
            }
        };
    }

    convertUnit(category, value, fromUnit, toUnit) {
        value = parseFloat(value);
        if (isNaN(value)) return 0;
        if (fromUnit === toUnit) return value;

        const cat = this.unitCategories[category];
        if (!cat) return 0;

        // 온도 변환 예외 처리
        if (category === 'temperature') {
            let celsius = value;
            if (fromUnit === 'f') celsius = (value - 32) * (5 / 9);
            else if (fromUnit === 'k') celsius = value - 273.15;

            if (toUnit === 'c') return this.cleanPrecision(celsius);
            if (toUnit === 'f') return this.cleanPrecision((celsius * 9 / 5) + 32);
            if (toUnit === 'k') return this.cleanPrecision(celsius + 273.15);
            return celsius;
        }

        const fromRate = cat.units[fromUnit]?.rate;
        const toRate = cat.units[toUnit]?.rate;
        if (!fromRate || !toRate) return 0;

        const baseValue = value * fromRate;
        const result = baseValue / toRate;
        return this.cleanPrecision(result);
    }

    /* ----------------------------------------------------
     * 5. 적금 / 예금 / 복리 이자 계산기 (Savings & Interest)
     * ---------------------------------------------------- */
    calculateSavings({ type = 'installment', monthlyAmount, interestRate, periodMonths, taxType = 'general', isCompound = false }) {
        monthlyAmount = Math.max(0, parseFloat(monthlyAmount) || 0);
        interestRate = Math.max(0, parseFloat(interestRate) || 0) / 100;
        periodMonths = Math.max(1, parseInt(periodMonths, 10) || 12);

        let taxRate = 0.154; // 일반과세 15.4% (소득세 14% + 지방소득세 1.4%)
        if (taxType === 'preferential') taxRate = 0.095; // 세금우대 9.5%
        else if (taxType === 'taxFree') taxRate = 0; // 비과세 0%

        let totalPrincipal = 0;
        let beforeTaxInterest = 0;

        if (type === 'installment') {
            // 매월 적립식 (적금)
            totalPrincipal = monthlyAmount * periodMonths;
            if (!isCompound) {
                // 단리 적금 이자 = 월적립액 * 이율 * n(n+1) / (2 * 12)
                beforeTaxInterest = monthlyAmount * interestRate * (periodMonths * (periodMonths + 1)) / (24);
            } else {
                // 월복리 적금 이자
                const r = interestRate / 12;
                let futureValue = 0;
                for (let i = 1; i <= periodMonths; i++) {
                    futureValue += monthlyAmount * Math.pow(1 + r, periodMonths - i + 1);
                }
                beforeTaxInterest = futureValue - totalPrincipal;
            }
        } else {
            // 거치식 예금 (예탁금)
            totalPrincipal = monthlyAmount; // 목돈 예치
            if (!isCompound) {
                // 단리 예금
                beforeTaxInterest = totalPrincipal * interestRate * (periodMonths / 12);
            } else {
                // 월복리 예금
                const r = interestRate / 12;
                const futureValue = totalPrincipal * Math.pow(1 + r, periodMonths);
                beforeTaxInterest = futureValue - totalPrincipal;
            }
        }

        const taxAmount = Math.round(beforeTaxInterest * taxRate);
        const afterTaxInterest = Math.round(beforeTaxInterest - taxAmount);
        const finalPayout = totalPrincipal + afterTaxInterest;

        return {
            totalPrincipal: Math.round(totalPrincipal),
            beforeTaxInterest: Math.round(beforeTaxInterest),
            taxAmount,
            taxRatePercent: (taxRate * 100).toFixed(1),
            afterTaxInterest,
            finalPayout,
            formattedPrincipal: this.formatCurrency(Math.round(totalPrincipal)),
            formattedInterest: this.formatCurrency(afterTaxInterest),
            formattedTax: this.formatCurrency(taxAmount),
            formattedFinal: this.formatCurrency(finalPayout),
            principalRatio: ((totalPrincipal / finalPayout) * 100).toFixed(1),
            interestRatio: ((afterTaxInterest / finalPayout) * 100).toFixed(1)
        };
    }

    cleanPrecision(val) {
        if (Math.abs(val) < 1e-12) return 0;
        const rounded = parseFloat(val.toPrecision(10));
        return rounded;
    }

    formatCurrency(amount) {
        return Math.round(amount).toLocaleString('ko-KR') + '원';
    }
}

window.smartToolkit = new SmartToolkit();
