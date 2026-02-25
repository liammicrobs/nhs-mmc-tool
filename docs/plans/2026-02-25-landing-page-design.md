# Landing Page Design

**Date:** 2026-02-25
**Status:** Approved

## Goal

Add a professional landing page as the tool's front door. Users already understand MMC - this is about branding, credibility, and orientation rather than onboarding.

## Approach

Dedicated landing route at `/` replacing the current redirect to `/project-details`. No separate instructions page - the tool's numbered workflow and descriptive headers provide sufficient guidance.

## Route & Navigation

- **Route:** `/` serves the landing page (remove current redirect)
- **Sidebar:** Add "Home" link above the numbered steps, using a home icon (no step number). Active state matches existing step styling.

## Page Layout (top to bottom)

### 1. Hero Section
- NHS branding with tool title
- Heading: "NHS MMC Assessment Tool"
- Subtitle: "Modern Methods of Construction - Scoring & Benchmarking"
- Version tag (v3.0)

### 2. Purpose Statement
- Prominent card with 2-3 sentences
- What: captures project data, scores MMC adoption across Categories 0, 7 and PMV, produces RAG-benchmarked results
- Who: PSCP teams, NHS trust project leads

### 3. Workflow Overview
- Horizontal stepper or card row showing 7 steps
- Each step: number, name, one-line description
- Visual: connected dots/line conveying progression
- Each step clickable (navigates to that page)

### 4. Begin Assessment CTA
- Prominent button linking to Step 1 (`/project-details`)

### 5. Scoring Methodology Summary
- Small card at bottom
- Formula: Category 0 (15%) + PMV (70%) + Category 7 (15%) = Overall MMC %
- RAG thresholds: Green >= 70%, Amber >= 50%, Red < 50%

## Styling

- Uses existing NHS colour palette and component library (SectionCard, etc.)
- Clean, minimal - not text-heavy
- Consistent with rest of the application

## Files Changed

1. `src/app/page.tsx` - Replace redirect with landing page component
2. `src/components/layout/Sidebar.tsx` - Add Home link above numbered steps
