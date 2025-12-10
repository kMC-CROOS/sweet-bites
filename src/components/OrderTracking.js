import React, { useState, useEffect, useRef } from 'react';
import { Map, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPinIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FheWE5OSIsImEiOiJjbWZxY2U3bWcwcHM0MmluNTkxaHEzcDd1In0.nlgLV43KSw1e_AgyBVFuMQ';

const OrderTracking = ({ orderId }) => {
  const [viewState, setViewState] = useState({
    longitude: 77.2090, // Default to Delhi coordinates
    latitude: 28.6139,
    zoom: 12
  });
  
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/orders/${orderId}/tracking/`);
      const data = await response.json();
      
      if (response.ok) {
        setOrder(data.order);
        setDeliveryLocation(data.delivery_location);
        setCustomerLocation(data.customer_location);
        setLocationHistory(data.location_history || []);
        
        // Center map on delivery location if available
        if (data.delivery_location) {
          setViewState({
            longitude: parseFloat(data.delivery_location.longitude),
            latitude: parseFloat(data.delivery_location.latitude),
            zoom: 14
          });
        }
      } else {
        setError(data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'out_for_delivery') {
      return <TruckIcon className="w-5 h-5" />;
    }
    return <ClockIcon className="w-5 h-5" />;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-800">Order not found</p>
      </div>
    );
  }

  const distance = deliveryLocation && customerLocation 
    ? calculateDistance(
        parseFloat(deliveryLocation.latitude),
        parseFloat(deliveryLocation.longitude),
        parseFloat(customerLocation.latitude),
        parseFloat(customerLocation.longitude)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Order Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
            {order.order_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.order_status)}
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {order.order_status.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          {order.delivery_person && (
            <div className="flex items-center space-x-3">
              <TruckIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Delivery Person</p>
                <p className="text-lg font-semibold text-gray-900">
                  {order.delivery_person.first_name} {order.delivery_person.last_name}
                </p>
              </div>
            </div>
          )}
          
          {distance && (
            <div className="flex items-center space-x-3">
              <MapPinIcon className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Distance</p>
                <p className="text-lg font-semibold text-gray-900">
                  {distance.toFixed(1)} km
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-96">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            {/* Customer Location Marker */}
            {customerLocation && (
              <Marker
                longitude={parseFloat(customerLocation.longitude)}
                latitude={parseFloat(customerLocation.latitude)}
                anchor="bottom"
              >
                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <MapPinIcon className="w-6 h-6" />
                </div>
              </Marker>
            )}

            {/* Delivery Person Location Marker */}
            {deliveryLocation && (
              <Marker
                longitude={parseFloat(deliveryLocation.longitude)}
                latitude={parseFloat(deliveryLocation.latitude)}
                anchor="bottom"
              >
                <div className="bg-green-600 text-white p-2 rounded-full shadow-lg">
                  <TruckIcon className="w-6 h-6" />
                </div>
              </Marker>
            )}

            {/* Location History Markers */}
            {locationHistory.map((location, index) => (
              <Marker
                key={index}
                longitude={parseFloat(location.longitude)}
                latitude={parseFloat(location.latitude)}
                anchor="bottom"
              >
                <div 
                  className="bg-gray-400 text-white p-1 rounded-full shadow-lg cursor-pointer"
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="w-3 h-3"></div>
                </div>
              </Marker>
            ))}

            {/* Popup for selected location */}
            {selectedLocation && (
              <Popup
                longitude={parseFloat(selectedLocation.longitude)}
                latitude={parseFloat(selectedLocation.latitude)}
                anchor="top"
                onClose={() => setSelectedLocation(null)}
              >
                <div className="p-2">
                  <p className="font-semibold">Location Update</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedLocation.timestamp).toLocaleString()}
                  </p>
                  {selectedLocation.speed && (
                    <p className="text-sm text-gray-600">
                      Speed: {selectedLocation.speed.toFixed(1)} km/h
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location History</h3>
          <div className="space-y-3">
            {locationHistory.slice(0, 10).map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(location.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {location.latitude}, {location.longitude}
                    </p>
                  </div>
                </div>
                {location.speed && (
                  <div className="text-sm text-gray-600">
                    {location.speed.toFixed(1)} km/h
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
