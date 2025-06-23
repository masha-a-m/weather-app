// Weather App using OpenWeatherMap API
// API Key: db3544eb915f623395a9a7140769778a
const API_KEY = 'db3544eb915f623395a9a7140769778a';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'; 
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'; 
const ICON_URL = 'http://openweathermap.org/img/wn/';

let currentUnit = 'C';
let currentCity = '';

showLoading();
document.addEventListener('DOMContentLoaded', () => {
  // Show loader immediately

  // Get DOM elements
  const searchBtn = document.getElementById('search-btn');
  const geoBtn = document.getElementById('geolocation-btn');
  const input = document.getElementById('location-input');
  const toggleUnitBtn = document.getElementById('toggle-unit');
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Initialize Dark Mode
  if (localStorage.getItem('darkMode') === 'enabled' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches) {
    enableDarkMode();
  }

  // Event Listeners
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.contains('dark-mode') ? disableDarkMode() : enableDarkMode();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const city = input?.value.trim();
      if (city) getWeatherData(city);
    });
  }

  if (geoBtn) {
    geoBtn.addEventListener('click', getLocation);
  }

  if (toggleUnitBtn) {
    toggleUnitBtn.addEventListener('click', () => {
      currentUnit = currentUnit === 'C' ? 'F' : 'C';
      toggleUnitBtn.textContent = `Switch to °${currentUnit === 'C' ? 'F' : 'C'}`;
      if (currentCity) getWeatherData(currentCity);
    });
  }

  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const city = input.value.trim();
        if (city) getWeatherData(city);
      }
    });
  }

  // Load recent searches
  loadRecentSearches();

  // Auto-detect location on first visit
  if (!localStorage.getItem('hasLoaded')) {
    getLocation();
    localStorage.setItem('hasLoaded', true);
  } else {
    hideLoading();
  }
});

// ========== LOADER & ERROR HANDLING ==========
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }

  window.loadingTimeout = setTimeout(() => {
    showError("Loading took too long. Please try again.");
    hideLoading();
  }, 10000);
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  clearTimeout(window.loadingTimeout);
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  hideLoading();
}

// ========== GEOLOCATION ==========
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
    .then(response => {
      if (!response.ok) throw new Error("Location weather fetch failed");
      return response.json();
    })
    .then(data => {
      displayCurrentWeather(data);
      getForecast(data.name);
      saveToRecent(data.name);
      updateBackground(data.weather[0].main);
      hideLoading();
    })
    .catch(err => {
      console.error(err);
      showError("Error fetching location-based weather.");
    });
}

function error() {
  showError("Unable to retrieve your location.");
}

// ========== WEATHER DATA ==========
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

// ========== DISPLAY FUNCTIONS ==========
function displayCurrentWeather(data) {
  const iconElement = document.getElementById('weather-icon');
  if (!iconElement) return;

  const name = data.name;
  const temp = currentUnit === 'C' ? Math.round(data.main.temp) : celsiusToFahrenheit(data.main.temp);
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

  iconElement.src = `${ICON_URL}${icon}@2x.png`;
}

function displayForecast(forecastList) {
  const container = document.getElementById('forecast-cards');
  if (!container) return;

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

// ========== UTILITY FUNCTIONS ==========
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
  let bgImage = '';

  switch (weather.toLowerCase()) {
    case 'clear':
      bgImage = 'url("../images/sunny.avif")';
      break;
    case 'clouds':
      bgImage = 'url("../images/grey clouds.avif")';
      break;
    case 'rain':
    case 'drizzle':
      bgImage = 'url("../images/rainy.avif")';
      break;
    case 'thunderstorm':
      bgImage = 'url("../images/thunderstorm.avif")';
      break;
    case 'snow':
      bgImage = 'url("../images/snow.avif")';
      break;
    default:
      bgImage = 'url("../images/grey clouds.avif")';
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
  if (!list) return;

  list.innerHTML = '';
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');

  recent.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => getWeatherData(city));
    list.appendChild(li);
  });
}

// ========== DARK MODE TOGGLE ==========
function enableDarkMode() {
  document.body.classList.add('dark-mode');
  localStorage.setItem('darkMode', 'enabled');
  const btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.textContent = '☀️ Light Mode';
}

function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  localStorage.setItem('darkMode', 'disabled');
  const btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.textContent = '🌙 Dark Mode';
}