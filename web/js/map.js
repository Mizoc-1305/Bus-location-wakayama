// 地図の初期化
let map = L.map('map').setview([34.23237487,135.1910052], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let markers = {}; // マーカーを管理するオブジェクト
let tracks = {}; // 軌跡を管理するオブジェクト

// APIから車両位置データを取得して地図に描画
function fetchVehiclePositions() {
    fetch('main.php')
        .then(response => response.json())
        .then(data => {
            data.forEach(vehicle => {
                let latlng = [vehicle.latitude, vehicle.longtitude];

                //既存のマーカーがあれば一更新、軌跡も追加
                if (markers[vehicle.vehicle_id]) {
                    markers[vehicle.vehicle_id].setLatlng(latlng); //マーカーの位置更新
                    tracks[vehicle.vehicle_id].push(latlng); // 軌跡追加
                    L.polyline(tracks[vehicle.vehicle_id], { color: 'red' }).addTo(map); // 軌跡更新
                } else {
                    // 新しいマーカーを作成
                    let marker = L.marker(latlng, {
                        icon: L.icon({
                            iconUrl: 'img/bus-icon.png', // アイコンを指定
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                            popupAnchor: [0, -10]
                        })
                    }).addTo(map).bindPopup(`Vehicle ID: ${vehicle.vehicle_id}<br>速度: ${vehicle.speed} km/h`);

                    markers[vehicle.vehicle_id] = marker;
                    tracks[vehicle.vehicle_id] = [latlng];
                }
            });

            //ズームを調整（手動でズームされている場合はズーム調整しない）
            let allMarkers = Object.values(markers);
            if (allMarkers.length > 0 && !map.userHasZoomed) {
                let group = new L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds())
            }
        })
        .catch(error => console.error('Error fetching vehicle positions:', error));
}

//ユーザがズームしたかどうかを記録
map.on('zoomstart', function() {
    map.userHasZoomed = true;
});

//10秒ごとに位置情報を更新
setInterval(fetchVehiclePositions, 10000);

//初回呼び出し
fetchVehiclePositions();