import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-5">
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2 pt-2">
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="h-8 bg-slate-100 rounded-lg"></div>
              <div className="h-8 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero skeleton */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-14 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-16 bg-slate-100 rounded-xl"></div>
            </div>
          </div>

          {/* Histogram skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="h-60 bg-slate-100 rounded-xl"></div>
          </div>

          {/* Map skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
            <div className="h-80 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
