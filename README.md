# Medical Records — James Saint

This repository hosts the public, redacted view of James Saint’s medical records, timelines, and supporting documents. It is published via GitHub Pages here:

**Site:** https://jamessaint.github.io/medical/

---

## Repository Structure

- `index.html` — Hub page linking to all sections of the medical record.
- `neurological/` — Neurology-focused records and visuals.
  - `Neurology_Cardiology_Summary.html` — Core clinical record summarising findings, hypotheses, investigations, treatment trials, and key correspondence.
  - `Occipital_Scalp_Changes_Nerve_Path_Mapping.html` — Visual mapping of occipital nerve territories with labelled images and notes on associated scalp changes.
  - `images/` — Image assets used by the neurological pages (figures, annotated MR images, diagrams).
  - `letters/` — Redacted consultant and GP correspondence (PDF). Filenames use date-first naming for chronology.
- (Optional future) `supplements/`, `cardiology/`, `rehab/` — Additional sections can follow the same layout and style conventions as the neurology folder.

---

## Clinical Correspondence (Redacted)

The following neurologist / GP letters are archived under `neurological/letters/` (dates in UK format, filenames kebab‑case):

| Date        | Description                                                         | Filename                                           |
|-------------|---------------------------------------------------------------------|---------------------------------------------------|
| 24 Apr 2025 | Private referral via Doctor Care Anywhere (Dr Krishni Kumar)        | `gp-referral-2442025-redacted.pdf`                |
| 18 May 2025 | Initial neurology assessment; suspected C2–C3 involvement           | `18-05-2025-gp-letter-001575064_redacted.pdf`     |
| 10 Jul 2025 | MRI follow‑up; right cerebellar infarct and myelitis suspicion      | `10-07-2025-gp-letter-001614424_redacted.pdf`     |
| 03 Aug 2025 | Lumbar puncture procedure and post‑operative note                   | `03-08-2025-gp-letter-001622984_redacted.pdf`     |
| 17 Aug 2025 | Post‑CSF review and cervical 3T imaging plan                        | `17-08-2025-g-p--letter-001633154_redacted.pdf`   |
| 08 Oct 2025 | Updated diagnostic hypothesis; brainstem stroke; carbamazepine trial| `08-10-2025-g-p-letter-001666084-redacted.pdf`    |

> Add new letters to this table as they are added to `/neurological/letters/`.

---

## Editing & Publishing

1. **Redact before commit**  
   Remove personal identifiers that are not already public. Prefer PDF with visible redactions.

2. **File naming**  
   Use `DD-MM-YYYY-description-or-id_redacted.pdf` for letters. Use lowercase, hyphen‑separated names.

3. **Linking new items**  
   - Add a table row under “Clinical Correspondence” above.
   - Link new documents from `Neurology_Cardiology_Summary.html` inside the **Correspondence** section.
   - If adding a new HTML page, include it on `index.html` for discoverability.

4. **Design system (for HTML pages)**  
   - HTML5, Bootstrap 5.3, **Montserrat** font only.  
   - Colours: background `#EEEEEE`, headings `#003366`, accents `#C9B694`.  
   - Cards: light‑cream `#fefbf3` with a gold left border.  
   - Responsive, mobile‑first layout. No emoji icons. No em dashes.  
   - Include Open Graph and Twitter Card metadata with a sensible default image.

5. **Publish**  
   Push to `main` (or the publishing branch). GitHub Pages updates the site automatically at:  
   `https://jamessaint.github.io/medical/` and subpaths (for example `.../neurological/`).

---

## Changelog

**Last Updated:** 10 October 2025  
**Changes:**  
- Consolidated README for the entire `/medical` site; clarified structure and standards.  
- Documented neurology subpages and the letters archive.  
- Added editing, redaction, and publishing steps.  
- Aligned repository styling guidance with current site conventions (Bootstrap 5.3, Montserrat, colour system).

---

© James Saint 2025
