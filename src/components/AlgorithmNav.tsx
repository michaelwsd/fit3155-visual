'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ALGORITHMS = [
  {
    id: 'home',
    name: 'Home',
    path: '/',
    accentClasses: {
      dot: 'bg-slate-400',
      activeBg: 'bg-slate-500/15',
      activeText: 'text-slate-300',
      activeRing: 'ring-slate-500/30',
    },
  },
  {
    id: 'z-algorithm',
    name: 'Z Algorithm',
    path: '/z-algorithm',
    accentClasses: {
      dot: 'bg-emerald-400',
      activeBg: 'bg-emerald-500/15',
      activeText: 'text-emerald-300',
      activeRing: 'ring-emerald-500/30',
    },
  },
  {
    id: 'boyer-moore',
    name: 'Boyer-Moore',
    path: '/boyer-moore',
    accentClasses: {
      dot: 'bg-blue-400',
      activeBg: 'bg-blue-500/15',
      activeText: 'text-blue-300',
      activeRing: 'ring-blue-500/30',
    },
  },
  {
    id: 'bwt',
    name: 'Burrows-Wheeler Transform',
    path: '/bwt',
    accentClasses: {
      dot: 'bg-purple-400',
      activeBg: 'bg-purple-500/15',
      activeText: 'text-purple-300',
      activeRing: 'ring-purple-500/30',
    },
  },
  {
    id: 'ukkonen',
    name: "Ukkonen's Suffix Tree",
    path: '/ukkonen',
    accentClasses: {
      dot: 'bg-amber-400',
      activeBg: 'bg-amber-500/15',
      activeText: 'text-amber-300',
      activeRing: 'ring-amber-500/30',
    },
  },
  {
    id: 'simplex',
    name: 'Linear Programming',
    path: '/simplex',
    accentClasses: {
      dot: 'bg-cyan-400',
      activeBg: 'bg-cyan-500/15',
      activeText: 'text-cyan-300',
      activeRing: 'ring-cyan-500/30',
    },
  },
  {
    id: 'hungarian',
    name: 'Hungarian Algorithm',
    path: '/hungarian',
    accentClasses: {
      dot: 'bg-rose-400',
      activeBg: 'bg-rose-500/15',
      activeText: 'text-rose-300',
      activeRing: 'ring-rose-500/30',
    },
  },
];

export default function AlgorithmNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!mounted || pathname === '/') return null;

  return (
    <div ref={ref} className="hidden md:block fixed top-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`
          relative w-10 h-10 rounded-xl
          bg-slate-800/90 backdrop-blur-sm border border-slate-700/50
          hover:bg-slate-700/90 hover:border-slate-600/50
          active:scale-95
          transition-all duration-200
          shadow-lg shadow-black/20
          flex items-center justify-center
        `}
        aria-label="Switch algorithm"
        title="Switch algorithm"
      >
        <div className="flex flex-col gap-[3px]">
          <span
            className={`block w-4 h-[2px] rounded-full bg-slate-300 transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-[5px]' : ''
            }`}
          />
          <span
            className={`block w-4 h-[2px] rounded-full bg-slate-300 transition-all duration-300 ${
              isOpen ? 'opacity-0 scale-0' : ''
            }`}
          />
          <span
            className={`block w-4 h-[2px] rounded-full bg-slate-300 transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-[5px]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <div
        className={`
          absolute top-12 left-0 w-64
          bg-slate-800/95 backdrop-blur-md
          border border-slate-700/50
          rounded-xl shadow-2xl shadow-black/40
          overflow-hidden
          transition-all duration-300 origin-top-left
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'}
        `}
      >
        <div className="p-1.5">
          {ALGORITHMS.map((algo, i) => {
            const isActive = algo.path === pathname;
            return (
              <button
                key={algo.id}
                onClick={() => {
                  router.push(algo.path);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-left text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? `${algo.accentClasses.activeBg} ${algo.accentClasses.activeText} ring-1 ${algo.accentClasses.activeRing}`
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
                  }
                `}
                style={{
                  transitionDelay: isOpen ? `${i * 40}ms` : '0ms',
                  transform: isOpen ? 'translateX(0)' : 'translateX(-8px)',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${algo.accentClasses.dot} ${
                    isActive ? 'scale-125' : 'opacity-60'
                  } transition-all duration-200`}
                />
                <span className="truncate">{algo.name}</span>
                {isActive && (
                  <svg
                    className={`w-3.5 h-3.5 ml-auto flex-shrink-0 ${algo.accentClasses.activeText}`}
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
