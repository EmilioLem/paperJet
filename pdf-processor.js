import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts words and their associated punctuation/delays from a PDF file.
 * @param {File} file 
 * @returns {Promise<Array<{word: string, delay: number}>>}
 */
export async function extractWordsFromPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let allWords = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Join items with whitespace
        let lastY;
        let pageText = "";
        for (const item of textContent.items) {
            if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += "\\n ";
            }
            pageText += item.str + " ";
            lastY = item.transform[5];
        }

        // Tokenize by spaces
        const words = pageText.split(/\s+/).filter(w => w.length > 0);
        allWords.push(...words);
    }

    return allWords;
}
