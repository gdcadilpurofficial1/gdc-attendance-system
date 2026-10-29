import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle2 } from 'lucide-react';

export const CloudWakeupBanner: React.FC = () => {
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(false);
  const [justConnected, setJustConnected] = useState<boolean>(false);

  useEffect(() => {
    const handleStart = () => {
      setIsWarmingUp(true);
      setJustConnected(false);
    };

    const handleEnd = () => {
      if (isWarmingUp) {
        setIsWarmingUp(false);
        setJustConnected(true);
        const timer = setTimeout(() => {
          setJustConnected(false);
        }, 2800);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('gdc-cloud-warming-up', handleStart);
    window.addEventListener('gdc-cloud-online', handleEnd);

    return () => {
      window.removeEventListener('gdc-cloud-warming-up', handleStart);
      window.removeEventListener('gdc-cloud-online', handleEnd);
    };
  }, [isWarmingUp]);

  if (!isWarmingUp && !justConnected) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out max-w-[92vw] sm:max-w-md w-full"
    >
      {isWarmingUp && (
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
            <Cloud className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="truncate">Connecting to Cloud Server...</span>
              <span className="text-[10px] text-indigo-300 font-mono">Waking Up</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              Backend wakes up from sleep (~20-30s on first load). Please wait.
            </p>
          </div>
        </div>
      )}

      {justConnected && (
        <div className="bg-emerald-950/90 text-emerald-100 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700/60 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold">
            Cloud backend online! All services operational.
          </div>
        </div>
      )}
    </aside>
  );
};
