<?php
// ヘッダー設定（CORS対応およびバイナリデータの返却）
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/octet-stream"); // バイナリデータとして返却

// GTFS Realtimeデータのエンドポイント
$vehicle_position_url = "https://loc.bus-vision.jp/realtime/wakayama_vpos_update.bin";

// データを取得
function fetch_vehicle_positions($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);
    curl_close($ch);

    return $data;
}

$data = fetch_vehicle_positions($vehicle_position_url);
// エラーチェック
if ($data === false) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch vehicle positions"]);
    exit;
}

// バイナリデータをそのまま返す
echo $data;
?>
