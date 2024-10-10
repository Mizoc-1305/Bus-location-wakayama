from flask import Flask, jsonify
from flask_cors import CORS
from google.transit import gtfs_realtime_pb2
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)  # CORSを許可

# GTFS Realtimeデータのエンドポイント（仮のURL）
VEHICLE_POSITION_URL = "https://loc.bus-vision.jp/realtime/wakayama_vpos_update.bin"

# タイムスタンプを変換する関数
def format_timestamp(timestamp):
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

# GTFS Realtimeデータを取得・解析する関数
def fetch_gtfs_data(url):
    response = requests.get(url)
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(response.content)
    return feed

# VehiclePositionデータを取得し、JSON形式で返す関数
@app.route('/vehicle_positions')
def vehicle_positions():
    try:
        feed = fetch_gtfs_data(VEHICLE_POSITION_URL)
        vehicle_data = []

        for entity in feed.entity:
            if entity.vehicle:
                vehicle = entity.vehicle
                latitude = vehicle.position.latitude
                longitude = vehicle.position.longitude
                vehicle_id = vehicle.vehicle.id
                speed = vehicle.position.speed if vehicle.position.speed else "N/A"
                timestamp = format_timestamp(vehicle.timestamp) if vehicle.timestamp else "N/A"

                vehicle_data.append({
                    "vehicle_id": vehicle_id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "speed": speed,
                    "timestamp": timestamp
                })
        
        return jsonify(vehicle_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
