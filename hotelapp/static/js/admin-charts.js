/* Admin Reports Charts (A03 Monthly Revenue & A04 Occupancy Density) — Tokenized Chart.js */
(function (global) {
  "use strict";

  function drawValentiaBarChart(canvasId, labels, values, datasetLabel, horizontal) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || typeof global.Chart !== "function") {
      return;
    }
    if (!Array.isArray(labels) || !labels.length || !Array.isArray(values) || !values.length) {
      return;
    }

    var styles = global.getComputedStyle(document.documentElement);
    var barColor = (styles.getPropertyValue("--gl-gold-ink") || "#8A6A1F").trim();
    var ruleColor = (styles.getPropertyValue("--gl-rule") || "#DAD5C8").trim();
    var mutedColor = (styles.getPropertyValue("--gl-muted") || "#5B6578").trim();
    var paperColor = (styles.getPropertyValue("--gl-paper") || "#FAF8F3").trim();
    var inkColor = (styles.getPropertyValue("--gl-ink") || "#1B2433").trim();

    new global.Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: datasetLabel,
            data: values,
            backgroundColor: barColor,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: horizontal ? "y" : "x",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 150 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: paperColor,
            titleColor: inkColor,
            bodyColor: inkColor,
            borderColor: ruleColor,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            beginAtZero: horizontal,
            grid: { color: horizontal ? ruleColor : "transparent" },
            ticks: { color: mutedColor }
          },
          y: {
            beginAtZero: !horizontal,
            grid: { color: horizontal ? "transparent" : ruleColor },
            ticks: { color: mutedColor }
          }
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-gl-chart-canvas]").forEach(function (canvas) {
      var labelsRaw = canvas.getAttribute("data-gl-labels") || "[]";
      var valuesRaw = canvas.getAttribute("data-gl-values") || "[]";
      var labelText = canvas.getAttribute("data-gl-dataset-label") || "";
      var horizontal = canvas.getAttribute("data-gl-axis") === "y";
      try {
        var labels = JSON.parse(labelsRaw);
        var values = JSON.parse(valuesRaw);
        drawValentiaBarChart(canvas.id, labels, values, labelText, horizontal);
      } catch (err) {
        /* Invalid chart payload ignored safely */
      }
    });
  });
})(window);
