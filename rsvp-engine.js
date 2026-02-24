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

        // New controls
        this.newlineEnabled = true;
        this.breakEvery = 0; // 0 means never
        this.paragraphCount = 0;
    }

    setWords(words, startIndex = 0) {
        this.words = words;
        this.currentIndex = startIndex;
        this.updateDisplay(false); // Skip callback during initial set
    }

    setWpm(wpm) {
        this.wpm = parseInt(wpm);
    }

    play() {
        if (this.isPlaying || this.currentIndex >= this.words.length) return;
        this.isPlaying = true;
        this.run();
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) clearTimeout(this.timer);
    }

    restart() {
        this.pause();
        this.currentIndex = 0;
        this.paragraphCount = 0; // Reset count
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
        // Handle newline marker
        if (word === '\\n') {
            return { left: '', focus: ' ', right: '' };
        }

        // Highlighting rules:
        // Punctuation is not counted for index.
        const focusIndices = { 1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3, 13: 3 };

        // Strip punctuation for length check
        const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
        const cleanLen = cleanWord.length;

        let targetFocusIndex = 0;
        if (cleanLen <= 1) targetFocusIndex = 0;
        else if (cleanLen <= 5) targetFocusIndex = 1;
        else if (cleanLen <= 9) targetFocusIndex = 2;
        else if (cleanLen <= 13) targetFocusIndex = 3;
        else targetFocusIndex = 4;

        // Map target back to original word index
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

        // If no alphanumeric char found (just punctuation), focus the first char
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

        let factor = 1.0;
        if (len >= 6 && len <= 8) factor = 1.2;
        else if (len >= 9 && len <= 12) factor = 1.4;
        else if (len >= 13 && len <= 16) factor = 1.7;
        else if (len >= 17) factor = 2.0;

        let extra = 0;
        if (word.includes(',')) extra += 100;
        if (word.includes(';')) extra += 140;
        if (word.includes(':')) extra += 160;
        if (word.includes('.')) extra += 220;
        if (word.includes('?') || word.includes('!')) extra += 250;
        if (word.includes('\\n') && this.newlineEnabled) extra += 300;

        return (baseDelay * factor) + extra;
    }

    run() {
        if (!this.isPlaying) return;

        this.updateDisplay();

        const word = this.words[this.currentIndex];
        let delay = this.calculateDelay(word);

        // Handle "Break Every X Paragraphs"
        if (word === '\\n') {
            this.paragraphCount++;
            if (this.breakEvery > 0 && this.paragraphCount >= this.breakEvery) {
                delay = 3000; // 3 second break
                this.paragraphCount = 0; // Reset count after break
            }
        }

        this.timer = setTimeout(() => {
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
