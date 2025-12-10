#!/usr/bin/env python
"""
Debug the order flow to help troubleshoot order details not showing
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sweetbite_backend.settings')
django.setup()

from users.models import User
from orders.models import Order
from cakes.models import Cake

def debug_order_flow():
    """Debug the order creation and display flow"""
    print("🔍 Debugging Order Flow")
    print("=" * 50)
    
    # Check if we have test data
    try:
        user = User.objects.get(username='feedback_test_user')
        print(f"✅ Test user found: {user.username}")
        
        # Check recent orders
        recent_orders = Order.objects.filter(customer=user).order_by('-created_at')[:5]
        print(f"✅ Found {recent_orders.count()} recent orders")
        
        for order in recent_orders:
            print(f"   - Order {order.id}: {order.order_number} ({order.order_status})")
            print(f"     Created: {order.created_at}")
            print(f"     Items: {order.items.count()}")
            print(f"     Total: RS {order.total_amount}")
            
    except User.DoesNotExist:
        print("❌ Test user not found")
    
    print("\n" + "=" * 50)
    print("🧪 HOW TO DEBUG ORDER DETAILS ISSUE:")
    print("=" * 50)
    
    print("\n1. 📱 **Check Browser Console:**")
    print("   - Open DevTools (F12)")
    print("   - Go to Console tab")
    print("   - Look for these messages:")
    print("     ✅ 'Creating order from preview: ...'")
    print("     ✅ 'Order created successfully: ...'")
    print("     ✅ 'Navigating to success page with order: ...'")
    print("     ✅ 'OrderSuccessPage useEffect - location.state: ...'")
    print("     ✅ 'Order data found in location.state: ...'")
    
    print("\n2. 🔍 **Check Network Tab:**")
    print("   - Open DevTools → Network tab")
    print("   - Look for POST request to /api/orders/orders/")
    print("   - Check if response is successful (200 status)")
    print("   - Verify order data in response")
    
    print("\n3. 🚨 **Common Issues & Solutions:**")
    print("\n   ❌ **Order not created:**")
    print("      - Check if API endpoint is working")
    print("      - Verify authentication token")
    print("      - Check order data format")
    
    print("\n   ❌ **Order created but not showing:**")
    print("      - Check if navigation is working")
    print("      - Verify location.state is passed")
    print("      - Check if OrderSuccessPage receives data")
    
    print("\n   ❌ **Page redirects to home:**")
    print("      - Check if location.state is null")
    print("      - Verify route configuration")
    print("      - Check for navigation errors")
    
    print("\n4. 🎯 **Step-by-Step Debug Process:**")
    print("\n   Step 1: Press 'Confirm Order'")
    print("   Step 2: Check console for 'Creating order from preview'")
    print("   Step 3: Check console for 'Order created successfully'")
    print("   Step 4: Check console for 'Navigating to success page'")
    print("   Step 5: Check console for 'OrderSuccessPage useEffect'")
    print("   Step 6: Check console for 'Order data found'")
    
    print("\n5. 🔧 **Quick Fixes to Try:**")
    print("\n   - Refresh the page and try again")
    print("   - Check if backend server is running")
    print("   - Verify authentication is working")
    print("   - Check if cart has items")
    print("   - Verify shipping address is selected")
    
    print("\n" + "=" * 50)
    print("📞 **If Still Not Working:**")
    print("=" * 50)
    print("1. Check browser console for error messages")
    print("2. Check network tab for failed requests")
    print("3. Verify backend API is responding")
    print("4. Check if order is actually created in database")
    print("5. Try creating a new order from scratch")
    
    return True

if __name__ == '__main__':
    debug_order_flow()
