export interface Neighborhood {
  neighborhood: string;
  active_listings: number;
  entire_home_share: number;
  median_price_1br_entire_usd: number;
  median_nights_booked_12mo: number;
  median_revenue_12mo_usd: number;
  center_latitude: number;
  center_longitude: number;
  hosted_license_share: number;
  unhosted_license_share: number;
  exempt_share: number;
}

export interface RateRow {
  key: string;
  neighborhood: string;
  comparable_listings: number;
  listing_type: string;
  p10_usd: number;
  median_usd: number;
  p25_usd: number;
  p75_usd: number;
  p90_usd: number;
  median_nights_booked_12mo: number;
  median_revenue_12mo_usd: number;
  reliable_comp_set: string;
}

export interface AmenityEffect {
  field_name: string;
  amenity: string;
  listings_with: number;
  listings_without: number;
  median_price_index_with: number;
  median_price_index_without: number;
  price_premium: number;
  median_nights_booked_with: number;
  median_nights_booked_without: number;
  reliable: string; // "Yes" | "No - too few listings"
}

export interface Listing {
  listing_id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  room_type: string;
  bedroom_group: string;
  bedrooms: number;
  bathrooms: number;
  accommodates: number;
  nightly_price_usd: number;
  est_nights_booked_12mo: number;
  est_revenue_12mo_usd: number;
  review_score: number;
  reviews_12mo: number;
  minimum_nights: number;
  license_type: string;
  free_parking: number;
  in_unit_washer: number;
  workspace: number;
  pets_allowed: number;
  outdoor_space: number;
  fireplace: number;
  hot_tub: number;
  pool: number;
  gym: number;
  ev_charger: number;
  comp_median_usd: number;
  price_index: number;
}

export type RentalType = 'Entire home' | 'Private room';
export type BedroomType = 'Studio' | '1 BR' | '2 BR' | '3 BR' | '4+ BR';

export interface PricingInputs {
  neighborhood: string;
  rentalType: RentalType;
  bedrooms: BedroomType;
  finish: number; // 1 - 10
  bathrooms: string | null; // bucket label from BathroomEffect.bucket ("1", "1.5", ..., "4+"); null = not specified
  checkedAmenities: Record<string, boolean>; // key: field_name
}

export interface AmenityCalculationBreakdown {
  field_name: string;
  amenity: string;
  premium: number;
  reliable: boolean;
  checked: boolean;
}

// Premium for a bathroom count within one bedroom group, derived from dc_listings.csv.
// premium = median(price_index) - 1, where price_index = listing price / its comp-set median.
export interface BathroomEffect {
  bedroomGroup: string;
  bucket: string;
  bathroomsValue: number; // numeric sort key (4+ => 4)
  listings: number;
  medianPriceIndex: number;
  premium: number;
}

export interface CalculationResult {
  listingType: string;
  rateRow: RateRow;
  isFallback: boolean;
  percentile: number;
  basePrice: number;
  interpolationBracket: {
    lowPct: number;
    highPct: number;
    lowVal: number;
    highVal: number;
  };
  amenityBreakdowns: AmenityCalculationBreakdown[];
  rawAdjustment: number;
  cappedAdjustment: number;
  bathroomEffect: BathroomEffect | null; // null when not specified / not applicable
  bathroomAdjustment: number; // capped bathroom premium actually applied
  recommendedRate: number;
  estimatedAnnualRevenue: number;
  comparableCount: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  medianNights: number;
}
