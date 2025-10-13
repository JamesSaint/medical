# Global Stylesheet Notes  
**File:** `global_styles.css`  
**Author:** James Saint  
**Purpose:** Shared styling foundation for all HTML pages across the *Medical / Neurological* repository and related sites.

---

## 🔹 Overview
This stylesheet defines the global layout, color system, and responsive table behavior for James’s documentation pages.  
It follows a numbered section structure to make updates predictable and traceable.

---

## 🔹 Table of Contents
| No. | Section | Description |
|-----|----------|-------------|
| 01 | **Global layout & typography** | Body, base font, alignment, container widths |
| 02 | **Headings** | Consistent typographic rhythm and gold dividers |
| 03 | **Utilities & common elements** | Shared spacing, `.section`, `.card-like`, `.note` |
| 04 | **Links** | Navy link color with hover underline |
| 05 | **Breadcrumbs** | Minimal navigation with gold chevrons |
| 06 | **Tables – shared structure** | Base responsive table formatting |
| 07 | **Appointments table** | Compact date, flexible description, tidy location |
| 08 | **Symptom Overview** | Fixed layout for three columns (Category, Description, Impact) |
| 09 | **Recent Events table** | Compact date column and smart wrapping |
| 10 | **Brand color overrides (Bootstrap)** | Harmonises buttons, forms, and accents with palette |
| 11 | **Carbamazepine Tracker – Desktop/Tablet** | Data table formatting for large screens |
| 12 | **Carbamazepine Tracker – Mobile** | Card-style responsive layout for mobile devices |

---

## 🔹 Palette
| Name | Hex | Usage |
|------|-----|--------|
| **Navy** | `#003366` | Primary text, headings, UI elements |
| **Gold** | `#C9B694` | Borders, accents, brand highlights |
| **Cream** | `#fefbf3` | Card backgrounds |
| **Grey** | `#EEEEEE` | Page background |

All colors align with the wider *James Saint Core Theme* aesthetic.

---

## 🔹 Design Principles
- **Clarity:** readable structure with predictable spacing  
- **Continuity:** consistent palette and typography across all pages  
- **Accessibility:** strong contrast ratios; large touch targets for buttons  
- **Scalability:** media queries at 600 px and 575.98 px breakpoints  
- **Maintainability:** numbered sections and top index comment for quick navigation  

---

## 🔹 Future Additions
When extending this file:
1. Add new modules in sequence (e.g., `13. Charts`, `14. Modal Styling`).
2. Update the header Table of Contents at the top of the file.
3. Preserve indentation and comment style (`/* ========================================================= */`).
4. Use `card-like`, `note`, and `section` classes for visual consistency.
5. Keep all new colors within the existing palette unless introducing a deliberate variant.

---

## 🔹 Maintenance Tips
- Always test tables on mobile — overflow and padding vary per browser.  
- Avoid inline styles; apply or extend via CSS classes.  
- Document any new selectors directly in this README for traceability.  
- Retain the `noindex, nofollow` meta tag on medical documentation pages.

---

**© James Saint 2025**  
_All styling decisions align with the James Saint Core CSS Standard._
