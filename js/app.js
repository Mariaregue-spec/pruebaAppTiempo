const btn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weather");

btn.addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) buscarCiudad(city);
});
function buscarCiudad(city) {
  weatherDiv.innerHTML = "🔍 Buscando ciudad...";

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&language=es`)
    .then(res => res.json())
    .then(data => {
      if (!data.results) {
        weatherDiv.innerHTML = "❌ Ciudad no encontrada";
        return;
      }

      const lugar = data.results[0];
      obtenerClima(lugar.latitude, lugar.longitude, lugar.name, lugar.country);
    });
}
function obtenerClima(lat, lon, ciudad, pais) {

  const url = `https://api.open-meteo.com/v1/forecast?
latitude=${lat}&longitude=${lon}
&daily=temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,wind_speed_10m_max,sunset,sunrise,sunshine_duration,uv_index_max,daylight_duration,uv_index_clear_sky_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max
&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,cloud_cover,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_gusts_10m,uv_index,is_day
&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_gusts_10m,rain,snowfall,precipitation,cloud_cover
&timezone=auto`;

  fetch(url.replace(/\s+/g, ""))
    .then(res => res.json())
    .then(data => mostrarClima(data, ciudad, pais));
}
function mostrarClima(data, ciudad, pais) {

  const c = data.current;
  const d = data.daily;
cambiarFondo(c);

function cambiarFondo(c) {

  document.body.className = "";

  // 🌧️ LLUVIA (prioridad alta)
  if (c.precipitation > 0) {
    document.body.classList.add("fondo-lluvia");
    return;
  }

  // ☁️ NUBLADO
  if (c.cloud_cover > 60) {
    document.body.classList.add("fondo-nublado");
    return;
  }

  // 🌙 NOCHE
  if (!c.is_day) {
    document.body.classList.add("fondo-noche");
    return;
  }

  // ☀️ SOL
  document.body.classList.add("fondo-soleado");
}


  const horasLuz = Math.round(d.daylight_duration[0] / 3600);

  weatherDiv.innerHTML = `
    <h2>📍 ${ciudad}, ${pais}</h2>

    <p>🌡️ Ahora: ${c.temperature_2m} °C</p>
    <p>⬆️ Máx hoy: ${d.temperature_2m_max[0]} °C</p>
    <p>⬇️ Mín hoy: ${d.temperature_2m_min[0]} °C</p>

    <p>☁️ Nubosidad: ${c.cloud_cover}%</p>
    <p>🌧️ Lluvia: ${d.precipitation_sum[0]} mm</p>
    <p>❄️ Nieve: ${d.snowfall_sum[0]} mm</p>

    <p>☀️ Índice UV: ${d.uv_index_max[0]}</p>
    <p>🕒 Horas de luz: ${horasLuz} h</p>

    <h3>📆 Próximos días</h3>
    ${pronostico(d)}
  `;
}
function pronostico(daily) {
  let html = "";

  for (let i = 1; i < 5; i++) {
    html += `
      <p>
        Día ${i + 1}: 
        ⬆️ ${daily.temperature_2m_max[i]}°C | 
        ⬇️ ${daily.temperature_2m_min[i]}°C
      </p>
    `;
  }
  return html;
}
// 🌍 Ciudad por defecto al cargar la app
window.addEventListener("load", () => {
  buscarCiudad("Betanzos");
});
