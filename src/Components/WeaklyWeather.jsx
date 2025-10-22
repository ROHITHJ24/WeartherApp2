import React, { useEffect, useState } from "react";
import axios from "axios";

const WeeklyWeather = ({ lat, lon }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY; // Your API key

  useEffect(() => {
    const fetchWeeklyWeather = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/onecall`,
          {
            params: {
              lat: lat,
              lon: lon,
              exclude: "current,minutely,hourly,alerts",
              units: "metric",
              appid: apiKey,
            },
          }
        );
        setWeeklyData(response.data.daily);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch weekly weather.");
        setLoading(false);
      }
    };

    fetchWeeklyWeather();
  }, [lat, lon, apiKey]);

  if (loading) return <p className="p-4">Loading weekly forecast...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-full">
      <h2 className="text-lg font-bold mb-4">Weekly Forecast</h2>
      {weeklyData.map((day, index) => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        return (
          <div
            key={index}
            className="flex justify-between items-center mb-2 border-b pb-2 last:border-b-0 last:pb-0"
          >
            <span className="font-medium">{dayName}</span>
            <img
              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
              alt={day.weather[0].description}
              className="w-6 h-6"
            />
            <span>{Math.round(day.temp.day)}°C</span>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyWeather;
