# PDF Export Redesign - Complete Data Capture

**Date:** 2026-02-26
**Status:** Approved

## Problem

The current PDF export captures approximately 40-45% of data entered into the tool. Since the tool stores data locally in the browser, there is no other way for the NHS team to record and store assessment data. The PDF must serve as the complete data record.

Key gaps:
- Project details: 25% coverage (missing narrative, typology, build type, stage, GFA, team, revisions)
- Benefits: 27% coverage (only top 8 of 25+ items, no descriptions)
- Constraints: 50% field coverage (no descriptions)
- Category 0: 10% coverage (aggregate scores only, no item-level detail)
- PMV: 5% coverage (3 section summaries only, no element/package detail)
- Category 7: 50% field coverage (no descriptions)

## Approach

Extend the existing ReportGenerator.tsx with appendix pages. Keep a redesigned summary section up front for quick access, then append complete data as appendix.

## Design

### Page Structure

**FRONT SECTION (Summary)**

**Page 1 - Cover Page**
- NHS badge, report title
- Project name, Trust/Client, PSCP, Date
- Building typology, build type (new build/refurbishment/mixed)
- Business case stage + RIBA stage
- GFA (sqm)
- Refurbishment percentage (if applicable)
- Overall MMC Score with RAG badge
- Sub-scores: Category 0, PMV, Category 7

**Page 2 - Executive Summary**
Matches old Excel format:
- Project context line: "The project is mainly [typology, build type] with X% of the GFA being refurbishment"
- Project description text
- Three side-by-side score panels (Category 0 / PMV / Category 7), each showing:
  - Metric name and description of what it measures
  - Large score percentage
  - Benchmark range (varies by build type)
  - RAG badge
- Combined MMC Value section:
  - Large combined score
  - Formula explanation: PMV + (Cat 0 x 15%) + (Cat 7 x 15%)
- MMC Breakdown donut chart with legend (Cat 0 contribution, Structure PMV, Architecture PMV, Services PMV, Cat 7 contribution, Non-PMV/MMC)

**Page 3 - Key Findings**
- Benchmark comparison table (metric, score, benchmark, gap, status, RAG)
- PMV section contribution bars
- Top benefits (top 5 by points)
- High-severity constraints (score 8+)
- Score composition formula visualizer

**APPENDIX (Full Data Record)**

**Page A1 - Project Details**
- Section header: "Appendix A1: Project Details"
- Project narrative (full text)
- Team roster table: Role, Name, Organisation, Primary Contact
- Revision history table: Version, Date, Description
- Workshop attendees list (project details workshop)

**Page A2 - Benefits Scorecard**
- Section header: "Appendix A2: Benefits Scorecard"
- Workshop attendees
- Points budget summary (used/total/remaining)
- ALL benefit items grouped by category (Faster, Better, Sustainable Legacy, Economic):
  - Table per category: Name, Importance (1-10), Points, Description
  - Category subtotal/average

**Page A3 - Constraints Scorecard**
- Section header: "Appendix A3: Constraints Scorecard"
- Workshop attendees
- Summary metrics (average, severity counts)
- ALL constraint items table: Name, Score (1-10), Severity RAG, Description
- May span multiple pages if descriptions are long

**Page A4 - Category 0 Assessment Detail**
- Section header: "Appendix A4: Category 0 Assessment"
- Total score and percentage
- Per subcategory (0.1 Project Briefing, 0.2 Shell & Core, etc.):
  - Subcategory header with score/max/percentage
  - Item table: Name, Type (Y/N or Threshold), Value/Percentage Entered, Score, Max Score
  - Custom items marked with "(Custom)" label

**Page A5 - PMV Element Detail**
- Section header: "Appendix A5: PMV Calculation Detail"
- Total PMV and carbon compliance status
- Per section (Structure, Architecture, Building Services):
  - Section header with avg PMV and total PMV contribution
  - Element table: Number, Name, Section Group, BCIS %, MMC Categories, Element PMV %
  - Per element, package sub-rows: Package Description, Prelims %, Labour %, Package PMV %
  - Custom elements marked with "(Custom)" label
- No financial values (totalValue, supplierValue) - percentages only
- This section may span multiple pages (60+ elements possible)

**Page A6 - Category 7 Assessment Detail**
- Section header: "Appendix A6: Category 7 Innovations"
- Total adopted count and percentage
- Per section (Project Monitoring, Temporary Works, Robotics, etc.):
  - Section header
  - Item table: Name, Adopted (Yes/No), Description
  - Custom items marked with "(Custom)" label

### Footer

- Summary pages: "Page X of Y | MMC Assessment Report | [Date]"
- Appendix pages: "Appendix AX - Page Y of Z | MMC Assessment Report | [Date]"

### Styling

- Consistent with existing NHS colour palette and typography
- Appendix uses same table styles as summary section
- Description text in slightly smaller font (8pt) to fit more content
- Long descriptions truncated at ~200 characters with "..." if needed
- Custom item labels in italic grey text

### Data Flow

No changes to export trigger. The `generateAndDownloadReport(state)` function already receives the complete `MMCAssessmentState` object - the data is available, it just needs to be rendered.

### What Changes vs Current

1. Cover page: add typology, build type, stage, GFA fields
2. Executive summary: restructure to match Excel format (three score panels + combined MMC)
3. Current pages 3-7 (Benefits, Constraints, Cat 0, PMV, Cat 7 summaries) consolidated into page 3 "Key Findings"
4. 6 new appendix pages added with complete item-level data
5. All description fields rendered
6. All workshop attendees rendered
7. Custom items flagged
8. Footer updated with appendix numbering

### Files Changed

- `src/lib/pdf/ReportGenerator.tsx` - All changes in this single file
