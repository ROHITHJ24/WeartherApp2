import React, { useEffect, useState, useMemo, useRef } from "react";

/* -------------------- Utility Functions -------------------- */
function dateFromTimezone(utcSeconds, tzOffsetSeconds) {
  return new Date((utcSeconds + tzOffsetSeconds) * 1000);
}
function msToKmh(ms) {
  return ms * 3.6;
}
function weatherIconForId(id, main) {
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "fog";
  if (id === 800) return "clear";
  if (id > 800) return "clouds";
  if (/rain/i.test(main)) return "rain";
  if (/cloud/i.test(main)) return "clouds";
  return "clear";
}
const Icons = {
  clear: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
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
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M17 18H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 18z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  rain: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M17 14H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 14z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <g stroke="currentColor" strokeWidth="1.8">
        <path d="M8.5 18.5v1" />
        <path d="M11 18.5v1" />
        <path d="M13.5 18.5v1" />
      </g>
    </svg>
  ),
  snow: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M17 14H7a4 4 0 010-8 5 5 0 019.9 1.4A3.5 3.5 0 0117 14z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <g stroke="currentColor" strokeWidth="1.6">
        <path d="M9 18l6-6" />
        <path d="M9 12l6 6" />
      </g>
    </svg>
  ),
  fog: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 17h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 13h20" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  thunder: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
};

function getMood(main, description, tempC) {
  const cond = main?.toLowerCase?.() ?? "";
  let tempBucket = "mild";
  if (tempC < 6) tempBucket = "cold";
  else if (tempC < 16) tempBucket = "cool";
  else if (tempC < 24) tempBucket = "mild";
  else if (tempC < 32) tempBucket = "warm";
  else tempBucket = "hot";

  let base = "Neutral";
  if (cond.includes("clear")) base = tempBucket === "cold" ? "Crisp & Clear" : "Sunny & Cheerful";
  else if (cond.includes("cloud")) base = tempBucket === "cold" ? "Grey & Calm" : "Cloudy & Calm";
  else if (cond.includes("rain") || cond.includes("drizzle")) base = tempBucket === "cold" ? "Cozy & Rainy" : "Wet & Refreshing";
  else if (cond.includes("snow")) base = tempBucket === "cold" ? "Bundled & Snowy" : "Snowy";
  else if (cond.includes("thunder")) base = "Stormy & Intense";
  else if (cond.includes("mist") || cond.includes("fog")) base = "Misty & Quiet";
  else base = "Pleasant";

  if (/light/i.test(description) && base.includes("Rain")) base = "Soft & Cozy";
  if (/heavy|shower/i.test(description) && base.includes("Rain")) base = "Blustery & Moody";

  return base;
}

/* -------------------- MAIN COMPONENT -------------------- */
export default function WeatherCard({ cityQuery, options }) {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";
  const { units = "metric" } = options || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [localTime, setLocalTime] = useState(null);
  const localTickRef = useRef(null);

  useEffect(() => {
    if (!cityQuery) return;

    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&units=${units}&appid=${API_KEY}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error("City not found.");
        const json = await resp.json();
        setData(json);
        setLastUpdatedAt(json.dt);
        setLocalTime(dateFromTimezone(json.dt, json.timezone));

        clearInterval(localTickRef.current);
        localTickRef.current = setInterval(() => {
          const utcNow = Math.floor(Date.now() / 1000);
          setLocalTime(dateFromTimezone(utcNow, json.timezone));
        }, 1000);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();

    return () => {
      controller.abort();
      clearInterval(localTickRef.current);
    };
  }, [cityQuery, units, API_KEY]);

  const derived = useMemo(() => {
    if (!data) return null;
    const main = data.weather?.[0]?.main ?? "";
    const description = data.weather?.[0]?.description ?? "";
    const id = data.weather?.[0]?.id ?? 800;
    const temp = data.main?.temp ?? null;
    const feels_like = data.main?.feels_like ?? null;
    const humidity = data.main?.humidity ?? null;
    const windMs = data.wind?.speed ?? null;
    const windDisplay =
      units === "metric"
        ? `${(windMs ? msToKmh(windMs) : 0).toFixed(1)} km/h`
        : `${(windMs ?? 0).toFixed(1)} m/s`;
    const tempC = units === "metric" ? temp : (temp - 32) * (5 / 9);
    const mood = getMood(main, description, tempC);
    const iconType = weatherIconForId(id, main);
    return { main, description, temp, feels_like, humidity, windDisplay, mood, iconType };
  }, [data, units]);

  if (!cityQuery)
    return (
      <section className="bg-white/60 backdrop-blur-md shadow-xl rounded-2xl p-6 ring-1 ring-slate-200 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Search for a city</h2>
        <p className="text-slate-700 mt-2 text-sm sm:text-base">Try typing: Tokyo, London, Mumbai.</p>
      </section>
    );

  if (loading)
    return (
      <div className="bg-white/60 backdrop-blur-md shadow-xl rounded-2xl p-6 ring-1 ring-slate-200 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 text-lg sm:text-xl font-medium">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="bg-white/60 backdrop-blur-md shadow-xl rounded-2xl p-6 ring-1 ring-slate-200 text-center sm:text-left">
        <p className="text-red-600 font-semibold mb-2">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );

  if (data && derived) {
    const { temp, feels_like, humidity, description, main, iconType, windDisplay, mood } = derived;
    const IconComp = Icons[iconType] || Icons.clear;
    const local = localTime;

    return (
      <article className="bg-white/60 backdrop-blur-md shadow-xl rounded-2xl p-4 sm:p-6 ring-1 ring-slate-200 flex flex-col sm:flex-row sm:items-center gap-6 transition-transform hover:-translate-y-1">
        {/* Icon */}
        <div className="flex justify-center sm:justify-start w-full sm:w-1/3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50 rounded-xl flex items-center justify-center">
            <IconComp className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {data.name} <span className="text-slate-500 text-sm">({data.sys?.country})</span>
          </h3>
          <p className="text-slate-600 capitalize">{main} • {description}</p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-4">
            <div className="text-5xl sm:text-6xl text-blue-700 font-extrabold">
              {Math.round(temp)}
              <span className="text-2xl ml-1">{units === "metric" ? "°C" : "°F"}</span>
            </div>
            <div className="text-sm text-slate-600">
              <p>Feels like: {Math.round(feels_like)}°</p>
              <p>Humidity: {humidity}%</p>
              <p>Wind: {windDisplay}</p>
            </div>
          </div>

          <div className="mt-2">
            <span className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">{mood}</span>
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Local time: {local?.toLocaleTimeString()} • Updated{" "}
            {lastUpdatedAt ? new Date(lastUpdatedAt * 1000).toLocaleTimeString() : "-"}
          </div>
        </div>
      </article>
    );
  }

  return null;
}
