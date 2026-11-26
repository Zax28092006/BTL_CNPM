/* Public Room Search (P02) — Flatpickr (d/m/Y), 28-Day & Guest Validation, Real GET Submit */
(function () {
  "use strict";

  var dateUtils = window.ValentiaDateUtils;

  function addDaysIso(isoDate, days) {
    var parts = dateUtils.parseIsoDateParts(isoDate);
    if (!parts) {
      return "";
    }
    var utcMs = Date.UTC(parts.year, parts.month - 1, parts.day + days);
    var d = new Date(utcMs);
    var y = d.getUTCFullYear();
    var m = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function getVisibleDateControl(baseInput) {
    if (baseInput && baseInput._flatpickr && baseInput._flatpickr.altInput) {
      return baseInput._flatpickr.altInput;
    }
    return baseInput;
  }

  function readIsoValue(inputEl) {
    if (!inputEl) {
      return "";
    }
    if (inputEl._flatpickr) {
      return inputEl.value.trim();
    }
    var isoAttr = inputEl.getAttribute("data-iso-value");
    if (isoAttr !== null) {
      return isoAttr;
    }
    return dateUtils.parseDisplayDateViToIso(inputEl.value) || inputEl.value.trim();
  }

  function setFieldError(inputEl, errorEl, helpEl, message) {
    var visibleEl = getVisibleDateControl(inputEl);
    if (!inputEl || !errorEl) {
      return;
    }
    if (message) {
      inputEl.classList.add("is-invalid");
      inputEl.setAttribute("aria-invalid", "true");
      if (visibleEl && visibleEl !== inputEl) {
        visibleEl.classList.add("is-invalid");
        visibleEl.setAttribute("aria-invalid", "true");
      }
      errorEl.textContent = message;
      errorEl.hidden = false;
      if (helpEl) {
        helpEl.hidden = true;
      }
    } else {
      inputEl.classList.remove("is-invalid");
      inputEl.removeAttribute("aria-invalid");
      if (visibleEl && visibleEl !== inputEl) {
        visibleEl.classList.remove("is-invalid");
        visibleEl.removeAttribute("aria-invalid");
      }
      errorEl.textContent = "";
      errorEl.hidden = true;
      if (helpEl) {
        helpEl.hidden = false;
      }
    }
  }

  function validateCheckInField(checkInInput, bookingDate, maxCheckInDate) {
    var errorEl = document.getElementById("searchCheckInError");
    var helpEl = document.getElementById("searchCheckInHelp");
    var val = readIsoValue(checkInInput);
    var message = "";

    if (!val || !dateUtils.parseIsoDateParts(val)) {
      message = "Vui lòng chọn ngày nhận phòng hợp lệ (dd/mm/yyyy).";
    } else if (bookingDate && val < bookingDate) {
      message = "Ngày nhận phòng không thể ở quá khứ.";
    } else if (maxCheckInDate && val > maxCheckInDate) {
      message = "Ngày nhận phòng không quá 28 ngày (tối đa " + dateUtils.formatDateVi(maxCheckInDate) + ").";
    }

    setFieldError(checkInInput, errorEl, helpEl, message);
    return { valid: message === "", message: message, value: val };
  }

  function validateCheckOutField(checkInInput, checkOutInput, bookingDate) {
    var errorEl = document.getElementById("searchCheckOutError");
    var helpEl = document.getElementById("searchCheckOutHelp");
    var ciVal = readIsoValue(checkInInput);
    var coVal = readIsoValue(checkOutInput);
    var message = "";

    if (!coVal || !dateUtils.parseIsoDateParts(coVal)) {
      message = "Vui lòng chọn ngày trả phòng hợp lệ (dd/mm/yyyy).";
    } else if (dateUtils.parseIsoDateParts(ciVal) && coVal <= ciVal) {
      message = "Ngày trả phòng phải sau ngày nhận phòng.";
    } else if (bookingDate && coVal <= bookingDate) {
      message = "Ngày trả phòng phải sau ngày hôm nay.";
    }

    setFieldError(checkOutInput, errorEl, helpEl, message);
    return { valid: message === "", message: message, value: coVal };
  }

  function validateGuestsField(guestsSelect, maxGuests) {
    var errorEl = document.getElementById("searchGuestsError");
    var helpEl = document.getElementById("searchGuestsHelp");
    var raw = guestsSelect ? guestsSelect.value : "";
    var num = parseInt(raw, 10);
    var message = "";

    if (!Number.isInteger(num) || num < 1 || num > maxGuests) {
      message = "Số khách phải từ 1 đến " + maxGuests + " người.";
    }

    setFieldError(guestsSelect, errorEl, helpEl, message);
    return { valid: message === "", message: message };
  }

  function renderErrorSummary(items) {
    var box = document.getElementById("searchErrorSummary");
    var list = document.getElementById("searchErrorList");
    if (!box || !list) {
      return;
    }
    list.innerHTML = "";
    if (!items.length) {
      box.hidden = true;
      return;
    }
    items.forEach(function (msg) {
      var li = document.createElement("li");
      li.textContent = msg;
      list.appendChild(li);
    });
    box.hidden = false;
  }

  function bindAltManualChange(baseInput, altInput, onChangeCallback) {
    if (!altInput) {
      return;
    }
    altInput.addEventListener("change", function () {
      var iso = dateUtils.parseDisplayDateViToIso(altInput.value);
      if (iso && baseInput._flatpickr) {
        baseInput._flatpickr.setDate(iso, true, "Y-m-d");
      } else {
        baseInput.value = iso ? iso : "";
        onChangeCallback();
      }
    });
  }

  function setupDatePicker(baseInput, opts) {
    if (typeof window.flatpickr === "function") {
      var fpLocale = (window.flatpickr.l10ns && window.flatpickr.l10ns.vn) ? "vn" : "default";
      var initialIso = dateUtils.parseIsoDateParts(baseInput.value) ? baseInput.value : null;
      var instance = window.flatpickr(baseInput, {
        locale: fpLocale,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        altInputClass: "form-control gl-input gl-tabular",
        allowInput: true,
        disableMobile: true,
        defaultDate: initialIso,
        minDate: opts.minDate || null,
        onReady: function (selectedDates, dateStr, fp) {
          if (fp.altInput) {
            fp.altInput.id = opts.visibleId;
            fp.altInput.setAttribute("placeholder", "dd/mm/yyyy");
            fp.altInput.setAttribute("aria-describedby", opts.describedBy);
            fp.altInput.setAttribute("inputmode", "numeric");
          }
        },
        onDayCreate: function (dObj, dStr, fp, dayElem) {
          if (opts.maxLimitDate && dateUtils) {
            var dayIso = dateUtils.dateObjToIso(dayElem.dateObj);
            if (dayIso && dayIso > opts.maxLimitDate) {
              dayElem.classList.add("gl-flatpickr-over-limit");
              dayElem.setAttribute("aria-disabled", "true");
              dayElem.setAttribute("title", "Vượt quá giới hạn đặt trước 28 ngày");
            }
          }
        },
        onChange: function () {
          opts.onDateChange();
        }
      });
      bindAltManualChange(baseInput, instance.altInput, opts.onDateChange);
      return instance;
    }

    baseInput.id = opts.visibleId;
    var fallbackIso = dateUtils.parseIsoDateParts(baseInput.value) ? baseInput.value : "";
    baseInput.setAttribute("data-iso-value", fallbackIso);
    if (fallbackIso) {
      baseInput.value = dateUtils.formatDateVi(fallbackIso);
    }
    baseInput.addEventListener("change", function () {
      var parsed = dateUtils.parseDisplayDateViToIso(baseInput.value);
      baseInput.setAttribute("data-iso-value", parsed);
      opts.onDateChange();
    });
    return null;
  }

  function appendSearchParamsToLinks(checkInInput, checkOutInput, guestsSelect) {
    var ci = readIsoValue(checkInInput);
    var co = readIsoValue(checkOutInput);
    var guests = guestsSelect ? guestsSelect.value : "";
    document.querySelectorAll("[data-gl-preserve-query]").forEach(function (link) {
      var baseHref = link.getAttribute("data-gl-base-href");
      if (!baseHref) {
        baseHref = link.getAttribute("href") || "";
        link.setAttribute("data-gl-base-href", baseHref);
      }
      if (!baseHref) {
        return;
      }
      var url = new URL(baseHref, window.location.origin);
      if (ci) { url.searchParams.set("checkin", ci); } else { url.searchParams.delete("checkin"); }
      if (co) { url.searchParams.set("checkout", co); } else { url.searchParams.delete("checkout"); }
      if (guests) { url.searchParams.set("guests", guests); }
      link.setAttribute("href", url.pathname + url.search);
    });
  }

  function syncNightCountDisplays() {
    var summaryNightsEl = document.getElementById("searchSummaryNights");
    if (summaryNightsEl && dateUtils) {
      var ci = summaryNightsEl.getAttribute("data-checkin") || "";
      var co = summaryNightsEl.getAttribute("data-checkout") || "";
      var nights = dateUtils.computeNightCount(ci, co);
      if (nights > 0) {
        summaryNightsEl.textContent = nights + " đêm";
      }
    }
    var cardNightEls = document.querySelectorAll(".gl-search-card__est-nights");
    cardNightEls.forEach(function (el) {
      var ci = el.getAttribute("data-checkin") || "";
      var co = el.getAttribute("data-checkout") || "";
      var nights = dateUtils.computeNightCount(ci, co);
      if (nights > 0) {
        el.textContent = nights + " đêm";
      }
    });
  }

  function initSearchForm() {
    syncNightCountDisplays();
    var form = document.getElementById("roomSearchForm");
    var checkInInput = document.getElementById("searchCheckIn");
    var checkOutInput = document.getElementById("searchCheckOut");
    var guestsSelect = document.getElementById("searchGuests");
    var resetBtn = document.getElementById("searchResetBtn");
    var submitBtn = document.getElementById("searchSubmitBtn");
    var unavailableBox = document.getElementById("searchUnavailableBox");
    var loadingStatus = document.getElementById("searchLoadingStatus");
    var emptyEditBtn = document.getElementById("emptyEditDatesBtn");

    if (!form || !checkInInput || !checkOutInput || !guestsSelect || !dateUtils) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    if (!checkInInput.value && params.get("checkin")) {
      checkInInput.value = params.get("checkin");
    }
    if (!checkOutInput.value && params.get("checkout")) {
      checkOutInput.value = params.get("checkout");
    }
    if (params.get("guests")) {
      guestsSelect.value = params.get("guests");
    }

    var todayIso = dateUtils.dateObjToIso(new Date());
    var bookingDate = form.getAttribute("data-gl-booking-date") || todayIso;
    var maxCheckInDate = form.getAttribute("data-gl-max-checkin-date") || addDaysIso(bookingDate, 28);
    var maxGuests = parseInt(form.getAttribute("data-gl-max-guests") || "3", 10);
    var searchEndpoint = (form.getAttribute("data-gl-search-endpoint") || "").trim();

    var checkOutPicker = null;
    var checkInPicker = null;

    function syncCheckOutMinDate(ciIso) {
      var minCoIso = (dateUtils.parseIsoDateParts(ciIso) && ciIso >= bookingDate)
        ? addDaysIso(ciIso, 1)
        : addDaysIso(bookingDate, 1);
      if (checkOutPicker) {
        checkOutPicker.set("minDate", minCoIso);
      }
    }

    function onCheckInChanged() {
      var ciRes = validateCheckInField(checkInInput, bookingDate, maxCheckInDate);
      syncCheckOutMinDate(ciRes.value);
      if (readIsoValue(checkOutInput)) {
        validateCheckOutField(checkInInput, checkOutInput, bookingDate);
      }
      appendSearchParamsToLinks(checkInInput, checkOutInput, guestsSelect);
      if (unavailableBox) {
        unavailableBox.hidden = true;
      }
    }

    function onCheckOutChanged() {
      validateCheckOutField(checkInInput, checkOutInput, bookingDate);
      appendSearchParamsToLinks(checkInInput, checkOutInput, guestsSelect);
      if (unavailableBox) {
        unavailableBox.hidden = true;
      }
    }

    checkInPicker = setupDatePicker(checkInInput, {
      visibleId: "searchCheckInVisible",
      describedBy: "searchCheckInHelp searchCheckInError",
      minDate: bookingDate,
      maxLimitDate: maxCheckInDate,
      onDateChange: onCheckInChanged
    });

    var initialCiIso = readIsoValue(checkInInput);
    var initialMinCo = (dateUtils.parseIsoDateParts(initialCiIso) && initialCiIso >= bookingDate)
      ? addDaysIso(initialCiIso, 1)
      : addDaysIso(bookingDate, 1);

    checkOutPicker = setupDatePicker(checkOutInput, {
      visibleId: "searchCheckOutVisible",
      describedBy: "searchCheckOutHelp searchCheckOutError",
      minDate: initialMinCo,
      onDateChange: onCheckOutChanged
    });

    guestsSelect.addEventListener("change", function () {
      validateGuestsField(guestsSelect, maxGuests);
      appendSearchParamsToLinks(checkInInput, checkOutInput, guestsSelect);
      if (unavailableBox) {
        unavailableBox.hidden = true;
      }
    });
    appendSearchParamsToLinks(checkInInput, checkOutInput, guestsSelect);

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (checkInPicker) {
          checkInPicker.clear(false);
        } else {
          checkInInput.value = "";
          checkInInput.setAttribute("data-iso-value", "");
        }
        if (checkOutPicker) {
          checkOutPicker.clear(false);
          checkOutPicker.set("minDate", addDaysIso(bookingDate, 1));
        } else {
          checkOutInput.value = "";
          checkOutInput.setAttribute("data-iso-value", "");
        }
        guestsSelect.value = maxGuests >= 2 ? "2" : "1";
        setFieldError(checkInInput, document.getElementById("searchCheckInError"), document.getElementById("searchCheckInHelp"), "");
        setFieldError(checkOutInput, document.getElementById("searchCheckOutError"), document.getElementById("searchCheckOutHelp"), "");
        setFieldError(guestsSelect, document.getElementById("searchGuestsError"), document.getElementById("searchGuestsHelp"), "");
        renderErrorSummary([]);
        if (unavailableBox) {
          unavailableBox.hidden = true;
        }
        var target = getVisibleDateControl(checkInInput);
        if (target) {
          target.focus();
        }
      });
    }

    if (emptyEditBtn) {
      emptyEditBtn.addEventListener("click", function () {
        var panel = document.getElementById("searchFormPanel");
        if (panel && panel.scrollIntoView) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        var target = getVisibleDateControl(checkInInput);
        if (target) {
          target.focus();
        }
      });
    }

    form.addEventListener("submit", function (event) {
      var ciRes = validateCheckInField(checkInInput, bookingDate, maxCheckInDate);
      var coRes = validateCheckOutField(checkInInput, checkOutInput, bookingDate);
      var gRes = validateGuestsField(guestsSelect, maxGuests);

      var errors = [];
      var firstInvalid = null;
      if (!ciRes.valid) {
        errors.push(ciRes.message);
        firstInvalid = firstInvalid || getVisibleDateControl(checkInInput);
      }
      if (!coRes.valid) {
        errors.push(coRes.message);
        firstInvalid = firstInvalid || getVisibleDateControl(checkOutInput);
      }
      if (!gRes.valid) {
        errors.push(gRes.message);
        firstInvalid = firstInvalid || guestsSelect;
      }

      if (errors.length > 0) {
        event.preventDefault();
        renderErrorSummary(errors);
        if (unavailableBox) {
          unavailableBox.hidden = true;
        }
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      renderErrorSummary([]);

      if (!searchEndpoint) {
        event.preventDefault();
        if (unavailableBox) {
          unavailableBox.hidden = false;
        }
        return;
      }

      if (unavailableBox) {
        unavailableBox.hidden = true;
      }
      var loadingSkeleton = document.getElementById("searchLoadingSkeleton");
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (loadingStatus) {
        loadingStatus.hidden = false;
      }
      if (loadingSkeleton) {
        loadingSkeleton.hidden = false;
      }
    });

    window.ValentiaRoomSearch = {
      setCheckInIso: function (isoDate) {
        if (checkInPicker) {
          checkInPicker.setDate(isoDate, true, "Y-m-d");
        } else {
          checkInInput.setAttribute("data-iso-value", isoDate);
          checkInInput.value = isoDate ? dateUtils.formatDateVi(isoDate) : "";
          onCheckInChanged();
        }
      },
      setCheckOutIso: function (isoDate) {
        if (checkOutPicker) {
          checkOutPicker.setDate(isoDate, true, "Y-m-d");
        } else {
          checkOutInput.setAttribute("data-iso-value", isoDate);
          checkOutInput.value = isoDate ? dateUtils.formatDateVi(isoDate) : "";
          onCheckOutChanged();
        }
      },
      getDates: function () {
        return {
          checkin: readIsoValue(checkInInput),
          checkout: readIsoValue(checkOutInput),
          guests: guestsSelect.value
        };
      }
    };
  }

  function initTierFilter() {
    var filterBar = document.getElementById("searchTierFilters");
    var groups = document.querySelectorAll("#roomResults [data-gl-tier-group]");
    if (!filterBar || !groups.length) {
      return;
    }
    var buttons = filterBar.querySelectorAll("[data-gl-tier-filter]");
    function applyTierFilter(tierKey) {
      var target = tierKey || "all";
      buttons.forEach(function (btn) {
        var active = btn.getAttribute("data-gl-tier-filter") === target;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      groups.forEach(function (grp) {
        var grpKey = grp.getAttribute("data-gl-tier-group");
        grp.hidden = (target !== "all" && grpKey !== target);
      });
    }
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTierFilter(btn.getAttribute("data-gl-tier-filter"));
      });
    });
    var qTier = new URLSearchParams(window.location.search).get("tier");
    if (qTier && ["hang_a", "hang_b", "hang_c"].indexOf(qTier) !== -1) {
      applyTierFilter(qTier);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSearchForm();
    initTierFilter();
  });
})();
