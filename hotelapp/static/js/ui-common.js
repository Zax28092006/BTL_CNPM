/* Shared UI Helpers — Valentia Hotel & Suites (Vanilla JS, addEventListener only) */
(function (global) {
  "use strict";

  function showToast(message) {
    var region = document.getElementById("glToastRegion");
    if (!region || !message) {
      return;
    }
    var toast = document.createElement("div");
    toast.className = "gl-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  function initFlashToasts() {
    document.querySelectorAll("[data-gl-flash-toast]").forEach(function (el) {
      var msg = (el.getAttribute("data-gl-flash-toast") || "").trim();
      if (msg) {
        showToast(msg);
      }
    });
  }

  function initPasswordToggles() {
    var toggles = document.querySelectorAll("[data-gl-toggle-password]");
    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-gl-toggle-password");
        var input = targetId ? document.getElementById(targetId) : null;
        if (!input) {
          return;
        }
        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        btn.setAttribute("aria-pressed", isHidden ? "true" : "false");
        btn.textContent = isHidden ? "Ẩn" : "Hiện";
      });
    });
  }

  function refreshTableScrollHints() {
    var regions = document.querySelectorAll("[data-gl-table-scroll]");
    regions.forEach(function (region) {
      var hintId = region.getAttribute("data-gl-scroll-hint");
      var hintEl = hintId ? document.getElementById(hintId) : null;
      if (!hintEl) {
        return;
      }
      var hasOverflow = region.scrollWidth > region.clientWidth + 2;
      hintEl.hidden = !hasOverflow;
    });
  }

  function initPrintTriggers() {
    var buttons = document.querySelectorAll("[data-gl-print-trigger]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.print();
      });
    });
  }

  function initTabs() {
    var tabLists = document.querySelectorAll("[data-gl-tablist]");
    tabLists.forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var targetId = tab.getAttribute("aria-controls");
          tabs.forEach(function (item) {
            var selected = item === tab;
            item.classList.toggle("is-active", selected);
            item.setAttribute("aria-selected", selected ? "true" : "false");
            var panelId = item.getAttribute("aria-controls");
            var panel = panelId ? document.getElementById(panelId) : null;
            if (panel) {
              panel.hidden = !selected;
            }
          });
          if (targetId && document.getElementById(targetId)) {
            refreshTableScrollHints();
          }
        });
      });
    });
  }

  function setFieldError(inputEl, errorEl, message) {
    if (!inputEl || !errorEl) {
      return;
    }
    if (message) {
      inputEl.classList.add("is-invalid");
      inputEl.setAttribute("aria-invalid", "true");
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      inputEl.classList.remove("is-invalid");
      inputEl.removeAttribute("aria-invalid");
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  function renderErrorSummary(summaryBox, titleEl, listEl, errors) {
    if (!summaryBox || !titleEl || !listEl) {
      return;
    }
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }
    if (!errors || errors.length === 0) {
      summaryBox.hidden = true;
      return;
    }
    titleEl.textContent = "Có " + errors.length + " mục cần kiểm tra";
    errors.forEach(function (err) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + err.id;
      link.textContent = err.message;
      link.addEventListener("click", function (ev) {
        ev.preventDefault();
        var target = document.getElementById(err.id);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      li.appendChild(link);
      listEl.appendChild(li);
    });
    summaryBox.hidden = false;
    summaryBox.focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPasswordToggles();
    initPrintTriggers();
    initTabs();
    initFlashToasts();
    refreshTableScrollHints();
  });

  window.addEventListener("resize", refreshTableScrollHints);

  global.ValentiaUi = {
    showToast: showToast,
    refreshTableScrollHints: refreshTableScrollHints,
    setFieldError: setFieldError,
    renderErrorSummary: renderErrorSummary
  };

  function toFiniteNum(val) {
    if (val === null || val === undefined || val === "") {
      return null;
    }
    var n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function formatVnd(amount) {
    var n = Number(amount);
    if (!Number.isFinite(n) || n < 0) {
      return "";
    }
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  }

  function extractPricing(item) {
    if (!item || typeof item !== "object" || item.is_reference) {
      return { hasPrice: false, hasActivePromo: false, rawStatus: "" };
    }
    var promo = (item.promotion && typeof item.promotion === "object") ? item.promotion : {};
    var orig = toFiniteNum(
      item.original_price !== undefined ? item.original_price
        : (item.list_price !== undefined ? item.list_price
          : (item.base_price !== undefined ? item.base_price : item.price))
    );
    if (!orig) {
      return { hasPrice: false, hasActivePromo: false, rawStatus: "" };
    }
    var finalP = toFiniteNum(
      item.final_price !== undefined ? item.final_price
        : (item.discounted_price !== undefined ? item.discounted_price : promo.final_price)
    );
    var pct = toFiniteNum(
      item.discount_percent !== undefined ? item.discount_percent : promo.discount_percent
    );
    var status = String(item.promotion_status || promo.status || "").toLowerCase().trim();
    var validFinal = Boolean(finalP && finalP < orig);
    var validPct = Boolean(pct && pct <= 100);
    var statusOk = status === "active" || (status === "" && validFinal && validPct);
    var savings = toFiniteNum(item.savings_amount !== undefined ? item.savings_amount : promo.savings_amount);

    if (statusOk && validFinal && validPct) {
      return {
        hasPrice: true,
        hasActivePromo: true,
        originalPrice: orig,
        finalPrice: finalP,
        discountPercent: pct,
        rawStatus: status || "active",
        promoName: String(item.promotion_name || promo.name || "").trim(),
        promoCondition: String(item.promotion_condition || promo.condition || promo.description || "").trim(),
        savingsAmount: savings
      };
    }

    return {
      hasPrice: true,
      hasActivePromo: false,
      originalPrice: orig,
      finalPrice: orig,
      discountPercent: 0,
      rawStatus: status,
      promoName: String(item.promotion_name || promo.name || "").trim(),
      promoCondition: "",
      savingsAmount: null
    };
  }

  function createPriceBlockElement(item, opts) {
    var options = opts || {};
    var variant = options.variant || "card";
    var showSavings = Boolean(options.showSavings);
    var showPromoLabel = options.showPromoLabel !== false;
    var showCondition = Boolean(options.showCondition);
    var missingText = options.missingText || "Liên hệ lễ tân để biết đơn giá theo ngày.";
    var p = extractPricing(item);

    var root = document.createElement("div");
    root.className = "gl-price-block gl-price-block--" + variant;

    if (!p.hasPrice) {
      var missEl = document.createElement("p");
      missEl.className = "gl-price-missing mb-0";
      missEl.textContent = missingText;
      root.appendChild(missEl);
      return root;
    }

    if (p.hasActivePromo) {
      if (showPromoLabel) {
        var lbl = document.createElement("span");
        lbl.className = "gl-promo-label";
        lbl.textContent = p.promoName || "Ưu đãi đặc biệt";
        root.appendChild(lbl);
      }

      var row = document.createElement("div");
      row.className = "gl-price-row";

      var mainGrp = document.createElement("div");
      mainGrp.className = "gl-price-main-group";
      var curEl = document.createElement("strong");
      curEl.className = "gl-price-current gl-price-current--promo price-value";
      curEl.textContent = formatVnd(p.finalPrice);
      var unitEl = document.createElement("span");
      unitEl.className = "gl-price-unit";
      unitEl.textContent = "/ đêm";
      mainGrp.appendChild(curEl);
      mainGrp.appendChild(unitEl);

      var cmpGrp = document.createElement("div");
      cmpGrp.className = "gl-price-compare-group";
      var oldEl = document.createElement("del");
      oldEl.className = "gl-price-original price-value";
      oldEl.setAttribute("aria-label", "Giá gốc");
      oldEl.textContent = formatVnd(p.originalPrice);
      var badge = document.createElement("span");
      badge.className = "gl-promo-badge gl-tabular";
      badge.textContent = "-" + Math.round(p.discountPercent) + "%";
      cmpGrp.appendChild(oldEl);
      cmpGrp.appendChild(badge);

      row.appendChild(mainGrp);
      row.appendChild(cmpGrp);
      root.appendChild(row);

      if (showSavings && p.savingsAmount) {
        var sav = document.createElement("p");
        sav.className = "gl-price-savings gl-tabular mb-0";
        sav.textContent = "Tiết kiệm " + formatVnd(p.savingsAmount);
        root.appendChild(sav);
      }
      if (showCondition && p.promoCondition) {
        var cond = document.createElement("p");
        cond.className = "gl-promo-condition mb-0";
        cond.textContent = p.promoCondition;
        root.appendChild(cond);
      }
      return root;
    }

    var regRow = document.createElement("div");
    regRow.className = "gl-price-row";
    var regGrp = document.createElement("div");
    regGrp.className = "gl-price-main-group";
    var regCur = document.createElement("strong");
    regCur.className = "gl-price-current price-value";
    regCur.textContent = formatVnd(p.originalPrice);
    var regUnit = document.createElement("span");
    regUnit.className = "gl-price-unit";
    regUnit.textContent = "/ đêm";
    regGrp.appendChild(regCur);
    regGrp.appendChild(regUnit);
    regRow.appendChild(regGrp);
    root.appendChild(regRow);

    if (options.showStatusNote && (p.rawStatus === "expired" || p.rawStatus === "ended")) {
      var expEl = document.createElement("p");
      expEl.className = "gl-price-meta mb-0";
      expEl.textContent = "Ưu đãi trước đó đã hết hạn — áp dụng giá niêm yết.";
      root.appendChild(expEl);
    } else if (options.showStatusNote && (p.rawStatus === "upcoming" || p.rawStatus === "not_started" || p.rawStatus === "scheduled")) {
      var upEl = document.createElement("p");
      upEl.className = "gl-price-meta mb-0";
      upEl.textContent = "Ưu đãi chưa đến thời gian áp dụng.";
      root.appendChild(upEl);
    }

    return root;
  }

  global.ValentiaPrice = {
    formatVnd: formatVnd,
    extractPricing: extractPricing,
    createPriceBlockElement: createPriceBlockElement
  };
})(window);
