// 地図の初期化
let map = L.map('map').setView([34.23237487, 135.1910052], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let markers = {}; // マーカーを管理するオブジェクト
let tracks = {}; // 軌跡を管理するオブジェクト

// Protocol Buffersをロード
protobuf.load("proto/gtfs-realtime.proto", function(err, root) { // 修正: gtfs-realtime.proto のパスが正しいことを確認
    if (err) {
        console.error(err);
        return;
    }

    let VehiclePosition = root.lookupType("transit_realtime.FeedMessage");

    // APIから車両位置データを取得して地図に描画
    function fetchVehiclePositions() {
        fetch('main.php')
            .then(response => response.arrayBuffer()) // バイナリデータとして取得
            .then(buffer => {
                console.log("Received data:", buffer);
                // データの形式をデバッグして確認
                if (buffer.byteLength === 0) {
                    throw new Error('Empty response');
                }

                // Protocol Buffersのデコード
                let message;
                try {
                    message = VehiclePosition.decode(new Uint8Array(buffer));
                } catch (err) {
                    console.error('Failed to decode:', err);
                    throw err;
                }

                let data = message.entity;
                console.log("Decoded data:", data);

                data.forEach(entity => {
                    if (entity.vehicle && entity.vehicle.position) {
                        let vehicle = entity.vehicle;
                        let latlng = [vehicle.position.latitude, vehicle.position.longitude];

                        // 既存のマーカーがあれば更新、軌跡も追加
                        if (markers[vehicle.vehicle.id]) {
                            markers[vehicle.vehicle.id].setLatLng(latlng); // マーカーの位置更新
                            tracks[vehicle.vehicle.id].push(latlng); // 軌跡追加
                            L.polyline(tracks[vehicle.vehicle.id], { color: 'red' }).addTo(map); // 軌跡更新
                        } else {
                            // 新しいマーカーを作成
                            let marker = L.marker(latlng, {
                                icon: L.icon({
                                    iconUrl: 'img/bus-icon.png', // アイコンを指定
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10],
                                    popupAnchor: [0, -10]
                                })
                            }).addTo(map).bindPopup(`Vehicle ID: ${vehicle.vehicle.id}<br>速度: ${vehicle.position.speed} km/h`);

                            markers[vehicle.vehicle.id] = marker;
                            tracks[vehicle.vehicle.id] = [latlng];
                        }
                    }
                });

                // ズームを調整（手動でズームされている場合はズーム調整しない）
                let allMarkers = Object.values(markers);
                if (allMarkers.length > 0 && !map.userHasZoomed) {
                    let group = new L.featureGroup(allMarkers);
                    map.fitBounds(group.getBounds());
                }
            })
            .catch(error => console.error('Error fetching vehicle positions:', error));
    }

    // ユーザがズームしたかどうかを記録
    map.on('zoomstart', function() {
        map.userHasZoomed = true;
    });

    // 10秒ごとに位置情報を更新
    setInterval(fetchVehiclePositions, 10000);

    // 初回呼び出し
    fetchVehiclePositions();
});