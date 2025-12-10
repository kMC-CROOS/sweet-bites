import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// Helper: random between
const rand = (a, b) => a + Math.random() * (b - a)

// Topping geometries for different types
function createToppingGeometry(type) {
  switch (type) {
    case 'nuts':
      const nutGeom = new THREE.SphereGeometry(0.12, 10, 10)
      nutGeom.scale(1, 0.8, 1) // squash to make it nut-like
      return nutGeom
    case 'flowers':
      const flowerGeom = new THREE.ConeGeometry(0.08, 0.15, 8)
      return flowerGeom
    case 'berries':
      const berryGeom = new THREE.SphereGeometry(0.06, 8, 8)
      return berryGeom
    case 'chocolate':
      const chipGeom = new THREE.BoxGeometry(0.08, 0.04, 0.08)
      return chipGeom
    case 'sprinkles':
      const sprinkleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6)
      return sprinkleGeom
    default:
      return new THREE.SphereGeometry(0.1, 8, 8)
  }
}

// Topping materials for different types
function createToppingMaterial(type) {
  switch (type) {
    case 'nuts':
      return new THREE.MeshStandardMaterial({ color: '#6B3E26' })
    case 'flowers':
      return new THREE.MeshStandardMaterial({ color: '#FF69B4' })
    case 'berries':
      return new THREE.MeshStandardMaterial({ color: '#DC143C' })
    case 'chocolate':
      return new THREE.MeshStandardMaterial({ color: '#8B4513' })
    case 'sprinkles':
      return new THREE.MeshStandardMaterial({ color: '#FFD700' })
    default:
      return new THREE.MeshStandardMaterial({ color: '#8B4513' })
  }
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

// Generic Topping Emitter with both modes
function ToppingEmitter({ 
  toppingType = 'nuts', 
  mode = 'sprinkle', // 'sprinkle' or 'place'
  cakeRadius = 2, 
  cakeHeight = 1.2, 
  orderId = '67' 
}) {
  const { viewport, camera, scene } = useThree()
  const instRef = useRef()
  const meshGeom = useMemo(() => createToppingGeometry(toppingType), [toppingType])
  const material = useMemo(() => createToppingMaterial(toppingType), [toppingType])

  // Maximum toppings stored
  const MAX = 1000
  // State arrays for instance transforms and velocities
  const stateRef = useRef(
    new Array(MAX).fill(0).map(() => ({ 
      active: false, 
      pos: new THREE.Vector3(), 
      vel: new THREE.Vector3(), 
      rot: new THREE.Euler(), 
      scale: 1,
      mode: 'falling' // 'falling', 'placed', 'stuck'
    }))
  )

  // Pool pointer for instancedMesh indexing
  const poolIndex = useRef(0)
  const tmpMatrix = new THREE.Matrix4()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // Spawn function for sprinkle mode
  const spawnTopping = (screenX, screenY, count = 1) => {
    const vec = new THREE.Vector3(screenX, screenY, 0.5).unproject(camera)
    for (let i = 0; i < count; i++) {
      const idx = poolIndex.current % MAX
      const s = stateRef.current[idx]
      s.active = true
      s.mode = 'falling'
      s.pos.set(vec.x + rand(-0.3, 0.3), vec.y + rand(1.2, 2.2), vec.z + rand(-0.3, 0.3))
      s.vel.set(rand(-0.2, 0.2), rand(-1.8, -0.8), rand(-0.2, 0.2))
      s.rot.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
      s.scale = rand(0.8, 1.2)
      poolIndex.current++
    }
  }

  // Place function for click-to-place mode
  const placeTopping = (worldPos) => {
    const idx = poolIndex.current % MAX
    const s = stateRef.current[idx]
    s.active = true
    s.mode = 'placed'
    s.pos.copy(worldPos)
    s.vel.set(0, 0, 0)
    s.rot.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
    s.scale = rand(0.9, 1.1)
    poolIndex.current++
  }

  // Physics update
  useFrame((state, dt) => {
    const inst = instRef.current
    if (!inst) return
    let any = false
    for (let i = 0; i < MAX; i++) {
      const s = stateRef.current[i]
      if (!s.active) continue
      any = true

      if (s.mode === 'falling') {
        // Apply gravity
        s.vel.y += -9.8 * dt * 0.6
        s.pos.addScaledVector(s.vel, dt)
        s.rot.x += s.vel.y * 0.2 * dt
        s.rot.y += 0.6 * dt

        // Check if below threshold
        if (s.pos.y < -3) {
          s.active = false
          continue
        }

        // Check collision with cake
        raycaster.set(s.pos.clone(), new THREE.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObjects(scene.children, true)
        for (let inter of intersects) {
          if (Math.abs(inter.point.y - (cakeHeight + 0.01)) < 0.25 && inter.point.distanceTo(s.pos) < 3) {
            s.pos.copy(inter.point)
            s.pos.add(inter.face.normal.clone().multiplyScalar(0.02))
            s.vel.set(0, 0, 0)
            s.rot.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
            s.mode = 'stuck'
            break
          }
        }
      }

      // Update instance transform
      tmpMatrix.compose(s.pos, new THREE.Quaternion().setFromEuler(s.rot), new THREE.Vector3(s.scale, s.scale, s.scale))
      inst.setMatrixAt(i, tmpMatrix)
      
      // Color variation based on state
      if (s.mode === 'stuck' || s.mode === 'placed') {
        inst.setColorAt(i, new THREE.Color('#8B5A2B'))
      } else {
        inst.setColorAt(i, new THREE.Color('#6B3E26'))
      }
    }
    if (any) {
      inst.instanceMatrix.needsUpdate = true
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    }
  })

  // Handle pointer events
  const handlePointerEvent = (e) => {
    if (mode === 'sprinkle') {
      const { clientX, clientY } = e
      const { left, top, width, height } = e.target.getBoundingClientRect()
      const x = ((clientX - left) / width) * 2 - 1
      const y = -((clientY - top) / height) * 2 + 1
      spawnTopping(x, y, 6)
    } else if (mode === 'place') {
      // Click to place mode
      const mouse = new THREE.Vector2(
        ((e.clientX - e.target.getBoundingClientRect().left) / e.target.getBoundingClientRect().width) * 2 - 1,
        -((e.clientY - e.target.getBoundingClientRect().top) / e.target.getBoundingClientRect().height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      if (intersects.length > 0) {
        const hit = intersects[0].point
        // Check if hit is on cake surface
        if (Math.abs(hit.y - (cakeHeight + 0.01)) < 0.5 && hit.distanceTo(new THREE.Vector3(0, cakeHeight, 0)) < cakeRadius) {
          placeTopping(hit)
        }
      }
    }
  }

  // Set up event listeners
  useEffect(() => {
    let canvasEl = document.querySelector('#topping-canvas-overlay')
    if (!canvasEl) return

    let pressing = false
    const onDown = (ev) => { 
      pressing = true
      if (mode === 'sprinkle') {
        handlePointerEvent(ev)
      } else {
        handlePointerEvent(ev)
      }
    }
    const onMove = (ev) => { 
      if (pressing && mode === 'sprinkle') {
        handlePointerEvent(ev)
      }
    }
    const onUp = (ev) => { pressing = false }

    canvasEl.addEventListener('pointerdown', onDown)
    canvasEl.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    
    return () => {
      canvasEl.removeEventListener('pointerdown', onDown)
      canvasEl.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [mode, toppingType])

  return (
    <>
      <instancedMesh ref={instRef} args={[meshGeom, material, MAX]} castShadow receiveShadow />
      <Html fullscreen>
        <div id="topping-canvas-overlay" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
          <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 12, minWidth: 200, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Order #{orderId}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
              {mode === 'sprinkle' ? 
                `Click and drag to sprinkle ${toppingType}` : 
                `Click to place ${toppingType} on cake`
              }
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              Mode: {mode === 'sprinkle' ? '🌧️ Sprinkle' : '📍 Place'}
            </div>
          </div>
        </div>
      </Html>
    </>
  )
}

// Main component
export default function GenericToppingEmitterApp({ 
  toppingType = 'nuts', 
  mode = 'sprinkle',
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
          <ToppingEmitter 
            toppingType={toppingType}
            mode={mode}
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
