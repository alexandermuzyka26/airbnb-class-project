import React from 'react';
import { Home, Sparkles, MapPin } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="border-b border-slate-200/90 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] flex items-center justify-center text-white shadow-xs">
            <Home className="w-5 h-5 text-[#FF5A5F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1F3A5F]">
                DC Airbnb Price Finder
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Live Market Data
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Empirical nightly pricing recommendations for Washington, DC hosts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1F3A5F] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer active:scale-98"
            title="Reset form to sample case (Capitol Hill 2 BR)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A5F]" />
            Reset to sample
          </button>
        </div>
      </div>
    </header>
  );
};
