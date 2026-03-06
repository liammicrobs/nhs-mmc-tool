'use client';

import { useMMCStore } from '@/lib/store';
import { PageHeader, SectionCard } from '@/components/ui';
import { BuildingTypology, BuildType, BusinessCaseStage, RIBAStage } from '@/types';
import { v4 as uuid } from 'uuid';

const TYPOLOGY_OPTIONS: { value: BuildingTypology; label: string }[] = [
  { value: 'acute', label: 'Acute' },
  { value: 'primary_care', label: 'Primary Care' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'other', label: 'Other' },
];

const BUILD_TYPE_OPTIONS: { value: BuildType; label: string }[] = [
  { value: 'new_build', label: 'New Build' },
  { value: 'refurbishment', label: 'Refurbishment' },
  { value: 'mixed', label: 'Mixed (New & Refurb)' },
];

const BUSINESS_CASE_OPTIONS: { value: BusinessCaseStage; label: string }[] = [
  { value: 'na', label: 'N/A' },
  { value: 'soc', label: 'SOC' },
  { value: 'obc', label: 'OBC' },
  { value: 'fbc', label: 'FBC' },
  { value: 'pc', label: 'PC' },
];

const RIBA_OPTIONS: { value: RIBAStage; label: string }[] = [
  { value: '0', label: 'RIBA 0' },
  { value: '1', label: 'RIBA 1' },
  { value: '2', label: 'RIBA 2' },
  { value: '3', label: 'RIBA 3' },
  { value: '4', label: 'RIBA 4' },
  { value: '5', label: 'RIBA 5' },
  { value: '6', label: 'RIBA 6' },
];

const DEFAULT_ROLES = [
  'Lead Organisation',
  'Senior Responsible Owner',
  'Trust Project Manager',
  'Clinical Lead',
  'Derogation Lead',
  'Architect',
  'Healthcare Planner',
  'MEP Consultant',
  'C&S Consultant',
  'NZC Coordinator',
  'MMC Coordinator',
  'BIM Coordinator',
  'Main Contractor',
];

export default function ProjectDetailsPage() {
  const { projectDetails, updateProjectDetails, addTeamMember, removeTeamMember, updateTeamMember } = useMMCStore();

  return (
    <div>
      <PageHeader
        stepNumber={1}
        title="Project Details"
        description="Enter the core project information. This data flows through to all assessment sections."
      />

      <div className="space-y-6">
        {/* Project Information */}
        <SectionCard title="Project Information">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">Trust / Client</label>
              <input
                type="text"
                value={projectDetails.trustClientName}
                onChange={(e) => updateProjectDetails({ trustClientName: e.target.value })}
                placeholder="Enter trust or client name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">PSCP</label>
              <input
                type="text"
                value={projectDetails.pscpName}
                onChange={(e) => updateProjectDetails({ pscpName: e.target.value })}
                placeholder="Enter PSCP name"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-nhs-black mb-1">Project Description</label>
            <input
              type="text"
              value={projectDetails.projectDescription}
              onChange={(e) => updateProjectDetails({ projectDescription: e.target.value })}
              placeholder="Brief project description"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-nhs-black mb-1">Project Narrative</label>
            <textarea
              value={projectDetails.projectNarrative}
              onChange={(e) => updateProjectDetails({ projectNarrative: e.target.value })}
              rows={4}
              placeholder="Detailed project narrative..."
            />
          </div>
        </SectionCard>

        {/* Project Classification */}
        <SectionCard title="Project Classification">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">Building Typology</label>
              <select
                value={projectDetails.buildingTypology}
                onChange={(e) => updateProjectDetails({ buildingTypology: e.target.value as BuildingTypology })}
              >
                {TYPOLOGY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">Build Type</label>
              <select
                value={projectDetails.buildType}
                onChange={(e) => updateProjectDetails({ buildType: e.target.value as BuildType })}
              >
                {BUILD_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">Business Case Stage</label>
              <select
                value={projectDetails.businessCaseStage}
                onChange={(e) => updateProjectDetails({ businessCaseStage: e.target.value as BusinessCaseStage })}
              >
                {BUSINESS_CASE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">RIBA Stage</label>
              <select
                value={projectDetails.ribaStage}
                onChange={(e) => updateProjectDetails({ ribaStage: e.target.value as RIBAStage })}
              >
                {RIBA_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">
                Refurbishment: {projectDetails.refurbishmentPercentage}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={projectDetails.refurbishmentPercentage}
                onChange={(e) => updateProjectDetails({ refurbishmentPercentage: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-nhs-grey-2 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-nhs-black mb-1">GFA (sqm)</label>
              <input
                type="number"
                value={projectDetails.gfaSqm || ''}
                onChange={(e) => updateProjectDetails({ gfaSqm: Number(e.target.value) })}
                placeholder="Gross floor area"
                min={0}
              />
            </div>
          </div>
        </SectionCard>

        {/* Project Team */}
        <SectionCard
          title="Project Team"
          headerRight={
            <button
              onClick={() => addTeamMember({ id: uuid(), role: '', name: '', organisation: '', primaryContact: '' })}
              className="text-sm bg-nhs-blue text-white px-3 py-1.5 rounded hover:bg-nhs-dark-blue transition-colors"
            >
              + Add Member
            </button>
          }
        >
          {projectDetails.team.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-nhs-grey-2 mb-3">No team members added yet.</p>
              <button
                onClick={() => {
                  DEFAULT_ROLES.forEach(role => {
                    addTeamMember({ id: uuid(), role, name: '', organisation: '', primaryContact: '' });
                  });
                }}
                className="text-sm text-nhs-blue hover:underline"
              >
                Add default NHS project roles
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nhs-grey-4">
                    <th className="text-left py-2 font-semibold text-nhs-grey-1">Role</th>
                    <th className="text-left py-2 font-semibold text-nhs-grey-1">Name</th>
                    <th className="text-left py-2 font-semibold text-nhs-grey-1">Organisation</th>
                    <th className="text-left py-2 font-semibold text-nhs-grey-1">Contact</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {projectDetails.team.map((member) => (
                    <tr key={member.id} className="border-b border-nhs-grey-4/50">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                          className="!py-1 !text-sm"
                          placeholder="Role"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateTeamMember(member.id, { name: e.target.value })}
                          className="!py-1 !text-sm"
                          placeholder="Name"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={member.organisation}
                          onChange={(e) => updateTeamMember(member.id, { organisation: e.target.value })}
                          className="!py-1 !text-sm"
                          placeholder="Organisation"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={member.primaryContact}
                          onChange={(e) => updateTeamMember(member.id, { primaryContact: e.target.value })}
                          className="!py-1 !text-sm"
                          placeholder="Email / Phone"
                        />
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeTeamMember(member.id)}
                          className="text-rag-red hover:text-red-800 text-lg"
                          title="Remove member"
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
