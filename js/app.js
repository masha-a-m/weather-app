// Weather App using OpenWeatherMap API
// API Key: db3544eb915f623395a9a7140769778a
const API_KEY = 'db3544eb915f623395a9a7140769778a';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'; 
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'; 
const ICON_URL = 'http://openweathermap.org/img/wn/';

let currentUnit = 'C';
let currentCity = '';

document.addEventListener('DOMContentLoaded', () => {
  
  // Show loader immediately

    // Get DOM Elements
  const searchBtn = document.getElementById('search-btn');
  const geoBtn = document.getElementById('geolocation-btn');
  const input = document.getElementById('location-input');
  const toggleUnitBtn = document.getElementById('toggle-unit');
  const darkModeToggle = document.getElementById('dark-mode-toggle');

// Check if user prefers dark mode or previously set it
if (localStorage.getItem('darkMode') === 'enabled' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches) {
  enableDarkMode();
}

darkModeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-mode')) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
});

function enableDarkMode() {
  document.body.classList.add('dark-mode');
  localStorage.setItem('darkMode', 'enabled');
  darkModeToggle.textContent = '☀️ Light Mode';
}

function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  localStorage.setItem('darkMode', 'disabled');
  darkModeToggle.textContent = '🌙 Dark Mode';
}

  searchBtn.addEventListener('click', () => {
    const city = input.value.trim();
    if (city) getWeatherData(city);
  });

  geoBtn.addEventListener('click', () => {
    getLocation();
  });

  toggleUnitBtn.addEventListener('click', () => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    toggleUnitBtn.textContent = `Switch to °${currentUnit === 'C' ? 'F' : 'C'}`;
    if (currentCity) getWeatherData(currentCity);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = input.value.trim();
      if (city) getWeatherData(city);
    }
  });

  // Load recent searches on page load
  loadRecentSearches();

  // Auto-detect location on first visit
  if (!localStorage.getItem('hasLoaded')) {
    getLocation();
    localStorage.setItem('hasLoaded', true);
  }
});

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  hideLoading();
}

function getLocation() {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    showError("Geolocation not supported by this browser.");
  }
}

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  fetch(`${CURRENT_WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      displayCurrentWeather(data);
      getForecast(data.name);
      saveToRecent(data.name);
      updateBackground(data.weather[0].main);
    })
    .catch(() => showError("Error fetching location-based weather."));
}

function error() {
  showError("Unable to retrieve your location.");
}

function getWeatherData(city) {
  showLoading();
  fetch(`${CURRENT_WEATHER_URL}?q=${city}&appid=${API_KEY}&units=metric`)
    .then(response => {
      if (!response.ok) throw new Error('City not found');
      return response.json();
    })
    .then(data => {
      displayCurrentWeather(data);
      getForecast(data.name);
      saveToRecent(data.name);
      updateBackground(data.weather[0].main);
      currentCity = data.name;
      hideLoading();
    })
    .catch(err => {
      showError(err.message);
    });
}

function getForecast(city) {
  fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`)
    .then(response => response.json())
    .then(data => {
      const forecastList = data.list.filter((item, index) => index % 8 === 0); // Daily forecast
      displayForecast(forecastList);
    });
}

function displayCurrentWeather(data) {
  const name = data.name;
  const temp = currentUnit === 'C' ? Math.round(data.main.temp) : celsiusToFahrenheit(data.main.feels_like);
  const feelsLike = currentUnit === 'C' ? Math.round(data.main.feels_like) : celsiusToFahrenheit(data.main.feels_like);
  const humidity = data.main.humidity;
  const wind = data.wind.speed;
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;

  const sunrise = formatTime(data.sys.sunrise + data.timezone);
  const sunset = formatTime(data.sys.sunset + data.timezone);

  document.getElementById('location-name').textContent = name;
  document.getElementById('temperature').textContent = `${temp}°${currentUnit}`;
  document.getElementById('feels-like').textContent = feelsLike;
  document.getElementById('humidity').textContent = humidity;
  document.getElementById('wind-speed').textContent = wind;
  document.getElementById('weather-description').textContent = description.charAt(0).toUpperCase() + description.slice(1);
  document.getElementById('sunrise-time').textContent = sunrise;
  document.getElementById('sunset-time').textContent = sunset;
  document.getElementById('weather-icon').src = `${ICON_URL}${icon}@2x.png`;
}

function displayForecast(forecastList) {
  const container = document.getElementById('forecast-cards');
  container.innerHTML = '';

  forecastList.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const temp = currentUnit === 'C' ? Math.round(day.main.temp) : celsiusToFahrenheit(day.main.temp);
    const icon = day.weather[0].icon;

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <p><strong>${dayName}</strong></p>
      <img src="${ICON_URL}${icon}.png" alt="Icon">
      <p>${temp}°${currentUnit}</p>
      <p>${day.weather[0].main}</p>
    `;
    container.appendChild(card);
  });
}

function celsiusToFahrenheit(c) {
  return Math.round((c * 9 / 5) + 32);
}

function formatTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

function updateBackground(weather) {
  const body = document.body;
  const overlay = document.getElementById('background-overlay');

  let bgImage = '';
  switch (weather.toLowerCase()) {
    case 'clear':
      bgImage = 'url("../images/sunny.avif")';
      break;
    case 'clouds':
      bgImage = 'url("images\grey clouds.avif")';
      break;
    case 'rain':
    case 'drizzle':
      bgImage = 'url("images\rainy.avif")';
      break;
    case 'thunderstorm':
      bgImage = 'url("images\thunderstorm.avif")';
      break;
    case 'snow':
      bgImage = 'url("images\snow.avif")';
      break;
    default:
      bgImage = 'url("images\grey clouds.avif")';
  }

  body.style.backgroundImage = bgImage;
}

function saveToRecent(city) {
  let recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  if (!recent.includes(city)) {
    recent.unshift(city);
    if (recent.length > 5) recent.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recent));
    loadRecentSearches();
  }
}

function loadRecentSearches() {
  const list = document.getElementById('search-list');
  list.innerHTML = '';
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');

  recent.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => getWeatherData(city));
    list.appendChild(li);
  });
}


// Hide preloader after everything loads
// Minimum time (in ms) that the loader should be visible
const MIN_LOADER_TIME = 2000;

let pageLoaded = false;

// Triggered when all resources are fully loaded
window.addEventListener('load', () => {
  pageLoaded = true;
});

// Start checking after a short delay
setTimeout(() => {
  const preloader = document.getElementById('preloader');

  // Hide only if page has loaded
  if (pageLoaded && preloader) {
    preloader.classList.add('hidden');
  }
}, MIN_LOADER_TIME);