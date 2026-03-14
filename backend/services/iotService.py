import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List

# Mock IoT Service simulating AWS IoT Core
class IoTService:
    """
    IoT Service abstraction layer.
    Currently returns mock sensor data.
    Will be replaced with AWS IoT Core MQTT subscriptions.
    
    Future Implementation:
    - Subscribe to MQTT topic: farm/sensor-data
    - Receive real-time data from ESP32 devices
    - Store in DynamoDB sensor_data table
    """
    
    def __init__(self):
        self.mqtt_topic = "farm/sensor-data"
        self.iot_endpoint = "iot.us-east-1.amazonaws.com"  # Placeholder
    
    async def get_latest_sensor_data(self, user_id: str = None) -> Dict:
        """
        Simulates real-time sensor data from AWS IoT Core.
        In production, this will query DynamoDB for latest sensor reading.
        """
        return {
            "user_id": user_id,
            "soil_moisture": round(random.uniform(25, 60), 1),
            "nitrogen": round(random.uniform(200, 300), 0),
            "phosphorus": round(random.uniform(20, 50), 0),
            "potassium": round(random.uniform(150, 250), 0),
            "temperature": round(random.uniform(20, 35), 1),
            "humidity": round(random.uniform(40, 80), 1),
            "ph": round(random.uniform(6.0, 7.5), 1),
            "pump_status": random.choice(["ON", "OFF"]),
            "irrigation_recommendation": random.choice(["Normal", "Increase", "Decrease"]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_sensor_history(self, user_id: str = None, hours: int = 24) -> List[Dict]:
        """
        Simulates historical sensor data.
        In production, this will query DynamoDB sensor_data table with time range.
        """
        history = []
        base_time = datetime.now(timezone.utc)
        
        for i in range(hours):
            timestamp = base_time - timedelta(hours=hours-1-i)
            history.append({
                "timestamp": timestamp.isoformat(),
                "time": timestamp.strftime("%H:%M"),
                "soil_moisture": round(random.uniform(25, 60), 1),
                "temperature": round(random.uniform(20, 35), 1),
                "humidity": round(random.uniform(40, 80), 1),
                "nitrogen": round(random.uniform(200, 300), 0),
                "phosphorus": round(random.uniform(20, 50), 0),
                "potassium": round(random.uniform(150, 250), 0)
            })
        
        return history
    
    async def send_pump_command(self, device_id: str, action: str, mode: str = "manual") -> Dict:
        """
        Simulates sending pump control command via AWS IoT Core.
        In production, this will publish MQTT message to device shadow.
        """
        return {
            "message": f"Pump {action} command sent successfully",
            "device_id": device_id,
            "action": action,
            "mode": mode,
            "status": action,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Export singleton instance
iot_service = IoTService()