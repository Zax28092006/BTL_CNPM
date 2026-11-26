/* Staff Operations (S01-S05) — Lookup, Flatpickr d/m/Y, Direct Guest Check-in, Slip Drawer, Counter Payment */
(function () {
  "use strict";

  var dateUtils = window.ValentiaDateUtils;
  var ui = window.ValentiaUi;

  function initSimpleToolbarFallback(formId, noticeId, inputId, errorId, emptyMsg) {
    var form = document.getElementById(formId);
    if (!form || !ui) {
      return;
    }
    var noticeEl = noticeId ? document.getElementById(noticeId) : null;
    var inputEl = inputId ? document.getElementById(inputId) : null;
    var errorEl = errorId ? document.getElementById(errorId) : null;

    form.addEventListener("submit", function (event) {
      if (inputEl && errorEl && emptyMsg) {
        if (!inputEl.value.trim()) {
          event.preventDefault();
          ui.setFieldError(inputEl, errorEl, emptyMsg);
          inputEl.focus();
          return;
        }
        ui.setFieldError(inputEl, errorEl, "");
      }
      var actionUrl = (form.getAttribute("action") || "").trim();
      if (!actionUrl) {
        event.preventDefault();
        if (noticeEl) {
          noticeEl.hidden = false;
        }
      }
    });
  }

  function initBookingLookupExtras() {
    initSimpleToolbarFallback(
      "s01LookupForm",
      "s01LookupNotice",
      "s01SearchKw",
      "s01SearchKwError",
      "Vui lòng nhập họ tên, mã phiếu, SĐT hoặc CCCD để tra cứu."
    );
    var walkInFallbackBtn = document.getElementById("s01WalkInFallbackBtn");
    var walkInNotice = document.getElementById("s01WalkInNotice");
    if (walkInFallbackBtn && walkInNotice) {
      walkInFallbackBtn.addEventListener("click", function () {
        walkInNotice.hidden = false;
      });
    }
  }

  function bindFlatpickrPair(displayId, hiddenId, defaultIso, minIso, onIsoChange) {
    var displayEl = document.getElementById(displayId);
    var hiddenEl = document.getElementById(hiddenId);
    if (!displayEl || !hiddenEl || !dateUtils) {
      return null;
    }

    var initIso = (hiddenEl.value || "").trim() || defaultIso || "";
    if (initIso) {
      hiddenEl.value = initIso;
      displayEl.value = dateUtils.formatDateVi(initIso);
    }

    var fp = null;
    if (typeof window.flatpickr === "function") {
      fp = window.flatpickr(displayEl, {
        dateFormat: "d/m/Y",
        locale: (window.flatpickr.l10ns && window.flatpickr.l10ns.vn) ? window.flatpickr.l10ns.vn : "default",
        allowInput: true,
        disableMobile: true,
        minDate: minIso ? dateUtils.formatDateVi(minIso) : undefined,
        defaultDate: initIso ? dateUtils.formatDateVi(initIso) : undefined,
        onChange: function (selectedDates) {
          var iso = selectedDates && selectedDates.length ? dateUtils.dateObjToIso(selectedDates[0]) : "";
          hiddenEl.value = iso;
          if (typeof onIsoChange === "function") {
            onIsoChange(iso);
          }
        }
      });
    }

    displayEl.addEventListener("change", function () {
      var parsed = dateUtils.parseDisplayDateViToIso(displayEl.value);
      hiddenEl.value = parsed;
      if (!displayEl.value.trim()) {
        hiddenEl.value = "";
      }
      if (typeof onIsoChange === "function") {
        onIsoChange(hiddenEl.value);
      }
    });

    document.querySelectorAll('[data-gl-open-picker="' + displayId + '"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (fp) {
          fp.open();
        } else {
          displayEl.focus();
        }
      });
    });

    return fp;
  }

  function initCreateRentalSlip() {
    var walkInForm = document.getElementById("walkInRentalForm");
    var bookedForm = document.getElementById("bookedRentalForm");
    if (!ui || !dateUtils) {
      return;
    }

    if (bookedForm) {
      bookedForm.addEventListener("submit", function (event) {
        var actionUrl = (bookedForm.getAttribute("action") || "").trim();
        if (!actionUrl) {
          event.preventDefault();
          var notice = document.getElementById("s02BookedUnavailable");
          if (notice) {
            notice.hidden = false;
            notice.focus();
          }
        }
      });
    }

    var isDirty = false;
    document.querySelectorAll("[data-gl-cancel-rental]").forEach(function (cancelLink) {
      cancelLink.addEventListener("click", function (event) {
        if (!isDirty) {
          return;
        }
        event.preventDefault();
        var modalEl = document.getElementById("s02CancelConfirmModal");
        var leaveLink = document.getElementById("s02ConfirmLeaveLink");
        if (leaveLink) {
          leaveLink.href = cancelLink.getAttribute("href") || "/";
        }
        if (modalEl && window.bootstrap && window.bootstrap.Modal) {
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
      });
    });

    if (!walkInForm) {
      return;
    }

    var todayIso = dateUtils.getTodayIso();
    var checkOutPicker = bindFlatpickrPair("walkInCheckOutDisplay", "walkInCheckOut", "", todayIso, function () {
      isDirty = true;
    });
    bindFlatpickrPair("walkInCheckInDisplay", "walkInCheckIn", todayIso, todayIso, function (ciIso) {
      isDirty = true;
      if (checkOutPicker && ciIso) {
        checkOutPicker.set("minDate", dateUtils.formatDateVi(dateUtils.addDaysIso(ciIso, 1)));
      }
    });

    var maxGuests = parseInt(walkInForm.getAttribute("data-gl-max-guests") || "3", 10);
    var container = document.getElementById("walkInGuestsContainer");
    var addBtn = document.getElementById("walkInAddGuestBtn");
    var hintEl = document.getElementById("walkInGuestHint");
    var jsonField = document.getElementById("walkInGuestsJson");
    var summaryBox = document.getElementById("s02ErrorSummary");
    var summaryTitle = document.getElementById("s02ErrorSummaryTitle");
    var summaryList = document.getElementById("s02ErrorSummaryList");
    var guests = [{ name: "", type: "", idNumber: "", address: "" }];

    function syncJson() {
      if (jsonField) {
        jsonField.value = JSON.stringify(guests);
      }
    }

    function renderGuests() {
      if (!container) {
        return;
      }
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      guests.forEach(function (g, idx) {
        var num = idx + 1;
        var block = document.createElement("div");
        block.className = "gl-guest-block";

        var head = document.createElement("div");
        head.className = "gl-guest-block__head";
        var h = document.createElement("h3");
        h.className = "mb-0";
        h.textContent = "Khách thứ " + num;
        head.appendChild(h);

        if (num >= 2) {
          var rm = document.createElement("button");
          rm.type = "button";
          rm.className = "gl-btn gl-btn--sm gl-btn-danger-outline";
          rm.textContent = "Xóa";
          rm.addEventListener("click", function () {
            isDirty = true;
            guests.splice(idx, 1);
            renderGuests();
          });
          head.appendChild(rm);
        }

        var body = document.createElement("div");
        body.className = "gl-guest-block__body";
        body.innerHTML =
          '<div class="row g-3">' +
          '<div class="col-12 col-md-6"><label class="gl-label" for="wGuestName' + num + '">Họ tên <span class="gl-required-mark">*</span></label><input id="wGuestName' + num + '" type="text" class="form-control gl-input"><p id="wGuestNameErr' + num + '" class="gl-field-error" hidden></p></div>' +
          '<div class="col-12 col-md-6"><label class="gl-label" for="wGuestType' + num + '">Loại khách <span class="gl-required-mark">*</span></label><select id="wGuestType' + num + '" class="form-select gl-select"><option value="">Chọn loại khách</option><option value="domestic">Nội địa</option><option value="foreign">Nước ngoài</option></select><p id="wGuestTypeErr' + num + '" class="gl-field-error" hidden></p></div>' +
          '<div class="col-12 col-md-5"><label class="gl-label" for="wGuestId' + num + '">CMND / CCCD / Hộ chiếu <span class="gl-required-mark">*</span></label><input id="wGuestId' + num + '" type="text" class="form-control gl-input gl-tabular"><p id="wGuestIdErr' + num + '" class="gl-field-error" hidden></p></div>' +
          '<div class="col-12 col-md-7"><label class="gl-label" for="wGuestAddr' + num + '">Địa chỉ <span class="gl-required-mark">*</span></label><input id="wGuestAddr' + num + '" type="text" class="form-control gl-input"><p id="wGuestAddrErr' + num + '" class="gl-field-error" hidden></p></div>' +
          '</div>';

        block.appendChild(head);
        block.appendChild(body);
        container.appendChild(block);

        var nameEl = document.getElementById("wGuestName" + num);
        var typeEl = document.getElementById("wGuestType" + num);
        var idEl = document.getElementById("wGuestId" + num);
        var addrEl = document.getElementById("wGuestAddr" + num);
        if (nameEl) {
          nameEl.value = g.name;
          nameEl.addEventListener("input", function () { isDirty = true; g.name = nameEl.value; syncJson(); });
        }
        if (typeEl) {
          typeEl.value = g.type;
          typeEl.addEventListener("change", function () { isDirty = true; g.type = typeEl.value; syncJson(); });
        }
        if (idEl) {
          idEl.value = g.idNumber;
          idEl.addEventListener("input", function () { isDirty = true; g.idNumber = idEl.value; syncJson(); });
        }
        if (addrEl) {
          addrEl.value = g.address;
          addrEl.addEventListener("input", function () { isDirty = true; g.address = addrEl.value; syncJson(); });
        }
      });

      if (addBtn) {
        addBtn.disabled = guests.length >= maxGuests;
      }
      if (hintEl) {
        hintEl.textContent = guests.length >= maxGuests ? "Đã đạt giới hạn tối đa " + maxGuests + " khách." : "";
      }
      syncJson();
    }

    walkInForm.addEventListener("input", function () {
      isDirty = true;
    });
    walkInForm.addEventListener("change", function () {
      isDirty = true;
    });

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (guests.length < maxGuests) {
          isDirty = true;
          guests.push({ name: "", type: "", idNumber: "", address: "" });
          renderGuests();
        }
      });
    }

    walkInForm.addEventListener("submit", function (event) {
      var errors = [];
      var roomEl = document.getElementById("walkInRoom");
      var custNameEl = document.getElementById("walkInCustomerName");
      var custPhoneEl = document.getElementById("walkInCustomerPhone");
      var ciDisplayEl = document.getElementById("walkInCheckInDisplay");
      var ciHiddenEl = document.getElementById("walkInCheckIn");
      var coDisplayEl = document.getElementById("walkInCheckOutDisplay");
      var coHiddenEl = document.getElementById("walkInCheckOut");

      var roomVal = roomEl ? roomEl.value.trim() : "";
      ui.setFieldError(roomEl, document.getElementById("walkInRoomError"), roomVal ? "" : "Vui lòng chọn phòng nhận.");
      if (!roomVal && roomEl) {
        errors.push({ targetId: "walkInRoom", message: "Vui lòng chọn phòng nhận." });
      }

      var cNameVal = custNameEl ? custNameEl.value.trim() : "";
      ui.setFieldError(custNameEl, document.getElementById("walkInCustomerNameError"), cNameVal ? "" : "Vui lòng nhập họ tên khách đại diện.");
      if (!cNameVal && custNameEl) {
        errors.push({ targetId: "walkInCustomerName", message: "Vui lòng nhập họ tên khách đại diện." });
      }

      var cPhoneVal = custPhoneEl ? custPhoneEl.value.trim() : "";
      var phoneOk = /^\d{9,11}$/.test(cPhoneVal);
      var phoneErr = !cPhoneVal ? "Vui lòng nhập số điện thoại." : (phoneOk ? "" : "Số điện thoại phải gồm 9–11 chữ số.");
      ui.setFieldError(custPhoneEl, document.getElementById("walkInCustomerPhoneError"), phoneErr);
      if (phoneErr && custPhoneEl) {
        errors.push({ targetId: "walkInCustomerPhone", message: phoneErr });
      }

      var ciIso = ciHiddenEl ? ciHiddenEl.value.trim() : "";
      if (!ciIso && ciDisplayEl && ciDisplayEl.value.trim()) {
        ciIso = dateUtils.parseDisplayDateViToIso(ciDisplayEl.value);
        if (ciHiddenEl) {
          ciHiddenEl.value = ciIso;
        }
      }
      ui.setFieldError(ciDisplayEl, document.getElementById("walkInCheckInError"), ciIso ? "" : "Vui lòng chọn ngày nhận phòng hợp lệ (dd/mm/yyyy).");
      if (!ciIso && ciDisplayEl) {
        errors.push({ targetId: "walkInCheckInDisplay", message: "Vui lòng chọn ngày nhận phòng hợp lệ (dd/mm/yyyy)." });
      }

      var coIso = coHiddenEl ? coHiddenEl.value.trim() : "";
      if (!coIso && coDisplayEl && coDisplayEl.value.trim()) {
        coIso = dateUtils.parseDisplayDateViToIso(coDisplayEl.value);
        if (coHiddenEl) {
          coHiddenEl.value = coIso;
        }
      }
      var coErr = "";
      if (!coIso) {
        coErr = "Vui lòng chọn ngày trả phòng hợp lệ (dd/mm/yyyy).";
      } else if (ciIso && dateUtils.computeNightCount(ciIso, coIso) <= 0) {
        coErr = "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.";
      }
      ui.setFieldError(coDisplayEl, document.getElementById("walkInCheckOutError"), coErr);
      if (coErr && coDisplayEl) {
        errors.push({ targetId: "walkInCheckOutDisplay", message: coErr });
      }

      guests.forEach(function (g, idx) {
        var num = idx + 1;
        var nEl = document.getElementById("wGuestName" + num);
        var tEl = document.getElementById("wGuestType" + num);
        var iEl = document.getElementById("wGuestId" + num);
        var aEl = document.getElementById("wGuestAddr" + num);

        var nOk = g.name.trim().length > 0;
        ui.setFieldError(nEl, document.getElementById("wGuestNameErr" + num), nOk ? "" : "Nhập họ tên khách thứ " + num + ".");
        if (!nOk) { errors.push({ targetId: "wGuestName" + num, message: "Khách thứ " + num + ": Thiếu họ tên." }); }

        var tOk = g.type.trim().length > 0;
        ui.setFieldError(tEl, document.getElementById("wGuestTypeErr" + num), tOk ? "" : "Chọn loại khách thứ " + num + ".");
        if (!tOk) { errors.push({ targetId: "wGuestType" + num, message: "Khách thứ " + num + ": Chưa chọn loại khách." }); }

        var iOk = g.idNumber.trim().length > 0;
        ui.setFieldError(iEl, document.getElementById("wGuestIdErr" + num), iOk ? "" : "Nhập CMND/CCCD/Hộ chiếu khách thứ " + num + ".");
        if (!iOk) { errors.push({ targetId: "wGuestId" + num, message: "Khách thứ " + num + ": Thiếu số giấy tờ tùy thân." }); }

        var aOk = g.address.trim().length > 0;
        ui.setFieldError(aEl, document.getElementById("wGuestAddrErr" + num), aOk ? "" : "Nhập địa chỉ khách thứ " + num + ".");
        if (!aOk) { errors.push({ targetId: "wGuestAddr" + num, message: "Khách thứ " + num + ": Thiếu địa chỉ." }); }
      });

      syncJson();

      if (errors.length) {
        event.preventDefault();
        ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, errors);
        return;
      }
      ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, []);

      var actionUrl = (walkInForm.getAttribute("action") || "").trim();
      if (!actionUrl) {
        event.preventDefault();
        var box = document.getElementById("s02SubmitUnavailable");
        if (box) {
          box.hidden = false;
          box.focus();
        }
      }
    });

    renderGuests();
  }

  function initRentalSlipsPage() {
    initSimpleToolbarFallback("s03FilterForm", "s03FilterNotice", null, null, null);
    bindFlatpickrPair("s03DateDisplay", "s03Date", "", null, null);

    var drawer = document.getElementById("rentalDetailDrawer");
    var closeBtn = document.getElementById("closeRentalDrawerBtn");
    if (!drawer) {
      return;
    }

    var lastTrigger = null;

    function closeDrawer() {
      drawer.hidden = true;
      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    document.querySelectorAll("[data-gl-open-slip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        lastTrigger = btn;
        var raw = btn.getAttribute("data-gl-slip") || "{}";
        var slip = {};
        try {
          slip = JSON.parse(raw);
        } catch (err) {
          slip = {};
        }
        setText("drawerSlipCode", slip.code || "—");
        setText("drawerSlipGuest", slip.customer_name || "—");
        setText("drawerSlipRoom", slip.room_name || "—");
        setText("drawerSlipDates", (slip.check_in_display || "—") + " – " + (slip.check_out_display || "—"));
        setText("drawerSlipGuestCount", slip.guest_count !== undefined && slip.guest_count !== null ? String(slip.guest_count) : "—");
        setText("drawerSlipPayStatus", slip.payment_status_label || "—");
        setText("drawerSlipRentalStatus", slip.rental_status_label || "—");

        var totalRow = document.getElementById("drawerSlipTotalRow");
        if (totalRow) {
          if (slip.total_display) {
            setText("drawerSlipTotal", slip.total_display);
            totalRow.hidden = false;
          } else {
            totalRow.hidden = true;
          }
        }

        var guestsSec = document.getElementById("drawerSlipGuestsSection");
        var guestsUl = document.getElementById("drawerSlipGuestsList");
        if (guestsSec && guestsUl) {
          while (guestsUl.firstChild) {
            guestsUl.removeChild(guestsUl.firstChild);
          }
          if (Array.isArray(slip.guests) && slip.guests.length) {
            slip.guests.forEach(function (g) {
              var li = document.createElement("li");
              li.textContent = (g.name || "—") + (g.type_label ? " (" + g.type_label + ")" : "") + (g.id_number ? " — " + g.id_number : "");
              guestsUl.appendChild(li);
            });
            guestsSec.hidden = false;
          } else {
            guestsSec.hidden = true;
          }
        }

        var payLink = document.getElementById("drawerPayLink");
        if (payLink) {
          if (slip.payment_url) {
            payLink.href = slip.payment_url;
            payLink.hidden = false;
          } else {
            payLink.hidden = true;
          }
        }
        drawer.hidden = false;
        if (closeBtn) {
          closeBtn.focus();
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeDrawer);
    }
    drawer.addEventListener("click", function (event) {
      if (event.target === drawer) {
        closeDrawer();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !drawer.hidden) {
        closeDrawer();
      }
    });
  }

  function initCounterPaymentPage() {
    initSimpleToolbarFallback(
      "s04LookupForm",
      "s04LookupNotice",
      "s04Lookup",
      "s04LookupError",
      "Vui lòng nhập mã phiếu thuê, mã hóa đơn hoặc tên khách."
    );

    var form = document.getElementById("counterPaymentForm");
    if (!form) {
      return;
    }
    var submitBtn = document.getElementById("confirmCounterPayBtn");
    var errBox = document.getElementById("counterPaymentError");
    var payNotice = document.getElementById("s04PayNotice");
    var modalEl = document.getElementById("confirmCounterPayModal");
    var proceedBtn = document.getElementById("modalCounterPayProceedBtn");
    var amountField = document.getElementById("counterAmountDue");
    var modalAmountEl = document.getElementById("modalCounterAmount");
    var modalMethodEl = document.getElementById("modalCounterMethod");
    var confirmedSubmit = false;

    form.addEventListener("submit", function (event) {
      if (confirmedSubmit) {
        return;
      }
      var chosen = form.querySelector('input[name="payment_method"]:checked');
      if (!chosen) {
        event.preventDefault();
        if (errBox) {
          errBox.textContent = "Vui lòng chọn phương thức thanh toán (Tiền mặt hoặc Chuyển khoản ngân hàng).";
          errBox.hidden = false;
        }
        return;
      }
      if (errBox) {
        errBox.hidden = true;
      }

      event.preventDefault();
      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        if (modalAmountEl && amountField) {
          modalAmountEl.textContent = amountField.value || "—";
        }
        if (modalMethodEl) {
          modalMethodEl.textContent = chosen.value === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Tiền mặt";
        }
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      } else {
        handleCounterProceed();
      }
    });

    function handleCounterProceed() {
      var actionUrl = (form.getAttribute("action") || "").trim();
      if (!actionUrl) {
        if (payNotice) {
          payNotice.hidden = false;
        }
        return;
      }
      confirmedSubmit = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang ghi nhận…";
      }
      form.submit();
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", function () {
        if (modalEl && window.bootstrap && window.bootstrap.Modal) {
          window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
        handleCounterProceed();
      });
    }
  }

  function initInvoicesPage() {
    initSimpleToolbarFallback("s05SearchForm", "s05SearchNotice", null, null, null);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = val;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBookingLookupExtras();
    initCreateRentalSlip();
    initRentalSlipsPage();
    initCounterPaymentPage();
    initInvoicesPage();
  });
})();
