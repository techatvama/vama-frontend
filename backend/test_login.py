import requests
import json

# Test the login endpoint
url = "http://127.0.0.1:8000/student/login"
data = {
    "email": "test@gmail.com",
    "password": "student123"
}

print("Testing student login endpoint...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print("-" * 60)

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Response text: {response.text if 'response' in locals() else 'N/A'}")
