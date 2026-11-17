/* ============================================================
   CONFIGURAÇÃO CENTRAL — edite SÓ este arquivo
   ============================================================ */
window.APP_CONFIG = {
  brand: "MaisTela",                 // nome da marca / app
  whatsapp: "5555991848382",          // DDI+DDD+número, só dígitos (ex.: 5555991234567)
  priceFrom: "26,90",                 // "Planos a partir de R$ ..."
  trialAvailable: true,               // false = esconde/ajusta a menção ao teste grátis
  trialLabel: "2 horas",

  // ---- Rastreamento (deixe "" para desativar) ----
  metaPixelId: "",                    // ex.: "123456789012345"
  ga4Id: "",                          // ex.: "G-XXXXXXXXXX"
  gtmId: "",                          // ex.: "GTM-XXXXXXX"

  // ---- Dispositivos compatíveis ----
  // ⚠️ CONFIRME COM O FORNECEDOR. Deixe apenas o que for realmente suportado.
  devices: [
    { icon: "tv",      name: "Smart TV" },
    { icon: "phone",   name: "Celular" },
    { icon: "tablet",  name: "Tablet" },
    { icon: "box",     name: "TV Box" },
    { icon: "laptop",  name: "Computador" }
  ],

  // ---- Planos (opcional) ----
  // Preencha com os planos reais. Se a lista ficar vazia, a LP mostra só o "a partir de".
  plans: [
    // { name: "Mensal", price: "26,90", period: "/mês", highlight: true, items: ["..."] },
  ]
};
