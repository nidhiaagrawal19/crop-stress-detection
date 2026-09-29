# Finishing the frontend split

Already written: `index.html`, `js/auth.js`, `js/charts.js`.
The rest is copy plus a few edits.

## 1. css/styles.css
Copy your existing `style.css` unchanged.

## 2. dashboard.html
Create it with this skeleton, then paste in the markup from your old `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgriCare — Dashboard</title>
<link rel="stylesheet" href="css/styles.css">
</head>
<body>

<section id="appPage" class="app-page">
  <!-- paste <aside class="sidebar"> ... </aside> and <main class="main-content"> ... </main> from the old index.html -->
</section>

<div id="toast" class="toast"></div>
<script src="js/main.js"></script>
<script src="js/charts.js"></script>
</body>
</html>
```

Note that `appPage` no longer has `hidden-page`.

## 3. js/main.js
Start from your old `script.js` and make these edits.

**Delete:**
- `showLogin()`, `showLanding()` and the `loginForm` submit listener
- `renderAnalytics()` and `renderPie()` (now in `charts.js`)
- the two `landingLanguage` lines: `$("landingLanguage").value = lang;` in `setLanguage`, and the `$("landingLanguage").addEventListener(...)` block

**Replace `openApp()` with:**

```js
function openApp() {
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
```

**Replace `logout()` with:**

```js
function logout() {
    window.location.href = "index.html";
}
```

**Replace the `DOMContentLoaded` block at the bottom with:**

```js
document.addEventListener("DOMContentLoaded", () => {
    // Not logged in? Back to the login page.
    if (!load(STORAGE.user)) {
        window.location.href = "index.html";
        return;
    }

    const lang = load(STORAGE.language, "en");
    $("appLanguage").value = lang;
    setLanguage(lang, true);   // needs the `silent` patch from agricare-fixes.md

    const location = load(STORAGE.location);
    if (location) { currentLocation = location; updateLocationUI(location); }

    const weather = load(STORAGE.weather);
    if (weather) { currentWeather = weather; updateWeatherUI(weather); }

    openApp();
});
```

## 4. Folder layout

```text
frontend/
├── index.html
├── dashboard.html
├── css/styles.css
├── js/auth.js
├── js/main.js
├── js/charts.js
└── assets/
```

Open `index.html` first. Login redirects to `dashboard.html`.

`auth.js` and `main.js` each define their own `STORAGE` and `$`, which is fine because they load on different pages. If you later load both on one page, remove the duplicates.
