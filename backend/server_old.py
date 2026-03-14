from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import google.generativeai as genai
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 720))

# Google Gemini Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crop: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crop: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    user: User

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class ChatHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    role: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FarmSetup(BaseModel):
    farm_name: str
    state: str
    district: str
    farm_size: float
    soil_type: str
    primary_crop: str
    iot_device_id: Optional[str] = None

class PumpControl(BaseModel):
    action: str
    mode: Optional[str] = "manual"

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        state=user_data.state,
        district=user_data.district
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_pw
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    token = create_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============ PROFILE ROUTES ============

@api_router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get registered IoT devices
    devices = await db.iot_devices.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    
    return {**user_doc, "iot_devices": devices}

@api_router.put("/profile/update")
async def update_profile(update_data: UserUpdate, user_id: str = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    return {"message": "Profile updated successfully"}

# ============ FARM SETUP ROUTES ============

@api_router.post("/farm/setup")
async def setup_farm(farm_data: FarmSetup, user_id: str = Depends(get_current_user)):
    # Update user profile with farm details
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "farm_name": farm_data.farm_name,
            "state": farm_data.state,
            "district": farm_data.district,
            "farm_size": farm_data.farm_size,
            "soil_type": farm_data.soil_type,
            "primary_crop": farm_data.primary_crop
        }}
    )
    
    # Register IoT device if provided
    if farm_data.iot_device_id:
        device_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "device_id": farm_data.iot_device_id,
            "status": "active",
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
        await db.iot_devices.insert_one(device_doc)
    
    return {"message": "Farm setup completed successfully"}

# ============ SENSOR DATA ROUTES ============

@api_router.get("/sensor/latest")
async def get_latest_sensor_data(user_id: str = Depends(get_current_user)):
    # In production, this will fetch from AWS IoT Core
    # Mock real-time sensor data for now
    sensor_data = {
        "user_id": user_id,
        "soil_moisture": random.uniform(25, 60),
        "nitrogen": random.uniform(200, 300),
        "phosphorus": random.uniform(20, 50),
        "potassium": random.uniform(150, 250),
        "temperature": random.uniform(20, 35),
        "humidity": random.uniform(40, 80),
        "ph": random.uniform(6.0, 7.5),
        "pump_status": random.choice(["ON", "OFF"]),
        "irrigation_recommendation": random.choice(["Normal", "Increase", "Decrease"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return sensor_data

@api_router.get("/sensor/history")
async def get_sensor_history(user_id: str = Depends(get_current_user)):
    # Generate mock historical data for charts
    history = []
    base_time = datetime.now(timezone.utc)
    
    for i in range(24):
        timestamp = base_time - timedelta(hours=23-i)
        history.append({
            "timestamp": timestamp.isoformat(),
            "time": timestamp.strftime("%H:%M"),
            "soil_moisture": random.uniform(25, 60),
            "temperature": random.uniform(20, 35),
            "humidity": random.uniform(40, 80),
            "nitrogen": random.uniform(200, 300),
            "phosphorus": random.uniform(20, 50),
            "potassium": random.uniform(150, 250)
        })
    
    return history

# ============ PUMP CONTROL ROUTES ============

@api_router.post("/pump/control")
async def control_pump(pump_data: PumpControl, user_id: str = Depends(get_current_user)):
    # In production, this will send command to AWS IoT Core
    action = pump_data.action.upper()
    mode = pump_data.mode
    
    if action not in ["ON", "OFF", "AUTO"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Mock pump control
    return {
        "message": f"Pump {action} command sent successfully",
        "mode": mode,
        "status": action,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============ CHATBOT ROUTES (GEMINI) ============

@api_router.post("/chat", response_model=ChatResponse)
async def chat(msg: ChatMessage, user_id: str = Depends(get_current_user)):
    try:
        # Save user message
        user_msg = ChatHistory(user_id=user_id, role="user", message=msg.message)
        user_msg_doc = user_msg.model_dump()
        user_msg_doc['timestamp'] = user_msg_doc['timestamp'].isoformat()
        await db.chat_history.insert_one(user_msg_doc)
        
        # Configure Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # System prompt for farming context
        farming_prompt = f"""You are KrishiRakshak X AI Assistant, an expert farming advisor for Indian farmers.
        
You can ONLY answer questions related to:
- Crop advice and recommendations
- Soil health and fertility
- Plant disease treatment and prevention
- Weather risks and climate adaptation
- Platform features and how to use KrishiRakshak X
- Irrigation and water management
- Pest control
- Market prices and trends
- Government farming schemes

If the user asks anything NOT related to farming or agriculture, politely respond:
"I can only help with farming-related questions. Please ask about crops, soil health, diseases, weather, or how to use this platform."

User question: {msg.message}

Provide a helpful, concise, and practical response for Indian farmers:"""
        
        # Generate response using Gemini
        response = model.generate_content(farming_prompt)
        ai_response = response.text
        
        # Save assistant response
        assistant_msg = ChatHistory(user_id=user_id, role="assistant", message=ai_response)
        assistant_msg_doc = assistant_msg.model_dump()
        assistant_msg_doc['timestamp'] = assistant_msg_doc['timestamp'].isoformat()
        await db.chat_history.insert_one(assistant_msg_doc)
        
        return ChatResponse(response=ai_response)
    except Exception as e:
        logging.error(f"Gemini chat error: {str(e)}")
        # Fallback response
        fallback_response = "AI assistant temporarily unavailable. Please try again later or contact support."
        return ChatResponse(response=fallback_response)

@api_router.get("/chat/history")
async def get_chat_history(user_id: str = Depends(get_current_user)):
    history = await db.chat_history.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    for msg in history:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    return history

# ============ CROP PREDICTION ROUTES ============

@api_router.post("/crop/predict")
async def predict_crop(data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    # In production, call AWS Lambda ML model
    # Mock crop recommendations based on soil parameters
    
    nitrogen = float(data.get('nitrogen', 0))
    
    crops = [
        {"name": "Rice", "score": random.uniform(0.70, 0.95), "reason": "High nitrogen and moisture favorable", "season": "Kharif"},
        {"name": "Wheat", "score": random.uniform(0.65, 0.90), "reason": "Good soil pH and temperature", "season": "Rabi"},
        {"name": "Cotton", "score": random.uniform(0.60, 0.85), "reason": "Adequate phosphorus levels", "season": "Kharif"},
        {"name": "Sugarcane", "score": random.uniform(0.55, 0.80), "reason": "Suitable moisture and temperature", "season": "Perennial"},
        {"name": "Maize", "score": random.uniform(0.70, 0.88), "reason": "Balanced NPK levels", "season": "Kharif/Rabi"}
    ]
    
    crops.sort(key=lambda x: x['score'], reverse=True)
    
    # Nutrient balance for radar chart
    nutrient_balance = {
        "nitrogen": min(float(data.get('nitrogen', 0)) / 300 * 100, 100),
        "phosphorus": min(float(data.get('phosphorus', 0)) / 50 * 100, 100),
        "potassium": min(float(data.get('potassium', 0)) / 250 * 100, 100),
        "ph": min(float(data.get('ph', 7)) / 8 * 100, 100),
        "moisture": min(float(data.get('soil_moisture', 50)) / 60 * 100, 100)
    }
    
    return {
        "recommended_crops": crops[:5],
        "nutrient_balance": nutrient_balance
    }

# ============ YIELD PREDICTION ROUTES ============

@api_router.post("/yield/predict")
async def predict_yield(data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    # In production, call AWS Lambda ML model
    crop = data.get('crop', 'Rice')
    area = float(data.get('area', 1))
    soil_quality = data.get('soil_quality', 'Good')
    rainfall = float(data.get('rainfall', 1000))
    temperature = float(data.get('temperature', 28))
    
    # Mock yield prediction
    base_yield = {
        'Rice': 4.5,
        'Wheat': 3.8,
        'Maize': 5.2,
        'Cotton': 2.8,
        'Sugarcane': 75.0
    }.get(crop, 4.0)
    
    # Quality multiplier
    quality_mult = {'Excellent': 1.2, 'Good': 1.0, 'Average': 0.8, 'Poor': 0.6}.get(soil_quality, 1.0)
    
    predicted_yield = base_yield * area * quality_mult * random.uniform(0.9, 1.1)
    
    # Generate rainfall vs yield data
    rainfall_data = []
    for i in range(6):
        month_rainfall = rainfall / 6 + random.uniform(-100, 100)
        month_yield = predicted_yield / 6 * (1 + (month_rainfall - rainfall/6) / 500)
        rainfall_data.append({
            "month": f"Month {i+1}",
            "rainfall": round(month_rainfall, 2),
            "yield": round(month_yield, 2)
        })
    
    return {
        "predicted_yield": round(predicted_yield, 2),
        "unit": "ton/hectare" if crop != 'Cotton' else "quintal/hectare",
        "confidence": random.uniform(0.75, 0.92),
        "rainfall_yield_data": rainfall_data
    }

# ============ DISEASE DETECTION ROUTES ============

@api_router.post("/disease/detect")
async def detect_disease(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    # In production, upload to S3 and call AWS Lambda ML model
    
    diseases = [
        {
            "disease": "Tomato Early Blight",
            "confidence": 0.92,
            "treatment": "Apply copper-based fungicide like Bordeaux mixture. Spray every 7-10 days.",
            "prevention": "Avoid overhead watering, maintain proper spacing between plants, remove infected leaves immediately."
        },
        {
            "disease": "Potato Late Blight",
            "confidence": 0.88,
            "treatment": "Use Mancozeb or Chlorothalonil fungicides. Apply as soon as symptoms appear.",
            "prevention": "Plant resistant varieties, ensure good drainage, avoid working with wet plants."
        },
        {
            "disease": "Powdery Mildew",
            "confidence": 0.85,
            "treatment": "Spray sulfur-based solution or neem oil. Repeat every 5-7 days.",
            "prevention": "Improve air circulation, avoid overcrowding, water early in the day."
        }
    ]
    
    detected = random.choice(diseases)
    severity = random.choice(["Low", "Medium", "High"])
    
    return {
        **detected,
        "severity": severity,
        "affected_area": random.uniform(10, 50),
        "detected_at": datetime.now(timezone.utc).isoformat()
    }

# ============ MANDI PRICING ROUTES ============

@api_router.get("/mandi/prices")
async def get_mandi_prices(state: str, district: Optional[str] = None, category: Optional[str] = None):
    categories = ['vegetables', 'fruits', 'spices', 'pulses', 'grains', 'dairy']
    commodities = {
        'vegetables': ['Tomato', 'Potato', 'Onion', 'Cauliflower', 'Cabbage', 'Brinjal'],
        'fruits': ['Mango', 'Banana', 'Apple', 'Grapes', 'Orange', 'Papaya'],
        'spices': ['Turmeric', 'Chilli', 'Coriander', 'Cumin', 'Pepper', 'Cardamom'],
        'pulses': ['Chickpea', 'Lentil', 'Green Gram', 'Black Gram', 'Pigeon Pea', 'Kidney Bean'],
        'grains': ['Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar', 'Barley'],
        'dairy': ['Milk', 'Ghee', 'Paneer', 'Curd', 'Butter', 'Cheese']
    }
    
    prices = []
    selected_categories = [category] if category else categories
    
    for cat in selected_categories:
        for commodity in commodities.get(cat, []):
            base_price = random.uniform(1000, 5000)
            prices.append({
                "commodity": commodity,
                "category": cat,
                "state": state,
                "district": district or "All",
                "price": round(base_price, 2),
                "prev_price": round(base_price * random.uniform(0.9, 1.1), 2),
                "change": round(random.uniform(-10, 10), 2),
                "unit": "per quintal",
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
            })
    
    return prices

@api_router.get("/market/trends")
async def get_market_trends(crop: str, frequency: str = "daily"):
    days = 30 if frequency == "daily" else 52
    trends = []
    base_price = random.uniform(2000, 4000)
    
    for i in range(days):
        if frequency == "daily":
            date = (datetime.now(timezone.utc) - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        else:
            date = f"Week {i+1}"
        
        # Add some trend
        price = base_price + (i * 10) + random.uniform(-200, 200)
        trends.append({
            "date": date,
            "price": round(price, 2),
            "volume": random.uniform(1000, 5000),
            "predicted": False
        })
    
    # Add predicted prices
    for i in range(7):
        if frequency == "daily":
            date = (datetime.now(timezone.utc) + timedelta(days=i+1)).strftime("%Y-%m-%d")
        else:
            date = f"Week {days+i+1}"
        
        price = trends[-1]["price"] * random.uniform(0.98, 1.05)
        trends.append({
            "date": date,
            "price": round(price, 2),
            "volume": random.uniform(1000, 5000),
            "predicted": True
        })
    
    return trends

# ============ EQUIPMENT RENTAL ROUTES ============

@api_router.post("/equipment")
async def create_equipment(equipment_data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    equipment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        **equipment_data,
        "available": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.equipment.insert_one(equipment)
    return equipment

@api_router.get("/equipment")
async def list_equipment(state: Optional[str] = None, district: Optional[str] = None, equipment_type: Optional[str] = None):
    query = {"available": True}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if equipment_type:
        query["type"] = equipment_type
    
    equipment_list = await db.equipment.find(query, {"_id": 0}).to_list(100)
    return equipment_list

@api_router.get("/equipment/my")
async def my_equipment(user_id: str = Depends(get_current_user)):
    equipment_list = await db.equipment.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return equipment_list

# ============ FINANCIAL TOOLS ROUTES ============

@api_router.post("/finance/loan-calculator")
async def calculate_loan(data: Dict[str, Any]):
    principal = float(data['principal'])
    rate = float(data['rate'])
    years = float(data['years'])
    
    monthly_rate = rate / 100 / 12
    num_payments = years * 12
    
    if monthly_rate == 0:
        monthly_payment = principal / num_payments
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)
    
    total_payment = monthly_payment * num_payments
    total_interest = total_payment - principal
    
    return {
        "monthly_payment": round(monthly_payment, 2),
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_interest, 2)
    }

@api_router.get("/finance/schemes")
async def get_schemes():
    schemes = [
        {
            "name": "PM-KISAN",
            "description": "Income support of ₹6000 per year to farmer families",
            "eligibility": "All landholding farmers",
            "link": "https://pmkisan.gov.in/"
        },
        {
            "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "description": "Comprehensive crop insurance scheme",
            "eligibility": "All farmers growing notified crops",
            "link": "https://pmfby.gov.in/"
        },
        {
            "name": "KCC (Kisan Credit Card)",
            "description": "Short-term credit facility for agricultural needs",
            "eligibility": "Farmers, tenant farmers, and sharecroppers",
            "link": "https://www.india.gov.in/"
        },
        {
            "name": "Soil Health Card Scheme",
            "description": "Free soil testing and nutrient recommendations",
            "eligibility": "All farmers",
            "link": "https://soilhealth.dac.gov.in/"
        }
    ]
    return schemes

# ============ WEATHER ROUTES ============

@api_router.get("/weather/alerts")
async def get_weather_alerts(state: Optional[str] = None):
    alerts = [
        {
            "type": "Rainfall",
            "severity": "Moderate",
            "message": "Expect moderate rainfall in the next 48 hours. Postpone harvesting activities.",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
        },
        {
            "type": "Temperature",
            "severity": "High",
            "message": "High temperatures expected, ensure adequate irrigation for crops.",
            "date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=4)).strftime("%Y-%m-%d")
        },
        {
            "type": "Wind",
            "severity": "Low",
            "message": "Light winds expected. Good conditions for pesticide spraying.",
            "date": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d")
        }
    ]
    return alerts

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()