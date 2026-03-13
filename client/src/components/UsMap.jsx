import React, { useState, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

const US_MAP_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const IGAMING_STATES = [
  { name: "New Jersey",   coordinates: [-74.4057,  40.0583], key: "nj", abbr: "NJ" },
  { name: "Pennsylvania", coordinates: [-77.1945,  41.2033], key: "pa", abbr: "PA" },
  { name: "Michigan",     coordinates: [-84.506,   44.3467], key: "mi", abbr: "MI" },
  { name: "New York",     coordinates: [-74.9981,  42.1657], key: "ny", abbr: "NY" },
  { name: "Colorado",     coordinates: [-105.7821, 39.5501], key: "co", abbr: "CO" },
  { name: "Illinois",     coordinates: [-89.3985,  40.6331], key: "il", abbr: "IL" },
  { name: "Arizona",      coordinates: [-111.431,  33.7298], key: "az", abbr: "AZ" },
  { name: "Virginia",     coordinates: [-78.6569,  37.4316], key: "va", abbr: "VA" },
  { name: "Iowa",         coordinates: [-93.0977,  41.878],  key: "ia", abbr: "IA" },
  { name: "Indiana",      coordinates: [-86.1349,  40.2672], key: "in", abbr: "IN" },
  { name: "Tennessee",    coordinates: [-86.58,    35.5175], key: "tn", abbr: "TN" },
  { name: "Connecticut",  coordinates: [-72.7622,  41.6032], key: "ct", abbr: "CT" },
  { name: "Louisiana",    coordinates: [-91.9623,  31.1695], key: "la", abbr: "LA" },
  { name: "Kansas",       coordinates: [-98.4842,  39.0119], key: "ks", abbr: "KS" },
  { name: "Maryland",     coordinates: [-76.6413,  39.0458], key: "md", abbr: "MD" },
];

function buildStateIntensity(posts) {
  const geoPosts = posts.filter(
    (p) => p.classification === "Geolocation error" && p.state
  );
  if (geoPosts.length === 0) return {};

  const abbrToKey = Object.fromEntries(IGAMING_STATES.map((s) => [s.abbr, s.key]));
  const result = {};
  for (const post of geoPosts) {
    const key = abbrToKey[post.state?.toUpperCase()];
    if (key) result[key] = (result[key] || 0) + 1;
  }
  return result;
}

const UsMap = memo(function UsMap({ posts }) {
  const [tooltip, setTooltip] = useState(null);
  const intensity    = buildStateIntensity(posts);
  const maxIntensity = Math.max(...Object.values(intensity), 1);

  const getMarkerRadius = (key) => {
    const count = intensity[key] || 0;
    if (count === 0) return 4;
    return 4 + (count / maxIntensity) * 10;
  };

  const getMarkerColor = (key) => {
    const count = intensity[key] || 0;
    if (count === 0) return "#94a3b8";
    if (count >= maxIntensity * 0.7) return "#FF600F";
    if (count >= maxIntensity * 0.3) return "#f59e0b";
    return "#0041ED";
  };

  const totalGeo = posts.filter((p) => p.classification === "Geolocation error").length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            U.S. iGaming Activity Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalGeo > 0
              ? `${totalGeo} geolocation issues — markers show posts with detected state`
              : "Run AI analysis to see geolocation complaint hotspots"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gc-orange inline-block" />
            High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gc-blue inline-block" />
            Low
          </span>
        </div>
      </div>

      {/* CSS vars --map-state-fill / --map-state-stroke / --map-bg defined in index.css */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--map-bg)" }}>
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={US_MAP_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--map-state-fill)"
                  stroke="var(--map-state-stroke)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover:   { fill: "var(--map-state-stroke)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {IGAMING_STATES.map((state) => {
            const count = intensity[state.key] || 0;
            return (
              <Marker
                key={state.key}
                coordinates={state.coordinates}
                onMouseEnter={() => setTooltip({ name: state.name, count })}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={getMarkerRadius(state.key)}
                  fill={getMarkerColor(state.key)}
                  fillOpacity={count > 0 ? 0.85 : 0.4}
                  stroke={getMarkerColor(state.key)}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  className="cursor-pointer"
                />
                {count > 0 && (
                  <circle
                    r={getMarkerRadius(state.key) + 4}
                    fill="none"
                    stroke={getMarkerColor(state.key)}
                    strokeWidth={0.5}
                    strokeOpacity={0.3}
                  />
                )}
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {tooltip && (
        <div className="absolute top-5 right-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs pointer-events-none shadow-md">
          <div className="font-medium text-slate-800 dark:text-slate-200">{tooltip.name}</div>
          <div className="text-slate-500 dark:text-slate-400 mt-0.5">
            {tooltip.count > 0
              ? `${tooltip.count} geo issue${tooltip.count !== 1 ? "s" : ""}`
              : "No geo issues detected"}
          </div>
        </div>
      )}
    </div>
  );
});

export default UsMap;
