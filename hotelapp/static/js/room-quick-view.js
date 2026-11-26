/* Shared Room Quick-View Modal & Public Booking Login Gate */
(function (global) {
  "use strict";

  function buildInternalPath(targetUrl) {
    if (!targetUrl) {
      return "";
    }
    try {
      var parsed = new URL(targetUrl, global.location.origin);
      if (parsed.origin !== global.location.origin) {
        return "";
      }
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (err) {
      return "";
    }
  }

  function appendStayQuery(baseHref, stayParams) {
    var pathOnly = buildInternalPath(baseHref);
    if (!pathOnly) {
      return "";
    }
    var url = new URL(pathOnly, global.location.origin);
    if (stayParams) {
      if (stayParams.checkin) { url.searchParams.set("checkin", stayParams.checkin); }
      if (stayParams.checkout) { url.searchParams.set("checkout", stayParams.checkout); }
      if (stayParams.guests) { url.searchParams.set("guests", stayParams.guests); }
      if (stayParams.roomId) { url.searchParams.set("room_id", String(stayParams.roomId)); }
      if (stayParams.tierKey && !url.searchParams.get("tier")) {
        url.searchParams.set("tier", String(stayParams.tierKey));
      }
    }
    return url.pathname + url.search;
  }

  function getAuthContext() {
    var body = document.body;
    return {
      isAuthenticated: body ? body.getAttribute("data-gl-authenticated") === "true" : false,
      loginUrl: body ? (body.getAttribute("data-gl-login-url") || "/login") : "/login",
      bookingUrl: body ? (body.getAttribute("data-gl-booking-url") || "") : ""
    };
  }

  function readSearchStayParams() {
    var api = global.ValentiaRoomSearch;
    if (api && typeof api.getDates === "function") {
      return api.getDates();
    }
    var q = new URLSearchParams(global.location.search);
    return {
      checkin: q.get("checkin") || "",
      checkout: q.get("checkout") || "",
      guests: q.get("guests") || ""
    };
  }

  function handleBookingNavigation(targetBookingUrl, stayParams) {
    var ctx = getAuthContext();
    var finalBookingPath = appendStayQuery(targetBookingUrl || ctx.bookingUrl, stayParams);
    if (!finalBookingPath) {
      return false;
    }
    if (!ctx.isAuthenticated) {
      var loginUrl = new URL(buildInternalPath(ctx.loginUrl) || "/login", global.location.origin);
      loginUrl.searchParams.set("next", finalBookingPath);
      loginUrl.searchParams.set("reason", "booking");
      global.location.href = loginUrl.pathname + loginUrl.search;
      return true;
    }
    global.location.href = finalBookingPath;
    return true;
  }

  global.ValentiaAuthGate = {
    handleBookingNavigation: handleBookingNavigation,
    appendStayQuery: appendStayQuery,
    isAuthenticated: function () { return getAuthContext().isAuthenticated; }
  };

  function getFeatureSvgMarkup(label) {
    var low = String(label || "").toLowerCase();
    if (low.indexOf("cảnh") !== -1 || low.indexOf("view") !== -1 || low.indexOf("hướng") !== -1) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>';
    }
    if (low.indexOf("điều hòa") !== -1 || low.indexOf("máy lạnh") !== -1) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"></path></svg>';
    }
    if (low.indexOf("tắm") !== -1 || low.indexOf("vòi sen") !== -1) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3z"></path><path d="M7 12V6a2 2 0 0 1 4 0"></path></svg>';
    }
    if (low.indexOf("tv") !== -1 || low.indexOf("tivi") !== -1) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="2" y="5" width="20" height="13" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line></svg>';
    }
    if (low.indexOf("wi-fi") !== -1 || low.indexOf("wifi") !== -1) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';
    }
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  }

  function initQuickViewModal() {
    var backdrop = document.getElementById("roomQuickViewBackdrop");
    var dialog = document.getElementById("roomQuickViewDialog");
    var closeBtn = document.getElementById("qvCloseBtn");
    if (!backdrop || !dialog || !closeBtn) {
      return;
    }

    var mainStage = document.getElementById("qvMainStage");
    var mainImg = document.getElementById("qvMainImg");
    var lowResNotice = document.getElementById("qvLowResNotice");
    var imgFallback = document.getElementById("qvImgFallback");
    var prevBtn = document.getElementById("qvPrevBtn");
    var nextBtn = document.getElementById("qvNextBtn");
    var counterEl = document.getElementById("qvCounter");
    var dotsWrap = document.getElementById("qvDots");
    var galleryLabelEl = document.getElementById("qvGalleryLabel");
    var thumbsWrap = document.getElementById("qvThumbs");
    var infoScroll = document.getElementById("qvInfoScroll");

    var tierEl = document.getElementById("qvRoomTier");
    var nameEl = document.getElementById("qvRoomName");
    var availWrap = document.getElementById("qvAvailabilityWrap");
    var availChip = document.getElementById("qvAvailabilityChip");
    var featureList = document.getElementById("qvFeatureChips");
    var specList = document.getElementById("qvSpecList");
    var descEl = document.getElementById("qvRoomDesc");
    var amenityGroupsWrap = document.getElementById("qvAmenityGroups");
    var priceRenderWrap = document.getElementById("qvPriceRender");
    var priceNote = document.getElementById("qvPriceNote");
    var detailBtn = document.getElementById("qvDetailBtn");
    var bookBtn = document.getElementById("qvBookBtn");

    var currentImages = [];
    var currentIndex = 0;
    var currentRoom = null;
    var lastTrigger = null;
    var previousOverflow = "";

    function clearEl(el) {
      if (!el) { return; }
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }

    function showSlide(index) {
      if (!currentImages.length) {
        if (mainImg) { mainImg.hidden = true; }
        if (imgFallback) { imgFallback.hidden = false; }
        if (prevBtn) { prevBtn.hidden = true; }
        if (nextBtn) { nextBtn.hidden = true; }
        if (counterEl) { counterEl.hidden = true; }
        return;
      }

      var len = currentImages.length;
      currentIndex = ((index % len) + len) % len;
      var item = currentImages[currentIndex];

      if (mainImg && imgFallback) {
        imgFallback.hidden = true;
        mainImg.hidden = false;
        if (mainStage) {
          mainStage.classList.remove("is-lowres");
        }
        if (lowResNotice) {
          lowResNotice.hidden = true;
        }
        mainImg.onload = function () {
          mainImg.hidden = false;
          imgFallback.hidden = true;
        };
        mainImg.onerror = function () {
          mainImg.hidden = true;
          imgFallback.hidden = false;
        };
        mainImg.src = item.url || "";
        mainImg.alt = item.alt || (currentRoom && currentRoom.name ? currentRoom.name : "Hình ảnh phòng");
      }

      var singleImage = len <= 1;
      if (prevBtn) { prevBtn.hidden = singleImage; prevBtn.disabled = singleImage; }
      if (nextBtn) { nextBtn.hidden = singleImage; nextBtn.disabled = singleImage; }
      if (counterEl) {
        counterEl.textContent = (currentIndex + 1) + " / " + len;
        counterEl.hidden = singleImage;
      }

      if (dotsWrap) {
        dotsWrap.querySelectorAll(".gl-qv-dot").forEach(function (dot, i) {
          var active = i === currentIndex;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", active ? "true" : "false");
        });
      }

      if (thumbsWrap) {
        thumbsWrap.querySelectorAll(".gl-qv-thumb").forEach(function (thumb, i) {
          var active = i === currentIndex;
          thumb.classList.toggle("is-active", active);
          thumb.setAttribute("aria-pressed", active ? "true" : "false");
          if (active && typeof thumb.scrollIntoView === "function") {
            thumb.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        });
      }
    }

    function buildGalleryControls() {
      clearEl(dotsWrap);
      clearEl(thumbsWrap);
      var hasMultiple = currentImages.length > 1;

      if (galleryLabelEl) {
        if (hasMultiple) {
          galleryLabelEl.textContent = (currentRoom && currentRoom.gallery_caption)
            ? currentRoom.gallery_caption
            : (currentRoom && currentRoom.name
              ? ("Gallery của " + currentRoom.name + " (" + currentImages.length + " ảnh)")
              : ("Gallery phòng (" + currentImages.length + " ảnh)"));
          galleryLabelEl.hidden = false;
        } else {
          galleryLabelEl.hidden = true;
        }
      }

      if (!hasMultiple) {
        if (dotsWrap) { dotsWrap.hidden = true; }
        if (thumbsWrap) { thumbsWrap.hidden = true; }
        return;
      }

      if (dotsWrap) {
        dotsWrap.hidden = false;
        currentImages.forEach(function (img, idx) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "gl-qv-dot";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Ảnh " + (idx + 1));
          dot.addEventListener("click", function () {
            showSlide(idx);
          });
          dotsWrap.appendChild(dot);
        });
      }

      if (thumbsWrap) {
        thumbsWrap.hidden = false;
        currentImages.forEach(function (img, idx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "gl-qv-thumb";
          btn.setAttribute("aria-label", img.alt || ("Xem ảnh " + (idx + 1)));
          var thumbImg = document.createElement("img");
          thumbImg.src = img.url || "";
          thumbImg.alt = img.alt || "";
          thumbImg.loading = "lazy";
          btn.appendChild(thumbImg);
          btn.addEventListener("click", function () {
            showSlide(idx);
          });
          thumbsWrap.appendChild(btn);
        });
      }
    }

    function renderSpecs(room) {
      clearEl(specList);
      if (!specList) { return; }
      var items = [];
      if (room.size) {
        items.push({
          label: "Kích thước phòng",
          value: room.size + " m²",
          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>'
        });
      }
      if (room.bed_type) {
        items.push({
          label: "Loại giường",
          value: room.bed_type,
          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 7v13"></path><path d="M22 12v8"></path><path d="M2 16h20"></path><path d="M6 12h6a4 4 0 0 1 4 4v0H6v-4z"></path></svg>'
        });
      }
      if (room.guest_count) {
        items.push({
          label: "Sức chứa tối đa",
          value: "Tối đa " + room.guest_count + " khách",
          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>'
        });
      }
      if (room.floor) {
        items.push({
          label: "Vị trí",
          value: "Tầng " + room.floor,
          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="1"></rect></svg>'
        });
      }

      if (!items.length) {
        specList.hidden = true;
        return;
      }
      items.forEach(function (it) {
        var wrap = document.createElement("div");
        wrap.className = "gl-qv-spec-item";
        var dt = document.createElement("dt");
        dt.className = "gl-qv-spec-term gl-qv-spec-term--icon";
        dt.innerHTML = it.icon;
        var labelSpan = document.createElement("span");
        labelSpan.textContent = it.label;
        dt.appendChild(labelSpan);

        var dd = document.createElement("dd");
        dd.className = "gl-qv-spec-val gl-tabular";
        dd.textContent = it.value;
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        specList.appendChild(wrap);
      });
      specList.hidden = false;
    }

    function renderFeatures(room) {
      clearEl(featureList);
      if (!featureList) { return; }
      var features = Array.isArray(room.features) ? room.features.filter(Boolean) : [];
      if (!features.length) {
        featureList.hidden = true;
        return;
      }
      features.forEach(function (feat) {
        var li = document.createElement("li");
        li.className = "gl-qv-feature-chip";
        li.innerHTML = getFeatureSvgMarkup(feat);
        var span = document.createElement("span");
        span.textContent = feat;
        li.appendChild(span);
        featureList.appendChild(li);
      });
      featureList.hidden = false;
    }

    function renderAmenities(room) {
      clearEl(amenityGroupsWrap);
      if (!amenityGroupsWrap) { return; }

      var groups = [];
      if (Array.isArray(room.bathroom_amenities) && room.bathroom_amenities.length) {
        groups.push({ title: "Trong phòng tắm riêng", items: room.bathroom_amenities.filter(Boolean) });
      }
      if (Array.isArray(room.view_amenities) && room.view_amenities.length) {
        groups.push({ title: "Hướng tầm nhìn", items: room.view_amenities.filter(Boolean) });
      }
      if (Array.isArray(room.room_amenities) && room.room_amenities.length) {
        groups.push({ title: "Tiện nghi", items: room.room_amenities.filter(Boolean) });
      }

      if (!groups.length && Array.isArray(room.amenity_groups) && room.amenity_groups.length) {
        room.amenity_groups.forEach(function (grp) {
          if (grp && Array.isArray(grp.items) && grp.items.length) {
            groups.push(grp);
          }
        });
      }
      if (!groups.length && Array.isArray(room.amenities) && room.amenities.length) {
        groups.push({ title: "Tiện nghi", items: room.amenities.filter(Boolean) });
      }

      if (!groups.length) {
        amenityGroupsWrap.hidden = true;
        return;
      }

      groups.forEach(function (grp) {
        if (!grp.items || !grp.items.length) { return; }
        var sec = document.createElement("div");
        sec.className = "gl-qv-amenity-group";
        var h3 = document.createElement("h3");
        h3.className = "gl-qv-amenity-heading";
        h3.textContent = grp.title || "Tiện nghi";
        sec.appendChild(h3);

        var ul = document.createElement("ul");
        ul.className = "gl-qv-amenity-grid";
        grp.items.forEach(function (itemText) {
          var li = document.createElement("li");
          li.className = "gl-qv-amenity-item";
          li.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          var span = document.createElement("span");
          span.textContent = itemText;
          li.appendChild(span);
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        amenityGroupsWrap.appendChild(sec);
      });
      amenityGroupsWrap.hidden = false;
    }

    function openModal(room, triggerEl) {
      currentRoom = room || {};
      lastTrigger = triggerEl || document.activeElement;

      var gallery = Array.isArray(room.images) && room.images.length
        ? room.images
        : (room.image_url ? [{ url: room.image_url, alt: room.image_alt || room.name }] : []);
      currentImages = gallery.filter(function (g) { return g && g.url; });

      if (tierEl) {
        if (room.tier_label) {
          var sub = room.type_name || room.segment_label || "";
          tierEl.textContent = sub ? (room.tier_label + " · " + sub) : room.tier_label;
          tierEl.hidden = false;
        } else {
          tierEl.hidden = true;
        }
      }
      if (nameEl) {
        nameEl.textContent = room.name || "Phòng";
      }

      if (availWrap && availChip) {
        if (!room.is_reference && room.availability_label) {
          availChip.textContent = room.availability_label;
          availChip.className = "gl-chip " + (room.availability_chip_class || "gl-chip--neutral");
          availWrap.hidden = false;
        } else {
          availWrap.hidden = true;
        }
      }

      if (descEl) {
        if (room.description) {
          descEl.textContent = room.description;
          descEl.hidden = false;
        } else {
          descEl.hidden = true;
        }
      }

      renderFeatures(room);
      renderSpecs(room);
      renderAmenities(room);

      if (priceRenderWrap) {
        clearEl(priceRenderWrap);
        if (global.ValentiaPrice && typeof global.ValentiaPrice.createPriceBlockElement === "function") {
          priceRenderWrap.appendChild(global.ValentiaPrice.createPriceBlockElement(room, {
            variant: "modal",
            showPromoLabel: true,
            showSavings: true,
            showCondition: false,
            missingText: "Liên hệ lễ tân hoặc xem chi tiết để biết giá và tình trạng phòng theo ngày."
          }));
        }
      }
      if (priceNote) {
        var pricingInfo = (global.ValentiaPrice && typeof global.ValentiaPrice.extractPricing === "function")
          ? global.ValentiaPrice.extractPricing(room)
          : { hasPrice: false };
        priceNote.textContent = pricingInfo.hasPrice
          ? (room.base_guest_note || "Áp dụng cho 2 khách cơ bản")
          : "";
        priceNote.hidden = !priceNote.textContent;
      }

      var stay = readSearchStayParams();
      if (detailBtn) {
        var dHref = appendStayQuery(room.detail_url || "", stay);
        if (dHref) {
          detailBtn.href = dHref;
          detailBtn.hidden = false;
        } else {
          detailBtn.hidden = true;
        }
      }

      if (bookBtn) {
        var rawAvail = String(room.availability_state || "").toLowerCase();
        var unavailable = (!room.is_reference) && (rawAvail === "full" || rawAvail === "unavailable" || rawAvail === "maintenance" || rawAvail === "fully_booked");
        var bUrl = (!room.is_reference) ? (room.booking_url || getAuthContext().bookingUrl) : "";
        if (room.is_reference) {
          bookBtn.hidden = true;
          bookBtn.disabled = true;
        } else {
          bookBtn.hidden = !bUrl;
          bookBtn.disabled = unavailable || !bUrl;
          bookBtn.textContent = unavailable ? "Hết phòng" : "Đặt phòng này";
        }
      }

      buildGalleryControls();
      var startIdx = Number(room.initial_index);
      showSlide(Number.isInteger(startIdx) && startIdx >= 0 ? startIdx : 0);
      if (infoScroll) {
        infoScroll.scrollTop = 0;
      }

      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      backdrop.hidden = false;
      closeBtn.focus();
    }

    function closeModal() {
      if (backdrop.hidden) {
        return;
      }
      backdrop.hidden = true;
      document.body.style.overflow = previousOverflow;
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        showSlide(currentIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        showSlide(currentIndex + 1);
      });
    }
    if (bookBtn) {
      bookBtn.addEventListener("click", function () {
        if (!currentRoom || bookBtn.disabled) {
          return;
        }
        var stay = readSearchStayParams();
        stay.roomId = currentRoom.id || stay.roomId;
        stay.tierKey = currentRoom.tier_key || "";
        handleBookingNavigation(currentRoom.booking_url || getAuthContext().bookingUrl, stay);
      });
    }

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (backdrop.hidden) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === "Tab") {
        var focusables = Array.prototype.slice.call(
          dialog.querySelectorAll('a[href]:not([hidden]), button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])')
        ).filter(function (el) {
          return el.offsetParent !== null;
        });
        if (!focusables.length) {
          return;
        }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }
      if (event.key === "ArrowLeft" && currentImages.length > 1) {
        event.preventDefault();
        showSlide(currentIndex - 1);
      } else if (event.key === "ArrowRight" && currentImages.length > 1) {
        event.preventDefault();
        showSlide(currentIndex + 1);
      }
    });

    document.querySelectorAll("[data-gl-quick-view]").forEach(function (cardTrigger) {
      function parseAndOpen(event) {
        if (event && event.target && event.target.closest("[data-gl-card-action]")) {
          return;
        }
        var raw = cardTrigger.getAttribute("data-gl-room") || "{}";
        var roomObj = {};
        try {
          roomObj = JSON.parse(raw);
        } catch (err) {
          roomObj = {};
        }
        openModal(roomObj, cardTrigger);
      }

      cardTrigger.addEventListener("click", parseAndOpen);
      cardTrigger.addEventListener("keydown", function (event) {
        if (event.target !== cardTrigger) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          parseAndOpen(event);
        }
      });
    });

    document.querySelectorAll("[data-gl-book-cta]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        var href = btn.getAttribute("href") || btn.getAttribute("data-gl-booking-url") || "";
        var stay = readSearchStayParams();
        if (handleBookingNavigation(href, stay)) {
          event.preventDefault();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initQuickViewModal);
})(window);
