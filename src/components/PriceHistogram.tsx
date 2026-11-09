import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Listing } from '../types';
import { formatCurrency } from '../utils/pricing';

interface PriceHistogramProps {
  listings: Listing[];
  neighborhood: string;
  listingType: string;
  isFallback: boolean;
  recommendedRate: number;
}

export const PriceHistogram: React.FC<PriceHistogramProps> = ({
  listings,
  neighborhood,
  listingType,
  isFallback,
  recommendedRate,
}) => {
  // Filter comparable listings:
  // bedroom_group matches listingType (for Entire home: Studio, 1 BR, 2 BR, 3 BR, 4+ BR; for Private room: 'Private room')
  // neighborhood matches unless fallback applied
  const compListings = useMemo(() => {
    return listings.filter((l) => {
      const matchType = l.bedroom_group === listingType;
      const matchNeigh = isFallback ? true : l.neighborhood === neighborhood;
      return matchType && matchNeigh && l.nightly_price_usd > 0;
    });
  }, [listings, neighborhood, listingType, isFallback]);

  // Generate dynamic histogram bins
  const { chartData, targetBinIndex, lowerThanPercent, minPrice, maxPrice } = useMemo(() => {
    if (compListings.length === 0) {
      return {
        chartData: [],
        targetBinIndex: -1,
        lowerThanPercent: 50,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    const prices = compListings.map((l) => l.nightly_price_usd).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];

    // Determine how many comps have price <= recommendedRate
    const belowOrEqualCount = prices.filter((p) => p <= recommendedRate).length;
    const lowerThan = Math.round((belowOrEqualCount / prices.length) * 100);

    // Filter out extreme 99th percentile outliers only for display binning if spread is massive (> $1000)
    const p98 = prices[Math.floor(prices.length * 0.98)] || max;
    const effectiveMax = Math.min(max, Math.max(p98, recommendedRate * 1.3));
    const effectiveMin = Math.max(0, Math.floor(min / 25) * 25);

    // Build 12-16 discrete bins
    const binCount = Math.min(14, Math.max(8, Math.floor((effectiveMax - effectiveMin) / 25)));
    const binSize = Math.max(15, Math.ceil((effectiveMax - effectiveMin) / binCount / 5) * 5);

    const bins: {
      rangeLabel: string;
      min: number;
      max: number;
      count: number;
      isTarget: boolean;
    }[] = [];

    let currentStart = effectiveMin;
    let targetIndex = -1;

    for (let i = 0; i < binCount; i++) {
      const currentEnd = currentStart + binSize;
      const isLast = i === binCount - 1;

      const inBin = prices.filter((p) => {
        if (isLast) {
          return p >= currentStart;
        }
        return p >= currentStart && p < currentEnd;
      });

      const containsTarget =
        recommendedRate >= currentStart &&
        (isLast ? true : recommendedRate < currentEnd);

      if (containsTarget) {
        targetIndex = i;
      }

      const label = isLast
        ? `$${currentStart}+`
        : `$${currentStart}–$${currentEnd}`;

      bins.push({
        rangeLabel: label,
        min: currentStart,
        max: isLast ? Infinity : currentEnd,
        count: inBin.length,
        isTarget: containsTarget,
      });

      currentStart = currentEnd;
    }

    return {
      chartData: bins,
      targetBinIndex: targetIndex,
      lowerThanPercent: lowerThan,
      minPrice: min,
      maxPrice: max,
    };
  }, [compListings, recommendedRate]);

  // Construct one-line plain-English takeaway
  const takeaway = useMemo(() => {
    if (compListings.length === 0) {
      return 'No active listings in the immediate comp set for this category.';
    }

    const scope = isFallback ? 'citywide in DC' : `in ${neighborhood}`;
    return `At ${formatCurrency(recommendedRate)}/night, your price sits above ${lowerThanPercent}% of the ${compListings.length} comparable ${listingType} listings ${scope} (spanning ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}).`;
  }, [recommendedRate, lowerThanPercent, compListings.length, listingType, isFallback, neighborhood, minPrice, maxPrice]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1F3A5F]">
            Where Your Price Sits
          </h3>
          <p className="text-xs text-slate-500">
            Distribution of {compListings.length} comparable {listingType} listings ({isFallback ? 'All DC fallback' : neighborhood})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A5F]" />
            Your Price: {formatCurrency(recommendedRate)}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="rangeLabel"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1F3A5F] text-white text-xs rounded-lg p-2.5 shadow-md">
                      <div className="font-semibold text-slate-200">
                        Price Bracket: {data.rangeLabel}
                      </div>
                      <div className="font-mono text-sm font-bold text-white mt-1">
                        {data.count} {data.count === 1 ? 'listing' : 'listings'}
                      </div>
                      {data.isTarget && (
                        <div className="mt-1 text-[11px] text-[#FF5A5F] font-semibold flex items-center gap-1">
                          ✦ Your rate ({formatCurrency(recommendedRate)}) falls here
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {targetBinIndex !== -1 && (
              <ReferenceLine
                x={chartData[targetBinIndex]?.rangeLabel}
                stroke="#FF5A5F"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `${formatCurrency(recommendedRate)}`,
                  position: 'top',
                  fill: '#FF5A5F',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
            )}
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isTarget ? '#FF5A5F' : '#94A3B8'}
                  opacity={entry.isTarget ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* One-line plain-English takeaway */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <span className="font-bold text-[#1F3A5F] shrink-0">Takeaway:</span>
        <span className="leading-relaxed">{takeaway}</span>
      </div>
    </div>
  );
};
