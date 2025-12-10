// FlowerCakeDecorator.jsx
// Realistic flower decoration system for full cake coverage
import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// Helper: random between
const rand = (a, b) => a + Math.random() * (b - a)

// Flower types with realistic colors and sizes
const FLOWER_TYPES = {
  rose: { color: '#FF69B4', size: 0.15, petals: 5 },
  daisy: { color: '#FFFFFF', size: 0.12, petals: 8 },
  sunflower: { color: '#FFD700', size: 0.18, petals: 12 },
  lavender: { color: '#E6E6FA', size: 0.08, petals: 4 },
  tulip: { color: '#FF6347', size: 0.14, petals: 6 },
  orchid: { color: '#DA70D6', size: 0.16, petals: 3 }
}

// Create realistic flower geometry
function createFlowerGeometry(flowerType) {
  const config = FLOWER_TYPES[flowerType]
  const group = new THREE.Group()
  
  // Create petals
  for (let i = 0; i < config.petals; i++) {
    const petal = new THREE.SphereGeometry(config.size * 0.6, 8, 6)
    petal.scale(1, 0.3, 0.8)
    petal.rotateZ((i / config.petals) * Math.PI * 2)
    petal.rotateX(Math.PI * 0.1)
    
    const mesh = new THREE.Mesh(petal)
    mesh.position.set(
      Math.cos((i / config.petals) * Math.PI * 2) * config.size * 0.3,
      config.size * 0.1,
      Math.sin((i / config.petals) * Math.PI * 2) * config.size * 0.3
    )
    group.add(mesh)
  }
  
  // Create center
  const center = new THREE.SphereGeometry(config.size * 0.3, 8, 8)
  const centerMesh = new THREE.Mesh(center)
  centerMesh.position.y = config.size * 0.1
  group.add(centerMesh)
  
  return group
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
      
      {/* Cake Plate */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.1, 64]} />
        <meshStandardMaterial 
          color="#F0F0F0" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

// Flower Decorator with full cake coverage
function FlowerDecorator({ 
  flowerType = 'rose',
  coverage = 'full', // 'full', 'border', 'center', 'scattered'
  cakeRadius = 2, 
  cakeHeight = 1.2, 
  orderId = '67' 
}) {
  const { viewport, camera, scene } = useThree()
  const instRef = useRef()
  const meshGeom = useMemo(() => createFlowerGeometry(flowerType), [flowerType])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: FLOWER_TYPES[flowerType].color,
    roughness: 0.7,
    metalness: 0.0
  }), [flowerType])

  // Maximum flowers stored
  const MAX = 500
  // State arrays for instance transforms
  const stateRef = useRef(
    new Array(MAX).fill(0).map(() => ({ 
      active: false, 
      pos: new THREE.Vector3(), 
      rot: new THREE.Euler(), 
      scale: 1,
      flowerType: flowerType
    }))
  )

  // Pool pointer for instancedMesh indexing
  const poolIndex = useRef(0)
  const tmpMatrix = new THREE.Matrix4()

  // Generate flower positions based on coverage type
  const generateFlowerPositions = (coverage, radius, count) => {
    const positions = []
    
    switch (coverage) {
      case 'full':
        // Full cake coverage with realistic flower arrangement
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const distance = Math.sqrt(Math.random()) * radius * 0.8
          const x = Math.cos(angle) * distance
          const z = Math.sin(angle) * distance
          const y = cakeHeight + 0.05 + rand(-0.02, 0.02)
          positions.push({ x, y, z, angle: rand(0, Math.PI * 2) })
        }
        break
        
      case 'border':
        // Border arrangement
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const x = Math.cos(angle) * radius * 0.7
          const z = Math.sin(angle) * radius * 0.7
          const y = cakeHeight + 0.05
          positions.push({ x, y, z, angle: rand(0, Math.PI * 2) })
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
          positions.push({ x, y, z, angle: rand(0, Math.PI * 2) })
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
          positions.push({ x, y, z, angle: rand(0, Math.PI * 2) })
        }
        break
    }
    
    return positions
  }

  // Initialize flowers based on coverage
  useEffect(() => {
    const flowerCount = coverage === 'full' ? 120 : coverage === 'border' ? 40 : coverage === 'center' ? 20 : 60
    const positions = generateFlowerPositions(coverage, cakeRadius, flowerCount)
    
    positions.forEach((pos, i) => {
      if (i < MAX) {
        const s = stateRef.current[i]
        s.active = true
        s.pos.set(pos.x, pos.y, pos.z)
        s.rot.set(rand(0, Math.PI), pos.angle, rand(0, Math.PI))
        s.scale = rand(0.8, 1.2)
        s.flowerType = flowerType
      }
    })
  }, [coverage, flowerType, cakeRadius, cakeHeight])

  // Animation update
  useFrame((state, dt) => {
    const inst = instRef.current
    if (!inst) return

    for (let i = 0; i < MAX; i++) {
      const s = stateRef.current[i]
      if (!s.active) continue

      // Gentle swaying animation
      s.rot.y += Math.sin(state.clock.elapsedTime + i * 0.1) * 0.01 * dt
      s.rot.z += Math.cos(state.clock.elapsedTime + i * 0.15) * 0.005 * dt
      
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
        <div id="flower-canvas-overlay" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
          {/* Order Information */}
          <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Order #{orderId}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {coverage === 'full' ? 'Full Flower Coverage' : 
               coverage === 'border' ? 'Border Flower Arrangement' :
               coverage === 'center' ? 'Center Flower Bouquet' : 'Scattered Flower Design'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {FLOWER_TYPES[flowerType].color} {flowerType} flowers
            </div>
          </div>
        </div>
      </Html>
    </>
  )
}

export default function FlowerCakeDecoratorApp({ 
  flowerType = 'rose',
  coverage = 'full',
  orderId = 'SB202509190067' 
}) {
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
          <FlowerDecorator 
            flowerType={flowerType}
            coverage={coverage}
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
Flower Coverage Options:
- 'full': Complete cake surface coverage with 120+ flowers
- 'border': Elegant border arrangement with 40 flowers
- 'center': Center bouquet with 20 flowers
- 'scattered': Random scattered design with 60 flowers

Flower Types Available:
- rose: Pink roses (#FF69B4)
- daisy: White daisies (#FFFFFF)
- sunflower: Yellow sunflowers (#FFD700)
- lavender: Purple lavender (#E6E6FA)
- tulip: Orange tulips (#FF6347)
- orchid: Purple orchids (#DA70D6)
*/

