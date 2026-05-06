<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import AssetPanel from './AssetPanel.vue'

const canvasRef = ref(null)
const username = ref('Naam')
const sceneObjects = ref([])
const showQuickPanel = ref(false)
const activePanel = ref('media')
const showFloor = ref(true)
const showProfileMenu = ref(false)
const hoveredPhoto = ref(null)
const hoveredPhotoPosition = ref({ x: 0, y: 0 })
const assetModels = ref([])

let animationFrameId = 0
let resizeObserver = null
let renderer = null
let controls = null
let scene = null
let room = null
let camera = null
let floorMesh = null
let roomShadow = null
let profileMenuElement = null
let gltfLoader = new GLTFLoader()
let photoTextureLoader = new THREE.TextureLoader()
let raycaster = new THREE.Raycaster()
let pointer = new THREE.Vector2()

// Available models for the asset panel
const availableAssets = [
  { id: 'candle', name: 'Kaars', icon: '🕯️', file: '/models/candle.glb' },
  { id: 'photo-frame', name: 'Fotolijst', icon: '🖼️', file: '/models/photo-frame.glb' },
  { id: 'flower', name: 'Bloem', icon: '🌹', file: '/models/flower.glb' },
]

const openQuickPanel = (panelType) => {
  if (activePanel.value === panelType && showQuickPanel.value) {
    showQuickPanel.value = false
    return
  }

  activePanel.value = panelType
  showQuickPanel.value = true
}

const closeQuickPanel = () => {
  showQuickPanel.value = false
}

const handlePlacePhoto = (photoData) => {
  if (!scene || !room) {
    return
  }

  placePhotoInRoom(photoData)
}

// Function to add an object to the scene
const addObjectToScene = async (assetId) => {
  const asset = availableAssets.find(a => a.id === assetId)
  if (!asset || !scene) return

  let model

  try {
    // Try to load GLB file
    const gltf = await gltfLoader.loadAsync(asset.file)
    model = gltf.scene.clone()
  } catch (error) {
    // Fallback: create placeholder models using Three.js primitives
    console.log(`Creating placeholder for ${asset.id}`)
    model = createPlaceholderModel(assetId)
  }
  
  // Default placement in center of room
  model.position.set(Math.random() * 2 - 1, 0.5, Math.random() * 2 - 1)
  model.scale.set(1, 1, 1)
  
  // Enable shadows
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  
  room.add(model)
  
  sceneObjects.value.push({
    id: Date.now(),
    assetId,
    object: model,
    position: model.position.clone(),
    rotation: model.rotation.clone(),
    scale: model.scale.clone(),
  })
}

const toggleFloorVisibility = () => {
  showFloor.value = !showFloor.value

  if (floorMesh) {
    floorMesh.visible = showFloor.value
  }

  if (roomShadow) {
    roomShadow.visible = showFloor.value
  }
}

const openProfileMenu = () => {
  showProfileMenu.value = true
}

const closeProfileMenu = () => {
  showProfileMenu.value = false
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleDocumentClick = (event) => {
  if (!showProfileMenu.value) {
    return
  }

  if (profileMenuElement && !profileMenuElement.contains(event.target)) {
    closeProfileMenu()
  }
}

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    closeProfileMenu()
  }
}

const clearHoveredPhoto = () => {
  hoveredPhoto.value = null
}

const getPhotoDataFromObject = (object) => {
  let currentObject = object

  while (currentObject) {
    if (currentObject.userData?.photoData) {
      return currentObject.userData.photoData
    }

    currentObject = currentObject.parent
  }

  return null
}

const handleCanvasPointerMove = (event) => {
  if (!renderer || !camera || !room) {
    return
  }

  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

  raycaster.setFromCamera(pointer, camera)
  const intersections = raycaster.intersectObjects(room.children, true)
  const hoveredIntersection = intersections.find(intersection => getPhotoDataFromObject(intersection.object))

  if (!hoveredIntersection) {
    clearHoveredPhoto()
    return
  }

  hoveredPhoto.value = getPhotoDataFromObject(hoveredIntersection.object)
  hoveredPhotoPosition.value = {
    x: event.clientX - rect.left + 16,
    y: event.clientY - rect.top + 16,
  }
}

const handleCanvasPointerLeave = () => {
  clearHoveredPhoto()
}

// Helper function to create placeholder models
const createPlaceholderModel = (assetId) => {
  const group = new THREE.Group()
  
  if (assetId === 'candle') {
    // Candle: cylinder with flame
    const waxColor = new THREE.MeshStandardMaterial({ color: '#ffeaa7', roughness: 0.8 })
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16), waxColor)
    wax.castShadow = true
    group.add(wax)
    
    const flameColor = new THREE.MeshStandardMaterial({
      color: '#ff6b00',
      emissive: '#ff9900',
      emissiveIntensity: 1,
    })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), flameColor)
    flame.position.y = 0.35
    flame.castShadow = true
    group.add(flame)
  } else if (assetId === 'photo-frame') {
    // Picture frame
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.7 })
    const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.08), frameMaterial)
    frameBorder.castShadow = true
    group.add(frameBorder)
    
    const pictureMaterial = new THREE.MeshStandardMaterial({ color: '#d4a574', roughness: 0.3 })
    const picture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.02), pictureMaterial)
    picture.position.z = 0.05
    picture.castShadow = true
    group.add(picture)
  } else if (assetId === 'flower') {
    // Flower
    const stemColor = new THREE.MeshStandardMaterial({ color: '#31bc77', roughness: 0.8 })
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), stemColor)
    stem.castShadow = true
    group.add(stem)
    
    const petalColor = new THREE.MeshStandardMaterial({ color: '#ff69b4', roughness: 0.9 })
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), petalColor)
    petal.position.y = 0.3
    petal.castShadow = true
    group.add(petal)
  }
  
  return group
}

const createPhotoCard = (photoData) => {
  const group = new THREE.Group()
  group.userData.photoData = photoData

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: '#f6f0ea',
    roughness: 0.7,
  })
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.08), frameMaterial)
  frame.castShadow = true
  frame.receiveShadow = true
  group.add(frame)

  const photoPlateMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.95,
  })
  const photoPlate = new THREE.Mesh(new THREE.BoxGeometry(1.54, 1.08, 0.04), photoPlateMaterial)
  photoPlate.position.z = 0.045
  group.add(photoPlate)

  const photoPlaneMaterial = new THREE.MeshStandardMaterial({
    color: '#d9d9d9',
    roughness: 0.9,
  })
  const photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.0), photoPlaneMaterial)
  photoPlane.position.z = 0.055
  group.add(photoPlane)

  photoTextureLoader.load(photoData.sourceUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    photoPlane.material.map = texture
    photoPlane.material.needsUpdate = true
  })

  const standMaterial = new THREE.MeshStandardMaterial({
    color: '#c7b8a6',
    roughness: 0.9,
  })
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.35), standMaterial)
  standBase.position.set(0, -0.8, 0.05)
  standBase.castShadow = true
  group.add(standBase)

  const captionStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.12, 0.03),
    new THREE.MeshStandardMaterial({ color: '#f2d7e4', roughness: 0.7 }),
  )
  captionStrip.position.set(0, -0.58, 0.06)
  group.add(captionStrip)

  const captionBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.18, 0.03),
    new THREE.MeshStandardMaterial({ color: '#f7f2fa', roughness: 0.55 }),
  )
  captionBlock.position.set(0, -0.46, 0.065)
  group.add(captionBlock)

  group.scale.set(1, 1, 1)
  group.position.y = 1.05
  group.rotation.y = -0.4

  return group
}

const placePhotoInRoom = (photoData) => {
  if (!room) {
    return
  }

  const photoCard = createPhotoCard(photoData)
  photoCard.position.set(1.55, 0, -2.2)
  room.add(photoCard)

  sceneObjects.value.push({
    id: Date.now(),
    assetId: 'photo',
    object: photoCard,
    photoData,
    position: photoCard.position.clone(),
    rotation: photoCard.rotation.clone(),
    scale: photoCard.scale.clone(),
  })
}

const handlePlaceMessage = (messageData) => {
  if (!room) {
    return
  }

  // Create a simple placeholder for the message in the room
  const messageGroup = new THREE.Group()
  messageGroup.position.set(0, 0.5, 0)
  room.add(messageGroup)

  sceneObjects.value.push({
    id: Date.now(),
    assetId: 'message',
    object: messageGroup,
    messageData,
    position: messageGroup.position.clone(),
    rotation: messageGroup.rotation.clone(),
    scale: messageGroup.scale.clone(),
  })
}

const handlePlaceCandle = (candleData) => {
  if (!room) {
    return
  }

  // Create a simple candle placeholder based on size
  const candleGroup = new THREE.Group()
  
  // Create candle base cylinder
  const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32)
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8 })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.castShadow = true
  base.receiveShadow = true
  base.position.y = 0.025
  candleGroup.add(base)

  // Create candle body based on size
  let candleHeight = 0.4
  if (candleData.size?.id === 'small') candleHeight = 0.3
  if (candleData.size?.id === 'large') candleHeight = 0.6

  const candleGeometry = new THREE.CylinderGeometry(0.08, 0.08, candleHeight, 16)
  const candleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfffacd,
    emissive: 0xffeb3b,
    emissiveIntensity: 0.3,
  })
  const candle = new THREE.Mesh(candleGeometry, candleMaterial)
  candle.castShadow = true
  candle.receiveShadow = true
  candle.position.y = 0.05 + candleHeight / 2
  candleGroup.add(candle)

  // Create flame
  const flameGeometry = new THREE.ConeGeometry(0.04, 0.15, 8)
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    emissive: 0xffff00,
    emissiveIntensity: 0.8,
  })
  const flame = new THREE.Mesh(flameGeometry, flameMaterial)
  flame.position.y = 0.05 + candleHeight + 0.1
  candleGroup.add(flame)

  candleGroup.position.set(Math.random() * 2 - 1, 0.05, Math.random() * 2 - 1)
  room.add(candleGroup)

  sceneObjects.value.push({
    id: Date.now(),
    assetId: 'candle',
    object: candleGroup,
    candleData,
    position: candleGroup.position.clone(),
    rotation: candleGroup.rotation.clone(),
    scale: candleGroup.scale.clone(),
  })
}

onMounted(() => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog('#ececec', 22, 64)

  camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 120)
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
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI
  controls.minAzimuthAngle = -Infinity
  controls.maxAzimuthAngle = Infinity
  controls.target.set(0, 2.1, 0)
  controls.update()

  const worldGrid = new THREE.GridHelper(84, 42, '#bdbdbd', '#cfcfcf')
  worldGrid.position.y = -0.04
  worldGrid.rotation.y = Math.PI / 4
  worldGrid.material.transparent = true
  worldGrid.material.opacity = 1
  scene.add(worldGrid)

  room = new THREE.Group()
  room.position.y = 0.62

  floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshStandardMaterial({
      color: '#838991',
      roughness: 0.84,
      metalness: 0,
    }),
  )
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.receiveShadow = true
  room.add(floorMesh)

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

  roomShadow = new THREE.Mesh(
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

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  renderer.domElement.addEventListener('pointermove', handleCanvasPointerMove)
  renderer.domElement.addEventListener('pointerleave', handleCanvasPointerLeave)

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
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', handleCanvasPointerMove)
    renderer.domElement.removeEventListener('pointerleave', handleCanvasPointerLeave)
  }
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)

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

      <button
        type="button"
        class="floor-toggle"
        :aria-pressed="showFloor"
        :title="showFloor ? 'Hide floor' : 'Show floor'"
        @click="toggleFloorVisibility"
      >
        {{ showFloor ? 'Vloer aan' : 'Vloer uit' }}
      </button>

      <div class="profile-area">
        <span class="profile-name">{{ username }}</span>
        <div ref="profileMenuElement" class="profile-menu-wrap">
          <button
            type="button"
            class="avatar"
            aria-haspopup="menu"
            :aria-expanded="showProfileMenu"
            aria-label="Open profile menu"
            title="Open profile menu"
            @click="toggleProfileMenu"
            @keydown.enter.prevent="openProfileMenu"
            @keydown.space.prevent="openProfileMenu"
          ></button>

          <div v-if="showProfileMenu" class="profile-menu" role="menu" aria-label="Profile options">
            <button type="button" class="profile-menu-item" role="menuitem" @click="closeProfileMenu">
              Instellingen
            </button>
          </div>
        </div>
      </div>
    </header>

    <section class="scene-stage">
      <canvas ref="canvasRef" class="scene-canvas" aria-label="Memorial space 3D scene"></canvas>

      <nav class="action-dock" aria-label="Quick actions">
        <button type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'media' }" @click="openQuickPanel('media')">
          <span class="dock-icon">+</span>
          <span class="dock-label">Media</span>
        </button>
        <button type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'messages' }" @click="openQuickPanel('messages')">
          <span class="dock-icon">Msg</span>
          <span class="dock-label">Berichten</span>
        </button>
        <button type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'family' }" @click="openQuickPanel('family')">
          <span class="dock-icon">Fam</span>
          <span class="dock-label">Kaarsje</span>
        </button>
      </nav>

      <AssetPanel
        v-if="showQuickPanel"
        :show-floor="showFloor"
        :panel-type="activePanel"
        @toggle-floor="toggleFloorVisibility"
        @close-panel="closeQuickPanel"
        @place-photo="handlePlacePhoto"
        @place-message="handlePlaceMessage"
        @place-candle="handlePlaceCandle"
      />

      <div
        v-if="hoveredPhoto"
        class="photo-tooltip"
        :style="{
          left: `${hoveredPhotoPosition.x}px`,
          top: `${hoveredPhotoPosition.y}px`,
        }"
      >
        <strong>{{ hoveredPhoto.title }}</strong>
        <p>{{ hoveredPhoto.text || 'Geen extra tekst toegevoegd.' }}</p>
      </div>
    </section>
  </main>
</template>"}}]}]}

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
  border-radius: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.2);
  padding: 16px 38px;
  margin: 30px 228px;
}

.floor-toggle {
  border: 1px solid #d7d7d7;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 10px 16px;
  margin-left: auto;
  margin-right: 18px;
}

.floor-toggle:hover {
  background: rgba(255, 255, 255, 0.98);
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
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 28px;
  color: #1a1a1a;
}

.profile-menu-wrap {
  position: relative;
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

.profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  min-width: 180px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(12px);
  z-index: 20;
}

.profile-menu-item {
  width: 100%;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 600;
  padding: 10px 12px;
  text-align: left;
}

.profile-menu-item:hover,
.profile-menu-item:focus-visible {
  background: rgba(242, 175, 199, 0.18);
  outline: none;
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

.dock-button.active {
  border-color: #c88fb8;
  background: rgba(242, 175, 199, 0.24);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
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

.photo-tooltip {
  position: absolute;
  z-index: 25;
  min-width: 180px;
  max-width: 240px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(96, 76, 150, 0.2);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  color: #1a1a1a;
  pointer-events: none;
  backdrop-filter: blur(10px);
}

.photo-tooltip strong {
  display: block;
  margin-bottom: 4px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.photo-tooltip p {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: #48415f;
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