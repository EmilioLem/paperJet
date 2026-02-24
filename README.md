# PaperJet ✈️

A modern, minimal PDF RSVP (Rapid Serial Visual Presentation) reader. Read PDFs at light speed with Spritz-style highlighting.

## Features
- **PDF Extraction**: Converts PDF content into a readable stream.
- **RSVP Engine**: Highlights the optimal focus point for each word.
- **Customizable Themes**: Light, Dark, and Soft Warm modes.
- **Localization**: Supports English and Spanish interfaces.
- **Persistent Settings**: Remembers your preferred theme, language, and reading progress automatically.
- **Variable Speed**: Ultra-low to high speed (50 to 2000 WPM).

## RSVP Rules

### Highlighting (Focus Point)
PaperJet uses a specific lookup table to position the focus character:
- Length 1: Index 0
- Length 2–5: Index 1
- Length 6–9: Index 2
- Length 10–13: Index 3
- Length 14+: Index 4

*Note: Punctuation is ignored for position calculations.*

### Timing & Delays
To improve comprehension, PaperJet adjusts the speed based on word length and punctuation:

#### Length Factors
- 1–5 characters: 1.0x (base)
- 6–8 characters: 1.2x
- 9–12 characters: 1.4x
- 13–16 characters: 1.7x
- 17+ characters: 2.0x

#### Punctuation Delays
- `,`: +100 ms
- `;`: +140 ms
- `:`: +160 ms
- `.`: +220 ms
- `?` or `!`: +250 ms
- Newline: +300 ms (can be disabled via "Newline Pause" toggle)

### Paragraph Breaks
The "Break every" selector allows you to insert a **3-second pause** after a specific number of paragraphs (marked by newlines in the PDF). This is useful for absorbing content in chunks.

## Development
```bash
npm install
npm run dev
```
