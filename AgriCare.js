/* =========================================================
   AGRICARE - COMPLETE FRONTEND PROTOTYPE
   HTML + CSS + JavaScript only
========================================================= */

"use strict";

/* ================= STORAGE ================= */

const STORAGE = {
    user: "agricare_user",
    farm: "agricare_farm",
    location: "agricare_location",
    weather: "agricare_weather",
    history: "agricare_history",
    costs: "agricare_costs",
    language: "agricare_language"
};

let selectedImage = null;
let currentLocation = null;
let currentWeather = null;


/* ================= HELPERS ================= */

function $(id) {
    return document.getElementById(id);
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

function toast(message) {
    const el = $("toast");

    el.textContent = message;
    el.classList.add("show");

    setTimeout(() => {
        el.classList.remove("show");
    }, 3000);
}

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}


/* ================= LANDING / LOGIN ================= */

function showLogin() {
    $("landingPage").classList.remove("active-page");
    $("landingPage").classList.add("hidden-page");

    $("loginPage").classList.remove("hidden-page");
}

function showLanding() {
    $("loginPage").classList.add("hidden-page");

    $("landingPage").classList.remove("hidden-page");
    $("landingPage").classList.add("active-page");
}


$("loginForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const name = $("farmerName").value.trim();
    const phone = $("phoneNumber").value.trim();

    if (!name) {
        toast("Please enter your name.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        toast("Please enter a valid 10-digit phone number.");
        return;
    }

    const user = {
        name,
        phone,
        loginDate: new Date().toISOString()
    };

    save(STORAGE.user, user);

    openApp();

});


function openApp() {

    $("landingPage").classList.add("hidden-page");
    $("loginPage").classList.add("hidden-page");
    $("appPage").classList.remove("hidden-page");

    loadUser();

    const farm = load(STORAGE.farm);

    if (farm) {
        updateDashboard(farm);
        runFarmAI(farm);
    }

    loadHistory();
    renderSeeds();
    renderPesticideRecommendation();
    renderAnalytics();

    requestLocation();
}


function logout() {

    $("appPage").classList.add("hidden-page");
    showLanding();

    toast("Logged out successfully.");
}


/* ================= USER ================= */

function loadUser() {

    const user = load(STORAGE.user);

    if (!user) return;

    const initial = user.name.charAt(0).toUpperCase();

    $("welcomeName").textContent = user.name;
    $("sideUserName").textContent = user.name;
    $("sideAvatar").textContent = initial;
    $("topAvatar").textContent = initial;
    $("profileAvatar").textContent = initial;

    $("profileName").textContent = user.name;
    $("profilePhone").textContent =
        "+91 " + user.phone.substring(0, 5) + " " + user.phone.substring(5);

}


/* ================= NAVIGATION ================= */

document.querySelectorAll(".nav-item").forEach(btn => {

    btn.addEventListener("click", () => {

        const section = btn.dataset.section;

        navigateTo(section);

    });

});


function navigateTo(section) {

    document.querySelectorAll(".content-section").forEach(sec => {
        sec.classList.remove("active-section");
    });

    const target = $(section);

    if (target) {
        target.classList.add("active-section");
    }

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.remove("active");

        if (btn.dataset.section === section) {
            btn.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (section === "seeds") {
        renderSeeds();
    }

    if (section === "pesticides") {
        renderPesticideRecommendation();
    }

    if (section === "analytics") {
        renderAnalytics();
    }

    if (section === "history") {
        loadHistory();
    }
}


function openNotifications() {
    navigateTo("notifications");
}


/* ================= LANGUAGE ================= */

const translations = {

    en: {
        dashboard: "Dashboard",
        details: "Farm Details",
        seeds: "Seeds",
        pesticides: "Pesticides",
        analysis: "Crop Analysis",
        analytics: "Analytics",
        history: "History",
        notifications: "Notifications",
        profile: "Profile"
    },

    hi: {
        dashboard: "डैशबोर्ड",
        details: "खेत की जानकारी",
        seeds: "बीज",
        pesticides: "कीटनाशक",
        analysis: "फसल विश्लेषण",
        analytics: "विश्लेषण",
        history: "इतिहास",
        notifications: "सूचनाएं",
        profile: "प्रोफ़ाइल"
    },

    mr: {
        dashboard: "डॅशबोर्ड",
        details: "शेतीची माहिती",
        seeds: "बियाणे",
        pesticides: "कीटकनाशके",
        analysis: "पीक विश्लेषण",
        analytics: "विश्लेषण",
        history: "इतिहास",
        notifications: "सूचना",
        profile: "प्रोफाइल"
    }

};


function setLanguage(lang) {

    save(STORAGE.language, lang);

    $("landingLanguage").value = lang;
    $("appLanguage").value = lang;

    document.querySelectorAll(".nav-item").forEach(btn => {

        const key = btn.dataset.section;

        if (translations[lang] && translations[lang][key]) {

            const span = btn.querySelector("span");

            btn.innerHTML =
                `<span>${span ? span.textContent : ""}</span> ${translations[lang][key]}`;

            if (key === "notifications") {
                btn.innerHTML += `<i id="notificationCount">3</i>`;
            }

        }

    });

    $("profileLanguage").textContent =
        lang === "en" ? "English" :
        lang === "hi" ? "हिंदी" : "मराठी";

    toast(
        lang === "en"
            ? "Language changed to English."
            : lang === "hi"
                ? "भाषा हिंदी में बदल दी गई।"
                : "भाषा मराठीत बदलली आहे."
    );
}


$("landingLanguage").addEventListener("change", e => {
    setLanguage(e.target.value);
});

$("appLanguage").addEventListener("change", e => {
    setLanguage(e.target.value);
});


/* ================= LOCATION ================= */

function requestLocation() {

    if (!navigator.geolocation) {

        setLocationFallback("Location services unavailable");

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async position => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            currentLocation = {
                lat,
                lon
            };

            save(STORAGE.location, currentLocation);

            $("locationCoordinates").textContent =
                `Latitude: ${lat.toFixed(5)} • Longitude: ${lon.toFixed(5)}`;

            try {

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
                    {
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                const data = await response.json();

                const address = data.address || {};

                const state =
                    address.state ||
                    address.state_district ||
                    "State detected";

                const region =
                    address.county ||
                    address.state_district ||
                    address.city ||
                    address.town ||
                    address.village ||
                    "Region detected";

                const locationData = {
                    lat,
                    lon,
                    state,
                    region,
                    display: data.display_name || `${region}, ${state}`
                };

                currentLocation = locationData;

                save(STORAGE.location, locationData);

                updateLocationUI(locationData);

                await getWeather(lat, lon);

            } catch (error) {

                const saved = load(STORAGE.location);

                if (saved) {
                    updateLocationUI(saved);
                } else {
                    setLocationFallback("GPS detected");
                }

                await getWeather(lat, lon);
            }

        },

        error => {

            console.log("Location error:", error);

            const saved = load(STORAGE.location);

            if (saved) {
                currentLocation = saved;
                updateLocationUI(saved);
                getWeather(saved.lat, saved.lon);
            } else {
                setLocationFallback("Location permission required");
            }

        },

        {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000
        }

    );
}


function updateLocationUI(location) {

    const state = location.state || "State detected";
    const region = location.region || "Region detected";

    $("locationState").textContent =
        `${region}, ${state}`;

    $("topLocation").textContent =
        `${region}, ${state}`;

    $("sideUserLocation").textContent =
        `${region}, ${state}`;

    $("profileState").textContent = state;
    $("profileRegion").textContent = region;

    $("locationCoordinates").textContent =
        `GPS: ${Number(location.lat).toFixed(5)}, ${Number(location.lon).toFixed(5)}`;

}


function setLocationFallback(text) {

    $("locationState").textContent = text;
    $("topLocation").textContent = text;
    $("sideUserLocation").textContent = text;

    $("profileState").textContent = "Not detected";
    $("profileRegion").textContent = "Not detected";

    $("locationCoordinates").textContent =
        "Please allow location access and refresh.";
}


/* ================= WEATHER ================= */

async function getWeather(lat, lon) {

    try {

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
            `&hourly=precipitation_probability`;

        const response = await fetch(url);

        const data = await response.json();

        const current = data.current;

        const weatherCode = current.weather_code;

        const weather = {

            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            wind: current.wind_speed_10m,
            code: weatherCode

        };

        currentWeather = weather;

        save(STORAGE.weather, weather);

        updateWeatherUI(weather);

    } catch (error) {

        console.log("Weather error:", error);

        const saved = load(STORAGE.weather);

        if (saved) {
            currentWeather = saved;
            updateWeatherUI(saved);
        }

    }

}


function weatherText(code) {

    if (code === 0) return ["☀️", "Clear Sky"];
    if ([1,2,3].includes(code)) return ["⛅", "Partly Cloudy"];
    if ([45,48].includes(code)) return ["🌫️", "Foggy"];
    if ([51,53,55].includes(code)) return ["🌦️", "Light Drizzle"];
    if ([61,63,65].includes(code)) return ["🌧️", "Rain"];
    if ([71,73,75].includes(code)) return ["❄️", "Snow"];
    if ([80,81,82].includes(code)) return ["🌧️", "Rain Showers"];
    if ([95,96,99].includes(code)) return ["⛈️", "Thunderstorm"];

    return ["🌤️", "Variable"];
}


function updateWeatherUI(weather) {

    const [icon, condition] = weatherText(weather.code);

    $("weatherIcon").textContent = icon;
    $("temperature").textContent =
        `${Math.round(weather.temperature)}°C`;

    $("weatherCondition").textContent = condition;

    $("humidity").textContent =
        `${weather.humidity}%`;

    $("rainfall").textContent =
        `${Math.round(weather.precipitation)} mm`;

    $("wind").textContent =
        `${Math.round(weather.wind)} km/h`;

}


/* ================= FARM DETAILS ================= */

$("farmForm").addEventListener("submit", function(e) {

    e.preventDefault();

    const soilPH = Number($("soilPH").value);
    const soilColour = $("soilColour").value;
    const irrigation = $("irrigation").value;
    const waterSource = $("waterSource").value;
    const crop = $("crop").value;
    const yieldArea = Number($("yieldArea").value);
    const totalArea = Number($("totalArea").value);

    if (yieldArea > totalArea) {

        toast("Crop yield area cannot exceed total crop area.");

        return;
    }

    const farm = {

        soilPH,
        soilColour,
        irrigation,
        waterSource,
        crop,
        yieldArea,
        totalArea,

        location: currentLocation || load(STORAGE.location),

        weather: currentWeather || load(STORAGE.weather),

        updatedAt: new Date().toISOString()

    };

    save(STORAGE.farm, farm);

    updateDashboard(farm);

    runFarmAI(farm);

    renderSeeds();
    renderPesticideRecommendation();
    renderAnalytics();

    toast("Farm details saved. AI analysis generated.");

    navigateTo("dashboard");

});


function updateDashboard(farm) {

    $("dashCrop").textContent = farm.crop || "Not Added";

    $("dashArea").textContent =
        Number(farm.totalArea || 0).toFixed(1);

    $("dashPH").textContent =
        farm.soilPH || "--";

    $("dashIrrigation").textContent =
        farm.irrigation || "--";

    let phText = "Balanced";

    if (farm.soilPH < 5.5) {
        phText = "Acidic";
    } else if (farm.soilPH > 7.5) {
        phText = "Alkaline";
    }

    $("phStatus").textContent = phText;

}


/* ================= FARM AI ================= */

function runFarmAI(farm) {

    let risk = "Low";
    let riskClass = "low";

    const suggestions = [];

    const ph = Number(farm.soilPH);

    if (ph < 5.5) {

        risk = "Needs Attention";
        riskClass = "high";

        suggestions.push({
            icon: "🌍",
            title: "Soil pH attention",
            text: "Your entered soil pH is on the acidic side. Consider soil testing and locally recommended soil amendments."
        });

    } else if (ph > 7.5) {

        risk = "Moderate";
        riskClass = "medium";

        suggestions.push({
            icon: "🌍",
            title: "Alkaline soil indicator",
            text: "Your entered soil pH is alkaline. Soil testing can help identify nutrient availability issues."
        });

    } else {

        suggestions.push({
            icon: "🌱",
            title: "Soil pH looks suitable",
            text: "The entered pH is within a commonly workable range for many crops, but crop-specific requirements should be considered."
        });

    }


    if (farm.irrigation === "Rainfed") {

        suggestions.push({
            icon: "🌧️",
            title: "Rainfall monitoring",
            text: "Monitor rainfall and soil moisture closely because the selected irrigation method depends mainly on rainfall."
        });

    } else {

        suggestions.push({
            icon: "💧",
            title: "Irrigation management",
            text: `${farm.irrigation} can be managed according to crop stage, soil moisture and weather conditions.`
        });

    }


    const weather = farm.weather || currentWeather;

    if (weather) {

        if (weather.temperature >= 35) {

            risk = risk === "Low" ? "Moderate" : risk;
            riskClass = "medium";

            suggestions.push({
                icon: "🌡️",
                title: "Heat awareness",
                text: "Current temperature is relatively high. Monitor crop water stress and avoid unnecessary irrigation losses."
            });

        }

        if (weather.humidity >= 80) {

            suggestions.push({
                icon: "💧",
                title: "High humidity",
                text: "High humidity can increase conditions favorable to some crop diseases. Monitor leaves regularly."
            });

        }

        if (weather.precipitation > 5) {

            suggestions.push({
                icon: "🌧️",
                title: "Rainfall detected",
                text: "Recent precipitation is present. Reassess irrigation needs before applying additional water."
            });

        }

    }


    suggestions.push({
        icon: "📷",
        title: "Run crop image analysis",
        text: "Upload a clear crop image to combine visual symptoms with your field and weather context."
    });


    const status =
        risk === "Low"
            ? "LOW RISK"
            : risk === "Moderate"
                ? "MODERATE"
                : "NEEDS ATTENTION";


    const content = `
        <div class="ai-result-summary">
            <div class="result-box">
                <h4>🌱 Crop</h4>
                <p>${farm.crop}</p>
            </div>

            <div class="result-box">
                <h4>🌍 Soil</h4>
                <p>pH ${farm.soilPH} • ${farm.soilColour} soil</p>
            </div>

            <div class="result-box">
                <h4>💧 Water</h4>
                <p>${farm.irrigation} • ${farm.waterSource}</p>
            </div>

            <div class="result-box">
                <h4>📐 Area</h4>
                <p>${farm.yieldArea} acres crop yield area / ${farm.totalArea} acres total</p>
            </div>
        </div>

        <div class="confidence">
            <div class="confidence-head">
                <span>Farm Condition Indicator</span>
                <span>${status}</span>
            </div>

            <div class="confidence-bar">
                <div class="confidence-fill"
                     style="width:${risk === "Low" ? 82 : risk === "Moderate" ? 61 : 42}%">
                </div>
            </div>
        </div>
    `;

    $("farmRisk").textContent = status;

    $("aiOverviewContent").innerHTML = content;

    $("quickSuggestions").innerHTML =
        suggestions.slice(0, 4).map(item => `
            <div class="suggestion">
                <span>${item.icon}</span>
                <div>
                    <b>${item.title}</b>
                    <small>${item.text}</small>
                </div>
            </div>
        `).join("");

}


/* ================= SEEDS ================= */

const seedDatabase = {

    Rice: [
        ["🌱", "Pusa Basmati", "ICAR", 4.6, "Suitable for suitable rice-growing conditions.", "Good option where basmati-type cultivation is appropriate."]
    ],

    Wheat: [
        ["🌱", "HD 2967", "ICAR", 4.5, "Widely studied wheat variety.", "Consider local climate, sowing window and certified seed availability."]
    ],

    Maize: [
        ["🌽", "Hybrid Maize", "Kaveri", 4.4, "Hybrid option for maize cultivation.", "Select according to local recommendations and growing conditions."]
    ],

    Cotton: [
        ["🌿", "Bt Cotton Hybrid", "Mahyco", 4.3, "Cotton hybrid category.", "Use only legally approved and locally recommended seed."]
    ],

    Soybean: [
        ["🌱", "JS 335", "JS Agri", 4.4, "Common soybean variety category.", "Verify regional suitability and certified seed source."]
    ],

    Tomato: [
        ["🍅", "Arka Rakshak", "ICAR-IIHR", 4.7, "Tomato variety developed for disease resistance traits.", "Check local availability and crop-season suitability."]
    ],

    Potato: [
        ["🥔", "Kufri Jyoti", "ICAR-CPRI", 4.5, "Established potato variety.", "Confirm suitability for your region and season."]
    ],

    Onion: [
        ["🧅", "Bhima Super", "ICAR-DOGR", 4.6, "Onion variety from an Indian agricultural research program.", "Check regional recommendations before selection."]
    ],

    Sugarcane: [
        ["🌾", "Co 86032", "Agricultural Research", 4.4, "Sugarcane variety category.", "Regional suitability and disease-free planting material matter."]
    ],

    Groundnut: [
        ["🥜", "JL 24", "Agricultural Research", 4.4, "Groundnut variety category.", "Verify local recommendation and seed quality."]
    ],

    Chilli: [
        ["🌶️", "Arka Lohit", "ICAR-IIHR", 4.5, "Chilli variety category.", "Consider season, local disease pressure and certified seed availability."]
    ],

    Other: [
        ["🌱", "Certified Local Variety", "Local Agricultural Source", 4.2, "Choose a variety recommended for your crop and region.", "Local agricultural guidance should be used for final selection."]
    ]

};


function renderSeeds() {

    const farm = load(STORAGE.farm);

    const grid = $("seedGrid");

    if (!farm) {

        $("seedContext").textContent =
            "🌱 Add your crop details to personalize seed recommendations.";

        grid.innerHTML = `
            <div class="glass-card">
                <h3>Complete your farm details first.</h3>
                <p class="muted">
                    Your crop and location context will be used to organize
                    relevant seed options.
                </p>
            </div>
        `;

        return;
    }

    $("seedContext").innerHTML =
        `🌱 Recommendations shown for <b>${farm.crop}</b> • Region: <b>${farm.location?.region || "Detected location"}</b>`;

    const items = seedDatabase[farm.crop] || seedDatabase.Other;

    grid.innerHTML = items.map(seed => `

        <div class="product-card">

            <div class="product-top">
                <div class="product-icon">${seed[0]}</div>
                <span class="rating">★ ${seed[3]}</span>
            </div>

            <h3>${seed[1]}</h3>

            <span class="company">${seed[2]}</span>

            <p>${seed[4]}</p>

            <div class="reason">
                <b>Why consider it?</b><br>
                ${seed[5]}
            </div>

        </div>

    `).join("");

}


/* ================= PESTICIDES ================= */

const pesticideDatabase = {

    Rice: ["Crop-specific disease/pest management", "Monitor leaves and field conditions regularly."],
    Wheat: ["Crop-specific disease/pest management", "Inspect crop at regular intervals."],
    Maize: ["Crop-specific pest management", "Monitor for visible pest symptoms and field hotspots."],
    Cotton: ["Integrated cotton pest management", "Use scouting and approved crop-protection practices."],
    Soybean: ["Integrated soybean crop protection", "Monitor foliage and follow local advisory guidance."],
    Tomato: ["Integrated tomato disease management", "Inspect leaves and fruits and avoid unnecessary spraying."],
    Potato: ["Integrated potato disease management", "Monitor foliage and weather-related disease conditions."],
    Onion: ["Integrated onion crop protection", "Monitor leaf symptoms and field moisture."],
    Sugarcane: ["Integrated sugarcane crop management", "Use field scouting before treatment decisions."],
    Groundnut: ["Integrated groundnut crop protection", "Monitor foliage and soil moisture."],
    Chilli: ["Integrated chilli crop protection", "Scout leaves and fruit regularly."],
    Other: ["Integrated crop protection", "Identify the issue before selecting any pesticide."]
};


function renderPesticideRecommendation() {

    const farm = load(STORAGE.farm);

    if (!farm) {

        $("pesticideRecommendation").innerHTML =
            "Add your crop details to personalize this section.";

        return;
    }

    const rec =
        pesticideDatabase[farm.crop] ||
        pesticideDatabase.Other;

    $("pesticideRecommendation").innerHTML = `

        <div class="suggestion">
            <span>🧪</span>
            <div>
                <b>${rec[0]}</b>
                <small>${rec[1]}</small>
            </div>
        </div>

        <div class="reason" style="margin-top:15px;">
            <b>Context</b><br>
            Crop: ${farm.crop}<br>
            Irrigation: ${farm.irrigation}<br>
            Water source: ${farm.waterSource}<br>
            Soil pH: ${farm.soilPH}
        </div>
    `;

}


function savePesticideUsage() {

    const name = $("usedPesticide").value.trim();

    const quantity =
        Number($("pesticideQuantity").value);

    const unit =
        $("pesticideUnit").value;

    if (!name || !quantity) {

        toast("Enter pesticide name and quantity.");

        return;
    }

    const costs = load(STORAGE.costs, {
        seed: 0,
        pesticide: 0,
        irrigation: 0
    });

    costs.pesticide += quantity * 10;

    save(STORAGE.costs, costs);

    $("pesticideSaved").classList.remove("hidden");

    toast(
        `${name} usage saved: ${quantity} ${unit}`
    );

    renderAnalytics();

}


/* ================= IMAGE INPUT ================= */

$("cameraInput").addEventListener("change", handleImage);

$("galleryInput").addEventListener("change", handleImage);


function handleImage(e) {

    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        toast("Please select an image file.");

        return;
    }

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = function(event) {

        $("cropPreview").src = event.target.result;

        $("imageFileName").textContent =
            `${file.name} • ${(file.size / 1024).toFixed(0)} KB`;

        $("imagePreviewArea").classList.remove("hidden");

        $("analysisResult").classList.add("hidden");

    };

    reader.readAsDataURL(file);

}


function clearCropImage() {

    selectedImage = null;

    $("cameraInput").value = "";
    $("galleryInput").value = "";

    $("imagePreviewArea").classList.add("hidden");
    $("analysisResult").classList.add("hidden");

}


/* ================= IMAGE QUALITY ================= */

function checkImageQuality(file) {

    return new Promise(resolve => {

        const img = new Image();

        img.onload = function() {

            const width = img.naturalWidth;
            const height = img.naturalHeight;

            if (width < 500 || height < 500) {

                resolve({
                    poor: true,
                    reason: "The image resolution is too low for reliable visual assessment."
                });

                return;
            }

            const canvas = document.createElement("canvas");

            canvas.width = 100;
            canvas.height = 100;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0, 100, 100);

            const pixels =
                ctx.getImageData(0, 0, 100, 100).data;

            let brightness = 0;

            for (let i = 0; i < pixels.length; i += 4) {

                brightness +=
                    (pixels[i] +
                    pixels[i + 1] +
                    pixels[i + 2]) / 3;

            }

            brightness /= (pixels.length / 4);

            if (brightness < 35) {

                resolve({
                    poor: true,
                    reason: "The image appears too dark. Try taking the photo in better lighting."
                });

                return;
            }

            resolve({
                poor: false,
                reason: "Image quality appears sufficient for prototype analysis."
            });

        };

        img.onerror = function() {

            resolve({
                poor: true,
                reason: "The selected image could not be processed."
            });

        };

        img.src = URL.createObjectURL(file);

    });

}


/* ================= CROP ANALYSIS ================= */

async function analyzeCrop() {

    if (!selectedImage) {

        toast("Please select a crop image first.");

        return;
    }

    const farm = load(STORAGE.farm);

    if (!farm) {

        toast("Please complete Farm Details first.");

        navigateTo("details");

        return;
    }

    $("analysisLoading").classList.remove("hidden");
    $("analysisResult").classList.add("hidden");

    const quality =
        await checkImageQuality(selectedImage);

    setTimeout(() => {

        $("analysisLoading").classList.add("hidden");

        if (quality.poor) {

            showPoorImageResult(quality.reason);

            return;
        }

        generateCropAnalysis(farm);

    }, 1600);

}


function showPoorImageResult(reason) {

    $("analysisResult").innerHTML = `

        <div class="result-header">

            <div>
                <p class="eyebrow">IMAGE QUALITY CHECK</p>
                <h2>⚠️ Image Needs Improvement</h2>
            </div>

            <span class="result-badge">
                LOW QUALITY
            </span>

        </div>

        <div class="result-box">

            <h4>Why?</h4>

            <p>${reason}</p>

        </div>

        <div class="expert-box">

            📷 <b>Recommended action:</b>
            Capture another clear image in natural daylight.
            Keep the affected leaf/plant area visible and in focus.

        </div>

        <div class="disclaimer">

            This image-quality assessment is only a prototype-level
            quality check and does not diagnose crop disease.

        </div>
    `;

    $("analysisResult").classList.remove("hidden");

}


function generateCropAnalysis(farm) {

    const weather =
        farm.weather || currentWeather || {};

    const ph = Number(farm.soilPH);

    let assessment;
    let confidence;
    let reason;
    let suggestions = [];
    let expert = false;

    /*
        Prototype decision logic:
        Uses field context + weather + crop.
        It intentionally supports ambiguous cases instead of
        always declaring a disease.
    */

    if (
        weather.temperature >= 35 &&
        farm.irrigation === "Rainfed"
    ) {

        assessment = "Possible Water Stress";
        confidence = 76;

        reason =
            "The crop context indicates relatively high temperature combined with rain-dependent irrigation. These conditions can be consistent with water stress, but visual symptoms alone are not sufficient for a definitive diagnosis.";

        suggestions = [
            "Check soil moisture around the active root zone.",
            "Review irrigation needs according to crop stage and local guidance.",
            "Capture another image if symptoms become more visible."
        ];

        expert = confidence < 80;

    } else if (
        weather.humidity >= 80
    ) {

        assessment = "Possible Environmental / Disease Stress";
        confidence = 68;

        reason =
            "High humidity can create conditions favorable to some crop diseases. The prototype cannot reliably identify a specific disease from context alone.";

        suggestions = [
            "Inspect leaves and stems for expanding spots or unusual growth.",
            "Monitor the crop after humid or wet periods.",
            "Seek expert confirmation before applying treatment."
        ];

        expert = true;

    } else if (
        ph < 5.5 ||
        ph > 8
    ) {

        assessment = "Possible Nutrient Availability Stress";
        confidence = 64;

        reason =
            "The entered soil pH is outside a commonly workable range for many crops. Nutrient availability can be affected by soil pH, but a soil test is needed to identify the actual nutrient issue.";

        suggestions = [
            "Consider a soil test for nutrient availability.",
            "Do not apply fertilizer only from this AI assessment.",
            "Use crop-specific soil recommendations from an agricultural expert."
        ];

        expert = true;

    } else {

        assessment = "No Clear Stress Pattern Detected";
        confidence = 71;

        reason =
            "The entered field and weather context does not strongly indicate one of the major stress patterns supported by this prototype. A visual image alone cannot confirm that the crop is completely healthy.";

        suggestions = [
            "Continue regular crop scouting.",
            "Monitor changes in leaves, stems and fruit.",
            "Re-analyze if visible symptoms develop."
        ];

        expert = false;

    }


    if (
        confidence < 70 ||
        assessment.includes("Possible")
    ) {
        expert = true;
    }


    const weatherDescription =
        weather.temperature !== undefined
            ? `${Math.round(weather.temperature)}°C, ${weather.humidity}% humidity`
            : "Weather unavailable";


    const result = {

        date: new Date().toISOString(),

        crop: farm.crop,

        assessment,

        confidence,

        reason,

        suggestions,

        expert,

        weather: weatherDescription,

        location:
            farm.location?.region || "Location unavailable"

    };


    saveAnalysisToHistory(result);

    $("analysisResult").innerHTML = `

        <div class="result-header">

            <div>

                <p class="eyebrow">
                    AI CROP ASSESSMENT
                </p>

                <h2>${assessment}</h2>

            </div>

            <span class="result-badge">
                ${confidence}% CONFIDENCE
            </span>

        </div>


        <div class="confidence">

            <div class="confidence-head">

                <span>Confidence Score</span>

                <span>${confidence}%</span>

            </div>

            <div class="confidence-bar">

                <div
                    class="confidence-fill"
                    style="width:${confidence}%"
                ></div>

            </div>

        </div>


        <div class="result-grid">

            <div class="result-box">

                <h4>🌱 Assessment</h4>

                <p>
                    ${assessment}
                </p>

            </div>


            <div class="result-box">

                <h4>🌦️ Weather Context</h4>

                <p>
                    ${weatherDescription}
                </p>

            </div>


            <div class="result-box">

                <h4>🧠 Reason</h4>

                <p>
                    ${reason}
                </p>

            </div>


            <div class="result-box">

                <h4>🌍 Field Context</h4>

                <p>
                    Soil pH: ${farm.soilPH}<br>
                    Soil colour: ${farm.soilColour}<br>
                    Irrigation: ${farm.irrigation}<br>
                    Water source: ${farm.waterSource}
                </p>

            </div>

        </div>


        <div class="glass-card" style="margin-top:17px; padding:18px;">

            <h3 style="margin-bottom:12px;">
                💡 AI Suggestions
            </h3>

            ${suggestions.map(s => `
                <div class="suggestion" style="margin-bottom:8px;">
                    <span>✓</span>
                    <div>
                        <small>${s}</small>
                    </div>
                </div>
            `).join("")}

        </div>


        ${
            expert
                ? `
                    <div class="expert-box">

                        👨‍🌾 <b>Expert Review Recommended</b><br>

                        This assessment has uncertainty or
                        context that should be checked by a
                        qualified agricultural expert before
                        taking treatment decisions.

                    </div>
                  `
                : ""
        }


        <div class="disclaimer">

            ⚠️ <b>Disclaimer:</b>
            This is a prototype AI-style assessment for
            informational purposes. It does not provide a
            confirmed disease diagnosis and should not replace
            professional agricultural advice. Follow approved
            agricultural guidance and product labels for any
            crop-treatment decision.

        </div>

    `;

    $("analysisResult").classList.remove("hidden");

    renderAnalytics();

    toast("Crop analysis completed.");

}


/* ================= HISTORY ================= */

function saveAnalysisToHistory(result) {

    const history =
        load(STORAGE.history, []);

    history.unshift(result);

    if (history.length > 20) {
        history.pop();
    }

    save(STORAGE.history, history);

}


function loadHistory() {

    const history =
        load(STORAGE.history, []);

    const container = $("historyList");

    if (!history.length) {

        container.innerHTML = `

            <div class="glass-card empty-state">

                <div>📜</div>

                <h3>No analysis history yet</h3>

                <p>
                    Your crop assessments will appear here after
                    you analyze a crop image.
                </p>

                <button
                    class="primary-btn"
                    onclick="navigateTo('analysis')"
                >
                    Analyze Crop
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML = history.map(item => {

        const date =
            new Date(item.date).toLocaleString();

        return `

            <div class="history-item">

                <div class="history-icon">
                    🌱
                </div>

                <div class="history-main">

                    <b>
                        ${item.crop} — ${item.assessment}
                    </b>

                    <small>
                        ${date} • ${item.location}
                    </small>

                </div>

                <div class="history-confidence">
                    ${item.confidence}% confidence
                </div>

            </div>

        `;

    }).join("");

}


/* ================= ANALYTICS ================= */

function renderAnalytics() {

    const farm = load(STORAGE.farm);

    const history =
        load(STORAGE.history, []);

    const costs =
        load(STORAGE.costs, {
            seed: 0,
            pesticide: 0,
            irrigation: 0
        });


    const area =
        farm ? Number(farm.totalArea || 0) : 0;


    $("analyticsArea").textContent =
        `${area.toFixed(1)} acres`;

    $("analyticsAnalyses").textContent =
        history.length;

    $("analyticsAlerts").textContent =
        Math.max(3, history.filter(h => h.expert).length);


    const totalCost =
        costs.seed +
        costs.pesticide +
        costs.irrigation;


    $("analyticsCost").textContent =
        `₹${Math.round(totalCost)}`;

    $("seedCost").textContent =
        Math.round(costs.seed);

    $("pestCost").textContent =
        Math.round(costs.pesticide);

    $("irrigationCost").textContent =
        Math.round(costs.irrigation);

    $("totalCost").textContent =
        Math.round(totalCost);


    renderPie(farm);

}


function renderPie(farm) {

    const pie = $("cropPie");
    const legend = $("pieLegend");

    if (!farm) {

        pie.style.background =
            "conic-gradient(#dfe9e2 0deg 360deg)";

        legend.innerHTML = `
            <div class="legend-item">
                No crop-area history yet
            </div>
        `;

        return;
    }


    const currentCrop = farm.crop;
    const currentArea = Number(farm.totalArea || 0);

    const history =
        load(STORAGE.history, []);

    const cropAreas = {};

    cropAreas[currentCrop] = currentArea;

    history.forEach(item => {

        if (!cropAreas[item.crop]) {
            cropAreas[item.crop] = 0;
        }

        cropAreas[item.crop] += 0.25;

    });


    const entries =
        Object.entries(cropAreas);

    const total =
        entries.reduce(
            (sum, item) => sum + item[1],
            0
        );


    const degrees = entries.map(item =>
        (item[1] / total) * 360
    );


    const colors = [
        "#1f8f55",
        "#8ed35f",
        "#e6b75b",
        "#8b9fe8",
        "#d47c7c"
    ];


    let current = 0;

    const gradients = [];

    entries.forEach((entry, index) => {

        const next =
            current + degrees[index];

        gradients.push(
            `${colors[index % colors.length]} ${current}deg ${next}deg`
        );

        current = next;

    });


    pie.style.background =
        `conic-gradient(${gradients.join(",")})`;


    legend.innerHTML =
        entries.map((entry, index) => {

            const percent =
                Math.round((entry[1] / total) * 100);

            return `
                <div class="legend-item">

                    <span
                        class="legend-dot"
                        style="
                            background:
                            ${colors[index % colors.length]}
                        "
                    ></span>

                    <span>
                        ${entry[0]} — ${percent}%
                    </span>

                </div>
            `;

        }).join("");

}


/* ================= INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", function() {

    const savedLanguage =
        load(STORAGE.language, "en");

    $("landingLanguage").value =
        savedLanguage;

    $("appLanguage").value =
        savedLanguage;


    const user =
        load(STORAGE.user);

    if (user) {

        /*
            User is remembered locally.
            Show login screen instead of automatically
            entering dashboard.
        */

        $("farmerName").value =
            user.name || "";

        $("phoneNumber").value =
            user.phone || "";

    }

    const location =
        load(STORAGE.location);

    if (location) {

        currentLocation = location;

        updateLocationUI(location);

    }


    const weather =
        load(STORAGE.weather);

    if (weather) {

        currentWeather = weather;

        updateWeatherUI(weather);

    }

    renderSeeds();

    renderAnalytics();

});