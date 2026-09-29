"use strict";

// Same keys as main.js so both pages share data
const STORAGE = { user: "agricare_user", language: "agricare_language" };  

const $ = id => document.getElementById(id);

function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3000);
}

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

$("loginForm").addEventListener("submit", e => {
    e.preventDefault();

    const name = $("farmerName").value.trim();
    const phone = $("phoneNumber").value.trim();

    if (!name) return toast("Please enter your name.");
    if (!/^[0-9]{10}$/.test(phone)) return toast("Please enter a valid 10-digit phone number.");

    localStorage.setItem(STORAGE.user, JSON.stringify({
        name,
        phone,
        loginDate: new Date().toISOString()
    }));

    window.location.href = "dashboard.html";
});

$("landingLanguage").addEventListener("change", e => {
    localStorage.setItem(STORAGE.language, JSON.stringify(e.target.value));
});

document.addEventListener("DOMContentLoaded", () => {
    try {
        const lang = JSON.parse(localStorage.getItem(STORAGE.language)) || "en";
        $("landingLanguage").value = lang;

        const user = JSON.parse(localStorage.getItem(STORAGE.user));
        if (user) {
            $("farmerName").value = user.name || "";
            $("phoneNumber").value = user.phone || "";
        }
    } catch { /* ignore corrupt storage */ }
});
