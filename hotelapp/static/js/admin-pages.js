/* Admin Management (A01 Room CRUD, A02 Rules, A03/A04 Reports, A05 Employees) */
(function () {
  "use strict";

  var ui = window.ValentiaUi;

  function initSimpleAdminToolbar(formId, noticeId, yearInputId, yearErrId) {
    var form = document.getElementById(formId);
    if (!form || !ui) {
      return;
    }
    var noticeEl = noticeId ? document.getElementById(noticeId) : null;
    var yearInput = yearInputId ? document.getElementById(yearInputId) : null;
    var yearErr = yearErrId ? document.getElementById(yearErrId) : null;

    form.addEventListener("submit", function (event) {
      if (yearInput && yearErr) {
        var yrRaw = yearInput.value.trim();
        if (yrRaw) {
          var yrNum = parseInt(yrRaw, 10);
          if (isNaN(yrNum) || yrNum < 2020 || yrNum > 2100) {
            event.preventDefault();
            ui.setFieldError(yearInput, yearErr, "Năm báo cáo phải nằm trong khoảng 2020–2100.");
            yearInput.focus();
            return;
          }
        }
        ui.setFieldError(yearInput, yearErr, "");
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

  function initRoomManagement() {
    initSimpleAdminToolbar("a01FilterForm", "a01FilterNotice", null, null);

    var drawer = document.getElementById("roomEditorDrawer");
    var form = document.getElementById("roomEditorForm");
    var closeBtn = document.getElementById("closeRoomDrawerBtn");
    var addBtn = document.getElementById("openAddRoomBtn");
    var saveNotice = document.getElementById("a01RoomSaveNotice");
    if (!drawer || !form) {
      return;
    }

    var lastTrigger = null;

    function openDrawer(mode, roomData, actionUrl, triggerEl) {
      lastTrigger = triggerEl || null;
      var titleEl = document.getElementById("roomDrawerTitle");
      if (titleEl) {
        titleEl.textContent = mode === "edit" ? "Chỉnh sửa thông tin phòng" : "Thêm phòng mới";
      }
      if (saveNotice) {
        saveNotice.hidden = true;
      }
      form.action = actionUrl || "";
      setVal("roomFieldName", roomData.name || "");
      setVal("roomFieldPrice", roomData.price !== undefined && roomData.price !== null ? String(roomData.price) : "");
      setVal("roomFieldState", roomData.state || "AVAILABLE");
      setVal("roomFieldSize", roomData.size !== undefined && roomData.size !== null ? String(roomData.size) : "");
      setVal("roomFieldFloor", roomData.floor_chua !== undefined && roomData.floor_chua !== null ? String(roomData.floor_chua) : "");
      setVal("roomFieldGuests", roomData.guest_count !== undefined && roomData.guest_count !== null ? String(roomData.guest_count) : "");
      setVal("roomFieldDesc", roomData.description || "");
      renderDrawerGallery(roomData);
      drawer.hidden = false;
      var first = document.getElementById("roomFieldName");
      if (first) {
        first.focus();
      }
    }

    function renderDrawerGallery(roomData) {
      var wrap = document.getElementById("drawerGalleryPreview");
      if (!wrap) {
        return;
      }
      while (wrap.firstChild) {
        wrap.removeChild(wrap.firstChild);
      }
      var imgs = Array.isArray(roomData.images) ? roomData.images : (roomData.image_url ? [{ url: roomData.image_url, alt: roomData.name }] : []);
      if (!imgs.length) {
        var empty = document.createElement("p");
        empty.className = "gl-helper mb-0";
        empty.textContent = "Chưa có ảnh gắn với bản ghi này.";
        wrap.appendChild(empty);
        return;
      }
      imgs.forEach(function (img, idx) {
        if (!img || !img.url) { return; }
        var card = document.createElement("div");
        card.className = "gl-a01-thumb-card" + (idx === 0 ? " is-cover" : "");
        var el = document.createElement("img");
        el.src = img.url;
        el.alt = img.alt || roomData.name || "Ảnh phòng";
        card.appendChild(el);
        var act = document.createElement("div");
        act.className = "gl-a01-thumb-card__actions";
        var lbl = document.createElement("span");
        lbl.textContent = idx === 0 ? "Ảnh bìa" : ("Ảnh #" + (idx + 1));
        act.appendChild(lbl);
        card.appendChild(act);
        wrap.appendChild(card);
      });
    }

    function closeDrawer() {
      drawer.hidden = true;
      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        openDrawer("create", {}, addBtn.getAttribute("data-gl-create-url") || "", addBtn);
      });
    }

    document.querySelectorAll("[data-gl-edit-room]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var raw = btn.getAttribute("data-gl-room") || "{}";
        var roomObj = {};
        try {
          roomObj = JSON.parse(raw);
        } catch (err) {
          roomObj = {};
        }
        openDrawer("edit", roomObj, btn.getAttribute("data-gl-update-url") || "", btn);
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

    form.addEventListener("submit", function (event) {
      if (!ui) {
        return;
      }
      var hasError = false;
      var nameInput = document.getElementById("roomFieldName");
      var priceInput = document.getElementById("roomFieldPrice");
      var guestsInput = document.getElementById("roomFieldGuests");

      if (nameInput) {
        var nameMsg = nameInput.value.trim() ? "" : "Tên phòng không được để trống.";
        ui.setFieldError(nameInput, document.getElementById("roomFieldNameError"), nameMsg);
        if (nameMsg) {
          hasError = true;
        }
      }
      if (priceInput && priceInput.value.trim()) {
        var pNum = Number(priceInput.value);
        var pMsg = isNaN(pNum) || pNum < 0 ? "Đơn giá không hợp lệ." : "";
        ui.setFieldError(priceInput, document.getElementById("roomFieldPriceError"), pMsg);
        if (pMsg) {
          hasError = true;
        }
      }
      if (guestsInput && guestsInput.value.trim()) {
        var gNum = Number(guestsInput.value);
        var gMsg = isNaN(gNum) || gNum < 1 ? "Số khách phải lớn hơn 0." : "";
        ui.setFieldError(guestsInput, document.getElementById("roomFieldGuestsError"), gMsg);
        if (gMsg) {
          hasError = true;
        }
      }

      if (hasError) {
        event.preventDefault();
        return;
      }

      var actionUrl = (form.getAttribute("action") || "").trim();
      if (!actionUrl) {
        event.preventDefault();
        if (saveNotice) {
          saveNotice.hidden = false;
        }
      }
    });

    var deleteForm = document.getElementById("deleteRoomForm");
    var deleteRoomLabel = document.getElementById("deleteRoomName");
    var deleteNotice = document.getElementById("a01DeleteNotice");
    if (deleteForm) {
      document.querySelectorAll("[data-gl-delete-room]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          deleteForm.action = btn.getAttribute("data-gl-delete-url") || "";
          if (deleteRoomLabel) {
            deleteRoomLabel.textContent = btn.getAttribute("data-gl-room-name") || "phòng này";
          }
          if (deleteNotice) {
            deleteNotice.hidden = true;
          }
        });
      });
      deleteForm.addEventListener("submit", function (event) {
        if (!(deleteForm.getAttribute("action") || "").trim()) {
          event.preventDefault();
          if (deleteNotice) {
            deleteNotice.hidden = false;
          }
        }
      });
    }

    initAdminAddRoomAndGallery();
    initAdminPriceManagement();
    initAdminPromotionManagement();
  }

  function initAdminAddRoomAndGallery() {
    var addForm = document.getElementById("a01CreateRoomForm");
    if (!addForm || !ui) {
      return;
    }
    var fileInput = document.getElementById("addRoomGalleryFiles");
    var fileErr = document.getElementById("addRoomGalleryError");
    var previewWrap = document.getElementById("addRoomGalleryPreview");
    var priceInput = document.getElementById("addRoomPrice");
    var pricePreview = document.getElementById("addRoomPricePreview");
    var addNotice = document.getElementById("a01AddRoomNotice");
    var stagedFiles = [];
    var coverIndex = 0;

    function refreshPriceFormat() {
      if (!priceInput || !pricePreview) {
        return;
      }
      var val = Number(priceInput.value);
      if (priceInput.value.trim() && Number.isFinite(val) && val >= 0 && window.ValentiaPrice) {
        pricePreview.textContent = "Định dạng hiển thị: " + window.ValentiaPrice.formatVnd(val) + " / đêm";
      } else {
        pricePreview.textContent = "";
      }
    }
    if (priceInput) {
      priceInput.addEventListener("input", refreshPriceFormat);
    }

    function renderStagedGallery() {
      if (!previewWrap) {
        return;
      }
      while (previewWrap.firstChild) {
        previewWrap.removeChild(previewWrap.firstChild);
      }
      if (!stagedFiles.length) {
        previewWrap.hidden = true;
        return;
      }
      if (coverIndex >= stagedFiles.length) {
        coverIndex = 0;
      }
      previewWrap.hidden = false;
      stagedFiles.forEach(function (item, idx) {
        var card = document.createElement("div");
        card.className = "gl-a01-thumb-card" + (idx === coverIndex ? " is-cover" : "");
        var img = document.createElement("img");
        img.src = item.previewUrl;
        img.alt = item.file.name;
        card.appendChild(img);

        var bar = document.createElement("div");
        bar.className = "gl-a01-thumb-card__actions";

        var covBtn = document.createElement("button");
        covBtn.type = "button";
        covBtn.className = "btn btn-link btn-sm p-0 text-decoration-none";
        covBtn.textContent = idx === coverIndex ? "Ảnh chính" : "Đặt làm bìa";
        covBtn.addEventListener("click", function () {
          coverIndex = idx;
          renderStagedGallery();
        });

        var rmBtn = document.createElement("button");
        rmBtn.type = "button";
        rmBtn.className = "btn btn-link btn-sm p-0 text-danger text-decoration-none";
        rmBtn.textContent = "Xóa";
        rmBtn.addEventListener("click", function () {
          URL.revokeObjectURL(item.previewUrl);
          stagedFiles.splice(idx, 1);
          if (coverIndex >= stagedFiles.length) {
            coverIndex = 0;
          }
          renderStagedGallery();
        });

        bar.appendChild(covBtn);
        bar.appendChild(rmBtn);
        card.appendChild(bar);
        previewWrap.appendChild(card);
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var allowed = ["image/jpeg", "image/png", "image/webp"];
        var maxBytes = 5 * 1024 * 1024;
        var errMsg = "";
        Array.prototype.slice.call(fileInput.files || []).forEach(function (f) {
          if (allowed.indexOf(f.type) === -1 && !/\.(jpe?g|png|webp)$/i.test(f.name)) {
            errMsg = "Chỉ hỗ trợ tệp JPG, PNG hoặc WEBP.";
            return;
          }
          if (f.size > maxBytes) {
            errMsg = "Mỗi ảnh không vượt quá 5 MB (" + f.name + ").";
            return;
          }
          stagedFiles.push({ file: f, previewUrl: URL.createObjectURL(f) });
        });
        ui.setFieldError(fileInput, fileErr, errMsg);
        renderStagedGallery();
      });
    }

    var resetBtn = document.getElementById("a01CreateResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        stagedFiles.forEach(function (item) { URL.revokeObjectURL(item.previewUrl); });
        stagedFiles = [];
        coverIndex = 0;
        renderStagedGallery();
        if (pricePreview) { pricePreview.textContent = ""; }
        if (addNotice) { addNotice.hidden = true; }
      });
    }

    addForm.addEventListener("submit", function (event) {
      var hasError = false;
      var nm = document.getElementById("addRoomName");
      var pr = document.getElementById("addRoomPrice");
      var gs = document.getElementById("addRoomGuests");

      if (nm) {
        var nErr = nm.value.trim() ? "" : "Tên phòng không được để trống.";
        ui.setFieldError(nm, document.getElementById("addRoomNameError"), nErr);
        if (nErr) { hasError = true; }
      }
      if (pr) {
        var pv = pr.value.trim() ? Number(pr.value) : NaN;
        var pErr = (!pr.value.trim() || !Number.isFinite(pv) || pv < 0) ? "Giá niêm yết phải là số không âm hợp lệ." : "";
        ui.setFieldError(pr, document.getElementById("addRoomPriceError"), pErr);
        if (pErr) { hasError = true; }
      }
      if (gs && gs.value.trim()) {
        var gv = Number(gs.value);
        var gErr = (!Number.isFinite(gv) || gv < 1) ? "Số khách phải lớn hơn 0." : "";
        ui.setFieldError(gs, document.getElementById("addRoomGuestsError"), gErr);
        if (gErr) { hasError = true; }
      }
      if (hasError) {
        event.preventDefault();
        return;
      }

      var createUrl = (addForm.getAttribute("data-gl-create-url") || addForm.getAttribute("action") || "").trim();
      var supportsExtended = addForm.getAttribute("data-gl-supports-extended-fields") === "true";
      if (!supportsExtended) {
        addForm.querySelectorAll("[data-gl-extended-field]").forEach(function (el) {
          el.disabled = true;
        });
      }
      if (!createUrl) {
        event.preventDefault();
        if (!supportsExtended) {
          addForm.querySelectorAll("[data-gl-extended-field]").forEach(function (el) {
            el.disabled = false;
          });
        }
        if (addNotice) {
          addNotice.hidden = false;
          addNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
  }

  function initAdminPriceManagement() {
    var priceForm = document.getElementById("a01PriceForm");
    if (!priceForm || !ui) {
      return;
    }
    var roomSel = document.getElementById("priceTargetRoom");
    var curDisplay = document.getElementById("priceCurrentDisplay");
    var newInput = document.getElementById("priceNewInput");
    var newFormatted = document.getElementById("priceNewFormatted");
    var submitBtn = document.getElementById("a01PriceSubmitBtn");
    var noticeEl = document.getElementById("a01PriceSaveNotice");
    var errorAlert = document.getElementById("a01PriceErrorAlert");

    function syncSelectedRoomPrice() {
      if (!roomSel) {
        return;
      }
      var opt = roomSel.selectedIndex >= 0 ? roomSel.options[roomSel.selectedIndex] : null;
      var curRaw = opt ? opt.getAttribute("data-gl-current-price") : "";
      var customUrl = opt ? opt.getAttribute("data-gl-price-url") : "";
      priceForm.action = customUrl || (priceForm.getAttribute("data-gl-default-action") || "");
      if (curDisplay) {
        if (curRaw && window.ValentiaPrice) {
          curDisplay.value = window.ValentiaPrice.formatVnd(Number(curRaw)) + " / đêm";
        } else {
          curDisplay.value = "—";
        }
      }
    }

    function updateNewFormatted() {
      if (!newInput || !newFormatted) {
        return;
      }
      var v = Number(newInput.value);
      if (newInput.value.trim() && Number.isFinite(v) && v >= 0 && window.ValentiaPrice) {
        newFormatted.textContent = window.ValentiaPrice.formatVnd(v) + " / đêm";
      } else {
        newFormatted.textContent = "";
      }
    }

    if (roomSel) {
      roomSel.addEventListener("change", syncSelectedRoomPrice);
      syncSelectedRoomPrice();
    }
    if (newInput) {
      newInput.addEventListener("input", updateNewFormatted);
    }

    document.querySelectorAll("[data-gl-jump-price]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tabBtn = document.getElementById("a01TabBtnPricing");
        if (tabBtn) {
          tabBtn.click();
        }
        var rid = btn.getAttribute("data-gl-room-id") || "";
        if (roomSel && rid) {
          roomSel.value = rid;
          syncSelectedRoomPrice();
        }
        if (newInput) {
          newInput.focus();
        }
      });
    });

    priceForm.addEventListener("submit", function (event) {
      if (noticeEl) { noticeEl.hidden = true; }
      if (errorAlert) { errorAlert.hidden = true; }
      var hasErr = false;

      if (roomSel) {
        var rErr = roomSel.value ? "" : "Vui lòng chọn phòng cần cập nhật giá.";
        ui.setFieldError(roomSel, document.getElementById("priceTargetRoomError"), rErr);
        if (rErr) { hasErr = true; }
      }
      if (newInput) {
        var raw = newInput.value.trim();
        var num = raw ? Number(raw) : NaN;
        var pErr = (!raw || !Number.isFinite(num) || num < 0)
          ? "Giá mới phải là số hợp lệ và không âm."
          : "";
        ui.setFieldError(newInput, document.getElementById("priceNewInputError"), pErr);
        if (pErr) { hasErr = true; }
      }
      if (hasErr) {
        event.preventDefault();
        return;
      }

      var actionUrl = (priceForm.getAttribute("action") || "").trim();
      if (!actionUrl) {
        event.preventDefault();
        if (noticeEl) {
          noticeEl.textContent = "Dữ liệu giá hợp lệ. Chức năng lưu giá mới hiện chưa kết nối.";
          noticeEl.hidden = false;
        }
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang lưu...";
      }
    });
  }

  function initAdminPromotionManagement() {
    var promoForm = document.getElementById("a01PromoForm");
    if (!promoForm || !ui) {
      return;
    }
    var roomsData = [];
    try {
      roomsData = JSON.parse(promoForm.getAttribute("data-gl-rooms") || "[]");
    } catch (err) {
      roomsData = [];
    }

    var scopeSel = document.getElementById("promoScopeSelect");
    var tierWrap = document.getElementById("promoTierWrap");
    var tierSel = document.getElementById("promoTierSelect");
    var singleWrap = document.getElementById("promoSingleWrap");
    var singleSel = document.getElementById("promoSingleSelect");
    var multiWrap = document.getElementById("promoMultiWrap");
    var pctInput = document.getElementById("promoPercentInput");
    var nameInput = document.getElementById("promoNameInput");
    var startInput = document.getElementById("promoStartDate");
    var endInput = document.getElementById("promoEndDate");
    var activeCheck = document.getElementById("promoActiveCheck");
    var previewGrid = document.getElementById("a01PromoPreviewGrid");
    var overlapWarn = document.getElementById("a01PromoOverlapWarn");
    var noticeEl = document.getElementById("a01PromoNotice");
    var errorAlert = document.getElementById("a01PromoErrorAlert");
    var checkboxes = Array.prototype.slice.call(promoForm.querySelectorAll(".promo-room-checkbox"));

    var tierRoomMap = {
      hang_a: ["301", "302", "303"],
      hang_b: ["201", "202", "203"],
      hang_c: ["101", "102", "103"]
    };

    function syncScopeVisibility() {
      var sc = scopeSel ? scopeSel.value : "room_type";
      if (tierWrap) { tierWrap.hidden = sc !== "room_type"; }
      if (singleWrap) { singleWrap.hidden = sc !== "single_room"; }
      if (multiWrap) { multiWrap.hidden = sc !== "multiple_rooms"; }
      renderPromoPreview();
    }

    function resolveTargetCodes() {
      var sc = scopeSel ? scopeSel.value : "room_type";
      if (sc === "room_type") {
        var tk = tierSel ? tierSel.value : "hang_c";
        return tierRoomMap[tk] || [];
      }
      if (sc === "single_room") {
        return (singleSel && singleSel.value) ? [singleSel.value] : [];
      }
      return checkboxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    }

    function renderPromoPreview() {
      if (!previewGrid || !window.ValentiaPrice) {
        return;
      }
      while (previewGrid.firstChild) {
        previewGrid.removeChild(previewGrid.firstChild);
      }
      var targetCodes = resolveTargetCodes();
      var pct = pctInput && pctInput.value.trim() ? Number(pctInput.value) : 0;
      var validPct = Number.isFinite(pct) && pct >= 1 && pct <= 100;
      var hasConflict = false;

      if (!targetCodes.length) {
        var emptyP = document.createElement("p");
        emptyP.className = "gl-helper mb-0";
        emptyP.textContent = "Chọn phạm vi phòng để xem trước mức giá áp dụng.";
        previewGrid.appendChild(emptyP);
        if (overlapWarn) { overlapWarn.hidden = true; }
        return;
      }

      targetCodes.forEach(function (code) {
        var roomObj = roomsData.find(function (r) {
          return String(r.room_number || "") === code || String(r.id || "") === code || (r.name && r.name.indexOf(code) !== -1);
        });
        var card = document.createElement("div");
        card.className = "gl-a01-preview-card";
        var h4 = document.createElement("h4");
        h4.className = "h6 mb-2 gl-tabular";
        h4.textContent = roomObj ? (roomObj.name + (roomObj.type_name ? " · " + roomObj.type_name : "")) : ("Phòng " + code);
        card.appendChild(h4);

        var baseNum = roomObj ? Number(roomObj.original_price || roomObj.list_price || roomObj.price || 0) : 0;
        if (roomObj && (roomObj.promotion_status === "active" || (roomObj.discount_percent && Number(roomObj.discount_percent) > 0))) {
          hasConflict = true;
        }
        if (baseNum > 0) {
          if (validPct) {
            var previewFinal = Math.round(baseNum * (1 - pct / 100));
            card.appendChild(window.ValentiaPrice.createPriceBlockElement({
              original_price: baseNum,
              final_price: previewFinal,
              discount_percent: pct,
              promotion_status: "active",
              promotion_name: (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Xem trước ưu đãi",
              savings_amount: baseNum - previewFinal
            }, {
              variant: "compact",
              showPromoLabel: true,
              showSavings: true
            }));
          } else {
            card.appendChild(window.ValentiaPrice.createPriceBlockElement({
              original_price: baseNum
            }, { variant: "compact" }));
          }
        } else {
          var noPrice = document.createElement("p");
          noPrice.className = "gl-helper mb-0";
          noPrice.textContent = validPct
            ? ("Chưa có dữ liệu giá niêm yết (mức giảm dự kiến -" + Math.round(pct) + "%).")
            : "Chưa có dữ liệu giá niêm yết.";
          card.appendChild(noPrice);
        }
        previewGrid.appendChild(card);
      });

      if (overlapWarn) {
        if (hasConflict) {
          overlapWarn.textContent = "Lưu ý: Một số phòng trong phạm vi đã có ưu đãi hiện hành. Hệ thống không cộng dồn nhiều ưu đãi.";
          overlapWarn.hidden = false;
        } else {
          overlapWarn.hidden = true;
        }
      }
    }

    if (scopeSel) { scopeSel.addEventListener("change", syncScopeVisibility); }
    if (tierSel) { tierSel.addEventListener("change", renderPromoPreview); }
    if (singleSel) { singleSel.addEventListener("change", renderPromoPreview); }
    if (pctInput) { pctInput.addEventListener("input", renderPromoPreview); }
    if (nameInput) { nameInput.addEventListener("input", renderPromoPreview); }
    checkboxes.forEach(function (c) { c.addEventListener("change", renderPromoPreview); });

    document.querySelectorAll("[data-gl-edit-promo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pr = {};
        try { pr = JSON.parse(btn.getAttribute("data-gl-promo") || "{}"); } catch (e) { pr = {}; }
        if (pr.update_url) {
          promoForm.action = pr.update_url;
        }
        setVal("promoNameInput", pr.name || "");
        setVal("promoPercentInput", pr.discount_percent ? String(pr.discount_percent) : "");
        setVal("promoStartDate", pr.start_date || "");
        setVal("promoEndDate", pr.end_date || "");
        setVal("promoConditionInput", pr.condition || "");
        if (activeCheck) { activeCheck.checked = Boolean(pr.is_active); }
        if (scopeSel && pr.scope_type) { scopeSel.value = pr.scope_type; }
        if (tierSel && pr.tier_key) { tierSel.value = pr.tier_key; }
        if (Array.isArray(pr.room_codes)) {
          checkboxes.forEach(function (c) {
            c.checked = pr.room_codes.indexOf(c.value) !== -1;
          });
        }
        syncScopeVisibility();
        promoForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-gl-toggle-promo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var actUrl = (btn.getAttribute("data-gl-action-url") || "").trim();
        if (!actUrl) {
          if (noticeEl) {
            noticeEl.textContent = "Chức năng bật/tắt trạng thái ưu đãi \"" + (btn.getAttribute("data-gl-promo-name") || "") + "\" hiện chưa kết nối.";
            noticeEl.hidden = false;
          }
          return;
        }
        var postForm = document.createElement("form");
        postForm.method = "post";
        postForm.action = actUrl;
        document.body.appendChild(postForm);
        postForm.submit();
      });
    });

    var promoResetBtn = document.getElementById("a01PromoResetBtn");
    if (promoResetBtn) {
      promoResetBtn.addEventListener("click", function () {
        promoForm.reset();
        promoForm.action = promoForm.getAttribute("data-gl-default-action") || "";
        if (noticeEl) { noticeEl.hidden = true; }
        if (errorAlert) { errorAlert.hidden = true; }
        syncScopeVisibility();
      });
    }

    promoForm.addEventListener("submit", function (event) {
      if (noticeEl) { noticeEl.hidden = true; }
      if (errorAlert) { errorAlert.hidden = true; }
      var hasErr = false;

      if (nameInput) {
        var nMsg = nameInput.value.trim() ? "" : "Tên chương trình ưu đãi không được để trống.";
        ui.setFieldError(nameInput, document.getElementById("promoNameError"), nMsg);
        if (nMsg) { hasErr = true; }
      }
      if (pctInput) {
        var pv = pctInput.value.trim() ? Number(pctInput.value) : NaN;
        var pctMsg = (!Number.isFinite(pv) || pv < 1 || pv > 100) ? "Mức giảm phần trăm phải nằm trong khoảng 1% đến 100%." : "";
        ui.setFieldError(pctInput, document.getElementById("promoPercentError"), pctMsg);
        if (pctMsg) { hasErr = true; }
      }
      var sd = startInput ? startInput.value.trim() : "";
      var ed = endInput ? endInput.value.trim() : "";
      if (startInput) {
        var sMsg = sd ? "" : "Vui lòng chọn ngày bắt đầu.";
        ui.setFieldError(startInput, document.getElementById("promoStartDateError"), sMsg);
        if (sMsg) { hasErr = true; }
      }
      if (endInput) {
        var todayIso = new Date().toISOString().slice(0, 10);
        var eMsg = !ed ? "Vui lòng chọn ngày kết thúc."
          : (sd && ed < sd ? "Ngày kết thúc không được trước ngày bắt đầu."
            : ((activeCheck && activeCheck.checked && ed < todayIso) ? "Không thể kích hoạt ưu đãi đã hết hạn." : ""));
        ui.setFieldError(endInput, document.getElementById("promoEndDateError"), eMsg);
        if (eMsg) { hasErr = true; }
      }
      if (scopeSel && scopeSel.value === "multiple_rooms") {
        var anyChecked = checkboxes.some(function (c) { return c.checked; });
        var roomsErrEl = document.getElementById("promoRoomsError");
        if (roomsErrEl) {
          roomsErrEl.textContent = anyChecked ? "" : "Vui lòng chọn ít nhất một phòng.";
          roomsErrEl.hidden = anyChecked;
        }
        if (!anyChecked) { hasErr = true; }
      }

      if (hasErr) {
        event.preventDefault();
        return;
      }

      var actionUrl = (promoForm.getAttribute("action") || "").trim();
      if (!actionUrl) {
        event.preventDefault();
        if (noticeEl) {
          noticeEl.textContent = "Dữ liệu chương trình ưu đãi đã hợp lệ. Chức năng lưu ưu đãi hiện chưa kết nối.";
          noticeEl.hidden = false;
          noticeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });

    syncScopeVisibility();
  }

  function initRulesManagement() {
    var noticeEl = document.getElementById("a02SaveNotice");
    document.querySelectorAll(".a02-rule-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var maxEl = document.getElementById("ruleMaxGuests");
        var surEl = document.getElementById("ruleSurchargeRate");
        if (ui && maxEl && form.contains(maxEl)) {
          var mv = Number(maxEl.value);
          var mErr = (!maxEl.value.trim() || isNaN(mv) || mv < 1) ? "Số khách tối đa phải lớn hơn 0." : "";
          ui.setFieldError(maxEl, document.getElementById("ruleMaxGuestsError"), mErr);
          if (mErr) {
            event.preventDefault();
            maxEl.focus();
            return;
          }
        }
        if (ui && surEl && form.contains(surEl)) {
          var sv = Number(surEl.value);
          var sErr = (!surEl.value.trim() || isNaN(sv) || sv < 0) ? "Tỉ lệ phụ thu không được âm." : "";
          ui.setFieldError(surEl, document.getElementById("ruleSurchargeRateError"), sErr);
          if (sErr) {
            event.preventDefault();
            surEl.focus();
            return;
          }
        }
        if (!(form.getAttribute("action") || "").trim()) {
          event.preventDefault();
          if (noticeEl) {
            noticeEl.hidden = false;
          }
        }
      });
    });
  }

  function initEmployeesManagement() {
    initSimpleAdminToolbar("a05FilterForm", "a05FilterNotice", null, null);

    var copyTempBtn = document.getElementById("copyTempPasswordBtn");
    var tempCodeEl = document.getElementById("a05TempPasswordCode");
    if (copyTempBtn && tempCodeEl) {
      copyTempBtn.addEventListener("click", function () {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(tempCodeEl.textContent || "").then(function () {
            if (ui) {
              ui.showToast("Đã sao chép mật khẩu tạm thời.");
            }
          });
        }
      });
    }

    var drawer = document.getElementById("employeeEditorDrawer");
    var form = document.getElementById("employeeEditorForm");
    var closeBtn = document.getElementById("closeEmployeeDrawerBtn");
    var addBtn = document.getElementById("openAddEmployeeBtn");
    var saveNotice = document.getElementById("a05EmployeeSaveNotice");
    var pwdRow = document.getElementById("empInitialPasswordRow");
    if (!drawer || !form) {
      return;
    }

    var lastTrigger = null;

    function openDrawer(mode, empData, actionUrl, triggerEl) {
      lastTrigger = triggerEl || null;
      var titleEl = document.getElementById("employeeDrawerTitle");
      if (titleEl) {
        titleEl.textContent = mode === "edit" ? "Cập nhật tài khoản nhân viên" : "Thêm tài khoản nhân viên";
      }
      if (saveNotice) {
        saveNotice.hidden = true;
      }
      form.action = actionUrl || "";

      var usernameEl = document.getElementById("empFieldUsername");
      setVal("empFieldName", empData.name || "");
      setVal("empFieldUsername", empData.username || "");
      setVal("empFieldEmail", empData.email || "");
      setVal("empFieldRole", empData.role || "STAFF");
      setVal("empFieldPassword", "");

      if (usernameEl) {
        usernameEl.readOnly = mode === "edit";
      }
      if (pwdRow) {
        pwdRow.hidden = mode === "edit";
      }

      drawer.hidden = false;
      var first = document.getElementById("empFieldName");
      if (first) {
        first.focus();
      }
    }

    function closeDrawer() {
      drawer.hidden = true;
      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        openDrawer("create", {}, addBtn.getAttribute("data-gl-create-url") || "", addBtn);
      });
    }

    document.querySelectorAll("[data-gl-edit-employee]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var raw = btn.getAttribute("data-gl-employee") || "{}";
        var empObj = {};
        try {
          empObj = JSON.parse(raw);
        } catch (err) {
          empObj = {};
        }
        openDrawer("edit", empObj, btn.getAttribute("data-gl-update-url") || "", btn);
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

    form.addEventListener("submit", function (event) {
      if (!ui) {
        return;
      }
      var hasError = false;
      var nameEl = document.getElementById("empFieldName");
      var userEl = document.getElementById("empFieldUsername");
      var emailEl = document.getElementById("empFieldEmail");

      if (nameEl) {
        var nErr = nameEl.value.trim() ? "" : "Vui lòng nhập họ tên nhân viên.";
        ui.setFieldError(nameEl, document.getElementById("empFieldNameError"), nErr);
        if (nErr) {
          hasError = true;
        }
      }
      if (userEl) {
        var uVal = userEl.value.trim();
        var uErr = !uVal ? "Vui lòng nhập tên đăng nhập." : (/^[A-Za-z0-9_.-]{3,32}$/.test(uVal) ? "" : "Tên đăng nhập gồm 3–32 ký tự chữ, số hoặc _ . -");
        ui.setFieldError(userEl, document.getElementById("empFieldUsernameError"), uErr);
        if (uErr) {
          hasError = true;
        }
      }
      if (emailEl) {
        var eVal = emailEl.value.trim();
        var eErr = !eVal ? "Vui lòng nhập địa chỉ email." : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eVal) ? "" : "Địa chỉ email chưa đúng định dạng.");
        ui.setFieldError(emailEl, document.getElementById("empFieldEmailError"), eErr);
        if (eErr) {
          hasError = true;
        }
      }

      if (hasError) {
        event.preventDefault();
        return;
      }

      if (!(form.getAttribute("action") || "").trim()) {
        event.preventDefault();
        if (saveNotice) {
          saveNotice.hidden = false;
        }
      }
    });

    var toggleForm = document.getElementById("toggleEmployeeForm");
    var toggleMsg = document.getElementById("toggleEmployeeMessage");
    var toggleNotice = document.getElementById("a05ToggleNotice");
    if (toggleForm) {
      document.querySelectorAll("[data-gl-toggle-employee]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          toggleForm.action = btn.getAttribute("data-gl-toggle-url") || "";
          var empName = btn.getAttribute("data-gl-emp-name") || "tài khoản này";
          var isLocked = btn.getAttribute("data-gl-emp-locked") === "1";
          if (toggleMsg) {
            toggleMsg.textContent = isLocked
              ? "Mở khóa lại tài khoản nhân viên \"" + empName + "\" để cho phép đăng nhập?"
              : "Khóa tài khoản nhân viên \"" + empName + "\"? Tài khoản sẽ tạm ngưng quyền đăng nhập hệ thống.";
          }
          if (toggleNotice) {
            toggleNotice.hidden = true;
          }
        });
      });
      toggleForm.addEventListener("submit", function (event) {
        if (!(toggleForm.getAttribute("action") || "").trim()) {
          event.preventDefault();
          if (toggleNotice) {
            toggleNotice.hidden = false;
          }
        }
      });
    }

    var resetForm = document.getElementById("resetPasswordForm");
    var resetNameEl = document.getElementById("resetEmployeeName");
    var resetNotice = document.getElementById("a05ResetNotice");
    if (resetForm) {
      document.querySelectorAll("[data-gl-reset-employee]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          resetForm.action = btn.getAttribute("data-gl-reset-url") || "";
          if (resetNameEl) {
            resetNameEl.textContent = btn.getAttribute("data-gl-emp-name") || "nhân viên";
          }
          if (resetNotice) {
            resetNotice.hidden = true;
          }
        });
      });
      resetForm.addEventListener("submit", function (event) {
        if (!(resetForm.getAttribute("action") || "").trim()) {
          event.preventDefault();
          if (resetNotice) {
            resetNotice.hidden = false;
          }
        }
      });
    }

    var deleteEmpForm = document.getElementById("deleteEmployeeForm");
    var deleteEmpNameEl = document.getElementById("deleteEmployeeName");
    var deleteEmpNotice = document.getElementById("a05DeleteNotice");
    if (deleteEmpForm) {
      document.querySelectorAll("[data-gl-delete-employee]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          deleteEmpForm.action = btn.getAttribute("data-gl-delete-url") || "";
          if (deleteEmpNameEl) {
            deleteEmpNameEl.textContent = btn.getAttribute("data-gl-emp-name") || "này";
          }
          if (deleteEmpNotice) {
            deleteEmpNotice.hidden = true;
          }
        });
      });
      deleteEmpForm.addEventListener("submit", function (event) {
        if (!(deleteEmpForm.getAttribute("action") || "").trim()) {
          event.preventDefault();
          if (deleteEmpNotice) {
            deleteEmpNotice.hidden = false;
          }
        }
      });
    }
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) {
      el.value = val;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRoomManagement();
    initRulesManagement();
    initSimpleAdminToolbar("a03ReportForm", "a03FilterNotice", "a03Year", "a03YearError");
    initSimpleAdminToolbar("a04ReportForm", "a04FilterNotice", "a04Year", "a04YearError");
    initEmployeesManagement();
  });
})();
