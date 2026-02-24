import { extractWordsFromPdf } from './pdf-processor.js';
import { RsvpEngine } from './rsvp-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const langSelect = document.getElementById('lang-select');
    const fileUpload = document.getElementById('file-upload');
    const wpmSelect = document.getElementById('wpm-select');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressSlider = document.getElementById('progress-slider');
    const progressText = document.getElementById('progress-text');
    const pdfNameDisplay = document.getElementById('pdf-name');
    const newlineToggle = document.getElementById('newline-pause-toggle');
    const breakSelect = document.getElementById('break-select');

    const readerContainer = document.getElementById('reader-container');
    const welcomeScreen = document.getElementById('welcome-screen');

    const displayElements = {
        left: document.getElementById('word-left'),
        focus: document.getElementById('word-focus'),
        right: document.getElementById('word-right')
    };

    const translations = {
        es: {
            'welcome-title': 'Bienvenido a PaperJet',
            'welcome-subtitle': 'Sube un PDF para empezar a leer a la velocidad de la luz.',
            'choose-pdf': 'Elegir PDF',
            'newline-pause': 'Pausa de Nueva Línea:',
            'break-every': 'Romper cada:',
            'never': 'Nunca',
            '1-para': '1 Párrafo',
            '3-para': '3 Párrafos',
            '5-para': '5 Párrafos',
            '10-para': '10 Párrafos',
            '15-para': '15 Párrafos',
            '30-para': '30 Párrafos',
            '50-para': '50 Párrafos',
            '100-para': '100 Párrafos',
            '250-para': '250 Párrafos',
            '500-para': '500 Párrafos',
            'play': 'Reproducir',
            'pause': 'Pausar',
            'restart': 'Reiniciar',
            'theme-light': 'Luz',
            'theme-dark': 'Oscuro',
            'theme-warm': 'Cálido'
        },
        en: {
            'welcome-title': 'Welcome to PaperJet',
            'welcome-subtitle': 'Upload a PDF to start reading at light speed.',
            'choose-pdf': 'Choose PDF',
            'newline-pause': 'Newline Pause:',
            'break-every': 'Break every:',
            'never': 'Never',
            '1-para': '1 Paragraph',
            '3-para': '3 Paragraphs',
            '5-para': '5 Paragraphs',
            '10-para': '10 Paragraphs',
            '15-para': '15 Paragraphs',
            '30-para': '30 Paragraphs',
            '50-para': '50 Paragraphs',
            '100-para': '100 Paragraphs',
            '250-para': '250 Paragraphs',
            '500-para': '500 Paragraphs',
            'play': 'Play',
            'pause': 'Pause',
            'restart': 'Restart',
            'theme-light': 'Light',
            'theme-dark': 'Dark',
            'theme-warm': 'Warm'
        }
    };

    function applyTranslations(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        // Update dynamic elements
        if (engine.isPlaying) {
            playPauseBtn.textContent = translations[lang]['pause'];
        } else {
            playPauseBtn.textContent = translations[lang]['play'];
        }
    }

    const engine = new RsvpEngine(displayElements);

    // Initial Load Settings
    const savedLang = localStorage.getItem('paperjet-lang') || 'es';
    const savedTheme = localStorage.getItem('paperjet-theme') || 'theme-warm';

    langSelect.value = savedLang;
    themeSelect.value = savedTheme;
    document.body.className = savedTheme;
    applyTranslations(savedLang);

    // Theme logic
    themeSelect.addEventListener('change', (e) => {
        document.body.className = e.target.value;
        localStorage.setItem('paperjet-theme', e.target.value);
    });

    // Language logic
    langSelect.addEventListener('change', (e) => {
        applyTranslations(e.target.value);
        localStorage.setItem('paperjet-lang', e.target.value);
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

    newlineToggle.addEventListener('change', (e) => {
        engine.newlineEnabled = e.target.checked;
    });

    breakSelect.addEventListener('change', (e) => {
        engine.breakEvery = parseInt(e.target.value);
    });

    playPauseBtn.addEventListener('click', () => {
        const lang = langSelect.value;
        if (engine.isPlaying) {
            engine.pause();
            playPauseBtn.textContent = translations[lang]['play'];
        } else {
            engine.play();
            playPauseBtn.textContent = translations[lang]['pause'];
        }
    });

    restartBtn.addEventListener('click', () => {
        engine.restart();
        playPauseBtn.textContent = translations[langSelect.value]['play'];
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
        playPauseBtn.textContent = translations[langSelect.value]['play'];
    };
});
