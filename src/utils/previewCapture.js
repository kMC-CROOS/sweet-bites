// Utility function to capture 3D preview as image
export const capturePreviewImage = (canvasRef, customizations) => {
  return new Promise((resolve) => {
    if (!canvasRef.current) {
      resolve(null);
      return;
    }

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png', 0.8);
    
    // Create a preview object with the image and customization details
    const previewData = {
      image: dataURL,
      customizations: customizations,
      timestamp: Date.now()
    };
    
    resolve(previewData);
  });
};

// Function to generate a preview image from BeautifulCakePreview component
export const generateBeautifulPreviewImage = (customizations, customizationOptions, basePrice) => {
  // For now, we'll create a placeholder image URL based on customizations
  // In a real implementation, you would render the 3D scene to a canvas and capture it
  
  // Get shape name from ID
  const shapeId = customizations.shape;
  const shape = shapeId ? 
    customizationOptions.shapes?.find(s => s.id === shapeId)?.name || 'Round' : 
    'Round';
  
  const frosting = customizations.frosting ? 
    customizationOptions.frostings?.find(f => f.id === customizations.frosting)?.name || 'Pink' : 
    'Pink';
  const color = customizations.color ? 
    customizationOptions.colors?.find(c => c.id === customizations.color)?.color || '#FF69B4' : 
    '#FF69B4';
  const toppings = customizations.toppings || [];
  const message = customizations.message || '';
  
  // Create a data URL for a simple preview image
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 300, 300);
  
  // Cake base
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(150, 200, 80, 0, 2 * Math.PI);
  ctx.fill();
  
  // Cake top
  ctx.fillStyle = frosting === 'Chocolate Ganache' ? '#8B4513' : 
                  frosting === 'Red Velvet' ? '#DC143C' : 
                  frosting === 'Whipped Cream' ? '#FFFFFF' : color;
  ctx.beginPath();
  ctx.arc(150, 180, 70, 0, 2 * Math.PI);
  ctx.fill();
  
  // Toppings
  if (toppings.length > 0) {
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < Math.min(toppings.length * 3, 15); i++) {
      const x = 120 + Math.random() * 60;
      const y = 160 + Math.random() * 40;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  
  // Shape indicator
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText((shape || 'Round').toUpperCase(), 150, 50);
  
  // Message indicator
  if (message) {
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('💌', 150, 280);
  }
  
  const dataURL = canvas.toDataURL('image/png', 0.8);
  
  return {
    image: dataURL,
    customizations: customizations,
    timestamp: Date.now()
  };
};
