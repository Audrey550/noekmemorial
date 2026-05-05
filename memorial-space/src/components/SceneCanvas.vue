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
  scene.fog = new THREE.Fog('#ececec', 22, 64)

  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 120)
  camera.position.set(17, 13, 17)

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
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controls.minDistance = 12
  controls.maxDistance = 30
  controls.minPolarAngle = 0.72
  controls.maxPolarAngle = 1.02
  controls.minAzimuthAngle = -Math.PI / 1.35
  controls.maxAzimuthAngle = -Math.PI / 3.2
  controls.target.set(0, 2.1, 0)
  controls.update()

  const worldGrid = new THREE.GridHelper(84, 42, '#bdbdbd', '#cfcfcf')
  worldGrid.position.y = -0.04
  worldGrid.rotation.y = Math.PI / 4
  worldGrid.material.transparent = true
  worldGrid.material.opacity = 1
  scene.add(worldGrid)

  const room = new THREE.Group()
  room.position.y = 0.62

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshStandardMaterial({
      color: '#838991',
      roughness: 0.84,
      metalness: 0,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  room.add(floor)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#f2afc7',
    roughness: 0.88,
    metalness: 0.02,
  })

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.8), wallMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-4.5, 2.4, 0)
  leftWall.receiveShadow = true
  room.add(leftWall)

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.8), wallMaterial)
  backWall.position.set(0, 2.4, -4.5)
  backWall.receiveShadow = true
  room.add(backWall)

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: '#f6e9f0',
    roughness: 0.7,
  })

  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 8.7), trimMaterial)
  leftTrim.position.set(-4.4, 0.1, 0)
  room.add(leftTrim)

  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.2, 0.2), trimMaterial)
  backTrim.position.set(0, 0.1, -4.4)
  room.add(backTrim)

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.15, 2),
    new THREE.MeshStandardMaterial({
      color: '#ef4b9a',
      roughness: 0.95,
    }),
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0.2, 0.03, 0.9)
  room.add(rug)

  const sofaMaterial = new THREE.MeshStandardMaterial({
    color: '#63ced0',
    roughness: 0.75,
  })

  const leftSofa = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 1.1), sofaMaterial)
  leftSofa.position.set(-2.75, 0.5, 0.6)
  leftSofa.castShadow = true
  leftSofa.receiveShadow = true
  room.add(leftSofa)

  const rightSofa = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1, 1.1), sofaMaterial)
  rightSofa.position.set(2.6, 0.5, 0.5)
  rightSofa.castShadow = true
  rightSofa.receiveShadow = true
  room.add(rightSofa)

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.16, 1.15),
    new THREE.MeshStandardMaterial({
      color: '#f7d4b9',
      roughness: 0.8,
    }),
  )
  desk.position.set(1.35, 1.12, -2.85)
  desk.castShadow = true
  desk.receiveShadow = true
  room.add(desk)

  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 3.2, 1),
    new THREE.MeshStandardMaterial({
      color: '#f6e8dc',
      roughness: 0.92,
    }),
  )
  shelf.position.set(0.15, 1.6, -3.65)
  shelf.castShadow = true
  shelf.receiveShadow = true
  room.add(shelf)

  const chair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.64, 0.9, 28),
    new THREE.MeshStandardMaterial({
      color: '#ec79ae',
      roughness: 0.78,
    }),
  )
  chair.position.set(1.78, 0.45, -1.92)
  chair.castShadow = true
  chair.receiveShadow = true
  room.add(chair)

  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.58, 0.07),
    new THREE.MeshStandardMaterial({
      color: '#2ec0c5',
      emissive: '#15485f',
      emissiveIntensity: 0.23,
      roughness: 0.45,
    }),
  )
  monitor.position.set(1.55, 1.55, -2.85)
  monitor.castShadow = true
  room.add(monitor)

  const plant = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.88, 10),
    new THREE.MeshStandardMaterial({
      color: '#31bc77',
      roughness: 0.8,
    }),
  )
  plant.position.set(0.62, 1.64, -2.45)
  plant.castShadow = true
  room.add(plant)

  const roomShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 9.4),
    new THREE.ShadowMaterial({ opacity: 0.22 }),
  )
  roomShadow.rotation.x = -Math.PI / 2
  roomShadow.position.y = -0.01
  room.add(roomShadow)

  scene.add(room)

  const ambientLight = new THREE.AmbientLight('#ffffff', 1.35)
  scene.add(ambientLight)

  const hemisphereLight = new THREE.HemisphereLight('#fff4fa', '#aeb4bf', 1.55)
  hemisphereLight.position.set(0, 14, 0)
  scene.add(hemisphereLight)

  const keyLight = new THREE.DirectionalLight('#fff5fb', 1.6)
  keyLight.position.set(8, 14, 9)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 40
  keyLight.shadow.camera.left = -18
  keyLight.shadow.camera.right = 18
  keyLight.shadow.camera.top = 18
  keyLight.shadow.camera.bottom = -18
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight('#f6c7db', 1.1)
  rimLight.position.set(-9, 8, -10)
  scene.add(rimLight)

  const fillLight = new THREE.PointLight('#f5d5e8', 0.85, 20, 2)
  fillLight.position.set(1.6, 4.6, -2)
  scene.add(fillLight)

  const lightPulse = () => {
    const time = performance.now() * 0.001
    fillLight.intensity = 0.82 + Math.sin(time * 0.9) * 0.08
    chair.rotation.y = Math.sin(time * 0.42) * 0.06
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
  <main class="editor-shell">
    <header class="top-bar">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true"></div>
        <span>BRAND</span>
      </div>

      <div class="profile-area">
        <span>Naam</span>
        <button type="button" class="icon-button" aria-label="Edit profile">Edit</button>
        <button type="button" class="avatar" aria-label="Open profile"></button>
      </div>
    </header>

    <section class="scene-stage">
      <canvas ref="canvasRef" class="scene-canvas" aria-label="Memorial space 3D scene"></canvas>

      <nav class="action-dock" aria-label="Quick actions">
        <button type="button" class="dock-button">
          <span class="dock-icon">+</span>
          <span class="dock-label">Media</span>
        </button>
        <button type="button" class="dock-button">
          <span class="dock-icon">Msg</span>
          <span class="dock-label">Berichten</span>
        </button>
        <button type="button" class="dock-button">
          <span class="dock-icon">Fam</span>
          <span class="dock-label">Kaarsje</span>
        </button>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.editor-shell {
  height: 100vh;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #101010;
  background: rgba(255, 255, 255, 0.62);
  border-bottom: 1px solid #d8d8d8;
  backdrop-filter: blur(12px);
  padding: 18px 38px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border: 5px solid #080808;
  transform: rotate(45deg);
  position: relative;
}

.brand-mark::before,
.brand-mark::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
}

.brand-mark::before {
  inset: 6px 14px;
}

.brand-mark::after {
  inset: 14px 6px;
}

.profile-area {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  font-size: 28px;
}

.icon-button {
  border: none;
  background: transparent;
  color: #101010;
  font-size: 18px;
  font-weight: 600;
  padding: 4px 8px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid #d1d1d1;
  background: radial-gradient(circle at 50% 26%, #0e0e0e 0 18%, transparent 19%),
    radial-gradient(circle at 50% 75%, #0e0e0e 0 28%, transparent 29%),
    #dcdcdc;
}

.scene-stage {
  flex: 1;
  min-height: 0;
  position: relative;
  background: transparent;
  overflow: hidden;
}

.scene-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.action-dock {
  position: absolute;
  left: 20px;
  bottom: 16px;
  display: flex;
  gap: 12px;
}

.dock-button {
  width: 98px;
  height: 84px;
  border: 1px solid #dfdfdf;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.74);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dock-icon {
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 1;
  color: #050505;
}

.dock-label {
  font-size: 12px;
  color: #6f6f6f;
}

@media (max-width: 960px) {
  .editor-shell {
    padding: 0;
  }

  .top-bar {
    padding: 12px 16px;
  }

  .brand-lockup {
    font-size: 22px;
  }

  .profile-area {
    font-size: 20px;
  }

  .action-dock {
    left: 12px;
    right: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .dock-button {
    width: 92px;
    height: 76px;
  }

  .dock-icon {
    font-size: 24px;
  }
}
</style>