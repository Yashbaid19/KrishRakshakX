from services.iotService import iot_service
from typing import Dict, List

# Sensor Service - Combines IoT and Database operations
class SensorService:
    """
    Sensor data management service.
    Orchestrates IoT data retrieval and storage.
    """
    
    def __init__(self):
        self.iot = iot_service
    
    async def get_latest_data(self, user_id: str) -> Dict:
        """
        Get latest sensor reading for user.
        In production, queries DynamoDB for most recent entry.
        """
        return await self.iot.get_latest_sensor_data(user_id)
    
    async def get_historical_data(self, user_id: str, hours: int = 24) -> List[Dict]:
        """
        Get historical sensor data for charting.
        In production, queries DynamoDB with time range filter.
        """
        return await self.iot.get_sensor_history(user_id, hours)
    
    async def control_pump(self, device_id: str, action: str, mode: str = "manual") -> Dict:
        """
        Send pump control command to IoT device.
        In production, publishes to AWS IoT device shadow.
        """
        return await self.iot.send_pump_command(device_id, action, mode)

# Export singleton instance
sensor_service = SensorService()