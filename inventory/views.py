from django.shortcuts import render
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.db.models import Q, Sum, Count, Avg

from .models import (
    Supplier, Ingredient, StockMovement, 
    PurchaseOrder, PurchaseOrderItem, Recipe, RecipeIngredient
)
from .serializers import (
    SupplierSerializer, IngredientSerializer, IngredientCreateSerializer,
    StockMovementSerializer, StockMovementCreateSerializer, PurchaseOrderSerializer,
    PurchaseOrderCreateSerializer, RecipeSerializer, RecipeCreateSerializer
)

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_inventory_manager:
            return Supplier.objects.all().order_by('name')
        return Supplier.objects.none()

class IngredientFilter(filters.FilterSet):
    supplier = filters.NumberFilter(field_name='supplier')
    is_low_stock = filters.BooleanFilter(method='filter_low_stock')
    is_active = filters.BooleanFilter(field_name='is_active')
    
    class Meta:
        model = Ingredient
        fields = ['supplier', 'is_low_stock', 'is_active']
    
    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(current_stock__lte=models.F('minimum_stock'))
        return queryset

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by('name')
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = IngredientFilter
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_inventory_manager:
            return Ingredient.objects.all().order_by('name')
        return Ingredient.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IngredientCreateSerializer
        return IngredientSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        ingredients = self.get_queryset().filter(
            current_stock__lte=models.F('minimum_stock')
        )
        serializer = self.get_serializer(ingredients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        # Ingredients expiring in the next 30 days
        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        ingredients = self.get_queryset().filter(
            expiry_date__lte=thirty_days_from_now,
            expiry_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(ingredients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        ingredients = self.get_queryset()
        
        total_ingredients = ingredients.count()
        low_stock_count = ingredients.filter(
            current_stock__lte=models.F('minimum_stock')
        ).count()
        total_value = ingredients.aggregate(
            total=Sum(models.F('current_stock') * models.F('unit_cost'))
        )['total'] or 0
        
        # Recent movements
        recent_movements = StockMovement.objects.filter(
            ingredient__in=ingredients
        ).order_by('-created_at')[:10]
        
        stats = {
            'total_ingredients': total_ingredients,
            'low_stock_count': low_stock_count,
            'total_value': total_value,
            'recent_movements': StockMovementSerializer(recent_movements, many=True).data
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def cost_analysis_report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        ingredients = self.get_queryset()
        
        # Get stock movements in the date range
        movements = StockMovement.objects.filter(
            ingredient__in=ingredients,
            created_at__date__range=[start_date, end_date]
        )
        
        # Calculate cost analysis
        total_inventory_value = ingredients.aggregate(
            total=Sum(models.F('current_stock') * models.F('unit_cost'))
        )['total'] or 0
        
        # Cost by supplier
        cost_by_supplier = ingredients.values('supplier__name').annotate(
            total_value=Sum(models.F('current_stock') * models.F('unit_cost')),
            count=Count('id'),
            avg_cost=Avg('unit_cost')
        ).order_by('-total_value')
        
        # Most expensive ingredients
        expensive_ingredients = ingredients.order_by('-unit_cost')[:10]
        
        # Low stock high value items
        low_stock_high_value = ingredients.filter(
            current_stock__lte=models.F('minimum_stock')
        ).order_by('-unit_cost')[:10]
        
        # Movement costs
        total_movement_value = movements.aggregate(
            total=Sum('total_value')
        )['total'] or 0
        
        movement_by_type = movements.values('movement_type').annotate(
            count=Count('id'),
            total_value=Sum('total_value')
        )
        
        report = {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_inventory_value': total_inventory_value,
                'total_movement_value': total_movement_value,
                'total_ingredients': ingredients.count(),
                'low_stock_count': ingredients.filter(
                    current_stock__lte=models.F('minimum_stock')
                ).count()
            },
            'cost_by_supplier': cost_by_supplier,
            'expensive_ingredients': IngredientSerializer(expensive_ingredients, many=True).data,
            'low_stock_high_value': IngredientSerializer(low_stock_high_value, many=True).data,
            'movement_by_type': movement_by_type
        }
        
        return Response(report)
    
    @action(detail=False, methods=['get'])
    def consumption_analysis(self, request):
        """Get ingredient consumption analysis for the visual graph"""
        period = request.query_params.get('period', 'week')  # today, week, month
        
        # Calculate date range based on period
        end_date = timezone.now().date()
        if period == 'today':
            start_date = end_date
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Get stock movements (outbound) for consumption analysis
        movements = StockMovement.objects.filter(
            movement_type__in=['out', 'waste'],
            created_at__date__range=[start_date, end_date]
        )
        
        # Calculate consumption by ingredient
        consumption_data = movements.values(
            'ingredient__name',
            'ingredient__unit',
            'ingredient__current_stock'
        ).annotate(
            total_consumed=Sum('quantity'),
            movement_count=Count('id')
        ).order_by('-total_consumed')
        
        # Calculate total consumption for percentage calculation
        total_consumption = sum(float(item['total_consumed']) for item in consumption_data)
        
        # Prepare data for frontend
        ingredients_data = []
        for item in consumption_data[:10]:  # Top 10 ingredients
            percentage = (float(item['total_consumed']) / total_consumption * 100) if total_consumption > 0 else 0
            
            # Calculate trend (simplified - compare with previous period)
            prev_start = start_date - (end_date - start_date)
            prev_movements = StockMovement.objects.filter(
                ingredient__name=item['ingredient__name'],
                movement_type__in=['out', 'waste'],
                created_at__date__range=[prev_start, start_date]
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            current_consumption = float(item['total_consumed'])
            trend = 0
            if prev_movements > 0:
                trend = ((current_consumption - float(prev_movements)) / float(prev_movements)) * 100
            
            ingredients_data.append({
                'name': item['ingredient__name'],
                'unit': item['ingredient__unit'],
                'current_stock': float(item['ingredient__current_stock']),
                'consumed': current_consumption,
                'percentage': round(percentage, 1),
                'trend': round(trend, 1),
                'movement_count': item['movement_count']
            })
        
        # Calculate wastage analysis
        wastage_movements = StockMovement.objects.filter(
            movement_type='waste',
            created_at__date__range=[start_date, end_date]
        )
        
        wastage_data = wastage_movements.values('ingredient__name').annotate(
            total_wasted=Sum('quantity')
        ).order_by('-total_wasted')
        
        wastage_items = []
        for item in wastage_data[:5]:
            wastage_items.append({
                'name': item['ingredient__name'],
                'wasted': float(item['total_wasted']),
                'percentage': round((float(item['total_wasted']) / total_consumption * 100), 1) if total_consumption > 0 else 0
            })
        
        # Low usage items (ingredients with minimal consumption)
        all_ingredients = Ingredient.objects.filter(is_active=True)
        low_usage_items = []
        
        for ingredient in all_ingredients:
            ingredient_consumption = movements.filter(
                ingredient=ingredient
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            if float(ingredient_consumption) < (total_consumption * 0.05):  # Less than 5% of total consumption
                low_usage_items.append({
                    'name': ingredient.name,
                    'consumed': float(ingredient_consumption),
                    'percentage': round((float(ingredient_consumption) / total_consumption * 100), 1) if total_consumption > 0 else 0
                })
        
        # Sort by consumption and take top 5
        low_usage_items = sorted(low_usage_items, key=lambda x: x['consumed'])[:5]
        
        return Response({
            'period': {
                'type': period,
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_consumption': float(total_consumption),
                'total_ingredients': len(ingredients_data),
                'total_movements': movements.count()
            },
            'ingredients': ingredients_data,
            'wastage': wastage_items,
            'low_usage': low_usage_items
        })

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_inventory_manager:
            return StockMovement.objects.all().order_by('-created_at')
        return StockMovement.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StockMovementCreateSerializer
        return StockMovementSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def movement_report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        movements = self.get_queryset().filter(
            created_at__date__range=[start_date, end_date]
        )
        
        # Movement by type
        movement_by_type = movements.values('movement_type').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity'),
            total_value=Sum('total_value')
        )
        
        # Movement by ingredient
        movement_by_ingredient = movements.values(
            'ingredient__name'
        ).annotate(
            count=Count('id'),
            total_quantity=Sum('quantity'),
            total_value=Sum('total_value')
        )
        
        report = {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_movements': movements.count(),
                'total_quantity': movements.aggregate(
                    total=Sum('quantity')
                )['total'] or 0,
                'total_value': movements.aggregate(
                    total=Sum('total_value')
                )['total'] or 0
            },
            'movement_by_type': movement_by_type,
            'movement_by_ingredient': movement_by_ingredient
        }
        
        return Response(report)

class PurchaseOrderFilter(filters.FilterSet):
    supplier = filters.NumberFilter(field_name='supplier')
    status = filters.CharFilter(field_name='status')
    date_from = filters.DateFilter(field_name='order_date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='order_date', lookup_expr='lte')
    
    class Meta:
        model = PurchaseOrder
        fields = ['supplier', 'status']

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = PurchaseOrderFilter
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_inventory_manager:
            return PurchaseOrder.objects.all().order_by('-created_at')
        return PurchaseOrder.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Use the read serializer for the response
        response_serializer = PurchaseOrderSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def receive_items(self, request, pk=None):
        purchase_order = self.get_object()
        received_items = request.data.get('received_items', [])
        
        for item_data in received_items:
            item_id = item_data.get('item_id')
            received_quantity = item_data.get('received_quantity')
            
            try:
                po_item = PurchaseOrderItem.objects.get(
                    id=item_id,
                    purchase_order=purchase_order
                )
                po_item.received_quantity = received_quantity
                po_item.save()
                
                # Create stock movement
                if received_quantity > 0:
                    StockMovement.objects.create(
                        ingredient=po_item.ingredient,
                        movement_type='in',
                        quantity=received_quantity,
                        unit_cost=po_item.unit_cost,
                        reference=f"PO #{purchase_order.po_number}",
                        notes=f"Received from purchase order",
                        created_by=request.user
                    )
                
            except PurchaseOrderItem.DoesNotExist:
                continue
        
        # Check if all items are received
        all_received = all(
            item.received_quantity >= item.quantity
            for item in purchase_order.items.all()
        )
        
        if all_received:
            purchase_order.status = 'received'
            purchase_order.delivery_date = timezone.now().date()
            purchase_order.save()
        
        return Response({'message': 'Items received successfully'})
    
    @action(detail=False, methods=['get'])
    def pending_orders(self, request):
        pending_orders = self.get_queryset().filter(
            status__in=['draft', 'sent', 'confirmed']
        )
        serializer = self.get_serializer(pending_orders, many=True)
        return Response(serializer.data)

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all().order_by('name')
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_inventory_manager:
            return Recipe.objects.all().order_by('name')
        return Recipe.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RecipeCreateSerializer
        return RecipeSerializer
    
    @action(detail=True, methods=['post'])
    def check_availability(self, request, pk=None):
        recipe = self.get_object()
        servings = request.data.get('servings', 1)
        
        unavailable_ingredients = []
        
        for recipe_ingredient in recipe.ingredients.all():
            required_quantity = recipe_ingredient.quantity * servings
            available_quantity = recipe_ingredient.ingredient.current_stock
            
            if available_quantity < required_quantity:
                unavailable_ingredients.append({
                    'ingredient': recipe_ingredient.ingredient.name,
                    'required': required_quantity,
                    'available': available_quantity,
                    'shortage': required_quantity - available_quantity
                })
        
        return Response({
            'recipe': recipe.name,
            'servings': servings,
            'available': len(unavailable_ingredients) == 0,
            'unavailable_ingredients': unavailable_ingredients
        })
