# MMC Portfolio Dashboard - Design Document

**Date:** 2026-03-06
**Status:** Approved

## Overview

A portfolio-level analytics dashboard integrated into the existing NHS MMC Assessment Tool. It consumes exported `.mmc.json` files from individual project assessments and produces the cross-project analysis shown in the ProCure23 PowerPoint ("Analysis of NHS MMC Toolkit in use across ProCure 23 and the wider NHS").

The dashboard enables NHS programme teams to:
- Import multiple assessment exports via drag-and-drop
- View aggregate portfolio metrics with RAG benchmarking
- Analyse trends by building typology, business case stage, and project
- Correlate standardisation (Category 0) with PMV and combined scores
- Understand benefits distribution and prioritisation patterns
- Identify PMV opportunities through element-level analysis
- Drill into individual projects for detailed comparison

## Architecture

### Integration with Existing App

New route group within the existing Next.js app:

```
/dashboard                    - Import & Portfolio management
/dashboard/executive-summary  - Part 1: Exec summary analysis
/dashboard/benefits           - Part 2: Benefits scorecard analysis
/dashboard/pmv                - Part 3: PMV calculation analysis
/dashboard/project/[id]       - Individual project deep-dive
```

### Shared Code

Reuses from the existing assessment tool:
- **Types** (`src/types/index.ts`) - all data model interfaces
- **Validation** (`src/lib/validation/assessment-schema.ts`) - Zod schema for import validation
- **Calculations** (`src/lib/calculations/`) - scoring functions for individual projects
- **UI Components** (`RAGBadge`, `SectionCard`, `PageHeader`, `ProgressBar`)
- **NHS colour variables** from `globals.css`
- **Recharts** (already a dependency) for all interactive charts

### New Code

- `src/lib/store/dashboard-store.ts` - Zustand store for portfolio data (persisted to localStorage key: `nhs-mmc-dashboard`)
- `src/lib/calculations/portfolio.ts` - Aggregate calculation functions (averages by typology, business case stage, R-squared correlation, etc.)
- `src/components/dashboard/` - Dashboard-specific components
- `src/app/dashboard/` - Dashboard page routes

### Data Flow

1. User drags `.mmc.json` files onto the import page
2. Files validated against the existing Zod schema
3. Valid projects stored in the dashboard Zustand store (localStorage)
4. Dashboard pages read from the store and compute aggregate analysis
5. Duplicate detection by trust name + project description

### Navigation

Dashboard gets its own sidebar (reuses the `LayoutShell` pattern):
- NHS dark blue sidebar matching the assessment tool
- "MMC Portfolio Dashboard" branding at top
- Portfolio stats summary (project count, avg MMC %, RAG badge)
- Nav links: Import, Exec Summary, Benefits, PMV
- "Switch to Assessment Tool" link at bottom
- The existing assessment tool sidebar gets a reciprocal "Open Dashboard" button

---

## Page Designs

### 1. Import & Portfolio Page (`/dashboard`)

**Drag-and-drop zone:**
- Large drop zone with dashed NHS blue border
- Accepts `.mmc.json` and `.json` files (multiple at once)
- File validation with green tick/red X per file and error messages
- Duplicate detection

**Portfolio summary cards** (visible once projects are loaded):
- Total Projects imported
- Average Overall MMC % with RAG badge
- Average Category 0 / PMV / Category 7 scores
- Typology breakdown (count per type)

**Portfolio table:**
- Columns: Project Name, Typology, Build Type, Business Case Stage, RIBA Stage, Overall MMC %, RAG Status, Date Imported
- Sortable, filterable by typology/build type/business case stage
- Row click navigates to `/dashboard/project/[id]`
- Delete per row (with confirmation)

### 2. Executive Summary Analysis (`/dashboard/executive-summary`)

Mirrors PowerPoint Part 1 (Slides 5-12).

**2a. Portfolio Averages:**
- 4 metric cards: Category 0 %, PMV %, Category 7 %, Combined MMC %
- RAG badges, mini sparkline trends

**2b. Scores by Typology:**
- Clustered bar chart: Cat 0, PMV, Cat 7, Combined per typology (New Build, Refurb, Mixed)
- Data table with exact values

**2c. Scores by Business Case Stage:**
- Line chart: scores from SOC to OBC to FBC
- Shows anticipated decrease pattern

**2d. Standardisation Correlation:**
- 3 scatter plots with R-squared trendlines:
  - Category 0 vs PMV
  - Category 0 vs Category 7
  - Category 0 vs Combined MMC
- Auto-generated interpretation

**2e. Narrative Insights:**
- Auto-generated key findings based on the data

### 3. Benefits Analysis (`/dashboard/benefits`)

Mirrors PowerPoint Part 2 (Slides 13-27).

**3a. Distribution Overview:**
- 100% stacked bar chart: Faster/Better/Sustainable Legacy/Economic per project
- Aggregate donut chart of 4 categories

**3b. Benefits by Typology:**
- Clustered bar chart of category averages per typology
- Top 5 priorities table per typology (auto-ranked)

**3c. Benefits by Business Case Stage:**
- Line chart: category averages across SOC/OBC/FBC

**3d. Benefits Impact Correlation:**
- Scatter/line charts with R-squared:
  - Benefits vs Category 0
  - Benefits vs PMV
  - Benefits vs Combined MMC

**3e. Benefits Trends (Importance):**
- Bar chart of average importance scores for all sub-benefits
- Grouped by People/Time/Cost/Quality themes
- Filterable by typology

### 4. PMV Analysis (`/dashboard/pmv`)

Mirrors PowerPoint Part 3 (Slides 28-36).

**4a. PMV Overview:**
- Average PMV % with RAG badge
- Carbon compliance pass rate
- PMV by section: Structure, Architecture, Building Services

**4b. BCIS Element Trends:**
- Horizontal bar chart of average PMV per BCIS element
- Sorted by contribution, colour-coded by section

**4c. Low-Utilised Elements:**
- Table: Element, PMV Potential %, Actual Utilisation %, Gap
- Highlights opportunities

**4d. High-Cost Element Analysis:**
- Scatter plot: Element cost % vs PMV attainment %

**4e. PMV Distribution by Project:**
- Heatmap/small multiples of PMV breakdown per project

### 5. Project Deep-Dive (`/dashboard/project/[id]`)

**5a. Project Header:**
- Trust/PSCP, typology, build type, stage, GFA
- Overall MMC % with RAG badge, percentile rank vs portfolio

**5b. Score Breakdown:**
- Category 0, PMV, Category 7 cards with weighted contributions
- Visual formula bar

**5c. Benefits Profile:**
- Radar chart overlaid with portfolio average
- Top 5 priorities

**5d. PMV Element Breakdown:**
- Bar chart per element, compared to portfolio average
- Expandable package detail

**5e. Category 0 & 7 Detail:**
- Category 0 checklist (pass/fail)
- Category 7 innovations list (adopted/not)

---

## Colour Theme & Branding

Uses the existing NHS colour palette from `globals.css`:
- Primary: `#005EB8` (NHS Blue)
- Dark: `#003087` (sidebar background)
- RAG: Green `#007F3B`, Amber `#FFB81C`, Red `#DA291C`
- Backgrounds: `#F0F4F5` (pale grey)
- Text: `#212B32` (dark), `#4C6272` (grey)

Chart colour palette for series:
- Structure: `#005EB8` (NHS Blue)
- Architecture: `#00A499` (NHS Aqua Green)
- Building Services: `#41B6E6` (NHS Light Blue)
- Benefit categories: Faster `#41B6E6`, Better `#005EB8`, Sustainable `#00A499`, Economic `#0072CE`

---

## Technical Notes

- **R-squared calculation**: Implemented client-side using least-squares regression
- **Chart library**: Recharts (already installed) for all visualisations
- **State management**: Separate Zustand store to avoid conflicts with assessment data
- **Responsive**: All dashboard pages responsive with mobile-friendly chart sizing
- **No server-side**: All computation client-side, no API needed
