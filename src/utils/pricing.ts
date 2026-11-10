import {
  AmenityCalculationBreakdown,
  AmenityEffect,
  BathroomEffect,
  CalculationResult,
  Listing,
  PricingInputs,
  RateRow,
} from '../types';

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatPercent(val: number, decimals: number = 1): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${(val * 100).toFixed(decimals)}%`;
}

// A bathroom count is offered only if at least this many listings in the bedroom group have it.
export const MIN_BATHROOM_LISTINGS = 20;
// Same ±20% bound as the amenity adjustment. It also limits double counting with the finish
// slider: homes with extra bathrooms tend to be nicer, so part of this premium overlaps with finish.
export const BATHROOM_ADJUSTMENT_CAP = 0.2;
// Bathrooms only adjust entire-home 1–4+ BR listings. Studios all have 1 bath (no variation), and
// private-room bathroom counts are mostly shared baths, which do not mean a nicer room.
const BATHROOM_GROUPS = ['1 BR', '2 BR', '3 BR', '4+ BR'];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function bathroomBucket(baths: number): { bucket: string; value: number } {
  const rounded = Math.round(baths * 2) / 2;
  return rounded >= 4 ? { bucket: '4+', value: 4 } : { bucket: String(rounded), value: rounded };
}

/**
 * Bathroom premium per bedroom group: for listings of that group with a given bathroom count,
 * the median price_index (price ÷ comp-set median for the same neighborhood and bedroom count) minus 1.
 * Because price_index is already relative to neighborhood × bedroom comps, this isolates bathrooms.
 * Returns only buckets with enough listings, and only groups with at least two such buckets.
 */
export function computeBathroomEffects(listings: Listing[]): Map<string, BathroomEffect[]> {
  const groups = new Map<string, Map<string, { value: number; indices: number[] }>>();
  for (const l of listings) {
    if (!BATHROOM_GROUPS.includes(l.bedroom_group)) continue;
    if (typeof l.bathrooms !== 'number' || typeof l.price_index !== 'number') continue;
    const { bucket, value } = bathroomBucket(l.bathrooms);
    if (value < 1) continue; // 0 / 0.5 baths for a 1+ BR home are data-entry noise
    const byBucket = groups.get(l.bedroom_group) ?? new Map();
    const cell = byBucket.get(bucket) ?? { value, indices: [] };
    cell.indices.push(l.price_index);
    byBucket.set(bucket, cell);
    groups.set(l.bedroom_group, byBucket);
  }

  const result = new Map<string, BathroomEffect[]>();
  for (const [bedroomGroup, byBucket] of groups) {
    const effects = [...byBucket.entries()]
      .filter(([, c]) => c.indices.length >= MIN_BATHROOM_LISTINGS)
      .map(([bucket, c]) => {
        const medianPriceIndex = median(c.indices);
        return {
          bedroomGroup,
          bucket,
          bathroomsValue: c.value,
          listings: c.indices.length,
          medianPriceIndex,
          premium: medianPriceIndex - 1,
        };
      })
      .sort((a, b) => a.bathroomsValue - b.bathroomsValue);
    if (effects.length >= 2) result.set(bedroomGroup, effects);
  }
  return result;
}

export function calculatePrice(
  inputs: PricingInputs,
  ratesMap: Map<string, RateRow>,
  amenityEffects: AmenityEffect[],
  bathroomEffects: Map<string, BathroomEffect[]> = new Map()
): CalculationResult | null {
  // a. listing_type
  const listingType =
    inputs.rentalType === 'Private room' ? 'Private room' : inputs.bedrooms;

  // b. lookup rate row
  const primaryKey = `${inputs.neighborhood}|${listingType}`;
  const fallbackKey = `All DC|${listingType}`;

  const primaryRow = ratesMap.get(primaryKey);
  const fallbackRow = ratesMap.get(fallbackKey);

  let rateRow: RateRow;
  let isFallback = false;

  if (primaryRow && primaryRow.comparable_listings >= 5) {
    rateRow = primaryRow;
    isFallback = false;
  } else if (fallbackRow) {
    rateRow = fallbackRow;
    isFallback = true;
  } else {
    // If neither is found (unexpected), return null
    return null;
  }

  // c. finish to percentile: pct = 10 + (finish - 1) * 80 / 9
  const pct = 10 + ((inputs.finish - 1) * 80) / 9;

  let basePrice = 0;
  let lowPct = 10;
  let highPct = 25;
  let lowVal = rateRow.p10_usd;
  let highVal = rateRow.p25_usd;

  if (pct <= 25) {
    lowPct = 10;
    highPct = 25;
    lowVal = rateRow.p10_usd;
    highVal = rateRow.p25_usd;
    basePrice = lowVal + ((pct - lowPct) / (highPct - lowPct)) * (highVal - lowVal);
  } else if (pct <= 50) {
    lowPct = 25;
    highPct = 50;
    lowVal = rateRow.p25_usd;
    highVal = rateRow.median_usd;
    basePrice = lowVal + ((pct - lowPct) / (highPct - lowPct)) * (highVal - lowVal);
  } else if (pct <= 75) {
    lowPct = 50;
    highPct = 75;
    lowVal = rateRow.median_usd;
    highVal = rateRow.p75_usd;
    basePrice = lowVal + ((pct - lowPct) / (highPct - lowPct)) * (highVal - lowVal);
  } else {
    lowPct = 75;
    highPct = 90;
    lowVal = rateRow.p75_usd;
    highVal = rateRow.p90_usd;
    basePrice = lowVal + ((pct - lowPct) / (highPct - lowPct)) * (highVal - lowVal);
  }

  // d. Amenity adjustment
  const validAmenities = amenityEffects.filter(
    (a) => a && a.field_name && a.amenity
  );

  const amenityBreakdowns: AmenityCalculationBreakdown[] = validAmenities.map((amenity) => {
    const isChecked = Boolean(inputs.checkedAmenities[amenity.field_name]);
    const isReliable = Boolean(
      amenity.reliable && amenity.reliable.trim().toLowerCase() === 'yes'
    );
    return {
      field_name: amenity.field_name,
      amenity: amenity.amenity,
      premium: Number(amenity.price_premium) || 0,
      reliable: isReliable,
      checked: isChecked,
    };
  });

  let rawAdjustment = 0;
  for (const b of amenityBreakdowns) {
    if (b.checked && b.reliable) {
      rawAdjustment += b.premium;
    }
  }

  // Cap between -0.20 and +0.20 (-20% to +20%)
  const cappedAdjustment = Math.min(0.20, Math.max(-0.20, rawAdjustment));

  // e. Bathroom adjustment (entire homes only; 0 when not specified or not enough data)
  const bathroomEffect =
    inputs.rentalType === 'Entire home' && inputs.bathrooms
      ? bathroomEffects.get(listingType)?.find((e) => e.bucket === inputs.bathrooms) ?? null
      : null;
  const bathroomAdjustment = bathroomEffect
    ? Math.min(BATHROOM_ADJUSTMENT_CAP, Math.max(-BATHROOM_ADJUSTMENT_CAP, bathroomEffect.premium))
    : 0;

  // f. Recommended nightly rate = base * (1 + amenities) * (1 + bathrooms), rounded to nearest $5
  const rawNightlyRate = basePrice * (1 + cappedAdjustment) * (1 + bathroomAdjustment);
  const recommendedRate = Math.round(rawNightlyRate / 5) * 5;

  // g. Estimated annual revenue = recommended rate * median_nights_booked_12mo
  const estimatedAnnualRevenue = recommendedRate * rateRow.median_nights_booked_12mo;

  return {
    listingType,
    rateRow,
    isFallback,
    percentile: pct,
    basePrice,
    interpolationBracket: {
      lowPct,
      highPct,
      lowVal,
      highVal,
    },
    amenityBreakdowns,
    rawAdjustment,
    cappedAdjustment,
    bathroomEffect,
    bathroomAdjustment,
    recommendedRate,
    estimatedAnnualRevenue,
    comparableCount: rateRow.comparable_listings,
    p10: rateRow.p10_usd,
    p25: rateRow.p25_usd,
    median: rateRow.median_usd,
    p75: rateRow.p75_usd,
    p90: rateRow.p90_usd,
    medianNights: rateRow.median_nights_booked_12mo,
  };
}
