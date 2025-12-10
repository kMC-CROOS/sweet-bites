// RealisticCakeToppings.jsx
// Realistic cake topping system with authentic decorations
import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Helper: random between
const rand = (a, b) => a + Math.random() * (b - a)

// Realistic topping types with authentic colors and properties
const REALISTIC_TOPPINGS = {
  sprinkles: {
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    size: 0.02,
    shape: 'cylinder',
    count: 200
  },
  chocolate_chips: {
    colors: ['#8B4513', '#654321', '#A0522D'],
    size: 0.08,
    shape: 'sphere',
    count: 80
  },
  nuts: {
    colors: ['#8B4513', '#A0522D', '#D2691E'],
    size: 0.12,
    shape: 'oval',
    count: 60
  },
  berries: {
    colors: ['#FF1493', '#FF6347', '#32CD32', '#FFD700'],
    size: 0.15,
    shape: 'sphere',
    count: 40
  },
  coconut: {
    colors: ['#F5F5DC', '#FFF8DC', '#F0E68C'],
    size: 0.06,
    shape: 'flakes',
    count: 120
  },
  flowers: {
    colors: ['#FF69B4', '#FFD700', '#FF6347', '#DA70D6', '#98FB98'],
    size: 0.18,
    shape: 'flower',
    count: 25
  }
}

// Create realistic topping geometry
function createToppingGeometry(toppingType) {
  const config = REALISTIC_TOPPINGS[toppingType]
  console.log('🌸 Creating geometry for', toppingType, 'with config:', config);

  switch (config.shape) {
    case 'cylinder':
      // Sprinkles - small cylinders
      return new THREE.CylinderGeometry(config.size * 0.5, config.size * 0.5, config.size * 2, 6)

    case 'sphere':
      // Chocolate chips and berries - spheres
      return new THREE.SphereGeometry(config.size, 8, 6)

    case 'oval':
      // Nuts - oval shapes
      const geom = new THREE.SphereGeometry(config.size, 8, 6)
      geom.scale(1, 0.7, 1.2)
      return geom

    case 'flakes':
      // Coconut flakes - flat irregular shapes
      const flake = new THREE.PlaneGeometry(config.size, config.size * 1.5)
      flake.rotateX(Math.PI * 0.1)
      return flake

    case 'flower':
      // Simple flower shape - use a flattened sphere for petals
      const flowerGeom = new THREE.SphereGeometry(config.size, 8, 6)
      flowerGeom.scale(1, 0.3, 1) // Flatten to make it look like a flower
      return flowerGeom

    default:
      return new THREE.SphereGeometry(config.size, 8, 6)
  }
}

// Create realistic topping material
function createToppingMaterial(toppingType, colorIndex = 0) {
  const config = REALISTIC_TOPPINGS[toppingType]
  const color = config.colors[colorIndex % config.colors.length]

  console.log('🌸 Creating material for', toppingType, 'with color:', color);

  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: toppingType === 'coconut' ? 0.9 : toppingType === 'chocolate_chips' ? 0.3 : 0.7,
    metalness: toppingType === 'chocolate_chips' ? 0.1 : 0.0,
    normalScale: new THREE.Vector2(0.5, 0.5)
  })
}

// Realistic Cake mesh with multiple layers and detailed frosting
function Cake({ radius = 2, height = 1.2 }) {
  return (
    <group>
      {/* Cake Base Layer */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 64]} />
        <meshStandardMaterial
          color="#D4A574"
          roughness={0.9}
          metalness={0.0}
          normalScale={[0.5, 0.5]}
        />
      </mesh>

      {/* Cake Layer 1 - Vanilla Sponge */}
      <mesh position={[0, height * 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, height * 0.3, 64]} />
        <meshStandardMaterial
          color="#F5E6D3"
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Cake Layer 2 - Chocolate Sponge */}
      <mesh position={[0, height * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, height * 0.3, 64]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Cake Layer 3 - Vanilla Sponge */}
      <mesh position={[0, height * 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, height * 0.3, 64]} />
        <meshStandardMaterial
          color="#F5E6D3"
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Frosting Side - Cream Cheese Frosting */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, height * 0.05, 64]} />
        <meshStandardMaterial
          color="#FFF8DC"
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Frosting Top - Detailed with texture */}
      <mesh position={[0, height + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 1.05, 64]} />
        <meshStandardMaterial
          color="#FFF8DC"
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>

      {/* Frosting Border - Piped decoration */}
      <mesh position={[0, height + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[radius * 0.9, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#FFF8DC"
          roughness={0.5}
          metalness={0.0}
        />
      </mesh>

      {/* Cake Plate - Removed as requested */}
    </group>
  )
}

// Realistic Topping Emitter with authentic distribution
function RealisticToppingEmitter({
  toppingType = 'sprinkles',
  distribution = 'full', // 'full', 'border', 'center', 'scattered'
  cakeRadius = 2,
  cakeHeight = 1.2,
  orderId = '67'
}) {
  const { viewport, camera, scene } = useThree()
  const instRef = useRef()
  const meshGeom = useMemo(() => createToppingGeometry(toppingType), [toppingType])
  const material = useMemo(() => createToppingMaterial(toppingType), [toppingType])

  // Maximum toppings stored
  const MAX = 500
  // State arrays for instance transforms
  const stateRef = useRef(
    new Array(MAX).fill(0).map(() => ({
      active: false,
      pos: new THREE.Vector3(),
      rot: new THREE.Euler(),
      scale: 1,
      colorIndex: 0
    }))
  )

  // Pool pointer for instancedMesh indexing
  const poolIndex = useRef(0)
  const tmpMatrix = new THREE.Matrix4()

  // Generate realistic topping positions
  const generateToppingPositions = (toppingType, distribution, radius, count) => {
    const positions = []
    const config = REALISTIC_TOPPINGS[toppingType]

    switch (distribution) {
      case 'full':
        // Full cake coverage with realistic density
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.sqrt(Math.random()) * radius * 0.85
          const x = Math.cos(angle) * distance
          const z = Math.sin(angle) * distance
          const y = cakeHeight + 0.05 + rand(-0.01, 0.01)
          positions.push({
            x, y, z,
            angle: rand(0, Math.PI * 2),
            colorIndex: Math.floor(Math.random() * config.colors.length)
          })
        }
        break

      case 'border':
        // Border arrangement
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const x = Math.cos(angle) * radius * 0.75
          const z = Math.sin(angle) * radius * 0.75
          const y = cakeHeight + 0.05
          positions.push({
            x, y, z,
            angle: rand(0, Math.PI * 2),
            colorIndex: Math.floor(Math.random() * config.colors.length)
          })
        }
        break

      case 'center':
        // Center arrangement
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const distance = Math.random() * radius * 0.4
          const x = Math.cos(angle) * distance
          const z = Math.sin(angle) * distance
          const y = cakeHeight + 0.05
          positions.push({
            x, y, z,
            angle: rand(0, Math.PI * 2),
            colorIndex: Math.floor(Math.random() * config.colors.length)
          })
        }
        break

      case 'scattered':
        // Random scattered arrangement
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * radius * 0.8
          const x = Math.cos(angle) * distance
          const z = Math.sin(angle) * distance
          const y = cakeHeight + 0.05 + rand(-0.01, 0.01)
          positions.push({
            x, y, z,
            angle: rand(0, Math.PI * 2),
            colorIndex: Math.floor(Math.random() * config.colors.length)
          })
        }
        break
    }

    return positions
  }

  // Initialize toppings based on type and distribution
  useEffect(() => {
    const config = REALISTIC_TOPPINGS[toppingType]
    console.log('🌸 RealisticCakeToppings: Initializing', toppingType, 'with config:', config);
    const positions = generateToppingPositions(toppingType, distribution, cakeRadius, config.count)
    console.log('🌸 Generated positions:', positions.length, 'for', toppingType);

    positions.forEach((pos, i) => {
      if (i < MAX) {
        const s = stateRef.current[i]
        s.active = true
        s.pos.set(pos.x, pos.y, pos.z)
        s.rot.set(rand(0, Math.PI), pos.angle, rand(0, Math.PI))
        s.scale = rand(0.8, 1.2)
        s.colorIndex = pos.colorIndex
      }
    })
  }, [toppingType, distribution, cakeRadius, cakeHeight])

  // Animation update
  useFrame((state, dt) => {
    const inst = instRef.current
    if (!inst) return

    for (let i = 0; i < MAX; i++) {
      const s = stateRef.current[i]
      if (!s.active) continue

      // Gentle movement for realistic effect
      if (toppingType === 'sprinkles') {
        s.rot.y += 0.01 * dt
      } else if (toppingType === 'coconut') {
        s.rot.z += Math.sin(state.clock.elapsedTime + i * 0.1) * 0.005 * dt
      }

      // Update instance matrix
      tmpMatrix.compose(s.pos, new THREE.Quaternion().setFromEuler(s.rot), new THREE.Vector3(s.scale, s.scale, s.scale))
      inst.setMatrixAt(i, tmpMatrix)
    }

    inst.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={instRef} args={[meshGeom, material, MAX]} castShadow receiveShadow>
        {/* enable instanceColor attribute */}
      </instancedMesh>

      {/* Invisible full-screen div to capture pointer events */}
      <Html fullscreen>
        <div id="topping-canvas-overlay" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
          {/* Order Information */}
          <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Order #{orderId}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {distribution === 'full' ? 'Full Topping Coverage' :
                distribution === 'border' ? 'Border Topping Arrangement' :
                  distribution === 'center' ? 'Center Topping Design' : 'Scattered Topping Style'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {toppingType.replace('_', ' ')} toppings
            </div>
          </div>
        </div>
      </Html>
    </>
  )
}

export default function RealisticCakeToppingsApp({
  toppingType = 'sprinkles',
  distribution = 'full',
  orderId = 'SB202509190067'
}) {
  console.log('🌸 RealisticCakeToppingsApp: Received props:', { toppingType, distribution, orderId });

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas shadows camera={{ position: [0, 3, 6], fov: 50 }}>
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
          <Cake />
          <RealisticToppingEmitter
            toppingType={toppingType}
            distribution={distribution}
            cakeRadius={2}
            cakeHeight={1.2}
            orderId={orderId.split('#').pop ? orderId.split('#').pop() : orderId}
          />
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#e6e6e6" />
        </mesh>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

/*
Realistic Topping Types:
- sprinkles: Colorful small cylinders (200 count)
- chocolate_chips: Brown spheres (80 count)
- nuts: Oval brown shapes (60 count)
- berries: Colorful spheres (40 count)
- coconut: White flakes (120 count)
- flowers: Decorative flowers (25 count)

Distribution Options:
- 'full': Complete cake surface coverage
- 'border': Elegant border arrangement
- 'center': Center design
- 'scattered': Random scattered style
*/
