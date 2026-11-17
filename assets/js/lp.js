/* ============ LANDING PAGE ============ */
(function () {
  var C = window.APP_CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var profile = getProfile();

  // Marca, preço, teste
  $$("[data-brand]").forEach(function (e) { e.textContent = C.brand; });
  $$("[data-price]").forEach(function (e) { e.textContent = C.priceFrom; });
  $$("[data-trial]").forEach(function (e) { e.textContent = C.trialLabel; });
  var pp = C.priceFrom.split(","); $("#pInt").textContent = pp[0]; $("#pDec").textContent = "," + (pp[1] || "00");
  if (!C.trialAvailable) $$(".js-trial").forEach(function (e) { e.remove(); });
  $("#yr").textContent = new Date().getFullYear();

  // Dispositivos (vêm do config.js)
  $("#devices").innerHTML = C.devices.map(function (d) {
    return '<div class="dev reveal"><svg><use href="#i-' + d.icon + '"/></svg>' + d.name + "</div>";
  }).join("");

  // Planos (opcional)
  if (C.plans && C.plans.length) {
    $("#offerBox").style.display = "none";
    $("#plansWrap").innerHTML = '<div class="plans">' + C.plans.map(function (p) {
      return '<div class="plan reveal' + (p.highlight ? " hl" : "") + '"><h3>' + p.name + '</h3>' +
        '<div class="offer-price"><span class="cur">R$</span><span class="int">' + p.price.split(",")[0] + '</span><span class="dec">,' + (p.price.split(",")[1] || "00") + '</span><span class="per">' + (p.period || "/mês") + '</span></div>' +
        '<ul class="checks">' + (p.items || []).map(function (i) { return "<li><span>✓</span>" + i + "</li>"; }).join("") + "</ul>" +
        '<a class="btn btn-wa btn-block js-wa" data-src="plano_' + p.name + '" data-plan="' + p.name + '" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Quero este plano</a></div>';
    }).join("") + "</div>";
  }

  // Mensagem do WhatsApp (usa respostas do quiz, se houver)
  function message(plan) {
    var head = plan ? "Olá! Tenho interesse no plano " + plan + "."
      : C.trialAvailable ? "Olá! Quero solicitar meu teste grátis de " + C.trialLabel + "."
      : "Olá! Quero saber mais sobre os planos.";
    if (profile && profile.answers) {
      var a = profile.answers, g = function (q) { return a[q] ? a[q].label.replace(/[!.]$/, "") : "-"; };
      head += "\n\nFiz o quiz:" +
        "\n• Gasto com TV: " + g("q1") +
        "\n• Quer plataforma que acha cara: " + g("q2") +
        "\n• Sabia da assinatura única: " + g("q3") +
        "\n• Teste grátis: " + g("q4");
    }
    return head;
  }
  $$(".js-wa").forEach(function (a) {
    a.href = waLink(message(a.dataset.plan));
    a.addEventListener("click", function () {
      var p = { source: "lp_" + (a.dataset.src || "cta") };
      if (profile) { p.segment = profile.segment; p.temperature = profile.temperature; }
      track("Lead", p); track("Contact", p);
    });
  });

  // FAQ — respostas sem inventar condições comerciais
  var FAQ = [
    ["Como funciona a assinatura?", "Você assina um único plano e acessa diferentes opções de entretenimento, como filmes, séries e programação ao vivo, em uma só plataforma. Os detalhes de cada plano são passados pelo atendimento no WhatsApp."],
    ["Quanto custa?", "Os planos começam a partir de R$ " + C.priceFrom + " por mês. Valores, formas de pagamento e condições de cada plano são informados pelo atendimento."],
    C.trialAvailable ? ["Como funciona o teste grátis?", "Quando a modalidade está disponível, você pode solicitar um teste gratuito de " + C.trialLabel + " pelo WhatsApp para conhecer a plataforma antes de decidir."] : null,
    ["Em quais aparelhos posso assistir?", "Veja a lista de dispositivos nesta página e confirme com o atendimento qual é a melhor opção para o seu aparelho antes de assinar."],
    ["Como faço para assinar?", "Toque em qualquer botão de WhatsApp desta página. Nosso atendimento apresenta os planos e orienta todo o processo."],
    ["Como posso cancelar?", "As regras de cancelamento são informadas pelo atendimento antes da contratação. Tire todas as suas dúvidas pelo WhatsApp."]
  ].filter(Boolean);
  $("#faqList").innerHTML = FAQ.map(function (f) {
    return '<details class="reveal"><summary>' + f[0] + "</summary><p>" + f[1] + "</p></details>";
  }).join("");
  $$("#faqList details").forEach(function (d, i) {
    d.addEventListener("toggle", function () { if (d.open) track("FaqOpen", { question: FAQ[i][0] }); });
  });
  // FAQ Schema (SEO)
  $("#faqSchema").textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQ.map(function (f) { return { "@type": "Question", name: f[0], acceptedAnswer: { "@type": "Answer", text: f[1] } }; })
  });

  // Personalização leve do hero conforme perfil
  if (profile && profile.segment === "economia_e_variedade") {
    $("#heroLead").innerHTML = "Você gasta mais de R$ 30 com TV e ainda quer mais opções? Reúna filmes, séries e programação ao vivo em uma só assinatura, a partir de <strong>R$ " + C.priceFrom + "/mês</strong>.";
  }

  // Reveal on scroll
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  $$(".reveal").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });

  // Botão flutuante aparece após o hero
  var fl = $("#waFloat");
  window.addEventListener("scroll", function () { fl.classList.toggle("hide", window.scrollY < 500); }, { passive: true });

  // Scroll depth
  var marks = { 50: 0, 90: 0 };
  window.addEventListener("scroll", function () {
    var pct = (window.scrollY + innerHeight) / document.body.scrollHeight * 100;
    [50, 90].forEach(function (m) { if (pct >= m && !marks[m]) { marks[m] = 1; track("ScrollDepth", { percent: m }); } });
  }, { passive: true });

  track("ViewContent", { page: "lp", from_quiz: !!profile });
})();
