import { useState } from 'react'
import './App.css'

import searchIcon from "./assets/search-icon.png"
import humidityIcon from "./assets/humidity.png"
import windIcon from "./assets/wind.png"
import cloudyIcon from "./assets/cloudy.png"

const WeatherDetails = ({ cloudyIcon, city, temprature, country, lati, longi, humidity, wind }) => {


  return (
    <>
      <div className="image">
        <img src={cloudyIcon} alt="icon" />
      </div>
      <div className="temprature">{temprature} °C </div>
      <div className="city">{city}</div>
      <div className="country">{country}</div>

      <div className="cord">
        <div>

          <span className="latitude">Latitude</span>
          <span>{lati}</span>
        </div>
        <div>
          <span className="longitude">Longitude</span>
          <span>{longi}</span>
        </div>
      </div>

      <div className="data-container">
        <div className="data-items">
          <div className="humitity-and-wind">
            <img src={humidityIcon} alt="Humidity" className='icon'/>
            <div className='humidity-percent'>{humidity}%</div>
            <div className="text">Humidity</div>
             </div>
          <div className="humitity-and-wind">
            <img src={windIcon} alt="Wind" className='icon'/>
            <div className='wind-speed'>{wind}km/h</div>
            <div className="text">wind</div>
          </div>
        </div>
      </div>


    </>
  );
}
function App() {
  const [temprature, setTemprature] = useState(0)
  const [city, setCity] = useState("Chennai")
  const [country, setCountry] = useState("IN")
  const [lati, setLati] = useState(0)
  const [longi, setLongi] = useState(0)
  const [wind ,setWind] = useState(0)
  const [humidity,setHumidity] = useState(0)


  return (
    <>
      <div>
        <div className="container">
          <h1>WEATHER APP</h1>
          <div className="input-container">
            <div className='input-items'>

              <input type="search"
                placeholder='Search city...'
                className='search-input'
              />
              <div className="search-icon">
                <img src={searchIcon} alt="search" />

              </div>
            </div>
          </div>
          <div>

            <WeatherDetails
              cloudyIcon={cloudyIcon}
              city={city} 
              temprature={temprature}
              country={country} 
              lati={lati} 
              longi={longi} humidity={humidity}
              wind={wind}
            />
            <div className="copy-right">

            <p>Designed by <a href="git"><span>Rohith</span></a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
