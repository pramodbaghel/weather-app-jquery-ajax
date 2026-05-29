const API_URL = "https://api.openweathermap.org/data/2.5/weather";

/* ── Floating orbs ── */
(function () {
    const wrap = document.getElementById("orbs");
    for (let i = 0; i < 20; i++) {
        const o = document.createElement("div");
        o.className = "orb";
        const s = Math.random() * 40 + 10;
        o.style.cssText = `
    width:${s}px;height:${s}px;
    left:${Math.random() * 100}%;
    animation-duration:${Math.random() * 20 + 12}s;
    animation-delay:${Math.random() * 15}s;
    opacity:${Math.random() * .07 + .02};
    `;
        wrap.appendChild(o);
    }
})();

/* ── Background map ── */
const bgMap = {
    default: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    sunny: "linear-gradient(135deg,#f7971e,#ffd200,#ffe57c)",
    cloudy: "linear-gradient(135deg,#4e54c8,#8f94fb,#c2cbe5)",
    rain: "linear-gradient(135deg,#1a3a5c,#2980b9,#6dd5fa)",
    snow: "linear-gradient(135deg,#5b86e5,#a8d8ea,#e0f7ff)",
    thunder: "linear-gradient(135deg,#0f0c29,#4a0080,#7b2ff7)",
    mist: "linear-gradient(135deg,#606c88,#3f4c6b,#a8c0d6)",
};

function setBackground(id) {
    let k = "default";
    if (id >= 200 && id < 300) k = "thunder";
    else if (id >= 300 && id < 600) k = "rain";
    else if (id >= 600 && id < 700) k = "snow";
    else if (id >= 700 && id < 800) k = "mist";
    else if (id === 800) k = "sunny";
    else if (id > 800) k = "cloudy";
    document.body.style.background = bgMap[k];
}

/* ── Weather emoji ── */
function getEmoji(id) {
    if (id >= 200 && id < 300) return "⛈️";
    if (id >= 300 && id < 400) return "🌦️";
    if (id >= 500 && id < 511) return "🌧️";
    if (id >= 511 && id < 600) return "🌨️";
    if (id >= 600 && id < 700) return "❄️";
    if (id >= 700 && id < 800) return "🌫️";
    if (id === 800) return "☀️";
    if (id === 801) return "🌤️";
    if (id === 802) return "⛅";
    if (id >= 803) return "☁️";
    return "🌡️";
}

/* ── Outfit suggestions ── */
function getOutfit(temp) {
    if (temp >= 40) return { emoji: "🩱", text: "<strong>40°C+: Extreme Heat!</strong><br>Wear minimal, loose cotton clothing. Stay hydrated and avoid direct sunlight." };
    if (temp >= 30) return { emoji: "👕", text: "<strong>30–40°C: Very Hot</strong><br>A light T-shirt and shorts are ideal. Apply sunscreen and carry water." };
    if (temp >= 20) return { emoji: "👔", text: "<strong>20–30°C: Pleasant Weather</strong><br>A casual shirt or light top is perfect. Bring a light layer for evenings." };
    if (temp >= 15) return { emoji: "🧥", text: "<strong>15–20°C: Mildly Cool</strong><br>A full-sleeve shirt or sweatshirt works well. Keep a light jacket handy." };
    if (temp >= 5) return { emoji: "🧣", text: "<strong>5–15°C: Cold Outside</strong><br>Layer up with a sweater, jacket, scarf and warm footwear." };
    return { emoji: "🧤", text: "<strong>Below 5°C: Freezing Cold!</strong><br>Heavy coat, thermal innerwear, woolen cap, scarf and gloves — all essential!" };
}

/* ── Recent cities ── */
function getRecent() {
    try { return JSON.parse(localStorage.getItem("skypulse_recent") || "[]"); }
    catch (e) { return []; }
}
function saveRecent(city) {
    let list = getRecent().filter(c => c.toLowerCase() !== city.toLowerCase());
    list.unshift(city);
    localStorage.setItem("skypulse_recent", JSON.stringify(list.slice(0, 5)));
    renderRecent();
}
function renderRecent() {
    const list = getRecent();
    const section = $("#recent-section"), container = $("#recent-list");
    container.empty();
    if (!list.length) { section.hide(); return; }
    section.show();
    list.forEach(city => {
        $(`<div class="chip">${city}</div>`)
            .on("click", () => { $("#city-input").val(city); fetchWeather(city); })
            .appendTo(container);
    });
}

/* ── UI helpers ── */
function showSpinner() { $("#spinner").css("display", "flex"); $("#error-box,#weather-card,#outfit-card").hide(); }
function hideSpinner() { $("#spinner").hide(); }
function showError(msg) { hideSpinner(); $("#error-msg").text(msg); $("#error-box").fadeIn(350); }

/* ── Main fetch ── */
function fetchWeather(city) {
    city = city.trim();
    if (!city) { showError("Please enter a city name."); return; }
    showSpinner();

    $.ajax({
        url: API_URL,
        method: "GET",
        data: { q: city, appid: WEATHER_API_KEY, units: "metric" },
        timeout: 10000,
        success: function (d) { hideSpinner(); renderWeather(d); saveRecent(d.name); },
        error: function (xhr) {
            hideSpinner();
            if (xhr.status === 401) showError("API key is invalid. Please add a valid key to index.html.");
            else if (xhr.status === 404) showError(`❌ City "${city}" not found. Please check the spelling.`);
            else if (xhr.statusText === "timeout") showError("⏱️ Request timed out. Please check your connection.");
            else showError("Network error. Please check your internet connection.");
        }
    });
}

function renderWeather(d) {
    const id = d.weather[0].id;
    setBackground(id);

    $("#w-city").html(d.name + `<span class="wc-country">${d.sys.country}</span>`);
    $("#w-date").text(new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

    const temp = Math.round(d.main.temp);
    $("#w-emoji").text(getEmoji(id));
    $("#w-temp").text(temp);
    $("#w-desc").text(d.weather[0].description);
    $("#w-feels").text(Math.round(d.main.feels_like));
    $("#w-api-icon").attr("src", `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`).show();
    $("#w-humidity").text(d.main.humidity);
    $("#w-wind").text(Math.round(d.wind.speed * 3.6));
    $("#w-vis").text(d.visibility ? (d.visibility / 1000).toFixed(1) : "—");
    $("#w-pressure").text(d.main.pressure);

    const outfit = getOutfit(temp);
    $("#outfit-emoji").text(outfit.emoji);
    $("#outfit-text").html(outfit.text);

    $("#weather-card, #outfit-card").fadeIn(450);
}

/* ── Events ── */
$("#search-btn").on("click", () => fetchWeather($("#city-input").val()));
$("#city-input").on("keypress", e => { if (e.key === "Enter") fetchWeather($(this).val() || $("#city-input").val()); });

/* ── Init ── */
$(document).ready(() => { renderRecent(); fetchWeather("Mumbai"); });