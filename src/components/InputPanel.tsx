import React from 'react';
import {
  AmenityEffect,
  BedroomType,
  Neighborhood,
  PricingInputs,
  RentalType,
} from '../types';
import { RotateCcw, Check, Info } from 'lucide-react';
import { formatPercent } from '../utils/pricing';

interface InputPanelProps {
  inputs: PricingInputs;
  onChange: (inputs: PricingInputs) => void;
  neighborhoods: Neighborhood[];
  amenities: AmenityEffect[];
  onReset: () => void;
}

const BEDROOM_OPTIONS: BedroomType[] = ['Studio', '1 BR', '2 BR', '3 BR', '4+ BR'];

export const InputPanel: React.FC<InputPanelProps> = ({
  inputs,
  onChange,
  neighborhoods,
  amenities,
  onReset,
}) => {
  // Alphabetical list of neighborhoods excluding "All DC"
  const sortedNeighborhoods = React.useMemo(() => {
    return neighborhoods
      .filter((n) => n.neighborhood !== 'All DC')
      .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  }, [neighborhoods]);

  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...inputs, neighborhood: e.target.value });
  };

  const handleRentalTypeChange = (type: RentalType) => {
    onChange({ ...inputs, rentalType: type });
  };

  const handleBedroomsChange = (bedrooms: BedroomType) => {
    onChange({ ...inputs, bedrooms });
  };

  const handleFinishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...inputs, finish: parseInt(e.target.value, 10) });
  };

  const handleAmenityToggle = (fieldName: string) => {
    const updated = {
      ...inputs.checkedAmenities,
      [fieldName]: !inputs.checkedAmenities[fieldName],
    };
    onChange({ ...inputs, checkedAmenities: updated });
  };

  const getFinishDescriptor = (val: number) => {
    if (val <= 2) return 'Basic / Budget';
    if (val <= 4) return 'Standard / Modest';
    if (val === 5) return 'Typical DC Market';
    if (val <= 7) return 'Updated / Modern';
    if (val <= 9) return 'High-end / Designer';
    return 'Ultra Luxury / Executive';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1F3A5F]">Listing Parameters</h2>
          <p className="text-xs text-slate-500 mt-0.5">Customize your DC property profile</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#1F3A5F] transition-colors cursor-pointer"
          title="Reset to Capitol Hill sample"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Neighborhood */}
        <div>
          <label
            htmlFor="neighborhood-select"
            className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5"
          >
            1. Neighborhood
          </label>
          <div className="relative">
            <select
              id="neighborhood-select"
              value={inputs.neighborhood}
              onChange={handleNeighborhoodChange}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 focus:border-[#1F3A5F] focus:ring-2 focus:ring-[#1F3A5F]/10 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-all cursor-pointer outline-none"
            >
              {sortedNeighborhoods.map((n) => (
                <option key={n.neighborhood} value={n.neighborhood}>
                  {n.neighborhood}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            40 distinct DC neighborhoods from Inside Airbnb
          </p>
        </div>

        {/* 2. What you're renting */}
        <div>
          <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">
            2. What you're renting
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleRentalTypeChange('Entire home')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputs.rentalType === 'Entire home'
                  ? 'bg-white text-[#1F3A5F] shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entire home
            </button>
            <button
              type="button"
              onClick={() => handleRentalTypeChange('Private room')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputs.rentalType === 'Private room'
                  ? 'bg-white text-[#1F3A5F] shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Private room
            </button>
          </div>
        </div>

        {/* 3. Bedrooms (hidden when Private room is selected) */}
        {inputs.rentalType === 'Entire home' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">
              3. Bedrooms
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {BEDROOM_OPTIONS.map((bedroom) => (
                <button
                  key={bedroom}
                  type="button"
                  onClick={() => handleBedroomsChange(bedroom)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    inputs.bedrooms === bedroom
                      ? 'bg-[#1F3A5F] text-white border-[#1F3A5F] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {bedroom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Interior finish & condition */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="finish-slider"
              className="text-xs font-bold text-slate-700 tracking-wide uppercase"
            >
              4. Interior Finish & Condition
            </label>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#1F3A5F] text-white">
              Level {inputs.finish} / 10
            </span>
          </div>

          <div className="space-y-2">
            <input
              id="finish-slider"
              type="range"
              min="1"
              max="10"
              step="1"
              value={inputs.finish}
              onChange={handleFinishChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1F3A5F]"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>1 = Basic</span>
              <span className="text-slate-700 font-semibold">5 = Typical</span>
              <span>10 = Luxury</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-500">Tier: </span>
              <span className="font-semibold text-[#1F3A5F]">
                {getFinishDescriptor(inputs.finish)}
              </span>
              <span className="text-slate-400 text-[11px] ml-1">
                ({(10 + ((inputs.finish - 1) * 80) / 9).toFixed(1)}th percentile)
              </span>
            </div>
          </div>
        </div>

        {/* 5. Amenities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
              5. Amenities
            </label>
            <span className="text-[11px] text-slate-500">
              {Object.values(inputs.checkedAmenities).filter(Boolean).length} selected
            </span>
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {amenities.map((item) => {
              const isChecked = Boolean(inputs.checkedAmenities[item.field_name]);
              const isReliable = item.reliable.trim().toLowerCase() === 'yes';
              const premium = Number(item.price_premium) || 0;

              return (
                <label
                  key={item.field_name}
                  onClick={() => handleAmenityToggle(item.field_name)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs select-none ${
                    isChecked
                      ? 'bg-rose-50/50 border-[#FF5A5F]/40 text-[#1F3A5F]'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-[#FF5A5F] border-[#FF5A5F] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate font-medium">{item.amenity}</span>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isReliable ? (
                      <span
                        className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                          premium > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {formatPercent(premium)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md font-medium">
                        not enough data
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Net amenity adjustment capped at ±20%.
          </p>
        </div>
      </div>
    </div>
  );
};
