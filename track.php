<?php
date_default_timezone_set('America/Sao_Paulo');
/* Recebe eventos do funil e grava em CSV fora da public_html */
header('Content-Type: application/json');
header('Cache-Control: no-store');

$ALLOWED = ['quiz_view','QuizStart','QuizComplete','QuizToLP','lp_view','Lead'];
$DIR = dirname(__DIR__) . '/funil_data';
$FILE = $DIR . '/eventos.csv';
$SALT = 'bcb34889af77ca4d'; // usado só para anonimizar o IP

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit('{"ok":false}'); }
$raw = file_get_contents('php://input', false, null, 0, 4096);
$d = json_decode($raw, true);
if (!is_array($d) || !in_array($d['event'] ?? '', $ALLOWED, true)) { http_response_code(400); exit('{"ok":false}'); }

$clean = function ($v, $max = 80) {
  $v = is_scalar($v) ? (string)$v : '';
  $v = preg_replace('/[\r\n\t,;"]+/', ' ', $v);
  return mb_substr(trim($v), 0, $max);
};

if (!is_dir($DIR)) { mkdir($DIR, 0750, true); }
$new = !file_exists($FILE);
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$ip = trim(explode(',', $ip)[0]);
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$mobile = preg_match('/Mobile|Android|iPhone/i', $ua) ? 'mobile' : 'desktop';

$row = [
  date('Y-m-d H:i:s'),
  $clean($d['event']),
  $clean($d['session'] ?? '', 40),
  substr(hash('sha256', $SALT . $ip), 0, 12),
  $clean($d['source'] ?? ''),
  $clean($d['segment'] ?? ''),
  $clean($d['temperature'] ?? ''),
  $clean($d['utm_source'] ?? ''),
  $clean($d['utm_medium'] ?? ''),
  $clean($d['utm_campaign'] ?? '', 120),
  $clean($d['utm_content'] ?? '', 120),
  $mobile,
];

$fp = fopen($FILE, 'a');
if ($fp && flock($fp, LOCK_EX)) {
  if ($new) fputcsv($fp, ['data','evento','sessao','visitante','origem','perfil','temperatura','utm_source','utm_medium','utm_campaign','utm_content','dispositivo']);
  fputcsv($fp, $row);
  flock($fp, LOCK_UN);
}
if ($fp) fclose($fp);
echo '{"ok":true}';
