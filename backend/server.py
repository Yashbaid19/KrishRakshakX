from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests
import boto3
from boto3.dynamodb.conditions import Key


    # Import services
from services.databaseService import database_service
from services.iotService import iot_service
from services.mlService import ml_service
from services.sensorService import sensor_service
from services.ollamaService import generate_response

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

    # Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 720))
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "SensorData2")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION
)

sensor_table = dynamodb.Table(DYNAMODB_TABLE)


app = FastAPI(title="KrishiRakshak X API", version="2.0")
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
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crop: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: User

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crop: Optional[str] = None

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

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
class GoogleToken(BaseModel):
    token: str

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
        # Check if user exists
    existing = await database_service.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
    hashed_pw = hash_password(user_data.password)
    new_user = {
        'name': user_data.name,
        'email': user_data.email,
        'password': hashed_pw,
        'phone': user_data.phone,
        'state': user_data.state,
        'district': user_data.district
    }
        
    created_user = await database_service.create_user(new_user)
        
        # Remove password from response
    user_response = {k: v for k, v in created_user.items() if k != 'password'}
    user = User(**user_response)
        
        # Generate token
    token = create_token(user.id)
        
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await database_service.get_user_by_email(credentials.email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user_response = {k: v for k, v in user_doc.items() if k != 'password'}
    user = User(**user_response)
    token = create_token(user.id)
        
    return TokenResponse(token=token, user=user)
@api_router.post("/auth/google", response_model=TokenResponse)
async def google_login(data: GoogleToken):
    try:
            # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name", "Google User")

            # Check if user already exists
        user_doc = await database_service.get_user_by_email(email)

        if not user_doc:
            # Create new user
            new_user = {
                "name": name,
                "email": email,
                "password": "",  # No password for Google users
                "phone": None,
                "state": None,
                "district": None
            }

            user_doc = await database_service.create_user(new_user)

            # Prepare response user
        user_response = {k: v for k, v in user_doc.items() if k != "password"}
        user = User(**user_response)

            # Create JWT token
        token = create_token(user.id)

        return TokenResponse(token=token, user=user)

    except Exception as e:
        raise HTTPException(status_code=401, detail="Google authentication failed")

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await database_service.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_response = {k: v for k, v in user_doc.items() if k != 'password'}
    return User(**user_response)

    # ============ PROFILE ROUTES ============

@api_router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    user_doc = await database_service.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
        # Get IoT devices
    devices = await database_service.get_user_devices(user_id)
       
    user_response = {k: v for k, v in user_doc.items() if k != 'password'}
    return {**user_response, "iot_devices": devices}

@api_router.put("/profile/update")
async def update_profile(update_data: UserUpdate, user_id: str = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
    if update_dict:
        await database_service.update_user(user_id, update_dict)
        
    return {"message": "Profile updated successfully", "success": True}

    # ============ FARM SETUP ROUTES ============

@api_router.post("/farm/setup")
async def setup_farm(farm_data: FarmSetup, user_id: str = Depends(get_current_user)):
        # Update user profile with farm details
    await database_service.update_user(user_id, {
        "farm_name": farm_data.farm_name,
        "state": farm_data.state,
        "district": farm_data.district,
        "farm_size": farm_data.farm_size,
        "soil_type": farm_data.soil_type,
        "primary_crop": farm_data.primary_crop
    })
        
        # Register IoT device if provided
    if farm_data.iot_device_id:
        await database_service.register_iot_device(user_id, farm_data.iot_device_id)
        
    return {"message": "Farm setup completed successfully", "success": True}

    # ============ SENSOR DATA ROUTES ============

@api_router.get("/sensor/latest")
async def get_latest_sensor_data(user_id: str = Depends(get_current_user)):

    response = sensor_table.scan()

    items = response.get("Items", [])

    if not items:
        return {"message": "No sensor data found"}

    latest = max(items, key=lambda x: x["timestamp"])

    return latest

@api_router.get("/sensor/history")
async def get_sensor_history(user_id: str = Depends(get_current_user)):

    response = sensor_table.scan()

    items = response.get("Items", [])

    items = sorted(items, key=lambda x: x["timestamp"])

    return items[-100:]  # last 100 readings

    # ============ PUMP CONTROL ROUTES ============

@api_router.post("/pump/control")
async def control_pump(pump_data: PumpControl, user_id: str = Depends(get_current_user)):
    """
        Send pump control command to IoT device (currently mocked).
        Future: Publish MQTT message to AWS IoT device shadow.
    """
    action = pump_data.action.upper()
        
    if action not in ["ON", "OFF", "AUTO"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    result = await sensor_service.control_pump(user_id, action, pump_data.mode)
    return result

    # ============ CHATBOT ROUTES (OLLAMA) ============

@api_router.post("/chat", response_model=ChatResponse)
async def chat(msg: ChatMessage, user_id: str = Depends(get_current_user)):
    try:
            # Save user message
        await database_service.save_chat_message(user_id, "user", msg.message)

            # Farming system prompt
        farming_prompt = f"""
    You are KrishiRakshak X AI Assistant, an expert farming advisor for Indian farmers.

    You can ONLY answer questions related to:
    - Crop advice and recommendations
    - Soil health and fertility
    - Plant disease treatment and prevention
    - Weather risks and climate adaptation
    - Irrigation and water management
    - Pest control
    - Market prices and trends
    - Government farming schemes

    If the user asks anything NOT related to farming, respond:
    "I can only help with farming-related questions."

    Farmer question:
{msg.message}

    Answer clearly and practically for Indian farmers.
    """

            # Call Ollama model
        ai_response = generate_response(farming_prompt)

            # Save assistant response
        await database_service.save_chat_message(user_id, "assistant", ai_response)

        return ChatResponse(response=ai_response)

    except Exception as e:
        logging.error(f"Ollama chat error: {str(e)}")
        return ChatResponse(
            response="AI assistant temporarily unavailable. Please try again later."
        )

@api_router.get("/chat/history")
async def get_chat_history(user_id: str = Depends(get_current_user)):
    return await database_service.get_chat_history(user_id)

    # ============ CROP PREDICTION ROUTES ============

@api_router.post("/crop/predict")
async def predict_crop(data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """
        Predict suitable crops using ML model (currently mocked).
        Future: Invoke AWS Lambda function cropPredictionModel.
    """
    return await ml_service.predict_crop(data)

    # ============ YIELD PREDICTION ROUTES ============

@api_router.post("/yield/predict")
async def predict_yield(data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """
        Predict crop yield using ML model (currently mocked).
        Future: Invoke AWS Lambda function yieldPredictionModel.
    """
    return await ml_service.predict_yield(data)

    # ============ DISEASE DETECTION ROUTES ============

@api_router.post("/disease/detect")
async def detect_disease(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """
        Detect plant disease from image (currently mocked).
        Future: 
        1. Upload image to S3 bucket: krishirakshak-disease-images
        2. Invoke AWS Lambda function plantDiseaseModel
        3. Return prediction results
    """
    return await ml_service.detect_disease(file)

    # ============ MANDI PRICING ROUTES ============

@api_router.get("/mandi/prices")
async def get_mandi_prices(state: str, district: Optional[str] = None, category: Optional[str] = None):
    """
        Get mandi prices (currently mocked).
        Future: Query DynamoDB mandi_prices table.
    """
    from datetime import datetime, timedelta
    import random
        
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
    """
        Get market price trends (currently mocked).
        Future: Query DynamoDB market_trends table.
    """
    import random
    from datetime import datetime, timedelta, timezone
        
    days = 30 if frequency == "daily" else 52
    trends = []
    base_price = random.uniform(2000, 4000)
        
    for i in range(days):
        if frequency == "daily":
            date = (datetime.now(timezone.utc) - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        else:
            date = f"Week {i+1}"
            
        price = base_price + (i * 10) + random.uniform(-200, 200)
        trends.append({
            "date": date,                "price": round(price, 2),
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
    equipment_data['user_id'] = user_id
    return await database_service.create_equipment(equipment_data)

@api_router.get("/equipment")
async def list_equipment(state: Optional[str] = None, district: Optional[str] = None, equipment_type: Optional[str] = None):
    filters = {}
    if state:
        filters['state'] = state
    if district:
        filters['district'] = district
    if equipment_type:
        filters['type'] = equipment_type
        
    return await database_service.get_equipment(filters)

@api_router.get("/equipment/my")
async def my_equipment(user_id: str = Depends(get_current_user)):
    return await database_service.get_equipment({'user_id': user_id})

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

    central_schemes = [
        {
            "name": "PM-KISAN",
            "description": "Income support of ₹6000 per year to farmer families.",
            "eligibility": "All landholding farmers",
            "link": "https://pmkisan.gov.in/"
        },
        {
            "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "description": "Crop insurance scheme protecting farmers from crop loss.",
            "eligibility": "All farmers growing notified crops",
            "link": "https://pmfby.gov.in/"
        },
        {
            "name": "Kisan Credit Card (KCC)",
            "description": "Short-term credit facility for agriculture and allied activities.",
            "eligibility": "Farmers, tenant farmers and sharecroppers",
            "link": "https://www.india.gov.in/"
        },
        {
            "name": "Soil Health Card Scheme",
            "description": "Provides soil testing and nutrient recommendations.",
            "eligibility": "All farmers",
            "link": "https://soilhealth.dac.gov.in/"
        }
    ]

    state_schemes = {

        "maharashtra": [
            {
                "name": "MahaDBT Farmer Scheme",
                "description": "Financial assistance for farm equipment and irrigation.",
                "link": "https://mahadbt.maharashtra.gov.in/"
            },
            {
                "name": "Baliraja Chetana Yojana",
                "description": "Support scheme for drought affected farmers.",
                "link": "https://krishi.maharashtra.gov.in/"
            }
        ],

        "punjab": [
            {
                "name": "Punjab Crop Diversification Scheme",
                "description": "Encourages farmers to diversify crops beyond paddy.",
                "link": "https://agripb.gov.in/"
            }
        ],

        "karnataka": [
            {
                "name": "Raitha Siri Scheme",
                "description": "Financial support for organic farming.",
                "link": "https://raitamitra.karnataka.gov.in/"
            }
        ],

        "uttar_pradesh": [
            {
                "name": "UP Krishi Yantra Subsidy Scheme",
                "description": "Subsidy for purchasing agricultural machinery.",
                "link": "https://agriculture.up.gov.in/"
            }
        ],

        "rajasthan": [
            {
                "name": "Rajasthan Krishi Yantra Subsidy",
                "description": "Subsidy for tractors and farming tools.",
                "link": "https://rajkisan.rajasthan.gov.in/"
            }
        ],

        "madhya_pradesh": [
            {
                "name": "MP Bhavantar Bhugtan Yojana",
                "description": "Compensation scheme for crop price difference.",
                "link": "https://mpkrishi.mp.gov.in/"
            }
        ],

        "tamil_nadu": [
            {
                "name": "Tamil Nadu Farmer Subsidy Scheme",
                "description": "Subsidy for irrigation equipment and seeds.",
                "link": "https://www.tnagrisnet.tn.gov.in/"
            }
        ],

        "gujarat": [
            {
                "name": "Gujarat Krishi Sahay Yojana",
                "description": "Compensation for crop damage due to natural calamities.",
                "link": "https://ikhedut.gujarat.gov.in/"
            }
        ],

        "bihar": [
            {
                "name": "Bihar Diesel Subsidy Scheme",
                "description": "Diesel subsidy for irrigation during drought.",
                "link": "https://dbtagriculture.bihar.gov.in/"
            }
        ]
    }

    return {
        "central": central_schemes,
        "states": state_schemes
    }

    # ============ WEATHER ROUTES ============

@api_router.get("/weather/alerts")
async def get_weather_alerts(state: Optional[str] = None):
    from datetime import datetime, timedelta, timezone
        
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

    # ============ HEALTH CHECK ============

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0",
        "database": "Mock DynamoDB",
        "iot": "Mock IoT Core",
        "ml": "Mock Lambda Models"
    }

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
