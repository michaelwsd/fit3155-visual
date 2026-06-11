'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

const ALGORITHMS = [
  {
    name: 'Z Algorithm',
    path: '/z-algorithm',
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
  {
    name: 'LP — Simplex Method',
    path: '/simplex',
    accent: {
      border: 'border-cyan-500/30',
      hoverBorder: 'hover:border-cyan-400/60',
      bg: 'bg-cyan-500/5',
      hoverBg: 'hover:bg-cyan-500/10',
      dot: 'bg-cyan-400',
      glow: 'hover:shadow-cyan-500/10',
      title: 'text-cyan-300',
      arrow: 'text-cyan-400',
    },
  },
  {
    name: 'Hungarian Algorithm',
    path: '/hungarian',
    accent: {
      border: 'border-rose-500/30',
      hoverBorder: 'hover:border-rose-400/60',
      bg: 'bg-rose-500/5',
      hoverBg: 'hover:bg-rose-500/10',
      dot: 'bg-rose-400',
      glow: 'hover:shadow-rose-500/10',
      title: 'text-rose-300',
      arrow: 'text-rose-400',
    },
  },
];

export default function HomePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
            FIT3155 - Algorithms Visualizer
          </h1>
          <button
            onClick={() => setShowAbout(true)}
            className="group mt-4 px-4 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/40 text-xs text-slate-400 cursor-pointer hover:text-slate-200 hover:border-slate-500/60 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-500/5 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="inline-flex items-center gap-1.5">
              About this tool
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:rotate-12">
                <path d="M4 8h8M9 5l3 3-3 3" />
              </svg>
            </span>
          </button>
        </div>

        {/* Algorithm Cards — one per row */}
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {ALGORITHMS.map((algo, i) => (
            <Link
              key={algo.path}
              href={algo.path}
              className={`
                group relative rounded-xl border px-6 py-5
                ${algo.accent.border} ${algo.accent.hoverBorder}
                ${algo.accent.bg} ${algo.accent.hoverBg}
                transition-all duration-300
                hover:shadow-xl ${algo.accent.glow}
                hover:-translate-y-0.5
                animate-fade-in-up
              `}
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${algo.accent.dot} shrink-0`} />
                  <h2 className={`text-base font-bold ${algo.accent.title}`}>
                    {algo.name}
                  </h2>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 ${algo.accent.arrow} opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1`}
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
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

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          onClick={() => setShowAbout(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up [animation-duration:200ms]" />
          <div
            className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 max-w-md w-full p-8 animate-fade-in-up [animation-duration:300ms]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-slate-100 mb-4">About</h2>

            <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
              <p>
                Built by <span className="text-slate-200 font-medium">Michael Wang</span>, a TA for <span className="text-slate-200 font-medium">FIT3155 Advanced Data Structures and Algorithms</span> at Monash University.
              </p>
              <p>
                I first built an <a href="https://lpm-algo-visual.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">earlier version</a> while studying the unit in Semester 2, 2025. When I started teaching in 2026, I made a Ukkonen's suffix tree visualizer (because I made a mistake running Ukkonen's by hand in class and it was embarrassing) that received great feedback from students, which motivated me to keep improving it into what you see today.
              </p>
              <p>
                The goal is to make these algorithms intuitive by letting you step through each one interactively, watching internal state change at every stage.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-slate-600 space-y-1">
                <p>Thanks to Arun for feedback on the tool.</p>
                <p>Feel free to contact me about any issues:</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.linkedin.com/in/michaelwsd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="mailto:michael.wang9@monash.edu"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  aria-label="Email"
                  title="michael.wang9@monash.edu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
