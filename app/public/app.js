/* PR Preview Platform — dashboard runtime (no dependencies) */
(function () {
  "use strict";

  var REFRESH_MS = 15000;
  var startedAt = null;
  var timer = null;

  function $(id) { return document.getElementById(id); }

  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = value;
  }

  function fmtUptime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    var d = Math.floor(totalSeconds / 86400);
    var h = Math.floor((totalSeconds % 86400) / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    if (d > 0) return d + "d " + h + "h " + m + "m";
    if (h > 0) return h + "h " + m + "m " + s + "s";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  }

  function setLive(state, label) {
    var el = $("live-status");
    if (!el) return;
    el.className = "live" + (state ? " " + state : "");
    setText("live-label", label);
  }

  function render(data) {
    startedAt = data.startedAt;

    setText("env-chip", data.environment);
    setText("hero-pr", data.prNumber === "LOCAL" ? "LOCAL" : "#" + data.prNumber);
    setText("stat-pr", data.prNumber === "LOCAL" ? "LOCAL" : "#" + data.prNumber);
    setText("stat-version", data.version);
    setText("stat-hostname", data.hostname);
    var hostEl = $("stat-hostname");
    if (hostEl) hostEl.title = data.hostname;
    setText("stat-namespace", data.namespace);
    setText("stat-runtime", data.runtime);
    setText("detail-started", new Date(data.startedAt).toLocaleString());
    setText("footer-meta", data.service + " · " + data.runtime);
    setText("pipeline-badge", data.status === "healthy" ? "completed" : "degraded");

    var badge = $("detail-status");
    if (badge) {
      badge.textContent = data.status;
      badge.className = "badge " + (data.status === "healthy" ? "badge-ok" : "badge-err");
    }

    setLive("ok", "Live");
    setText("last-updated", "updated " + new Date().toLocaleTimeString());
    tickUptime();
  }

  function tickUptime() {
    if (!startedAt) return;
    var elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    setText("stat-uptime", fmtUptime(elapsed));
    setText("detail-time", new Date().toLocaleTimeString());
  }

  function load() {
    fetch("/api/status", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(render)
      .catch(function () {
        setLive("err", "Disconnected");
        setText("last-updated", "retrying…");
      });
  }

  function start() {
    if (timer) return;
    load();
    timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearInterval(timer);
        timer = null;
      } else {
        load();
        timer = setInterval(load, REFRESH_MS);
      }
    });
  }

  setInterval(tickUptime, 1000);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
