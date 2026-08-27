'use client';

import { motion, useReducedMotion } from 'framer-motion';
import TiltCard from './TiltCard';

const CHIPS = [
  { v: '95%', c: 'bg-emerald-500' },
  { v: '850', c: 'bg-teal-500' },
  { v: '24', c: 'bg-cyan-500' },
];

const BARS = [45, 70, 55, 85, 62, 92, 74];

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Pure-CSS mini dashboard preview — no external images required.
 *
 * Choreography (skipped entirely under `prefers-reduced-motion`, which
 * renders everything in its final settled state immediately):
 * 1. Whole card fades/slides/scales in, slightly after the hero text starts.
 * 2. Stat chips pop in with a small stagger.
 * 3. Bar chart bars grow up from the baseline, left to right.
 * 4. The floating "Presensi Tercatat" chip pops in last.
 * 5. Once everything has settled, the whole card starts a slow, gentle
 *    float loop so the hero doesn't go fully static.
 */
export default function HeroMockup() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative hidden lg:block" aria-hidden="true">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-100/80 via-transparent to-blue-100/80 blur-3xl"
      />

      <motion.div
        initial={
          shouldReduceMotion ? undefined : { opacity: 0, y: 32, scale: 0.96 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT }}
      >
        <motion.div
          className="relative"
          animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1.9,
                }
          }
        >
          <TiltCard className="relative rounded-3xl border border-white/60 bg-white/80 p-4 shadow-glass-lg backdrop-blur-md">
            {/* Window chrome */}
            <div className="mb-4 flex items-center gap-1.5 px-2 pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>

            <div className="flex gap-3">
              {/* Mini sidebar */}
              <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
                <div className="h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600" />
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-9 rounded-xl ${i === 1 ? 'bg-emerald-100' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-2">
                  {CHIPS.map((chip, i) => (
                    <motion.div
                      key={chip.v}
                      initial={
                        shouldReduceMotion
                          ? undefined
                          : { opacity: 0, scale: 0.8 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: shouldReduceMotion ? 0 : 1 + i * 0.08,
                        ease: EASE_OUT,
                      }}
                      className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                    >
                      <div
                        className={`mb-2 h-1.5 w-8 rounded-full ${chip.c}`}
                      />
                      <p className="text-base font-bold text-gray-900">
                        {chip.v}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 h-2 w-24 rounded-full bg-slate-200" />
                  <div className="flex h-24 items-end justify-between gap-2">
                    {BARS.map((h, i) => (
                      <motion.div
                        key={i}
                        style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                        initial={
                          shouldReduceMotion ? undefined : { scaleY: 0 }
                        }
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: shouldReduceMotion ? 0 : 1.15 + i * 0.05,
                          ease: EASE_OUT,
                        }}
                        className={`w-full rounded-t-md ${i === 5 ? 'bg-emerald-500' : 'bg-emerald-200'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Table rows */}
                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  {[1, 2].map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="h-7 w-7 rounded-lg bg-emerald-50 ring-1 ring-inset ring-emerald-100" />
                      <span className="h-2 flex-1 rounded-full bg-slate-100" />
                      <span className="h-5 w-14 rounded-full bg-emerald-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Floating glass chip */}
          <motion.div
            initial={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, scale: 0.85, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: shouldReduceMotion ? 0 : 1.6,
              ease: EASE_OUT,
            }}
            className="absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-glass-lg backdrop-blur-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-cta">
              <span className="material-symbols-outlined icon-fill text-[22px]">
                task_alt
              </span>
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Presensi Tercatat
              </p>
              <p className="text-xs text-gray-500">32/35 siswa hadir</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
