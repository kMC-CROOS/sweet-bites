// CakeNutsEmitter.jsx
// React component (single-file) using @react-three/fiber and @react-three/drei
// Install:
// npm install three @react-three/fiber @react-three/drei
// Usage: import CakeNutsEmitter from './CakeNutsEmitter.jsx' and render inside your React app.

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// Helper: random between
const rand = (a, b) => a + Math.random() * (b - a)

// Nut geometry/material (you can replace with a loaded model)
function createNutGeometry() {
  const geom = new THREE.SphereGeometry(0.12, 10, 10)
  // squash to make it slightly nut-like
  geom.scale(1, 0.8, 1)
  return geom
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

// Instanced Nuts emitter & simple physics
function NutsEmitter({ cakeRadius = 2, cakeHeight = 1.2, orderId = '67' }) {
  const { viewport, camera, scene } = useThree()
  const instRef = useRef()
  const meshGeom = useMemo(() => createNutGeometry(), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6B3E26' }), [])

  // maximum nuts stored
  const MAX = 800
  // state arrays for instance transforms and velocities
  const stateRef = useRef(
    new Array(MAX).fill(0).map(() => ({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler(), scale: 1 }))
  )

  // pool pointer for instancedMesh indexing
  const poolIndex = useRef(0)

  // create matrix temp
  const tmpMatrix = new THREE.Matrix4()

  // spawn function: screenPos is normalized device coords x,y from -1..1, and count
  const spawnNut = (screenX, screenY, count = 1) => {
    // convert NDC to world point near camera
    const vec = new THREE.Vector3(screenX, screenY, 0.5).unproject(camera)
    for (let i = 0; i < count; i++) {
      const idx = poolIndex.current % MAX
      const s = stateRef.current[idx]
      // spawn above camera ray with some random offset
      s.active = true
      s.pos.set(vec.x + rand(-0.3, 0.3), vec.y + rand(1.2, 2.2), vec.z + rand(-0.3, 0.3))
      s.vel.set(rand(-0.2, 0.2), rand(-1.8, -0.8), rand(-0.2, 0.2))
      s.rot.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
      s.scale = rand(0.8, 1.2)
      poolIndex.current++
    }
  }

  // Raycaster for checking cake collision
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // On each frame, update positions and instance matrices
  useFrame((state, dt) => {
    const inst = instRef.current
    if (!inst) return
    let any = false
    for (let i = 0; i < MAX; i++) {
      const s = stateRef.current[i]
      if (!s.active) continue
      any = true
      // simple gravity
      s.vel.y += -9.8 * dt * 0.6 // gravity scale
      s.pos.addScaledVector(s.vel, dt)
      s.rot.x += s.vel.y * 0.2 * dt
      s.rot.y += 0.6 * dt

      // If below certain threshold (far under cake) deactivate
      if (s.pos.y < -3) {
        s.active = false
        continue
      }

      // Check collision with cake top using raycast down from nut; we want top surface at y = cakeHeight + small
      // We'll raycast down and see if hit cake.
      raycaster.set(s.pos.clone(), new THREE.Vector3(0, -1, 0))
      const intersects = raycaster.intersectObjects(scene.children, true)
      let placed = false
      for (let inter of intersects) {
        // crude: if intersected object is cake top (circle at y ~ cakeHeight)
        if (Math.abs(inter.point.y - (cakeHeight + 0.01)) < 0.25 && inter.point.distanceTo(s.pos) < 3) {
          // place nut on the surface and make it stick
          s.pos.copy(inter.point)
          // project small normal offset so it doesn't clip
          s.pos.add(inter.face.normal.clone().multiplyScalar(0.02))
          // zero velocity to stick
          s.vel.set(0, 0, 0)
          // slight random rotation
          s.rot.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
          // mark inactive in physics but keep visible
          s.active = 'stuck'
          placed = true
          break
        }
      }

      // write instance transform
      tmpMatrix.compose(s.pos, new THREE.Quaternion().setFromEuler(s.rot), new THREE.Vector3(s.scale, s.scale, s.scale))
      inst.setMatrixAt(i, tmpMatrix)
      // simple color variation by stuck vs falling
      if (s.active === 'stuck') {
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

  // Expose spawn via pointer events on the canvas overlay
  const spawnFromPointer = (e, density = 6) => {
    const { clientX, clientY } = e
    const { left, top, width, height } = (e.target && e.target.getBoundingClientRect && e.target.getBoundingClientRect()) || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const x = ((clientX - left) / width) * 2 - 1
    const y = -((clientY - top) / height) * 2 + 1
    spawnNut(x, y, density)
  }

  // UI overlay to handle pointer and hold for continuous rain
  useEffect(() => {
    let canvasEl = document.querySelector('#nuts-canvas-overlay')
    if (!canvasEl) return
    let pressing = false
    let rafId
    const step = (e) => {
      if (!pressing) return
      spawnFromPointer(e, 4) // continuous small bursts
      rafId = requestAnimationFrame(() => {})
    }
    const onDown = (ev) => { pressing = true; spawnFromPointer(ev, 12) }
    const onMove = (ev) => { if (pressing) spawnFromPointer(ev, 4) }
    const onUp = (ev) => { pressing = false }
    canvasEl.addEventListener('pointerdown', onDown)
    canvasEl.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      canvasEl.removeEventListener('pointerdown', onDown)
      canvasEl.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <instancedMesh ref={instRef} args={[meshGeom, material, MAX]} castShadow receiveShadow>
        {/* enable instanceColor attribute */}
      </instancedMesh>
      {/* Invisible full-screen div to capture pointer events */}
      <Html fullscreen>
        <div id="nuts-canvas-overlay" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
          {/* Order Information */}
          <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Order #{orderId}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Click and drag to add nuts to your cake</div>
          </div>
        </div>
      </Html>
    </>
  )
}

export default function CakeNutsEmitterApp({ orderId = 'SB202509190067' }) {
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
          <NutsEmitter cakeRadius={2} cakeHeight={1.2} orderId={orderId.split('#').pop ? orderId.split('#').pop() : orderId} />
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
Notes & customization tips:
- This implementation uses a simple non-physics approach: nuts "fall" with a velocity vector and snap to the cake top when a downward raycast hits the cake surface.
- For more realistic collisions and rolling, integrate a physics engine (e.g., @react-three/rapier or use-cannon).
- Replace createNutGeometry() with a loaded GLTF nut model for higher fidelity.
- Adjust spawn density, gravity, and sizes near the top of the file.
- Performance: uses instancedMesh for many nuts. MAX (800) can be tuned down/up depending on device.
- To wire this into your UI: call the spawnNut function (expose via context or ref) when the user selects 'Nuts' and clicks/drags on the cake image area.
*/
