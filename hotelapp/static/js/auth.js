/* P04 Login & P05 Register — Inline Validation, Password Strength & Nationality Sync */
(function () {
  "use strict";

  var ui = window.ValentiaUi;

  function initLoginPage() {
    var form = document.getElementById("loginForm");
    if (!form || !ui) {
      return;
    }

    var usernameInput = document.getElementById("loginUsername");
    var passwordInput = document.getElementById("loginPassword");
    var submitBtn = document.getElementById("loginSubmitBtn");
    var summaryBox = document.getElementById("loginErrorSummary");
    var summaryTitle = document.getElementById("loginErrorSummaryTitle");
    var summaryList = document.getElementById("loginErrorSummaryList");

    function validateLogin() {
      var errors = [];
      if (usernameInput) {
        var uErr = usernameInput.value.trim() ? "" : "Vui lòng nhập tên đăng nhập.";
        ui.setFieldError(usernameInput, document.getElementById("loginUsernameError"), uErr);
        if (uErr) {
          errors.push({ id: "loginUsername", message: uErr });
        }
      }
      if (passwordInput) {
        var pErr = passwordInput.value ? "" : "Vui lòng nhập mật khẩu.";
        ui.setFieldError(passwordInput, document.getElementById("loginPasswordError"), pErr);
        if (pErr) {
          errors.push({ id: "loginPassword", message: pErr });
        }
      }
      return errors;
    }

    [usernameInput, passwordInput].forEach(function (field) {
      if (field) {
        field.addEventListener("blur", validateLogin);
      }
    });

    form.addEventListener("submit", function (event) {
      var errors = validateLogin();
      if (errors.length > 0) {
        event.preventDefault();
        ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, errors);
        return;
      }
      ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, []);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang đăng nhập…";
      }
    });
  }

  function initRegisterPage() {
    var form = document.getElementById("registerForm");
    if (!form || !ui) {
      return;
    }

    var natSelect = document.getElementById("regNationalitySelect");
    var natOtherWrap = document.getElementById("regNationalityOtherWrap");
    var natOtherInput = document.getElementById("regNationalityOther");
    var natHidden = document.getElementById("regNationalityHidden");
    var cccdLabel = document.getElementById("regCccdLabel");

    function syncNationality() {
      if (!natSelect || !natHidden) {
        return;
      }
      var isOther = natSelect.value === "other";
      if (natOtherWrap) {
        natOtherWrap.hidden = !isOther;
      }
      natHidden.value = isOther ? (natOtherInput ? natOtherInput.value.trim() : "") : natSelect.value;
      if (cccdLabel) {
        cccdLabel.innerHTML = (isOther ? "Số hộ chiếu" : "CMND / CCCD") + ' <span class="gl-required-mark">*</span>';
      }
    }

    if (natSelect) {
      natSelect.addEventListener("change", syncNationality);
    }
    if (natOtherInput) {
      natOtherInput.addEventListener("input", syncNationality);
    }
    syncNationality();

    var pwInput = document.getElementById("regPassword");
    var pwBar = document.getElementById("regPasswordStrengthBar");
    var pwHelp = document.getElementById("regPasswordHelp");
    var confirmInput = document.getElementById("regConfirm");
    var confirmMatch = document.getElementById("regConfirmMatch");

    function updatePasswordStrength() {
      if (!pwInput || !pwBar || !pwHelp) {
        return;
      }
      var val = pwInput.value;
      if (!val) {
        pwBar.style.width = "0";
        pwHelp.textContent = "Tối thiểu 6 ký tự, nên kết hợp chữ cái và chữ số.";
        return;
      }
      var score = 0;
      if (val.length >= 6) {
        score += 1;
      }
      if (/[A-Za-z]/.test(val) && /\d/.test(val)) {
        score += 1;
      }
      if (val.length >= 10 || /[^A-Za-z0-9]/.test(val)) {
        score += 1;
      }
      if (score <= 1) {
        pwBar.style.width = "33%";
        pwBar.style.backgroundColor = "#B42318";
        pwHelp.textContent = "Độ mạnh mật khẩu: Yếu (nên dùng từ 6 ký tự kèm chữ và số).";
      } else if (score === 2) {
        pwBar.style.width = "66%";
        pwBar.style.backgroundColor = "#8A6A1F";
        pwHelp.textContent = "Độ mạnh mật khẩu: Trung bình.";
      } else {
        pwBar.style.width = "100%";
        pwBar.style.backgroundColor = "#1F7A4D";
        pwHelp.textContent = "Độ mạnh mật khẩu: Tốt.";
      }
    }

    function updateConfirmMatch() {
      if (!confirmInput || !confirmMatch || !pwInput) {
        return;
      }
      if (!confirmInput.value) {
        confirmMatch.hidden = true;
        return;
      }
      confirmMatch.hidden = false;
      if (confirmInput.value === pwInput.value) {
        confirmMatch.textContent = "Mật khẩu xác nhận đã trùng khớp.";
        confirmMatch.style.color = "#1F7A4D";
      } else {
        confirmMatch.textContent = "Mật khẩu xác nhận chưa trùng khớp.";
        confirmMatch.style.color = "#B42318";
      }
    }

    if (pwInput) {
      pwInput.addEventListener("input", function () {
        updatePasswordStrength();
        updateConfirmMatch();
      });
    }
    if (confirmInput) {
      confirmInput.addEventListener("input", updateConfirmMatch);
    }

    var fields = [
      { id: "regName", label: "Họ và tên", rule: "required" },
      { id: "regCccd", label: "Giấy tờ tùy thân", rule: "id-number" },
      { id: "regPhone", label: "Số điện thoại", rule: "phone" },
      { id: "regUsername", label: "Tên đăng nhập", rule: "username" },
      { id: "regPassword", label: "Mật khẩu", rule: "password" },
      { id: "regConfirm", label: "Xác nhận mật khẩu", rule: "confirm" }
    ];

    var summaryBox = document.getElementById("registerErrorSummary");
    var summaryTitle = document.getElementById("registerErrorSummaryTitle");
    var summaryList = document.getElementById("registerErrorSummaryList");
    var submitBtn = document.getElementById("registerSubmitBtn");

    function validateNationality() {
      syncNationality();
      if (!natSelect || !natHidden) {
        return null;
      }
      var errEl = document.getElementById("regNationalityError");
      var msg = (natSelect.value === "other" && !natHidden.value) ? "Vui lòng nhập tên quốc gia." : "";
      if (natOtherInput) {
        ui.setFieldError(natOtherInput, errEl, msg);
      }
      return msg ? { id: "regNationalityOther", message: msg } : null;
    }

    function validateField(item) {
      var input = document.getElementById(item.id);
      var errEl = document.getElementById(item.id + "Error");
      if (!input || !errEl) {
        return null;
      }
      var val = (item.rule === "password" || item.rule === "confirm") ? input.value : input.value.trim();
      var message = "";

      if (!val) {
        message = item.label + " không được để trống.";
      } else if (item.rule === "id-number" && val.length < 6) {
        message = item.label + " cần tối thiểu 6 ký tự.";
      } else if (item.rule === "phone") {
        var digits = val.replace(/[\s().-]/g, "");
        if (!/^\+?\d{9,12}$/.test(digits)) {
          message = "Số điện thoại cần từ 9 đến 12 chữ số hợp lệ.";
        }
      } else if (item.rule === "username" && (!/^\S{3,}$/.test(val))) {
        message = "Tên đăng nhập cần tối thiểu 3 ký tự và không có khoảng trắng.";
      } else if (item.rule === "password" && val.length < 6) {
        message = "Mật khẩu cần tối thiểu 6 ký tự.";
      } else if (item.rule === "confirm") {
        if (pwInput && val !== pwInput.value) {
          message = "Mật khẩu xác nhận chưa trùng khớp.";
        }
      }

      ui.setFieldError(input, errEl, message);
      return message ? { id: item.id, message: message } : null;
    }

    fields.forEach(function (item) {
      var input = document.getElementById(item.id);
      if (input) {
        input.addEventListener("blur", function () {
          validateField(item);
        });
      }
    });

    form.addEventListener("submit", function (event) {
      var errors = [];
      var natErr = validateNationality();
      if (natErr) {
        errors.push(natErr);
      }
      fields.forEach(function (item) {
        var err = validateField(item);
        if (err) {
          errors.push(err);
        }
      });

      if (errors.length > 0) {
        event.preventDefault();
        ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, errors);
        return;
      }

      ui.renderErrorSummary(summaryBox, summaryTitle, summaryList, []);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang tạo tài khoản…";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLoginPage();
    initRegisterPage();
  });
})();
