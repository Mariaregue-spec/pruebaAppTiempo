const btn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weather");

btn.addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) buscarCiudad(city);
});

function buscarCiudad(city) {
  weatherDiv.innerHTML = "🔍 Buscando ciudad...";

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&language=es`)
    .then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        weatherDiv.innerHTML = "❌ Ciudad no encontrada";
        return;
      }

      const lugar = data.results[0];
      obtenerClima(lugar.latitude, lugar.longitude, lugar.name, lugar.country);
    })
    .catch(() => weatherDiv.innerHTML = "❌ Error de conexión");
}

function obtenerClima(lat, lon, ciudad, pais) {
  const url = `
https://api.open-meteo.com/v1/forecast?
latitude=${lat}&longitude=${lon}
&current=temperature_2m,is_day,cloud_cover,precipitation
&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,daylight_duration
&timezone=auto`;

  fetch(url.replace(/\s+/g, ""))
    .then(res => res.json())
    .then(data => mostrarClima(data, ciudad, pais));
}

function mostrarClima(data, ciudad, pais) {
  const c = data.current;
  const d = data.daily;

  cambiarFondo(c);

  weatherDiv.innerHTML = `
    <h2>📍 ${ciudad}, ${pais}</h2>
    <p>🌡️ Ahora: ${c.temperature_2m} °C</p>
    <p>⬆️ Máx: ${d.temperature_2m_max[0]} °C</p>
    <p>⬇️ Mín: ${d.temperature_2m_min[0]} °C</p>
  `;
}

function cambiarFondo(c) {
  document.body.className = "";

  if (!c.is_day) {
    document.body.classList.add("fondo-noche");
    return;
  }
  if (c.precipitation > 0) {
    document.body.classList.add("fondo-lluvia");
    return;
  }
  if (c.cloud_cover > 60) {
    document.body.classList.add("fondo-nublado");
    return;
  }
  document.body.classList.add("fondo-soleado");
}

// Ciudad por defecto
window.addEventListener("load", () => {
  buscarCiudad("Betanzos");
});
