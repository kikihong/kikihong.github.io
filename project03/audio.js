/**
 * Sylvan Calc - Forest Sound & Audio Synthesizer (Web Audio API)
 * 외부 오디오 파일 없이 순수 Web Audio API로 생성되는 자연의 소리 및 햅틱 타건음
 */

class ForestAudioEngine {
    constructor() {
        this.ctx = null;
        this.isSoundEnabled = true;
        this.isAmbienceEnabled = false;
        this.ambienceVolume = 0.15;
        this.soundType = 'wood'; // 'wood' | 'droplet'
        
        // 앰비언스 노드들
        this.windGain = null;
        this.cricketGain = null;
        this.birdsGain = null;
        this.masterAmbienceGain = null;
        this.ambienceNodes = [];
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSoundEnabled(enabled) {
        this.isSoundEnabled = enabled;
    }

    setSoundType(type) {
        this.soundType = type;
    }

    // 버튼 터치 사운드 (키 종류에 따른 다채로운 피치)
    playKeySound(type = 'number', value = '') {
        if (!this.isSoundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        if (this.soundType === 'wood') {
            this.playWoodSound(type, value, now);
        } else {
            this.playDropletSound(type, value, now);
        }
    }

    // 1. 따뜻한 숲속 우드블록 / 칼림바 타건음
    playWoodSound(type, value, now) {
        let baseFreq = 440;
        let decay = 0.08;

        if (type === 'number') {
            const num = parseInt(value, 10);
            const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
            baseFreq = !isNaN(num) ? (scale[num] || 392.0) : 349.23;
            decay = 0.06;
        } else if (type === 'operator') {
            baseFreq = 659.25; // E5
            decay = 0.09;
        } else if (type === 'function') {
            baseFreq = 587.33; // D5
            decay = 0.07;
        } else if (type === 'action') {
            baseFreq = 329.63; // E4
            decay = 0.1;
        } else if (type === 'equals') {
            // 화음 (Chord) 재생
            this.playHarmonicChord([523.25, 659.25, 783.99, 1046.5], now);
            return;
        } else if (type === 'clear') {
            baseFreq = 220; // A3
            decay = 0.12;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + decay);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 1.5, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay);
    }

    // 2. 맑은 숲속 이슬/물방울 사운드
    playDropletSound(type, value, now) {
        let baseFreq = 800;
        let decay = 0.12;

        if (type === 'number') {
            const num = parseInt(value, 10);
            baseFreq = 600 + (isNaN(num) ? 5 : num) * 80;
        } else if (type === 'operator') {
            baseFreq = 1200;
        } else if (type === 'equals') {
            this.playHarmonicChord([880, 1100, 1320], now);
            return;
        } else if (type === 'clear') {
            baseFreq = 450;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.03);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + decay);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay);
    }

    // 등호 (=) 클릭 시 영롱한 숲속 아르페지오 화음
    playHarmonicChord(notes, now) {
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const delay = idx * 0.035;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0.0001, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.12 / notes.length, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
        });
    }

    // 🌿 숲속 앰비언스 (바람소리 & 풀벌레 & 새소리) 사운드스케이프 제너레이터
    toggleAmbience(enable) {
        this.isAmbienceEnabled = enable !== undefined ? enable : !this.isAmbienceEnabled;
        if (this.isAmbienceEnabled) {
            this.startAmbience();
        } else {
            this.stopAmbience();
        }
        return this.isAmbienceEnabled;
    }

    setAmbienceVolume(vol) {
        this.ambienceVolume = Math.max(0, Math.min(1, vol));
        if (this.masterAmbienceGain && this.ctx) {
            this.masterAmbienceGain.gain.setTargetAtTime(this.ambienceVolume, this.ctx.currentTime, 0.1);
        }
    }

    startAmbience() {
        this.initContext();
        if (!this.ctx) return;
        this.stopAmbience();

        this.masterAmbienceGain = this.ctx.createGain();
        this.masterAmbienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
        this.masterAmbienceGain.connect(this.ctx.destination);

        // 1. 잔잔한 숲속 바람 사운드 (Pink Noise + Lowpass Filter LFO)
        this.createWindAmbience();
        // 2. 은은한 풀벌레 / 찌르르 소리 (High freq modulated pulses)
        this.createCricketAmbience();
    }

    createWindAmbience() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
            b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);

        // LFO로 바람 세기 유영
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const windGain = this.ctx.createGain();
        windGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(windGain);
        windGain.connect(this.masterAmbienceGain);

        whiteNoise.start();
        lfo.start();

        this.ambienceNodes.push(whiteNoise, lfo);
    }

    createCricketAmbience() {
        const cricketOsc = this.ctx.createOscillator();
        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const cricketGain = this.ctx.createGain();

        cricketOsc.type = 'sine';
        cricketOsc.frequency.setValueAtTime(4500, this.ctx.currentTime);

        modOsc.type = 'sawtooth';
        modOsc.frequency.setValueAtTime(28, this.ctx.currentTime);
        modGain.gain.setValueAtTime(800, this.ctx.currentTime);

        modOsc.connect(modGain);
        modGain.connect(cricketOsc.frequency);

        cricketGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

        cricketOsc.connect(cricketGain);
        cricketGain.connect(this.masterAmbienceGain);

        cricketOsc.start();
        modOsc.start();

        this.ambienceNodes.push(cricketOsc, modOsc);
    }

    stopAmbience() {
        if (this.ambienceNodes.length > 0) {
            this.ambienceNodes.forEach(node => {
                try {
                    node.stop();
                    node.disconnect();
                } catch (e) {}
            });
            this.ambienceNodes = [];
        }
        if (this.masterAmbienceGain) {
            try {
                this.masterAmbienceGain.disconnect();
            } catch (e) {}
            this.masterAmbienceGain = null;
        }
    }
}

window.forestAudio = new ForestAudioEngine();
