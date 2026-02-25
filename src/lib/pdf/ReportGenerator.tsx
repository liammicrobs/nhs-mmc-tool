'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer';
import type { MMCAssessmentState, RAGStatus, BenefitCategory, SectionPMV } from '@/types';
import { computeCategory0Total, computeSubcategoryScore } from '@/lib/calculations/category0';
import { computeTotalPMV, computeSectionPMV, allCarbonChecksPass } from '@/lib/calculations/pmv';
import { computeCategory7Score } from '@/lib/calculations/category7';
import {
  computeExecutiveSummary,
} from '@/lib/calculations/executive-summary';
import {
  computeAllCategoryAverages,
  computePointsBudget,
} from '@/lib/calculations/benefits';
import {
  computeConstraintAverage,
  computeConstraintSeverityCounts,
} from '@/lib/calculations/constraints';

// NHS Colour palette
const NHS_BLUE = '#005EB8';
const NHS_DARK_BLUE = '#003087';
const NHS_LIGHT_BLUE = '#41B6E6';
const RAG_GREEN = '#00703C';
const RAG_AMBER = '#FFB81C';
const RAG_RED = '#DA291C';
const LIGHT_GREY = '#F0F4F5';
const BORDER_GREY = '#D8DDE0';
const TEXT_PRIMARY = '#212B32';
const TEXT_SECONDARY = '#4C6272';
const WHITE = '#FFFFFF';

// Donut chart colours per section
const SECTION_COLOURS = [NHS_DARK_BLUE, NHS_BLUE, NHS_LIGHT_BLUE];

function ragColour(status: RAGStatus): string {
  if (status === 'green') return RAG_GREEN;
  if (status === 'amber') return RAG_AMBER;
  return RAG_RED;
}

function ragLabel(status: RAGStatus): string {
  if (status === 'green') return 'Green';
  if (status === 'amber') return 'Amber';
  return 'Red';
}

function ragFromPercentage(pct: number): RAGStatus {
  if (pct >= 70) return 'green';
  if (pct >= 50) return 'amber';
  return 'red';
}

function benefitCategoryLabel(cat: BenefitCategory): string {
  const labels: Record<BenefitCategory, string> = {
    faster: 'Faster',
    better: 'Better',
    sustainable_legacy: 'Sustainable Legacy',
    economic: 'Economic',
  };
  return labels[cat];
}

function sectionLabel(section: string): string {
  if (section === 'structure') return 'Structure';
  if (section === 'architecture') return 'Architecture';
  return 'Building Services';
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT_PRIMARY,
  },
  // Cover page styles
  coverPage: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: NHS_DARK_BLUE,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHITE,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  coverBadgeText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: NHS_BLUE,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#8DB4E0',
    textAlign: 'center',
    marginBottom: 40,
  },
  coverDetailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  coverLabel: {
    fontSize: 10,
    color: '#8DB4E0',
    width: 100,
    textAlign: 'right',
    marginRight: 10,
  },
  coverValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    width: 200,
  },
  // Section styles
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: NHS_DARK_BLUE,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: NHS_BLUE,
  },
  subSectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NHS_BLUE,
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  // Table styles
  table: {
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: NHS_DARK_BLUE,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_GREY,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_GREY,
    backgroundColor: LIGHT_GREY,
  },
  tableCell: {
    fontSize: 9,
    color: TEXT_PRIMARY,
  },
  // Metric card
  metricCard: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_PRIMARY,
    marginRight: 8,
  },
  ragDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Score bar
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreBarLabel: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    width: 120,
  },
  scoreBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: BORDER_GREY,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  scoreBarFill: {
    height: 8,
    borderRadius: 4,
  },
  scoreBarValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_PRIMARY,
    width: 40,
    textAlign: 'right',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: BORDER_GREY,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_SECONDARY,
  },
  // Inline RAG badge
  ragBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  // Summary cards row
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  summaryCardTitle: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: NHS_DARK_BLUE,
    marginBottom: 2,
  },
});

// ---------------------------------------------------------------------------
// SVG Donut Chart helpers
// ---------------------------------------------------------------------------

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// PdfDonutChart
// ---------------------------------------------------------------------------

function PdfDonutChart({ distribution, totalPmv }: { distribution: SectionPMV[]; totalPmv: number }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 55;
  const innerR = 35;

  const total = distribution.reduce((sum, d) => sum + d.proportion, 0);
  const allZero = total === 0;

  // Build segments
  const segments: { d: string; fill: string }[] = [];
  if (allZero) {
    // Single grey ring
    segments.push({
      d: donutSegmentPath(cx, cy, outerR, innerR, 0, 359.99),
      fill: BORDER_GREY,
    });
  } else {
    let currentAngle = 0;
    distribution.forEach((sec, idx) => {
      const sweep = (sec.proportion / total) * 360;
      if (sweep > 0.5) {
        segments.push({
          d: donutSegmentPath(cx, cy, outerR, innerR, currentAngle, currentAngle + sweep - 0.5),
          fill: SECTION_COLOURS[idx % SECTION_COLOURS.length],
        });
      }
      currentAngle += sweep;
    });
  }

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      {/* Donut container with overlay */}
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {segments.map((seg, i) => (
            <Path key={i} d={seg.d} fill={seg.fill} />
          ))}
        </Svg>
        {/* Centre text overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY }}>
            {totalPmv.toFixed(1)}%
          </Text>
          <Text style={{ fontSize: 7, color: TEXT_SECONDARY }}>Total PMV</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={{ marginTop: 8 }}>
        {distribution.map((d, idx) => (
          <View key={d.section} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: SECTION_COLOURS[idx % SECTION_COLOURS.length],
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 7, color: TEXT_SECONDARY }}>
              {sectionLabel(d.section)} {(d.proportion * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PdfSectionBars - horizontal bars showing average PMV per section
// ---------------------------------------------------------------------------

function PdfSectionBars({ distribution }: { distribution: SectionPMV[] }) {
  const maxBarWidth = 200;

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {distribution.map((d, idx) => {
        const pct = Math.min(100, Math.max(0, d.averagePmv));
        const barWidth = Math.max(2, (pct / 100) * maxBarWidth);
        return (
          <View key={d.section} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 8, color: TEXT_SECONDARY, width: 80 }}>
              {sectionLabel(d.section)}
            </Text>
            <View style={{ width: maxBarWidth, height: 12, backgroundColor: BORDER_GREY, borderRadius: 3, marginHorizontal: 6 }}>
              <View
                style={{
                  width: barWidth,
                  height: 12,
                  backgroundColor: SECTION_COLOURS[idx % SECTION_COLOURS.length],
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY, width: 40, textAlign: 'right' }}>
              {d.averagePmv.toFixed(1)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PdfFormulaVisualiser
// ---------------------------------------------------------------------------

function PdfFormulaVisualiser({
  cat0,
  pmv,
  cat7,
  overall,
}: {
  cat0: number;
  pmv: number;
  cat7: number;
  overall: number;
}) {
  const blockStyle = {
    backgroundColor: LIGHT_GREY,
    borderWidth: 1,
    borderColor: BORDER_GREY,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center' as const,
  };

  const operatorStyle = {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold' as const,
    color: TEXT_SECONDARY,
    paddingHorizontal: 4,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
      {/* Cat 0 */}
      <View style={blockStyle}>
        <Text style={{ fontSize: 7, color: TEXT_SECONDARY, marginBottom: 2 }}>Cat 0</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY }}>{cat0.toFixed(1)}%</Text>
        <Text style={{ fontSize: 6, color: TEXT_SECONDARY, marginTop: 1 }}>x 15%</Text>
      </View>

      <Text style={operatorStyle}>+</Text>

      {/* PMV */}
      <View style={blockStyle}>
        <Text style={{ fontSize: 7, color: TEXT_SECONDARY, marginBottom: 2 }}>PMV</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY }}>{pmv.toFixed(1)}%</Text>
        <Text style={{ fontSize: 6, color: TEXT_SECONDARY, marginTop: 1 }}>x 70%</Text>
      </View>

      <Text style={operatorStyle}>+</Text>

      {/* Cat 7 */}
      <View style={blockStyle}>
        <Text style={{ fontSize: 7, color: TEXT_SECONDARY, marginBottom: 2 }}>Cat 7</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY }}>{cat7.toFixed(1)}%</Text>
        <Text style={{ fontSize: 6, color: TEXT_SECONDARY, marginTop: 1 }}>x 15%</Text>
      </View>

      <Text style={operatorStyle}>=</Text>

      {/* Result */}
      <View style={{
        backgroundColor: NHS_BLUE,
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 14,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 7, color: WHITE, opacity: 0.85, marginBottom: 2 }}>Overall MMC</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: WHITE }}>{overall.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function PageFooter({ reportDate }: { reportDate: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>NHS MMC Assessment Report</Text>
      <Text style={styles.footerText}>{reportDate}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function RAGBadge({ status }: { status: RAGStatus }) {
  return (
    <Text style={[styles.ragBadge, { backgroundColor: ragColour(status) }]}>
      {ragLabel(status)}
    </Text>
  );
}

function ScoreBar({ label, value, maxValue }: { label: string; value: number; maxValue?: number }) {
  const pct = maxValue ? Math.min(100, (value / maxValue) * 100) : Math.min(100, Math.max(0, value));
  const displayVal = maxValue ? `${value.toFixed(0)}/${maxValue}` : `${value.toFixed(1)}%`;
  const rag = ragFromPercentage(maxValue ? pct : value);
  return (
    <View style={styles.scoreBarContainer}>
      <Text style={styles.scoreBarLabel}>{label}</Text>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            {
              width: `${Math.max(2, pct)}%`,
              backgroundColor: ragColour(rag),
            },
          ]}
        />
      </View>
      <Text style={styles.scoreBarValue}>{displayVal}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Page components
// ---------------------------------------------------------------------------

function CoverPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const projectName = state.projectDetails.projectDescription || 'Untitled Project';
  const trustName = state.projectDetails.trustClientName || 'N/A';
  const pscpName = state.projectDetails.pscpName || 'N/A';

  const summary = computeExecutiveSummary(state);
  const overallRag = ragFromPercentage(summary.overallMMCPercentage);
  const cat0Rag = ragFromPercentage(summary.category0Score);
  const pmvRag = ragFromPercentage(summary.pmvScore);
  const cat7Rag = ragFromPercentage(summary.category7Score);

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
          <Text style={styles.coverLabel}>Date:</Text>
          <Text style={styles.coverValue}>{reportDate}</Text>
        </View>
      </View>

      {/* Separator line */}
      <View style={{ width: 320, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 28 }} />

      {/* Overall MMC score - prominent */}
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
        {/* Cat 0 */}
        <View style={{ alignItems: 'center', width: 100 }}>
          <Text style={{ fontSize: 8, color: '#8DB4E0', marginBottom: 4 }}>Category 0</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE }}>
            {summary.category0Score.toFixed(1)}%
          </Text>
          <View style={{
            backgroundColor: ragColour(cat0Rag),
            borderRadius: 3,
            paddingVertical: 2,
            paddingHorizontal: 8,
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE }}>{ragLabel(cat0Rag)}</Text>
          </View>
        </View>

        {/* PMV */}
        <View style={{ alignItems: 'center', width: 100 }}>
          <Text style={{ fontSize: 8, color: '#8DB4E0', marginBottom: 4 }}>PMV Score</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE }}>
            {summary.pmvScore.toFixed(1)}%
          </Text>
          <View style={{
            backgroundColor: ragColour(pmvRag),
            borderRadius: 3,
            paddingVertical: 2,
            paddingHorizontal: 8,
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE }}>{ragLabel(pmvRag)}</Text>
          </View>
        </View>

        {/* Cat 7 */}
        <View style={{ alignItems: 'center', width: 100 }}>
          <Text style={{ fontSize: 8, color: '#8DB4E0', marginBottom: 4 }}>Category 7</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE }}>
            {summary.category7Score.toFixed(1)}%
          </Text>
          <View style={{
            backgroundColor: ragColour(cat7Rag),
            borderRadius: 3,
            paddingVertical: 2,
            paddingHorizontal: 8,
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE }}>{ragLabel(cat7Rag)}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

function ExecutiveSummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const summary = computeExecutiveSummary(state);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Score cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Overall MMC</Text>
          <Text style={styles.summaryCardValue}>{summary.overallMMCPercentage.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(summary.overallMMCPercentage)} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Category 0</Text>
          <Text style={styles.summaryCardValue}>{summary.category0Score.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(summary.category0Score)} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>PMV Score</Text>
          <Text style={styles.summaryCardValue}>{summary.pmvScore.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(summary.pmvScore)} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Category 7</Text>
          <Text style={styles.summaryCardValue}>{summary.category7Score.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(summary.category7Score)} />
        </View>
      </View>

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

      {/* PMV Distribution - donut chart + section bars */}
      <Text style={styles.subSectionTitle}>PMV Distribution</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
        <PdfDonutChart distribution={summary.pmvDistribution} totalPmv={summary.pmvScore} />
        <PdfSectionBars distribution={summary.pmvDistribution} />
      </View>

      {/* Score Composition - formula visualiser */}
      <Text style={styles.subSectionTitle}>Score Composition</Text>
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

function BenefitsSummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const items = state.benefitsScorecard.items;
  const averages = computeAllCategoryAverages(items);
  const budget = computePointsBudget(items);

  const topRated = [...items]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  const categories: BenefitCategory[] = ['faster', 'better', 'sustainable_legacy', 'economic'];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Benefits Summary</Text>

      <Text style={styles.paragraph}>
        Points budget: {budget.used} / 100 used ({budget.remaining} remaining).
        {!budget.valid ? ' Warning: budget exceeded.' : ''}
      </Text>

      {/* Category averages */}
      <Text style={styles.subSectionTitle}>Category Averages (Importance 1-10)</Text>
      {categories.map((cat) => (
        <ScoreBar
          key={cat}
          label={benefitCategoryLabel(cat)}
          value={averages[cat] * 10}
        />
      ))}

      {/* Top rated benefits */}
      <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>Top Rated Benefits</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Benefit</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { width: '17%', textAlign: 'center' }]}>Importance</Text>
          <Text style={[styles.tableHeaderCell, { width: '18%', textAlign: 'center' }]}>Points</Text>
        </View>
        {topRated.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '45%' }]}>{item.name}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{benefitCategoryLabel(item.category)}</Text>
            <Text style={[styles.tableCell, { width: '17%', textAlign: 'center' }]}>{item.importance}</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'center' }]}>{item.points}</Text>
          </View>
        ))}
      </View>

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}

function ConstraintsSummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const items = state.constraintsScorecard.items;
  const average = computeConstraintAverage(items);
  const severityCounts = computeConstraintSeverityCounts(items);

  const highSeverity = items.filter(i => i.score >= 8).sort((a, b) => b.score - a.score);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Constraints Summary</Text>

      {/* Overview metrics */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Average Constraint</Text>
          <Text style={styles.summaryCardValue}>{average.toFixed(1)}</Text>
          <Text style={{ fontSize: 8, color: TEXT_SECONDARY }}>out of 10</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Low Severity</Text>
          <Text style={[styles.summaryCardValue, { color: RAG_GREEN }]}>{severityCounts.green}</Text>
          <Text style={{ fontSize: 8, color: TEXT_SECONDARY }}>items (1-3)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Medium Severity</Text>
          <Text style={[styles.summaryCardValue, { color: RAG_AMBER }]}>{severityCounts.amber}</Text>
          <Text style={{ fontSize: 8, color: TEXT_SECONDARY }}>items (4-7)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>High Severity</Text>
          <Text style={[styles.summaryCardValue, { color: RAG_RED }]}>{severityCounts.red}</Text>
          <Text style={{ fontSize: 8, color: TEXT_SECONDARY }}>items (8-10)</Text>
        </View>
      </View>

      {/* All constraints */}
      <Text style={styles.subSectionTitle}>All Constraints</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '70%' }]}>Constraint</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Score</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Severity</Text>
        </View>
        {items.map((item, i) => {
          const severity = item.score <= 3 ? 'green' : item.score <= 7 ? 'amber' : 'red';
          return (
            <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: '70%' }]}>{item.name}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{item.score}</Text>
              <View style={{ width: '15%', alignItems: 'center' }}>
                <RAGBadge status={severity as RAGStatus} />
              </View>
            </View>
          );
        })}
      </View>

      {highSeverity.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>High Severity Items (score 8+)</Text>
          {highSeverity.map(item => (
            <View key={item.id} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{item.name}</Text>
              <Text style={styles.metricValue}>{item.score}/10</Text>
              <View style={[styles.ragDot, { backgroundColor: RAG_RED }]} />
            </View>
          ))}
        </>
      )}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}

function Category0SummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const cat0 = computeCategory0Total(state.category0Assessment);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Category 0 - Pre-Manufacturing Value Assessment</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Total Score</Text>
          <Text style={styles.summaryCardValue}>{cat0.score}/{cat0.maxScore}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Percentage</Text>
          <Text style={styles.summaryCardValue}>{cat0.percentage.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(cat0.percentage)} />
        </View>
      </View>

      {/* Subcategory breakdown */}
      <Text style={styles.subSectionTitle}>Subcategory Breakdown</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Subcategory</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Score</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Max</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>%</Text>
        </View>
        {state.category0Assessment.subcategories.map((subcat, i) => {
          const result = computeSubcategoryScore(subcat);
          const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
          return (
            <View key={subcat.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: '10%' }]}>0.{subcat.number}</Text>
              <Text style={[styles.tableCell, { width: '45%' }]}>{subcat.name}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{result.score}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{result.maxScore}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{pct.toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Score bars for visual */}
      <Text style={styles.subSectionTitle}>Visual Breakdown</Text>
      {state.category0Assessment.subcategories.map((subcat) => {
        const result = computeSubcategoryScore(subcat);
        const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
        return (
          <ScoreBar
            key={subcat.id}
            label={`0.${subcat.number} ${subcat.name}`}
            value={pct}
          />
        );
      })}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}

function PMVSummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const carbonPass = allCarbonChecksPass(state.pmvCalculation);
  const totalPmv = computeTotalPMV(state.pmvCalculation);
  const sectionPmvs = computeSectionPMV(state.pmvCalculation);
  const checks = state.pmvCalculation.carbonChecks;

  const carbonItems = [
    { label: 'Structure', pass: checks.structure },
    { label: 'Superstructure', pass: checks.superstructure },
    { label: 'External Walls', pass: checks.externalWalls },
    { label: 'Internal Finishes', pass: checks.internalFinishes },
    { label: 'Fittings', pass: checks.fittings },
    { label: 'Services', pass: checks.services },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>PMV Calculation Summary</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Total PMV</Text>
          <Text style={styles.summaryCardValue}>{totalPmv.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(totalPmv)} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Carbon Compliance</Text>
          <Text style={[styles.summaryCardValue, { color: carbonPass ? RAG_GREEN : RAG_RED }]}>
            {carbonPass ? 'Pass' : 'Fail'}
          </Text>
          <Text style={{ fontSize: 8, color: TEXT_SECONDARY }}>
            All checks must pass
          </Text>
        </View>
      </View>

      {/* Carbon checks */}
      <Text style={styles.subSectionTitle}>Carbon Compliance Checks</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Check</Text>
          <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'center' }]}>Status</Text>
        </View>
        {carbonItems.map((item, i) => (
          <View key={item.label} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '60%' }]}>{item.label}</Text>
            <Text style={[styles.tableCell, { width: '40%', textAlign: 'center', color: item.pass ? RAG_GREEN : RAG_RED, fontFamily: 'Helvetica-Bold' }]}>
              {item.pass ? 'Pass' : 'Fail'}
            </Text>
          </View>
        ))}
      </View>

      {/* Section breakdown */}
      <Text style={styles.subSectionTitle}>Section Breakdown</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Section</Text>
          <Text style={[styles.tableHeaderCell, { width: '23%', textAlign: 'center' }]}>Avg PMV</Text>
          <Text style={[styles.tableHeaderCell, { width: '23%', textAlign: 'center' }]}>Total PMV</Text>
          <Text style={[styles.tableHeaderCell, { width: '24%', textAlign: 'center' }]}>Proportion</Text>
        </View>
        {sectionPmvs.map((s, i) => {
          const label = sectionLabel(s.section);
          return (
            <View key={s.section} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{label}</Text>
              <Text style={[styles.tableCell, { width: '23%', textAlign: 'center' }]}>{s.averagePmv.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { width: '23%', textAlign: 'center' }]}>{s.totalPmv.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { width: '24%', textAlign: 'center' }]}>{(s.proportion * 100).toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Section visual bars */}
      <Text style={styles.subSectionTitle}>Section Contributions</Text>
      {sectionPmvs.map((s) => {
        const label = sectionLabel(s.section);
        return (
          <ScoreBar
            key={s.section}
            label={label}
            value={s.totalPmv}
          />
        );
      })}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}

function Category7SummaryPage({ state, reportDate }: { state: MMCAssessmentState; reportDate: string }) {
  const cat7 = computeCategory7Score(state.category7Assessment);
  const adopted = state.category7Assessment.items.filter(i => i.adopted);
  const notAdopted = state.category7Assessment.items.filter(i => !i.adopted);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Category 7 - Site-Based Innovations</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Innovations Adopted</Text>
          <Text style={styles.summaryCardValue}>{cat7.score}/{cat7.maxScore}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Percentage</Text>
          <Text style={styles.summaryCardValue}>{cat7.percentage.toFixed(1)}%</Text>
          <RAGBadge status={ragFromPercentage(cat7.percentage)} />
        </View>
      </View>

      {/* Adopted innovations */}
      {adopted.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>Adopted Innovations</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: '70%' }]}>Innovation</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'center' }]}>Status</Text>
            </View>
            {adopted.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { width: '70%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'center', color: RAG_GREEN, fontFamily: 'Helvetica-Bold' }]}>
                  Adopted
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Not adopted */}
      {notAdopted.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>Not Adopted</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: '70%' }]}>Innovation</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'center' }]}>Status</Text>
            </View>
            {notAdopted.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { width: '70%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'center', color: TEXT_SECONDARY }]}>
                  Not Adopted
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <PageFooter reportDate={reportDate} />
    </Page>
  );
}

// Main report component

interface MMCReportProps {
  state: MMCAssessmentState;
}

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
      <CoverPage state={state} reportDate={reportDate} />
      <ExecutiveSummaryPage state={state} reportDate={reportDate} />
      <BenefitsSummaryPage state={state} reportDate={reportDate} />
      <ConstraintsSummaryPage state={state} reportDate={reportDate} />
      <Category0SummaryPage state={state} reportDate={reportDate} />
      <PMVSummaryPage state={state} reportDate={reportDate} />
      <Category7SummaryPage state={state} reportDate={reportDate} />
    </Document>
  );
}

// Export function that dynamically imports and renders the PDF
export async function generateAndDownloadReport(state: MMCAssessmentState): Promise<void> {
  const PDFModule = await import('@react-pdf/renderer');
  const { MMCReport: Report } = await import('./ReportGenerator');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(Report, { state }) as any;
  const blob = await PDFModule.pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mmc-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
