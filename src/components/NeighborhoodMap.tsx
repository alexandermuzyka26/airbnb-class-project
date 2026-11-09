import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing, Neighborhood } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Layers, MapPin, Navigation, Eye, EyeOff } from 'lucide-react';

interface NeighborhoodMapProps {
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string;
  onSelectNeighborhood: (name: string) => void;
  compListings: Listing[];
  listingType: string;
  isFallback: boolean;
}

// Function to compute color on green-to-red scale based on 1BR median price
// Min is ~$80, Max is ~$190
function getPriceColor(price: number): string {
  if (price < 95) return '#10B981'; // Green (Affordable)
  if (price < 115) return '#84CC16'; // Lime
  if (price < 135) return '#EAB308'; // Yellow
  if (price < 155) return '#F97316'; // Orange
  return '#EF4444'; // Red (Premium)
}

export const NeighborhoodMap: React.FC<NeighborhoodMapProps> = ({
  neighborhoods,
  selectedNeighborhood,
  onSelectNeighborhood,
  compListings,
  listingType,
  isFallback,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const pinsLayerRef = useRef<L.LayerGroup | null>(null);
  const [showPins, setShowPins] = useState<boolean>(true);

  // Filter out "All DC"
  const validNeighborhoods = useMemo(() => {
    return neighborhoods.filter((n) => n.neighborhood !== 'All DC');
  }, [neighborhoods]);

  // Max listings for circle radius scaling
  const maxListings = useMemo(() => {
    return Math.max(...validNeighborhoods.map((n) => n.active_listings), 300);
  }, [validNeighborhoods]);

  // Selected neighborhood object
  const selectedNbhObj = useMemo(() => {
    return validNeighborhoods.find((n) => n.neighborhood === selectedNeighborhood);
  }, [validNeighborhoods, selectedNeighborhood]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Washington, DC
    const map = L.map(mapContainerRef.current, {
      center: [38.9072, -77.0369],
      zoom: 12,
      minZoom: 10,
      maxZoom: 16,
      scrollWheelZoom: false,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const circlesLayer = L.layerGroup().addTo(map);
    const pinsLayer = L.layerGroup().addTo(map);

    circlesLayerRef.current = circlesLayer;
    pinsLayerRef.current = pinsLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Neighborhood Circles
  useEffect(() => {
    const circlesLayer = circlesLayerRef.current;
    if (!circlesLayer) return;

    circlesLayer.clearLayers();

    validNeighborhoods.forEach((n) => {
      const isSelected = n.neighborhood === selectedNeighborhood;
      const color = getPriceColor(n.median_price_1br_entire_usd);

      // Scale radius between 8 and 24 px based on sqrt of active listings
      const radius = 8 + Math.sqrt(n.active_listings / maxListings) * 16;

      const circle = L.circleMarker([n.center_latitude, n.center_longitude], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: color,
        color: isSelected ? '#1F3A5F' : '#FFFFFF',
        weight: isSelected ? 3.5 : 1.5,
        opacity: 1,
        fillOpacity: isSelected ? 0.9 : 0.65,
      });

      // Interactive popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 170px;">
          <div style="font-weight: 700; color: #1F3A5F; font-size: 13px; margin-bottom: 4px;">
            ${n.neighborhood}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748b;">Active Listings:</span>
            <span style="font-weight: 600;">${n.active_listings}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748b;">Median 1BR (Entire):</span>
            <span style="font-weight: 700; color: #0f172a;">${formatCurrency(n.median_price_1br_entire_usd)}</span>
          </div>
          ${
            isSelected
              ? '<span style="display: inline-block; padding: 2px 6px; background: #1F3A5F; color: white; border-radius: 4px; font-size: 10px; font-weight: 600;">Current Selection</span>'
              : '<button id="select-nbh-btn" style="cursor: pointer; width: 100%; text-align: center; background: #FF5A5F; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Select Neighborhood</button>'
          }
        </div>
      `;

      circle.bindPopup(popupHtml);

      circle.on('popupopen', () => {
        const btn = document.getElementById('select-nbh-btn');
        if (btn) {
          btn.onclick = () => {
            onSelectNeighborhood(n.neighborhood);
            circle.closePopup();
          };
        }
      });

      circle.on('click', () => {
        onSelectNeighborhood(n.neighborhood);
      });

      circle.addTo(circlesLayer);
    });
  }, [validNeighborhoods, selectedNeighborhood, maxListings, onSelectNeighborhood]);

  // 3. Render Comp Listing Pins
  useEffect(() => {
    const pinsLayer = pinsLayerRef.current;
    if (!pinsLayer) return;

    pinsLayer.clearLayers();

    if (!showPins) return;

    // Small SVG icon for pins
    compListings.forEach((listing) => {
      const pinIcon = L.divIcon({
        className: 'custom-comp-pin',
        html: `
          <div style="
            background-color: #FF5A5F;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: bold;
          ">
            $
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([listing.latitude, listing.longitude], {
        icon: pinIcon,
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 180px;">
          <div style="font-weight: 700; color: #FF5A5F; font-size: 14px; margin-bottom: 4px;">
            ${formatCurrency(listing.nightly_price_usd)} <span style="font-size: 11px; color: #64748b; font-weight: normal;">/ night</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #64748b;">Type:</span>
            <span style="font-weight: 600;">${listing.bedroom_group} (${listing.bedrooms} bed)</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #64748b;">Review Score:</span>
            <span style="font-weight: 600; color: #047857;">★ ${listing.review_score ? Number(listing.review_score).toFixed(2) : 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748b;">License:</span>
            <span style="font-size: 10px; color: #475569;">${listing.license_type || 'Exempt'}</span>
          </div>
          <a
            href="https://www.airbnb.com/rooms/${listing.listing_id}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-block;
              width: 100%;
              text-align: center;
              background: #1F3A5F;
              color: white;
              padding: 5px 8px;
              border-radius: 4px;
              text-decoration: none;
              font-size: 11px;
              font-weight: 600;
              box-sizing: border-box;
            "
          >
            View on Airbnb ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(pinsLayer);
    });
  }, [compListings, showPins]);

  // 4. Smooth FlyTo Selected Neighborhood
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedNbhObj) return;

    mapInstanceRef.current.flyTo(
      [selectedNbhObj.center_latitude, selectedNbhObj.center_longitude],
      13.5,
      {
        duration: 1.2,
      }
    );
  }, [selectedNeighborhood, selectedNbhObj]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([38.9072, -77.0369], 12);
    }
  };

  const takeaway = useMemo(() => {
    if (!selectedNbhObj) return 'Select a neighborhood on the map to explore.';
    const price = selectedNbhObj.median_price_1br_entire_usd;
    return `${selectedNbhObj.neighborhood} currently hosts ${selectedNbhObj.active_listings} active listings with a median 1-bedroom rate of ${formatCurrency(price)}. ${showPins ? `Displaying ${compListings.length} direct comp pins on the map.` : 'Comp pin layer is currently hidden.'}`;
  }, [selectedNbhObj, showPins, compListings.length]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1F3A5F]">
              Washington, DC Market Map
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
              OpenStreetMap
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Neighborhoods sized by active listings, colored by 1BR median price
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Comp Pins Layer */}
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              showPins
                ? 'bg-[#FF5A5F]/10 border-[#FF5A5F]/40 text-[#FF5A5F]'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Toggle comp listing pins"
          >
            {showPins ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showPins ? 'Hide Comp Pins' : 'Show Comp Pins'} ({compListings.length})</span>
          </button>

          {/* Recenter button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Recenter map on DC"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} className="h-96 w-full z-10" />

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200/90 shadow-md text-[11px] text-slate-700 max-w-xs pointer-events-auto">
          <div className="font-bold text-[#1F3A5F] mb-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            1BR Median Price Scale
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block" />
            <span className="text-slate-600">&lt; $95</span>
            <span className="w-3 h-3 rounded-full bg-[#84CC16] inline-block ml-1" />
            <span className="text-slate-600">$95–$115</span>
            <span className="w-3 h-3 rounded-full bg-[#EAB308] inline-block ml-1" />
            <span className="text-slate-600">$115–$135</span>
            <span className="w-3 h-3 rounded-full bg-[#F97316] inline-block ml-1" />
            <span className="text-slate-600">$135–$155</span>
            <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block ml-1" />
            <span className="text-slate-600">$155+</span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-2">
            <span>● Circle size: Active listings</span>
            <span className="flex items-center gap-1 text-[#FF5A5F] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#FF5A5F]" />
              Comp pin
            </span>
          </div>
        </div>
      </div>

      {/* One-line plain-English takeaway */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <span className="font-bold text-[#1F3A5F] shrink-0">Takeaway:</span>
        <span className="leading-relaxed">{takeaway}</span>
      </div>
    </div>
  );
};
