// --- Referencias DOM ---
const video = document.getElementById("videoFondo");
const btn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weather");
const fechaEl = document.getElementById("fecha");

// --- Mostrar fecha actual ---
function mostrarFecha() {
  const hoy = new Date();
  fechaEl.textContent = hoy.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

// --- Eventos de búsqueda ---
btn.addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) buscarCiudad(city);
});
document.getElementById("cityInput").addEventListener("keypress", e => {
  if (e.key === "Enter") buscarCiudad(e.target.value);
});

// --- Buscar ciudad ---
function buscarCiudad(city) {
  localStorage.setItem("ultimaCiudad", city);
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

// --- Obtener clima ---
function obtenerClima(lat, lon, ciudad, pais) {
  const url = `
https://api.open-meteo.com/v1/forecast?
latitude=${lat}&longitude=${lon}
&current=temperature_2m,apparent_temperature,is_day,cloud_cover,precipitation,snowfall,wind_speed_10m,relative_humidity_2m
&hourly=temperature_2m,precipitation,cloud_cover,is_day
&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset
&timezone=auto`;

  fetch(url.replace(/\s+/g, ""))
    .then(res => res.json())
    .then(data => mostrarClima(data, ciudad, pais));
}

// --- Mostrar clima ---
function mostrarClima(data, ciudad, pais) {
  const c = data.current;
  const d = data.daily;
  const h = data.hourly;
  const iconoHoy = obtenerIconoSVG(c, 80);

  cambiarFondo(c);

  // --- Card día actual ---
  let html = `
<h2>📍 ${ciudad}, ${pais}</h2>
<button class="fav-btn" onclick="guardarFavorita('${ciudad}')">⭐ Guardar favorita</button>

<div class="card-dia">
  <div class="icono-hoy">${iconoHoy}</div>
  <div class="datos-grid">
    <div class="dato"><span>🌡️</span><strong>${c.temperature_2m} °C</strong><small>Ahora</small></div>
    <div class="dato"><span>🥵</span><strong>${c.apparent_temperature} °C</strong><small>Sensación</small></div>
    <div class="dato"><span>💨</span><strong>${c.wind_speed_10m} km/h</strong><small>Viento</small></div>
    <div class="dato"><span>💧</span><strong>${c.relative_humidity_2m} %</strong><small>Humedad</small></div>
    <div class="dato"><span>⬆️</span><strong>${d.temperature_2m_max[0]} °C</strong><small>Máxima</small></div>
    <div class="dato"><span>⬇️</span><strong>${d.temperature_2m_min[0]} °C</strong><small>Mínima</small></div>
    <div class="dato"><span>🌅</span><strong>${new Date(d.sunrise[0]).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong><small>Amanecer</small></div>
    <div class="dato"><span>🌇</span><strong>${new Date(d.sunset[0]).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong><small>Atardecer</small></div>
  </div>
</div>
`;

  // --- Carrusel de horas ---
  const hoyDia = new Date().getDate();
  html += `<h3>Pronóstico por horas</h3><div class="carousel-horas">`;
  for (let i = 0; i < h.time.length; i++) {
    const fechaHora = new Date(h.time[i]);
    if (fechaHora.getDate() !== hoyDia) continue;
    const climaHora = { is_day: h.is_day[i], precipitation: h.precipitation[i], cloud_cover: h.cloud_cover[i] };
    html += `
      <div class="hora-item">
        <strong>${fechaHora.getHours()}:00</strong>
        ${obtenerIconoSVG(climaHora, 28)}
        <span>${h.temperature_2m[i]}°</span>
      </div>`;
  }
  html += `</div>`;

  // --- Pronóstico 7 días ---
  html += `<h3>📅 Próximos 7 días</h3><div class="pronostico">`;
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(d.time[i]);
    const dia = fecha.toLocaleDateString("es-ES", { weekday: "short" });
    html += `
      <div class="dia-card">
        <strong>${dia}</strong>
        ${obtenerIconoSVG({ is_day: true, precipitation: 0, cloud_cover: 0 }, 28)}
        <span>${d.temperature_2m_max[i]}° / ${d.temperature_2m_min[i]}°</span>
      </div>`;
  }
  html += `</div>`;

  // --- Canvas para alertas ---
  html += `
<h3>⚠️ Alertas climáticas</h3>
<canvas id="alertasChart" width="400" height="150"></canvas>
`;

  // --- Insertar todo el HTML ---
  weatherDiv.innerHTML = html;

  // --- Dibujar gráfica de alertas ---
  mostrarAlertas(data);
}

// --- Fondo dinámico ---
function cambiarFondo(c) {
  if (c.precipitation > 10) { video.src = c.is_day ? "../video/stormDay.mp4" : "../video/stormyNight.mp4"; return; }
  if (c.snowfall > 0) { video.src = c.is_day ? "../video/snowingDay.mp4" : "../video/snowingNight.mp4"; return; }
  if (c.precipitation > 0) { video.src = c.is_day ? "../video/rainDay.mp4" : "../video/rainNight.mp4"; return; }
  if (c.cloud_cover > 60) { video.src = c.is_day ? "../video/cloudyDay.mp4" : "video/cloudyNight.mp4"; return; }
  video.src = c.is_day ? "../video/sunny.mp4" : "../video/night.mp4";
}

// --- Iconos SVG ---
const ICONOS = {
  sol: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="orange" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></svg>`,
  nube: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#555" stroke-width="2"><path d="M20 17H5a4 4 0 010-8 5 5 0 019.7-1A4 4 0 1120 17z"/></svg>`,
  lluvia: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#1e90ff" stroke-width="2"><path d="M20 16H6a4 4 0 010-8 5 5 0 019.7-1A4 4 0 1120 16z"/><line x1="8" y1="20" x2="8" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="16" y1="20" x2="16" y2="22"/></svg>`,
  noche: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f1c40f" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>`
};

function obtenerIconoSVG(c, size = 48) {
  let svg;
  if (!c.is_day) svg = ICONOS.noche;
  else if (c.precipitation > 0) svg = ICONOS.lluvia;
  else if (c.cloud_cover > 60) svg = ICONOS.nube;
  else svg = ICONOS.sol;
  return svg.replace(/width="48"/, `width="${size}"`).replace(/height="48"/, `height="${size}"`);
}

// --- Favoritas ---
function guardarFavorita(ciudad) {
  let favoritas = JSON.parse(localStorage.getItem("favoritas")) || [];
  if (!favoritas.includes(ciudad)) {
    favoritas.push(ciudad);
    localStorage.setItem("favoritas", JSON.stringify(favoritas));
    mostrarFavoritas();
  }
}
function eliminarFavorita(ciudad) {
  let favoritas = JSON.parse(localStorage.getItem("favoritas")) || [];
  favoritas = favoritas.filter(c => c !== ciudad);
  localStorage.setItem("favoritas", JSON.stringify(favoritas));
  mostrarFavoritas();
}
function mostrarFavoritas() {
  const contenedor = document.getElementById("favoritas");
  if (!contenedor) return;
  let favoritas = JSON.parse(localStorage.getItem("favoritas")) || [];
  contenedor.innerHTML = "";
  favoritas.forEach(ciudad => {
    contenedor.innerHTML += `<div class="fav-item"><span onclick="buscarCiudad('${ciudad}')">${ciudad}</span><button onclick="eliminarFavorita('${ciudad}')">❌</button></div>`;
  });
}

// --- Inicializar ---
window.addEventListener("load", () => {
  mostrarFecha();
  mostrarFavoritas();
  buscarCiudad("Betanzos");
});

// --- Mostrar gráfica de alertas ---
function mostrarAlertas(data) {
  const alertas = {
    "Lluvia": data.current.precipitation,
    "Viento": data.current.wind_speed_10m,
    "Nieve": data.current.snowfall || 0
  };

  const ctx = document.getElementById('alertasChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(alertas),
      datasets: [{
        label: 'Nivel de alerta',
        data: Object.values(alertas),
        backgroundColor: ['#1e90ff', '#f39c12', '#95a5a6']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Alertas climáticas actuales' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
