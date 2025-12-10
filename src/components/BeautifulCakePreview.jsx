// BeautifulCakePreview.jsx
// Beautiful, realistic cake preview that builds up as toppings are added
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { useMemo, useState } from 'react'
import * as THREE from 'three'


// Beautiful Three-Tiered Cake with Customizable Options
function BeautifulCake({
  tiers = 3,
  radius = 2,
  height = 1.2,
  shape = 'round',
  frostingColor = '#FF69B4',
  customizations = {},
  onAddToCart = null
}) {
  const tierHeight = height / tiers

  // Get shape-specific geometry
  const getShapeGeometry = (tierRadius, tierHeight) => {
    switch (shape) {
      case 'heart':
        // Heart shape - create a very distinctive heart-like shape
        const heartGeom = new THREE.CylinderGeometry(tierRadius * 0.3, tierRadius * 1.8, tierHeight, 64)
        // Scale to make it very heart-like (much wider at top, much narrower at bottom, very compressed in Z)
        heartGeom.scale(1, 1, 0.4)
        return heartGeom
      case 'square':
        return new THREE.BoxGeometry(tierRadius * 2, tierHeight, tierRadius * 2)
      case 'rectangle':
        return new THREE.BoxGeometry(tierRadius * 2.5, tierHeight, tierRadius * 1.5)
      default: // round
        return new THREE.CylinderGeometry(tierRadius, tierRadius, tierHeight, 64)
    }
  }

  // Get shape-specific top geometry for frosting
  const getTopGeometry = (tierRadius) => {
    switch (shape) {
      case 'heart':
        // Heart-shaped top for frosting
        return new THREE.CircleGeometry(tierRadius * 1.05, 64)
      case 'square':
        return new THREE.PlaneGeometry(tierRadius * 2.1, tierRadius * 2.1)
      case 'rectangle':
        return new THREE.PlaneGeometry(tierRadius * 2.6, tierRadius * 1.6)
      default: // round
        return new THREE.CircleGeometry(tierRadius * 1.05, 64)
    }
  }

  return (
    <group>
      {/* Cake Tiers */}
      {Array.from({ length: tiers }, (_, i) => {
        const tierRadius = radius * (1 - i * 0.1)
        return (
          <group key={i}>
            {/* Cake Layer */}
            <mesh position={[0, tierHeight * i + tierHeight / 2, 0]} castShadow receiveShadow>
              <primitive object={getShapeGeometry(tierRadius, tierHeight)} />
              <meshStandardMaterial
                color="#8B4513"
                roughness={0.9}
                metalness={0.0}
              />
            </mesh>

            {/* Customizable Frosting Top */}
            <mesh position={[0, tierHeight * (i + 1) + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <primitive object={getTopGeometry(tierRadius)} />
              <meshStandardMaterial
                color={frostingColor}
                roughness={0.6}
                metalness={0.0}
              />
            </mesh>

            {/* Frosting Drips (for top two tiers) */}
            {i < tiers - 1 && (
              <mesh position={[0, tierHeight * i + tierHeight / 2, 0]} castShadow receiveShadow>
                <primitive object={getShapeGeometry(tierRadius * 1.02, tierHeight * 0.1)} />
                <meshStandardMaterial
                  color={frostingColor}
                  roughness={0.6}
                  metalness={0.0}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Yellow Swirled Dollops on Top */}
      {Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2
        const distance = radius * 0.7
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        const y = height + 0.1

        return (
          <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial
              color="#FFD700"
              roughness={0.4}
              metalness={0.0}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Topping System that builds up realistically
function ToppingSystem({
  toppings = [],
  cakeRadius = 2,
  cakeHeight = 1.2,
  tiers = 3
}) {

  // Create topping geometries
  const toppingGeometries = useMemo(() => ({
    sprinkles: new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6),
    chocolate_chips: new THREE.SphereGeometry(0.06, 8, 6),
    nuts: new THREE.SphereGeometry(0.08, 8, 6),
    berries: new THREE.SphereGeometry(0.1, 8, 6),
    flowers: new THREE.SphereGeometry(0.12, 8, 6)
  }), [])

  // Create topping materials
  const toppingMaterials = useMemo(() => ({
    sprinkles: new THREE.MeshStandardMaterial({ color: '#FF6B6B', roughness: 0.7 }),
    chocolate_chips: new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.3 }),
    nuts: new THREE.MeshStandardMaterial({ color: '#A0522D', roughness: 0.8 }),
    berries: new THREE.MeshStandardMaterial({ color: '#FF1493', roughness: 0.6 }),
    flowers: new THREE.MeshStandardMaterial({ color: '#FF69B4', roughness: 0.5 })
  }), [])

  // Generate topping positions based on type
  const generateToppingPositions = (toppingType, count) => {
    const positions = []
    const tierHeight = cakeHeight / tiers

    for (let i = 0; i < count; i++) {
      const tier = Math.floor(Math.random() * tiers)
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * cakeRadius * 0.8
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      const y = tierHeight * (tier + 1) + 0.05 + Math.random() * 0.02

      positions.push({
        x, y, z,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        scale: 0.8 + Math.random() * 0.4
      })
    }

    return positions
  }

  // Render toppings
  const renderToppings = () => {
    return toppings.map((topping, toppingIndex) => {
      const positions = generateToppingPositions(topping.type, topping.count || 20)
      const geometry = toppingGeometries[topping.type]
      const material = toppingMaterials[topping.type]

      if (!geometry || !material) return null

      return (
        <group key={toppingIndex}>
          {positions.map((pos, i) => (
            <mesh
              key={i}
              position={[pos.x, pos.y, pos.z]}
              rotation={[pos.rotX, pos.rotY, pos.rotZ]}
              scale={[pos.scale, pos.scale, pos.scale]}
              castShadow
              receiveShadow
            >
              <primitive object={geometry} />
              <primitive object={material} />
            </mesh>
          ))}
        </group>
      )
    })
  }

  return <>{renderToppings()}</>
}

export default function BeautifulCakePreviewApp({
  tiers = 3,
  toppings = [],
  orderId = 'SB202509190067',
  onClose = null,
  customizations = {},
  customizationOptions = {},
  basePrice = 0,
  onAddToCart = null
}) {
  const [selectedTiers, setSelectedTiers] = useState(tiers)

  // Debug logging
  console.log('🎂 BeautifulCakePreviewApp props:', {
    tiers,
    customizations,
    customizationOptions,
    basePrice
  });

  // Calculate dynamic pricing based on tiers and customizations
  const calculatePrice = () => {
    let price = basePrice
    console.log('🎂 Base price:', basePrice, 'Selected tiers:', selectedTiers);

    // Add tier-based pricing
    if (selectedTiers === 2) {
      price += 1500 // Additional cost for 2-tier
      console.log('🎂 Added 2-tier cost: +1500, New price:', price);
    } else if (selectedTiers === 3) {
      price += 3000 // Additional cost for 3-tier
      console.log('🎂 Added 3-tier cost: +3000, New price:', price);
    }

    // Add customization costs
    if (customizations.size) {
      const sizeOption = customizationOptions.sizes?.find(s => s.id === customizations.size)
      if (sizeOption) price += sizeOption.priceModifier
    }

    if (customizations.shape) {
      const shapeOption = customizationOptions.shapes?.find(s => s.id === customizations.shape)
      if (shapeOption) price += shapeOption.priceModifier
    }

    if (customizations.frosting) {
      const frostingOption = customizationOptions.frostings?.find(f => f.id === customizations.frosting)
      if (frostingOption) price += frostingOption.priceModifier
    }

    if (customizations.color) {
      const colorOption = customizationOptions.colors?.find(c => c.id === customizations.color)
      if (colorOption) price += colorOption.priceModifier
    }

    if (customizations.toppings) {
      customizations.toppings.forEach(toppingId => {
        const toppingOption = customizationOptions.toppings?.find(t => t.id === toppingId)
        if (toppingOption) price += toppingOption.priceModifier
      })
    }

    return price
  }

  // Get customization values
  const getShape = () => {
    if (!customizations.shape) return 'round'
    const shapeOption = customizationOptions.shapes?.find(s => s.id === customizations.shape)
    const shape = shapeOption?.name?.toLowerCase() || 'round'
    console.log('🎂 Shape:', customizations.shape, 'Shape option:', shapeOption, 'Final shape:', shape);
    return shape
  }

  const getFrostingColor = () => {
    console.log('🎂 getFrostingColor called with customizations.frosting:', customizations.frosting, 'customizations.color:', customizations.color);

    // If frosting is selected, use frosting color
    if (customizations.frosting) {
      const frostingOption = customizationOptions.frostings?.find(f => f.id === customizations.frosting)
      console.log('🎂 Found frosting option:', frostingOption);
      let color = '#FF69B4'
      switch (frostingOption?.name) {
        case 'Buttercream': color = '#FFF8DC'; break
        case 'Cream Cheese': color = '#FFF8DC'; break
        case 'Chocolate Ganache': color = '#8B4513'; break
        case 'Whipped Cream': color = '#FFFFFF'; break
        case 'Red Velvet': color = '#DC143C'; break
        default: color = '#FF69B4'
      }
      console.log('🎂 Using frosting color:', color);
      return color
    }

    // If no frosting but color is selected, use selected color
    if (customizations.color) {
      const colorOption = customizationOptions.colors?.find(c => c.id === customizations.color)
      console.log('🎂 Found color option:', colorOption);
      if (colorOption) {
        console.log('🎂 Using selected color:', colorOption.color);
        return colorOption.color
      }
    }

    // Default pink if nothing is selected
    console.log('🎂 No frosting or color selected, returning default pink');
    return '#FF69B4' // Default pink
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 4, 8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-8, 6, -8]} intensity={0.6} color="#FFF8DC" />
        <pointLight position={[8, 4, 8]} intensity={0.4} color="#FFF8DC" />
        <spotLight
          position={[0, 15, 0]}
          intensity={0.8}
          angle={0.3}
          penumbra={0.5}
          castShadow
          color="#FFF8DC"
        />

        <group position={[0, 0, 0]}>
          <BeautifulCake
            tiers={selectedTiers}
            radius={2}
            height={1.8}
            shape={getShape()}
            frostingColor={getFrostingColor()}
            customizations={customizations}
            onAddToCart={onAddToCart}
          />
          <ToppingSystem
            toppings={toppings}
            cakeRadius={2}
            cakeHeight={1.8}
            tiers={selectedTiers}
          />
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#e6e6e6" />
        </mesh>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      {/* Tier Selection */}
      <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 8 }}>Cake Tiers</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTiers(tier)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: selectedTiers === tier ? '2px solid #FF69B4' : '2px solid #ddd',
                background: selectedTiers === tier ? '#FF69B4' : 'white',
                color: selectedTiers === tier ? 'white' : '#333',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tier} Tier{tier > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Order Info */}
      <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Order #{orderId}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {selectedTiers} Tier{selectedTiers > 1 ? 's' : ''} Beautiful Cake
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
          {getShape()} shape • {customizationOptions.frostings?.find(f => f.id === customizations.frosting)?.name || 'Pink'} frosting
        </div>
        {customizations.message && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontStyle: 'italic', maxWidth: '200px', wordWrap: 'break-word' }}>
            💌 "{customizations.message}"
          </div>
        )}
        <div style={{ fontSize: 12, color: '#e91e63', marginTop: 4, fontWeight: 'bold' }}>
          RS {calculatePrice().toLocaleString()}
        </div>
      </div>

      {/* Add to Cart Button */}
      <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <button
          onClick={onAddToCart}
          style={{
            background: 'linear-gradient(135deg, #e91e63, #f06292)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(233, 30, 99, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(233, 30, 99, 0.3)';
          }}
        >
          🛒 Add to Cart
        </button>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '18px',
            color: '#666',
            zIndex: 10
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

/*
Features:
- Beautiful three-tiered cake with realistic proportions
- Pink frosting with drip effect on top two tiers
- Yellow swirled dollops arranged in a circle on top
- Dark brown cake layers
- Tier selection (1, 2, or 3 tiers)
- Realistic topping system that builds up as you add toppings
- Professional lighting and shadows
- Clean, beautiful aesthetic
*/
