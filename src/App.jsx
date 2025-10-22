import React, { useState, useEffect, useRef, useMemo } from "react";
import WeatherFooter from "./Components/WeatherFooter";
import WeatherCard from "./Components/WeatherCard";

const tips = [
  "Tip: Drink water in hot weather!",
  "Misty mornings expected this week.",
  "Carry an umbrella if rain is forecasted!",
  "Stay hydrated and wear sunscreen today.",
];

export default function App() {
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [units, setUnits] = useState("metric");
  const inputRef = useRef(null);
  const [tip, setTip] = useState(tips[0]);

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    if (city.trim() === "") return;
    setQuery(city.trim());
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  const toggleUnits = () =>
    setUnits((u) => (u === "metric" ? "imperial" : "metric"));

  const options = useMemo(() => ({ units }), [units]);

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center px-4 sm:px-6 md:px-10 py-6"
      style={{
        backgroundImage: `url('https://img.freepik.com/free-vector/watercolor-blue-cotton-clouds-background_23-2149251502.jpg?semt=ais_incoming&w=740&q=80')`,
      }}
    >
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 text-center text-blue-700 drop-shadow-md">
        Weather App
      </h1>

      {/* Main Container */}
      <main className="w-full max-w-md sm:max-w-lg lg:max-w-2xl bg-white/30 backdrop-blur-md rounded-2xl p-5 sm:p-8 shadow-lg transition-all duration-300">
        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-4 sm:gap-3 items-stretch sm:items-center justify-between mb-6"
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
            className="flex-1 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm text-slate-900 text-sm sm:text-base"
            aria-required="true"
            aria-label="City"
          />

          <div className="flex items-center justify-between sm:justify-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 w-full sm:w-auto"
              aria-label="Search"
            >
              Search
            </button>

            {/* Temperature Unit Toggle */}
            <button
              type="button"
              onClick={toggleUnits}
              aria-pressed={units === "imperial"}
              className="relative inline-flex items-center px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm shadow-inner focus:outline-none transition-all duration-200"
              title="Toggle Celsius / Fahrenheit"
            >
              <span className="text-xs font-medium">°C</span>
              <span
                className={`mx-2 w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${
                  units === "metric" ? "bg-slate-200" : "bg-indigo-500"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${
                    units === "metric" ? "translate-x-0" : "translate-x-5"
                  }`}
                />
              </span>
              <span className="text-xs font-medium">°F</span>
            </button>
          </div>
        </form>

        {/* Weather Card */}
        <div className="mt-4">
          <WeatherCard cityQuery={query} options={options} />
        </div>

        {/* Footer Tip */}
        <div className="mt-8">
          <WeatherFooter tip={tip} />
        </div>
      </main>
    </div>
  );
}
