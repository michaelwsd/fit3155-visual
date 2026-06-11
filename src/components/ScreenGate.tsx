'use client';

import React from 'react';

export default function ScreenGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Small screen message */}
      <div className="md:hidden h-screen bg-slate-950 flex flex-col items-center justify-center px-8 text-center">
        {/* Animated icon */}
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-300"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/80 animate-bounce [animation-delay:0ms]" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-blue-400/80 animate-bounce [animation-delay:300ms]" />
        </div>

        <h2 className="text-lg font-bold text-slate-100 mb-2">
          Larger Screen Recommended
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-8">
          This visualizer is designed for tablets and laptops. Please switch to a device with a wider screen for the best experience.
        </p>

        {/* Navigation links */}
        <div className="w-full max-w-xs space-y-2">
          {[
            { name: 'Z Algorithm', path: '/z-algorithm', color: 'bg-emerald-400' },
            { name: 'Boyer-Moore', path: '/boyer-moore', color: 'bg-blue-400' },
            { name: 'Burrows-Wheeler Transform', path: '/bwt', color: 'bg-purple-400' },
            { name: "Ukkonen's Suffix Tree", path: '/ukkonen', color: 'bg-amber-400' },
          ].map((algo) => (
            <a
              key={algo.path}
              href={algo.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-sm text-slate-300 font-medium transition-colors hover:bg-slate-700/60"
            >
              <span className={`w-2 h-2 rounded-full ${algo.color} opacity-70`} />
              {algo.name}
            </a>
          ))}
        </div>
      </div>

      {/* Normal content for md+ screens */}
      <div className="hidden md:contents">
        {children}
      </div>
    </>
  );
}
