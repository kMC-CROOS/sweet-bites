from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Order
from users.models import User
from inventory.models import Ingredient
from feedback.models import Feedback


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    Comprehensive dashboard statistics for admin users
    """
    user = request.user
    
    # Check if user is admin
    if not (user.user_type == 'admin' or user.is_superuser):
        return Response(
            {'error': 'Access denied. Admin privileges required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get all orders
        all_orders = Order.objects.all()
        
        # Calculate order statistics
        total_orders = all_orders.count()
        total_revenue = all_orders.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Pending orders (pending, confirmed, preparing)
        pending_orders = all_orders.filter(
            order_status__in=['pending', 'confirmed', 'preparing']
        ).count()
        
        # Today's sales
        today = timezone.now().date()
        today_orders = all_orders.filter(created_at__date=today)
        today_sales = today_orders.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Customer statistics
        total_customers = User.objects.filter(user_type='customer').count()
        
        # Inventory statistics
        total_ingredients = Ingredient.objects.count()
        low_stock_items = Ingredient.objects.filter(
            current_stock__lte=F('minimum_stock')
        ).count()
        
        # Get low stock alerts
        low_stock_alerts = Ingredient.objects.filter(
            current_stock__lte=F('minimum_stock')
        ).values('name', 'current_stock', 'minimum_stock', 'unit')[:10]
        
        # Recent orders (last 5)
        recent_orders = all_orders.order_by('-created_at')[:5]
        
        # Feedback statistics
        total_feedback = Feedback.objects.count()
        avg_rating = Feedback.objects.aggregate(
            avg_rating=Sum('rating') / Count('rating')
        )['avg_rating'] or 0
        
        # Order status breakdown
        order_status_breakdown = {
            'pending': all_orders.filter(order_status='pending').count(),
            'confirmed': all_orders.filter(order_status='confirmed').count(),
            'preparing': all_orders.filter(order_status='preparing').count(),
            'ready': all_orders.filter(order_status='ready').count(),
            'out_for_delivery': all_orders.filter(order_status='out_for_delivery').count(),
            'delivered': all_orders.filter(order_status='delivered').count(),
            'cancelled': all_orders.filter(order_status='cancelled').count(),
        }
        
        # Weekly sales trend (last 7 days)
        weekly_sales = []
        for i in range(7):
            date = today - timedelta(days=i)
            day_sales = all_orders.filter(
                created_at__date=date
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            weekly_sales.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': day_sales
            })
        
        # Prepare response data
        dashboard_data = {
            'overview': {
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'total_revenue': total_revenue,
                'total_customers': total_customers,
                'today_sales': today_sales,
                'low_stock_items': low_stock_items,
                'total_feedback': total_feedback,
                'avg_rating': round(avg_rating, 2) if avg_rating else 0
            },
            'orders': {
                'recent_orders': [
                    {
                        'id': order.id,
                        'order_number': order.order_number,
                        'customer_name': order.customer.get_full_name() if order.customer else 'Guest',
                        'total_amount': order.total_amount,
                        'order_status': order.order_status,
                        'created_at': order.created_at
                    }
                    for order in recent_orders
                ],
                'status_breakdown': order_status_breakdown
            },
            'inventory': {
                'total_ingredients': total_ingredients,
                'low_stock_alerts': list(low_stock_alerts)
            },
            'analytics': {
                'weekly_sales': weekly_sales
            }
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching dashboard data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
