'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleClose = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center h-14 bg-sidebar-bg px-4 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1 -ml-1"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <span className="text-white text-sm font-bold">MMC Assessment</span>
        </div>
        {/* Spacer to balance hamburger */}
        <div className="w-6" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleClose}
          />
        )}

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={handleClose} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-nhs-pale-grey">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
