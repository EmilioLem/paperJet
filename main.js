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
            'delay-symbols': 'Símbolos (, ; : ! ?)',
            'delay-period': 'Puntos (.)',
            'delay-newline': 'Nueva Línea (\\n)',
            'factor-medium': 'Factor Palabras (6-8)',
            'factor-long': 'Factor Palabras (9-12)',
            'factor-extra': 'Factor Palabras (13-16)',
            'factor-massive': 'Factor Palabras (17+)',
            'pause-settings': 'Ajustes de Tiempo',
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
            'delay-symbols': 'Symbols (, ; : ! ?)',
            'delay-period': 'Periods (.)',
            'delay-newline': 'New Line (\\n)',
            'factor-medium': 'Word Factor (6-8)',
            'factor-long': 'Word Factor (9-12)',
            'factor-extra': 'Word Factor (13-16)',
            'factor-massive': 'Word Factor (17+)',
            'pause-settings': 'Timing Settings',
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

    // Settings Panel Selectors
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const delaySymbols = document.getElementById('delay-symbols');
    const delayPeriod = document.getElementById('delay-period');
    const delayNewline = document.getElementById('delay-newline');
    const factorMedium = document.getElementById('factor-medium');
    const factorLong = document.getElementById('factor-long');
    const factorExtra = document.getElementById('factor-extra');
    const factorMassive = document.getElementById('factor-massive');

    // Initial Load Settings
    const savedLang = localStorage.getItem('paperjet-lang') || 'es';
    const savedTheme = localStorage.getItem('paperjet-theme') || 'theme-warm';

    langSelect.value = savedLang;
    themeSelect.value = savedTheme;
    document.body.className = savedTheme;

    // Load Timing Settings
    const loadTimingSettings = () => {
        let settings = JSON.parse(localStorage.getItem('paperjet-timing'));

        // Migration from old millisecond-based format
        if (settings && settings.delays) {
            settings.punctuationFactors = {
                symbols: (settings.delays.symbols / 1000) || 0.1,
                period: (settings.delays.period / 1000) || 0.3,
                newline: (settings.delays.newline / 1000) || 0.5
            };
            delete settings.delays;
        }

        if (!settings) {
            settings = {
                punctuationFactors: { symbols: 0.1, period: 0.3, newline: 0.5 },
                factors: { medium: 1.1, long: 1.2, extra: 1.35, massive: 1.5 }
            };
        }

        delaySymbols.value = settings.punctuationFactors?.symbols ?? 0.1;
        delayPeriod.value = settings.punctuationFactors?.period ?? 0.3;
        delayNewline.value = settings.punctuationFactors?.newline ?? 0.5;
        factorMedium.value = settings.factors.medium;
        factorLong.value = settings.factors.long;
        factorExtra.value = settings.factors.extra;
        factorMassive.value = settings.factors.massive;

        engine.setConfig(settings);
    };

    const saveTimingSettings = () => {
        const settings = {
            punctuationFactors: {
                symbols: parseFloat(delaySymbols.value),
                period: parseFloat(delayPeriod.value),
                newline: parseFloat(delayNewline.value)
            },
            factors: {
                medium: parseFloat(factorMedium.value),
                long: parseFloat(factorLong.value),
                extra: parseFloat(factorExtra.value),
                massive: parseFloat(factorMassive.value)
            }
        };
        localStorage.setItem('paperjet-timing', JSON.stringify(settings));
        engine.setConfig(settings);
    };

    loadTimingSettings();
    applyTranslations(savedLang);

    // Toggle Settings Panel
    settingsToggleBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

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

    // Timing logic
    [delaySymbols, delayPeriod, delayNewline, factorMedium, factorLong, factorExtra, factorMassive].forEach(el => {
        el.addEventListener('change', saveTimingSettings);
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
        const lang = langSelect.value;
        if (engine.isPlaying) {
            engine.pause();
            playPauseBtn.textContent = translations[lang]['play'];
        } else {
            // Auto-hide settings panel on play
            settingsPanel.classList.add('hidden');
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
