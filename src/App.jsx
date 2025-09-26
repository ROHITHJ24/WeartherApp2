import React, { useState, useEffect, useRef, useMemo } from "react";
import WeatherCard from "./components/WeatherCard";

/**
 * App.jsx
 * Root application wrapper.
 *
 * NOTE: This app expects an OpenWeatherMap API key in environment variable:
 * - For Vite: VITE_WEATHER_API_KEY in a .env file at project root:
 *     VITE_WEATHER_API_KEY=your_api_key_here
 *
 * If you used Create React App instead, use:
 *   REACT_APP_WEATHER_API_KEY=your_api_key_here
 * and access it with process.env.REACT_APP_WEATHER_API_KEY.
 *
 * (No key is hard-coded in source.)
 */

export default function App() {
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [units, setUnits] = useState("metric"); // "metric" = Celsius, "imperial" = Fahrenheit
  const inputRef = useRef(null);

  // when user submits (Enter or Search), we store in `query` which triggers fetch in WeatherCard
  const handleSearch = (e) => {
    e?.preventDefault?.();
    if (city.trim() === "") return;
    setQuery(city.trim());
    // blur input for better iOS-like feel
    inputRef.current?.blur();
  };

  // Quick keyboard handler to allow Enter
  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  // A tiny accessible toggle for Celsius/Fahrenheit
  const toggleUnits = () => setUnits((u) => (u === "metric" ? "imperial" : "metric"));

  // memo placeholder for pass-through props
  const options = useMemo(() => ({ units }), [units]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-lg">
        <form
          onSubmit={handleSearch}
          className="mb-6 flex gap-3 items-center justify-between"
          aria-label="Search city"
        >
          <label htmlFor="city-input" className="sr-only">
            City name
          </label>
          <input
            id="city-input"
            ref={inputRef}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter city (e.g., London)"
            className="flex-1 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm text-slate-900"
            aria-required="true"
            aria-label="City"
          />

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Search"
          >
            Search
          </button>

          <div className="ml-2 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleUnits}
              aria-pressed={units === "metric" ? "false" : "true"}
              className="relative inline-flex items-center px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm shadow-inner focus:outline-none"
              title="Toggle Celsius / Fahrenheit"
            >
              <span className="text-xs font-medium">°C</span>
              <span
                className={`ml-2 w-10 h-5 rounded-full p-0.5 transition-all duration-200 ${
                  units === "metric" ? "bg-slate-200" : "bg-indigo-500"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ${
                    units === "metric" ? "translate-x-0" : "translate-x-5"
                  }`}
                />
              </span>
              <span className="ml-2 text-xs font-medium">°F</span>
            </button>
          </div>
        </form>

        {/* WeatherCard handles loading, fetch, error, and display */}
        <WeatherCard cityQuery={query} options={options} />
      </main>
    </div>
  );
}
