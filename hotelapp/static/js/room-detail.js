/* Public Room Detail (P03) — Gallery, Flatpickr (d/m/Y), 28-Day Guard */
(function () {
  "use strict";

  var dateUtils = window.ValentiaDateUtils;

  function initGallery() {
    var mainImg = document.getElementById("roomGalleryMainImg");
    var captionEl = document.getElementById("roomGalleryCaption");
    var lightboxImg = document.getElementById("roomLightboxImg");
    var thumbs = document.querySelectorAll("[data-gl-gallery-thumb]");
    if (!mainImg || !thumbs.length) {
      return;
    }
    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nextSrc = btn.getAttribute("data-gl-src") || "";
        var nextAlt = btn.getAttribute("data-gl-alt") || mainImg.alt;
        if (nextSrc) {
          mainImg.src = nextSrc;
          mainImg.alt = nextAlt;
          if (captionEl) {
            captionEl.textContent = nextAlt;
          }
          if (lightboxImg) {
            lightboxImg.src = nextSrc;
            lightboxImg.alt = nextAlt;
          }
        }
        thumbs.forEach(function (item) {
          item.classList.toggle("is-active", item === btn);
          item.setAttribute("aria-pressed", item === btn ? "true" : "false");
        });
      });
    });
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

  function setInputError(baseInput, errorEl, message) {
    var visibleEl = getVisibleDateControl(baseInput);
    if (!baseInput || !errorEl) {
      return;
    }
    if (message) {
      baseInput.classList.add("is-invalid");
      baseInput.setAttribute("aria-invalid", "true");
      if (visibleEl && visibleEl !== baseInput) {
        visibleEl.classList.add("is-invalid");
        visibleEl.setAttribute("aria-invalid", "true");
      }
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      baseInput.classList.remove("is-invalid");
      baseInput.removeAttribute("aria-invalid");
      if (visibleEl && visibleEl !== baseInput) {
        visibleEl.classList.remove("is-invalid");
        visibleEl.removeAttribute("aria-invalid");
      }
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  function setupDatePicker(baseInput, opts) {
    if (typeof window.flatpickr === "function") {
      var fpLocale = (window.flatpickr.l10ns && window.flatpickr.l10ns.vn) ? "vn" : "default";
      var initialIso = dateUtils.parseIsoDateParts(baseInput.value) ? baseInput.value : null;
      var fp = window.flatpickr(baseInput, {
        locale: fpLocale,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        altInputClass: "form-control gl-input gl-tabular",
        allowInput: true,
        disableMobile: true,
        defaultDate: initialIso,
        minDate: opts.minDate || null,
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.altInput) {
            instance.altInput.id = opts.visibleId;
            instance.altInput.setAttribute("placeholder", "dd/mm/yyyy");
            instance.altInput.setAttribute("aria-describedby", opts.describedBy);
            instance.altInput.setAttribute("inputmode", "numeric");
          }
        },
        onDayCreate: function (dObj, dStr, instance, dayElem) {
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
      if (fp.altInput) {
        fp.altInput.addEventListener("change", function () {
          var iso = dateUtils.parseDisplayDateViToIso(fp.altInput.value);
          if (iso) {
            fp.setDate(iso, true, "Y-m-d");
          } else {
            baseInput.value = "";
            opts.onDateChange();
          }
        });
      }
      return fp;
    }

    baseInput.id = opts.visibleId;
    if (dateUtils.parseIsoDateParts(baseInput.value)) {
      baseInput.setAttribute("data-iso-value", baseInput.value);
      baseInput.value = dateUtils.formatDateVi(baseInput.value);
    }
    baseInput.addEventListener("change", function () {
      var parsed = dateUtils.parseDisplayDateViToIso(baseInput.value);
      baseInput.setAttribute("data-iso-value", parsed);
      opts.onDateChange();
    });
    return null;
  }

  function initRoomDetailForm() {
    var form = document.getElementById("roomQuickForm");
    var checkInInput = document.getElementById("roomCheckIn");
    var checkOutInput = document.getElementById("roomCheckOut");
    var guestSelect = document.getElementById("roomGuestSelect");
    var summaryEl = document.getElementById("roomStaySummary");
    var unavailableEl = document.getElementById("roomBookingUnavailable");

    if (!form || !checkInInput || !checkOutInput || !dateUtils) {
      return;
    }

    var todayIso = dateUtils.getTodayIso();
    var bookingDate = form.getAttribute("data-gl-booking-date") || todayIso;
    var maxCheckInDate = form.getAttribute("data-gl-max-checkin-date") || dateUtils.addDaysIso(bookingDate, 28);
    var targetAction = (form.getAttribute("data-gl-booking-url") || "").trim();

    function validateCi() {
      var val = readIsoValue(checkInInput);
      var msg = "";
      if (!val || !dateUtils.parseIsoDateParts(val)) {
        msg = "Vui lòng chọn ngày nhận phòng hợp lệ (dd/mm/yyyy).";
      } else if (val < bookingDate) {
        msg = "Ngày nhận phòng không thể ở quá khứ.";
      } else if (maxCheckInDate && val > maxCheckInDate) {
        msg = "Ngày nhận phòng vượt quá giới hạn 28 ngày (tối đa đến ngày " + dateUtils.formatDateVi(maxCheckInDate) + ").";
      }
      setInputError(checkInInput, document.getElementById("roomCheckInError"), msg);
      return msg === "";
    }

    function validateCo() {
      var ci = readIsoValue(checkInInput);
      var co = readIsoValue(checkOutInput);
      var msg = "";
      if (!co || !dateUtils.parseIsoDateParts(co)) {
        msg = "Vui lòng chọn ngày trả phòng hợp lệ (dd/mm/yyyy).";
      } else if (dateUtils.parseIsoDateParts(ci) && co <= ci) {
        msg = "Ngày trả phòng phải sau ngày nhận phòng.";
      }
      setInputError(checkOutInput, document.getElementById("roomCheckOutError"), msg);
      return msg === "";
    }

    var coPicker = null;
    function onDateChange() {
      var ci = readIsoValue(checkInInput);
      var co = readIsoValue(checkOutInput);
      var ciValid = ci ? validateCi() : false;
      var coValid = co ? validateCo() : false;
      if (coPicker && dateUtils.parseIsoDateParts(ci)) {
        coPicker.set("minDate", dateUtils.addDaysIso(ci, 1));
      }
      if (summaryEl) {
        if (ciValid && coValid) {
          summaryEl.hidden = false;
          summaryEl.textContent = dateUtils.formatStaySummary(ci, co);
        } else {
          summaryEl.hidden = true;
          summaryEl.textContent = "";
        }
      }
    }

    setupDatePicker(checkInInput, {
      visibleId: "roomCheckInVisible",
      describedBy: "roomCheckInHelp roomCheckInError",
      minDate: bookingDate,
      maxLimitDate: maxCheckInDate,
      onDateChange: onDateChange
    });

    coPicker = setupDatePicker(checkOutInput, {
      visibleId: "roomCheckOutVisible",
      describedBy: "roomCheckOutError",
      minDate: dateUtils.addDaysIso(bookingDate, 1),
      onDateChange: onDateChange
    });

    form.addEventListener("submit", function (event) {
      var ciValid = validateCi();
      var coValid = validateCo();
      if (!ciValid || !coValid) {
        event.preventDefault();
        var target = getVisibleDateControl(ciValid ? checkOutInput : checkInInput);
        if (target) {
          target.focus();
        }
        return;
      }

      if (!targetAction) {
        event.preventDefault();
        if (unavailableEl) {
          unavailableEl.hidden = false;
        }
        return;
      }

      var roomIdInput = form.querySelector('input[name="room_id"]');
      var tierInput = form.querySelector('input[name="tier"]');
      var stayParams = {
        roomId: roomIdInput ? roomIdInput.value : "",
        tierKey: tierInput ? tierInput.value : "",
        checkin: readIsoValue(checkInInput),
        checkout: readIsoValue(checkOutInput),
        guests: guestSelect ? guestSelect.value : ""
      };
      if (window.ValentiaAuthGate && !window.ValentiaAuthGate.isAuthenticated()) {
        event.preventDefault();
        window.ValentiaAuthGate.handleBookingNavigation(targetAction, stayParams);
        return;
      }

      var submitBtn = document.getElementById("roomProceedCta");
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (guestSelect && !guestSelect.name) {
        guestSelect.name = "guests";
      }
    });

    if (checkInInput.value && checkOutInput.value) {
      onDateChange();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGallery();
    initRoomDetailForm();
  });
})();
