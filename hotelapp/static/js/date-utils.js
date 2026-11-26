/* Shared calendar date helpers for The Valentia Hotel & Suites (UTC-safe, no locale drift) */
(function (global) {
  "use strict";

  function parseIsoDateParts(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return null;
    }
    var parts = isoDate.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    var check = new Date(Date.UTC(year, month - 1, day));
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day };
  }

  function parseDisplayDateViToIso(displayStr) {
    if (!displayStr) {
      return "";
    }
    var trimmed = displayStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return parseIsoDateParts(trimmed) ? trimmed : "";
    }
    var match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (!match) {
      return "";
    }
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);
    var check = new Date(Date.UTC(year, month - 1, day));
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      return "";
    }
    var mm = month < 10 ? "0" + month : String(month);
    var dd = day < 10 ? "0" + day : String(day);
    return year + "-" + mm + "-" + dd;
  }

  function formatDateVi(isoDate) {
    var parts = parseIsoDateParts(isoDate);
    if (!parts) {
      return "—";
    }
    var dd = parts.day < 10 ? "0" + parts.day : String(parts.day);
    var mm = parts.month < 10 ? "0" + parts.month : String(parts.month);
    return dd + "/" + mm + "/" + parts.year;
  }

  function dateObjToIso(dateObj) {
    if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
      return "";
    }
    var y = dateObj.getFullYear();
    var m = dateObj.getMonth() + 1;
    var d = dateObj.getDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
  }

  function getTodayIso() {
    return dateObjToIso(new Date());
  }

  function addDaysIso(isoDate, days) {
    var parts = parseIsoDateParts(isoDate);
    if (!parts) {
      return "";
    }
    var d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
    var y = d.getUTCFullYear();
    var m = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function computeNightCount(checkInIso, checkOutIso) {
    var start = parseIsoDateParts(checkInIso);
    var end = parseIsoDateParts(checkOutIso);
    if (!start || !end) {
      return 0;
    }
    var startUtc = Date.UTC(start.year, start.month - 1, start.day);
    var endUtc = Date.UTC(end.year, end.month - 1, end.day);
    var diffDays = Math.round((endUtc - startUtc) / 86400000);
    return diffDays > 0 ? diffDays : 0;
  }

  function formatStaySummary(checkInIso, checkOutIso) {
    var nights = computeNightCount(checkInIso, checkOutIso);
    if (nights <= 0) {
      return "Vui lòng chọn ngày nhận và ngày trả phòng hợp lệ.";
    }
    return formatDateVi(checkInIso) + " – " + formatDateVi(checkOutIso) + " · " + nights + " đêm";
  }

  global.ValentiaDateUtils = {
    parseIsoDateParts: parseIsoDateParts,
    parseDisplayDateViToIso: parseDisplayDateViToIso,
    formatDateVi: formatDateVi,
    dateObjToIso: dateObjToIso,
    getTodayIso: getTodayIso,
    addDaysIso: addDaysIso,
    computeNightCount: computeNightCount,
    formatStaySummary: formatStaySummary
  };
})(window);
