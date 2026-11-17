/* Rastreamento: Meta Pixel + GA4 + GTM + UTMs + helpers WhatsApp */
(function () {
  var C = window.APP_CONFIG || {};
  window.dataLayer = window.dataLayer || [];

  // ---- UTMs: captura e persiste na sessão ----
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem("sm_utm") || "{}"); } catch (e) {}
  var qs = new URLSearchParams(location.search);
  KEYS.forEach(function (k) { if (qs.get(k)) utm[k] = qs.get(k); });
  try { sessionStorage.setItem("sm_utm", JSON.stringify(utm)); } catch (e) {}
  window.SM_UTM = utm;

  // ---- GTM ----
  if (C.gtmId) {
    (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ "gtm.start": Date.now(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s); j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i; f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", C.gtmId);
  }
  // ---- GA4 ----
  if (C.ga4Id) {
    var g = document.createElement("script"); g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + C.ga4Id; document.head.appendChild(g);
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", C.ga4Id);
  }
  // ---- Meta Pixel ----
  if (C.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", C.metaPixelId); fbq("track", "PageView");
  }

  var STD = { Lead: 1, Contact: 1, ViewContent: 1, CompleteRegistration: 1, InitiateCheckout: 1 };

  // ---- Contador próprio (track.php na Hostinger) ----
  var sid;
  try { sid = sessionStorage.getItem("sm_sid") || localStorage.getItem("sm_sid"); } catch (e) {}
  if (!sid) sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try { sessionStorage.setItem("sm_sid", sid); localStorage.setItem("sm_sid", sid); } catch (e) {}
  var SERVER_EVENTS = { quiz_view: 1, QuizStart: 1, QuizComplete: 1, QuizToLP: 1, lp_view: 1, Lead: 1 };
  window.logServer = function (name, params) {
    if (!SERVER_EVENTS[name] || location.protocol === "file:") return;
    var body = JSON.stringify(Object.assign({ event: name, session: sid }, utm, params || {}));
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("track.php", new Blob([body], { type: "application/json" }));
      else fetch("track.php", { method: "POST", body: body, keepalive: true });
    } catch (e) {}
  };

  /** track("QuizAnswer", {...}) → dataLayer + GA4 + Pixel */
  window.track = function (name, params) {
    params = Object.assign({}, params || {}, utm);
    dataLayer.push(Object.assign({ event: name }, params));
    if (window.gtag && C.ga4Id) gtag("event", name, params);
    if (window.fbq && C.metaPixelId) fbq(STD[name] ? "track" : "trackCustom", name, params);
    logServer(name === "ViewContent" ? "lp_view" : name, params);
  };

  /** Monta link do WhatsApp com mensagem pré-preenchida */
  window.waLink = function (msg) {
    return "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
  };

  /** Perfil do quiz salvo na sessão */
  window.getProfile = function () {
    try { return JSON.parse(sessionStorage.getItem("sm_quiz") || "null"); } catch (e) { return null; }
  };
})();
