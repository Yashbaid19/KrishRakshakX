from datetime import datetime, timezone, timedelta
import uuid
from typing import Dict, List, Optional, Any
import random

# In-memory data store simulating DynamoDB
# This will be replaced with actual DynamoDB calls
class MockDynamoDB:
    def __init__(self):
        self.users = {}
        self.sensor_data = []
        self.equipment_listings = []
        self.chat_history = []
        self.mandi_prices = []
        self.market_trends = []
        self.iot_devices = []
        
    # User Operations
    async def create_user(self, user_data: Dict) -> Dict:
        user_id = str(uuid.uuid4())
        user_data['id'] = user_id
        user_data['created_at'] = datetime.now(timezone.utc).isoformat()
        self.users[user_id] = user_data
        return user_data
    
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        for user in self.users.values():
            if user.get('email') == email:
                return user
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        return self.users.get(user_id)
    
    async def update_user(self, user_id: str, update_data: Dict) -> bool:
        if user_id in self.users:
            self.users[user_id].update(update_data)
            return True
        return False
    
    # Chat History Operations
    async def save_chat_message(self, message_data: Dict) -> Dict:
        message_data['id'] = str(uuid.uuid4())
        message_data['timestamp'] = datetime.now(timezone.utc).isoformat()
        self.chat_history.append(message_data)
        return message_data
    
    async def get_chat_history(self, user_id: str, limit: int = 100) -> List[Dict]:
        return [msg for msg in self.chat_history if msg.get('user_id') == user_id][-limit:]
    
    # Equipment Operations
    async def create_equipment(self, equipment_data: Dict) -> Dict:
        equipment_data['id'] = str(uuid.uuid4())
        equipment_data['created_at'] = datetime.now(timezone.utc).isoformat()
        equipment_data['available'] = True
        self.equipment_listings.append(equipment_data)
        return equipment_data
    
    async def get_equipment(self, filters: Dict = None) -> List[Dict]:
        if not filters:
            return self.equipment_listings
        
        results = self.equipment_listings
        if filters.get('state'):
            results = [e for e in results if e.get('state') == filters['state']]
        if filters.get('district'):
            results = [e for e in results if e.get('district') == filters['district']]
        if filters.get('type'):
            results = [e for e in results if e.get('type') == filters['type']]
        if filters.get('user_id'):
            results = [e for e in results if e.get('user_id') == filters['user_id']]
        
        return results
    
    # IoT Device Operations
    async def register_iot_device(self, device_data: Dict) -> Dict:
        device_data['id'] = str(uuid.uuid4())
        device_data['registered_at'] = datetime.now(timezone.utc).isoformat()
        device_data['status'] = 'active'
        self.iot_devices.append(device_data)
        return device_data
    
    async def get_user_devices(self, user_id: str) -> List[Dict]:
        return [d for d in self.iot_devices if d.get('user_id') == user_id]

# Global mock database instance
mock_db = MockDynamoDB()

# Database Service - Abstraction layer for future DynamoDB integration
class DatabaseService:
    """
    Database abstraction layer.
    Currently uses in-memory mock store.
    Will be replaced with AWS DynamoDB SDK calls.
    """
    
    def __init__(self):
        self.db = mock_db
    
    # User operations
    async def create_user(self, user_data: Dict) -> Dict:
        return await self.db.create_user(user_data)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        return await self.db.get_user_by_email(email)
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        return await self.db.get_user_by_id(user_id)
    
    async def update_user(self, user_id: str, update_data: Dict) -> bool:
        return await self.db.update_user(user_id, update_data)
    
    # Chat operations
    async def save_chat_message(self, user_id: str, role: str, message: str) -> Dict:
        message_data = {
            'user_id': user_id,
            'role': role,
            'message': message
        }
        return await self.db.save_chat_message(message_data)
    
    async def get_chat_history(self, user_id: str, limit: int = 100) -> List[Dict]:
        return await self.db.get_chat_history(user_id, limit)
    
    # Equipment operations
    async def create_equipment(self, equipment_data: Dict) -> Dict:
        return await self.db.create_equipment(equipment_data)
    
    async def get_equipment(self, filters: Dict = None) -> List[Dict]:
        return await self.db.get_equipment(filters)
    
    # IoT device operations
    async def register_iot_device(self, user_id: str, device_id: str) -> Dict:
        device_data = {
            'user_id': user_id,
            'device_id': device_id
        }
        return await self.db.register_iot_device(device_data)
    
    async def get_user_devices(self, user_id: str) -> List[Dict]:
        return await self.db.get_user_devices(user_id)

# Export singleton instance
database_service = DatabaseService()