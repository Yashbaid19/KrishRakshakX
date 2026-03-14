import random
from typing import Dict, List, Any
from datetime import datetime, timezone
from unittest import result
import httpx
import json

# Mock ML Service simulating AWS Lambda ML Models
class MLService:
    """
    ML Service abstraction layer.
    Currently returns mock predictions.
    Will be replaced with AWS Lambda function invocations.
    
    Future Lambda Functions:
    - cropPredictionModel
    - plantDiseaseModel  
    - yieldPredictionModel
    """
    
    def __init__(self):
        self.lambda_functions = {
            'crop_prediction': 'arn:aws:lambda:us-east-1:xxxxx:function:cropPredictionModel',
            'disease_detection': 'arn:aws:lambda:us-east-1:xxxxx:function:plantDiseaseModel',
            'yield_prediction': 'arn:aws:lambda:us-east-1:xxxxx:function:yieldPredictionModel'
        }
    
    async def predict_crop(self, soil_data: Dict) -> Dict:
        """
        Calls AWS Lambda Crop Prediction API
        """
    
        api_url = "https://ug81n69s9g.execute-api.ap-south-1.amazonaws.com/prod/predict-crop"

        payload = {
            "nitrogen": float(soil_data.get("nitrogen", 0)),
            "phosphorus": float(soil_data.get("phosphorus", 0)),
            "potassium": float(soil_data.get("potassium", 0)),
            "temperature": float(soil_data.get("temperature", 0)),
            "humidity": float(soil_data.get("humidity", 0)),
            "soil_moisture": float(soil_data.get("soil_moisture", 0))
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=payload)

        result = response.json()
        print("AWS RESPONSE:", result)

        if "body" in result:
            body = json.loads(result["body"])
            crop = body.get("recommended_crop", "Unknown")
        else:
            crop = result.get("recommended_crop", "Unknown")

        # Convert AWS response to frontend format
        crops = [
            {
                "name": crop,
                "score": 0.97,
                "reason": "Predicted by ML crop suitability model",
                "season": "Recommended"
            }
     ]

        nutrient_balance = {
            "nitrogen": min(payload["nitrogen"] / 300 * 100, 100),
            "phosphorus": min(payload["phosphorus"] / 50 * 100, 100),
            "potassium": min(payload["potassium"] / 250 * 100, 100),
            "moisture": min(float(soil_data.get("soil_moisture", 50)) / 60 * 100, 100)
        }

        return {
            "recommended_crops": crops,
            "nutrient_balance": nutrient_balance,
            "model_version": "aws-lambda-v1",
            "confidence": 0.91
        }
    
    async def detect_disease(self, image_data: Any) -> Dict:
        """
        Simulates AWS Lambda disease detection model.
        In production:
        1. Upload image to S3 bucket: krishirakshak-disease-images
        2. Invoke Lambda with S3 key
        3. Return prediction results
        """
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
        
        return {
            **detected,
            "severity": random.choice(["Low", "Medium", "High"]),
            "affected_area": round(random.uniform(10, 50), 1),
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "model_version": "v1.0-mock"
        }
    
    async def predict_yield(self, crop_data: Dict) -> Dict:
        """
        Simulates AWS Lambda yield prediction model.
        In production, invokes Lambda with crop and soil parameters.
        """
        crop = crop_data.get('crop', 'Rice')
        area = float(crop_data.get('area', 1))
        soil_quality = crop_data.get('soil_quality', 'Good')
        rainfall = float(crop_data.get('rainfall', 1000))
        
        # Base yield per hectare
        base_yields = {
            'Rice': 4.5,
            'Wheat': 3.8,
            'Maize': 5.2,
            'Cotton': 2.8,
            'Sugarcane': 75.0,
            'Potato': 25.0,
            'Tomato': 30.0
        }
        
        base_yield = base_yields.get(crop, 4.0)
        
        # Quality multiplier
        quality_multipliers = {
            'Excellent': 1.2,
            'Good': 1.0,
            'Average': 0.8,
            'Poor': 0.6
        }
        
        quality_mult = quality_multipliers.get(soil_quality, 1.0)
        predicted_yield = base_yield * area * quality_mult * random.uniform(0.9, 1.1)
        
        # Generate rainfall vs yield correlation data
        rainfall_data = []
        for i in range(6):
            month_rainfall = rainfall / 6 + random.uniform(-100, 100)
            month_yield = predicted_yield / 6 * (1 + (month_rainfall - rainfall/6) / 500)
            rainfall_data.append({
                "month": f"Month {i+1}",
                "rainfall": round(month_rainfall, 2),
                "yield": round(max(0, month_yield), 2)
            })
        
        return {
            "predicted_yield": round(predicted_yield, 2),
            "unit": "ton/hectare" if crop != 'Cotton' else "quintal/hectare",
            "confidence": random.uniform(0.75, 0.92),
            "rainfall_yield_data": rainfall_data,
            "model_version": "v1.0-mock"
        }

# Export singleton instance
ml_service = MLService()