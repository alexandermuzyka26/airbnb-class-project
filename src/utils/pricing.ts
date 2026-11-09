import {
  AmenityCalculationBreakdown,
  AmenityEffect,
  CalculationResult,
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

export function calculatePrice(
  inputs: PricingInputs,
  ratesMap: Map<string, RateRow>,
  amenityEffects: AmenityEffect[]
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

  // e. Recommended nightly rate = base * (1 + adjustment), rounded to nearest $5
  const rawNightlyRate = basePrice * (1 + cappedAdjustment);
  const recommendedRate = Math.round(rawNightlyRate / 5) * 5;

  // f. Estimated annual revenue = recommended rate * median_nights_booked_12mo
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
