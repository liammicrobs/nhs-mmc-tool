# PDF Export Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the PDF export to capture 100% of data entered into the tool, with a redesigned executive summary matching the old Excel format and full data appendix pages.

**Architecture:** Extend the existing `ReportGenerator.tsx` with new appendix page components. The cover page and executive summary are redesigned, current detail pages (3-7) are consolidated into a single Key Findings page, and 6 new appendix pages are added. All data flows from the existing `MMCAssessmentState` which is already passed to the report.

**Tech Stack:** React, @react-pdf/renderer, TypeScript, Zustand (state already available)

---

### Task 1: Add helper functions and new styles

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx:21-298`

**Step 1: Add new helper functions after existing helpers (after line 69)**

Add these utility functions after the existing `sectionLabel` function:

```typescript
function buildTypeLabel(bt: string): string {
  if (bt === 'new_build') return 'New Build';
  if (bt === 'refurbishment') return 'Refurbishment';
  return 'Mixed';
}

function businessCaseStageLabel(stage: string): string {
  const labels: Record<string, string> = { na: 'N/A', soc: 'SOC', obc: 'OBC', fbc: 'FBC', pc: 'Post-Completion' };
  return labels[stage] || stage.toUpperCase();
}

function ribaStageLabel(stage: string): string {
  return `RIBA ${stage}`;
}

function typologyLabel(t: string): string {
  const labels: Record<string, string> = {
    acute: 'Acute', primary_care: 'Primary Care', specialist: 'Specialist',
    mental_health: 'Mental Health', infrastructure: 'Infrastructure', other: 'Other',
  };
  return labels[t] || t;
}

function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}
```

**Step 2: Add new styles to the StyleSheet (before the closing of `StyleSheet.create`)**

Add these styles inside the `styles` object, before the closing `});` at line 298:

```typescript
  // Appendix styles
  appendixTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: NHS_DARK_BLUE,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: NHS_BLUE,
  },
  appendixSubtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NHS_BLUE,
    marginBottom: 6,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  customBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Oblique',
    color: TEXT_SECONDARY,
  },
  attendeesBox: {
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  attendeesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_SECONDARY,
    marginBottom: 3,
  },
  attendeesText: {
    fontSize: 8,
    color: TEXT_PRIMARY,
  },
  // Executive summary score panel (Excel-style)
  scorePanel: {
    flex: 1,
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 10,
    borderTopWidth: 3,
    borderTopColor: NHS_BLUE,
  },
  scorePanelTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NHS_DARK_BLUE,
    marginBottom: 4,
  },
  scorePanelDesc: {
    fontSize: 7,
    color: TEXT_SECONDARY,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  scorePanelValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: NHS_DARK_BLUE,
    textAlign: 'center',
    marginBottom: 4,
  },
  scorePanelBenchmark: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
```

**Step 3: Add imports for new types used in appendix pages**

Update the import on line 5:

```typescript
import type { MMCAssessmentState, RAGStatus, BenefitCategory, SectionPMV, PMVSection } from '@/types';
```

Also add the import for `computeElementPMV` and `computePackagePMV` and `computeCategory0ItemScore`:

```typescript
import { computeCategory0Total, computeSubcategoryScore, computeCategory0ItemScore } from '@/lib/calculations/category0';
import { computeTotalPMV, computeSectionPMV, allCarbonChecksPass, computeElementPMV, computePackagePMV, computeElementProjectContribution } from '@/lib/calculations/pmv';
```

**Step 4: Build and verify no errors**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Build succeeds (new functions/styles exist but aren't called yet)

**Step 5: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add helper functions and styles for export redesign"
```

---

### Task 2: Redesign cover page with project metadata

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx` - `CoverPage` component (lines 586-701)

**Step 1: Replace the CoverPage component**

Replace the entire `CoverPage` function with this version that adds typology, build type, stage, and GFA:

```typescript
function CoverPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const pd = state.projectDetails;
  const projectName = pd.projectDescription || 'Untitled Project';
  const trustName = pd.trustClientName || 'N/A';
  const pscpName = pd.pscpName || 'N/A';

  const summary = computeExecutiveSummary(state);
  const overallRag = ragFromPercentage(summary.overallMMCPercentage);
  const cat0Rag = ragFromPercentage(summary.category0Score);
  const pmvRag = ragFromPercentage(summary.pmvScore);
  const cat7Rag = ragFromPercentage(summary.category7Score);

  const stageText = [
    businessCaseStageLabel(pd.businessCaseStage),
    ribaStageLabel(pd.ribaStage),
  ].filter(Boolean).join(' / ');

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>NHS</Text>
      </View>
      <Text style={styles.coverTitle}>MMC Assessment Report</Text>
      <Text style={styles.coverSubtitle}>Modern Methods of Construction</Text>

      <View style={{ marginTop: 20 }}>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Project:</Text>
          <Text style={styles.coverValue}>{projectName}</Text>
        </View>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Trust / Client:</Text>
          <Text style={styles.coverValue}>{trustName}</Text>
        </View>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>PSCP:</Text>
          <Text style={styles.coverValue}>{pscpName}</Text>
        </View>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Typology:</Text>
          <Text style={styles.coverValue}>{typologyLabel(pd.buildingTypology)}</Text>
        </View>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Build Type:</Text>
          <Text style={styles.coverValue}>
            {buildTypeLabel(pd.buildType)}
            {pd.buildType !== 'new_build' && pd.refurbishmentPercentage > 0
              ? ` (${pd.refurbishmentPercentage}% refurbishment)`
              : ''}
          </Text>
        </View>
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Stage:</Text>
          <Text style={styles.coverValue}>{stageText}</Text>
        </View>
        {pd.gfaSqm > 0 && (
          <View style={styles.coverDetailRow}>
            <Text style={styles.coverLabel}>GFA:</Text>
            <Text style={styles.coverValue}>{pd.gfaSqm.toLocaleString()} sqm</Text>
          </View>
        )}
        <View style={styles.coverDetailRow}>
          <Text style={styles.coverLabel}>Date:</Text>
          <Text style={styles.coverValue}>{reportDate}</Text>
        </View>
      </View>

      {/* Separator line */}
      <View style={{ width: 320, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 28 }} />

      {/* Overall MMC score */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 11, color: '#8DB4E0', marginBottom: 6 }}>Overall MMC Score</Text>
        <Text style={{ fontSize: 42, fontFamily: 'Helvetica-Bold', color: WHITE }}>
          {summary.overallMMCPercentage.toFixed(1)}%
        </Text>
        <View style={{
          backgroundColor: ragColour(overallRag),
          borderRadius: 4,
          paddingVertical: 3,
          paddingHorizontal: 12,
          marginTop: 6,
        }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE }}>
            {ragLabel(overallRag)}
          </Text>
        </View>
      </View>

      {/* Sub-scores row */}
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
        {[
          { label: 'Category 0', score: summary.category0Score, rag: cat0Rag },
          { label: 'PMV Score', score: summary.pmvScore, rag: pmvRag },
          { label: 'Category 7', score: summary.category7Score, rag: cat7Rag },
        ].map(item => (
          <View key={item.label} style={{ alignItems: 'center', width: 100 }}>
            <Text style={{ fontSize: 8, color: '#8DB4E0', marginBottom: 4 }}>{item.label}</Text>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE }}>
              {item.score.toFixed(1)}%
            </Text>
            <View style={{
              backgroundColor: ragColour(item.rag),
              borderRadius: 3,
              paddingVertical: 2,
              paddingHorizontal: 8,
              marginTop: 4,
            }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE }}>{ragLabel(item.rag)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): redesign cover page with project metadata fields"
```

---

### Task 3: Redesign executive summary to match Excel format

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx` - `ExecutiveSummaryPage` component (lines 703-782)

**Step 1: Replace the ExecutiveSummaryPage component**

Replace the entire function with the Excel-matching three-panel layout:

```typescript
function ExecutiveSummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const summary = computeExecutiveSummary(state);
  const pd = state.projectDetails;

  const contextLine = `The project is mainly ${typologyLabel(pd.buildingTypology)}, ${buildTypeLabel(pd.buildType)}${
    pd.buildType !== 'new_build' && pd.refurbishmentPercentage > 0
      ? ` with ${pd.refurbishmentPercentage}% of the GFA being refurbishment`
      : ''
  }.`;

  const panels = [
    {
      title: 'Category 0',
      desc: 'Quantifies the level of pre-manufacturing design, standardisation and digital integration applied to the project.',
      score: summary.category0Score,
      benchmark: '35% to 45%',
    },
    {
      title: 'PMV',
      desc: 'Pre-Manufactured Value measures the proportion of construction value manufactured off-site relative to total project value.',
      score: summary.pmvScore,
      benchmark: '40% to 55%',
    },
    {
      title: 'Category 7',
      desc: 'Quantifies the adoption of site-based process innovations including digital tools, robotics and modern site practices.',
      score: summary.category7Score,
      benchmark: '40% to 50%',
    },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Project context */}
      <Text style={styles.paragraph}>{contextLine}</Text>
      {pd.projectDescription ? (
        <Text style={[styles.paragraph, { marginBottom: 12 }]}>{pd.projectDescription}</Text>
      ) : null}

      {/* Three score panels side by side */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {panels.map(p => (
          <View key={p.title} style={styles.scorePanel}>
            <Text style={styles.scorePanelTitle}>{p.title}</Text>
            <Text style={styles.scorePanelDesc}>{p.desc}</Text>
            <Text style={styles.scorePanelValue}>{p.score.toFixed(1)}%</Text>
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <RAGBadge status={ragFromPercentage(p.score)} />
            </View>
            <Text style={styles.scorePanelBenchmark}>Benchmark: {p.benchmark}</Text>
          </View>
        ))}
      </View>

      {/* Combined MMC Value */}
      <View style={{
        backgroundColor: NHS_DARK_BLUE,
        borderRadius: 6,
        padding: 14,
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <Text style={{ fontSize: 10, color: '#8DB4E0', marginBottom: 4 }}>Combined MMC Value</Text>
        <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 }}>
          {summary.overallMMCPercentage.toFixed(1)}%
        </Text>
        <Text style={{ fontSize: 8, color: '#8DB4E0', textAlign: 'center' }}>
          PMV ({summary.pmvScore.toFixed(1)}%) + Cat 0 ({summary.category0Score.toFixed(1)}% x 15%) + Cat 7 ({summary.category7Score.toFixed(1)}% x 15%)
        </Text>
      </View>

      {/* MMC Breakdown donut + section bars */}
      <Text style={styles.subSectionTitle}>MMC Breakdown</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
        <PdfDonutChart distribution={summary.pmvDistribution} totalPmv={summary.pmvScore} />
        <PdfSectionBars distribution={summary.pmvDistribution} />
      </View>

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): redesign executive summary with three-panel layout matching Excel"
```

---

### Task 4: Consolidate current detail pages into Key Findings page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Create a new `KeyFindingsPage` component**

Add this component after the existing `ExecutiveSummaryPage`. This consolidates the highlights from the old pages 3-7:

```typescript
function KeyFindingsPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const summary = computeExecutiveSummary(state);
  const items = state.benefitsScorecard.items;
  const budget = computePointsBudget(items);
  const constraintItems = state.constraintsScorecard.items;
  const highSeverity = constraintItems.filter(i => i.score >= 8).sort((a, b) => b.score - a.score);
  const topBenefits = [...items].sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Key Findings</Text>

      {/* Benchmark table */}
      <Text style={styles.subSectionTitle}>Benchmark Comparison</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Metric</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Score</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Benchmark</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Gap</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>RAG</Text>
        </View>
        {summary.benchmarks.map((b, i) => (
          <View key={b.metric} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>{b.metric}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{b.score.toFixed(1)}%</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{b.benchmark}%</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
              {b.gap >= 0 ? '+' : ''}{b.gap.toFixed(1)}
            </Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
              {b.score >= b.benchmark ? 'Pass' : 'Below'}
            </Text>
            <View style={{ width: '15%', alignItems: 'center' }}>
              <RAGBadge status={b.rag} />
            </View>
          </View>
        ))}
      </View>

      {/* Top benefits */}
      <Text style={styles.subSectionTitle}>Top Benefits (by points, {budget.used}/100 allocated)</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Benefit</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'center' }]}>Points</Text>
        </View>
        {topBenefits.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '50%' }]}>{item.name}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{benefitCategoryLabel(item.category)}</Text>
            <Text style={[styles.tableCell, { width: '25%', textAlign: 'center' }]}>{item.points}</Text>
          </View>
        ))}
      </View>

      {/* High severity constraints */}
      {highSeverity.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>High Severity Constraints (score 8+)</Text>
          {highSeverity.map(item => (
            <View key={item.id} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{item.name}</Text>
              <Text style={styles.metricValue}>{item.score}/10</Text>
              <View style={[styles.ragDot, { backgroundColor: RAG_RED }]} />
            </View>
          ))}
        </>
      )}

      {/* Score composition */}
      <Text style={[styles.subSectionTitle, { marginTop: 8 }]}>Score Composition</Text>
      <PdfFormulaVisualiser
        cat0={summary.category0Score}
        pmv={summary.pmvScore}
        cat7={summary.category7Score}
        overall={summary.overallMMCPercentage}
      />

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add consolidated Key Findings page"
```

---

### Task 5: Create Appendix A1 - Project Details page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixProjectDetails component**

```typescript
function AppendixProjectDetails({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const pd = state.projectDetails;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.appendixTitle}>Appendix A1: Project Details</Text>

      {/* Project narrative */}
      {pd.projectNarrative ? (
        <>
          <Text style={styles.appendixSubtitle}>Project Narrative</Text>
          <Text style={styles.paragraph}>{pd.projectNarrative}</Text>
        </>
      ) : null}

      {/* Team roster */}
      {pd.team.length > 0 && (
        <>
          <Text style={styles.appendixSubtitle}>Project Team</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Role</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Organisation</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Primary Contact</Text>
            </View>
            {pd.team.map((member, i) => (
              <View key={member.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>{member.role}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{member.name || '-'}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{member.organisation || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{member.primaryContact || '-'}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Revision history */}
      {pd.revisions.length > 0 && (
        <>
          <Text style={styles.appendixSubtitle}>Revision History</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Version</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Description</Text>
            </View>
            {pd.revisions.map((rev, i) => (
              <View key={`rev-${rev.version}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { width: '15%' }]}>{rev.version}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{rev.date}</Text>
                <Text style={[styles.tableCell, { width: '60%' }]}>{rev.description}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Workshop attendees */}
      {pd.workshopAttendees.length > 0 && (
        <View style={styles.attendeesBox}>
          <Text style={styles.attendeesLabel}>Workshop Attendees</Text>
          <Text style={styles.attendeesText}>{pd.workshopAttendees.join(', ')}</Text>
        </View>
      )}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A1 - Project Details page"
```

---

### Task 6: Create Appendix A2 - Benefits Scorecard page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixBenefits component**

```typescript
function AppendixBenefits({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const items = state.benefitsScorecard.items;
  const budget = computePointsBudget(items);
  const categories: BenefitCategory[] = ['faster', 'better', 'sustainable_legacy', 'economic'];
  const averages = computeAllCategoryAverages(items);

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.appendixTitle}>Appendix A2: Benefits Scorecard</Text>

      {/* Workshop attendees */}
      {state.benefitsScorecard.workshopAttendees.length > 0 && (
        <View style={styles.attendeesBox}>
          <Text style={styles.attendeesLabel}>Workshop Attendees</Text>
          <Text style={styles.attendeesText}>{state.benefitsScorecard.workshopAttendees.join(', ')}</Text>
        </View>
      )}

      <Text style={styles.paragraph}>
        Points budget: {budget.used} / 100 used ({budget.remaining} remaining).
        {!budget.valid ? ' Warning: budget exceeded.' : ''}
      </Text>

      {/* All benefits grouped by category */}
      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <View key={cat} wrap={false}>
            <Text style={styles.appendixSubtitle}>
              {benefitCategoryLabel(cat)} (avg importance: {(averages[cat] * 10).toFixed(1)})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Benefit</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Importance</Text>
                <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Points</Text>
                <Text style={[styles.tableHeaderCell, { width: '43%' }]}>Description</Text>
              </View>
              {catItems.map((item, i) => (
                <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { width: '35%' }]}>{item.name}</Text>
                  <Text style={[styles.tableCell, { width: '12%', textAlign: 'center' }]}>{item.importance}</Text>
                  <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.points}</Text>
                  <Text style={[styles.descriptionText, { width: '43%' }]}>{truncateText(item.description, 200)}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A2 - Benefits Scorecard with all items and descriptions"
```

---

### Task 7: Create Appendix A3 - Constraints Scorecard page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixConstraints component**

```typescript
function AppendixConstraints({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const items = state.constraintsScorecard.items;
  const average = computeConstraintAverage(items);
  const severityCounts = computeConstraintSeverityCounts(items);

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.appendixTitle}>Appendix A3: Constraints Scorecard</Text>

      {/* Workshop attendees */}
      {state.constraintsScorecard.workshopAttendees.length > 0 && (
        <View style={styles.attendeesBox}>
          <Text style={styles.attendeesLabel}>Workshop Attendees</Text>
          <Text style={styles.attendeesText}>{state.constraintsScorecard.workshopAttendees.join(', ')}</Text>
        </View>
      )}

      <Text style={styles.paragraph}>
        Average constraint score: {average.toFixed(1)} / 10.
        Low: {severityCounts.green}, Medium: {severityCounts.amber}, High: {severityCounts.red}.
      </Text>

      {/* All constraints with descriptions */}
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Constraint</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Score</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Severity</Text>
          <Text style={[styles.tableHeaderCell, { width: '48%' }]}>Description</Text>
        </View>
        {items.map((item, i) => {
          const severity: RAGStatus = item.score <= 3 ? 'green' : item.score <= 7 ? 'amber' : 'red';
          return (
            <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <Text style={[styles.tableCell, { width: '30%' }]}>{item.name}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.score}</Text>
              <View style={{ width: '12%', alignItems: 'center' }}>
                <RAGBadge status={severity} />
              </View>
              <Text style={[styles.descriptionText, { width: '48%' }]}>{truncateText(item.description, 200)}</Text>
            </View>
          );
        })}
      </View>

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A3 - Constraints with descriptions"
```

---

### Task 8: Create Appendix A4 - Category 0 Detail page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixCategory0 component**

```typescript
function AppendixCategory0({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const cat0 = computeCategory0Total(state.category0Assessment);

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.appendixTitle}>Appendix A4: Category 0 Assessment Detail</Text>

      <Text style={styles.paragraph}>
        Total score: {cat0.score} / {cat0.maxScore} ({cat0.percentage.toFixed(1)}%)
      </Text>

      {state.category0Assessment.subcategories.map(subcat => {
        const result = computeSubcategoryScore(subcat);
        const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;

        return (
          <View key={subcat.id} wrap={false}>
            <Text style={styles.appendixSubtitle}>
              0.{subcat.number} {subcat.name} ({result.score}/{result.maxScore} - {pct.toFixed(0)}%)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Item</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Type</Text>
                <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'center' }]}>Value</Text>
                <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Score</Text>
                <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Max</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Custom</Text>
              </View>
              {subcat.items.map((item, i) => {
                const itemScore = computeCategory0ItemScore(item);
                const valueDisplay = item.type === 'yes_no'
                  ? (item.value ? 'Yes' : 'No')
                  : (item.value ? `Yes (${item.percentage}%)` : 'No');
                return (
                  <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCell, { width: '40%' }]}>{item.name}</Text>
                    <Text style={[styles.tableCell, { width: '12%', textAlign: 'center', fontSize: 7 }]}>
                      {item.type === 'yes_no' ? 'Y/N' : 'Threshold'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '16%', textAlign: 'center' }]}>{valueDisplay}</Text>
                    <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{itemScore}</Text>
                    <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{item.maxScore}</Text>
                    <Text style={[styles.tableCell, { width: '12%', textAlign: 'center' }]}>
                      {item.isCustom ? <Text style={styles.customBadge}>(Custom)</Text> : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A4 - Category 0 item-level detail"
```

---

### Task 9: Create Appendix A5 - PMV Element Detail page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixPMV component**

This is the largest appendix section. It shows every BCIS element and its packages, grouped by section. No financial values - only percentages.

```typescript
function AppendixPMV({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const totalPmv = computeTotalPMV(state.pmvCalculation);
  const carbonPass = allCarbonChecksPass(state.pmvCalculation);
  const sectionPmvs = computeSectionPMV(state.pmvCalculation);
  const sections: PMVSection[] = ['structure', 'architecture', 'building_services'];

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.appendixTitle}>Appendix A5: PMV Calculation Detail</Text>

      <Text style={styles.paragraph}>
        Total PMV: {totalPmv.toFixed(1)}% | Carbon compliance: {carbonPass ? 'Pass' : 'Fail'}
      </Text>

      {sections.map(section => {
        const sectionElements = state.pmvCalculation.elements.filter(el => el.section === section);
        if (sectionElements.length === 0) return null;
        const sectionData = sectionPmvs.find(s => s.section === section);
        const sectionGroups: Record<string, typeof sectionElements> = {};
        sectionElements.forEach(el => {
          const group = el.sectionGroup || 'Other';
          if (!sectionGroups[group]) sectionGroups[group] = [];
          sectionGroups[group].push(el);
        });

        return (
          <View key={section}>
            <Text style={styles.appendixSubtitle}>
              {sectionLabel(section)} (Avg PMV: {sectionData?.averagePmv.toFixed(1) || '0.0'}%, Contribution: {sectionData?.totalPmv.toFixed(1) || '0.0'}%)
            </Text>

            {Object.entries(sectionGroups).map(([groupName, elements]) => (
              <View key={groupName}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY, marginTop: 6, marginBottom: 4 }}>
                  {groupName}
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
                    <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Element</Text>
                    <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>BCIS %</Text>
                    <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>MMC Cat.</Text>
                    <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Elem PMV</Text>
                    <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>Project %</Text>
                    <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>Custom</Text>
                  </View>
                  {elements.map((el, i) => {
                    const elPmv = computeElementPMV(el);
                    const projContrib = computeElementProjectContribution(el) * 100;
                    return (
                      <View key={el.id}>
                        {/* Element row */}
                        <View style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                          <Text style={[styles.tableCell, { width: '8%', fontSize: 7 }]}>{el.number}</Text>
                          <Text style={[styles.tableCell, { width: '28%', fontFamily: 'Helvetica-Bold' }]}>{el.name}</Text>
                          <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{el.bcisPercentage.toFixed(1)}</Text>
                          <Text style={[styles.tableCell, { width: '14%', textAlign: 'center', fontSize: 7 }]}>
                            {el.mmcCategories.length > 0 ? el.mmcCategories.join(', ') : '-'}
                          </Text>
                          <Text style={[styles.tableCell, { width: '12%', textAlign: 'center' }]}>{elPmv.toFixed(1)}%</Text>
                          <Text style={[styles.tableCell, { width: '14%', textAlign: 'center' }]}>{projContrib.toFixed(2)}%</Text>
                          <Text style={[styles.tableCell, { width: '14%', textAlign: 'center' }]}>
                            {el.isCustom ? <Text style={styles.customBadge}>(Custom)</Text> : ''}
                          </Text>
                        </View>
                        {/* Package sub-rows */}
                        {el.packages.map(pkg => {
                          const pkgPmv = computePackagePMV(pkg);
                          return (
                            <View key={pkg.id} style={{ flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 8, paddingLeft: 24, backgroundColor: '#F8FAFB', borderBottomWidth: 0.5, borderBottomColor: BORDER_GREY }}>
                              <Text style={[styles.descriptionText, { width: '36%' }]}>{pkg.description || 'Package'}</Text>
                              <Text style={[styles.descriptionText, { width: '16%', textAlign: 'center' }]}>Prelims: {pkg.prelimsPercent}%</Text>
                              <Text style={[styles.descriptionText, { width: '16%', textAlign: 'center' }]}>Labour: {pkg.labourPercent}%</Text>
                              <Text style={[styles.descriptionText, { width: '16%', textAlign: 'center' }]}>PMV: {pkgPmv.toFixed(1)}%</Text>
                              <Text style={[styles.descriptionText, { width: '16%' }]}></Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A5 - PMV element and package detail"
```

---

### Task 10: Create Appendix A6 - Category 7 Detail page

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx`

**Step 1: Add the AppendixCategory7 component**

```typescript
function AppendixCategory7({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const cat7 = computeCategory7Score(state.category7Assessment);
  const items = state.category7Assessment.items;

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.appendixTitle}>Appendix A6: Category 7 Innovations Detail</Text>

      <Text style={styles.paragraph}>
        Innovations adopted: {cat7.score} / {cat7.maxScore} ({cat7.percentage.toFixed(1)}%)
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Innovation</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Adopted</Text>
          <Text style={[styles.tableHeaderCell, { width: '43%' }]}>Description</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Custom</Text>
        </View>
        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tableCell, { width: '35%' }]}>{item.name}</Text>
            <Text style={[styles.tableCell, {
              width: '12%',
              textAlign: 'center',
              color: item.adopted ? RAG_GREEN : TEXT_SECONDARY,
              fontFamily: 'Helvetica-Bold',
            }]}>
              {item.adopted ? 'Yes' : 'No'}
            </Text>
            <Text style={[styles.descriptionText, { width: '43%' }]}>{truncateText(item.description, 200)}</Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>
              {item.isCustom ? <Text style={styles.customBadge}>(Custom)</Text> : ''}
            </Text>
          </View>
        ))}
      </View>

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}
```

**Step 2: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`

**Step 3: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): add Appendix A6 - Category 7 innovations with descriptions"
```

---

### Task 11: Wire up the Document component with new page structure

**Files:**
- Modify: `src/lib/pdf/ReportGenerator.tsx` - `MMCReport` component (lines 1143-1164)

**Step 1: Update the MMCReport component**

Replace the current `MMCReport` function to use the new page structure. Remove old summary pages and add appendix pages:

```typescript
export function MMCReport({ state }: MMCReportProps) {
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document
      title="NHS MMC Assessment Report"
      author="NHS MMC Assessment Tool"
      subject="Modern Methods of Construction Assessment"
    >
      {/* Summary Section */}
      <CoverPage state={state} reportDate={reportDate} />
      <ExecutiveSummaryPage state={state} reportDate={reportDate} />
      <KeyFindingsPage state={state} reportDate={reportDate} />

      {/* Appendix - Full Data Record */}
      <AppendixProjectDetails state={state} reportDate={reportDate} />
      <AppendixBenefits state={state} reportDate={reportDate} />
      <AppendixConstraints state={state} reportDate={reportDate} />
      <AppendixCategory0 state={state} reportDate={reportDate} />
      <AppendixPMV state={state} reportDate={reportDate} />
      <AppendixCategory7 state={state} reportDate={reportDate} />
    </Document>
  );
}
```

**Step 2: Delete the old standalone summary page functions that are no longer referenced**

Remove these functions (they are replaced by the consolidated KeyFindingsPage and the appendix pages):
- `BenefitsSummaryPage`
- `ConstraintsSummaryPage`
- `Category0SummaryPage`
- `PMVSummaryPage`
- `Category7SummaryPage`

**Step 3: Build and verify**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Build succeeds with no unused function warnings

**Step 4: Commit**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "feat(pdf): wire up new page structure and remove old summary pages"
```

---

### Task 12: Test the PDF export end-to-end

**Files:**
- No file changes

**Step 1: Start the dev server**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run dev`

**Step 2: Verify the PDF export works**

Open the tool in a browser, enter some test data across all sections, and export a PDF. Verify:
- Cover page shows typology, build type, stage, GFA
- Executive summary has three side-by-side panels with benchmarks and combined MMC value
- Key Findings page shows benchmarks, top benefits, high-severity constraints, formula
- Appendix A1 shows project narrative, team, revisions, attendees
- Appendix A2 shows ALL benefits with descriptions
- Appendix A3 shows ALL constraints with descriptions
- Appendix A4 shows every Category 0 item with values
- Appendix A5 shows every PMV element and package with percentages
- Appendix A6 shows every Category 7 item with descriptions
- Custom items are flagged
- Pages don't overflow or truncate

**Step 3: Final build check**

Run: `cd /Users/liamroberts/Projects/nhs-mmc-tool && npm run build`
Expected: Clean build, no errors

**Step 4: Final commit if any fixes were needed**

```bash
git add src/lib/pdf/ReportGenerator.tsx
git commit -m "fix(pdf): address issues found during PDF export testing"
```
