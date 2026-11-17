# Quiziptv — Funil Quiz + Landing Page

Site estático (HTML/CSS/JS puro), mobile-first, sem build.

## Estrutura
```
index.html            → Quiz (porta de entrada dos anúncios)
oferta.html           → Landing page
assets/css/style.css  → Design system
assets/js/config.js   → ⚙️ EDITE AQUI: marca, WhatsApp, preço, pixels, dispositivos, planos
assets/js/tracking.js → Meta Pixel, GA4, GTM, UTMs
assets/js/quiz.js     → Lógica do quiz + perfil do lead
assets/js/lp.js       → FAQ, CTAs, personalização
```

## Antes de publicar (checklist)
1. `config.js` → `whatsapp` (só dígitos com DDI 55), `brand`, `metaPixelId`, `ga4Id`/`gtmId`.
2. `config.js` → `devices`: deixe **apenas** os aparelhos confirmados pelo fornecedor.
3. `config.js` → `plans`: preencha se quiser mostrar planos detalhados (senão aparece só "a partir de").
4. `trialAvailable: false` remove todas as menções ao teste grátis.

## Eventos rastreados
| Evento | Quando |
|---|---|
| QuizStart | clicou "Começar" |
| QuizAnswer | cada resposta (question, answer) |
| QuizComplete | terminou (segment, temperature, q1–q4) |
| QuizToLP | foi do resultado para a LP |
| Lead + Contact | clique em qualquer botão de WhatsApp (source) |
| ViewContent / ScrollDepth / FaqOpen | LP |

Perfil salvo em `sessionStorage.sm_quiz` e enviado na mensagem do WhatsApp.
Segmentos: `economia_e_variedade`, `economia`, `variedade`, `curioso`. Temperatura: `quente`, `morno`, `frio`.

## Deploy na Hostinger
Suba o **conteúdo** desta pasta direto dentro de `public_html` (não crie uma `public_html` dentro da outra).
