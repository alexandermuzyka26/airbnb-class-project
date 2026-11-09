import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1F3A5F]" />
            <span>
              Data: Inside Airbnb, Washington DC snapshot June 17, 2025 (CC BY 4.0).
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Prices are posted asking prices, excluding cleaning fees and taxes.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
