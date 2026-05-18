<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
const emit = defineEmits(['logout', 'update-user', 'room-deleted'])
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import AssetPanel from './AssetPanel.vue'

const props = defineProps({ currentUser: Object, roomId: { type: [String, Number], default: null } })

const canvasRef = ref(null)
const username = ref('Naam')
const roomPrivacy = ref('private')
const roomInviteCode = ref(null)
const roomMembers = ref([])
const inviteEmail = ref('')
const inviteRole = ref('editor')
const deleteConfirmText = ref('')
const showRoomSettingsModal = ref(false)
const showAdminSettingsModal = ref(false)
const editDisplayName = ref('')

// initialize username from current user when available
if (props.currentUser && props.currentUser.displayName) {
  username.value = props.currentUser.displayName
}

watch(() => props.currentUser, (nu) => {
  if (nu && nu.displayName) username.value = nu.displayName
})
// reload room metadata when roomId changes
watch(() => props.roomId, () => {
  loadRoomMeta()
  loadRoomMembers()
})
const sceneObjects = ref([])
const showQuickPanel = ref(false)
const activePanel = ref('media')
const showFloor = ref(true)
const showProfileMenu = ref(false)
const hoveredPhoto = ref(null)
const hoveredPhotoPosition = ref({ x: 0, y: 0 })
const selectedSceneObjectId = ref(null)
const selectedSceneObject = ref(null)
const selectedSceneObjectType = ref('')
const selectedSceneObjectLabel = ref('')
const transformStep = 0.2
const rotateStep = Math.PI / 12
const scaleStep = 0.1
const assetModels = ref([])
const hideDeleteHint = ref(false)
// Initialize from localStorage if available
try {
  const _saved = localStorage.getItem('memorial_hideDeleteHint')
  if (_saved === 'true') hideDeleteHint.value = true
} catch (e) {
  // ignore when unavailable
}

let animationFrameId = 0
let resizeObserver = null
let renderer = null
let controls = null
let scene = null
let room = null
let camera = null
let floorMesh = null
let roomShadow = null
const profileMenuElement = ref(null)
let selectionHelper = null
let sceneObjectIdCounter = 1
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

// Serialize scene state to JSON for localStorage
const serializeSceneState = () => {
  const state = {
    version: 1,
    timestamp: new Date().toISOString(),
    objects: sceneObjects.value.map(record => ({
      id: record.id,
      assetId: record.assetId,
      position: record.position ? { x: record.position.x, y: record.position.y, z: record.position.z } : { x: 0, y: 0, z: 0 },
      rotation: record.rotation ? { x: record.rotation.x, y: record.rotation.y, z: record.rotation.z } : { x: 0, y: 0, z: 0 },
      scale: record.scale ? { x: record.scale.x, y: record.scale.y, z: record.scale.z } : { x: 1, y: 1, z: 1 },
      photoData: record.photoData || null,
      audioData: record.audioData || null,
      videoData: record.videoData || null,
      messageData: record.messageData || null,
      candleData: record.candleData || null,
    })),
  }
  return JSON.stringify(state)
}

// Load/save basic room metadata (privacy & invite code) in localStorage for demo
const loadRoomMeta = () => {
  const id = props.roomId || 'default'
  try {
    const stored = localStorage.getItem(`audreyRoom_${id}`)
    if (stored) {
      const data = JSON.parse(stored)
      roomPrivacy.value = data.privacy || 'private'
      roomInviteCode.value = data.inviteCode || null
    } else {
      roomPrivacy.value = 'private'
      roomInviteCode.value = null
    }
  } catch (e) {
    roomPrivacy.value = 'private'
    roomInviteCode.value = null
  }

  // load members
  try {
    const mem = localStorage.getItem(`audreyRoomMembers_${id}`)
    roomMembers.value = mem ? JSON.parse(mem) : []
  } catch (e) {
    roomMembers.value = []
  }
}

const saveRoomMeta = () => {
  const id = props.roomId || 'default'
  try {
    localStorage.setItem(`audreyRoom_${id}`, JSON.stringify({ privacy: roomPrivacy.value, inviteCode: roomInviteCode.value }))
  } catch (e) {}
  try {
    localStorage.setItem(`audreyRoomMembers_${id}`, JSON.stringify(roomMembers.value))
  } catch (e) {}

}

const toggleRoomPrivacy = () => {
  if (!props.currentUser || props.currentUser.role !== 'admin') {
    alert('Only the room owner can change privacy (demo).')
    return
  }
  roomPrivacy.value = roomPrivacy.value === 'private' ? 'public' : 'private'
  saveRoomMeta()
}

const generateInviteCode = () => {
  if (!props.currentUser || props.currentUser.role !== 'admin') {
    alert('Only the room owner can generate invite codes (demo).')
    return
  }
  const code = `INV-${Math.random().toString(36).substring(2,8).toUpperCase()}`
  roomInviteCode.value = code
  saveRoomMeta()
  alert(`Invite code generated: ${code}`)
}

const loadRoomMembers = () => {
  const id = props.roomId || 'default'
  try {
    const mem = localStorage.getItem(`audreyRoomMembers_${id}`)
    roomMembers.value = mem ? JSON.parse(mem) : []
  } catch (e) {
    roomMembers.value = []
  }
}

const saveRoomMembers = () => {
  const id = props.roomId || 'default'
  try {
    localStorage.setItem(`audreyRoomMembers_${id}`, JSON.stringify(roomMembers.value))
  } catch (e) {}
}

const inviteMember = () => {
  if (!inviteEmail.value) return alert('Please provide an email to invite')
  const id = `m_${Date.now()}`
  const member = { id, email: inviteEmail.value.trim(), role: inviteRole.value || 'editor', status: 'invited' }
  roomMembers.value.push(member)
  saveRoomMembers()
  inviteEmail.value = ''
  inviteRole.value = 'editor'
  alert('Member invited (demo): ' + member.email)
}

const removeMember = (id) => {
  if (!confirm('Remove this member from the room?')) return
  roomMembers.value = roomMembers.value.filter(m => m.id !== id)
  saveRoomMembers()
}

const toggleBlockMember = (id) => {
  const m = roomMembers.value.find(x => x.id === id)
  if (!m) return
  m.status = m.status === 'blocked' ? 'active' : 'blocked'
  saveRoomMembers()
}

const deleteRoom = () => {
  // require typed confirmation of room id or DELETE
  const id = props.roomId || 'default'
  if (!deleteConfirmText.value || deleteConfirmText.value !== 'DELETE') {
    return alert('Type DELETE in the confirmation box to confirm room deletion')
  }
  try {
    localStorage.removeItem(`audreyRoom_${id}`)
    localStorage.removeItem(`audreyRoomMembers_${id}`)
  } catch (e) {}
  showRoomSettingsModal.value = false
  emit('room-deleted', id)
  alert('Room deleted (demo).')
}

// Deserialize scene state from JSON and rebuild scene
const deserializeSceneState = async (jsonString) => {
  try {
    const state = JSON.parse(jsonString)
    if (state.version !== 1) {
      console.error('Unknown scene state version')
      return false
    }

    // Clear existing objects
    sceneObjects.value.forEach(record => {
      if (record.object && room) {
        room.remove(record.object)
      }
    })
    sceneObjects.value = []
    clearSceneSelection()

    // Rebuild objects from state
    for (const objData of state.objects) {
      sceneObjectIdCounter = Math.max(sceneObjectIdCounter, objData.id + 1)

      if (objData.assetId === 'photo' && objData.photoData) {
        const photoCard = createPhotoCard(objData.photoData)
        photoCard.position.set(objData.position.x, objData.position.y, objData.position.z)
        photoCard.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        photoCard.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(photoCard)
        createSceneObjectRecord(photoCard, objData.assetId, { photoData: objData.photoData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        photoCard.userData.sceneObjectId = objData.id
      } else if (objData.assetId === 'audio' && objData.audioData) {
        const audioCard = createAudioCard(objData.audioData)
        audioCard.position.set(objData.position.x, objData.position.y, objData.position.z)
        audioCard.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        audioCard.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(audioCard)
        createSceneObjectRecord(audioCard, objData.assetId, { audioData: objData.audioData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        audioCard.userData.sceneObjectId = objData.id
      } else if (objData.assetId === 'video' && objData.videoData) {
        const videoCard = createVideoCard(objData.videoData)
        videoCard.position.set(objData.position.x, objData.position.y, objData.position.z)
        videoCard.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        videoCard.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(videoCard)
        createSceneObjectRecord(videoCard, objData.assetId, { videoData: objData.videoData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        videoCard.userData.sceneObjectId = objData.id
      } else if (objData.assetId === 'message' && objData.messageData) {
        const messageGroup = new THREE.Group()
        messageGroup.position.set(objData.position.x, objData.position.y, objData.position.z)
        messageGroup.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        messageGroup.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(messageGroup)
        createSceneObjectRecord(messageGroup, objData.assetId, { messageData: objData.messageData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        messageGroup.userData.sceneObjectId = objData.id
      } else if (['candle', 'photo-frame', 'flower'].includes(objData.assetId)) {
        // For 3D asset types, create placeholder
        let model = createPlaceholderModel(objData.assetId)
        model.position.set(objData.position.x, objData.position.y, objData.position.z)
        model.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        model.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(model)
        createSceneObjectRecord(model, objData.assetId, {})
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        model.userData.sceneObjectId = objData.id
      }
    }

    return true
  } catch (error) {
    console.error('Failed to deserialize scene state:', error)
    return false
  }
}

// Save scene to localStorage
const saveSceneToStorage = () => {
  try {
    const serialized = serializeSceneState()
    localStorage.setItem('memorialScene', serialized)
    alert('Scene saved successfully!')
  } catch (error) {
    console.error('Failed to save scene:', error)
    alert('Failed to save scene')
  }
}

// Load scene from localStorage
const loadSceneFromStorage = async () => {
  try {
    const stored = localStorage.getItem('memorialScene')
    if (!stored) {
      alert('No saved scene found')
      return
    }
    const success = await deserializeSceneState(stored)
    if (success) {
      alert('Scene loaded successfully!')
    } else {
      alert('Failed to load scene')
    }
  } catch (error) {
    console.error('Failed to load scene:', error)
    alert('Failed to load scene')
  }
}

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
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('View-only users cannot add objects (demo).')
    return
  }

  placePhotoInRoom(photoData)
}

const handlePlaceAudio = (audioData) => {
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('View-only users cannot add objects (demo).')
    return
  }
  placeAudioInRoom(audioData)
}

const handlePlaceVideo = (videoData) => {
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('View-only users cannot add objects (demo).')
    return
  }
  placeVideoInRoom(videoData)
}

const createSceneObjectRecord = (object, assetId, payload = {}) => {
  const id = sceneObjectIdCounter++
  object.userData.sceneObjectId = id

  const record = {
    id,
    assetId,
    object,
    position: object.position.clone(),
    rotation: object.rotation.clone(),
    scale: object.scale.clone(),
    ...payload,
  }

  sceneObjects.value.push(record)
  selectSceneObject(record)

  return id
}

const createAudioCard = (audioData) => {
  const group = new THREE.Group()
  group.userData.audioData = audioData

  const shellMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 })
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.06), shellMaterial)
  shell.castShadow = true
  shell.receiveShadow = true
  group.add(shell)

  const waveMaterial = new THREE.MeshStandardMaterial({ color: '#e6e6e6', roughness: 0.9 })
  const wave = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), waveMaterial)
  wave.position.z = 0.035
  wave.position.y = 0.05
  group.add(wave)

  const captionBlock = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.18, 0.03),
    new THREE.MeshStandardMaterial({ color: '#f7f2fa', roughness: 0.55 }),
  )
  captionBlock.position.set(0, -0.36, 0.035)
  group.add(captionBlock)

  group.scale.set(1, 1, 1)
  group.position.y = 1.05
  group.rotation.y = -0.4

  return group
}

const placeAudioInRoom = (audioData) => {
  if (!room) return
  const audioCard = createAudioCard(audioData)
  audioCard.position.set(1.2, 0, -1.6)
  room.add(audioCard)

  createSceneObjectRecord(audioCard, 'audio', { audioData })
}

const createVideoCard = (videoData) => {
  const group = new THREE.Group()
  group.userData.videoData = videoData

  const shellMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 })
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.06), shellMaterial)
  shell.castShadow = true
  shell.receiveShadow = true
  group.add(shell)

  const videoPlateMaterial = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.9 })
  const videoPlate = new THREE.Mesh(new THREE.BoxGeometry(1.64, 1.04, 0.04), videoPlateMaterial)
  videoPlate.position.z = 0.035
  group.add(videoPlate)

  const captionBlock = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.18, 0.03),
    new THREE.MeshStandardMaterial({ color: '#f7f2fa', roughness: 0.55 }),
  )
  captionBlock.position.set(0, -0.5, 0.035)
  group.add(captionBlock)

  group.scale.set(1, 1, 1)
  group.position.y = 1.2
  group.rotation.y = -0.35

  return group
}

const placeVideoInRoom = (videoData) => {
  if (!room) return
  const videoCard = createVideoCard(videoData)
  videoCard.position.set(-1.5, 0, -1.8)
  room.add(videoCard)

  createSceneObjectRecord(videoCard, 'video', { videoData })
}

// Function to add an object to the scene
const addObjectToScene = async (assetId) => {
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('View-only users cannot add objects (demo).')
    return
  }
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

  createSceneObjectRecord(model, assetId)
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

const openRoomSettings = () => { showRoomSettingsModal.value = true; showProfileMenu.value = false }
const openAdminSettings = () => {
  editDisplayName.value = username.value || (props.currentUser && props.currentUser.displayName) || ''
  showAdminSettingsModal.value = true
  showProfileMenu.value = false
}
const handleLogout = () => { emit('logout'); showProfileMenu.value = false }

const saveAdminSettings = () => {
  // update local display name and persist to localStorage and notify parent
  username.value = editDisplayName.value || username.value
  try {
    const stored = localStorage.getItem('audreyUser')
    if (stored) {
      const u = JSON.parse(stored)
      u.displayName = username.value
      localStorage.setItem('audreyUser', JSON.stringify(u))
      emit('update-user', u)
    } else if (props.currentUser) {
      const u = { ...props.currentUser, displayName: username.value }
      localStorage.setItem('audreyUser', JSON.stringify(u))
      emit('update-user', u)
    }
  } catch (e) {}
  showAdminSettingsModal.value = false
}

const handleDocumentClick = (event) => {
  if (!showProfileMenu.value) {
    return
  }

  if (profileMenuElement.value && !profileMenuElement.value.contains(event.target)) {
    closeProfileMenu()
  }
}

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    closeProfileMenu()
  }
}

const handleWindowKeydown = (event) => {
  const target = event.target
  const isTypingTarget = target instanceof HTMLElement
    && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

  if (isTypingTarget) {
    return
  }

  const key = (event.key || '').toLowerCase()
  if (key === 'delete' || key === 'del' || key === 'backspace') {
    // Prevent accidental browser navigation when Backspace/Delete is used
    try { event.preventDefault() } catch (e) {}
    removeSelectedSceneObject()
  }
}

const dismissDeleteHint = () => {
  hideDeleteHint.value = true
  try {
    localStorage.setItem('memorial_hideDeleteHint', 'true')
  } catch (e) {
    // ignore
  }
}

const clearHoveredPhoto = () => {
  hoveredPhoto.value = null
}

const clearSelectionHelper = () => {
  if (!selectionHelper || !room) {
    selectionHelper = null
    return
  }

  room.remove(selectionHelper)
  selectionHelper.geometry.dispose()
  selectionHelper.material.dispose()
  selectionHelper = null
}

const clearSceneSelection = () => {
  selectedSceneObjectId.value = null
  selectedSceneObject.value = null
  selectedSceneObjectType.value = ''
  selectedSceneObjectLabel.value = ''
  clearSelectionHelper()
}

const getSelectableRootObjects = () => {
  return sceneObjects.value
    .map(entry => entry.object)
    .filter(Boolean)
}

const findSceneObjectRecord = (object) => {
  let currentObject = object

  while (currentObject) {
    const sceneObjectId = currentObject.userData?.sceneObjectId

    if (sceneObjectId) {
      return sceneObjects.value.find(entry => entry.id === sceneObjectId) || null
    }

    currentObject = currentObject.parent
  }

  return null
}

const updateSelectionHelper = (object) => {
  clearSelectionHelper()

  if (!room) {
    return
  }

  selectionHelper = new THREE.BoxHelper(object, '#f2afc7')
  room.add(selectionHelper)
}

const selectSceneObject = (record) => {
  if (!record) {
    clearSceneSelection()
    return
  }

  selectedSceneObjectId.value = record.id
  selectedSceneObject.value = record
  selectedSceneObjectType.value = record.assetId
  selectedSceneObjectLabel.value = record.photoData?.title
    || record.audioData?.title
    || record.videoData?.title
    || record.candleData?.name
    || record.messageData?.message
    || record.assetId
  updateSelectionHelper(record.object)
}

const removeSelectedSceneObject = () => {
  const record = selectedSceneObject.value

  if (!record || !room) {
    return
  }

  room.remove(record.object)
  sceneObjects.value = sceneObjects.value.filter(entry => entry.id !== record.id)
  clearHoveredPhoto()
  clearSceneSelection()
}

const applyTransformToSelectedObject = ({ moveX = 0, moveY = 0, moveZ = 0, rotateY = 0, scaleAdjust = 0 }) => {
  const record = selectedSceneObject.value

  if (!record?.object) {
    return
  }

  record.object.position.x += moveX
  record.object.position.y += moveY
  record.object.position.z += moveZ
  record.object.rotation.y += rotateY

  if (scaleAdjust !== 0) {
    const newScale = Math.max(0.1, record.object.scale.x + scaleAdjust)
    record.object.scale.set(newScale, newScale, newScale)
  }

  record.position = record.object.position.clone()
  record.rotation = record.object.rotation.clone()
  record.scale = record.object.scale.clone()
}

const getPhotoDataFromObject = (object) => {
  let currentObject = object

  while (currentObject) {
    if (currentObject.userData?.photoData) return currentObject.userData.photoData
    if (currentObject.userData?.audioData) return currentObject.userData.audioData
    if (currentObject.userData?.videoData) return currentObject.userData.videoData
    if (currentObject.userData?.messageData) return currentObject.userData.messageData

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

const handleCanvasClick = (event) => {
  if (!renderer || !camera || !room) {
    return
  }

  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

  const selectableRoots = getSelectableRootObjects()

  if (!selectableRoots.length) {
    clearSceneSelection()
    return
  }

  raycaster.setFromCamera(pointer, camera)
  const intersections = raycaster.intersectObjects(selectableRoots, true)
  const selectedIntersection = intersections.find(intersection => findSceneObjectRecord(intersection.object))

  if (!selectedIntersection) {
    clearSceneSelection()
    return
  }

  selectSceneObject(findSceneObjectRecord(selectedIntersection.object))
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

  createSceneObjectRecord(photoCard, 'photo', { photoData })
}

const handlePlaceMessage = (messageData) => {
  if (!room) {
    return
  }

  // Create a simple placeholder for the message in the room
  const messageGroup = new THREE.Group()
  messageGroup.position.set(0, 0.5, 0)
  room.add(messageGroup)

  createSceneObjectRecord(messageGroup, 'message', { messageData })
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

  createSceneObjectRecord(candleGroup, 'candle', { candleData })
}

onMounted(() => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  // load room metadata for privacy/invite demo
  loadRoomMeta()

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
  renderer.shadowMap.type = THREE.PCFShadowMap

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
  window.addEventListener('keydown', handleWindowKeydown)
  renderer.domElement.addEventListener('pointermove', handleCanvasPointerMove)
  renderer.domElement.addEventListener('click', handleCanvasClick)
  renderer.domElement.addEventListener('pointerleave', handleCanvasPointerLeave)

  const animate = () => {
    animationFrameId = window.requestAnimationFrame(animate)
    lightPulse()
    if (selectionHelper) {
      selectionHelper.update()
    }
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId)
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', handleCanvasPointerMove)
    renderer.domElement.removeEventListener('click', handleCanvasClick)
    renderer.domElement.removeEventListener('pointerleave', handleCanvasPointerLeave)
  }
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('keydown', handleWindowKeydown)

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

  clearSelectionHelper()
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

      <button
        type="button"
        class="floor-toggle"
        title="Save scene to local storage"
        @click="saveSceneToStorage"
      >
        💾 Save
      </button>

      <button
        type="button"
        class="floor-toggle"
        title="Load scene from local storage"
        @click="loadSceneFromStorage"
      >
        📂 Load
      </button>

      <button v-if="props.currentUser && props.currentUser.role === 'admin'" type="button" class="floor-toggle" title="Toggle room privacy" @click="toggleRoomPrivacy">
        {{ roomPrivacy === 'private' ? 'Private' : 'Public' }}
      </button>

      <button v-if="props.currentUser && props.currentUser.role === 'admin'" type="button" class="floor-toggle" title="Generate invite code" @click="generateInviteCode">
        {{ roomInviteCode ? roomInviteCode : 'Generate invite' }}
      </button>

      <div class="profile-area">
        <span class="profile-name">{{ username }}</span>
        <div ref="profileMenuElement" class="profile-menu-wrap">
          <button
            type="button"
            class="avatar"
            :style="{ backgroundImage: props.currentUser && props.currentUser.avatar ? `url(${props.currentUser.avatar})` : undefined, backgroundSize: 'cover' }"
            aria-haspopup="menu"
            :aria-expanded="showProfileMenu"
            aria-label="Open profile menu"
            title="Open profile menu"
            @click="toggleProfileMenu"
            @keydown.enter.prevent="openProfileMenu"
            @keydown.space.prevent="openProfileMenu"
          ></button>

          <div v-if="showProfileMenu" class="profile-menu" role="menu" aria-label="Profile options">
            <template v-if="props.currentUser && props.currentUser.role === 'admin'">
              <button type="button" class="profile-menu-item" role="menuitem" @click="openAdminSettings">
                Admin settings
              </button>
              <button type="button" class="profile-menu-item" role="menuitem" @click="openRoomSettings">
                Room settings
              </button>
            </template>
            <button type="button" class="profile-menu-item" role="menuitem" @click="handleLogout">
              Logout
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
        @place-audio="handlePlaceAudio"
        @place-video="handlePlaceVideo"
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

      <aside v-if="selectedSceneObject" class="selection-panel">
        <div class="selection-panel-header">
          <h3>Geselecteerd object</h3>
          <button type="button" class="selection-close-button" @click="clearSceneSelection">×</button>
        </div>

          <div v-if="!hideDeleteHint" class="selection-hint">
            <span>Druk op de Delete-knop om het geselecteerde object te verwijderen</span>
            <button type="button" class="selection-hint-close" @click="dismissDeleteHint" aria-label="Sluit hint">×</button>
          </div>

        <div class="selection-controls">
          <div class="control-group">
            <div class="control-label">Move</div>
            <div class="control-grid move-grid">
              <button type="button" class="selection-icon-button" title="Forward" @click="applyTransformToSelectedObject({ moveZ: -transformStep })">
                <span class="icon">↑</span>
                <span class="label">Forward</span>
              </button>
              <button type="button" class="selection-icon-button" title="Backward" @click="applyTransformToSelectedObject({ moveZ: transformStep })">
                <span class="icon">↓</span>
                <span class="label">Back</span>
              </button>
              <button type="button" class="selection-icon-button" title="Left" @click="applyTransformToSelectedObject({ moveX: -transformStep })">
                <span class="icon">←</span>
                <span class="label">Left</span>
              </button>
              <button type="button" class="selection-icon-button" title="Right" @click="applyTransformToSelectedObject({ moveX: transformStep })">
                <span class="icon">→</span>
                <span class="label">Right</span>
              </button>
              <button type="button" class="selection-icon-button" title="Up" @click="applyTransformToSelectedObject({ moveY: transformStep })">
                <span class="icon">⬆</span>
                <span class="label">Up</span>
              </button>
              <button type="button" class="selection-icon-button" title="Down" @click="applyTransformToSelectedObject({ moveY: -transformStep })">
                <span class="icon">⬇</span>
                <span class="label">Down</span>
              </button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Rotate</div>
            <div class="control-grid rotate-grid">
              <button type="button" class="selection-icon-button" title="Rotate Left" @click="applyTransformToSelectedObject({ rotateY: -rotateStep })">
                <span class="icon">↶</span>
                <span class="label">Left</span>
              </button>
              <button type="button" class="selection-icon-button" title="Rotate Right" @click="applyTransformToSelectedObject({ rotateY: rotateStep })">
                <span class="icon">↷</span>
                <span class="label">Right</span>
              </button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Scale</div>
            <div class="control-grid scale-grid">
              <button type="button" class="selection-icon-button" title="Shrink" @click="applyTransformToSelectedObject({ scaleAdjust: -scaleStep })">
                <span class="icon">⊖</span>
                <span class="label">Smaller</span>
              </button>
              <button type="button" class="selection-icon-button" title="Enlarge" @click="applyTransformToSelectedObject({ scaleAdjust: scaleStep })">
                <span class="icon">⊕</span>
                <span class="label">Larger</span>
              </button>
            </div>
          </div>
        </div>

        <div class="selection-actions">
          <button type="button" class="selection-delete-button" @click="removeSelectedSceneObject">
            Verwijderen
          </button>
        </div>
      </aside>

      <!-- Room Settings Modal -->
      <div v-if="showRoomSettingsModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card">
          <h3>Room settings</h3>
          <div style="margin:10px 0">
            <label style="display:flex;align-items:center;gap:8px">Privacy:
              <button @click="toggleRoomPrivacy" style="margin-left:12px;padding:8px;border-radius:8px">{{ roomPrivacy === 'private' ? 'Private' : 'Public' }}</button>
            </label>
          </div>

          <div style="margin:10px 0">
            <button @click="generateInviteCode" style="padding:8px;border-radius:8px">{{ roomInviteCode ? 'Regenerate invite' : 'Generate invite' }}</button>
            <div v-if="roomInviteCode" style="margin-top:8px">Code: <strong>{{ roomInviteCode }}</strong></div>
          </div>

          <hr />
          <h4 style="margin-top:12px">Members</h4>
          <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input v-model="inviteEmail" placeholder="email@example.com" style="flex:1;padding:8px;border-radius:8px;border:1px solid #e6e6ee" />
            <select v-model="inviteRole" style="padding:8px;border-radius:8px;border:1px solid #e6e6ee">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button @click="inviteMember" style="padding:8px 10px;border-radius:8px">Invite</button>
          </div>

          <div style="max-height:160px;overflow:auto;margin-top:12px">
            <div v-if="!roomMembers.length">No members yet.</div>
            <ul v-else style="list-style:none;padding:0;margin:0">
              <li v-for="m in roomMembers" :key="m.id" style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #f2f2f2">
                <div style="display:flex;flex-direction:column">
                  <strong>{{ m.email }}</strong>
                  <small style="color:#666">Role: {{ m.role }} • Status: {{ m.status }}</small>
                </div>
                <div style="display:flex;gap:8px">
                  <button @click="toggleBlockMember(m.id)" style="padding:6px;border-radius:8px">{{ m.status === 'blocked' ? 'Unblock' : 'Block' }}</button>
                  <button @click="removeMember(m.id)" style="padding:6px;border-radius:8px">Remove</button>
                </div>
              </li>
            </ul>
          </div>

          <hr />
          <div style="margin-top:12px">
            <h4>Danger zone</h4>
            <div style="font-size:13px;color:#666;margin-top:6px">Deleting the room will remove its metadata and members (demo only).</div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <input v-model="deleteConfirmText" placeholder="Type DELETE to confirm" style="flex:1;padding:8px;border-radius:8px;border:1px solid #e6e6ee" />
              <button @click="deleteRoom" style="padding:8px 12px;border-radius:8px;background:#ff6b6b;color:#fff;border:none">Delete room</button>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
            <button @click="showRoomSettingsModal = false" style="padding:8px 12px;border-radius:8px">Close</button>
          </div>
        </div>
      </div>

      <!-- Admin Settings Modal (placeholder) -->
      <div v-if="showAdminSettingsModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card">
          <h3>Admin settings</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
            <div style="width:56px;height:56px;border-radius:28px;overflow:hidden;background:#ddd">
              <img v-if="props.currentUser && props.currentUser.avatar" :src="props.currentUser.avatar" style="width:100%;height:100%;object-fit:cover" />
            </div>
            <div>
              <div style="font-weight:700">{{ props.currentUser ? props.currentUser.email : username }}</div>
              <div style="font-size:13px;color:#666">Role: {{ props.currentUser ? props.currentUser.role : 'viewer' }}</div>
            </div>
          </div>

          <div style="margin-top:12px">
            <label style="display:block;font-size:13px;color:#333">Display name</label>
            <input v-model="editDisplayName" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e6e6ee;margin-top:6px" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
            <button @click="showAdminSettingsModal = false" style="padding:8px 12px;border-radius:8px">Cancel</button>
            <button @click="saveAdminSettings" style="padding:8px 12px;border-radius:8px;background:#6c5ce7;color:#fff;border:none">Save</button>
          </div>
        </div>
      </div>
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10,10,12,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  width: 520px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
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

.selection-panel {
  position: absolute;
  right: 20px;
  top: 120px;
  width: 310px;
  max-height: 70vh;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(54, 42, 92, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(12px);
  overflow-y: auto;
}

.selection-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.selection-panel-header h3 {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.selection-close-button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: rgba(242, 175, 199, 0.25);
  color: #1a1a1a;
  font-size: 18px;
}

.selection-object-name,
.selection-object-type {
  margin: 10px 0 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  color: #2a2a2a;
}

.selection-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.selection-hint {
  font-size: 12px;
  color: #6b6b6b;
  padding: 8px 16px 12px 0;
}

.selection-hint-close {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #8a8a8a;
  float: right;
  margin-right: 8px;
  cursor: pointer;
}

.selection-delete-button {
  border: none;
  border-radius: 12px;
  background: #1f1a3b;
  color: #ffffff;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 14px;
  width: 100%;
}

.selection-controls {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-grid {
  display: grid;
  gap: 8px;
}

.move-grid {
  grid-template-columns: repeat(3, 1fr);
}

.rotate-grid {
  grid-template-columns: repeat(2, 1fr);
}

.scale-grid {
  grid-template-columns: repeat(2, 1fr);
}

.selection-icon-button {
  border: 1px solid rgba(31, 26, 59, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #1f1a3b;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 1;
  min-height: 60px;
  padding: 8px;
}

.selection-icon-button .icon {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
}

.selection-icon-button .label {
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  letter-spacing: 0.03em;
}

.selection-icon-button:hover {
  background: rgba(242, 175, 199, 0.2);
  border-color: rgba(242, 175, 199, 0.5);
  transform: scale(1.05);
}

.selection-icon-button:active {
  transform: scale(0.95);
}

.selection-transform-button {
  border: 1px solid rgba(31, 26, 59, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #1f1a3b;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 10px;
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