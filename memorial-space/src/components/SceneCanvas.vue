<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvasRef = ref(null)

let animationFrameId = 0
let resizeObserver = null
let renderer = null
let controls = null

onMounted(() => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#f2ece4')
  scene.fog = new THREE.Fog('#f2ece4', 12, 28)

  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100)
  camera.position.set(6.6, 4.4, 8.8)

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = true
  controls.minDistance = 5.5
  controls.maxDistance = 16
  controls.maxPolarAngle = Math.PI / 2.05
  controls.target.set(0, 1.1, 0)
  controls.update()

  const room = new THREE.Group()

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({
      color: '#ddd0c3',
      roughness: 0.95,
      metalness: 0,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  room.add(floor)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#f7f2eb',
    roughness: 1,
    metalness: 0,
  })

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.5), wallMaterial)
  backWall.position.set(0, 3.25, -7)
  backWall.receiveShadow = true
  room.add(backWall)

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.5), wallMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-7, 3.25, 0)
  room.add(leftWall)

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.5), wallMaterial)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.set(7, 3.25, 0)
  room.add(rightWall)

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), wallMaterial)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = 6.5
  room.add(ceiling)

  const wallTrimMaterial = new THREE.MeshStandardMaterial({
    color: '#d9c8bb',
    roughness: 0.9,
  })

  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.08, 0.14), wallTrimMaterial)
  baseTrim.position.set(0, 0.04, -6.94)
  room.add(baseTrim)

  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 13.6), wallTrimMaterial)
  leftTrim.position.set(-6.94, 0.04, 0)
  room.add(leftTrim)

  const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 13.6), wallTrimMaterial)
  rightTrim.position.set(6.94, 0.04, 0)
  room.add(rightTrim)

  const backPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 2.6),
    new THREE.MeshStandardMaterial({
      color: '#efe7dc',
      roughness: 0.9,
      metalness: 0,
    }),
  )
  backPanel.position.set(0, 2.2, -6.88)
  room.add(backPanel)

  const focusGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    new THREE.MeshStandardMaterial({
      color: '#f7c96d',
      emissive: '#ffbb55',
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0,
    }),
  )
  focusGlow.position.set(0, 1.55, 0)
  focusGlow.castShadow = true
  room.add(focusGlow)

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.1, 1.1),
    new THREE.MeshStandardMaterial({
      color: '#c7b8ab',
      roughness: 0.85,
      metalness: 0,
    }),
  )
  pedestal.position.set(0, 0.55, 0)
  pedestal.castShadow = true
  pedestal.receiveShadow = true
  room.add(pedestal)

  const sideBlockMaterial = new THREE.MeshStandardMaterial({
    color: '#b8a69a',
    roughness: 0.9,
  })

  const leftBlock = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), sideBlockMaterial)
  leftBlock.position.set(-2.4, 0.25, -0.8)
  leftBlock.castShadow = true
  leftBlock.receiveShadow = true
  room.add(leftBlock)

  const rightBlock = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), sideBlockMaterial)
  rightBlock.position.set(2.2, 0.25, 1)
  rightBlock.castShadow = true
  rightBlock.receiveShadow = true
  room.add(rightBlock)

  const framedStone = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.2, 0.2),
    new THREE.MeshStandardMaterial({
      color: '#c5b6aa',
      roughness: 0.9,
    }),
  )
  framedStone.position.set(0, 1.55, -5.8)
  framedStone.castShadow = true
  room.add(framedStone)

  scene.add(room)

  const ambientLight = new THREE.AmbientLight('#fff8f0', 1.8)
  scene.add(ambientLight)

  const hemisphereLight = new THREE.HemisphereLight('#fff8f0', '#ceb8a0', 2.2)
  hemisphereLight.position.set(0, 8, 0)
  scene.add(hemisphereLight)

  const keyLight = new THREE.DirectionalLight('#fff7e9', 2.7)
  keyLight.position.set(6, 9, 6)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 25
  keyLight.shadow.camera.left = -10
  keyLight.shadow.camera.right = 10
  keyLight.shadow.camera.top = 10
  keyLight.shadow.camera.bottom = -10
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight('#ffe9d4', 1.2)
  rimLight.position.set(-4, 4, -5)
  scene.add(rimLight)

  const fillLight = new THREE.PointLight('#ffd9a0', 1.5, 18, 2)
  fillLight.position.set(0, 3.8, 1.8)
  scene.add(fillLight)

  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 48),
    new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.12,
    }),
  )
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.position.set(0, 0.02, 0)
  room.add(shadowPlane)

  const lightPulse = () => {
    const time = performance.now() * 0.001
    focusGlow.material.emissiveIntensity = 1.35 + Math.sin(time * 2.1) * 0.12
    fillLight.intensity = 1.4 + Math.sin(time * 1.6) * 0.08
    room.rotation.y = Math.sin(time * 0.12) * 0.04
  }

  const resize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (width === 0 || height === 0) {
      return
    }

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  const animate = () => {
    animationFrameId = window.requestAnimationFrame(animate)
    lightPulse()
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId)

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }
})
</script>

<template>
  <main class="workspace-shell">
    <aside class="sidebar">
      <p class="eyebrow">Week 1</p>
      <h1>Memorial Space</h1>
      <p class="intro">
        The first working editor surface is now live: Vue 3 is wired up and the Three.js room,
        camera, lighting, and floor are rendered in the browser.
      </p>

      <section class="status-card">
        <p class="status-label">Done today</p>
        <ul>
          <li>Vue 3 + Vite scaffold</li>
          <li>Three.js scene mount</li>
          <li>OrbitControls camera</li>
          <li>Lighting and floor setup</li>
        </ul>
      </section>

      <section class="status-card accent">
        <p class="status-label">Next up</p>
        <p>Load a GLB asset, then add placement controls and selection.</p>
      </section>
    </aside>

    <section class="viewport">
      <div class="viewport-frame">
        <canvas ref="canvasRef" class="scene-canvas" aria-label="Memorial space 3D scene"></canvas>
      </div>

      <div class="hint-bar">
        <span>Drag to orbit</span>
        <span>Scroll to zoom</span>
        <span>Right click to pan</span>
      </div>
    </section>
  </main>
</template>