/* Client Booking 3-Step Flow (C01) — Room & Stay -> Booker & Guests -> Review & Submit */
(function () {
  "use strict";

  var dateUtils = window.ValentiaDateUtils;
  var ui = window.ValentiaUi;

  function initBookingWizard() {
    var form = document.getElementById("bookingWizardForm");
    if (!form || !dateUtils || !ui) {
      return;
    }

    var maxGuests = parseInt(form.getAttribute("data-gl-max-guests") || "3", 10);
    if (!Number.isFinite(maxGuests) || maxGuests < 1) {
      maxGuests = 3;
    }
    var todayIso = dateUtils.getTodayIso();
    var bookingDate = form.getAttribute("data-gl-booking-date") || todayIso;
    var maxCheckInDate = form.getAttribute("data-gl-max-checkin-date") || dateUtils.addDaysIso(bookingDate, 28);
    var submitUrl = (form.getAttribute("data-gl-submit-url") || "").trim();

    var quoteUrl = (form.getAttribute("data-gl-quote-url") || "").trim();
    var initialQuoteKey = (form.getAttribute("data-gl-initial-quote-key") || "").trim();
    var quoteLoadingEl = document.getElementById("c01QuoteLoading");
    var quoteErrorEl = document.getElementById("c01QuoteError");
    var quoteErrorTextEl = document.getElementById("c01QuoteErrorText");
    var quoteLinesEl = document.getElementById("c01QuoteLines");
    var quoteFallbackEl = document.getElementById("c01QuoteFallbackNote");
    var confirmBtn = document.getElementById("confirmBookingBtn");
    var initialServerQuoteHtml = quoteLinesEl ? quoteLinesEl.innerHTML : "";
    var activeQuoteController = null;
    var lastRequestedQuoteKey = initialQuoteKey;
    var hasValidQuote = Boolean(initialQuoteKey);

    var selectedRoomHidden = document.getElementById("c01SelectedRoomId");
    var roomSelect = document.getElementById("c01RoomSelect");
    var changeRoomLink = document.getElementById("c01ChangeRoomLink");
    var checkInInput = document.getElementById("c01CheckIn");
    var checkOutInput = document.getElementById("c01CheckOut");
    var guestsSelect = document.getElementById("c01GuestCount");
    var bookerName = document.getElementById("bookerName");
    var bookerPhone = document.getElementById("bookerPhone");
    var bookerEmail = document.getElementById("bookerEmail");
    var bookerIsGuest1 = document.getElementById("bookerIsGuest1");
    var guestContainer = document.getElementById("guestCardsContainer");
    var addGuestBtn = document.getElementById("addGuestBtn");
    var guestLimitHint = document.getElementById("guestLimitHint");

    var summaryBox = document.getElementById("bookingErrorSummary");
    var summaryTitle = document.getElementById("bookingErrorSummaryTitle");
    var summaryList = document.getElementById("bookingErrorSummaryList");
    var unavailableAlert = document.getElementById("bookingSubmitUnavailable");

    var currentStep = parseInt(form.getAttribute("data-gl-initial-step") || "1", 10);
    if (currentStep < 1 || currentStep > 3) {
      currentStep = 1;
    }

    var initialGuestsCount = guestsSelect ? parseInt(guestsSelect.value || "1", 10) : 1;
    var guests = [];
    for (var i = 0; i < Math.min(Math.max(initialGuestsCount, 1), maxGuests); i += 1) {
      guests.push({ name: "", type: "", idNumber: "", address: "" });
    }

    function readIso(inputEl) {
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

    function getVisibleControl(inputEl) {
      if (inputEl && inputEl._flatpickr && inputEl._flatpickr.altInput) {
        return inputEl._flatpickr.altInput;
      }
      return inputEl;
    }

    function setupDate(baseInput, opts) {
      if (!baseInput) {
        return null;
      }
      if (typeof window.flatpickr === "function") {
        var fpLocale = (window.flatpickr.l10ns && window.flatpickr.l10ns.vn) ? "vn" : "default";
        var fp = window.flatpickr(baseInput, {
          locale: fpLocale,
          dateFormat: "Y-m-d",
          altInput: true,
          altFormat: "d/m/Y",
          altInputClass: "form-control gl-input gl-tabular",
          allowInput: true,
          disableMobile: true,
          defaultDate: dateUtils.parseIsoDateParts(baseInput.value) ? baseInput.value : null,
          minDate: opts.minDate || null,
          onReady: function (sel, dStr, inst) {
            if (inst.altInput) {
              inst.altInput.id = opts.visibleId;
              inst.altInput.setAttribute("placeholder", "dd/mm/yyyy");
              inst.altInput.setAttribute("inputmode", "numeric");
            }
          },
          onDayCreate: function (dObj, dStr, inst, dayElem) {
            if (opts.maxLimitDate) {
              var dayIso = dateUtils.dateObjToIso(dayElem.dateObj);
              if (dayIso && dayIso > opts.maxLimitDate) {
                dayElem.classList.add("gl-flatpickr-over-limit");
                dayElem.setAttribute("aria-disabled", "true");
              }
            }
          },
          onChange: opts.onDateChange
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
        baseInput.setAttribute("data-iso-value", dateUtils.parseDisplayDateViToIso(baseInput.value));
        opts.onDateChange();
      });
      return null;
    }

    var coPicker = null;

    function updateSummaryAndReview() {
      var ci = readIso(checkInInput);
      var co = readIso(checkOutInput);
      var nights = dateUtils.computeNightCount(ci, co);

      var selectedOpt = roomSelect && roomSelect.selectedIndex >= 0 ? roomSelect.options[roomSelect.selectedIndex] : null;
      var roomIdVal = "";
      var roomText = "Chưa chọn phòng";
      var nightlyRateText = "";
      var rawPricingJson = "";
      if (selectedRoomHidden && (selectedRoomHidden.value || selectedRoomHidden.getAttribute("data-gl-room-name"))) {
        roomIdVal = selectedRoomHidden.value || "";
        roomText = selectedRoomHidden.getAttribute("data-gl-room-name") || "Đã chọn phòng";
        nightlyRateText = selectedRoomHidden.getAttribute("data-gl-rate-display") || "";
        rawPricingJson = selectedRoomHidden.getAttribute("data-gl-pricing") || "";
      } else if (selectedOpt && selectedOpt.value) {
        roomIdVal = selectedOpt.value || "";
        roomText = selectedOpt.text;
        nightlyRateText = selectedOpt.getAttribute("data-gl-rate-display") || "";
        rawPricingJson = selectedOpt.getAttribute("data-gl-pricing") || "";
      }

      var parsedRoomObj = {};
      if (rawPricingJson) {
        try {
          parsedRoomObj = JSON.parse(rawPricingJson);
        } catch (err) {
          parsedRoomObj = {};
        }
      }
      var priceLib = window.ValentiaPrice;
      var pricing = (priceLib && typeof priceLib.extractPricing === "function")
        ? priceLib.extractPricing(parsedRoomObj)
        : { hasPrice: false };
      if (pricing.hasPrice && priceLib) {
        nightlyRateText = priceLib.formatVnd(pricing.finalPrice) + "/đêm";
      }

      if (changeRoomLink) {
        var baseChangeHref = changeRoomLink.getAttribute("data-gl-base-href") || changeRoomLink.getAttribute("href") || "";
        if (baseChangeHref) {
          var chUrl = new URL(baseChangeHref, window.location.origin);
          if (ci) { chUrl.searchParams.set("checkin", ci); } else { chUrl.searchParams.delete("checkin"); }
          if (co) { chUrl.searchParams.set("checkout", co); } else { chUrl.searchParams.delete("checkout"); }
          if (guestsSelect && guestsSelect.value) { chUrl.searchParams.set("guests", guestsSelect.value); }
          changeRoomLink.setAttribute("href", chUrl.pathname + chUrl.search);
        }
      }

      setText("summaryRoomName", roomText);
      setText("summaryCheckIn", ci ? dateUtils.formatDateVi(ci) : "—");
      setText("summaryCheckOut", co ? dateUtils.formatDateVi(co) : "—");
      setText("summaryNights", nights > 0 ? String(nights) + " đêm" : "—");
      setText("summaryGuestCount", guests.length + " / " + maxGuests + " khách");
      setText("summaryNightlyRate", nightlyRateText || "Chưa có thông tin giá");
      setText("reviewBookerName", bookerName && bookerName.value.trim() ? bookerName.value.trim() : "—");
      setText("reviewBookerPhone", bookerPhone && bookerPhone.value.trim() ? bookerPhone.value.trim() : "Chưa cung cấp");
      setText("reviewBookerEmail", bookerEmail && bookerEmail.value.trim() ? bookerEmail.value.trim() : "Chưa cung cấp");

      var reviewBody = document.getElementById("reviewGuestsBody");
      if (reviewBody) {
        while (reviewBody.firstChild) {
          reviewBody.removeChild(reviewBody.firstChild);
        }
        guests.forEach(function (g, idx) {
          var tr = document.createElement("tr");
          var typeText = g.type === "foreign" ? "Nước ngoài" : (g.type === "domestic" ? "Nội địa" : (g.type || "—"));
          [String(idx + 1), g.name || "—", typeText, g.idNumber || "—", g.address || "—"].forEach(function (cellVal) {
            var td = document.createElement("td");
            td.textContent = cellVal;
            tr.appendChild(td);
          });
          reviewBody.appendChild(tr);
        });
        ui.refreshTableScrollHints();
      }

      var hiddenGuests = document.getElementById("guestsJsonInput");
      if (hiddenGuests) {
        hiddenGuests.value = JSON.stringify(guests);
      }

      refreshCostBreakdown(roomIdVal, ci, co, nights, pricing, priceLib);
    }

    function appendFolioRow(container, labelText, valueText, extraClass, isTotal) {
      var row = document.createElement("div");
      row.className = "gl-folio__row " + (isTotal ? "gl-folio__row--total" : "gl-folio__row--dotted");
      var lbl = document.createElement("span");
      lbl.className = "gl-folio__label";
      lbl.textContent = labelText;
      var val = document.createElement("span");
      val.className = (isTotal ? "gl-folio__total-value" : "gl-folio__value") + " price-value" + (extraClass ? " " + extraClass : "");
      if (isTotal) {
        val.id = "c01QuoteTotalValue";
      }
      val.textContent = valueText;
      row.appendChild(lbl);
      row.appendChild(val);
      container.appendChild(row);
    }

    function renderQuoteLines(q) {
      if (!quoteLinesEl) {
        return;
      }
      while (quoteLinesEl.firstChild) {
        quoteLinesEl.removeChild(quoteLinesEl.firstChild);
      }
      var hasDiscount = Boolean(q.discount_display);
      if (q.list_price_display) {
        appendFolioRow(quoteLinesEl, "Giá niêm yết", q.list_price_display, hasDiscount ? "gl-folio__value--strike" : "", false);
      }
      if (q.discount_display) {
        appendFolioRow(quoteLinesEl, "Ưu đãi " + (q.discount_percent_label || ""), q.discount_display, "gl-folio__value--discount", false);
      }
      if (q.effective_rate_display) {
        appendFolioRow(quoteLinesEl, "Giá thuê sau ưu đãi", q.effective_rate_display, hasDiscount ? "gl-folio__value--promo" : "", false);
      }
      if (q.nights) {
        appendFolioRow(quoteLinesEl, "Số đêm", String(q.nights), "", false);
      }
      if (q.room_subtotal_display) {
        appendFolioRow(quoteLinesEl, "Tiền phòng", q.room_subtotal_display, "", false);
      }
      if (q.third_guest_surcharge_display) {
        appendFolioRow(quoteLinesEl, "Phụ thu khách thứ 3", q.third_guest_surcharge_display, "", false);
      }
      if (q.foreign_adjustment_display) {
        appendFolioRow(quoteLinesEl, "Hệ số khách nước ngoài (1,5)", q.foreign_adjustment_display, "", false);
      }
      if (Array.isArray(q.other_fees)) {
        q.other_fees.forEach(function (fee) {
          if (fee && fee.label && fee.amount_display) {
            appendFolioRow(quoteLinesEl, fee.label, fee.amount_display, "", false);
          }
        });
      }
      if (q.total_display) {
        appendFolioRow(quoteLinesEl, "Tổng tiền", q.total_display, "", true);
      }
      if (quoteFallbackEl) {
        quoteFallbackEl.hidden = Boolean(q.total_display);
      }
    }

    function renderConfirmedUnitBreakdown(nights, pricing, priceLib) {
      if (!quoteLinesEl) {
        return;
      }
      while (quoteLinesEl.firstChild) {
        quoteLinesEl.removeChild(quoteLinesEl.firstChild);
      }
      if (pricing && pricing.hasPrice && priceLib) {
        if (pricing.hasActivePromo) {
          appendFolioRow(quoteLinesEl, "Giá niêm yết / đêm", priceLib.formatVnd(pricing.originalPrice), "gl-folio__value--strike", false);
          var discText = "-" + Math.round(pricing.discountPercent) + "%" + (pricing.savingsAmount ? (" (tiết kiệm " + priceLib.formatVnd(pricing.savingsAmount) + "/đêm)") : "");
          appendFolioRow(quoteLinesEl, pricing.promoName || "Ưu đãi áp dụng", discText, "gl-folio__value--discount", false);
          appendFolioRow(quoteLinesEl, "Giá thuê sau ưu đãi / đêm", priceLib.formatVnd(pricing.finalPrice), "gl-folio__value--promo", false);
        } else {
          appendFolioRow(quoteLinesEl, "Giá thuê niêm yết / đêm", priceLib.formatVnd(pricing.originalPrice), "", false);
        }
      }
      if (nights > 0) {
        appendFolioRow(quoteLinesEl, "Số đêm", String(nights) + " đêm", "", false);
      }
      if (quoteFallbackEl) {
        quoteFallbackEl.hidden = false;
      }
    }

    function refreshCostBreakdown(roomIdVal, ci, co, nights, pricing, priceLib) {
      if (!quoteLinesEl) {
        return;
      }
      var guestSignature = guests.map(function (g) { return g.type || ""; }).join(",");
      var curKey = roomIdVal + "|" + ci + "|" + co + "|" + guests.length;

      if (quoteUrl && roomIdVal && nights > 0) {
        var fetchKey = curKey + "|" + guestSignature;
        if (fetchKey === lastRequestedQuoteKey && hasValidQuote) {
          return;
        }
        lastRequestedQuoteKey = fetchKey;
        hasValidQuote = false;
        if (activeQuoteController && typeof activeQuoteController.abort === "function") {
          activeQuoteController.abort();
        }
        activeQuoteController = typeof AbortController === "function" ? new AbortController() : null;
        if (quoteLoadingEl) { quoteLoadingEl.hidden = false; }
        if (quoteErrorEl) { quoteErrorEl.hidden = true; }
        if (confirmBtn && submitUrl) { confirmBtn.disabled = true; }
        renderConfirmedUnitBreakdown(nights, pricing, priceLib);

        var qs = new URLSearchParams({
          room_id: String(roomIdVal),
          checkin: ci,
          checkout: co,
          guests: String(guests.length),
          guests_json: JSON.stringify(guests)
        });
        fetch(quoteUrl + (quoteUrl.indexOf("?") !== -1 ? "&" : "?") + qs.toString(), {
          headers: { Accept: "application/json" },
          signal: activeQuoteController ? activeQuoteController.signal : undefined
        })
          .then(function (resp) {
            if (!resp.ok) {
              throw new Error("Không thể tải báo giá (HTTP " + resp.status + ").");
            }
            return resp.json();
          })
          .then(function (data) {
            if (quoteLoadingEl) { quoteLoadingEl.hidden = true; }
            if (!data || data.error) {
              throw new Error((data && data.error) || "Dữ liệu báo giá chưa hợp lệ.");
            }
            hasValidQuote = true;
            if (quoteErrorEl) { quoteErrorEl.hidden = true; }
            renderQuoteLines(data);
            if (confirmBtn) { confirmBtn.disabled = false; }
          })
          .catch(function (err) {
            if (err && err.name === "AbortError") {
              return;
            }
            if (quoteLoadingEl) { quoteLoadingEl.hidden = true; }
            if (quoteErrorEl && quoteErrorTextEl) {
              quoteErrorTextEl.textContent = (err && err.message) ? err.message : "Chưa thể cập nhật báo giá cho lựa chọn mới.";
              quoteErrorEl.hidden = false;
            }
            if (confirmBtn && submitUrl) { confirmBtn.disabled = true; }
          });
        return;
      }

      if (initialQuoteKey && curKey === initialQuoteKey && initialServerQuoteHtml) {
        quoteLinesEl.innerHTML = initialServerQuoteHtml;
        if (quoteFallbackEl) { quoteFallbackEl.hidden = true; }
        if (quoteErrorEl) { quoteErrorEl.hidden = true; }
        return;
      }

      if (quoteErrorEl) { quoteErrorEl.hidden = true; }
      renderConfirmedUnitBreakdown(nights, pricing, priceLib);
    }

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = val;
      }
    }

    function showStep(stepNum) {
      currentStep = stepNum;
      [1, 2, 3].forEach(function (n) {
        var section = document.getElementById("bookingStep" + n);
        if (section) {
          section.hidden = n !== stepNum;
        }
        var navItem = document.getElementById("stepperItem" + n);
        if (navItem) {
          navItem.classList.toggle("is-active", n === stepNum);
          navItem.classList.toggle("is-completed", n < stepNum);
          if (n === stepNum) {
            navItem.setAttribute("aria-current", "step");
          } else {
            navItem.removeAttribute("aria-current");
          }
        }
      });
      setText("mobileStepperText", "Bước " + stepNum + "/3");
      ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, []);
      updateSummaryAndReview();
    }

    function validateStep1() {
      var errors = [];
      if (roomSelect && !selectedRoomHidden) {
        var roomMsg = roomSelect.value ? "" : "Vui lòng chọn phòng muốn đặt.";
        ui.setFieldError(roomSelect, document.getElementById("c01RoomError"), roomMsg);
        if (roomMsg) {
          errors.push({ id: "c01RoomSelect", message: roomMsg });
        }
      }
      var ci = readIso(checkInInput);
      var co = readIso(checkOutInput);
      var ciMsg = "";
      if (!ci || !dateUtils.parseIsoDateParts(ci)) {
        ciMsg = "Vui lòng chọn ngày nhận phòng hợp lệ (dd/mm/yyyy).";
      } else if (ci < bookingDate) {
        ciMsg = "Ngày nhận phòng không thể trước ngày hôm nay.";
      } else if (maxCheckInDate && ci > maxCheckInDate) {
        ciMsg = "Ngày nhận phòng vượt quá giới hạn 28 ngày (tối đa " + dateUtils.formatDateVi(maxCheckInDate) + ").";
      }
      if (checkInInput) {
        var ciVis = getVisibleControl(checkInInput);
        ui.setFieldError(checkInInput, document.getElementById("c01CheckInError"), ciMsg);
        if (ciVis && ciVis !== checkInInput) {
          ciVis.classList.toggle("is-invalid", Boolean(ciMsg));
        }
        if (ciMsg) {
          errors.push({ id: ciVis ? ciVis.id : "c01CheckIn", message: ciMsg });
        }
      }

      var coMsg = "";
      if (!co || !dateUtils.parseIsoDateParts(co)) {
        coMsg = "Vui lòng chọn ngày trả phòng hợp lệ (dd/mm/yyyy).";
      } else if (dateUtils.parseIsoDateParts(ci) && co <= ci) {
        coMsg = "Ngày trả phòng phải sau ngày nhận phòng.";
      }
      if (checkOutInput) {
        var coVis = getVisibleControl(checkOutInput);
        ui.setFieldError(checkOutInput, document.getElementById("c01CheckOutError"), coMsg);
        if (coVis && coVis !== checkOutInput) {
          coVis.classList.toggle("is-invalid", Boolean(coMsg));
        }
        if (coMsg) {
          errors.push({ id: coVis ? coVis.id : "c01CheckOut", message: coMsg });
        }
      }
      return errors;
    }

    function validateStep2() {
      var errors = [];
      if (bookerName) {
        var bNameErr = bookerName.value.trim() ? "" : "Họ tên người đặt không được để trống.";
        ui.setFieldError(bookerName, document.getElementById("bookerNameError"), bNameErr);
        if (bNameErr) {
          errors.push({ id: "bookerName", message: bNameErr });
        }
      }
      if (bookerPhone && bookerPhone.value.trim()) {
        var normalized = bookerPhone.value.trim().replace(/[\s().-]/g, "");
        var pErr = /^\+?\d{9,12}$/.test(normalized) ? "" : "Số điện thoại người đặt cần 9 đến 12 chữ số.";
        ui.setFieldError(bookerPhone, document.getElementById("bookerPhoneError"), pErr);
        if (pErr) {
          errors.push({ id: "bookerPhone", message: pErr });
        }
      }
      if (bookerEmail && bookerEmail.value.trim()) {
        var eErr = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(bookerEmail.value.trim()) ? "" : "Email người đặt chưa đúng định dạng.";
        ui.setFieldError(bookerEmail, document.getElementById("bookerEmailError"), eErr);
        if (eErr) {
          errors.push({ id: "bookerEmail", message: eErr });
        }
      }

      guests.forEach(function (g, idx) {
        var num = idx + 1;
        var gNameEl = document.getElementById("guestName" + num);
        var gTypeEl = document.getElementById("guestType" + num);
        var gIdEl = document.getElementById("guestId" + num);
        var gAddrEl = document.getElementById("guestAddress" + num);

        if (gNameEl) {
          var m1 = gNameEl.value.trim() ? "" : "Khách thứ " + num + ": Vui lòng nhập họ tên.";
          ui.setFieldError(gNameEl, document.getElementById("guestName" + num + "Error"), m1);
          if (m1) {
            errors.push({ id: gNameEl.id, message: m1 });
          }
        }
        if (gTypeEl) {
          var m2 = gTypeEl.value ? "" : "Khách thứ " + num + ": Vui lòng chọn loại khách.";
          ui.setFieldError(gTypeEl, document.getElementById("guestType" + num + "Error"), m2);
          if (m2) {
            errors.push({ id: gTypeEl.id, message: m2 });
          }
        }
        if (gIdEl) {
          var idVal = gIdEl.value.trim();
          var m3 = !idVal ? "Khách thứ " + num + ": Vui lòng nhập CMND/CCCD/Hộ chiếu." : (idVal.length < 6 ? "Khách thứ " + num + ": Giấy tờ tùy thân cần tối thiểu 6 ký tự." : "");
          ui.setFieldError(gIdEl, document.getElementById("guestId" + num + "Error"), m3);
          if (m3) {
            errors.push({ id: gIdEl.id, message: m3 });
          }
        }
        if (gAddrEl) {
          var m4 = gAddrEl.value.trim() ? "" : "Khách thứ " + num + ": Vui lòng nhập địa chỉ.";
          ui.setFieldError(gAddrEl, document.getElementById("guestAddress" + num + "Error"), m4);
          if (m4) {
            errors.push({ id: gAddrEl.id, message: m4 });
          }
        }
      });

      return errors;
    }

    function buildGuestCard(guest, idx) {
      var num = idx + 1;
      var block = document.createElement("div");
      block.className = "gl-guest-block";

      var head = document.createElement("div");
      head.className = "gl-guest-block__head";
      var h3 = document.createElement("h3");
      h3.className = "mb-0";
      h3.textContent = "Khách thứ " + num;
      head.appendChild(h3);

      if (num >= 2 && guests.length > 1) {
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "gl-btn gl-btn--sm gl-btn-danger-outline";
        delBtn.textContent = "Xóa";
        delBtn.addEventListener("click", function () {
          guests.splice(idx, 1);
          if (guestsSelect && guestsSelect.querySelector('option[value="' + guests.length + '"]')) {
            guestsSelect.value = String(guests.length);
          }
          renderGuestCards();
        });
        head.appendChild(delBtn);
      }

      var body = document.createElement("div");
      body.className = "gl-guest-block__body";
      var row = document.createElement("div");
      row.className = "row g-3";

      row.appendChild(makeInputCol("col-12 col-md-6", "guestName" + num, "Họ tên", "text", guest.name, function (v) {
        guests[idx].name = v;
        updateSummaryAndReview();
      }));
      row.appendChild(makeSelectCol("col-12 col-md-6", "guestType" + num, "Loại khách", guest.type, function (v) {
        guests[idx].type = v;
        updateSummaryAndReview();
      }));
      row.appendChild(makeInputCol("col-12 col-md-5", "guestId" + num, "CMND / CCCD / Hộ chiếu", "text", guest.idNumber, function (v) {
        guests[idx].idNumber = v;
        updateSummaryAndReview();
      }));
      row.appendChild(makeInputCol("col-12 col-md-7", "guestAddress" + num, "Địa chỉ", "text", guest.address, function (v) {
        guests[idx].address = v;
        updateSummaryAndReview();
      }));

      body.appendChild(row);
      block.appendChild(head);
      block.appendChild(body);
      return block;
    }

    function makeInputCol(colCls, id, labelText, type, val, onInput) {
      var col = document.createElement("div");
      col.className = colCls;
      var label = document.createElement("label");
      label.className = "gl-label";
      label.htmlFor = id;
      label.innerHTML = labelText + ' <span class="gl-required-mark">*</span>';
      var input = document.createElement("input");
      input.id = id;
      input.type = type;
      input.className = "form-control gl-input";
      input.value = val || "";
      input.setAttribute("aria-describedby", id + "Error");
      input.addEventListener("input", function () {
        onInput(input.value);
      });
      var err = document.createElement("p");
      err.id = id + "Error";
      err.className = "gl-field-error";
      err.hidden = true;
      col.appendChild(label);
      col.appendChild(input);
      col.appendChild(err);
      return col;
    }

    function makeSelectCol(colCls, id, labelText, val, onChange) {
      var col = document.createElement("div");
      col.className = colCls;
      var label = document.createElement("label");
      label.className = "gl-label";
      label.htmlFor = id;
      label.innerHTML = labelText + ' <span class="gl-required-mark">*</span>';
      var select = document.createElement("select");
      select.id = id;
      select.className = "form-select gl-select";
      select.setAttribute("aria-describedby", id + "Error");
      [
        { value: "", text: "Chọn loại khách" },
        { value: "domestic", text: "Nội địa" },
        { value: "foreign", text: "Nước ngoài" }
      ].forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.text;
        if (opt.value === val) {
          o.selected = true;
        }
        select.appendChild(o);
      });
      select.addEventListener("change", function () {
        onChange(select.value);
      });
      var err = document.createElement("p");
      err.id = id + "Error";
      err.className = "gl-field-error";
      err.hidden = true;
      col.appendChild(label);
      col.appendChild(select);
      col.appendChild(err);
      return col;
    }

    function renderGuestCards() {
      if (!guestContainer) {
        return;
      }
      while (guestContainer.firstChild) {
        guestContainer.removeChild(guestContainer.firstChild);
      }
      guests.forEach(function (g, idx) {
        guestContainer.appendChild(buildGuestCard(g, idx));
      });
      if (addGuestBtn) {
        addGuestBtn.disabled = guests.length >= maxGuests;
      }
      if (guestLimitHint) {
        guestLimitHint.textContent = guests.length >= maxGuests ? "Đã đạt số khách tối đa (" + maxGuests + " khách)." : "";
      }
      updateSummaryAndReview();
    }

    setupDate(checkInInput, {
      visibleId: "c01CheckInVisible",
      minDate: bookingDate,
      maxLimitDate: maxCheckInDate,
      onDateChange: function () {
        var ci = readIso(checkInInput);
        if (coPicker && dateUtils.parseIsoDateParts(ci)) {
          coPicker.set("minDate", dateUtils.addDaysIso(ci, 1));
        }
        updateSummaryAndReview();
      }
    });

    coPicker = setupDate(checkOutInput, {
      visibleId: "c01CheckOutVisible",
      minDate: dateUtils.addDaysIso(bookingDate, 1),
      onDateChange: updateSummaryAndReview
    });

    if (roomSelect) {
      roomSelect.addEventListener("change", updateSummaryAndReview);
    }

    if (guestsSelect) {
      guestsSelect.addEventListener("change", function () {
        var desired = Math.min(Math.max(parseInt(guestsSelect.value || "1", 10), 1), maxGuests);
        while (guests.length < desired) {
          guests.push({ name: "", type: "", idNumber: "", address: "" });
        }
        if (guests.length > desired) {
          guests.length = desired;
        }
        renderGuestCards();
      });
    }

    if (addGuestBtn) {
      addGuestBtn.addEventListener("click", function () {
        if (guests.length < maxGuests) {
          guests.push({ name: "", type: "", idNumber: "", address: "" });
          if (guestsSelect && guestsSelect.querySelector('option[value="' + guests.length + '"]')) {
            guestsSelect.value = String(guests.length);
          }
          renderGuestCards();
        }
      });
    }

    if (bookerIsGuest1 && bookerName) {
      var syncBooker = function () {
        if (bookerIsGuest1.checked && guests.length > 0) {
          guests[0].name = bookerName.value.trim();
          var g1 = document.getElementById("guestName1");
          if (g1) {
            g1.value = bookerName.value;
          }
          updateSummaryAndReview();
        }
      };
      bookerIsGuest1.addEventListener("change", syncBooker);
      bookerName.addEventListener("input", syncBooker);
    }

    document.querySelectorAll("[data-gl-step-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetStep = parseInt(btn.getAttribute("data-gl-step-next"), 10);
        var errs = currentStep === 1 ? validateStep1() : (currentStep === 2 ? validateStep2() : []);
        if (errs.length > 0) {
          ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, errs);
          return;
        }
        showStep(targetStep);
      });
    });

    document.querySelectorAll("[data-gl-step-prev]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetStep = parseInt(btn.getAttribute("data-gl-step-prev"), 10);
        showStep(targetStep);
      });
    });

    form.addEventListener("submit", function (event) {
      var errs = validateStep1().concat(validateStep2());
      if (errs.length > 0) {
        event.preventDefault();
        ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, errs);
        return;
      }

      if (!submitUrl) {
        event.preventDefault();
        if (unavailableAlert) {
          unavailableAlert.hidden = false;
          unavailableAlert.focus();
        }
        return;
      }

      var confirmBtn = document.getElementById("confirmBookingBtn");
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Đang gửi…";
      }
    });

    renderGuestCards();
    showStep(currentStep);
  }

  document.addEventListener("DOMContentLoaded", initBookingWizard);
})();
