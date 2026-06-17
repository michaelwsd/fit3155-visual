'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

const ALGORITHMS = [
  {
    name: 'Z Algorithm',
    description: 'Linear-time pattern matching using the Z-array',
    path: '/z-algorithm',
    color: '#34d399',
  },
  {
    name: 'Boyer-Moore',
    description: 'String search with bad character & good suffix heuristics',
    path: '/boyer-moore',
    color: '#60a5fa',
  },
  {
    name: 'Burrows-Wheeler Transform',
    description: 'BWT construction, inverse, and pattern search',
    path: '/bwt',
    color: '#c084fc',
  },
  {
    name: "Ukkonen's Suffix Tree",
    description: 'Online suffix tree construction with suffix links',
    path: '/ukkonen',
    color: '#fbbf24',
  },
  {
    name: 'Linear Programming',
    description: 'Simplex method with tableau pivoting',
    path: '/simplex',
    color: '#22d3ee',
  },
  {
    name: 'Hungarian Algorithm',
    description: 'Optimal assignment for cost matrices',
    path: '/hungarian',
    color: '#fb7185',
  },
];

function AlgoCard({ algo, index }: { algo: typeof ALGORITHMS[number]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setPos({ x, y });

    const centerX = r.width / 2;
    const centerY = r.height / 2;
    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 8;
    setTilt({ rotateX, rotateY });
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <Link
      ref={ref}
      href={algo.path}
      className="group relative rounded-2xl overflow-hidden animate-fade-in-up hover:shadow-2xl"
      style={{
        animationDelay: `${150 + index * 70}ms`,
        perspective: '800px',
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
    >
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: hovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(4px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border border-slate-800/80 group-hover:border-slate-600/60 transition-colors duration-500 pointer-events-none" />

        {/* Card body */}
        <div className="relative rounded-2xl bg-slate-900/70 backdrop-blur-sm px-6 py-4">
          {/* Mouse spotlight */}
          <div
            className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(148,163,184,0.06), transparent 60%)`,
            }}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: algo.color }}
              />
              <h2 className="text-[15px] font-semibold text-slate-200 group-hover:text-slate-100 transition-colors duration-300 truncate">
                {algo.name}
              </h2>
            </div>

            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 bg-slate-800/50 group-hover:bg-slate-800/80">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-600 group-hover:text-slate-400 transition-all duration-300 group-hover:translate-x-0.5"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const backdropClass = closing
    ? 'animate-fade-out [animation-duration:200ms]'
    : 'animate-fade-in-up [animation-duration:200ms]';
  const panelClass = closing
    ? 'animate-fade-out-down [animation-duration:250ms]'
    : 'animate-fade-in-up [animation-duration:300ms]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={handleClose}
    >
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${backdropClass}`} />
      <div
        className={`relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 max-w-md w-full p-8 ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
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
            I first built an <a href="https://lpm-algo-visual.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">earlier version</a>{' '}while studying the unit in Semester 2, 2025. When I started teaching in 2026, I made a Ukkonen&apos;s suffix tree visualizer (because I made a mistake running Ukkonen&apos;s by hand in class and it was embarrassing) that received great feedback from students, which motivated me to keep improving it into what you see today.
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
  );
}

export default function HomePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-150 h-150 rounded-full bg-emerald-500/3 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 rounded-full bg-purple-500/4 blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-100 h-100 rounded-full bg-cyan-500/3 blur-[100px]" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-slate-700/30"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-500 mb-3">FIT3155</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-linear-to-b from-slate-100 to-slate-400 bg-clip-text text-transparent pb-1">
            Algorithm Visualizer
          </h1>
          <button
            onClick={() => setShowAbout(true)}
            className="group mt-4 px-5 py-2 rounded-full border border-slate-800/60 bg-slate-900/40 text-xs text-slate-500 cursor-pointer hover:text-slate-300 hover:border-slate-600/60 hover:bg-slate-800/60 transition-all duration-300 backdrop-blur-sm"
          >
            <span className="inline-flex items-center gap-2">
              About this tool
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M4 8h8M9 5l3 3-3 3" />
              </svg>
            </span>
          </button>
        </div>

        {/* Card list */}
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {ALGORITHMS.map((algo, i) => (
            <AlgoCard key={algo.path} algo={algo} index={i} />
          ))}
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
