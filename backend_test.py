import requests
import sys
import json
from datetime import datetime
import time
import io

class KrishiRakshakAPITester:
    def __init__(self, base_url="https://smart-farm-ai-23.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        # Remove Content-Type for file uploads
        if files:
            headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Test User",
                "email": self.test_user_email,
                "password": self.test_password,
                "phone": "9876543210",
                "state": "Maharashtra",
                "district": "Pune"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_password
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Login successful, token: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'email' in response

    def test_sensor_latest(self):
        """Test get latest sensor data"""
        success, response = self.run_test(
            "Get Latest Sensor Data",
            "GET",
            "sensor/latest",
            200
        )
        return success and 'soil_moisture' in response

    def test_sensor_history(self):
        """Test get sensor history"""
        success, response = self.run_test(
            "Get Sensor History",
            "GET",
            "sensor/history",
            200
        )
        return success and isinstance(response, list) and len(response) > 0

    def test_chat(self):
        """Test AI chatbot"""
        success, response = self.run_test(
            "AI Chatbot",
            "POST",
            "chat",
            200,
            data={"message": "What crops are best for high nitrogen soil?"}
        )
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
            return True
        return False

    def test_chat_history(self):
        """Test get chat history"""
        success, response = self.run_test(
            "Get Chat History",
            "GET",
            "chat/history",
            200
        )
        return success and isinstance(response, list)

    def test_equipment_create(self):
        """Test create equipment listing"""
        success, response = self.run_test(
            "Create Equipment Listing",
            "POST",
            "equipment",
            200,
            data={
                "name": "Test Tractor",
                "type": "Tractor",
                "description": "Heavy duty farming tractor",
                "price_per_day": 1500.0,
                "state": "Maharashtra",
                "district": "Pune",
                "contact": "9876543210"
            }
        )
        return success and 'id' in response

    def test_equipment_list(self):
        """Test list equipment"""
        success, response = self.run_test(
            "List Equipment",
            "GET",
            "equipment?state=Maharashtra",
            200
        )
        return success and isinstance(response, list)

    def test_equipment_my(self):
        """Test get my equipment"""
        success, response = self.run_test(
            "Get My Equipment",
            "GET",
            "equipment/my",
            200
        )
        return success and isinstance(response, list)

    def test_mandi_prices(self):
        """Test get mandi prices"""
        success, response = self.run_test(
            "Get Mandi Prices",
            "GET",
            "mandi/prices?state=Maharashtra&category=vegetables",
            200
        )
        return success and isinstance(response, list) and len(response) > 0

    def test_market_trends(self):
        """Test get market trends"""
        success, response = self.run_test(
            "Get Market Trends",
            "GET",
            "market/trends?crop=Rice&frequency=daily",
            200
        )
        return success and isinstance(response, list) and len(response) > 0

    def test_crop_predict(self):
        """Test crop prediction"""
        success, response = self.run_test(
            "Crop Prediction",
            "POST",
            "crop/predict",
            200,
            data={
                "nitrogen": 250,
                "phosphorus": 35,
                "potassium": 200,
                "temperature": 28,
                "humidity": 65,
                "ph": 6.8
            }
        )
        return success and 'recommendations' in response

    def test_disease_detect(self):
        """Test disease detection"""
        # Create a dummy image file
        dummy_image = io.BytesIO(b"dummy image content")
        files = {'file': ('test_image.jpg', dummy_image, 'image/jpeg')}
        
        success, response = self.run_test(
            "Disease Detection",
            "POST",
            "disease/detect",
            200,
            files=files
        )
        return success and 'disease' in response

    def test_loan_calculator(self):
        """Test loan calculator"""
        success, response = self.run_test(
            "Loan Calculator",
            "POST",
            "finance/loan-calculator",
            200,
            data={
                "principal": 100000,
                "rate": 8.5,
                "years": 5
            }
        )
        return success and 'monthly_payment' in response

    def test_finance_schemes(self):
        """Test get finance schemes"""
        success, response = self.run_test(
            "Get Finance Schemes",
            "GET",
            "finance/schemes",
            200
        )
        return success and isinstance(response, list) and len(response) > 0

    def test_weather_alerts(self):
        """Test get weather alerts"""
        success, response = self.run_test(
            "Get Weather Alerts",
            "GET",
            "weather/alerts?state=Maharashtra",
            200
        )
        return success and isinstance(response, list)

def main():
    print("🚀 Starting KrishiRakshak X API Testing...")
    print("=" * 60)
    
    tester = KrishiRakshakAPITester()
    
    # Test Authentication Flow
    print("\n📋 TESTING AUTHENTICATION FLOW")
    print("-" * 40)
    
    if not tester.test_auth_register():
        print("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_auth_me():
        print("❌ Get current user failed")
        return 1
    
    # Test all other endpoints
    print("\n📋 TESTING SENSOR DATA ENDPOINTS")
    print("-" * 40)
    tester.test_sensor_latest()
    tester.test_sensor_history()
    
    print("\n📋 TESTING AI CHATBOT")
    print("-" * 40)
    tester.test_chat()
    time.sleep(2)  # Wait for AI response
    tester.test_chat_history()
    
    print("\n📋 TESTING EQUIPMENT RENTAL")
    print("-" * 40)
    tester.test_equipment_create()
    tester.test_equipment_list()
    tester.test_equipment_my()
    
    print("\n📋 TESTING MANDI & MARKET DATA")
    print("-" * 40)
    tester.test_mandi_prices()
    tester.test_market_trends()
    
    print("\n📋 TESTING CROP & DISEASE PREDICTION")
    print("-" * 40)
    tester.test_crop_predict()
    tester.test_disease_detect()
    
    print("\n📋 TESTING FINANCIAL TOOLS")
    print("-" * 40)
    tester.test_loan_calculator()
    tester.test_finance_schemes()
    
    print("\n📋 TESTING WEATHER ALERTS")
    print("-" * 40)
    tester.test_weather_alerts()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())