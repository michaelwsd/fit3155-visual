'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

const ALGORITHMS = [
  {
    name: 'Z Algorithm',
    path: '/z-algorithm',
    description: 'Linear-time pattern matching using the Z-array to find all occurrences of a pattern in text.',
    accent: {
      border: 'border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-400/60',
      bg: 'bg-emerald-500/5',
      hoverBg: 'hover:bg-emerald-500/10',
      dot: 'bg-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
      title: 'text-emerald-300',
      arrow: 'text-emerald-400',
    },
  },
  {
    name: 'Boyer-Moore',
    path: '/boyer-moore',
    description: 'Efficient string search with bad character and good suffix heuristics for sublinear average-case performance.',
    accent: {
      border: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400/60',
      bg: 'bg-blue-500/5',
      hoverBg: 'hover:bg-blue-500/10',
      dot: 'bg-blue-400',
      glow: 'hover:shadow-blue-500/10',
      title: 'text-blue-300',
      arrow: 'text-blue-400',
    },
  },
  {
    name: 'Burrows-Wheeler Transform',
    path: '/bwt',
    description: 'Text indexing via the BWT with rank and occurrence tables enabling O(m) backward search.',
    accent: {
      border: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400/60',
      bg: 'bg-purple-500/5',
      hoverBg: 'hover:bg-purple-500/10',
      dot: 'bg-purple-400',
      glow: 'hover:shadow-purple-500/10',
      title: 'text-purple-300',
      arrow: 'text-purple-400',
    },
  },
  {
    name: "Ukkonen's Suffix Tree",
    path: '/ukkonen',
    description: 'Online construction of suffix trees in linear time with suffix links, enabling powerful string operations.',
    accent: {
      border: 'border-amber-500/30',
      hoverBorder: 'hover:border-amber-400/60',
      bg: 'bg-amber-500/5',
      hoverBg: 'hover:bg-amber-500/10',
      dot: 'bg-amber-400',
      glow: 'hover:shadow-amber-500/10',
      title: 'text-amber-300',
      arrow: 'text-amber-400',
    },
  },
];

export default function HomePage() {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
            FIT3155 - Algorithms Visualizer
          </h1>
          <p className="text-xs text-slate-600 mt-3">
            Built by Michael Wang
          </p>
        </div>

        {/* Algorithm Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {ALGORITHMS.map((algo) => (
            <Link
              key={algo.path}
              href={algo.path}
              className={`
                group relative rounded-xl border p-6
                ${algo.accent.border} ${algo.accent.hoverBorder}
                ${algo.accent.bg} ${algo.accent.hoverBg}
                transition-all duration-300
                hover:shadow-xl ${algo.accent.glow}
                hover:-translate-y-0.5
              `}
            >
              {/* Title */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-2 h-2 rounded-full ${algo.accent.dot}`} />
                <h2 className={`text-base font-bold ${algo.accent.title}`}>
                  {algo.name}
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {algo.description}
              </p>

              {/* Arrow */}
              <div className={`flex items-center gap-1 text-xs font-medium ${algo.accent.arrow} opacity-60 group-hover:opacity-100 transition-opacity`}>
                <span>Explore</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
