# Medical Records — James Saint

This repository hosts the public, redacted view of James Saint’s medical records, timelines, and supporting documents. It is published via GitHub Pages here:

**Site:** [https://jamessaint.github.io/medical/](https://jamessaint.github.io/medical/)

---

## Repository Structure

- `index.html` — Hub page linking to all sections of the medical record.
- `neurological/` — Neurology-focused records and visuals.
  - `Neurology_Cardiology_Summary.html` — Core clinical record summarising findings, hypotheses, investigations, treatment trials, and key correspondence.
  - `Occipital_Scalp_Changes_Nerve_Path_Mapping.html` — Visual mapping of occipital nerve territories with labelled images and notes on associated scalp changes.
  - `images/` — Image assets used by the neurological pages (figures, annotated MR images, diagrams).
  - `letters/` — Redacted consultant and GP correspondence (PDF). Filenames use date-first naming for chronology.
- `gastroenterology/` — Gastroenterology and colorectal correspondence and procedure reports.
  - `letters/` — All redacted letters and reports relating to abdominal, bowel, and colonoscopy investigations.
- (Optional future) `supplements/`, `cardiology/`, `rehab/` — Additional sections can follow the same layout and style conventions.

---

## Clinical Correspondence (Redacted)

### Neurology & GP

| Date        | Description                                                         | Filename                                           |
|-------------|---------------------------------------------------------------------|---------------------------------------------------|
| 24 Apr 2025 | Private referral via Doctor Care Anywhere (Dr Krishni Kumar)        | `gp-referral-2442025-redacted.pdf`                |
| 18 May 2025 | Initial neurology assessment; suspected C2–C3 involvement           | `18-05-2025-gp-letter-001575064_redacted.pdf`     |
| 10 Jul 2025 | MRI follow-up; right cerebellar infarct and myelitis suspicion      | `10-07-2025-gp-letter-001614424_redacted.pdf`     |
| 03 Aug 2025 | Lumbar puncture procedure and post-operative note                   | `03-08-2025-gp-letter-001622984_redacted.pdf`     |
| 17 Aug 2025 | Post-CSF review and cervical 3T imaging plan                        | `17-08-2025-g-p--letter-001633154_redacted.pdf`   |
| 08 Oct 2025 | Updated diagnostic hypothesis; brainstem stroke; carbamazepine trial| `08-10-2025-g-p-letter-001666084-redacted.pdf`    |

### Gastroenterology

| Date        | Description                                               | Filename                                                      |
|-------------|-----------------------------------------------------------|---------------------------------------------------------------|
| 24 Mar 2025 | Private Referral (Dr M Mottaleb, Doctor Care Anywhere)   | `private-refferal_redacted.pdf`                               |
| 02 Apr 2025 | Initial Appointment (Dr Richard Ellis)                   | `02-04-2025-appointment-letter-np-spire-000288604_redacted.pdf` |
| 10 Apr 2025 | GP Letter to Dr Smiley                                   | `10-04-2025-g-p-letter-000289884_redacted.pdf`                |
| 14 Apr 2025 | Admission Letter (Spire Portsmouth)                      | `14-04-2025-admission-letter-000290494_redacted.pdf`          |
| 06 May 2025 | Colonoscopy Report                                       | `colonoscopy-report-redacted.pdf`                             |
| 06 May 2025 | Post-Colonoscopy Summary (for GP)                        | `post-colonoscopy-report-for-gp-redacted.pdf`                 |
| 07 May 2025 | Follow-up Appointment (Dr Richard Ellis)                 | `07-05-2025-appointment-letter-fu-spire-000292914_redacted.pdf` |
| 15 Jul 2025 | Follow-up Appointment (Dr Richard Ellis)                 | `15-07-2025-appointment-letter-fu-spire-000297954_redacted.pdf` |

> All files above are hosted under `/medical/neurological/letters/` or `/medical/gastroenterology/letters/` as applicable.  
> Redactions remove personal identifiers and maintain clinical accuracy.

---

## Editing & Publishing

1. **Redact before commit**  
   Remove personal identifiers that are not already public. Prefer PDF with visible black-bar redactions.

2. **File naming**  
   Use `DD-MM-YYYY-description-or-id_redacted.pdf` for letters. Use lowercase, hyphen-separated names.

3. **Linking new items**  
   - Add a table row under “Clinical Correspondence” above.
   - Link new documents from the relevant HTML summary page (e.g., `Neurology_Cardiology_Summary.html` or `Gastroenterology_Summary.html`).
   - Include new HTML pages in `index.html` for discoverability.

4. **Design system (for HTML pages)**  
   - HTML5, Bootstrap 5.3, **Montserrat** font only.  
   - Colours: background `#EEEEEE`, headings `#003366`, accents `#C9B694`.  
   - Cards: light-cream `#fefbf3` with a gold left border.  
   - Responsive, mobile-first layout. No emoji icons. No em dashes.  
   - Include Open Graph and Twitter Card metadata with a sensible default image.

5. **Publish**  
   Push to `main` (or the publishing branch). GitHub Pages updates the site automatically at:  
   [https://jamessaint.github.io/medical/](https://jamessaint.github.io/medical/) and subpaths.

---

## Changelog

**Last Updated:** 10 October 2025  
**Changes:**  
- Added gastroenterology and GP correspondence section.  
- Linked new redacted letters for March–July 2025.  
- Clarified repository structure and HTML design conventions.  
- Ensured consistent naming and formatting across neurology and gastroenterology records.

---

© James Saint 2025
