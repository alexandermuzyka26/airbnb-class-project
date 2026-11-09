import React, { useState } from 'react';
import { CalculationResult, PricingInputs } from '../types';
import { formatCurrency, formatPercent } from '../utils/pricing';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Calculator,
} from 'lucide-react';

interface HeroPriceCardProps {
  calculation: CalculationResult;
  inputs: PricingInputs;
}

export const HeroPriceCard: React.FC<HeroPriceCardProps> = ({
  calculation,
  inputs,
}) => {
  const [showMath, setShowMath] = useState(false);

  const {
    recommendedRate,
    estimatedAnnualRevenue,
    isFallback,
    p25,
    p75,
    comparableCount,
    rateRow,
    listingType,
    percentile,
    basePrice,
    interpolationBracket,
    amenityBreakdowns,
    rawAdjustment,
    cappedAdjustment,
    medianNights,
  } = calculation;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Fallback Warning Banner if applicable */}
      {isFallback && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-2.5 text-amber-900 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold">Notice:</strong> Few comparable listings here ({rateRow.comparable_listings < 5 ? `${rateRow.comparable_listings}` : '< 5'} comps) — using all-DC rates.
          </span>
        </div>
      )}

      {/* Main Pricing Metrics */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider text-[#1F3A5F] bg-slate-100 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-[#FF5A5F]" />
              Recommended Nightly Rate
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#FF5A5F] font-mono">
                {formatCurrency(recommendedRate)}
              </span>
              <span className="text-slate-500 font-medium text-base">/ night</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Optimized for occupancy and revenue based on DC market comps
            </p>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Typical Range */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                Typical Range (p25–p75)
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                {formatCurrency(p25)} – {formatCurrency(p75)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Middle 50% of comps</div>
            </div>

            {/* Comparable Listings */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Comparable Listings
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                {comparableCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isFallback ? 'Citywide sample' : 'In neighborhood'}
              </div>
            </div>

            {/* Annual Revenue */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Estimated Annual
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
                {formatCurrency(estimatedAnnualRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {medianNights} booked nights/yr
              </div>
            </div>
          </div>
        </div>

        {/* Footnote on annual revenue */}
        <div className="pt-3 pb-1 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <span className="italic">
            Estimate based on similar listings' booked nights (Inside Airbnb estimate).
          </span>
          <button
            type="button"
            onClick={() => setShowMath(!showMath)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3A5F] hover:text-[#FF5A5F] transition-colors cursor-pointer py-1"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{showMath ? 'Hide calculation details' : 'How we calculated this'}</span>
            {showMath ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Collapsible Math Section */}
        {showMath && (
          <div className="mt-4 pt-4 border-t border-slate-200/90 text-xs text-slate-700 space-y-4 bg-slate-50/70 p-4 rounded-xl border">
            <div>
              <h3 className="font-bold text-[#1F3A5F] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#FF5A5F]" />
                Step-by-Step Pricing Formula
              </h3>
              <p className="text-slate-600 mb-3">
                Calculated strictly from empirical rates in <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">dc_rates.csv</code> and amenity regression premiums in <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">dc_amenity_effects.csv</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Step A & B */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">
                  1. Comp Set Lookup
                </div>
                <p className="text-slate-600">
                  Target: <span className="font-mono font-medium">{inputs.neighborhood} | {listingType}</span>
                </p>
                <p className="text-slate-600 mt-1">
                  Active comps: <strong className="font-mono">{comparableCount}</strong> {comparableCount < 5 ? '(Triggered All DC fallback)' : '(Local neighborhood rates)'}
                </p>
                <div className="mt-2 text-[11px] text-slate-500 font-mono">
                  p10: ${calculation.p10} | p25: ${calculation.p25} | med: ${calculation.median} | p75: ${calculation.p75} | p90: ${calculation.p90}
                </div>
              </div>

              {/* Step C */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">
                  2. Finish Percentile Interpolation
                </div>
                <p className="text-slate-600">
                  Finish level <strong className="font-mono">{inputs.finish}/10</strong> maps to percentile:
                </p>
                <div className="bg-slate-50 p-1.5 rounded font-mono text-[11px] text-slate-800 my-1">
                  10 + ({inputs.finish} − 1) × 80/9 = {percentile.toFixed(2)}th percentile
                </div>
                <p className="text-slate-600">
                  Interpolated between {interpolationBracket.lowPct}th (${interpolationBracket.lowVal}) and {interpolationBracket.highPct}th (${interpolationBracket.highVal}):
                </p>
                <p className="font-bold text-[#1F3A5F] mt-1 font-mono">
                  Base Price = ${basePrice.toFixed(2)}
                </p>
              </div>

              {/* Step D */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">
                  3. Amenity Premium Adjustment
                </div>
                <div className="space-y-1 mb-2">
                  {amenityBreakdowns.filter((a) => a.checked).length === 0 ? (
                    <span className="text-slate-500 italic">No amenities checked (0.0%)</span>
                  ) : (
                    amenityBreakdowns
                      .filter((a) => a.checked)
                      .map((a) => (
                        <div key={a.field_name} className="flex justify-between items-center text-[11px]">
                          <span>{a.amenity}:</span>
                          <span className="font-mono font-medium">
                            {a.reliable ? (
                              formatPercent(a.premium)
                            ) : (
                              <span className="text-amber-700 italic">0.0% (not enough data)</span>
                            )}
                          </span>
                        </div>
                      ))
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-mono font-semibold">
                  <span>Net Adjustment (capped ±20%):</span>
                  <span className={cappedAdjustment >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {formatPercent(cappedAdjustment)}
                  </span>
                </div>
              </div>

              {/* Step E & F */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">
                  4. Nightly Rate & Annual Revenue
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div>Raw = ${basePrice.toFixed(2)} × (1 + {cappedAdjustment.toFixed(3)}) = ${(basePrice * (1 + cappedAdjustment)).toFixed(2)}</div>
                  <div className="font-bold text-[#FF5A5F] text-xs">
                    Rounded to nearest $5 = ${recommendedRate}/night
                  </div>
                  <div className="text-slate-500 pt-1">
                    Annual = ${recommendedRate} × {medianNights} median booked nights = {formatCurrency(estimatedAnnualRevenue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
