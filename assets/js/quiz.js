/* ============ QUIZ ============ */
(function () {
  var C = window.APP_CONFIG;
  var ORDER = ["intro", "q1", "q2", "q3", "q4", "result"];
  var QUESTIONS = ["q1", "q2", "q3", "q4"];
  var answers = {};   // { q1: {v, label}, ... }
  var current = "intro";
  var busy = false;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // marca e preço vindos do config
  $$("[data-brand]").forEach(function (el) { el.textContent = C.brand; });
  $$("[data-price]").forEach(function (el) { el.textContent = C.priceFrom; });

  // Retoma respostas salvas (se o usuário recarregar a página)
  try { var saved = JSON.parse(sessionStorage.getItem("sm_quiz_partial") || "{}"); answers = saved || {}; } catch (e) {}

  function screen(name) { return $('[data-screen="' + name + '"]'); }

  function go(next, dir) {
    if (busy || next === current) return;
    busy = true;
    var from = screen(current), to = screen(next);
    from.classList.remove("active", "back-in");
    from.classList.add("leaving");
    setTimeout(function () {
      from.classList.remove("leaving");
      to.classList.add("active");
      if (dir === "back") to.classList.add("back-in");
      current = next;
      updateChrome();
      restoreSelection(next);
      window.scrollTo(0, 0);
      busy = false;
    }, 230);
  }

  function updateChrome() {
    var qi = QUESTIONS.indexOf(current);
    var showProg = qi > -1 || current === "result";
    $("#progress").hidden = !showProg;
    $("#backBtn").hidden = !(qi > -1 || current === "result");
    var done = qi > -1 ? qi : 4;
    var pct = Math.round((done / 4) * 100);
    $("#progBar").style.width = pct + "%";
    $("#progPct").textContent = pct + "%";
    $("#progLabel").textContent = qi > -1 ? "Pergunta " + (qi + 1) + " de 4" : "Concluído";
  }

  function restoreSelection(name) {
    var s = screen(name); if (!s || !s.dataset.q) return;
    $$(".opt", s).forEach(function (b) {
      b.classList.toggle("selected", !!(answers[name] && answers[name].v === b.dataset.v));
    });
  }

  // Início
  $("#startBtn").addEventListener("click", function () {
    track("QuizStart", { quiz: "iptv" });
    go("q1");
  });

  // Respostas
  $$(".opt").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (busy) return;
      var s = btn.closest(".screen"), q = s.dataset.q;
      $$(".opt", s).forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      answers[q] = { v: btn.dataset.v, label: btn.dataset.label };
      try { sessionStorage.setItem("sm_quiz_partial", JSON.stringify(answers)); } catch (e) {}
      track("QuizAnswer", { question: q, answer: btn.dataset.v });

      var idx = QUESTIONS.indexOf(q);
      setTimeout(function () {
        if (idx < 3) go(QUESTIONS[idx + 1]);
        else finish();
      }, 280);
    });
  });

  // Voltar
  $("#backBtn").addEventListener("click", function () {
    var qi = QUESTIONS.indexOf(current);
    if (current === "result") return go("q4", "back");
    if (qi === 0) return go("intro", "back");
    if (qi > 0) go(QUESTIONS[qi - 1], "back");
  });

  /* ---------- Perfil ---------- */
  function buildProfile() {
    var a = function (q) { return answers[q] ? answers[q].v : null; };
    var score = 0;
    if (a("q1") === "mais_30") score += 2;
    if (a("q2") === "sim") score += 2;
    if (a("q3") === "nao_sabia") score += 1;
    if (a("q4") === "sim") score += 3;
    var temp = a("q4") === "sim" ? (score >= 6 ? "quente" : "morno") : (score >= 3 ? "morno" : "frio");

    var segment;
    if (a("q1") === "mais_30" && a("q2") === "sim") segment = "economia_e_variedade";
    else if (a("q1") === "mais_30") segment = "economia";
    else if (a("q2") === "sim") segment = "variedade";
    else segment = "curioso";

    return {
      answers: answers,
      score: score,
      temperature: temp,          // quente | morno | frio
      segment: segment,
      wantsTrial: a("q4") === "sim",
      ts: new Date().toISOString()
    };
  }

  var COPY = {
    economia_e_variedade: {
      tag: "Perfil: quer economizar e ter mais opções",
      title: "Você pode ter mais opções gastando menos",
      text: "Você já gasta mais de R$ 30 por mês e ainda sente falta de conteúdo. Uma única assinatura pode reunir filmes, séries e programação ao vivo em um só lugar."
    },
    economia: {
      tag: "Perfil: quer economizar",
      title: "Dá para organizar seu entretenimento em uma assinatura só",
      text: "Você gasta mais de R$ 30 por mês com TV. Conheça uma forma de reunir diferentes opções de entretenimento em uma única experiência."
    },
    variedade: {
      tag: "Perfil: quer mais variedade",
      title: "Mais conteúdo, sem precisar de várias assinaturas",
      text: "Você tem vontade de acessar mais conteúdo, mas acha caro assinar tudo separado. Veja como funciona uma assinatura que reúne filmes, séries e programação ao vivo."
    },
    curioso: {
      tag: "Perfil: explorando opções",
      title: "Conheça uma nova forma de assistir",
      text: "Sem compromisso: veja como funciona uma plataforma que reúne filmes, séries e programação ao vivo em uma única assinatura."
    }
  };

  function finish() {
    var p = buildProfile();
    try {
      sessionStorage.setItem("sm_quiz", JSON.stringify(p));
      localStorage.setItem("sm_quiz_last", JSON.stringify(p));
    } catch (e) {}
    track("QuizComplete", { segment: p.segment, temperature: p.temperature, score: p.score,
      q1: answers.q1 && answers.q1.v, q2: answers.q2 && answers.q2.v, q3: answers.q3 && answers.q3.v, q4: answers.q4 && answers.q4.v });

    renderResult(p);
    go("result");
  }

  function renderResult(p) {
    var c = COPY[p.segment];
    $("#rTag").textContent = c.tag;
    $("#rTitle").textContent = c.title;
    $("#rText").textContent = c.text;

    var items = ["Filmes, séries e programação ao vivo em um só lugar",
                 "Planos a partir de R$ " + C.priceFrom + " por mês",
                 "Atendimento direto pelo WhatsApp"];
    if (C.trialAvailable) items.splice(2, 0, "Teste grátis de " + C.trialLabel + " para conhecer (sujeito à disponibilidade)");
    $("#rList").innerHTML = items.map(function (t) { return "<li>" + t + "</li>"; }).join("");

    // Texto do CTA conforme intenção
    var wa = $("#waBtn"), txt = $("#waTxt");
    if (p.wantsTrial && C.trialAvailable) {
      txt.textContent = "QUERO MEU TESTE GRÁTIS!";
      $("#ctaNote").textContent = "Você será atendido pelo WhatsApp · Sem compromisso";
    } else if (C.trialAvailable) {
      txt.textContent = "QUERO CONHECER SEM COMPROMISSO";
      $("#ctaNote").textContent = "Se mudar de ideia, o teste grátis continua disponível pelo WhatsApp";
    } else {
      txt.textContent = "FALAR NO WHATSAPP";
    }

    var msg = buildWaMessage(p);
    wa.href = waLink(msg);
    wa.onclick = function () {
      track("Lead", { source: "quiz_result", segment: p.segment, temperature: p.temperature });
      track("Contact", { source: "quiz_result" });
    };
    $("#lpBtn").onclick = function () { track("QuizToLP", { segment: p.segment }); };
  }

  function buildWaMessage(p) {
    var g = function (q) { return answers[q] ? answers[q].label.replace(/[!.]$/, "") : "-"; };
    var head = p.wantsTrial && C.trialAvailable
      ? "Olá! Fiz o quiz e quero solicitar meu teste grátis de " + C.trialLabel + "."
      : "Olá! Fiz o quiz e gostaria de saber mais sobre os planos.";
    return head +
      "\n\nMinhas respostas:" +
      "\n• Gasto com TV: " + g("q1") +
      "\n• Quer plataforma que acha cara: " + g("q2") +
      "\n• Sabia da assinatura única: " + g("q3") +
      "\n• Teste grátis: " + g("q4");
  }

  updateChrome();
  logServer("quiz_view");
})();
