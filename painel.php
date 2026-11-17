<?php
date_default_timezone_set('America/Sao_Paulo');
/* Painel de cliques no WhatsApp — protegido por senha */
$SENHA = 'zwAbUvF9YRCa';           // troque se quiser
$FILE  = dirname(__DIR__) . '/funil_data/eventos.csv';

session_start();
header('X-Robots-Tag: noindex, nofollow');
if (isset($_GET['sair'])) { session_destroy(); header('Location: painel.php'); exit; }
if (isset($_POST['senha'])) {
  if (hash_equals($SENHA, (string)$_POST['senha'])) { $_SESSION['ok'] = 1; header('Location: painel.php'); exit; }
  $erro = 'Senha incorreta';
}
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

if (empty($_SESSION['ok'])) { ?>
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Painel</title><style>body{font-family:system-ui;background:#07070c;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0}
form{background:#14141f;padding:28px;border-radius:16px;border:1px solid #262638;width:290px}input,button{width:100%;padding:13px;border-radius:10px;border:1px solid #333;margin-top:10px;font-size:1rem;box-sizing:border-box}
input{background:#0e0e17;color:#fff}button{background:#ff2d55;color:#fff;border:0;font-weight:700;cursor:pointer}p{color:#ff6b81}</style></head>
<body><form method="post"><h2 style="margin:0 0 6px">📊 Painel do funil</h2><input type="password" name="senha" placeholder="Senha" autofocus><button>Entrar</button><?php if(!empty($erro)) echo "<p>{$h($erro)}</p>"; ?></form></body></html>
<?php exit; }

/* ---- Download CSV ---- */
if (isset($_GET['csv']) && file_exists($FILE)) {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="eventos-funil.csv"');
  readfile($FILE); exit;
}

/* ---- Leitura ---- */
$periodos = ['hoje' => 'Hoje', '7' => '7 dias', '30' => '30 dias', 'tudo' => 'Tudo'];
$p = $_GET['p'] ?? '7'; if (!isset($periodos[$p])) $p = '7';
$desde = $p === 'hoje' ? date('Y-m-d 00:00:00') : ($p === 'tudo' ? '0000' : date('Y-m-d 00:00:00', strtotime('-' . ((int)$p - 1) . ' days')));

$rows = [];
if (file_exists($FILE) && ($fp = fopen($FILE, 'r'))) {
  $head = fgetcsv($fp);
  while (($r = fgetcsv($fp)) !== false) {
    if (count($r) < 12 || $r[0] < $desde) continue;
    $rows[] = array_combine($head, array_slice($r, 0, count($head)));
  }
  fclose($fp);
}

$sess = fn($ev) => count(array_unique(array_column(array_filter($rows, fn($r) => $r['evento'] === $ev), 'sessao')));
$cnt  = fn($ev) => count(array_filter($rows, fn($r) => $r['evento'] === $ev));
$leads = array_values(array_filter($rows, fn($r) => $r['evento'] === 'Lead'));

$vQuiz = $sess('quiz_view'); $iQuiz = $sess('QuizStart'); $cQuiz = $sess('QuizComplete');
$vLp = $sess('lp_view'); $cliques = count($leads);
$pessoasWa = count(array_unique(array_column($leads, 'sessao')));
$visitantes = count(array_unique(array_column(array_filter($rows, fn($r) => in_array($r['evento'], ['quiz_view','lp_view'])), 'sessao')));
$taxa = $visitantes ? round($pessoasWa / $visitantes * 100, 1) : 0;

function agrupa($rows, $col) { $o = []; foreach ($rows as $r) { $k = $r[$col] !== '' ? $r[$col] : '(sem)'; $o[$k] = ($o[$k] ?? 0) + 1; } arsort($o); return $o; }
$nomesOrigem = ['quiz_result'=>'Resultado do quiz','lp_nav'=>'LP · topo (menu)','lp_hero'=>'LP · primeira dobra','lp_solucao'=>'LP · solução','lp_oferta'=>'LP · oferta','lp_teste'=>'LP · teste grátis','lp_final'=>'LP · final','lp_flutuante'=>'LP · botão flutuante'];

// últimos 14 dias
$dias = [];
for ($i = 13; $i >= 0; $i--) $dias[date('Y-m-d', strtotime("-$i days"))] = 0;
if (file_exists($FILE) && ($fp = fopen($FILE, 'r'))) { fgetcsv($fp); while (($r = fgetcsv($fp)) !== false) { $d = substr($r[0], 0, 10); if ($r[1] === 'Lead' && isset($dias[$d])) $dias[$d]++; } fclose($fp); }
$maxDia = max(1, max($dias));

function tabela($titulo, $dados, $nomes = []) {
  $tot = array_sum($dados) ?: 1;
  echo "<div class='card'><h3>" . htmlspecialchars($titulo) . "</h3>";
  if (!$dados) { echo "<p class='vazio'>Sem dados no período</p></div>"; return; }
  echo "<table>";
  foreach ($dados as $k => $v) { $pct = round($v / $tot * 100);
    echo "<tr><td>" . htmlspecialchars($nomes[$k] ?? $k) . "<div class='bar'><i style='width:{$pct}%'></i></div></td><td class='n'>$v</td><td class='pc'>$pct%</td></tr>"; }
  echo "</table></div>";
}
?>
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Painel do funil</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#07070c;color:#f4f4f8;margin:0;padding:18px}
.top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;max-width:1100px;margin:0 auto 18px}
h1{font-size:1.35rem;margin:0}a{color:#a3a3b8}
.tabs a{display:inline-block;padding:8px 14px;border-radius:99px;border:1px solid #262638;text-decoration:none;margin:2px;font-size:.9rem}
.tabs a.on{background:#ff2d55;border-color:#ff2d55;color:#fff}
.wrap{max-width:1100px;margin:0 auto}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.k{background:#14141f;border:1px solid #262638;border-radius:14px;padding:16px}
.k small{color:#a3a3b8;font-size:.8rem}.k b{display:block;font-size:1.9rem;margin-top:4px}
.k.wa{border-color:#25d366;background:linear-gradient(160deg,rgba(37,211,102,.14),#14141f)}.k.wa b{color:#25d366}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.card{background:#14141f;border:1px solid #262638;border-radius:14px;padding:16px;margin-bottom:12px;overflow-x:auto}
.card h3{margin:0 0 12px;font-size:1rem}
table{width:100%;border-collapse:collapse;font-size:.9rem}td,th{padding:8px 6px;border-bottom:1px solid #20202e;text-align:left;white-space:nowrap}
th{color:#a3a3b8;font-weight:600;font-size:.78rem}td.n{text-align:right;font-weight:700;width:50px}td.pc{text-align:right;color:#6e6e86;width:46px}
.bar{height:4px;background:#20202e;border-radius:4px;margin-top:5px}.bar i{display:block;height:100%;background:linear-gradient(90deg,#ff2d55,#c026d3);border-radius:4px}
.funnel div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #20202e}
.chart{display:flex;align-items:flex-end;gap:5px;height:140px;padding-top:10px}
.chart div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:.68rem;color:#6e6e86}
.chart span{width:100%;background:#25d366;border-radius:5px 5px 0 0;min-height:2px}.chart em{font-style:normal;color:#f4f4f8;font-weight:700;margin-bottom:3px}
.vazio{color:#6e6e86}.tag{padding:2px 8px;border-radius:99px;font-size:.75rem}
.quente{background:rgba(255,45,85,.2);color:#ff7d97}.morno{background:rgba(255,200,61,.18);color:#ffc83d}.frio{background:rgba(14,165,233,.18);color:#5cc4f2}
</style></head><body>
<div class="top">
  <h1>📊 Cliques no WhatsApp</h1>
  <div class="tabs"><?php foreach ($periodos as $k => $n) echo "<a class='" . ($k == $p ? 'on' : '') . "' href='?p=$k'>$n</a>"; ?></div>
  <div><a href="?csv=1">⬇ CSV</a> · <a href="?sair=1">Sair</a></div>
</div>
<div class="wrap">
  <div class="kpis">
    <div class="k wa"><small>Cliques no WhatsApp</small><b><?= $cliques ?></b></div>
    <div class="k wa"><small>Pessoas que clicaram</small><b><?= $pessoasWa ?></b></div>
    <div class="k"><small>Visitantes (quiz + LP)</small><b><?= $visitantes ?></b></div>
    <div class="k"><small>Taxa visitante → WhatsApp</small><b><?= $taxa ?>%</b></div>
  </div>

  <div class="grid">
    <div class="card"><h3>Funil (pessoas únicas)</h3><div class="funnel">
      <div><span>Abriram o quiz</span><b><?= $vQuiz ?></b></div>
      <div><span>Começaram o quiz</span><b><?= $iQuiz ?></b></div>
      <div><span>Concluíram o quiz</span><b><?= $cQuiz ?></b></div>
      <div><span>Viram a LP</span><b><?= $vLp ?></b></div>
      <div><span style="color:#25d366">Clicaram no WhatsApp</span><b style="color:#25d366"><?= $pessoasWa ?></b></div>
    </div></div>
    <div class="card"><h3>Cliques no WhatsApp · últimos 14 dias</h3><div class="chart">
      <?php foreach ($dias as $d => $v) { $hgt = round($v / $maxDia * 100); echo "<div><em>" . ($v ?: '') . "</em><span style='height:{$hgt}%'></span>" . date('d/m', strtotime($d)) . "</div>"; } ?>
    </div></div>
  </div>

  <div class="grid">
    <?php tabela('Por botão clicado', agrupa($leads, 'origem'), $nomesOrigem); ?>
    <?php tabela('Por temperatura do lead', agrupa($leads, 'temperatura')); ?>
    <?php tabela('Por perfil do quiz', agrupa($leads, 'perfil'), ['economia_e_variedade'=>'Economia + variedade','economia'=>'Economia','variedade'=>'Variedade','curioso'=>'Curioso']); ?>
    <?php tabela('Por campanha (utm_campaign)', agrupa($leads, 'utm_campaign')); ?>
    <?php tabela('Por origem do tráfego (utm_source)', agrupa($leads, 'utm_source')); ?>
    <?php tabela('Por dispositivo', agrupa($leads, 'dispositivo')); ?>
  </div>

  <div class="card"><h3>Últimos cliques</h3>
  <?php if (!$leads) echo "<p class='vazio'>Nenhum clique no período ainda.</p>"; else { ?>
  <table><tr><th>Data/hora</th><th>Botão</th><th>Temperatura</th><th>Perfil</th><th>Campanha</th><th>Dispositivo</th></tr>
  <?php foreach (array_slice(array_reverse($leads), 0, 50) as $r) {
    $t = $r['temperatura'];
    echo "<tr><td>" . $h(date('d/m H:i', strtotime($r['data']))) . "</td><td>" . $h($nomesOrigem[$r['origem']] ?? $r['origem']) . "</td><td>" . ($t ? "<span class='tag " . $h($t) . "'>" . $h($t) . "</span>" : '-') . "</td><td>" . $h($r['perfil'] ?: '-') . "</td><td>" . $h($r['utm_campaign'] ?: '-') . "</td><td>" . $h($r['dispositivo']) . "</td></tr>";
  } ?></table><?php } ?>
  </div>
</div></body></html>
