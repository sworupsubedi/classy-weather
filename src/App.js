import { useEffect, useState } from "react";

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function convertToFahrenheit(n) {
  return (n * 9.0) / 5.0 + 32.0;
}

export default function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [weatherCity, setWeatherCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Retrieve location from localStorage on initial render
  useEffect(() => {
    const savedLocation = localStorage.getItem("weatherLocation");
    if (savedLocation) {
      setLocation(savedLocation);
    }
  }, []);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("weatherLocation", location);
  }, [location]);

  useEffect(
    function () {
      if (!location || location.length < 2) return;
      async function fetchData() {
        try {
          setIsLoading(true);
          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
          );
          const geoData = await geoRes.json();

          if (!geoData.results) throw new Error("Location not found");

          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);

          setWeatherCity(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          const weatherDaily = weatherData.daily;
          setWeather(weatherDaily);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
      return function () {
        setWeather({});
        setWeatherCity("");
      };
    },
    [location]
  );

  return (
    <div className="app">
      <h1> CLASSY WEATHER </h1>
      <div className="search">
        <input
          type="text"
          id="search"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search Location"
        />
      </div>

      {isLoading && <h2> Loading... </h2>}
      {!isLoading && weatherCity && <Name name={weatherCity} />}
      {Object.keys(weather).length !== 0 && <Weather weather={weather} />}
    </div>
  );
}

function Name({ name }) {
  return (
    <div>
      <h2> Weather {name} </h2>
    </div>
  );
}

function Weather({ weather }) {
  const {
    temperature_2m_max: high,
    temperature_2m_min: low,
    time: date,
    weathercode: code,
  } = weather;

  return (
    <ul className="weather">
      {date.map((day, i) => (
        <Day
          high={high.at(i)}
          low={low.at(i)}
          date={date.at(i)}
          code={code.at(i)}
          key={date.at(i)}
          idx={i}
        />
      ))}
    </ul>
  );
}

function Day({ high, low, date, code, idx }) {
  return (
    <li className="day">
      <span> {getWeatherIcon(code)} </span>
      <p> {idx === 0 ? `Today` : formatDay(date)} </p>
      <p>
        {Math.round(low)}°C - <strong> {Math.round(high)}°C </strong>
      </p>
      <p>
        {Math.round(convertToFahrenheit(low))}°F -{" "}
        <strong> {Math.round(convertToFahrenheit(high))}°F </strong>
      </p>
    </li>
  );
}
