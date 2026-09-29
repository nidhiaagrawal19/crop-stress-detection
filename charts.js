"use strict";

/* Analytics + pie chart. Load AFTER main.js (uses $, load, STORAGE). */

function renderAnalytics() {
    const farm = load(STORAGE.farm);
    const history = load(STORAGE.history, []);
    const costs = load(STORAGE.costs, { seed: 0, pesticide: 0, irrigation: 0 });

    const area = farm ? Number(farm.totalArea || 0) : 0;
    const totalCost = costs.seed + costs.pesticide + costs.irrigation;

    $("analyticsArea").textContent = `${area.toFixed(1)} acres`;
    $("analyticsAnalyses").textContent = history.length;
    $("analyticsAlerts").textContent = Math.max(3, history.filter(h => h.expert).length);
    $("analyticsCost").textContent = `₹${Math.round(totalCost)}`;

    $("seedCost").textContent = Math.round(costs.seed);
    $("pestCost").textContent = Math.round(costs.pesticide);
    $("irrigationCost").textContent = Math.round(costs.irrigation);
    $("totalCost").textContent = Math.round(totalCost);

    renderPie(farm);
}

function renderPie(farm) {
    const pie = $("cropPie");
    const legend = $("pieLegend");

    if (!farm) {
        pie.style.background = "conic-gradient(#dfe9e2 0deg 360deg)";
        legend.innerHTML = `<div class="legend-item">No crop-area history yet</div>`;
        return;
    }

    const history = load(STORAGE.history, []);
    const cropAreas = { [farm.crop]: Number(farm.totalArea || 0) };

    history.forEach(item => {
        cropAreas[item.crop] = (cropAreas[item.crop] || 0) + 0.25;
    });

    const entries = Object.entries(cropAreas);
    const total = entries.reduce((sum, e) => sum + e[1], 0) || 1;
    const colors = ["#1f8f55", "#8ed35f", "#e6b75b", "#8b9fe8", "#d47c7c"];

    let current = 0;
    const stops = entries.map((e, i) => {
        const next = current + (e[1] / total) * 360;
        const stop = `${colors[i % colors.length]} ${current}deg ${next}deg`;
        current = next;
        return stop;
    });

    pie.style.background = `conic-gradient(${stops.join(",")})`;

    legend.innerHTML = entries.map((e, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${colors[i % colors.length]}"></span>
            <span>${e[0]} — ${Math.round((e[1] / total) * 100)}%</span>
        </div>`).join("");
}
