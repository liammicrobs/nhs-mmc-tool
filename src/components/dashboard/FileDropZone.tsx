'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MMCAssessmentSchema } from '@/lib/validation/assessment-schema';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import type { MMCAssessmentState } from '@/types';

interface ImportResult {
  filename: string;
  success: boolean;
  error?: string;
}

export function FileDropZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addProject = useDashboardStore((s) => s.addProject);

  // Auto-clear results after 5 seconds
  useEffect(() => {
    if (results.length === 0) return;
    const timer = setTimeout(() => setResults([]), 5000);
    return () => clearTimeout(timer);
  }, [results]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsProcessing(true);
      const importResults: ImportResult[] = [];

      for (const file of Array.from(files)) {
        try {
          const text = await file.text();
          const raw = JSON.parse(text);
          const parsed = MMCAssessmentSchema.safeParse(raw);

          if (!parsed.success) {
            importResults.push({
              filename: file.name,
              success: false,
              error: 'Invalid assessment file structure',
            });
            continue;
          }

          const result = addProject(parsed.data as MMCAssessmentState);
          if (result.added) {
            importResults.push({ filename: file.name, success: true });
          } else {
            importResults.push({
              filename: file.name,
              success: false,
              error: result.reason || 'Could not add project',
            });
          }
        } catch {
          importResults.push({
            filename: file.name,
            success: false,
            error: 'Invalid JSON format',
          });
        }
      }

      setResults(importResults);
      setIsProcessing(false);
    },
    [addProject],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [processFiles],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-nhs-blue bg-nhs-blue/5'
            : 'border-nhs-grey-3 hover:border-nhs-blue/50'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-nhs-blue animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm font-medium text-nhs-grey-1">Processing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Heroicon: arrow-up-tray */}
            <svg
              className="w-10 h-10 text-nhs-blue"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-base font-semibold text-nhs-black">
              Drop MMC assessment files here
            </p>
            <p className="text-sm text-nhs-grey-1">or click to browse</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.mmc.json"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Import results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                r.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {r.success ? (
                <svg
                  className="w-4 h-4 text-green-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="font-medium">{r.filename}</span>
              {r.error && (
                <span className="text-xs ml-1">- {r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
