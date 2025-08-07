# Medical Records – James Saint

This repository powers a structured and styled personal medical portal, published via GitHub Pages.

**Live site:** [https://jamessaint.github.io/medical/](https://jamessaint.github.io/medical/)

---

## Overview

The portal is designed for clarity, accessibility, and personal ownership of health records. Each section reflects a specific area of medical focus, with clean Bootstrap styling, breadcrumbs, and consistent typography (Montserrat). All HTML outputs are responsive and printable.

---

## Structure

```
/medical/
│
├── index.html                  # Medical Home (links to all record categories)
│
├── neurological/
│   ├── index.html              # Neurological Records overview
│   ├── Neurology_Cardiology_Summary.html
│   ├── Comprehensive-Neurological-Report_14072025.html
│   └── letters/                # PDF correspondence (GP, consultants, referrals, etc.)
│
└── gastrointestinal/
    ├── index.html              # Gastrointestinal Letters overview
    └── letters/                # PDF correspondence
```

---

## Updating Content

### 🔹 To Add a New PDF Letter

1. Save the file to the appropriate folder, e.g.:
   ```
   /neurological/letters/your-filename.pdf
   /gastrointestinal/letters/your-filename.pdf
   ```

2. Update the `index.html` in the corresponding folder to add a new `<li>` entry under `Letters & Supporting Reports`, maintaining chronological order and clean link structure.

3. Commit and push to GitHub. GitHub Pages will update automatically.

---

## Styling Reference

- Bootstrap 5.3 via CDN
- Font: Montserrat (Google Fonts)
- Background: `#EEEEEE`
- Text: `#003366`
- Accent: `#C9B694` (gold)
- Seed of Life symbol used as Open Graph preview image

---

## License

All medical data is personal, private, and protected. This repo is not open source or licensed for reuse.

---

© James Saint 2025
