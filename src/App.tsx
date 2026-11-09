import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import {
  AmenityEffect,
  Listing,
  Neighborhood,
  PricingInputs,
  RateRow,
} from './types';
import { calculatePrice } from './utils/pricing';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { HeroPriceCard } from './components/HeroPriceCard';
import { PriceHistogram } from './components/PriceHistogram';
import { AmenityEffectsChart } from './components/AmenityEffectsChart';
import { NeighborhoodMap } from './components/NeighborhoodMap';
import { LicensingDonut } from './components/LicensingDonut';
import { Footer } from './components/Footer';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

// BASE_URL is the Vite `base` (e.g. '/repo-name/' on GitHub Pages), so data loads from the right subpath.
const DATA_URL = `${import.meta.env.BASE_URL}data/`;

const INITIAL_SAMPLE_INPUTS: PricingInputs = {
  neighborhood: 'Capitol Hill, Lincoln Park',
  rentalType: 'Entire home',
  bedrooms: '2 BR',
  finish: 7,
  checkedAmenities: {
    in_unit_washer: true,
    workspace: true,
  },
};

export default function App() {
  const [inputs, setInputs] = useState<PricingInputs>(INITIAL_SAMPLE_INPUTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [ratesMap, setRatesMap] = useState<Map<string, RateRow>>(new Map());
  const [amenities, setAmenities] = useState<AmenityEffect[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ratesRes, amenityRes, nbhRes, listingsRes] = await Promise.all([
        fetch(`${DATA_URL}dc_rates.csv`),
        fetch(`${DATA_URL}dc_amenity_effects.csv`),
        fetch(`${DATA_URL}dc_neighborhoods.csv`),
        fetch(`${DATA_URL}dc_listings.csv`),
      ]);

      if (!ratesRes.ok || !amenityRes.ok || !nbhRes.ok || !listingsRes.ok) {
        throw new Error(
          `Failed to load dataset files (${ratesRes.status}, ${amenityRes.status}, ${nbhRes.status}, ${listingsRes.status}). Please check network or file accessibility.`
        );
      }

      const [ratesText, amenityText, nbhText, listingsText] = await Promise.all([
        ratesRes.text(),
        amenityRes.text(),
        nbhRes.text(),
        listingsRes.text(),
      ]);

      // Parse Rates
      const parsedRates = Papa.parse<RateRow>(ratesText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      }).data;

      const rMap = new Map<string, RateRow>();
      parsedRates.forEach((row) => {
        if (row && row.key) {
          rMap.set(row.key, row);
        }
      });
      setRatesMap(rMap);

      // Parse Amenities
      const parsedAmenities = Papa.parse<AmenityEffect>(amenityText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      }).data.filter((a) => a && a.field_name && a.amenity);
      setAmenities(parsedAmenities);

      // Parse Neighborhoods
      const parsedNbh = Papa.parse<Neighborhood>(nbhText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      }).data.filter((n) => n && n.neighborhood);
      setNeighborhoods(parsedNbh);

      // Parse Listings
      const parsedListings = Papa.parse<Listing>(listingsText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      }).data.filter((l) => l && l.listing_id && l.nightly_price_usd);
      setListings(parsedListings);

      setLoading(false);
    } catch (err) {
      console.error('Error loading CSV datasets:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading DC Airbnb market data.'
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setInputs(INITIAL_SAMPLE_INPUTS);
  };

  const handleSelectNeighborhood = (name: string) => {
    setInputs((prev) => ({ ...prev, neighborhood: name }));
  };

  // Perform exact price calculation
  const calculationResult = useMemo(() => {
    if (ratesMap.size === 0 || amenities.length === 0) return null;
    return calculatePrice(inputs, ratesMap, amenities);
  }, [inputs, ratesMap, amenities]);

  // Comparable listings for the histogram and map
  const compListings = useMemo(() => {
    if (!calculationResult || listings.length === 0) return [];
    const targetType = calculationResult.listingType;
    const isFallback = calculationResult.isFallback;

    return listings.filter((l) => {
      const matchType = l.bedroom_group === targetType;
      const matchNeigh = isFallback ? true : l.neighborhood === inputs.neighborhood;
      return matchType && matchNeigh;
    });
  }, [calculationResult, listings, inputs.neighborhood]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#FF5A5F]/20 selection:text-[#1F3A5F]">
      <Header onReset={handleReset} />

      {error ? (
        <main className="max-w-2xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Failed to Load Market Data
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F3A5F] text-white text-xs font-semibold hover:bg-[#1F3A5F]/90 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </main>
      ) : loading ? (
        <LoadingSkeleton />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 1/3 Inputs Panel (Sticky on Desktop) */}
            <div className="lg:col-span-4">
              <InputPanel
                inputs={inputs}
                onChange={setInputs}
                neighborhoods={neighborhoods}
                amenities={amenities}
                onReset={handleReset}
              />
            </div>

            {/* Right 2/3 Results Panel */}
            <div className="lg:col-span-8 space-y-6">
              {calculationResult && (
                <>
                  {/* 1. Hero Pricing Card */}
                  <HeroPriceCard
                    calculation={calculationResult}
                    inputs={inputs}
                  />

                  {/* 2. Price Histogram */}
                  <PriceHistogram
                    listings={listings}
                    neighborhood={inputs.neighborhood}
                    listingType={calculationResult.listingType}
                    isFallback={calculationResult.isFallback}
                    recommendedRate={calculationResult.recommendedRate}
                  />

                  {/* 3. Amenity Regression Effects Chart */}
                  <AmenityEffectsChart
                    amenities={amenities}
                    checkedAmenities={inputs.checkedAmenities}
                  />

                  {/* 4. Interactive DC Market Map */}
                  <NeighborhoodMap
                    neighborhoods={neighborhoods}
                    selectedNeighborhood={inputs.neighborhood}
                    onSelectNeighborhood={handleSelectNeighborhood}
                    compListings={compListings}
                    listingType={calculationResult.listingType}
                    isFallback={calculationResult.isFallback}
                  />

                  {/* 5. Licensing Snapshot */}
                  <LicensingDonut
                    selectedNeighborhood={inputs.neighborhood}
                    neighborhoods={neighborhoods}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
