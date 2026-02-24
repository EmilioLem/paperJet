import { extractWordsFromPdf } from './pdf-processor.js';
import { RsvpEngine } from './rsvp-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const fileUpload = document.getElementById('file-upload');
    const wpmSelect = document.getElementById('wpm-select');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressSlider = document.getElementById('progress-slider');
    const progressText = document.getElementById('progress-text');
    const pdfNameDisplay = document.getElementById('pdf-name');

    const readerContainer = document.getElementById('reader-container');
    const welcomeScreen = document.getElementById('welcome-screen');

    const displayElements = {
        left: document.getElementById('word-left'),
        focus: document.getElementById('word-focus'),
        right: document.getElementById('word-right')
    };

    const engine = new RsvpEngine(displayElements);

    // Theme logic
    themeSelect.addEventListener('change', (e) => {
        document.body.className = e.target.value;
    });

    // File upload logic
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        welcomeScreen.classList.add('hidden');
        readerContainer.classList.remove('hidden');
        pdfNameDisplay.textContent = file.name;

        try {
            const words = await extractWordsFromPdf(file);
            const savedIndex = localStorage.getItem(`paperjet-progress-${file.name}`);
            const startIndex = savedIndex ? parseInt(savedIndex) : 0;

            engine.setWords(words, startIndex);
            progressSlider.max = words.length - 1;
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Failed to process PDF. Please try another one.');
        }
    });

    // Control logic
    wpmSelect.addEventListener('change', (e) => {
        engine.setWpm(e.target.value);
    });

    playPauseBtn.addEventListener('click', () => {
        if (engine.isPlaying) {
            engine.pause();
            playPauseBtn.textContent = 'Play';
        } else {
            engine.play();
            playPauseBtn.textContent = 'Pause';
        }
    });

    restartBtn.addEventListener('click', () => {
        engine.restart();
        playPauseBtn.textContent = 'Play';
    });

    prevBtn.addEventListener('click', () => engine.prev());
    nextBtn.addEventListener('click', () => engine.next());

    progressSlider.addEventListener('input', (e) => {
        engine.seek(parseInt(e.target.value));
    });

    engine.onProgress = (percent, index) => {
        progressSlider.value = index;
        progressText.textContent = `${percent}%`;

        // Save progress if a file is loaded
        if (engine.words.length > 0) {
            const fileName = pdfNameDisplay.textContent;
            if (fileName) {
                localStorage.setItem(`paperjet-progress-${fileName}`, index);
            }
        }
    };

    engine.onComplete = () => {
        playPauseBtn.textContent = 'Play';
    };
});
