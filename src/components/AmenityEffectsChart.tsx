import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AmenityEffect } from '../types';
import { formatPercent } from '../utils/pricing';

interface AmenityEffectsChartProps {
  amenities: AmenityEffect[];
  checkedAmenities: Record<string, boolean>;
}

export const AmenityEffectsChart: React.FC<AmenityEffectsChartProps> = ({
  amenities,
  checkedAmenities,
}) => {
  // Sort amenities by price_premium descending for clear visualization
  const chartData = useMemo(() => {
    return [...amenities]
      .filter((a) => a && a.field_name && a.amenity)
      .sort((a, b) => Number(b.price_premium) - Number(a.price_premium))
      .map((item) => {
        const isChecked = Boolean(checkedAmenities[item.field_name]);
        const isReliable = item.reliable.trim().toLowerCase() === 'yes';
        const premium = Number(item.price_premium) || 0;
        const premiumPct = Math.round(premium * 1000) / 10; // e.g. 3.3

        return {
          field_name: item.field_name,
          amenity: item.amenity,
          premium,
          premiumPct,
          isChecked,
          isReliable,
          reliableText: item.reliable,
          label: isReliable ? item.amenity : `${item.amenity} (Low data)`,
        };
      });
  }, [amenities, checkedAmenities]);

  // Dynamic takeaway calculation based on user's checked amenities
  const takeaway = useMemo(() => {
    const checked = chartData.filter((d) => d.isChecked);
    const reliableChecked = checked.filter((d) => d.isReliable);
    const netBoost = reliableChecked.reduce((acc, curr) => acc + curr.premium, 0);

    if (checked.length === 0) {
      return 'No amenities currently selected. Adding high-yield items like an In-unit washer (+3.3%) or EV charger (+9.0%) can meaningfully increase nightly revenue.';
    }

    const hasHighEnd = checked.some((d) => d.field_name === 'gym' || d.field_name === 'pool');
    const hasUnreliable = checked.some((d) => !d.isReliable);

    let msg = `Your selected amenities deliver a ${formatPercent(netBoost)} combined price premium.`;
    if (hasHighEnd) {
      msg += ' Luxury building amenities (gym/pool) show the highest statistical lift in DC.';
    } else {
      msg += ' Practical amenities like in-unit laundry and dedicated workspaces provide reliable, steady pricing power without condo fee overhead.';
    }
    if (hasUnreliable) {
      msg += ' (Note: Hot tub is excluded from the price adjustment due to sample size constraints).';
    }
    return msg;
  }, [chartData]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-bold text-[#1F3A5F]">
            Do Amenities Raise Your Price?
          </h3>
          <p className="text-xs text-slate-500">
            Hedonic regression price premium by individual amenity across Washington, DC
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-3 h-3 rounded-sm bg-[#FF5A5F]" />
            Your Amenities
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded-sm bg-[#1F3A5F]" />
            Other Amenities
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span className="w-3 h-3 rounded-sm bg-slate-300" />
            Low Data (Excluded)
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 35, left: 20, bottom: 10 }}
          >
            <XAxis
              type="number"
              domain={[0, 45]}
              unit="%"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="amenity"
              width={140}
              tick={{ fontSize: 11, fill: '#1E293B' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1F3A5F] text-white text-xs rounded-lg p-2.5 shadow-md max-w-xs">
                      <div className="font-semibold text-slate-200">
                        {data.amenity}
                      </div>
                      <div className="font-mono text-sm font-bold text-white mt-1">
                        Price Premium: {formatPercent(data.premium)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-300">
                        Reliability: {data.isReliable ? 'Statistically Significant' : 'Too few listings (unreliable)'}
                      </div>
                      {data.isChecked && (
                        <div className="mt-1 text-[11px] text-[#FF5A5F] font-semibold">
                          ✓ Selected in your listing
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="premiumPct" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => {
                let fillColor = '#1F3A5F';
                if (!entry.isReliable) {
                  fillColor = '#CBD5E1'; // Gray out unreliable ones
                } else if (entry.isChecked) {
                  fillColor = '#FF5A5F'; // Coral for checked ones
                }
                return (
                  <Cell
                    key={`amenity-${index}`}
                    fill={fillColor}
                    opacity={entry.isReliable ? 1 : 0.7}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Caption required */}
      <p className="text-xs text-slate-500 italic mt-2 text-center sm:text-left">
        Effect after comparing listings in the same neighborhood and size. Pool and gym effects partly reflect luxury buildings.
      </p>

      {/* One-line plain-English takeaway */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <span className="font-bold text-[#1F3A5F] shrink-0">Takeaway:</span>
        <span className="leading-relaxed">{takeaway}</span>
      </div>
    </div>
  );
};
