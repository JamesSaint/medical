# Medical Records — James Saint

This repository contains a redacted, public-facing archive of James Saint’s medical records, correspondence, reports, and timelines. It is published via GitHub Pages:

**Site:** https://jamessaint.github.io/medical/

---

## Site Overview & Navigation

The published site has a “Medical Home” landing page that links to the different specialty sections:

- **Neurological Records**  
- **Gastroenterology / GI & Colonoscopy Records**  

Each section includes:
- A summary page (HTML) giving narrative context  
- A `letters/` folder with redacted PDF correspondence and reports  
- Images and supplemental files as needed  

---

## Repository Structure

```
/ (root)
  index.html                  ← Main hub / landing (“Medical Home”)
  README.md                   ← This file
  neurological/
    Neurology_Cardiology_Summary.html
    Occipital_Scalp_Mapping.html
    letters/
      *.pdf (redacted)
    images/
      *.png, *.jpg, *.svg
  gastroenterology/
    Gastro_Summary.html        ← (or similar naming)
    letters/
      *.pdf (redacted)
  (optional) other specialties...
```

---

## Clinical Correspondence (Redacted)

### Neurology & GP Correspondence

| Date         | Description                                                     | Filename                                             |
|---------------|-----------------------------------------------------------------|------------------------------------------------------|
| 24 April 2025 | Private referral via Doctor Care Anywhere                      | `gp-referral-2442025-redacted.pdf`                   |
| 18 May 2025    | Initial neurology assessment                                    | `18-05-2025-gp-letter-001575064_redacted.pdf`        |
| 10 July 2025   | Follow-up & imaging (MRI, CT, bubble echo plan)                 | `10-07-2025-gp-letter-001614424_redacted.pdf`        |
| 03 August 2025 | Lumbar puncture note & outcome                                  | `03-08-2025-gp-letter-001622984_redacted.pdf`        |
| 17 August 2025 | Post‑CSF review & cervical spine imaging plan                   | `17-08-2025-g-p--letter-001633154_redacted.pdf`      |
| 08 October 2025| Brainstem stroke hypothesis & carbamazepine trial               | `08-10-2025-g-p-letter-001666084-redacted.pdf`       |

### Gastroenterology / GI Correspondence & Reports

| Date         | Description                                               | Filename                                                        |
|---------------|-----------------------------------------------------------|-------------------------------------------------------------------|
| 24 March 2025 | Private referral (Dr M Mottaleb)                         | `private-refferal_redacted.pdf`                                  |
| 02 April 2025 | Initial appointment (Dr Richard Ellis)                   | `02-04-2025-appointment-letter-np-spire-000288604_redacted.pdf`  |
| 10 April 2025 | GP letter to Dr Smiley                                   | `10-04-2025-g-p-letter-000289884_redacted.pdf`                   |
| 14 April 2025 | Admission letter (Spire Portsmouth)                      | `14-04-2025-admission-letter-000290494_redacted.pdf`             |
| 06 May 2025    | Colonoscopy report                                       | `colonoscopy-report-redacted.pdf`                                |
| 06 May 2025    | Post‑colonoscopy summary (for GP)                        | `post-colonoscopy-report-for-gp-redacted.pdf`                    |
| 07 May 2025    | Follow-up appointment (Dr Richard Ellis)                 | `07-05-2025-appointment-letter-fu-spire-000292914_redacted.pdf`  |
| 15 July 2025   | Follow-up appointment (Dr Richard Ellis)                 | `15-07-2025-appointment-letter-fu-spire-000297954_redacted.pdf`  |

> All files live in either `neurological/letters/` or `gastroenterology/letters/` depending on context.  
> Redactions are applied to remove personal identifiers, while preserving clinical relevance.

---

## Guidelines for Adding Records

1. **Redaction & Review**  
   - Always remove or black-bar personal identifiers (names, addresses, NHS numbers, etc.) before committing.  
   - Review each document for inadvertent metadata (PDF properties, hidden text, etc.).

2. **File Naming Conventions**  
   - Use `DD-MM-YYYY-description-or-id_redacted.pdf`  
   - Use lowercase, hyphens, and keep names concise but descriptive.

3. **Updating HTML Pages**  
   - Add new entries in the “Clinical Correspondence” table in the relevant section’s HTML or summary page.  
   - In `index.html` (“Medical Home”), ensure the new section is linked.

4. **Styling & Theme Consistency**  
   - Font: **Montserrat** (use only this)  
   - Colours:
     - Background: `#EEEEEE`
     - Headings: `#003366`
     - Accent / border elements: `#C9B694`
   - Card container style:  
     - Light cream background (e.g. `#fefbf3`)  
     - Gold accent border on left  
   - Layout: Mobile-first, responsive, no emoji icons, no em-dashes, consistent margin/padding
   - Include Open Graph & Twitter Card metadata on each page (with a default fallback image).

5. **Publishing**  
   - Commit changes to `main` (or whatever branch you use for GitHub Pages).  
   - The site should auto-publish at:  
     `https://jamessaint.github.io/medical/` and subpages.

---

## Changelog & Versioning

- **Last updated:** `10 October 2025`  
- **Key changes:**  
  - Added GI / Gastroenterology section to README  
  - Updated naming and table layouts for consistency  
  - Clarified guidelines for redaction, file naming, and style

---

© James Saint 2025
