// WeatherFooter.jsx
import React from "react";

const WeatherFooter = ({ tip }) => {
  return (
    <footer className="bg-blue-100 text-blue-800 text-center py-3 mt-6 rounded-lg shadow-inner">
      <p className="text-sm font-semibold">{tip}</p>
    </footer>
  );
};

export default WeatherFooter;
