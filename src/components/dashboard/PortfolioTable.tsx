'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { RAGBadge } from '@/components/ui';
import { computeRAG } from '@/lib/calculations/executive-summary';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import type { DashboardProject } from '@/types';

const TYPOLOGY_LABELS: Record<string, string> = {
  acute: 'Acute',
  primary_care: 'Primary Care',
  specialist: 'Specialist',
  mental_health: 'Mental Health',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

const BUILD_TYPE_LABELS: Record<string, string> = {
  new_build: 'New Build',
  refurbishment: 'Refurbishment',
  mixed: 'Mixed',
};

const STAGE_LABELS: Record<string, string> = {
  na: 'N/A',
  soc: 'SOC',
  obc: 'OBC',
  fbc: 'FBC',
  pc: 'PC',
};

type SortField = 'label' | 'typology' | 'buildType' | 'stage' | 'overall' | 'rag';
type SortDirection = 'asc' | 'desc';

function getSortValue(project: DashboardProject, field: SortField): string | number {
  switch (field) {
    case 'label':
      return project.label.toLowerCase();
    case 'typology':
      return TYPOLOGY_LABELS[project.assessment.projectDetails.buildingTypology] || '';
    case 'buildType':
      return BUILD_TYPE_LABELS[project.assessment.projectDetails.buildType] || '';
    case 'stage':
      return STAGE_LABELS[project.assessment.projectDetails.businessCaseStage] || '';
    case 'overall':
      return project.summary.overallMMCPercentage;
    case 'rag': {
      const rag = computeRAG(project.summary.overallMMCPercentage, 70);
      if (rag === 'green') return 0;
      if (rag === 'amber') return 1;
      return 2;
    }
    default:
      return '';
  }
}

const SORTABLE_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'label', label: 'Project' },
  { field: 'typology', label: 'Typology' },
  { field: 'buildType', label: 'Build Type' },
  { field: 'stage', label: 'Stage' },
  { field: 'overall', label: 'Overall MMC %' },
  { field: 'rag', label: 'RAG' },
];

export function PortfolioTable() {
  const projects = useDashboardStore((s) => s.projects);
  const removeProject = useDashboardStore((s) => s.removeProject);

  const [sortField, setSortField] = useState<SortField>('label');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField],
  );

  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      const aVal = getSortValue(a, sortField);
      const bVal = getSortValue(b, sortField);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [projects, sortField, sortDirection]);

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (confirmDeleteId === id) {
        removeProject(id);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(id);
      }
    },
    [confirmDeleteId, removeProject],
  );

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-nhs-dark-blue text-white">
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.field}
                onClick={() => handleSort(col.field)}
                className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-white/10 transition-colors"
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortField === col.field && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '\u25B2' : '\u25BC'}
                    </span>
                  )}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-left font-semibold w-24">Delete</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((p, index) => {
            const overall = p.summary.overallMMCPercentage;
            const rag = computeRAG(overall, 70);
            const isConfirming = confirmDeleteId === p.id;

            return (
              <tr
                key={p.id}
                className={`border-b border-nhs-grey-4 hover:bg-nhs-pale-grey/50 transition-colors ${
                  index % 2 === 1 ? 'bg-nhs-pale-grey/30' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/project/${p.id}`}
                    className="text-nhs-blue font-medium hover:underline"
                  >
                    {p.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-nhs-grey-1">
                  {TYPOLOGY_LABELS[p.assessment.projectDetails.buildingTypology] || p.assessment.projectDetails.buildingTypology}
                </td>
                <td className="px-4 py-3 text-nhs-grey-1">
                  {BUILD_TYPE_LABELS[p.assessment.projectDetails.buildType] || p.assessment.projectDetails.buildType}
                </td>
                <td className="px-4 py-3 text-nhs-grey-1">
                  {STAGE_LABELS[p.assessment.projectDetails.businessCaseStage] || p.assessment.projectDetails.businessCaseStage}
                </td>
                <td className="px-4 py-3 font-semibold text-nhs-black">
                  {overall.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <RAGBadge status={rag} size="sm" />
                </td>
                <td className="px-4 py-3">
                  {isConfirming ? (
                    <span className="inline-flex gap-1">
                      <button
                        onClick={() => handleDeleteClick(p.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="text-xs font-semibold text-nhs-grey-1 hover:text-nhs-black px-1.5 py-0.5 rounded bg-nhs-pale-grey hover:bg-nhs-grey-4 transition-colors"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(p.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      title="Remove project"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
