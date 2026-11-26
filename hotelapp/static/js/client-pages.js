/* Client Account Pages (C02-C05) — Booking Detail Drawer, Cancel Confirm & Profile Validation */
(function () {
  "use strict";

  var ui = window.ValentiaUi;

  function initBookingDrawerAndCancel() {
    var drawer = document.getElementById("bookingDetailDrawer");
    var closeBtn = document.getElementById("closeC02DrawerBtn");
    if (drawer) {
      var lastBtn = null;
      var closeDrawer = function () {
        drawer.hidden = true;
        if (lastBtn) {
          lastBtn.focus();
        }
      };
      document.querySelectorAll("[data-gl-open-booking-detail]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          lastBtn = btn;
          var info = {};
          try {
            info = JSON.parse(btn.getAttribute("data-gl-booking") || "{}");
          } catch (e) {
            info = {};
          }
          setText("c02DrawerCode", info.code || "—");
          setText("c02DrawerRoom", (info.room_name || "—") + (info.room_type ? (" · " + info.room_type) : ""));
          setText("c02DrawerDates", (info.check_in_display || "—") + " – " + (info.check_out_display || "—"));
          setText("c02DrawerGuests", info.guest_count ? info.guest_count + " khách" : "—");
          setText("c02DrawerStatus", info.status_label || info.status || "—");
          setText("c02DrawerPayStatus", info.payment_status_label || (info.payment_status === "paid" ? "Đã thanh toán" : (info.payment_status === "unpaid" ? "Chưa thanh toán" : "Chưa có thông tin")));
          setText("c02DrawerRentalStatus", info.rental_status_label || info.rental_status || "Chưa nhận phòng");
          setText("c02DrawerTotal", info.total_display || "—");
          setText("c02DrawerInvoiceInfo", info.invoice_code ? info.invoice_code : (info.invoice_url ? "Đã phát hành" : "Chưa có hóa đơn"));
          var invLink = document.getElementById("c02DrawerInvoiceLink");
          if (invLink) {
            if (info.invoice_url) {
              invLink.href = info.invoice_url;
              invLink.hidden = false;
              invLink.textContent = info.payment_status === "unpaid" ? "Xem / Thanh toán hóa đơn" : "Xem hóa đơn";
            } else {
              invLink.hidden = true;
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
      drawer.addEventListener("click", function (ev) {
        if (ev.target === drawer) {
          closeDrawer();
        }
      });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && !drawer.hidden) {
          closeDrawer();
        }
      });
    }

    var modalEl = document.getElementById("cancelBookingModal");
    var cancelForm = document.getElementById("cancelBookingForm");
    var codeLabel = document.getElementById("cancelBookingCode");
    if (!modalEl || !cancelForm) {
      return;
    }

    document.querySelectorAll("[data-gl-cancel-trigger]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var actionUrl = btn.getAttribute("data-gl-cancel-url") || "";
        var code = btn.getAttribute("data-gl-booking-code") || "";
        cancelForm.action = actionUrl;
        if (codeLabel) {
          codeLabel.textContent = code || "phiếu đặt phòng này";
        }
      });
    });

    cancelForm.addEventListener("submit", function (event) {
      if (!cancelForm.getAttribute("action")) {
        event.preventDefault();
      }
    });
  }

  function initProfileAndPasswordForms() {
    var profileForm = document.getElementById("clientProfileForm");
    if (profileForm && ui) {
      var pUnavailable = document.getElementById("profileUpdateUnavailable");
      profileForm.addEventListener("submit", function (event) {
        var actionUrl = (profileForm.getAttribute("action") || "").trim();
        var nameInput = document.getElementById("profileName");
        var phoneInput = document.getElementById("profilePhone");
        var errors = [];
        if (nameInput) {
          var m1 = nameInput.value.trim() ? "" : "Họ tên không được để trống.";
          ui.setFieldError(nameInput, document.getElementById("profileNameError"), m1);
          if (m1) {
            errors.push({ id: "profileName", message: m1 });
          }
        }
        if (phoneInput) {
          var digits = phoneInput.value.trim().replace(/[\s().-]/g, "");
          var m2 = /^\+?\d{9,12}$/.test(digits) ? "" : "Số điện thoại cần từ 9 đến 12 chữ số.";
          ui.setFieldError(phoneInput, document.getElementById("profilePhoneError"), m2);
          if (m2) {
            errors.push({ id: "profilePhone", message: m2 });
          }
        }
        if (errors.length > 0) {
          event.preventDefault();
          return;
        }
        if (!actionUrl) {
          event.preventDefault();
          if (pUnavailable) {
            pUnavailable.hidden = false;
          }
        }
      });
    }

    var pwForm = document.getElementById("changePasswordForm");
    if (pwForm && ui) {
      var pwUnavailable = document.getElementById("passwordChangeUnavailable");
      pwForm.addEventListener("submit", function (event) {
        var actionUrl = (pwForm.getAttribute("action") || "").trim();
        var curPw = document.getElementById("currentPassword");
        var newPw = document.getElementById("newPassword");
        var confPw = document.getElementById("confirmNewPassword");
        var errors = [];

        if (curPw) {
          var cMsg = curPw.value ? "" : "Vui lòng nhập mật khẩu hiện tại.";
          ui.setFieldError(curPw, document.getElementById("currentPasswordError"), cMsg);
          if (cMsg) {
            errors.push({ id: "currentPassword", message: cMsg });
          }
        }
        if (newPw) {
          var nMsg = newPw.value.length >= 6 ? "" : "Mật khẩu mới cần tối thiểu 6 ký tự.";
          ui.setFieldError(newPw, document.getElementById("newPasswordError"), nMsg);
          if (nMsg) {
            errors.push({ id: "newPassword", message: nMsg });
          }
        }
        if (confPw && newPw) {
          var cfMsg = confPw.value === newPw.value ? "" : "Xác nhận mật khẩu mới chưa trùng khớp.";
          ui.setFieldError(confPw, document.getElementById("confirmNewPasswordError"), cfMsg);
          if (cfMsg) {
            errors.push({ id: "confirmNewPassword", message: cfMsg });
          }
        }
        if (errors.length > 0) {
          event.preventDefault();
          return;
        }
        if (!actionUrl) {
          event.preventDefault();
          if (pwUnavailable) {
            pwUnavailable.hidden = false;
          }
        }
      });
    }
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = val;
    }
  }

  function initInvoiceListFiltersAndPayGuard() {
    var filterBtns = document.querySelectorAll("[data-gl-invoice-filter]");
    var items = document.querySelectorAll("[data-gl-invoice-item]");
    var countEl = document.getElementById("c04VisibleCount");
    var emptyBox = document.getElementById("c04FilterEmptyBox");

    if (filterBtns.length && items.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var mode = btn.getAttribute("data-gl-invoice-filter") || "all";
          filterBtns.forEach(function (b) {
            var act = b === btn;
            b.classList.toggle("is-active", act);
          });
          var visible = 0;
          items.forEach(function (row) {
            var pst = (row.getAttribute("data-gl-payment-status") || "").toLowerCase();
            var match = mode === "all" || (mode === "paid" ? (pst === "paid" || pst === "completed") : (pst === "unpaid" || (pst !== "paid" && pst !== "completed")));
            row.hidden = !match;
            if (match) {
              visible += 1;
            }
          });
          if (countEl) {
            countEl.textContent = String(visible);
          }
          if (emptyBox) {
            emptyBox.hidden = visible > 0;
          }
        });
      });
    }

    document.querySelectorAll("[data-gl-online-pay-form]").forEach(function (payForm) {
      payForm.addEventListener("submit", function () {
        var btn = payForm.querySelector("button[type='submit']");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Đang xử lý thanh toán...";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBookingDrawerAndCancel();
    initProfileAndPasswordForms();
    initInvoiceListFiltersAndPayGuard();
  });
})();
