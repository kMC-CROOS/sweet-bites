#!/usr/bin/env python
"""
Test script to verify authentication fixes
Run this script to test registration and login endpoints
"""

import requests
import json
import sys

BASE_URL = 'http://localhost:8000/api/users'

def test_registration():
    """Test user registration"""
    print("Testing user registration...")
    
    test_user = {
        "username": "testuser123",
        "email": "testuser123@example.com",
        "password": "testpassword123",
        "confirmPassword": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register/",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            return test_user
        else:
            print("❌ Registration failed!")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Make sure Django is running on localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_login_with_username(user_data):
    """Test login with username"""
    print("\nTesting login with username...")
    
    login_data = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login with username successful!")
            return True
        else:
            print("❌ Login with username failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Make sure Django is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login_with_email(user_data):
    """Test login with email"""
    print("\nTesting login with email...")
    
    login_data = {
        "username": user_data["email"],  # Using email as username
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login with email successful!")
            return True
        else:
            print("❌ Login with email failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Make sure Django is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🧪 Testing Authentication Fixes")
    print("=" * 50)
    
    # Test registration
    user_data = test_registration()
    if not user_data:
        print("\n❌ Cannot proceed with login tests - registration failed")
        return
    
    # Test login with username
    username_login_success = test_login_with_username(user_data)
    
    # Test login with email
    email_login_success = test_login_with_email(user_data)
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Registration: {'✅ PASS' if user_data else '❌ FAIL'}")
    print(f"Login with Username: {'✅ PASS' if username_login_success else '❌ FAIL'}")
    print(f"Login with Email: {'✅ PASS' if email_login_success else '❌ FAIL'}")
    
    if user_data and username_login_success and email_login_success:
        print("\n🎉 All authentication tests passed!")
        print("💡 Users can now register and login with either username or email")
    else:
        print("\n⚠️ Some tests failed. Check the Django console for detailed error messages.")

if __name__ == "__main__":
    main()
