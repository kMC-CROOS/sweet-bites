import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, GiftIcon } from '@heroicons/react/24/outline';

const OfferBanner = ({ offer, onClose, isPopup = false }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (offer?.end_date) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const endTime = new Date(offer.end_date).getTime();
        const timeLeft = endTime - now;

        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes}m`);
          }
        } else {
          setTimeRemaining('Expired');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [offer?.end_date]);

  if (!offer) return null;

  const bannerStyle = {
    backgroundColor: offer.background_color || '#FF6B6B',
    color: offer.text_color || '#FFFFFF',
  };

  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="relative max-w-md w-full rounded-lg shadow-xl overflow-hidden"
          style={bannerStyle}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          {offer.banner_image && (
            <img
              src={offer.banner_image}
              alt={offer.title}
              className="w-full h-48 object-cover"
            />
          )}
          
          <div className="p-6">
            <div className="flex items-center mb-2">
              <GiftIcon className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-bold">{offer.title}</h3>
            </div>
            
            <p className="text-sm mb-4 opacity-90">{offer.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{offer.discount_display}</span>
              {timeRemaining && timeRemaining !== 'Expired' && (
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-lg overflow-hidden shadow-lg"
      style={bannerStyle}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white hover:text-gray-200 z-10"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <GiftIcon className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-bold">{offer.title}</h3>
            </div>
            <p className="text-sm opacity-90 mb-2">{offer.description}</p>
            <div className="flex items-center">
              <span className="text-lg font-semibold mr-4">{offer.discount_display}</span>
              {timeRemaining && timeRemaining !== 'Expired' && (
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{timeRemaining} left</span>
                </div>
              )}
            </div>
          </div>
          
          {offer.banner_image && (
            <img
              src={offer.banner_image}
              alt={offer.title}
              className="w-20 h-20 object-cover rounded-lg ml-4"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferBanner;
