/**
 * RSVP Engine handles the timing, highlighting, and playback state.
 */
export class RsvpEngine {
    constructor(displayElements) {
        this.display = displayElements; // {left, focus, right}
        this.words = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.wpm = 600;
        this.timer = null;
        this.onProgress = null;

        // Timing configuration
        this.config = {
            punctuationFactors: {
                symbols: 0.3, // , ; : ! ?
                period: 0.8,  // .
                newline: 1.2  // \n
            },
            factors: {
                base: 1.0,    // <= 5 chars
                medium: 1.1,  // 6-8 chars
                long: 1.2,    // 9-12 chars
                extra: 1.35,  // 13-16 chars
                massive: 1.5  // 17+ chars
            }
        };

        // Ramping state
        this.isRamping = false;
        this.rampType = null; // 'up' or 'down'
        this.rampStep = 0;
        this.rampTotalSteps = 12;
    }

    setWords(words, startIndex = 0) {
        this.words = words;
        this.currentIndex = startIndex;
        this.updateDisplay(true); // Trigger callback to sync progress UI
    }

    setWpm(wpm) {
        this.wpm = parseInt(wpm);
    }

    setConfig(newConfig) {
        this.config = {
            punctuationFactors: { ...this.config.punctuationFactors, ...newConfig.punctuationFactors },
            factors: { ...this.config.factors, ...newConfig.factors }
        };
    }

    play() {
        if (this.isPlaying && (!this.isRamping || this.rampType === 'up')) return;

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.isRamping = true;
            this.rampType = 'up';
            this.rampStep = 0;
            this.run();
        } else if (this.isRamping && this.rampType === 'down') {
            // Reverse to ramp up
            this.rampType = 'up';
            this.rampStep = Math.max(0, this.rampTotalSteps - this.rampStep);
        }
    }

    requestPause() {
        if (!this.isPlaying || (this.isRamping && this.rampType === 'down')) return;
        this.isRamping = true;
        this.rampType = 'down';
        this.rampStep = 0;
    }

    pause() {
        this.isPlaying = false;
        this.isRamping = false;
        this.rampType = null;
        if (this.timer) clearTimeout(this.timer);
    }

    restart() {
        this.pause();
        this.currentIndex = 0;
        this.updateDisplay();
    }

    prev() {
        this.pause();
        this.currentIndex = Math.max(0, this.currentIndex - 1);
        this.updateDisplay();
    }

    next() {
        this.pause();
        this.currentIndex = Math.min(this.words.length - 1, this.currentIndex + 1);
        this.updateDisplay();
    }

    seek(index) {
        this.currentIndex = Math.min(this.words.length - 1, Math.max(0, index));
        this.updateDisplay();
    }

    updateDisplay(triggerCallback = true) {
        if (this.words.length === 0) return;
        const word = this.words[this.currentIndex];
        const parts = this.processWord(word);

        this.display.left.textContent = parts.left;
        this.display.focus.textContent = parts.focus;
        this.display.right.textContent = parts.right;

        if (triggerCallback && this.onProgress) {
            const percent = Math.floor((this.currentIndex / this.words.length) * 100);
            this.onProgress(percent, this.currentIndex);
        }
    }

    processWord(word) {
        if (word === '\\n') {
            return { left: '', focus: ' ', right: '' };
        }

        const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
        const cleanLen = cleanWord.length;

        let targetFocusIndex = 0;
        if (cleanLen <= 1) targetFocusIndex = 0;
        else if (cleanLen <= 5) targetFocusIndex = 1;
        else if (cleanLen <= 9) targetFocusIndex = 2;
        else if (cleanLen <= 13) targetFocusIndex = 3;
        else targetFocusIndex = 4;

        let charCount = 0;
        let originalFocusIndex = -1;

        for (let i = 0; i < word.length; i++) {
            if (/[\p{L}\p{N}]/u.test(word[i])) {
                if (charCount === targetFocusIndex) {
                    originalFocusIndex = i;
                    break;
                }
                charCount++;
            }
        }

        if (originalFocusIndex === -1) originalFocusIndex = 0;

        return {
            left: word.substring(0, originalFocusIndex),
            focus: word[originalFocusIndex],
            right: word.substring(originalFocusIndex + 1)
        };
    }

    calculateDelay(word) {
        const baseDelay = (60 * 1000) / this.wpm;
        const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
        const len = cleanWord.length;

        let factor = this.config.factors.base;
        if (len >= 6 && len <= 8) factor = this.config.factors.medium;
        else if (len >= 9 && len <= 12) factor = this.config.factors.long;
        else if (len >= 13 && len <= 16) factor = this.config.factors.extra;
        else if (len >= 17) factor = this.config.factors.massive;

        let extraFactor = 0;
        if (/[ ,;:!?]/.test(word)) {
            if (word.includes(',') || word.includes(';') || word.includes(':') || word.includes('!') || word.includes('?')) {
                extraFactor += this.config.punctuationFactors.symbols;
            }
        }
        if (word.includes('.')) extraFactor += this.config.punctuationFactors.period;
        if (word.includes('\\n')) extraFactor += this.config.punctuationFactors.newline;

        let delay = baseDelay * (factor + extraFactor);

        // Apply ramping multiplier
        if (this.isRamping) {
            let multiplier = 1;
            if (this.rampType === 'up') {
                // Starts slow (3x) and goes to 1x
                multiplier = 3 - (this.rampStep / this.rampTotalSteps) * 2;
            } else if (this.rampType === 'down') {
                // Starts at 1x and goes slow (3x)
                multiplier = 1 + (this.rampStep / this.rampTotalSteps) * 2;
            }
            delay *= multiplier;
        }

        return delay;
    }

    run() {
        if (!this.isPlaying) return;

        this.updateDisplay();

        const word = this.words[this.currentIndex];
        const delay = this.calculateDelay(word);

        this.timer = setTimeout(() => {
            if (this.isRamping) {
                this.rampStep++;
                if (this.rampStep >= this.rampTotalSteps) {
                    if (this.rampType === 'down') {
                        this.pause();
                        return;
                    } else {
                        this.isRamping = false;
                        this.rampType = null;
                        this.rampStep = 0;
                    }
                }
            }

            this.currentIndex++;
            if (this.currentIndex < this.words.length) {
                this.run();
            } else {
                this.isPlaying = false;
                if (this.onComplete) this.onComplete();
            }
        }, delay);
    }
}

