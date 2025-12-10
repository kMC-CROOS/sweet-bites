#!/usr/bin/env python
"""
Debug script to find where JSON parsing errors are still occurring
This will test all possible scenarios that could cause HTML responses
"""

import os
import sys
import django
import requests
import json
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sweetbite_backend.settings')
django.setup()

from users.models import User
from cakes.models import Cake

BASE_URL = 'http://localhost:8000/api'

def test_authentication():
    """Test user authentication"""
    print("🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test login with existing user
        response = requests.post(f'{BASE_URL}/users/auth/login/', 
                               json={
                                   'username': 'order_test_user',
                                   'password': 'testpass123'
                               },
                               headers={'Content-Type': 'application/json'})
        
        print(f"Login Status: {response.status_code}")
        content_type = response.headers.get('content-type', '')
        print(f"Content-Type: {content_type}")
        
        if 'text/html' in content_type:
            print("🚨 LOGIN RETURNING HTML!")
            print("Response:", response.text[:300] + "...")
            return None
        
        if response.ok:
            data = response.json()
            token = data.get('token')
            print(f"✅ Authentication successful")
            return token
        else:
            print(f"❌ Authentication failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_order_creation_detailed(token):
    """Test order creation with detailed error checking"""
    print("\n🛒 Testing Order Creation (Detailed)")
    print("-" * 40)
    
    # Get a test cake
    cake = Cake.objects.first()
    if not cake:
        print("❌ No cakes available for testing")
        return False
    
    print(f"Using cake: {cake.name} (ID: {cake.id})")
    
    # Test different order scenarios
    test_cases = [
        {
            'name': 'Basic Cash Order',
            'data': {
                'order_type': 'online',
                'delivery_instructions': 'Cash on delivery',
                'items': [{
                    'cake_id': cake.id,
                    'quantity': 1,
                    'customization_notes': 'Test order'
                }]
            }
        },
        {
            'name': 'Order with Shipping Address',
            'data': {
                'order_type': 'online',
                'shipping_address_id': 1,  # This might not exist
                'delivery_instructions': 'Test delivery',
                'items': [{
                    'cake_id': cake.id,
                    'quantity': 2,
                    'customization_notes': 'Double order'
                }]
            }
        },
        {
            'name': 'Walk-in Order',
            'data': {
                'order_type': 'walk_in',
                'delivery_instructions': 'Pickup order',
                'items': [{
                    'cake_id': cake.id,
                    'quantity': 1,
                    'customization_notes': 'Pickup test'
                }]
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        print(f"\n  Testing: {test_case['name']}")
        
        try:
            response = requests.post(
                f'{BASE_URL}/orders/orders/',
                json=test_case['data'],
                headers={
                    'Authorization': f'Token {token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout=10
            )
            
            print(f"    Status: {response.status_code}")
            content_type = response.headers.get('content-type', '')
            print(f"    Content-Type: {content_type}")
            
            if 'text/html' in content_type:
                print("    🚨 RETURNING HTML! This is the problem!")
                print("    Error preview:", response.text[:200] + "...")
                
                # Try to extract the actual error from Django's HTML error page
                if "TypeError" in response.text:
                    print("    🔍 Found TypeError in HTML response")
                elif "ValueError" in response.text:
                    print("    🔍 Found ValueError in HTML response") 
                elif "IntegrityError" in response.text:
                    print("    🔍 Found IntegrityError in HTML response")
                
                return False
                
            elif 'application/json' in content_type:
                if response.ok:
                    data = response.json()
                    print(f"    ✅ Success - Order created with ID: {data.get('id', 'N/A')}")
                    success_count += 1
                else:
                    error_data = response.json()
                    print(f"    ❌ JSON Error: {error_data}")
            else:
                print(f"    ⚠️  Unexpected content type: {content_type}")
                
        except requests.exceptions.Timeout:
            print("    ❌ Request timed out")
        except json.JSONDecodeError as e:
            print(f"    🚨 JSON DECODE ERROR! This is what you're seeing!")
            print(f"    Error: {e}")
            print(f"    Response text: {response.text[:200]}...")
            return False
        except Exception as e:
            print(f"    ❌ Unexpected error: {e}")
    
    return success_count > 0

def test_other_endpoints(token):
    """Test other endpoints that might be causing issues"""
    print("\n🔍 Testing Other Endpoints")
    print("-" * 30)
    
    endpoints_to_test = [
        ('GET', f'{BASE_URL}/orders/orders/', 'Orders List'),
        ('GET', f'{BASE_URL}/orders/shipping-addresses/', 'Shipping Addresses'),
        ('GET', f'{BASE_URL}/cakes/', 'Cakes List'),
        ('GET', f'{BASE_URL}/users/auth/profile/', 'User Profile'),
    ]
    
    for method, url, name in endpoints_to_test:
        try:
            if method == 'GET':
                response = requests.get(url, headers={
                    'Authorization': f'Token {token}',
                    'Accept': 'application/json'
                })
            
            print(f"  {name}: {response.status_code}")
            content_type = response.headers.get('content-type', '')
            
            if 'text/html' in content_type:
                print(f"    🚨 {name} returning HTML!")
                return False
            elif response.ok:
                print(f"    ✅ {name} working correctly")
        except Exception as e:
            print(f"    ❌ {name} error: {e}")
    
    return True

def main():
    print("🔍 Comprehensive JSON Error Debug")
    print("=" * 60)
    print("This will find exactly where HTML responses are coming from")
    print()
    
    # Step 1: Test authentication
    token = test_authentication()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Step 2: Test order creation in detail
    order_success = test_order_creation_detailed(token)
    
    # Step 3: Test other endpoints
    other_success = test_other_endpoints(token)
    
    print("\n" + "=" * 60)
    print("📊 Final Results:")
    print(f"Authentication: ✅ PASS")
    print(f"Order Creation: {'✅ PASS' if order_success else '❌ FAIL'}")
    print(f"Other Endpoints: {'✅ PASS' if other_success else '❌ FAIL'}")
    
    if not order_success:
        print("\n🚨 ORDER CREATION IS STILL FAILING!")
        print("The HTML response is causing JSON parsing errors.")
        print("\n🔧 Next Steps:")
        print("1. Check Django console for the actual error")
        print("2. Look for any remaining Decimal/float issues")
        print("3. Check for missing required fields")
        print("4. Verify database constraints")
    else:
        print("\n✅ All endpoints working correctly!")
        print("If you're still seeing errors, they might be:")
        print("1. Browser caching issues")
        print("2. Different data being sent from frontend")
        print("3. Network connectivity issues")

if __name__ == "__main__":
    main()
