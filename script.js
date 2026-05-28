const wmo = {
  0:  ['Clear sky',         'ti-sun'],
  1:  ['Mainly clear',      'ti-sun'],
  2:  ['Partly cloudy',     'ti-cloud'],
  3:  ['Overcast',          'ti-cloud'],
  45: ['Foggy',             'ti-mist'],
  48: ['Icy fog',           'ti-mist'],
  51: ['Light drizzle',     'ti-cloud-rain'],
  61: ['Light rain',        'ti-cloud-rain'],
  63: ['Moderate rain',     'ti-cloud-rain'],
  65: ['Heavy rain',        'ti-cloud-rain'],
  71: ['Light snow',        'ti-snowflake'],
  73: ['Moderate snow',     'ti-snowflake'],
  75: ['Heavy snow',        'ti-snowflake'],
  80: ['Showers',           'ti-cloud-storm'],
  95: ['Thunderstorm',      'ti-bolt'],
  99: ['Heavy thunderstorm','ti-bolt'],
};

function uvColor(v) {
  if (v <= 2)  return '#639922';
  if (v <= 5)  return '#EF9F27';
  if (v <= 7)  return '#D85A30';
  if (v <= 10) return '#E24B4A';
  return '#993556';
}

function uvLabel(v) {
  if (v <= 2)  return 'Low';
  if (v <= 5)  return 'Moderate';
  if (v <= 7)  return 'High';
  if (v <= 10) return 'Very high';
  return 'Extreme';
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toggleTheme() {
  const app = document.getElementById('app');
  const isDark = app.dataset.theme === 'dark';
  app.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('themeIcon').className = isDark ? 'ti ti-moon' : 'ti ti-sun';
  document.getElementById('themeLabel').textContent = isDark ? 'Dark' : 'Light';
}

async function getWeather() {
  const cityInput = document.getElementById('city');
  const city = cityInput.value.trim();
  const btn = document.getElementById('searchBtn');
  const result = document.getElementById('result');

  if (!city) { cityInput.focus(); return; }

  btn.innerHTML = '<span class="spinner"></span> Searching';
  btn.disabled = true;

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || !geoData.results.length) {
      result.innerHTML = `
        <div class="error">
          <i class="ti ti-alert-circle"></i> City not found. Please try again.
        </div>`;
      return;
    }

    const { latitude: lat, longitude: lon, name, country, admin1 } = geoData.results[0];

    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&hourly=relative_humidity_2m,apparent_temperature,uv_index` +
      `&daily=sunrise,sunset` +
      `&forecast_days=1&timezone=auto`
    );
    const wData = await wRes.json();

    const { temperature, windspeed, weathercode } = wData.current_weather;
    const humidity  = wData.hourly?.relative_humidity_2m?.[0] ?? '—';
    const feelsLike = wData.hourly?.apparent_temperature?.[0] ?? '—';
    const uvRaw     = wData.hourly?.uv_index?.[0] ?? 0;
    const uv        = Math.round(uvRaw * 10) / 10;
    const sunrise   = fmtTime(wData.daily?.sunrise?.[0]);
    const sunset    = fmtTime(wData.daily?.sunset?.[0]);

    const [condText, condIcon] = wmo[weathercode] || ['Unknown', 'ti-question-mark'];
    const loc = [admin1, country].filter(Boolean).join(', ');
    const uvPct = Math.min(100, Math.round((uv / 12) * 100));

    result.innerHTML = `
      <div class="city-line">
        <span class="city-name">${name}</span>
        <span class="badge"><i class="ti ti-map-pin"></i> ${country || ''}</span>
      </div>
      <div class="location"><i class="ti ti-map-2"></i> ${loc}</div>

      <div class="temp-cond">
        <div style="display:flex;align-items:flex-end;gap:4px">
          <span class="temp-big">${Math.round(temperature)}</span>
          <span class="temp-unit">°C</span>
        </div>
        <div class="cond-info">
          <span class="cond-label"><i class="ti ${condIcon}"></i> ${condText}</span>
          <span class="feels">Feels like ${typeof feelsLike === 'number' ? Math.round(feelsLike) : feelsLike}°C</span>
        </div>
      </div>

      <hr class="divider"/>
      <p class="section-title">Details</p>
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-label"><i class="ti ti-wind"></i> Wind</div>
          <div class="stat-val">${Math.round(windspeed)}<span class="stat-unit"> km/h</span></div>
        </div>
        <div class="stat">
          <div class="stat-label"><i class="ti ti-droplet"></i> Humidity</div>
          <div class="stat-val">${humidity}<span class="stat-unit"> %</span></div>
        </div>
        <div class="stat">
          <div class="stat-label"><i class="ti ti-navigation"></i> Latitude</div>
          <div class="stat-val" style="font-size:16px">${lat.toFixed(2)}°</div>
        </div>
        <div class="stat">
          <div class="stat-label"><i class="ti ti-navigation"></i> Longitude</div>
          <div class="stat-val" style="font-size:16px">${lon.toFixed(2)}°</div>
        </div>
      </div>

      <div class="uv-bar-wrap">
        <div class="uv-top">
          <span class="uv-label"><i class="ti ti-sun"></i> UV index</span>
          <span class="uv-val">${uv} <span style="font-size:13px;color:var(--t2)">${uvLabel(uv)}</span></span>
        </div>
        <div class="uv-track">
          <div class="uv-fill" style="width:${uvPct}%;background:${uvColor(uv)}"></div>
        </div>
      </div>

      <p class="section-title">Sun</p>
      <div class="sun-row">
        <div class="sun-card">
          <i class="ti ti-sunrise sun-icon"></i>
          <div><div class="sun-label">Sunrise</div><div class="sun-time">${sunrise}</div></div>
        </div>
        <div class="sun-card">
          <i class="ti ti-sunset sun-icon"></i>
          <div><div class="sun-label">Sunset</div><div class="sun-time">${sunset}</div></div>
        </div>
      </div>
    `;
  } catch (e) {
    result.innerHTML = `
      <div class="error">
        <i class="ti ti-alert-circle"></i> Something went wrong. Check your connection.
      </div>`;
  } finally {
    btn.innerHTML = '<i class="ti ti-search"></i> Search';
    btn.disabled = false;
  }
}