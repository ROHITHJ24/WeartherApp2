import React, { useEffect, useState, useMemo, useRef } from "react";

/**
 * WeatherCard.jsx
 * - Fetches current weather for cityQuery using OpenWeatherMap current weather API.
 * - Shows loading, error, and result states.
 * - Displays city + country, temperature, feels like, description, humidity, wind, local time.
 * - Provides mood derived from temperature and conditions.
 *
 * API usage note:
 * - For Vite: set VITE_WEATHER_API_KEY in your .env file at project root.
 *   Example: VITE_WEATHER_API_KEY=your_api_key_here
 *
 * - The fetch URL example:
 *   https://api.openweathermap.org/data/2.5/weather?q=London&units=metric&appid=YOUR_KEY
 *
 * - For a production app, don't call the API directly from the client. Instead use a server-side proxy to keep keys secret.
 */

/* ---------- Utility helpers ---------- */

/** Convert UTC timestamp + timezone offset (seconds) -> local Date object */
function dateFromTimezone(utcSeconds, tzOffsetSeconds) {
  // Date expects milliseconds
  return new Date((utcSeconds + tzOffsetSeconds) * 1000);
}

/** Convert wind m/s to km/h when needed */
function msToKmh(ms) {
  return ms * 3.6;
}

/** Small mapping of weather code to icon type */
function weatherIconForId(id, main) {
  // Based on OpenWeatherMap weather condition codes
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "fog";
  if (id === 800) return "clear";
  if (id > 800) return "clouds";
  // fallback to main
  if (/rain/i.test(main)) return "rain";
  if (/cloud/i.test(main)) return "clouds";
  return "clear";
}

/** Tiny inline SVG icon set */
const Icons = {
  clear: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.4">
        <path d="M12 2v2.8" />
        <path d="M12 19.2V22" />
        <path d="M4.2 4.2L5.8 5.8" />
        <path d="M18.2 18.2L19.8 19.8" />
        <path d="M2 12h2.8" />
        <path d="M19.2 12H22" />
        <path d="M4.2 19.8L5.8 18.2" />
        <path d="M18.2 5.8L19.8 4.2" />
      </g>
    </svg>
  ),
  clouds: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M17 18H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 18z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  rain: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M17 14H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 14z" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.8">
        <path d="M8.5 18.5v1" />
        <path d="M11 18.5v1" />
        <path d="M13.5 18.5v1" />
      </g>
    </svg>
  ),
  snow: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M17 14H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 14z" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6">
        <path d="M9 18l6-6" />
        <path d="M9 12l6 6" />
      </g>
    </svg>
  ),
  fog: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M3 17h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 13h20" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  thunder: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
};

/* ---------- Mood mapping logic ---------- */
/**
 * Algorithm:
 * - Base categories by weather main (Clear, Clouds, Rain/Drizzle, Snow, Thunderstorm, Fog/Mist)
 * - Temperature buckets (cold < 6°C, cool 6-16°C, mild 16-24°C, warm 24-32°C, hot >=32°C) when units=metric.
 * - Combine bucket + condition to produce a friendly mood phrase (e.g., "Cozy & Rainy", "Sunny & Cheerful").
 *
 * This mapping below is used in getMood().
 */
function getMood(main, description, tempC) {
  const cond = main?.toLowerCase?.() ?? "";
  // tempC is Celsius value (we ensure conversion before calling)
  let tempBucket = "mild";
  if (tempC < 6) tempBucket = "cold";
  else if (tempC < 16) tempBucket = "cool";
  else if (tempC < 24) tempBucket = "mild";
  else if (tempC < 32) tempBucket = "warm";
  else tempBucket = "hot";

  // Determine base mood
  let base = "Neutral";
  if (cond.includes("clear")) base = tempBucket === "cold" ? "Crisp & Clear" : "Sunny & Cheerful";
  else if (cond.includes("cloud")) base = tempBucket === "cold" ? "Grey & Calm" : "Cloudy & Calm";
  else if (cond.includes("rain") || cond.includes("drizzle")) base = tempBucket === "cold" ? "Cozy & Rainy" : "Wet & Refreshing";
  else if (cond.includes("snow")) base = tempBucket === "cold" ? "Bundled & Snowy" : "Snowy";
  else if (cond.includes("thunder")) base = "Stormy & Intense";
  else if (cond.includes("mist") || cond.includes("fog")) base = "Misty & Quiet";
  else base = "Pleasant";

  // add small nuance from description keywords
  if (/light/i.test(description) && base.includes("Rain")) base = "Soft & Cozy";
  if (/heavy|shower/i.test(description) && base.includes("Rain")) base = "Blustery & Moody";

  return base;
}

/* ---------- Main component ---------- */
export default function WeatherCard({ cityQuery, options }) {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ""; // for Vite
  // If you use CRA instead of Vite, use process.env.REACT_APP_WEATHER_API_KEY
  const { units = "metric" } = options || {};

  const [data, setData] = useState(null); // API response object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null); // unix seconds from API.dt
  const [localTime, setLocalTime] = useState(null); // JS Date adjusted to city's timezone
  const localTickRef = useRef(null);

  // Fetch when cityQuery changes
  useEffect(() => {
    if (!cityQuery) {
      setData(null);
      setError(null);
      setLoading(false);
      clearInterval(localTickRef.current);
      setLocalTime(null);
      return;
    }
    if (!API_KEY) {
      setError("Missing API key. Please add VITE_WEATHER_API_KEY to .env (see README).");
      setData(null);
      return;
    }

    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        // Build URL for OpenWeatherMap current weather
        const url = new URL("https://api.openweathermap.org/data/2.5/weather");
        url.searchParams.set("q", cityQuery);
        url.searchParams.set("units", units); // metric or imperial
        url.searchParams.set("appid", API_KEY);

        const resp = await fetch(url.toString(), { signal: controller.signal });
        if (!resp.ok) {
          if (resp.status === 404) throw new Error("City not found. Try a different name.");
          throw new Error(`Weather API error: ${resp.statusText} (${resp.status})`);
        }
        const json = await resp.json();
        setData(json);
        setLastUpdatedAt(json.dt);
        // set local time based on timezone offset (seconds)
        const local = dateFromTimezone(json.dt, json.timezone);
        setLocalTime(local);

        // start a ticking clock that updates local time every second
        clearInterval(localTickRef.current);
        localTickRef.current = setInterval(() => {
          // compute new local time by shifting UTC now with timezone offset
          const utcNow = Math.floor(Date.now() / 1000);
          const n = dateFromTimezone(utcNow, json.timezone);
          setLocalTime(n);
        }, 1000);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // cleanup
    return () => {
      controller.abort();
      clearInterval(localTickRef.current);
    };
  }, [cityQuery, units, API_KEY]);

  // compute derived values & memoize to avoid unnecessary recalculations
  const derived = useMemo(() => {
    if (!data) return null;
    const main = data.weather?.[0]?.main ?? "";
    const description = data.weather?.[0]?.description ?? "";
    const id = data.weather?.[0]?.id ?? 800;
    const temp = data.main?.temp ?? null; // in units (C or F)
    const feels_like = data.main?.feels_like ?? null;
    const humidity = data.main?.humidity ?? null;
    const windMs = data.wind?.speed ?? null; // OpenWeatherMap returns m/s even for imperial? It may be inconsistent; we'll cover both.
    const windDisplay = units === "metric" ? `${(windMs != null ? msToKmh(windMs) : "-").toFixed(1)} km/h` : `${(windMs ?? "-").toFixed?.(1) ?? windMs} m/s`;
    // For mood calculation we want Celsius. Convert if needed.
    const tempC = units === "metric" ? temp : (temp - 32) * (5 / 9);
    const mood = getMood(main, description, tempC);
    const iconType = weatherIconForId(id, main);

    return {
      main,
      description,
      id,
      temp,
      feels_like,
      humidity,
      windMs,
      windDisplay,
      mood,
      iconType
    };
  }, [data, units]);

  // small retry helper
  const retry = () => {
    // trigger a refetch by toggling cityQuery (re-set same query)
    // simplest: setData(null) and clear errors; useEffect will re-run if cityQuery prop didn't change.
    setError(null);
    setData(null);
  };

  /* ---------- Render states ---------- */

  // empty state prompt
  if (!cityQuery) {
    return (
      <section
        className="rounded-2xl bg-white/60 backdrop-blur-md shadow-2xl p-6 ring-1 ring-slate-200"
        role="region"
        aria-label="Weather card empty"
      >
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-slate-900 text-2xl font-semibold">Search for a city</h2>
          <p className="text-slate-700">Type a city name above and press Search (or Enter). Example: Tokyo, London, Mumbai.</p>
          <p className="text-slate-600 text-sm">This app uses OpenWeatherMap's Current Weather API.</p>
        </div>
      </section>
    );
  }

  // loading
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/60 backdrop-blur-md shadow-2xl p-6 ring-1 ring-slate-200 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100/60 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2v4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 18v4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4.2 4.2L7 7" stroke="currentColor" strokeWidth="1.6" />
              <path d="M17 17l2.8 2.8" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <div className="text-slate-800 font-semibold">Loading weather…</div>
            <div className="text-slate-600 text-sm">Fetching data from the weather service</div>
          </div>
        </div>
      </div>
    );
  }

  // error state
  if (error) {
    return (
      <div className="rounded-2xl bg-white/60 backdrop-blur-md shadow-2xl p-6 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3">
          <h3 className="text-red-600 font-semibold">Error</h3>
          <p className="text-slate-700">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={retry}
              className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Retry
            </button>
            <a
              href="https://openweathermap.org"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-800"
            >
              Check API
            </a>
          </div>
        </div>
      </div>
    );
  }

  // success state
  if (data && derived) {
    const { temp, feels_like, humidity, description } = derived;
    const name = data.name;
    const country = data.sys?.country ?? "";
    const iconType = derived.iconType;
    const weatherMain = derived.main;
    const mood = derived.mood;
    const local = localTime;

    // choose icon component
    const IconComp = Icons[iconType] || Icons.clear;

    return (
      <article
        className="rounded-2xl bg-white/60 backdrop-blur-md p-6 shadow-2xl ring-1 ring-slate-200 transition-transform transform hover:-translate-y-1"
        role="region"
        aria-label={`Weather for ${name}`}
      >
        <div className="flex items-start gap-4">
          {/* Icon container with micro-animation */}
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-white/60 shadow-inner animate-fade-in"
            aria-hidden
          >
            <div className="w-16 h-16 text-indigo-600" style={{ display: "inline-block" }}>
              <div className="icon-bounce">
                <IconComp className="w-16 h-16" />
              </div>
            </div>
          </div>

          {/* Main info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 text-xl font-semibold">
                  {name} <span className="text-slate-500 text-sm">({country})</span>
                </h3>
                <div className="text-slate-600 text-sm">{weatherMain} • {description}</div>
              </div>

              {/* local time */}
              <div className="text-right">
                <div className="text-slate-700 text-sm">{local ? local.toLocaleDateString() : "—"}</div>
                <div className="text-slate-900 text-lg font-medium">{local ? local.toLocaleTimeString() : "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6">
              {/* Temperature big */}
              <div className="flex items-baseline gap-3">
                <div
                  className="text-5xl font-extrabold leading-none transform transition-all duration-700 temperature-flip"
                  aria-live="polite"
                >
                  {temp != null ? Math.round(temp) : "-"}
                  <span className="text-2xl font-medium ml-1">{units === "metric" ? "°C" : "°F"}</span>
                </div>

                <div className="text-sm text-slate-600">
                  <div>Feels like {feels_like != null ? Math.round(feels_like) : "-"}{units === "metric" ? "°C" : "°F"}</div>
                  <div>Humidity: {humidity != null ? `${humidity}%` : "-"}</div>
                  <div>Wind: {derived.windDisplay}</div>
                </div>
              </div>

              {/* Mood box */}
              <div className="ml-auto text-right">
                <div className="text-slate-500 text-xs">Mood</div>
                <div className="mt-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm shadow-sm">
                  {mood}
                </div>
                <div className="text-slate-400 text-xs mt-2">Updated {lastUpdatedAt ? new Date(lastUpdatedAt * 1000).toLocaleTimeString() : "-"}</div>
              </div>
            </div>

            {/* small footer */}
            <div className="mt-4 text-xs text-slate-600">
              Source: OpenWeatherMap — Current Weather. Data shown in {units === "metric" ? "Celsius" : "Fahrenheit"}.
            </div>
          </div>
        </div>
      </article>
    );
  }

  // fallback
  return null;
}
