import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Neighborhood } from '../types';
import { ShieldAlert, Info } from 'lucide-react';

interface LicensingDonutProps {
  selectedNeighborhood: string;
  neighborhoods: Neighborhood[];
}

const COLORS = {
  hosted: '#1F3A5F',     // Navy - Hosted
  unhosted: '#F59E0B',   // Amber - Unhosted
  exempt: '#94A3B8',     // Slate - Exempt
};

export const LicensingDonut: React.FC<LicensingDonutProps> = ({
  selectedNeighborhood,
  neighborhoods,
}) => {
  const currentNbh = useMemo(() => {
    return neighborhoods.find((n) => n.neighborhood === selectedNeighborhood);
  }, [neighborhoods, selectedNeighborhood]);

  const allDCNbh = useMemo(() => {
    return neighborhoods.find((n) => n.neighborhood === 'All DC');
  }, [neighborhoods]);

  const localData = useMemo(() => {
    if (!currentNbh) return [];
    return [
      {
        name: 'Hosted License',
        value: Math.round(currentNbh.hosted_license_share * 1000) / 10,
        color: COLORS.hosted,
        desc: 'Host lives on-site',
      },
      {
        name: 'Unhosted License',
        value: Math.round(currentNbh.unhosted_license_share * 1000) / 10,
        color: COLORS.unhosted,
        desc: 'Vacation rental (capped 90 days/yr in DC)',
      },
      {
        name: 'Exempt',
        value: Math.round(currentNbh.exempt_share * 1000) / 10,
        color: COLORS.exempt,
        desc: 'Hotel, B&B or corporate stay exemption',
      },
    ];
  }, [currentNbh]);

  const allDCData = useMemo(() => {
    if (!allDCNbh) return [];
    return [
      {
        name: 'Hosted License',
        value: Math.round(allDCNbh.hosted_license_share * 1000) / 10,
        color: COLORS.hosted,
        desc: 'Host lives on-site',
      },
      {
        name: 'Unhosted License',
        value: Math.round(allDCNbh.unhosted_license_share * 1000) / 10,
        color: COLORS.unhosted,
        desc: 'Vacation rental (capped 90 days/yr in DC)',
      },
      {
        name: 'Exempt',
        value: Math.round(allDCNbh.exempt_share * 1000) / 10,
        color: COLORS.exempt,
        desc: 'Hotel, B&B or corporate stay exemption',
      },
    ];
  }, [allDCNbh]);

  // One-line plain-English takeaway
  const takeaway = useMemo(() => {
    if (!currentNbh) return 'Licensing breakdown by license category.';
    const hostedPct = (currentNbh.hosted_license_share * 100).toFixed(1);
    const unhostedPct = (currentNbh.unhosted_license_share * 100).toFixed(1);
    const exemptPct = (currentNbh.exempt_share * 100).toFixed(1);
    return `In ${selectedNeighborhood}, ${hostedPct}% of listings hold Hosted licenses, while Unhosted permits represent only ${unhostedPct}% (and ${exemptPct}% are exempt), reflecting DC's tight restrictions on absentee investor rentals.`;
  }, [currentNbh, selectedNeighborhood]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1F3A5F]">Licensing Snapshot</h3>
          <p className="text-xs text-slate-500">
            District Department of Licensing and Consumer Protection (DLCP) license distribution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Neighborhood Donut */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
          <div className="text-xs font-bold text-[#1F3A5F] mb-1 truncate">
            {selectedNeighborhood}
          </div>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={localData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {localData.map((entry, index) => (
                    <Cell key={`local-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1F3A5F] text-white text-xs rounded-lg p-2 shadow-md">
                          <div className="font-semibold">{data.name}</div>
                          <div className="font-mono text-sm font-bold text-white mt-0.5">
                            {data.value}%
                          </div>
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            {data.desc}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hosted</span>
              <span className="text-base font-extrabold text-[#1F3A5F] font-mono">
                {currentNbh ? `${(currentNbh.hosted_license_share * 100).toFixed(0)}%` : '--'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Local Neighborhood Share</div>
        </div>

        {/* All DC Benchmark Donut */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
          <div className="text-xs font-bold text-[#1F3A5F] mb-1">
            All DC Benchmark (Citywide)
          </div>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allDCData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allDCData.map((entry, index) => (
                    <Cell key={`dc-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1F3A5F] text-white text-xs rounded-lg p-2 shadow-md">
                          <div className="font-semibold">{data.name}</div>
                          <div className="font-mono text-sm font-bold text-white mt-0.5">
                            {data.value}%
                          </div>
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            {data.desc}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hosted</span>
              <span className="text-base font-extrabold text-[#1F3A5F] font-mono">
                {allDCNbh ? `${(allDCNbh.hosted_license_share * 100).toFixed(0)}%` : '74%'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Citywide Baseline</div>
        </div>
      </div>

      {/* Shared Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#1F3A5F]" />
          <span className="font-semibold text-slate-800">Hosted License</span>
          <span className="text-slate-400 text-[11px]">(On-site host)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span className="font-semibold text-slate-800">Unhosted License</span>
          <span className="text-slate-400 text-[11px]">(90-day annual cap)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#94A3B8]" />
          <span className="font-semibold text-slate-800">Exempt</span>
          <span className="text-slate-400 text-[11px]">(Commercial/B&B)</span>
        </div>
      </div>

      {/* Mandatory DLCP Legal Note */}
      <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Regulatory note:</strong> Most DC listings carry a 'Hosted' license, meaning the host lives on-site. Check current DC short-term rental rules with DLCP before listing. This is not legal advice.
        </p>
      </div>

      {/* One-line plain-English takeaway */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <span className="font-bold text-[#1F3A5F] shrink-0">Takeaway:</span>
        <span className="leading-relaxed">{takeaway}</span>
      </div>
    </div>
  );
};
