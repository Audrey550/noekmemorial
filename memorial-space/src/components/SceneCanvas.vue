<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const emit = defineEmits(['logout', 'update-user', 'room-deleted', 'room-selected', 'create-room'])
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import noekLogoTextUrl from '../assets/Noek_LogoText.svg'
import AssetPanel from './AssetPanel.vue'
import ModeratorPanel from './ModeratorPanel.vue'
import TutorialOverlay from './TutorialOverlay.vue'
import createAdminTutorialSteps from '../tutorials/admin-tutorials.js'
import { logEvent } from '../lib/analytics'
import { getSupabase } from '../lib/supabase'

const props = defineProps({
  currentUser: Object,
  roomId: { type: [String, Number], default: null },
  accessibleRooms: { type: Array, default: () => [] },
})

import { onMounted as onMountedLocal } from 'vue'
const tutorialRef = ref(null)
const tutorialFirstRun = ref(false)

const adminTutorialStorageKey = (roomId) => `audrey_admin_tutorial_shown_${roomId || 'default'}`

import { computed as computedLocal } from 'vue'

const adminTutorialSteps = computedLocal(() => createAdminTutorialSteps(username.value || 'Gast', effectiveRole.value))

onMountedLocal(() => {
  try {
    const key = adminTutorialStorageKey(props.roomId)
    const already = localStorage.getItem(key)
    tutorialFirstRun.value = !already
    if (!already && props.currentUser && props.currentUser.role === 'admin') {
      // give the page a moment to render target elements
      setTimeout(() => {
        try { tutorialRef.value?.start() } catch (e) {}
      }, 420)
    }
  } catch (e) {}
})

const handleTutorialFinish = () => {
  try { 
    localStorage.setItem(adminTutorialStorageKey(props.roomId), 'true') 
  } catch (e) {}
  try { tutorialFirstRun.value = false } catch (e) {}
  tutorialProfileMenuPinned.value = false
  showProfileMenu.value = false
}

const canvasRef = ref(null)
const colorInputRef = ref(null)
const username = ref('Naam')
const roomPrivacy = ref('private')
const roomInviteCode = ref(null)
const roomName = ref('')
const roomTheme = ref({
  presetId: 'soft-pink',
  wallShadeIndex: 2,
  floorShadeIndex: 2,
  wallMaterialIndex: 0,
  floorMaterialIndex: 0,
  useTextures: true,
})
const roomEmpty = ref(false)
const roomSettingsError = ref('')
const roomSettingsSuccess = ref('')
const roomMembers = ref([])
const inviteEmail = ref('')
const inviteRole = ref('editor')
const deleteConfirmText = ref('')
const showRoomSettingsModal = ref(false)
const showAdminSettingsModal = ref(false)
const editDisplayName = ref('')
const visitorPreviewMode = ref(false)
const adminViewMode = ref('edit') // 'edit' | 'moderator' | 'visitor'
const showAdminViewMenu = ref(false)
const showTopNavMenu = ref(false)
const tutorialProfileMenuPinned = ref(false)
const quickPanelSnapshot = ref(null)

// initialize username from current user when available
if (props.currentUser && props.currentUser.displayName) {
  username.value = props.currentUser.displayName
}

const effectiveRole = computed(() => {
  if (visitorPreviewMode.value && (props.currentUser?.role === 'admin' || props.currentUser?.role === 'editor')) {
    return 'viewer'
  }

  return props.currentUser?.role || 'viewer'
})

const setVisitorPreviewMode = (enabled) => {
  if (enabled) {
    quickPanelSnapshot.value = {
      showQuickPanel: showQuickPanel.value,
      activePanel: activePanel.value,
      quickPanelModelCategory: quickPanelModelCategory.value,
      quickPanelMediaMode: quickPanelMediaMode.value,
    }
  }

  visitorPreviewMode.value = enabled
  showAdminViewMenu.value = false
  showQuickPanel.value = false
  showRoomSettingsModal.value = false
  showAdminSettingsModal.value = false
  showTopNavMenu.value = false
  clearSceneSelection()

  if (!enabled && quickPanelSnapshot.value) {
    activePanel.value = quickPanelSnapshot.value.activePanel
    quickPanelModelCategory.value = quickPanelSnapshot.value.quickPanelModelCategory
    quickPanelMediaMode.value = quickPanelSnapshot.value.quickPanelMediaMode
    showQuickPanel.value = quickPanelSnapshot.value.showQuickPanel
    quickPanelSnapshot.value = null
  }
}

const isAdmin = computed(() => props.currentUser?.role === 'admin')

const isModeratorMode = computed(() => isAdmin.value && adminViewMode.value === 'moderator')

const adminViewLabel = computed(() => {
  if (!isAdmin.value) {
    return visitorButtonLabel.value
  }

  if (adminViewMode.value === 'moderator') {
    return 'Bekijk als: Moderator'
  }

  if (adminViewMode.value === 'visitor') {
    return 'Bekijk als: Bezoeker'
  }

  return 'Bekijk als: Admin'
})

const setAdminViewMode = (mode) => {
  if (!isAdmin.value) return
  showAdminViewMenu.value = false
  adminViewMode.value = mode
  visitorPreviewMode.value = mode === 'visitor'

  if (mode !== 'moderator') {
    showQuickPanel.value = false
  }

  if (mode !== 'visitor') {
    visitorPreviewMode.value = false
  }

  showRoomSettingsModal.value = false
  showAdminSettingsModal.value = false
  showTopNavMenu.value = false
  clearSceneSelection()
}

watch(() => props.currentUser?.role, (role) => {
  if (role !== 'admin') {
    showAdminViewMenu.value = false
    adminViewMode.value = 'edit'
    visitorPreviewMode.value = false
    return
  }

  if (!showQuickPanel.value) {
    showQuickPanel.value = true
  }
})

const toggleAdminViewMenu = () => {
  if (!isAdmin.value) return
  showAdminViewMenu.value = !showAdminViewMenu.value
}

const closeAdminViewMenu = () => {
  showAdminViewMenu.value = false
}

const toggleTopNavMenu = () => {
  showTopNavMenu.value = !showTopNavMenu.value
}

const closeTopNavMenu = () => {
  showTopNavMenu.value = false
}

const visitorButtonLabel = computed(() => {
  if (visitorPreviewMode.value) {
    return props.currentUser?.role === 'editor' ? 'Terug naar co-editor modus' : 'Terug naar admin weergave'
  }

  return 'Bekijk als bezoeker'
})

const roomPrivacyLabel = computed(() => {
  return roomPrivacy.value === 'private' ? 'Deze kamer is privé' : 'Deze kamer is openbaar'
})

const inviteRoleOptions = computed(() => {
  const options = [
    { value: 'editor', label: 'Co-editor' },
  ]

  if (roomPrivacy.value === 'private') {
    options.push({ value: 'viewer', label: 'Viewer' })
  }

  return options
})

const accountSettingsLabel = computed(() => {
  return 'Accountinstellingen'
})

const getUnreadModeratorNotificationCount = (roomId) => {
  try {
    const raw = localStorage.getItem(`audreyModeratorNotifications_${roomId || 'default'}`)
    if (!raw) return 0
    const entries = JSON.parse(raw)
    return Array.isArray(entries) ? entries.filter(entry => !entry.read).length : 0
  } catch (e) {
    return 0
  }
}

const roomSwitcherRooms = computed(() => {
  void moderatorNotificationVersion.value
  return (Array.isArray(props.accessibleRooms) ? props.accessibleRooms : []).map((room) => ({
    ...room,
    unreadModeratorNotifications: typeof room.unreadModeratorNotifications === 'number'
      ? room.unreadModeratorNotifications
      : getUnreadModeratorNotificationCount(room.id),
  }))
})

  /*if (userNotificationStorageListener) {
    window.removeEventListener('storage', userNotificationStorageListener)
    userNotificationStorageListener = null
  }*/
const totalUnreadModeratorNotifications = computed(() => {
  return roomSwitcherRooms.value.reduce((total, room) => total + (room.unreadModeratorNotifications || 0), 0)
})

watch(effectiveRole, (role) => {
  if (role === 'editor') {
    activePanel.value = 'media'
    showQuickPanel.value = true
    return
  }

  if (role !== 'admin') {
    showQuickPanel.value = false
  }
})

watch(() => props.currentUser, (nu) => {
  if (nu && nu.displayName) username.value = nu.displayName
  loadUserNotifications()
})
// reload room metadata when roomId changes
watch(() => props.roomId, () => {
  loadRoomMeta()
  loadRoomMembers()
})

// clear inline feedback when name changes
watch(roomName, () => {
  roomSettingsError.value = ''
  roomSettingsSuccess.value = ''
})

watch(roomPrivacy, (nextPrivacy) => {
  if (nextPrivacy !== 'private' && inviteRole.value === 'viewer') {
    inviteRole.value = 'editor'
  }
})
const sceneObjects = ref([])
const showQuickPanel = ref(props.currentUser?.role === 'editor')
const activePanel = ref('media')
const quickPanelModelCategory = ref('')
const quickPanelMediaMode = ref('chooser')
const soundSettings = ref({
  enabled: false,
  presetId: 'room-tone',
  volume: 0.45,
})
const showFloor = ref(true)
const showProfileMenu = ref(false)
const showUserNotificationPanel = ref(false)
const hoveredPhoto = ref(null)
const hoveredPhotoPosition = ref({ x: 0, y: 0 })
const selectedSceneObjectId = ref(null)
const selectedSceneObject = ref(null)
const selectedSceneObjectType = ref('')
const selectedSceneObjectLabel = ref('')
const selectedSceneObjectColor = ref('#3c3c3c')
const newObjectMessage = ref('')
const moderatorNotifications = ref([])
const moderatorNotificationVersion = ref(0)
const transformStep = 0.2
const rotateStep = Math.PI / 12
const scaleStep = 0.1
const assetModels = ref([])
const hideDeleteHint = ref(false)
const userNotifications = ref([])
const undoStack = ref([])
const redoStack = ref([])
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)
const isApplyingHistory = ref(false)
const maxUndoSteps = 40
const showResetRoomModal = ref(false)
const canEditSceneObjects = computed(() => effectiveRole.value === 'admin' || effectiveRole.value === 'editor')
const leftToolbarTitle = computed(() => effectiveRole.value === 'editor' ? 'Media' : 'Assets')
const moderatorNotificationStorageKey = () => `audreyModeratorNotifications_${props.roomId || 'default'}`
const moderatorNotificationUnreadCount = computed(() => moderatorNotifications.value.filter(entry => !entry.read).length)
const userNotificationStorageKey = () => {
  const key = getCurrentUserKey()
  return `audreyNotifications_${key || 'default'}`
}
const unreadUserNotificationCount = computed(() => userNotifications.value.filter(entry => !entry.read).length)
const notificationKindLabel = (kind) => {
  switch (kind) {
    case 'room_invite': return 'Uitnodiging'
    case 'comment': return 'Opmerking'
    case 'candle_removed': return 'Moderatie'
    case 'placement': return 'Nieuwe plaatsing'
    default: return 'Melding'
  }
}
const notificationShortTime = (timestamp) => {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return ''
  }
}
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
let floorMaterial = null
let wallMaterial = null
let trimMaterial = null
let roomShadow = null
let roomDeskChair = null
let roomDeskChairBaseRotationY = Math.PI
const profileMenuElement = ref(null)
const adminViewMenuElement = ref(null)
const adminViewMenuTopElement = ref(null)
let selectionHelper = null
let sceneObjectIdCounter = 1
let gltfLoader = new GLTFLoader()
let photoTextureLoader = new THREE.TextureLoader()
let raycaster = new THREE.Raycaster()
let pointer = new THREE.Vector2()
let panelSwitchTimer = null
let soundAudioContext = null
let userNotificationStorageListener = null
let activeSoundDisposers = []
let activeSoundTimers = []
const topNavMenuElement = ref(null)

const clearActiveSound = () => {
  activeSoundTimers.forEach((timerId) => clearInterval(timerId))
  activeSoundTimers = []

  activeSoundDisposers.forEach((dispose) => {
    try {
      dispose()
    } catch (error) {
      console.warn('Failed to dispose sound node', error)
    }
  })
  activeSoundDisposers = []
}

const registerSoundDisposer = (dispose) => {
  activeSoundDisposers.push(dispose)
}

const ensureSoundContext = async () => {
  if (typeof window === 'undefined') return null

  if (!soundAudioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return null
    soundAudioContext = new AudioContextCtor()
  }

  if (soundAudioContext.state === 'suspended') {
    try {
      await soundAudioContext.resume()
    } catch (error) {
      console.warn('Failed to resume sound context', error)
    }
  }

  return soundAudioContext
}

const createNoiseBuffer = (context, durationSeconds = 1.5) => {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    data[index] = Math.random() * 2 - 1
  }

  return buffer
}

const startSoundPreset = async (nextSettings) => {
  const context = await ensureSoundContext()
  if (!context) return

  clearActiveSound()

  if (!nextSettings?.enabled) {
    return
  }

  const volume = Math.max(0, Math.min(1, Number(nextSettings.volume ?? 0.45)))
  const presetId = nextSettings.presetId || 'room-tone'
  const masterGain = context.createGain()
  masterGain.gain.value = volume
  masterGain.connect(context.destination)
  registerSoundDisposer(() => {
    try { masterGain.disconnect() } catch (error) {}
  })

  if (presetId === 'breeze') {
    const source = context.createBufferSource()
    source.buffer = createNoiseBuffer(context, 2)
    source.loop = true

    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 950
    filter.Q.value = 0.7

    const lfo = context.createOscillator()
    const lfoGain = context.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 0.12
    lfo.connect(lfoGain).connect(masterGain.gain)

    source.connect(filter).connect(masterGain)
    source.start()
    lfo.start()

    registerSoundDisposer(() => {
      try { source.stop() } catch (error) {}
      try { source.disconnect() } catch (error) {}
      try { lfo.stop() } catch (error) {}
      try { lfo.disconnect() } catch (error) {}
      try { lfoGain.disconnect() } catch (error) {}
      try { filter.disconnect() } catch (error) {}
    })
    return
  }

  if (presetId === 'rain') {
    const source = context.createBufferSource()
    source.buffer = createNoiseBuffer(context, 2)
    source.loop = true

    const filter = context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1600

    const lfo = context.createOscillator()
    const lfoGain = context.createGain()
    lfo.frequency.value = 0.18
    lfoGain.gain.value = 0.08
    lfo.connect(lfoGain).connect(masterGain.gain)

    source.connect(filter).connect(masterGain)
    source.start()
    lfo.start()

    registerSoundDisposer(() => {
      try { source.stop() } catch (error) {}
      try { source.disconnect() } catch (error) {}
      try { lfo.stop() } catch (error) {}
      try { lfo.disconnect() } catch (error) {}
      try { lfoGain.disconnect() } catch (error) {}
      try { filter.disconnect() } catch (error) {}
    })
    return
  }

  if (presetId === 'crackle') {
    const scheduleCrackle = () => {
      const burstSource = context.createBufferSource()
      burstSource.buffer = createNoiseBuffer(context, 0.18)

      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 2400
      filter.Q.value = 0.9

      const burstGain = context.createGain()
      burstGain.gain.setValueAtTime(0.0001, context.currentTime)
      burstGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.22), context.currentTime + 0.02)
      burstGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18)

      burstSource.connect(filter).connect(burstGain).connect(masterGain)
      burstSource.start()
      burstSource.stop(context.currentTime + 0.2)

      registerSoundDisposer(() => {
        try { burstSource.stop() } catch (error) {}
        try { burstSource.disconnect() } catch (error) {}
        try { burstGain.disconnect() } catch (error) {}
        try { filter.disconnect() } catch (error) {}
      })
    }

    scheduleCrackle()
    const timerId = setInterval(() => {
      scheduleCrackle()
    }, 850)
    activeSoundTimers.push(timerId)
    registerSoundDisposer(() => clearInterval(timerId))
    return
  }

  const source = context.createBufferSource()
  source.buffer = createNoiseBuffer(context, 2)
  source.loop = true

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 780

  const warmOsc = context.createOscillator()
  const warmGain = context.createGain()
  warmOsc.frequency.value = 92
  warmGain.gain.value = 0.025
  warmOsc.connect(warmGain).connect(masterGain)

  const lfo = context.createOscillator()
  const lfoGain = context.createGain()
  lfo.frequency.value = 0.14
  lfoGain.gain.value = 0.06
  lfo.connect(lfoGain).connect(masterGain.gain)

  source.connect(filter).connect(masterGain)
  source.start()
  warmOsc.start()
  lfo.start()

  registerSoundDisposer(() => {
    try { source.stop() } catch (error) {}
    try { source.disconnect() } catch (error) {}
    try { warmOsc.stop() } catch (error) {}
    try { warmOsc.disconnect() } catch (error) {}
    try { warmGain.disconnect() } catch (error) {}
    try { lfo.stop() } catch (error) {}
    try { lfo.disconnect() } catch (error) {}
    try { lfoGain.disconnect() } catch (error) {}
    try { filter.disconnect() } catch (error) {}
  })
}

// Texture file paths grouped by surface type
const wallpaperPath = '/textures/walls/wallpaper.svg'
const woodPath = '/textures/floors/wood.svg'
const stonePath = '/textures/floors/stone.svg'

const defaultWallMaterials = [
  { id: 'whitepaper', label: 'White paper', roughness: 0.92, metalness: 0.01, map: '/textures/walls/wallpaper_whitepaper.jpg', repeat: [0.95, 1.3] },
  { id: 'pinkbrick', label: 'Pink brick', roughness: 0.7, metalness: 0.02, map: '/textures/walls/wallpaper_pinkbrick.jpg', repeat: [1.18, 0.98] },
  { id: 'greybrick', label: 'Grey brick', roughness: 0.78, metalness: 0.02, map: '/textures/walls/wallpaper_greybrick.jpg', repeat: [1.12, 0.98] },
]

const defaultFloorMaterials = [
  { id: 'wood_white', label: 'White beach wood', roughness: 0.6, metalness: 0.03, map: '/textures/floors/wood_whitebeach.jpg', repeat: [1.28, 1.0] },
  { id: 'wood_dark', label: 'Dark brown wood', roughness: 0.55, metalness: 0.03, map: '/textures/floors/wood_darkbrown.jpg', repeat: [1.18, 1.0] },
  { id: 'wood_bw', label: 'Black/white wood', roughness: 0.6, metalness: 0.03, map: '/textures/floors/wood_blackwhites.jpg', repeat: [1.24, 1.0] },
]

const roomThemePresets = [
  {
    id: 'soft-pink',
    name: 'Zacht roze',
    wallShades: ['#fde8ef', '#f8bfd0', '#f2afc7', '#e78ead', '#c66f8f'],
    floorShades: ['#eceff2', '#d8dde3', '#c5ccd4', '#adb7c1', '#8e9aa7'],
    trim: '#f6e9f0',
  },
  {
    id: 'warm-sand',
    name: 'Warm zand',
    wallShades: ['#f9efe1', '#f3e0c6', '#ebceaa', '#dcb886', '#c99b5f'],
    floorShades: ['#f0e7db', '#ddd1c0', '#c8b39a', '#b09375', '#927458'],
    trim: '#f6efe6',
  },
  {
    id: 'cool-pearl',
    name: 'Koel parel',
    wallShades: ['#fbfcfe', '#f5f7fb', '#e7ecf2', '#d8e0e9', '#c2cfdb'],
    floorShades: ['#eff3f6', '#dde3e9', '#c9d2db', '#b1bcc7', '#95a3b1'],
    trim: '#e7ecf2',
  },
  {
    id: 'sage-mist',
    name: 'Saliegroen',
    wallShades: ['#eef3ee', '#dce8db', '#c5d4c6', '#aebcae', '#8f9e90'],
    floorShades: ['#edf0ea', '#d8dfd4', '#c2cbbe', '#aab6a6', '#8f9b8d'],
    trim: '#eef3ee',
  },
  {
    id: 'dusty-rose',
    name: 'Stofroze',
    wallShades: ['#f9ebef', '#efc7d2', '#e4a7b8', '#cd8399', '#b25f76'],
    floorShades: ['#ede7e6', '#d8cecb', '#c0b2ae', '#a58f8b', '#8b716f'],
    trim: '#f4e7ec',
  },
  {
    id: 'linen-cloud',
    name: 'Linnen',
    wallShades: ['#fcf7ef', '#f4ead8', '#e7d9c3', '#d4c1a6', '#bea384'],
    floorShades: ['#f1ece4', '#ddd6ca', '#c6b8a4', '#aa9780', '#8d7b68'],
    trim: '#f7f0e5',
  },
  {
    id: 'mist-blue',
    name: 'Mistblauw',
    wallShades: ['#f4f8fb', '#dfeaf2', '#c8dae7', '#a9c1d4', '#879fb9'],
    floorShades: ['#edf2f6', '#d8e1e8', '#c0cdd8', '#a6b5c5', '#8796a8'],
    trim: '#eaf1f6',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    wallShades: ['#f9ece5', '#e9c4b3', '#d79e85', '#bf7a61', '#9f5b45'],
    floorShades: ['#efe1d7', '#dbc4b3', '#c4a08d', '#a97c67', '#88614f'],
    trim: '#f4e7de',
  },
  {
    id: 'charcoal-silk',
    name: 'Zijdegrijs',
    wallShades: ['#f4f4f5', '#e2e4e8', '#c9cdd4', '#a6adb8', '#7f8894'],
    floorShades: ['#ececef', '#d8dbe0', '#c0c5cf', '#a2a9b5', '#808998'],
    trim: '#eef0f3',
  },
]

const getRoomThemePreset = (presetId) => roomThemePresets.find(theme => theme.id === presetId) || roomThemePresets[0]
// ensure materials are always available on the preset object
const getRoomThemePresetWithMaterials = (presetId) => {
  const base = getRoomThemePreset(presetId)
  return {
    ...base,
    wallMaterials: base.wallMaterials || defaultWallMaterials,
    floorMaterials: base.floorMaterials || defaultFloorMaterials,
  }
}

const clampShadeIndex = (index, maxIndex) => {
  const numericIndex = Number.isFinite(Number(index)) ? Number(index) : 2
  return Math.min(Math.max(numericIndex, 0), maxIndex)
}

const normalizeRoomThemeState = (value) => {
  if (typeof value === 'string') {
    return {
      presetId: value,
      wallShadeIndex: 2,
      floorShadeIndex: 2,
    }
  }

  const presetId = value?.presetId || 'soft-pink'
  const preset = getRoomThemePresetWithMaterials(presetId)
  return {
    presetId,
    wallShadeIndex: clampShadeIndex(value?.wallShadeIndex, preset.wallShades.length - 1),
    floorShadeIndex: clampShadeIndex(value?.floorShadeIndex, preset.floorShades.length - 1),
    wallMaterialIndex: clampShadeIndex(value?.wallMaterialIndex ?? 0, (preset.wallMaterials || defaultWallMaterials).length - 1),
    floorMaterialIndex: clampShadeIndex(value?.floorMaterialIndex ?? 0, (preset.floorMaterials || defaultFloorMaterials).length - 1),
    useTextures: typeof value?.useTextures === 'boolean' ? value.useTextures : true,
    useColor: typeof value?.useColor === 'boolean' ? value.useColor : true,
  }
}

const objectColorPalette = ['#3c3c3c', '#8d8d8d', '#f2f2f2', '#c8a4b8', '#a8d7ef', '#a8d7b4', '#d7b98f', '#f0d89a']
const colorableAssetIds = new Set([
  'candle',
  'photo-frame',
  'flower',
  'lamp_floor_01',
  'lamp_table_01',
  'lamp_hanging_01',
  'tv_01',
  'laptop_01',
  'easel_01',
  'ball_01',
  'chair_01',
  'table_01',
  'sofa_01',
  'plant_01',
  'plant_02',
  'speaker_01',
  'lamp_01',
  'guitar_01',
  'bike_01',
  'car_01',
  'bookshelf_01',
  'desk_01',
  'desk_chair_01',
  'office_chair_01',
  'carpet_01',
  'side_chair_01',
])

const canEditSelectedObjectColor = computed(() => colorableAssetIds.has(selectedSceneObjectType.value))

const normalizeHexColor = (value) => {
  try {
    return `#${new THREE.Color(value).getHexString()}`
  } catch (e) {
    return '#3c3c3c'
  }
}

const isValidHexColor = (value) => {
  if (!value || typeof value !== 'string') return false
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

// Only persist a flat color for assets that are meant to behave like a single
// colored object. Furniture-like models keep their own materials so they don't
// get flattened into one dark tone on reload.
const shouldPersistColorForAsset = (assetId) => {
  return new Set([
    'candle',
    'photo-frame',
    'flower',
    'lamp_floor_01',
    'lamp_table_01',
    'lamp_hanging_01',
    'tv_01',
    'laptop_01',
    'easel_01',
    'ball_01',
  ]).has(assetId)
}

const extractObjectColor = (object) => {
  let currentObject = object

  while (currentObject) {
    if (currentObject.isMesh && currentObject.material) {
      const material = Array.isArray(currentObject.material) ? currentObject.material[0] : currentObject.material
      if (material && material.color) {
        return `#${material.color.getHexString()}`
      }
    }

    currentObject = currentObject.parent
  }

  return '#3c3c3c'
}

const applyColorToObject = (object, colorValue) => {
  const normalizedColor = normalizeHexColor(colorValue)

  if (!object) {
    return normalizedColor
  }

  object.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]

    materials.forEach((material) => {
      if (!material || !material.color) {
        return
      }

      material.color.set(normalizedColor)
      material.needsUpdate = true
    })
  })

  return normalizedColor
}

const applyColorToSelectedObject = (colorValue) => {
  const record = selectedSceneObject.value

  if (!record?.object || !canEditSelectedObjectColor.value) {
    return
  }

  pushUndoSnapshot()
  const normalizedColor = applyColorToObject(record.object, colorValue)
  record.color = normalizedColor
  selectedSceneObjectColor.value = normalizedColor
  persistCurrentRoomScene()
}

const openColorPicker = () => {
  try { colorInputRef.value?.click?.() } catch (e) {}
}

// Available models for the asset panel
const availableAssets = [
  { id: 'candle', name: 'Kaars', icon: '🕯️', file: '/models/candle.glb' },
  { id: 'photo-frame', name: 'Fotolijst', icon: '🖼️', file: '/models/photo-frame.glb' },
  { id: 'flower', name: 'Bloem', icon: '🌹', file: '/models/flower.glb' },
  { id: 'chair_01', name: 'Stoel', icon: '💺', file: '/models/chair_01.glb' },
  { id: 'table_01', name: 'Bijzettafel', icon: '🛋️', file: '/models/table_01.glb' },
  { id: 'bookshelf_01', name: 'Boekenkast', icon: '📚', file: '/models/bookshelf_01.glb' },
  { id: 'desk_01', name: 'Bureau', icon: '🧑‍💻', file: '/models/desk_01.glb' },
  { id: 'desk_chair_01', name: 'Bureaustoel', icon: '💺', file: '/models/desk_chair_01.glb' },
  { id: 'sofa_01', name: 'Bank', icon: '🛋️', file: '/models/sofa_01.glb' },
  { id: 'carpet_01', name: 'Tapijt', icon: '🟪', file: '/models/carpet_01.glb' },
  { id: 'side_chair_01', name: 'Bijzetstoel', icon: '🪑', file: '/models/side_chair_01.glb' },
]

// Serialize scene state to JSON for localStorage
const serializeSceneState = () => {
  const state = {
    version: 1,
    timestamp: new Date().toISOString(),
      objects: sceneObjects.value.map(record => {
      const rawColor = record.color || extractObjectColor(record.object)
      const color = shouldPersistColorForAsset(record.assetId) && isValidHexColor(rawColor) ? rawColor : null
      return {
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
        color,
        hidden: !!record.hidden,
      }
    }),
  }
  return JSON.stringify(state)
}

const getRoomSceneStorageKey = () => `audreyRoomScene_${props.roomId || 'default'}`

const persistCurrentRoomScene = (serializedState = null) => {
  try {
    const payload = serializedState || serializeSceneState()
    localStorage.setItem(getRoomSceneStorageKey(), payload)
  } catch (e) {}
}

const pushUndoSnapshot = () => {
  if (!room || isApplyingHistory.value) return
  try {
    const snapshot = serializeSceneState()
    const previous = undoStack.value[undoStack.value.length - 1]
    if (previous === snapshot) return
    undoStack.value.push(snapshot)
    if (undoStack.value.length > maxUndoSteps) {
      undoStack.value.shift()
    }
    redoStack.value = []
  } catch (e) {}
}

const undoSceneChange = async () => {
  if (!undoStack.value.length || isApplyingHistory.value) return
  const previousSnapshot = undoStack.value.pop()
  if (!previousSnapshot) return

  try {
    const currentSnapshot = serializeSceneState()
    redoStack.value.push(currentSnapshot)
    isApplyingHistory.value = true
    const success = await deserializeSceneState(previousSnapshot)
    if (success) {
      persistCurrentRoomScene(previousSnapshot)
      showNotification('Eén stap terug', 'info', 1800)
    }
  } catch (e) {
    console.error('Undo failed', e)
  } finally {
    isApplyingHistory.value = false
  }
}

const redoSceneChange = async () => {
  if (!redoStack.value.length || isApplyingHistory.value) return
  const nextSnapshot = redoStack.value.pop()
  if (!nextSnapshot) return

  try {
    const currentSnapshot = serializeSceneState()
    undoStack.value.push(currentSnapshot)
    isApplyingHistory.value = true
    const success = await deserializeSceneState(nextSnapshot)
    if (success) {
      persistCurrentRoomScene(nextSnapshot)
      showNotification('Eén stap vooruit', 'info', 1800)
    }
  } catch (e) {
    console.error('Redo failed', e)
  } finally {
    isApplyingHistory.value = false
  }
}

const openResetRoomConfirm = () => {
  if (!canEditSceneObjects.value) return
  showResetRoomModal.value = true
}

const cancelResetRoom = () => {
  showResetRoomModal.value = false
}

const confirmResetRoom = () => {
  if (!canEditSceneObjects.value) return
  showResetRoomModal.value = false

  pushUndoSnapshot()
  clearRoomContent()

  // Ensure the room keeps a neutral look: no textures and neutral grey tones.
  roomTheme.value = normalizeRoomThemeState({
    ...roomTheme.value,
    useTextures: false,
    useColor: false,
  })
  applyRoomTheme(roomTheme.value)

  roomEmpty.value = true
  saveRoomMeta()

  const emptyScene = JSON.stringify({ version: 1, timestamp: new Date().toISOString(), objects: [] })
  persistCurrentRoomScene(emptyScene)
  showNotification('Kamer is gereset', 'success', 2600)
}

const getRoomIdKey = () => props.roomId || 'default'

const roomMetaStorageKey = () => `audreyRoom_${getRoomIdKey()}`

const roomMembersStorageKey = () => `audreyRoomMembers_${getRoomIdKey()}`

const normalizeRoomMemberRecord = (member) => ({
  id: member.id,
  email: member.email || '',
  role: member.role || 'editor',
  displayName: member.display_name || member.displayName || '',
  avatar: member.avatar || '',
  onboarded: member.onboarded !== false,
  status: member.status || 'active',
  createdByMe: !!member.createdByMe,
})

const syncRoomMetaToSupabase = async () => {
  console.log('syncRoomMetaToSupabase called')
  console.log('props.roomId:', props.roomId)

  const supabase = getSupabase()

  if (!supabase) {
    console.log('No Supabase client found')
    return
  }

  if (!props.roomId) {
    console.log('No roomId found')
    return
  }

  try {
    console.log('ABOUT TO UPSERT ROOM', {
    roomId: props.roomId,
    name: roomName.value,
    privacy: roomPrivacy.value,
})
    const { data, error } = await supabase
      .from('rooms')
      .upsert({
        id: props.roomId,
        name: roomName.value,
        privacy: roomPrivacy.value,
        invite_code: roomInviteCode.value || null,
        theme: roomTheme.value,
        empty_room: roomEmpty.value,
      })
      .select()

    console.log('SUPABASE INSERT DATA:', data)
    console.log('SUPABASE INSERT ERROR:', error)
    
    console.log('ROOM UPSERT')
    console.log('DATA:', data)
    console.log('ERROR:', error)

  } catch (e) {
    console.error('UPSERT EXCEPTION:', e)
  }
}

const syncRoomMembersToSupabase = async () => {
  const supabase = getSupabase()
  if (!supabase || !props.roomId) return

  try {
    for (const member of roomMembers.value) {
      await supabase.from('room_members').upsert({
        id: member.id,
        room_id: props.roomId,
        email: member.email || '',
        role: member.role || 'editor',
        display_name: member.displayName || '',
        avatar: member.avatar || '',
        onboarded: member.onboarded !== false,
        status: member.status || 'active',
      })
    }
  } catch (e) {}
}

// Load/save basic room metadata (privacy & invite code) from Supabase with a local fallback.
const loadRoomMeta = async () => {
  const id = getRoomIdKey()
  try {
    const stored = localStorage.getItem(roomMetaStorageKey())
    if (stored) {
      const data = JSON.parse(stored)
      roomPrivacy.value = data.privacy || 'private'
      roomInviteCode.value = data.inviteCode || null
      roomName.value = data.name || ''
      roomTheme.value = normalizeRoomThemeState(data.theme || roomTheme.value)
      // if the room was created as an intentionally empty room, persist that flag
      roomEmpty.value = !!data.emptyRoom
    } else {
      roomPrivacy.value = 'private'
      roomInviteCode.value = null
      roomName.value = ''
      roomTheme.value = normalizeRoomThemeState('soft-pink')
      roomEmpty.value = false
    }
  } catch (e) {
    roomPrivacy.value = 'private'
    roomInviteCode.value = null
    roomName.value = ''
    roomTheme.value = normalizeRoomThemeState('soft-pink')
    roomEmpty.value = false
  }

  const supabase = getSupabase()
  if (supabase && props.roomId) {
    try {
      const { data } = await supabase
        .from('rooms')
        .select('id,name,privacy,invite_code,theme,empty_room')
        .eq('id', props.roomId)
        .maybeSingle()

      if (data) {
        roomPrivacy.value = data.privacy || roomPrivacy.value || 'private'
        roomInviteCode.value = data.invite_code || null
        roomName.value = data.name || roomName.value || ''
        roomTheme.value = normalizeRoomThemeState(data.theme || roomTheme.value)
        roomEmpty.value = !!data.empty_room
      }
    } catch (e) {}
  }

  // load members
  try {
    const mem = localStorage.getItem(roomMembersStorageKey())
    roomMembers.value = mem ? JSON.parse(mem) : []
  } catch (e) {
    roomMembers.value = []
  }

  if (supabase && props.roomId) {
    try {
      const { data } = await supabase
        .from('room_members')
        .select('id,email,role,display_name,avatar,onboarded,status')
        .eq('room_id', props.roomId)

      if (Array.isArray(data)) {
        roomMembers.value = data.map(normalizeRoomMemberRecord)
      }
    } catch (e) {}
  }
  // analytics: room opened
  try { logEvent('room.opened', { roomId: id, privacy: roomPrivacy.value }) } catch (e) {}
}

const saveRoomMeta = async () => {
  const id = getRoomIdKey()
  try {
    localStorage.setItem(roomMetaStorageKey(), JSON.stringify({ privacy: roomPrivacy.value, inviteCode: roomInviteCode.value, name: roomName.value, theme: roomTheme.value, emptyRoom: roomEmpty.value }))
  } catch (e) {}
  try {
    localStorage.setItem(roomMembersStorageKey(), JSON.stringify(roomMembers.value))
  } catch (e) {}

  await syncRoomMetaToSupabase()
  await syncRoomMembersToSupabase()

  // notify parent that room metadata changed (e.g., name)
  try { emit('room-updated', { id, name: roomName.value }) } catch (e) {}

}

const generateInviteCode = () => {
  if (!props.currentUser || effectiveRole.value !== 'admin') {
    alert('Alleen de eigenaar van de kamer kan uitnodigingscodes genereren (demo).')
    return
  }
  const code = `INV-${Math.random().toString(36).substring(2,8).toUpperCase()}`
  roomInviteCode.value = code
  saveRoomMeta()
  // show inline success message in room settings modal
  roomSettingsSuccess.value = `Uitnodigingscode gegenereerd: ${code}`
  roomSettingsError.value = ''
}

const loadRoomMembers = () => {
  void (async () => {
    const id = getRoomIdKey()
    try {
      const mem = localStorage.getItem(roomMembersStorageKey())
      roomMembers.value = mem ? JSON.parse(mem) : []
    } catch (e) {
      roomMembers.value = []
    }

    const supabase = getSupabase()
    if (supabase && props.roomId) {
      try {
        const { data } = await supabase
          .from('room_members')
          .select('id,email,role,display_name,avatar,onboarded,status')
          .eq('room_id', props.roomId)

        if (Array.isArray(data)) {
          roomMembers.value = data.map(normalizeRoomMemberRecord)
        }
      } catch (e) {}
    }
  })()
}

const saveRoomMembers = () => {
  const id = getRoomIdKey()
  try {
    localStorage.setItem(roomMembersStorageKey(), JSON.stringify(roomMembers.value))
  } catch (e) {}
  void syncRoomMembersToSupabase()
}

const applyRoomTheme = (themeUpdate, persist = true) => {
  const incomingTheme = typeof themeUpdate === 'string' ? { presetId: themeUpdate } : themeUpdate || {}
  const presetChanged = incomingTheme.presetId && incomingTheme.presetId !== roomTheme.value.presetId

  const nextTheme = normalizeRoomThemeState({
    ...roomTheme.value,
    ...incomingTheme,
    ...(presetChanged && incomingTheme.wallShadeIndex === undefined && incomingTheme.floorShadeIndex === undefined
      ? { wallShadeIndex: 2, floorShadeIndex: 2 }
      : {}),
  })

  const preset = getRoomThemePresetWithMaterials(nextTheme.presetId)
  const wallColor = preset.wallShades[nextTheme.wallShadeIndex] || preset.wallShades[2] || preset.wallShades[0]
  const floorColor = preset.floorShades[nextTheme.floorShadeIndex] || preset.floorShades[2] || preset.floorShades[0]

  // prepare variant descriptors early so they can be referenced when toggling color
  const wallVariant = (preset.wallMaterials || defaultWallMaterials)[nextTheme.wallMaterialIndex || 0]
  const floorVariant = (preset.floorMaterials || defaultFloorMaterials)[nextTheme.floorMaterialIndex || 0]

  roomTheme.value = nextTheme

  if (floorMaterial?.color) {
    if (nextTheme.useColor !== false) {
      floorMaterial.color.set(floorColor)
    } else {
      // use a slightly darker neutral color so textures don't appear overly bright
      floorMaterial.color.set('#e6e6e6')
      // increase roughness a bit to make the surface more matte when color is disabled
      if (typeof floorVariant?.roughness === 'number') {
        floorMaterial.roughness = Math.min(1, (floorVariant.roughness || 0.8) + 0.12)
      } else {
        floorMaterial.roughness = Math.min(1, floorMaterial.roughness + 0.12)
      }
    }
  }

  if (wallMaterial?.color) {
    if (nextTheme.useColor !== false) {
      wallMaterial.color.set(wallColor)
    } else {
      // use a slightly darker neutral color so textures don't appear overly bright
      wallMaterial.color.set('#e6e6e6')
      // increase roughness a bit to make the surface more matte when color is disabled
      if (typeof wallVariant?.roughness === 'number') {
        wallMaterial.roughness = Math.min(1, (wallVariant.roughness || 0.8) + 0.12)
      } else {
        wallMaterial.roughness = Math.min(1, wallMaterial.roughness + 0.12)
      }
    }
  }

  if (trimMaterial?.color) {
    trimMaterial.color.set(preset.trim)
  }

  // Apply simple material variant settings (roughness / metalness)
  try {

    if (wallMaterial) {
      if (wallVariant?.roughness !== undefined) wallMaterial.roughness = wallVariant.roughness
      if (wallVariant?.metalness !== undefined) wallMaterial.metalness = wallVariant.metalness
      // handle texture map for wall variant depending on useTextures flag
      if (nextTheme.useTextures && wallVariant?.map) {
        try {
          photoTextureLoader.load(wallVariant.map, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            // use per-texture repeat when provided, otherwise default to a single stretch
            const wRepeat = Array.isArray(wallVariant.repeat) ? wallVariant.repeat : [1, 1]
            tex.repeat.set(wRepeat[0], wRepeat[1])
            tex.encoding = THREE.sRGBEncoding
            wallMaterial.map = tex
            wallMaterial.needsUpdate = true
          }, undefined, () => {})
        } catch (e) {
          wallMaterial.map = null
        }
      } else {
        if (wallMaterial.map) wallMaterial.map = null
        wallMaterial.needsUpdate = true
      }
    }

    if (floorMaterial) {
      if (floorVariant?.roughness !== undefined) floorMaterial.roughness = floorVariant.roughness
      if (floorVariant?.metalness !== undefined) floorMaterial.metalness = floorVariant.metalness
      // handle texture map for floor variant
      if (nextTheme.useTextures && floorVariant?.map) {
        try {
          photoTextureLoader.load(floorVariant.map, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            const fRepeat = Array.isArray(floorVariant.repeat) ? floorVariant.repeat : [1, 1]
            tex.repeat.set(fRepeat[0], fRepeat[1])
            tex.encoding = THREE.sRGBEncoding
            floorMaterial.map = tex
            floorMaterial.needsUpdate = true
          }, undefined, () => {})
        } catch (e) {
          floorMaterial.map = null
        }
      } else {
        if (floorMaterial.map) floorMaterial.map = null
        floorMaterial.needsUpdate = true
      }
    }
  } catch (e) {
    // ignore variant application errors
  }

  if (persist) {
    saveRoomMeta()
  }
}

const inviteMember = () => {
  const email = inviteEmail.value.trim()
  if (!email) return alert('Geef een e-mailadres op om uit te nodigen')

  if (inviteRole.value === 'viewer' && roomPrivacy.value !== 'private') {
    return alert('Viewer-uitnodigingen kunnen alleen als de kamer privé is.')
  }

  const id = `m_${Date.now()}`
  const member = { id, email, role: inviteRole.value || 'editor', status: 'invited' }
  roomMembers.value.push(member)
  saveRoomMembers()
  inviteEmail.value = ''
  inviteRole.value = 'editor'
  try { logEvent('member.invited', { memberId: member.id, role: member.role }) } catch (e) {}
  alert('Member invited (demo): ' + member.email)
}

const getMemberRoleLabel = (role) => {
  if (role === 'viewer') return 'Viewer'
  if (role === 'admin') return 'Admin'
  return 'Co-editor'
}

const removeMember = (id) => {
  if (!confirm('Dit lid verwijderen uit de kamer?')) return
  const removed = roomMembers.value.find(m => m.id === id)
  roomMembers.value = roomMembers.value.filter(m => m.id !== id)
  saveRoomMembers()
  try { logEvent('member.removed', { memberId: id, role: removed ? removed.role : undefined }) } catch (e) {}
}

const toggleBlockMember = (id) => {
  const m = roomMembers.value.find(x => x.id === id)
  if (!m) return
  m.status = m.status === 'blocked' ? 'active' : 'blocked'
  saveRoomMembers()
  try { logEvent('member.toggled_block', { memberId: id, newStatus: m.status }) } catch (e) {}
}

const handleApplyRoomTheme = (themeUpdate) => {
  pushUndoSnapshot()
  applyRoomTheme(themeUpdate)
  persistCurrentRoomScene()
}

const handleApplySound = async (soundUpdate) => {
  const nextSettings = {
    ...soundSettings.value,
    ...soundUpdate,
    volume: Math.max(0, Math.min(1, Number(soundUpdate?.volume ?? soundSettings.value.volume ?? 0.45))),
  }

  soundSettings.value = nextSettings

  try {
    localStorage.setItem('audreySoundSettings', JSON.stringify(nextSettings))
  } catch (error) {}

  await startSoundPreset(nextSettings)
}

const deleteRoom = () => {
  // require typed confirmation of room id or DELETE
  const id = props.roomId || 'default'
  if (!deleteConfirmText.value || deleteConfirmText.value !== 'DELETE') {
    return alert("Typ DELETE in het bevestigingsvak om het verwijderen van de kamer te bevestigen")
  }
  try {
    localStorage.removeItem(roomMetaStorageKey())
    localStorage.removeItem(roomMembersStorageKey())
  } catch (e) {}
  const supabase = getSupabase()
  if (supabase) {
    void supabase.from('room_members').delete().eq('room_id', id).catch((e) => console.error(e))
    void supabase.from('rooms').delete().eq('id', id).catch((e) => console.error(e))
  }
  try { logEvent('room.deleted', { roomId: id }) } catch (e) {}
  showRoomSettingsModal.value = false
  emit('room-deleted', id)
  alert('Kamer verwijderd (demo).')
}

// Deserialize scene state from JSON and rebuild scene
const deserializeSceneState = async (jsonString) => {
  try {
    const state = JSON.parse(jsonString)
    if (state.version !== 1) {
      console.error('Unknown scene state version')
      return false
    }

    // Clear existing dynamic room content so the loaded save replaces the
    // current scene instead of stacking on top of it.
    clearRoomContent()

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
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { photoCard.visible = false } catch (e) {}
        }
      } else if (objData.assetId === 'audio' && objData.audioData) {
        const audioCard = createAudioCard(objData.audioData)
        audioCard.position.set(objData.position.x, objData.position.y, objData.position.z)
        audioCard.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        audioCard.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(audioCard)
        createSceneObjectRecord(audioCard, objData.assetId, { audioData: objData.audioData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        audioCard.userData.sceneObjectId = objData.id
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { audioCard.visible = false } catch (e) {}
        }
      } else if (objData.assetId === 'video' && objData.videoData) {
        const videoCard = createVideoCard(objData.videoData)
        videoCard.position.set(objData.position.x, objData.position.y, objData.position.z)
        videoCard.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        videoCard.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(videoCard)
        createSceneObjectRecord(videoCard, objData.assetId, { videoData: objData.videoData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        videoCard.userData.sceneObjectId = objData.id
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { videoCard.visible = false } catch (e) {}
        }
      } else if (objData.assetId === 'message' && objData.messageData) {
        const messageGroup = new THREE.Group()
        messageGroup.position.set(objData.position.x, objData.position.y, objData.position.z)
        messageGroup.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        messageGroup.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(messageGroup)
        createSceneObjectRecord(messageGroup, objData.assetId, { messageData: objData.messageData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        messageGroup.userData.sceneObjectId = objData.id
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { messageGroup.visible = false } catch (e) {}
        }
      } else if (objData.assetId === 'candle' && objData.candleData) {
        const candleGroup = new THREE.Group()

        const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32)
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8 })
        const base = new THREE.Mesh(baseGeometry, baseMaterial)
        base.castShadow = true
        base.receiveShadow = true
        base.position.y = 0.025
        candleGroup.add(base)

        let candleHeight = 0.4
        if (objData.candleData.size?.id === 'small') candleHeight = 0.3
        if (objData.candleData.size?.id === 'large') candleHeight = 0.6

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

        const flameGeometry = new THREE.ConeGeometry(0.04, 0.15, 8)
        const flameMaterial = new THREE.MeshStandardMaterial({
          color: 0xffa500,
          emissive: 0xffff00,
          emissiveIntensity: 0.8,
        })
        const flame = new THREE.Mesh(flameGeometry, flameMaterial)
        flame.position.y = 0.05 + candleHeight + 0.1
        candleGroup.add(flame)

        candleGroup.position.set(objData.position.x, objData.position.y, objData.position.z)
        candleGroup.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        candleGroup.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)
        room.add(candleGroup)
        createSceneObjectRecord(candleGroup, objData.assetId, { candleData: objData.candleData })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        candleGroup.userData.sceneObjectId = objData.id
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { candleGroup.visible = false } catch (e) {}
        }
      } else if (objData.assetId && colorableAssetIds.has(objData.assetId)) {
        let model = null

        // Prefer loading the original GLB asset when available so saved scenes
        // restore the same model/materials as when originally placed. Fall
        // back to the procedural placeholder only if loading fails or the
        // asset file is missing.
        const asset = availableAssets.find(a => a.id === objData.assetId)
        try {
            if (asset && asset.file) {
              const gltf = await tryLoadGLB(asset.file)
              if (gltf && gltf.scene) {
                model = gltf.scene.clone()
              } else {
                model = createPlaceholderModel(objData.assetId)
              }
            } else {
              // No GLB provided — use placeholder
              model = createPlaceholderModel(objData.assetId)
            }
        } catch (error) {
          console.log(`Failed to load GLB for ${objData.assetId}, creating placeholder`, error)
          model = createPlaceholderModel(objData.assetId)
        }

        model.position.set(objData.position.x, objData.position.y, objData.position.z)
        model.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z)
        model.scale.set(objData.scale.x, objData.scale.y, objData.scale.z)

        if (objData.color && shouldPersistColorForAsset(objData.assetId)) {
          if (isValidHexColor(objData.color)) {
            applyColorToObject(model, objData.color)
          } else {
            console.warn('Skipped applying invalid color on load:', objData.color)
          }
        }

        room.add(model)
        createSceneObjectRecord(model, objData.assetId, { color: objData.color || extractObjectColor(model) })
        sceneObjects.value[sceneObjects.value.length - 1].id = objData.id
        model.userData.sceneObjectId = objData.id
        if (objData.hidden) {
          sceneObjects.value[sceneObjects.value.length - 1].hidden = true
          try { model.visible = false } catch (e) {}
        }
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

    // Save a versioned history entry (keeps last N entries)
    const historyKey = 'memorialSceneHistory'
    let history = []
    try { history = JSON.parse(localStorage.getItem(historyKey) || '[]') } catch (e) { history = [] }
    const entry = { id: Date.now(), savedAt: new Date().toISOString(), label: `Versie ${history.length + 1}`, data: serialized }
    history.unshift(entry)
    // keep only last 10 saves to avoid uncontrolled growth
    history = history.slice(0, 10)
    try { localStorage.setItem(historyKey, JSON.stringify(history)) } catch (e) {}

    // Also keep the legacy single-key for compatibility
    localStorage.setItem('memorialScene', serialized)
    persistCurrentRoomScene(serialized)
    try { logEvent('scene.saved', { objectCount: sceneObjects.value.length }) } catch (e) {}
    // refresh in-memory list
    loadSavedScenes()
    showNotification('Scène succesvol opgeslagen!', 'success', 8000, '(versie toegevoegd)')
  } catch (error) {
    console.error('Failed to save scene:', error)
    showNotification('Opslaan van scène is mislukt', 'error')
  }
}

// Load scene from localStorage
const loadSceneFromStorage = async () => {
  try {
    const stored = localStorage.getItem('memorialScene')
    if (!stored) {
      showNotification('Geen opgeslagen scène gevonden', 'info')
      return
    }
    const success = await deserializeSceneState(stored)
    if (success) {
      try { logEvent('scene.loaded', { objectCount: sceneObjects.value.length }) } catch (e) {}
      showNotification('Scène succesvol geladen!', 'success')
    } else {
      showNotification('Laden van scène is mislukt', 'error')
    }
  } catch (error) {
    console.error('Failed to load scene:', error)
    alert('Laden van scène is mislukt')
  }
}

// --- Versioned saves helpers ---
const savedScenes = ref([])
const showVersionsPanel = ref(false)

// Inline toast notification (replaces blocking alert() calls for save/load)
const notificationMessageTitle = ref('')
const notificationMessageSub = ref('')
const notificationType = ref('info') // 'info' | 'success' | 'error'
const notificationVisible = ref(false)
let notificationTimer = null

// toast positioning: align under the top-bar (computed at show time and on resize)
const toastStyle = ref({ left: '228px', top: '86px', width: '360px' })
const computeToastPosition = () => {
  try {
    const bar = document.querySelector('.top-bar')
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const left = Math.max(12, rect.left + 20)
    const width = Math.min(320, Math.max(240, rect.width * 0.24))
    const top = Math.max(8, rect.bottom + 8)
    toastStyle.value = { left: `${left}px`, top: `${top}px`, width: `${width}px` }
  } catch (e) {
    // ignore
  }
}

const handleWindowResizeForToast = () => computeToastPosition()

const showNotification = (title, type = 'info', duration = 3000, subtitle = '') => {
  try {
    if (notificationTimer) {
      clearTimeout(notificationTimer)
      notificationTimer = null
    }
    notificationMessageTitle.value = title || ''
    notificationMessageSub.value = subtitle || ''
    notificationType.value = type || 'info'
    computeToastPosition()
    notificationVisible.value = true
    // ensure it repositions on resize while visible
    window.addEventListener('resize', handleWindowResizeForToast)
    notificationTimer = setTimeout(() => {
      notificationVisible.value = false
      notificationTimer = null
      window.removeEventListener('resize', handleWindowResizeForToast)
    }, duration)
  } catch (e) {
    // fallback to alert if something goes wrong
    try { alert(title + (subtitle ? ' ' + subtitle : '')) } catch (err) {}
  }
}

const loadSavedScenes = () => {
  try {
    const historyKey = 'memorialSceneHistory'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    // Sanitize legacy entries: normalize any saved color strings so they don't
    // overwrite valid materials with invalid/HTML values. Update history in-place.
    if (Array.isArray(history)) {
      for (let i = 0; i < history.length; i++) {
        try {
          const entry = history[i]
          const state = JSON.parse(entry.data || '{}')
          if (state && Array.isArray(state.objects)) {
            let changed = false
            state.objects = state.objects.map(obj => {
              if (obj && obj.color) {
                if (isValidHexColor(obj.color)) {
                  return obj
                } else {
                  obj.color = normalizeHexColor(obj.color)
                  changed = true
                  return obj
                }
              }
              return obj
            })
            if (changed) {
              entry.data = JSON.stringify(state)
              history[i] = entry
            }
          }
        } catch (e) {
          // ignore malformed entry
        }
      }
      try { localStorage.setItem(historyKey, JSON.stringify(history)) } catch (e) {}
    }
    savedScenes.value = Array.isArray(history) ? history : []
  } catch (e) {
    savedScenes.value = []
  }
}

onBeforeUnmount(() => {
  try {
    if (notificationTimer) {
      clearTimeout(notificationTimer)
      notificationTimer = null
    }
  } catch (e) {}
  try { window.removeEventListener('resize', handleWindowResizeForToast) } catch (e) {}
})

const loadSceneFromHistory = async (id) => {
  try {
    const historyKey = 'memorialSceneHistory'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    const entry = (history || []).find(h => h.id === id)
    if (!entry) return showNotification('Geselecteerde versie niet gevonden', 'info')
    const success = await deserializeSceneState(entry.data)
    if (success) {
      showNotification('Versie geladen', 'success', 3000, `${new Date(entry.savedAt).toLocaleString()}`)
      loadSavedScenes()
    } else {
      showNotification('Laden van geselecteerde versie is mislukt', 'error')
    }
  } catch (e) {
    console.error(e)
    alert('Fout bij laden van versie')
  }
}

const deleteSavedScene = (id) => {
  try {
    const historyKey = 'memorialSceneHistory'
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    history = (history || []).filter(h => h.id !== id)
    localStorage.setItem(historyKey, JSON.stringify(history))
    loadSavedScenes()
  } catch (e) {}
}

// initialize saved list on component setup
loadSavedScenes()

const openQuickPanel = (panelType, modelCategory = '') => {
  if (panelSwitchTimer) {
    clearTimeout(panelSwitchTimer)
    panelSwitchTimer = null
  }

  const nextModelCategory = panelType === 'models' ? modelCategory : ''

  if (activePanel.value === panelType && showQuickPanel.value && quickPanelModelCategory.value === nextModelCategory) {
    showQuickPanel.value = false
    return
  }

  if (showQuickPanel.value) {
    showQuickPanel.value = false
    panelSwitchTimer = setTimeout(() => {
      activePanel.value = panelType
      quickPanelModelCategory.value = nextModelCategory
      showQuickPanel.value = true
      panelSwitchTimer = null
    }, 120)
    return
  }

  activePanel.value = panelType
  quickPanelModelCategory.value = nextModelCategory
  showQuickPanel.value = true
}

const closeQuickPanel = () => {
  if (panelSwitchTimer) {
    clearTimeout(panelSwitchTimer)
    panelSwitchTimer = null
  }
  quickPanelModelCategory.value = ''
  showQuickPanel.value = false
}

const handlePlacePhoto = (photoData) => {
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('Gebruikers met alleen-weergave kunnen geen objecten toevoegen (demo).')
    return
  }

  pushUndoSnapshot()
  placePhotoInRoom(photoData)
  persistCurrentRoomScene()
}

const handlePlaceAudio = (audioData) => {
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('Gebruikers met alleen-weergave kunnen geen objecten toevoegen (demo).')
    return
  }
  pushUndoSnapshot()
  placeAudioInRoom(audioData)
  logModeratorPlacement('audio', audioData?.title || 'Audio toegevoegd', audioData?.text || '')
  persistCurrentRoomScene()
}

const handlePlaceVideo = (videoData) => {
  if (!scene || !room) return
  if (props.currentUser && props.currentUser.role === 'viewer') {
    alert('Gebruikers met alleen-weergave kunnen geen objecten toevoegen (demo).')
    return
  }
  pushUndoSnapshot()
  placeVideoInRoom(videoData)
  logModeratorPlacement('video', videoData?.title || 'Video toegevoegd', videoData?.text || '')
  persistCurrentRoomScene()
}

const createSceneObjectRecord = (object, assetId, payload = {}, options = {}) => {
  const id = sceneObjectIdCounter++
  object.userData.sceneObjectId = id
  Object.assign(object.userData, payload)

  const record = {
    id,
    assetId,
    object,
    position: object.position.clone(),
    rotation: object.rotation.clone(),
    scale: object.scale.clone(),
    color: payload.color || extractObjectColor(object),
    ...payload,
  }

  sceneObjects.value.push(record)

  // Do not auto-select newly placed objects by default. Selection should
  // happen explicitly when the user clicks an object in the scene to
  // open the object editor.
  if (options.select === true) {
    selectSceneObject(record)
  }

  return id
}

// Moderation helpers: soft-hide / restore scene objects
const hideSceneObject = (id) => {
  const idx = sceneObjects.value.findIndex(s => s.id === id)
  if (idx === -1) return
  const rec = sceneObjects.value[idx]
  rec.hidden = true
  try { if (rec.object) rec.object.visible = false } catch (e) {}
  try { saveSceneToStorage() } catch (e) {}
  showNotification('Item verborgen', 'info', 3000)
}

const restoreSceneObject = (id) => {
  const idx = sceneObjects.value.findIndex(s => s.id === id)
  if (idx === -1) return
  const rec = sceneObjects.value[idx]
  rec.hidden = false
  try { if (rec.object) rec.object.visible = true } catch (e) {}
  try { saveSceneToStorage() } catch (e) {}
  showNotification('Item hersteld', 'success', 3000)
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

  if (!scene || !room) return

  const asset = availableAssets.find(a => a.id === assetId)
  let model = null

    try {
      if (asset && asset.file) {
        const gltf = await tryLoadGLB(asset.file)
        if (gltf && gltf.scene) {
          model = gltf.scene.clone()
        } else {
          throw new Error('No valid GLB')
        }
      } else {
        throw new Error('No asset file')
      }
    } catch (error) {
      console.log(`Creating placeholder for ${assetId}`)
      model = createPlaceholderModel(assetId)
    }

  // Default placement in center of room
  model.position.set(Math.random() * 2 - 1, 0.5, Math.random() * 2 - 1)
  model.scale.set(1, 1, 1)

  // Enable shadows
  if (model.traverse) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  room.add(model)

  createSceneObjectRecord(model, assetId)
  logModeratorPlacement('object', asset?.name || assetId || 'Object toegevoegd', '')
}

// Handle `add-asset` emitted from AssetPanel
const handleAddAsset = (asset) => {
  if (!asset) return
  const id = asset.id || asset
  pushUndoSnapshot()
  addObjectToScene(id).then(() => {
    persistCurrentRoomScene()
  }).catch((e) => console.error(e))
  closeQuickPanel()
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
  showUserNotificationPanel.value = false
  showProfileMenu.value = true
}

const closeProfileMenu = () => {
  showProfileMenu.value = false
}

const toggleProfileMenu = () => {
  showUserNotificationPanel.value = false
  showProfileMenu.value = !showProfileMenu.value
}

const openUserNotificationPanel = () => {
  showProfileMenu.value = false
  showUserNotificationPanel.value = true
  markUserNotificationsRead()
}

const closeUserNotificationPanel = () => {
  showUserNotificationPanel.value = false
}

const toggleUserNotificationPanel = () => {
  showProfileMenu.value = false
  showUserNotificationPanel.value = !showUserNotificationPanel.value
  if (showUserNotificationPanel.value) {
    markUserNotificationsRead()
  }
}

const handleNotificationAction = (entry) => {
  if (entry?.actionRoomId) {
    emit('room-selected', entry.actionRoomId)
  } else if (entry?.roomId) {
    emit('room-selected', entry.roomId)
  }
  showUserNotificationPanel.value = false
}

const openRoomSettings = () => { showRoomSettingsModal.value = true; showProfileMenu.value = false }
const openAdminSettings = () => {
  editDisplayName.value = username.value || (props.currentUser && props.currentUser.displayName) || ''
  showAdminSettingsModal.value = true
  showProfileMenu.value = false
}
const openTutorial = () => {
  try {
    tutorialRef.value?.start()
  } catch (e) {}
  showProfileMenu.value = false
}

const handleTutorialStepChange = (payload) => {
  const step = payload?.step
  if (!step) return

  tutorialProfileMenuPinned.value = !!step.pinProfileMenuOpen

  if (step.openAdminSettingsModal) {
    showAdminSettingsModal.value = true
    showRoomSettingsModal.value = false
    showProfileMenu.value = false
  }

  if (step.openRoomSettingsModal) {
    showRoomSettingsModal.value = true
    showAdminSettingsModal.value = false
    showProfileMenu.value = false
  } else {
    showRoomSettingsModal.value = false
  }

  if (step.closeAdminSettingsModal) {
    showAdminSettingsModal.value = false
  }

  if (step.closeRoomSettingsModal) {
    showRoomSettingsModal.value = false
  }

  if (step.openProfileMenu) {
    showProfileMenu.value = true
    return
  }

  if (step.closeProfileMenu) {
    showProfileMenu.value = false
  }
}

const handleTutorialControlAction = () => {
  tutorialProfileMenuPinned.value = false
  showProfileMenu.value = false
}

const openCreateRoom = () => {
  emit('create-room')
  showAdminSettingsModal.value = false
  showProfileMenu.value = false
}

const selectRoom = (roomId) => {
  emit('room-selected', roomId)
  showAdminSettingsModal.value = false
  showProfileMenu.value = false
}
const handleLogout = async (event) => {
  if (event && event.stopPropagation) {
    event.stopPropagation()
    try { event.preventDefault() } catch (e) {}
  }
  try {
    const supabase = getSupabase()
    if (supabase && supabase.auth && supabase.auth.signOut) {
      await supabase.auth.signOut()
    }
  } catch (e) {}
  emit('logout')
  showProfileMenu.value = false
}

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

const saveRoomSettings = () => {
  // simple validation: room name should not be empty
  roomSettingsError.value = ''
  roomSettingsSuccess.value = ''
  if (!roomName.value || !roomName.value.trim()) {
    roomSettingsError.value = 'Geef een naam op voor de kamer.'
    return
  }
  // persist meta (privacy, inviteCode, name) and notify parent
  saveRoomMeta()
  roomSettingsSuccess.value = 'Kamerinstellingen opgeslagen.'
}

const handleDocumentClick = (event) => {
  const clickedProfileMenu = profileMenuElement.value && profileMenuElement.value.contains(event.target)
  const clickedAdminViewMenuMain = adminViewMenuElement.value && adminViewMenuElement.value.contains(event.target)
  const clickedAdminViewMenuTop = adminViewMenuTopElement.value && adminViewMenuTopElement.value.contains(event.target)
  const clickedAdminViewMenu = clickedAdminViewMenuMain || clickedAdminViewMenuTop
  const clickedTopNavMenu = topNavMenuElement.value && topNavMenuElement.value.contains(event.target)

  if (showProfileMenu.value && !clickedProfileMenu && !tutorialProfileMenuPinned.value) {
    closeProfileMenu()
  }

  if (showTopNavMenu.value && !clickedTopNavMenu) {
    closeTopNavMenu()
  }

  if (showAdminViewMenu.value && !clickedAdminViewMenu) {
    closeAdminViewMenu()
  }
}

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    if (showResetRoomModal.value) {
      showResetRoomModal.value = false
      return
    }
    if (!tutorialProfileMenuPinned.value) {
      closeProfileMenu()
    }
    closeTopNavMenu()
    closeAdminViewMenu()
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
  if (!canEditSceneObjects.value) {
    return
  }

  if ((event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey) {
    try { event.preventDefault() } catch (e) {}
    undoSceneChange()
    return
  }

  if ((event.ctrlKey || event.metaKey) && (key === 'y' || (key === 'z' && event.shiftKey))) {
    try { event.preventDefault() } catch (e) {}
    redoSceneChange()
    return
  }

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
  selectedSceneObjectColor.value = '#3c3c3c'
  clearSelectionHelper()
}

const formatHoverTimestamp = (value) => {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toLocaleString('nl-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// Date-only formatter for candle hover (no time)
const formatHoverDate = (value) => {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toLocaleDateString('nl-BE', {
    dateStyle: 'medium',
  })
}

const getSelectableRootObjects = () => {
  const me = props.currentUser?.id || props.currentUser?.uid || props.currentUser?.sub || props.currentUser?.email || props.currentUser?.displayName || null
  return sceneObjects.value
    .filter(entry => {
      if (entry.assetId === 'candle') {
        // allow selecting candles if the creator is the current user or the current user is admin
        const cid = entry.candleData?.creatorId || null
        return isAdmin.value || (cid && me && cid === me)
      }

      return true
    })
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
  selectedSceneObjectColor.value = record.color || extractObjectColor(record.object)
  updateSelectionHelper(record.object)
}

const removeSelectedSceneObject = () => {
  const record = selectedSceneObject.value

  if (!canEditSceneObjects.value || !record || !room) {
    return
  }

  pushUndoSnapshot()

  if (record.object === roomDeskChair) {
    roomDeskChair = null
  }

  if (record.object.removeFromParent) {
    record.object.removeFromParent()
  } else if (record.object.parent) {
    record.object.parent.remove(record.object)
  } else {
    room.remove(record.object)
  }

  record.object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }

    const { material } = child
    if (Array.isArray(material)) {
      material.forEach(entry => entry?.dispose?.())
    } else if (material?.dispose) {
      material.dispose()
    }
  })
  sceneObjects.value = sceneObjects.value.filter(entry => entry.id !== record.id)
  clearHoveredPhoto()
  clearSceneSelection()
  persistCurrentRoomScene()
}

const normalizeModeratorNotification = (entry) => ({
  id: entry.id,
  kind: entry.kind || 'placement',
  assetId: entry.assetId || 'item',
  title: entry.title || 'Nieuwe plaatsing',
  subtitle: entry.subtitle || '',
  actor: entry.actor || 'Onbekend',
  roomId: entry.roomId || (props.roomId || 'default'),
  timestamp: entry.timestamp || new Date().toISOString(),
  read: !!entry.read,
  source: entry.source || 'local',
})

const saveModeratorNotifications = () => {
  try {
    localStorage.setItem(moderatorNotificationStorageKey(), JSON.stringify(moderatorNotifications.value))
  } catch (e) {}
  moderatorNotificationVersion.value += 1
}

const loadModeratorNotifications = () => {
  try {
    const raw = localStorage.getItem(moderatorNotificationStorageKey())
    moderatorNotifications.value = raw ? JSON.parse(raw).map(normalizeModeratorNotification) : []
  } catch (e) {
    moderatorNotifications.value = []
  }
  moderatorNotificationVersion.value += 1
}

const addModeratorNotification = (entry) => {
  const normalized = normalizeModeratorNotification(entry)
  if (moderatorNotifications.value.some(item => item.id === normalized.id)) {
    return
  }

  moderatorNotifications.value = [normalized, ...moderatorNotifications.value].slice(0, 100)
  saveModeratorNotifications()
}

const markModeratorNotificationsRead = () => {
  if (!moderatorNotifications.value.length) return
  moderatorNotifications.value = moderatorNotifications.value.map(entry => ({ ...entry, read: true }))
  saveModeratorNotifications()
}

const logModeratorPlacement = (assetId, title, subtitle = '') => {
  const actor = props.currentUser?.displayName || props.currentUser?.email || 'Gast'
  const roomId = props.roomId || 'default'
  const timestamp = new Date().toISOString()
  const analyticsEntry = logEvent('placement_created', {
    assetId,
    title,
    subtitle,
    actor,
    roomId,
    timestamp,
  })
  const notificationId = analyticsEntry?.id || `mod_${roomId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  addModeratorNotification({
    id: notificationId,
    kind: 'placement',
    assetId,
    title,
    subtitle,
    actor,
    roomId,
    timestamp,
    read: false,
    source: 'local',
  })
}

const syncModeratorNotificationsFromRemote = async () => {
  const supabase = getSupabase()
  if (!supabase) return

  try {
    const roomId = props.roomId || 'default'
    const { data } = await supabase
      .from('events')
      .select('id,name,timestamp,props')
      .eq('name', 'placement_created')
      .order('timestamp', { ascending: false })
      .limit(50)

    (data || []).forEach((row) => {
      const propsPayload = row.props || {}
      if ((propsPayload.roomId || roomId) !== roomId) return

      addModeratorNotification({
        id: row.id,
        kind: 'placement',
        assetId: propsPayload.assetId || 'item',
        title: propsPayload.title || 'Nieuwe plaatsing',
        subtitle: propsPayload.subtitle || '',
        actor: propsPayload.actor || 'Onbekend',
        roomId,
        timestamp: row.timestamp || propsPayload.timestamp || new Date().toISOString(),
        read: false,
        source: 'remote',
      })
    })
  } catch (e) {
    // ignore missing table / permissions / offline
  }
}

let moderatorNotificationPollTimer = null

watch(isModeratorMode, async (active) => {
  if (active) {
    loadModeratorNotifications()
    try {
      localStorage.setItem(`audreyModeratorSeen_${props.roomId || 'default'}`, new Date().toISOString())
    } catch (e) {}
    await syncModeratorNotificationsFromRemote()
    markModeratorNotificationsRead()

    if (moderatorNotificationPollTimer) {
      clearInterval(moderatorNotificationPollTimer)
    }

    moderatorNotificationPollTimer = setInterval(() => {
      syncModeratorNotificationsFromRemote()
    }, 15000)
  } else if (moderatorNotificationPollTimer) {
    clearInterval(moderatorNotificationPollTimer)
    moderatorNotificationPollTimer = null
  }
}, { immediate: true })

// Admin moderation: modal state and helpers for deletion with reason
const showAdminDeleteModal = ref(false)
const adminDeleteReason = ref('')
const adminDeleteTargetRecordId = ref(null)
const adminDeleteTargetOwnerId = ref(null)

const getCurrentUserKey = () => props.currentUser?.id || props.currentUser?.uid || props.currentUser?.sub || props.currentUser?.email || props.currentUser?.displayName || null

const saveModerationLogEntry = (entry) => {
  try {
    const key = `audreyModerationLog_${props.roomId || 'default'}`
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(entry)
    localStorage.setItem(key, JSON.stringify(arr))
  } catch (e) {
    console.warn('Failed to save moderation log', e)
  }
}

const normalizeUserNotification = (entry) => ({
  id: entry?.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  kind: entry?.kind || entry?.type || 'info',
  title: entry?.title || notificationKindLabel(entry?.kind || entry?.type || 'info'),
  message: entry?.message || entry?.reason || entry?.subtitle || '',
  roomId: entry?.roomId || props.roomId || null,
  roomName: entry?.roomName || roomName.value || '',
  actor: entry?.actor || entry?.from || '',
  actionLabel: entry?.actionLabel || '',
  actionRoomId: entry?.actionRoomId || entry?.roomId || null,
  timestamp: entry?.timestamp || new Date().toISOString(),
  read: Boolean(entry?.read),
})

const saveUserNotifications = () => {
  try {
    localStorage.setItem(userNotificationStorageKey(), JSON.stringify(userNotifications.value))
  } catch (e) {
    console.warn('Failed to save user notifications', e)
  }
}

const loadUserNotifications = () => {
  try {
    const raw = localStorage.getItem(userNotificationStorageKey())
    userNotifications.value = raw ? JSON.parse(raw).map(normalizeUserNotification) : []
  } catch (e) {
    userNotifications.value = []
  }
}

const markUserNotificationsRead = () => {
  if (!userNotifications.value.length) return
  userNotifications.value = userNotifications.value.map(entry => ({ ...entry, read: true }))
  saveUserNotifications()
}

const notifyUser = (userId, payload) => {
  if (!userId) return
  try {
    const key = `audreyNotifications_${userId}`
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(normalizeUserNotification(payload))
    localStorage.setItem(key, JSON.stringify(arr))
    if (userId === getCurrentUserKey()) {
      loadUserNotifications()
    }
  } catch (e) {
    console.warn('Failed to write user notification', e)
  }
}

const requestDeleteSelectedSceneObject = () => {
  const rec = selectedSceneObject.value
  if (!rec) return

  const me = getCurrentUserKey()
  const owner = rec.candleData?.creatorId || null

  // If it's a candle and current user is admin and not the owner, require reason
  if (rec.assetId === 'candle' && isAdmin.value && owner && owner !== me) {
    adminDeleteTargetRecordId.value = rec.id
    adminDeleteTargetOwnerId.value = owner
    adminDeleteReason.value = ''
    showAdminDeleteModal.value = true
    return
  }

  // fallback: proceed to immediate deletion
  removeSelectedSceneObject()
}

const adminConfirmDelete = () => {
  const reason = (adminDeleteReason.value || '').trim()
  if (!reason) {
    showNotification('Reden is verplicht', 'error')
    return
  }

  const rec = selectedSceneObject.value
  if (!rec) {
    showAdminDeleteModal.value = false
    return
  }

  const adminId = getCurrentUserKey()
  const adminName = props.currentUser?.displayName || props.currentUser?.email || 'Beheerder'
  const ownerId = adminDeleteTargetOwnerId.value || rec.candleData?.creatorId || null
  const entry = {
    id: Date.now(),
    roomId: props.roomId || 'default',
    adminId,
    adminName,
    candleRecordId: rec.id,
    ownerId,
    reason,
    timestamp: new Date().toISOString(),
  }

  saveModerationLogEntry(entry)

  // notify owner via localStorage inbox
  if (ownerId) {
    notifyUser(ownerId, {
      type: 'candle_removed',
      from: adminName,
      candleRecordId: rec.id,
      reason,
      timestamp: entry.timestamp,
    })
  }

  // perform deletion
  removeSelectedSceneObject()
  showAdminDeleteModal.value = false
  showNotification('Kaars verwijderd', 'success')
}

// Editing state for candle inspector
const editCandleMessage = ref('')
const editCandleSize = ref(null)

watch(selectedSceneObject, (rec) => {
  if (!rec || rec.assetId !== 'candle') {
    editCandleMessage.value = ''
    editCandleSize.value = null
    return
  }

  editCandleMessage.value = rec.candleData?.message || ''
  editCandleSize.value = rec.candleData?.size?.id || (rec.candleData?.size ? rec.candleData.size : null)
})

const applyCandleEdits = () => {
  const rec = selectedSceneObject.value
  if (!rec || rec.assetId !== 'candle') return

  pushUndoSnapshot()

  // update data
  rec.candleData = {
    ...rec.candleData,
    message: editCandleMessage.value,
    size: { id: editCandleSize.value, label: editCandleSize.value === 'small' ? 'Klein' : editCandleSize.value === 'large' ? 'Groot' : 'Gemiddeld' },
  }

  // apply a simple scale change to the object for size change
  try {
    const obj = rec.object
    if (obj) {
      const scaleMap = { small: 0.9, medium: 1.0, large: 1.25 }
      const s = scaleMap[editCandleSize.value] || 1.0
      obj.scale.set(s, s, s)
    }
  } catch (e) {
    console.warn('Failed to apply candle size change', e)
  }

  persistCurrentRoomScene()
  showNotification('Kaars bijgewerkt', 'success', 1600)
}

const addMessageToSelectedObject = (text) => {
  if (!selectedSceneObject.value || !text) return
  const rec = selectedSceneObject.value
  if (!rec.messages) rec.messages = []
  const msg = {
    id: Date.now(),
    author: props.currentUser?.displayName || 'Gast',
    text: text.trim(),
    created_at: (new Date()).toISOString(),
  }
  rec.messages.push(msg)
  newObjectMessage.value = ''
  pushUndoSnapshot()
  try { persistCurrentRoomScene() } catch (e) {}
  showNotification('Bericht toegevoegd', 'success', 2200)
}

const applyTransformToSelectedObject = ({ moveX = 0, moveY = 0, moveZ = 0, rotateY = 0, scaleAdjust = 0 }) => {
  const record = selectedSceneObject.value

  if (!canEditSceneObjects.value || !record?.object) {
    return
  }

  pushUndoSnapshot()

  record.object.position.x += moveX
  record.object.position.y += moveY
  record.object.position.z += moveZ

  if (record.object === roomDeskChair) {
    roomDeskChairBaseRotationY += rotateY
    record.object.rotation.y = roomDeskChairBaseRotationY
  } else {
    record.object.rotation.y += rotateY
  }

  if (scaleAdjust !== 0) {
    const newScale = Math.max(0.1, record.object.scale.x + scaleAdjust)
    record.object.scale.set(newScale, newScale, newScale)
  }

  record.position = record.object.position.clone()
  record.rotation = record.object.rotation.clone()
  record.scale = record.object.scale.clone()
  persistCurrentRoomScene()
}

const getHoverObjectDataFromObject = (object) => {
  let currentObject = object

  while (currentObject) {
    if (currentObject.userData?.photoData) {
      const photoData = currentObject.userData.photoData
      return {
        title: photoData.title || 'Foto',
        text: photoData.text || 'Geen extra tekst toegevoegd.',
      }
    }

    if (currentObject.userData?.audioData) {
      const audioData = currentObject.userData.audioData
      return {
        title: audioData.title || 'Audio',
        text: audioData.text || 'Geen extra tekst toegevoegd.',
      }
    }

    if (currentObject.userData?.videoData) {
      const videoData = currentObject.userData.videoData
      return {
        title: videoData.title || 'Video',
        text: videoData.text || 'Geen extra tekst toegevoegd.',
      }
    }

    if (currentObject.userData?.messageData) {
      const messageData = currentObject.userData.messageData
      return {
        title: 'Bericht',
        text: messageData.message || 'Geen bericht toegevoegd.',
      }
    }

    if (currentObject.userData?.candleData) {
      const candleData = currentObject.userData.candleData
      const sizeLabel = candleData.size?.label
        || (candleData.size?.id === 'small' ? 'Klein' : candleData.size?.id === 'large' ? 'Groot' : 'Gemiddeld')
      const placedDate = formatHoverDate(candleData.placedAt)
      return {
        title: `Boodschap van ${candleData.name || 'onbekend'}`,
        text: candleData.message || 'Geen boodschap toegevoegd.',
        kind: 'candle',
        sizeLabelTitle: 'Grootte:',
        sizeLabelValue: sizeLabel,
        placedDateLabelTitle: 'Datum:',
        placedDateLabelValue: placedDate || '',
      }
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
  const hoveredIntersection = intersections.find(intersection => getHoverObjectDataFromObject(intersection.object))
  const selectableRoots = canEditSceneObjects.value ? getSelectableRootObjects() : []
  const selectableIntersection = selectableRoots.length
    ? raycaster.intersectObjects(selectableRoots, true).find(intersection => findSceneObjectRecord(intersection.object))
    : null

  renderer.domElement.style.cursor = selectableIntersection ? 'pointer' : 'default'

  if (!hoveredIntersection) {
    clearHoveredPhoto()
  } else {
    hoveredPhoto.value = getHoverObjectDataFromObject(hoveredIntersection.object)
    hoveredPhotoPosition.value = {
      x: event.clientX - rect.left + 16,
      y: event.clientY - rect.top + 16,
    }
  }
}

const handleCanvasClick = (event) => {
  if (!renderer || !camera || !room || !canEditSceneObjects.value) {
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
  if (renderer?.domElement) {
    renderer.domElement.style.cursor = 'default'
  }
}

// Helper function to create placeholder models
const createPlaceholderModel = (assetId) => {
  const group = new THREE.Group()

  const addBox = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position[0], position[1], position[2])
    mesh.rotation.set(rotation[0], rotation[1], rotation[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }

  const addCylinder = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position[0], position[1], position[2])
    mesh.rotation.set(rotation[0], rotation[1], rotation[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }

  const buildDeskLamp = (height = 0.42, offset = [0, 0, 0]) => {
    const stemMaterial = new THREE.MeshStandardMaterial({ color: '#7b6f63', roughness: 0.6 })
    const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#ffd9a8', roughness: 0.85, emissive: '#ffe8c4', emissiveIntensity: 0.1 })

    addCylinder(new THREE.CylinderGeometry(0.015, 0.015, height, 8), stemMaterial, [offset[0], offset[1] + 0.18, offset[2]])
    addBox(new THREE.BoxGeometry(0.12, 0.02, 0.12), stemMaterial, [offset[0], offset[1] + 0.01, offset[2]])
    addBox(new THREE.ConeGeometry(0.12, 0.18, 12), shadeMaterial, [offset[0] + 0.03, offset[1] + height + 0.03, offset[2]], [0, 0, -0.18])
  }

  const buildOfficeChair = (scale = 1) => {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#5d98d6', roughness: 0.72 })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: '#3b4d62', roughness: 0.78 })

    addBox(new THREE.BoxGeometry(0.42 * scale, 0.1 * scale, 0.42 * scale), frameMaterial, [0, 0.2 * scale, 0])
    addBox(new THREE.BoxGeometry(0.42 * scale, 0.38 * scale, 0.08 * scale), frameMaterial, [0, 0.48 * scale, -0.16 * scale])
    addCylinder(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.14 * scale, 10), darkMaterial, [0, 0.08 * scale, 0])
    addBox(new THREE.BoxGeometry(0.12 * scale, 0.08 * scale, 0.12 * scale), darkMaterial, [0, 0.02 * scale, 0])
    addBox(new THREE.BoxGeometry(0.05 * scale, 0.26 * scale, 0.05 * scale), darkMaterial, [-0.16 * scale, 0.08 * scale, -0.16 * scale])
    addBox(new THREE.BoxGeometry(0.05 * scale, 0.26 * scale, 0.05 * scale), darkMaterial, [0.16 * scale, 0.08 * scale, -0.16 * scale])
    addBox(new THREE.BoxGeometry(0.05 * scale, 0.26 * scale, 0.05 * scale), darkMaterial, [-0.16 * scale, 0.08 * scale, 0.16 * scale])
    addBox(new THREE.BoxGeometry(0.05 * scale, 0.26 * scale, 0.05 * scale), darkMaterial, [0.16 * scale, 0.08 * scale, 0.16 * scale])
  }

  const buildCarpet = () => {
    const carpetMaterial = new THREE.MeshStandardMaterial({ color: '#ff54ad', roughness: 0.98, side: THREE.DoubleSide })
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.45), carpetMaterial)
    carpet.rotation.x = -Math.PI / 2
    carpet.position.y = 0.012
    carpet.receiveShadow = true
    group.add(carpet)
  }

  const buildSofa = () => {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#66d2dc', roughness: 0.92, metalness: 0 })
    const backMaterial = new THREE.MeshStandardMaterial({ color: '#5dc6d1', roughness: 0.95, metalness: 0 })
    const legMaterial = new THREE.MeshStandardMaterial({ color: '#ccbcae', roughness: 0.96, metalness: 0 })

    addBox(new THREE.BoxGeometry(1.72, 0.32, 0.9), frameMaterial, [0, 0.18, 0])
    addBox(new THREE.BoxGeometry(1.68, 0.98, 0.24), backMaterial, [0, 0.82, -0.3])
    addBox(new THREE.BoxGeometry(0.22, 0.8, 0.82), frameMaterial, [-0.8, 0.44, 0])
    addBox(new THREE.BoxGeometry(0.22, 0.8, 0.82), frameMaterial, [0.8, 0.44, 0])
    addBox(new THREE.BoxGeometry(1.6, 0.08, 0.82), backMaterial, [0, 0.04, 0.01])

    addBox(new THREE.BoxGeometry(0.1, 0.12, 0.1), legMaterial, [-0.72, 0.02, -0.32])
    addBox(new THREE.BoxGeometry(0.1, 0.12, 0.1), legMaterial, [0.72, 0.02, -0.32])
    addBox(new THREE.BoxGeometry(0.1, 0.12, 0.1), legMaterial, [-0.72, 0.02, 0.32])
    addBox(new THREE.BoxGeometry(0.1, 0.12, 0.1), legMaterial, [0.72, 0.02, 0.32])

  }

  const buildBookshelf = () => {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#f6ebdf', roughness: 0.82 })
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: '#eadac9', roughness: 0.86 })
    const bookColors = ['#7fd6df', '#ff8ab8', '#ffd56b', '#9ac7ff', '#8fd48b', '#f4a3d1']

    addBox(new THREE.BoxGeometry(0.95, 1.72, 0.38), frameMaterial, [0, 0.86, 0])
    addBox(new THREE.BoxGeometry(0.86, 0.05, 0.3), shelfMaterial, [0, 1.6, 0])
    addBox(new THREE.BoxGeometry(0.86, 0.05, 0.3), shelfMaterial, [0, 1.15, 0])
    addBox(new THREE.BoxGeometry(0.86, 0.05, 0.3), shelfMaterial, [0, 0.7, 0])
    addBox(new THREE.BoxGeometry(0.86, 0.05, 0.3), shelfMaterial, [0, 0.25, 0])

    ;[-0.28, -0.04, 0.2].forEach((x, index) => {
      const color = bookColors[index % bookColors.length]
      addBox(new THREE.BoxGeometry(0.08 + index * 0.01, 0.32 + index * 0.05, 0.12), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), [x, 1.42, 0.02])
    })
    addBox(new THREE.BoxGeometry(0.12, 0.42, 0.12), new THREE.MeshStandardMaterial({ color: '#f29bcc', roughness: 0.72 }), [0.22, 1.35, 0.02])
    addBox(new THREE.BoxGeometry(0.1, 0.28, 0.12), new THREE.MeshStandardMaterial({ color: '#5ed4db', roughness: 0.72 }), [0.34, 1.42, 0.02])
  }

  const buildDeskSet = () => {
    const topMaterial = new THREE.MeshStandardMaterial({ color: '#f6e1c9', roughness: 0.82 })
    const legMaterial = new THREE.MeshStandardMaterial({ color: '#e4c8a7', roughness: 0.84 })
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: '#48c5d5', roughness: 0.76 })
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#3f4450', roughness: 0.82 })

    addBox(new THREE.BoxGeometry(1.65, 0.1, 0.6), topMaterial, [0, 0.82, 0])
    addBox(new THREE.BoxGeometry(0.08, 0.82, 0.08), legMaterial, [-0.72, 0.41, -0.22])
    addBox(new THREE.BoxGeometry(0.08, 0.82, 0.08), legMaterial, [0.72, 0.41, -0.22])
    addBox(new THREE.BoxGeometry(0.08, 0.82, 0.08), legMaterial, [-0.72, 0.41, 0.22])
    addBox(new THREE.BoxGeometry(0.08, 0.82, 0.08), legMaterial, [0.72, 0.41, 0.22])

    addBox(new THREE.BoxGeometry(0.72, 0.42, 0.06), frameMaterial, [0.22, 1.15, -0.15])
    addBox(new THREE.BoxGeometry(0.64, 0.34, 0.02), monitorMaterial, [0.22, 1.15, -0.12])
    addBox(new THREE.BoxGeometry(0.16, 0.1, 0.12), frameMaterial, [0.22, 0.89, -0.12])
    buildDeskLamp(0.5, [-0.42, 0.86, 0.2])
    addBox(new THREE.BoxGeometry(0.55, 0.04, 0.02), frameMaterial, [0.05, 0.97, 0.03])
  }

  const buildSideChair = () => {
    const seatMaterial = new THREE.MeshStandardMaterial({ color: '#5fd1df', roughness: 0.72 })
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#4f9fb1', roughness: 0.78 })

    addBox(new THREE.BoxGeometry(0.52, 0.12, 0.52), seatMaterial, [0, 0.18, 0])
    addBox(new THREE.BoxGeometry(0.52, 0.36, 0.08), seatMaterial, [0, 0.42, -0.22])
    addBox(new THREE.BoxGeometry(0.06, 0.32, 0.06), frameMaterial, [-0.2, 0.08, -0.18])
    addBox(new THREE.BoxGeometry(0.06, 0.32, 0.06), frameMaterial, [0.2, 0.08, -0.18])
    addBox(new THREE.BoxGeometry(0.06, 0.32, 0.06), frameMaterial, [-0.2, 0.08, 0.18])
    addBox(new THREE.BoxGeometry(0.06, 0.32, 0.06), frameMaterial, [0.2, 0.08, 0.18])
  }
  
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
  } else if (assetId === 'lamp_floor_01') {
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#8c6f54', roughness: 0.75 })
    const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#f1e7d8', roughness: 0.88, emissive: '#ffdca8', emissiveIntensity: 0.12 })

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), standMaterial)
    base.position.y = 0.02
    base.castShadow = true
    group.add(base)

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.0, 10), standMaterial)
    pole.position.y = 0.54
    pole.castShadow = true
    group.add(pole)

    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.3, 12, 1, false), shadeMaterial)
    shade.position.y = 1.12
    shade.castShadow = true
    group.add(shade)
  } else if (assetId === 'lamp_table_01') {
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#7a644e', roughness: 0.7 })
    const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#efe5d8', roughness: 0.85, emissive: '#ffd9a8', emissiveIntensity: 0.15 })

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.1, 12), standMaterial)
    base.position.y = 0.05
    base.castShadow = true
    group.add(base)

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 10), standMaterial)
    stem.position.y = 0.28
    stem.castShadow = true
    group.add(stem)

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 12), shadeMaterial)
    shade.position.y = 0.56
    shade.castShadow = true
    group.add(shade)
  } else if (assetId === 'lamp_hanging_01') {
    const cordMaterial = new THREE.MeshStandardMaterial({ color: '#6f5c49', roughness: 0.8 })
    const shadeMaterial = new THREE.MeshStandardMaterial({ color: '#f3e8d9', roughness: 0.82, emissive: '#ffe0b5', emissiveIntensity: 0.1 })

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), cordMaterial)
    cord.position.y = 0.75
    cord.castShadow = true
    group.add(cord)

    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.24, 12, 1, false), shadeMaterial)
    shade.position.y = 0.36
    shade.castShadow = true
    group.add(shade)
  } else if (assetId === 'tv_01') {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#2f2f34', roughness: 0.75 })
    const screenMaterial = new THREE.MeshStandardMaterial({ color: '#14151a', roughness: 0.9, emissive: '#1a1e2b', emissiveIntensity: 0.08 })
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#9c8b77', roughness: 0.6 })

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 0.06), frameMaterial)
    frame.castShadow = true
    group.add(frame)

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.48, 0.02), screenMaterial)
    screen.position.z = 0.04
    group.add(screen)

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), standMaterial)
    stand.position.set(0, -0.34, 0)
    stand.castShadow = true
    group.add(stand)
  } else if (assetId === 'laptop_01') {
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#4a4d57', roughness: 0.7 })
    const screenMaterial = new THREE.MeshStandardMaterial({ color: '#121418', roughness: 0.92, emissive: '#1d2230', emissiveIntensity: 0.08 })

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.42), bodyMaterial)
    base.position.y = 0.02
    base.castShadow = true
    group.add(base)

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.03), screenMaterial)
    screen.position.set(0, 0.2, -0.16)
    screen.rotation.x = -0.38
    screen.castShadow = true
    group.add(screen)
  } else if (assetId === 'easel_01') {
    const woodMaterial = new THREE.MeshStandardMaterial({ color: '#9d7450', roughness: 0.8 })
    const canvasMaterial = new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.95 })

    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.82, 8)
    const leftLeg = new THREE.Mesh(legGeo, woodMaterial)
    leftLeg.position.set(-0.18, 0.4, 0)
    leftLeg.rotation.z = 0.12
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, woodMaterial)
    rightLeg.position.set(0.18, 0.4, 0)
    rightLeg.rotation.z = -0.12
    rightLeg.castShadow = true
    group.add(rightLeg)

    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.62, 8), woodMaterial)
    support.position.y = 0.46
    support.rotation.z = Math.PI / 2
    support.castShadow = true
    group.add(support)

    const canvas = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.03), canvasMaterial)
    canvas.position.set(0, 0.62, 0.02)
    canvas.rotation.z = -0.08
    canvas.castShadow = true
    group.add(canvas)
  } else if (assetId === 'ball_01') {
    const ballMaterial = new THREE.MeshStandardMaterial({ color: '#ea5a5a', roughness: 0.65 })
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), ballMaterial)
    ball.castShadow = true
    ball.receiveShadow = true
    group.add(ball)

    const stripeMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 18), stripeMaterial)
    stripe.rotation.x = Math.PI / 2
    stripe.castShadow = true
    group.add(stripe)
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
  else if (['bookshelf_01', 'book_closet_01', 'closet_01'].includes(assetId)) {
    buildBookshelf()
  } else if (['desk_01', 'workdesk_01', 'computer_desk_01'].includes(assetId)) {
    buildDeskSet()
  } else if (['desk_chair_01', 'office_chair_01'].includes(assetId)) {
    buildOfficeChair(1.08)
  } else if (['sofa_01', 'blue_sofa_01'].includes(assetId)) {
    buildSofa()
  } else if (['carpet_01', 'rug_01'].includes(assetId)) {
    buildCarpet()
  } else if (['side_chair_01', 'chair_small_01', 'chair_02'].includes(assetId)) {
    buildSideChair()
  }
  else if (assetId === 'chair_01') {
    // Simple chair placeholder: seat, back, and legs
    const seatMat = new THREE.MeshStandardMaterial({ color: '#8b6b4b', roughness: 0.6 })
    const legMat = new THREE.MeshStandardMaterial({ color: '#5a3f2b', roughness: 0.7 })

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), seatMat)
    seat.position.y = 0.18
    seat.castShadow = true
    group.add(seat)

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.08), seatMat)
    back.position.set(0, 0.55, -0.26)
    back.castShadow = true
    group.add(back)

    const legGeo = new THREE.BoxGeometry(0.08, 0.36, 0.08)
    const legPositions = [
      [-0.26, -0.0, -0.26],
      [0.26, -0.0, -0.26],
      [-0.26, -0.0, 0.26],
      [0.26, -0.0, 0.26],
    ]

    legPositions.forEach((p) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(p[0], -0.0, p[2])
      leg.castShadow = true
      group.add(leg)
    })

    group.scale.set(1, 1, 1)
    group.position.y = 0.18
  } else if (assetId === 'table_01') {
    // Simple side table placeholder: top and four legs
    const topMat = new THREE.MeshStandardMaterial({ color: '#d9c6b3', roughness: 0.65 })
    const legMat = new THREE.MeshStandardMaterial({ color: '#b08a65', roughness: 0.7 })

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.6), topMat)
    top.position.y = 0.35
    top.castShadow = true
    group.add(top)

    const legGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08)
    const legPositions = [
      [-0.44, -0.0, -0.26],
      [0.44, -0.0, -0.26],
      [-0.44, -0.0, 0.26],
      [0.44, -0.0, 0.26],
    ]

    legPositions.forEach((p) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(p[0], -0.0, p[2])
      leg.castShadow = true
      group.add(leg)
    })

    group.scale.set(1, 1, 1)
    group.position.y = 0.35
  }
  
  return group
}

// Try to fetch and parse a GLB safely. If the fetch fails or returns HTML/text,
// return null so callers can fall back to placeholders without raising parse errors.
const tryLoadGLB = async (url) => {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn('GLB fetch failed:', url, res.status)
      return null
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    // protect against HTML error pages being returned instead of GLB
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      console.warn('GLB fetch returned non-binary content-type:', contentType, url)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    // Use GLTFLoader.parse to avoid the loader's internal XHR guessing that caused JSON parse errors
    const gltf = await new Promise((resolve, reject) => {
      gltfLoader.parse(arrayBuffer, '', (g) => resolve(g), (err) => reject(err))
    })
    return gltf
  } catch (e) {
    console.warn('Failed to fetch/parse GLB', url, e)
    return null
  }
}

const clearRoomContent = () => {
  if (!room) return

  clearSceneSelection()

  // First remove every tracked scene object from its actual parent.
  // This avoids layering when an object is attached to a nested group.
  sceneObjects.value.forEach((record) => {
    const obj = record?.object
    if (obj?.parent) {
      obj.parent.remove(obj)
    }
  })

  roomDeskChair = null
  roomDeskChairBaseRotationY = Math.PI

  for (let index = room.children.length - 1; index >= 0; index -= 1) {
    const child = room.children[index]
    if (!child?.userData?.staticRoomElement) {
      room.remove(child)
    }
  }

  sceneObjects.value = []
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
  logModeratorPlacement('photo', photoData?.title || 'Foto toegevoegd', photoData?.text || '')
}

const handlePlaceMessage = (messageData) => {
  if (!room) {
    return
  }

  pushUndoSnapshot()

  // Create a simple placeholder for the message in the room
  const messageGroup = new THREE.Group()
  messageGroup.position.set(0, 0.5, 0)
  room.add(messageGroup)

  createSceneObjectRecord(messageGroup, 'message', { messageData })
  logModeratorPlacement('message', 'Bericht toegevoegd', messageData?.message || '')
  persistCurrentRoomScene()
}

const handlePlaceCandle = (candleData) => {
  if (!room) {
    return
  }

  pushUndoSnapshot()

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

  const creatorId = props.currentUser?.id || props.currentUser?.uid || props.currentUser?.sub || props.currentUser?.email || props.currentUser?.displayName || null
  createSceneObjectRecord(candleGroup, 'candle', { candleData: { ...candleData, placedAt: new Date().toISOString(), creatorId } })
  logModeratorPlacement('candle', `Kaars geplaatst door ${candleData?.name || 'onbekend'}`, candleData?.message || '')
  persistCurrentRoomScene()
}

onMounted(() => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  // load room metadata for privacy/invite demo
  loadRoomMeta()

  loadUserNotifications()

  userNotificationStorageListener = (event) => {
    if (!event || event.key === userNotificationStorageKey() || event.key === null) {
      loadUserNotifications()
    }
  }

  window.addEventListener('storage', userNotificationStorageListener)

  try {
    const storedSoundSettings = localStorage.getItem('audreySoundSettings')
    if (storedSoundSettings) {
      const parsedSoundSettings = JSON.parse(storedSoundSettings)
      soundSettings.value = {
        ...soundSettings.value,
        ...parsedSoundSettings,
        enabled: Boolean(parsedSoundSettings?.enabled),
        volume: Math.max(0, Math.min(1, Number(parsedSoundSettings?.volume ?? soundSettings.value.volume))),
      }
    }
  } catch (error) {}

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
  worldGrid.userData.staticRoomElement = true
  scene.add(worldGrid)

  room = new THREE.Group()
  room.position.y = 0.62

  floorMaterial = new THREE.MeshStandardMaterial({
    color: '#838991',
    roughness: 0.84,
    metalness: 0,
  })

  floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    floorMaterial,
  )
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.receiveShadow = true
  floorMesh.userData.staticRoomElement = true
  room.add(floorMesh)

  wallMaterial = new THREE.MeshStandardMaterial({
    color: '#f2afc7',
    roughness: 0.88,
    metalness: 0.02,
  })

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.8), wallMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-4.5, 2.4, 0)
  leftWall.receiveShadow = true
  leftWall.userData.staticRoomElement = true
  room.add(leftWall)

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.8), wallMaterial)
  backWall.position.set(0, 2.4, -4.5)
  backWall.receiveShadow = true
  backWall.userData.staticRoomElement = true
  room.add(backWall)

  trimMaterial = new THREE.MeshStandardMaterial({
    color: '#f6e9f0',
    roughness: 0.7,
  })

  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 8.7), trimMaterial)
  leftTrim.position.set(-4.4, 0.1, 0)
  leftTrim.userData.staticRoomElement = true
  room.add(leftTrim)

  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.2, 0.2), trimMaterial)
  backTrim.position.set(0, 0.1, -4.4)
  backTrim.userData.staticRoomElement = true
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
  rug.userData.staticRoomElement = true
  room.add(rug)

  const createSofaGroup = (width, depth, accentColor) => {
    const sofaGroup = new THREE.Group()
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#69d3d4', roughness: 0.92, metalness: 0 })
    const accentMaterial = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.97, metalness: 0 })
    const legMaterial = new THREE.MeshStandardMaterial({ color: '#ddd3ca', roughness: 0.96, metalness: 0 })

    const seat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, depth * 0.92), frameMaterial)
    seat.position.y = 0.18
    seat.castShadow = true
    seat.receiveShadow = true
    sofaGroup.add(seat)

    const back = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.8, 0.2), accentMaterial)
    back.position.set(0, 0.69, -depth * 0.27)
    back.castShadow = true
    back.receiveShadow = true
    sofaGroup.add(back)

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, 0.56, depth * 0.88), frameMaterial)
    leftArm.position.set(-width * 0.44, 0.36, 0)
    leftArm.castShadow = true
    leftArm.receiveShadow = true
    sofaGroup.add(leftArm)

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, 0.56, depth * 0.88), frameMaterial)
    rightArm.position.set(width * 0.44, 0.36, 0)
    rightArm.castShadow = true
    rightArm.receiveShadow = true
    sofaGroup.add(rightArm)

    const lowerFront = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.08, depth * 0.82), frameMaterial)
    lowerFront.position.set(0, 0.06, 0)
    lowerFront.castShadow = true
    lowerFront.receiveShadow = true
    sofaGroup.add(lowerFront)

    const legGeo = new THREE.BoxGeometry(0.08, 0.16, 0.08)
    const legPositions = [
      [-width * 0.4, 0.02, -depth * 0.34],
      [width * 0.4, 0.02, -depth * 0.34],
      [-width * 0.4, 0.02, depth * 0.34],
      [width * 0.4, 0.02, depth * 0.34],
    ]

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMaterial)
      leg.position.set(x, y, z)
      leg.castShadow = true
      leg.receiveShadow = true
      sofaGroup.add(leg)
    })

    return sofaGroup
  }

  const createBookshelfGroup = () => {
    const shelfGroup = new THREE.Group()
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#f7eadd', roughness: 0.9 })
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: '#eddcc8', roughness: 0.92 })
    const bookMaterials = [
      '#8fd6d7', '#4cc7d9', '#f79fca', '#ffd36f', '#a8d7ff', '#9fe39b', '#f4b7df',
    ].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }))

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.9, 0.14), frameMaterial)
    back.position.y = 1.45
    back.castShadow = true
    back.receiveShadow = true
    shelfGroup.add(back)

    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.95, 0.36), frameMaterial)
    leftSide.position.set(-0.34, 1.48, 0)
    leftSide.castShadow = true
    leftSide.receiveShadow = true
    shelfGroup.add(leftSide)

    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.95, 0.36), frameMaterial)
    rightSide.position.set(0.34, 1.48, 0)
    rightSide.castShadow = true
    rightSide.receiveShadow = true
    shelfGroup.add(rightSide)

    const shelfLevels = [0.42, 1.0, 1.58, 2.16]
    shelfLevels.forEach((height) => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.3), shelfMaterial)
      board.position.y = height
      board.castShadow = true
      board.receiveShadow = true
      shelfGroup.add(board)
    })

    const bookStacks = [
      { x: -0.22, y: 2.36, heights: [0.34, 0.46, 0.28] },
      { x: 0.0, y: 1.78, heights: [0.26, 0.34, 0.22] },
      { x: 0.16, y: 1.18, heights: [0.36, 0.3, 0.28] },
      { x: -0.1, y: 0.6, heights: [0.3, 0.24, 0.34] },
    ]

    bookStacks.forEach((stack, stackIndex) => {
      stack.heights.forEach((bookHeight, bookIndex) => {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.08 + bookIndex * 0.02, bookHeight, 0.12),
          bookMaterials[(stackIndex + bookIndex) % bookMaterials.length],
        )
        book.position.set(stack.x + bookIndex * 0.09, stack.y + bookHeight / 2, 0.03)
        book.castShadow = true
        book.receiveShadow = true
        shelfGroup.add(book)
      })
    })

    return shelfGroup
  }

  const createDeskGroup = () => {
    const deskGroup = new THREE.Group()
    const topMaterial = new THREE.MeshStandardMaterial({ color: '#f7d4b9', roughness: 0.82 })
    const legMaterial = new THREE.MeshStandardMaterial({ color: '#e8c8a9', roughness: 0.86 })
    const screenMaterial = new THREE.MeshStandardMaterial({ color: '#39c5d7', emissive: '#1e4b5c', emissiveIntensity: 0.18, roughness: 0.55 })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: '#5e6776', roughness: 0.78 })

    const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.88), topMaterial)
    top.position.y = 0.84
    top.castShadow = true
    top.receiveShadow = true
    deskGroup.add(top)

    const legGeo = new THREE.BoxGeometry(0.08, 0.9, 0.08)
    const legPositions = [
      [-1.02, 0.42, -0.34],
      [1.02, 0.42, -0.34],
      [-1.02, 0.42, 0.34],
      [1.02, 0.42, 0.34],
    ]

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMaterial)
      leg.position.set(x, y, z)
      leg.castShadow = true
      leg.receiveShadow = true
      deskGroup.add(leg)
    })

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.18), topMaterial)
    shelf.position.set(0.32, 1.1, -0.2)
    shelf.castShadow = true
    shelf.receiveShadow = true
    deskGroup.add(shelf)

    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.46, 0.06), screenMaterial)
    monitor.position.set(0.42, 1.28, -0.18)
    monitor.castShadow = true
    monitor.receiveShadow = true
    deskGroup.add(monitor)

    const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.1), darkMaterial)
    monitorStand.position.set(0.42, 1.0, -0.18)
    monitorStand.castShadow = true
    monitorStand.receiveShadow = true
    deskGroup.add(monitorStand)

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 14), darkMaterial)
    lampBase.position.set(-0.52, 0.9, 0.2)
    lampBase.castShadow = true
    lampBase.receiveShadow = true
    deskGroup.add(lampBase)

    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), darkMaterial)
    lampStem.position.set(-0.52, 1.12, 0.2)
    lampStem.castShadow = true
    deskGroup.add(lampStem)

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 12), new THREE.MeshStandardMaterial({ color: '#ffe0bd', roughness: 0.88, emissive: '#ffdfa8', emissiveIntensity: 0.12 }))
    lampShade.position.set(-0.5, 1.37, 0.2)
    lampShade.castShadow = true
    lampShade.receiveShadow = true
    deskGroup.add(lampShade)

    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.18), darkMaterial)
    keyboard.position.set(0.1, 0.9, 0.08)
    keyboard.castShadow = true
    keyboard.receiveShadow = true
    deskGroup.add(keyboard)

    return deskGroup
  }

  const createTrashCan = () => {
    const trashGroup = new THREE.Group()
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.86 })
    const rimMaterial = new THREE.MeshStandardMaterial({ color: '#f3f6fa', roughness: 0.8 })
    const linerMaterial = new THREE.MeshStandardMaterial({ color: '#b8bec8', roughness: 0.92 })

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 16), bodyMaterial)
    body.position.y = 0.14
    body.castShadow = true
    body.receiveShadow = true
    trashGroup.add(body)

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16), rimMaterial)
    rim.position.y = 0.29
    rim.castShadow = true
    rim.receiveShadow = true
    trashGroup.add(rim)

    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.22, 16), linerMaterial)
    liner.position.y = 0.13
    liner.castShadow = true
    liner.receiveShadow = true
    trashGroup.add(liner)

    return trashGroup
  }

  const createDeskChair = () => {
    const chairGroup = new THREE.Group()
    const seatMaterial = new THREE.MeshStandardMaterial({ color: '#ec79ae', roughness: 0.78 })
    const backMaterial = new THREE.MeshStandardMaterial({ color: '#f4a3c8', roughness: 0.8 })
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#4a5568', roughness: 0.76 })

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.5), seatMaterial)
    seat.position.y = 0.42
    seat.castShadow = true
    seat.receiveShadow = true
    chairGroup.add(seat)

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.08), backMaterial)
    back.position.set(0, 0.76, -0.2)
    back.castShadow = true
    back.receiveShadow = true
    chairGroup.add(back)

    const armGeo = new THREE.BoxGeometry(0.06, 0.22, 0.38)
    const leftArm = new THREE.Mesh(armGeo, frameMaterial)
    leftArm.position.set(-0.26, 0.5, 0)
    leftArm.castShadow = true
    leftArm.receiveShadow = true
    chairGroup.add(leftArm)

    const rightArm = new THREE.Mesh(armGeo, frameMaterial)
    rightArm.position.set(0.26, 0.5, 0)
    rightArm.castShadow = true
    rightArm.receiveShadow = true
    chairGroup.add(rightArm)

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 12), frameMaterial)
    hub.position.y = 0.08
    hub.castShadow = true
    hub.receiveShadow = true
    chairGroup.add(hub)

    const wheelBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 18), frameMaterial)
    wheelBase.position.y = 0.03
    wheelBase.castShadow = true
    wheelBase.receiveShadow = true
    chairGroup.add(wheelBase)

    const legGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.36, 8)
    const legPositions = [
      [-0.16, 0.18, -0.16],
      [0.16, 0.18, -0.16],
      [-0.16, 0.18, 0.16],
      [0.16, 0.18, 0.16],
    ]

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, frameMaterial)
      leg.position.set(x, y, z)
      leg.castShadow = true
      leg.receiveShadow = true
      chairGroup.add(leg)
    })

    return chairGroup
  }

  const leftSofa = createSofaGroup(2.45, 1.02, '#4fcfd5')
  leftSofa.position.set(-2.75, 0.32, 0.55)
  leftSofa.rotation.y = -0.06
  room.add(leftSofa)

  const rightSofa = createSofaGroup(1.55, 1.0, '#4fcfd5')
  rightSofa.position.set(2.58, 0.34, 0.48)
  rightSofa.rotation.y = 0.16
  room.add(rightSofa)

  const desk = createDeskGroup()
  desk.position.set(1.34, 0.62, -2.86)
  desk.rotation.y = -0.02
  room.add(desk)

  const shelf = createBookshelfGroup()
  shelf.position.set(0.16, 0.18, -3.7)
  shelf.rotation.y = -0.03
  room.add(shelf)

  const chair = createDeskChair()
  chair.position.set(1.54, 0.04, -2.12)
  roomDeskChair = chair
  roomDeskChairBaseRotationY = Math.PI
  chair.rotation.y = roomDeskChairBaseRotationY
  chair.scale.set(1.3, 1.3, 1.3)
  room.add(chair)

  const plant = createTrashCan()
  plant.position.set(0.58, 0.2, -2.34)
  plant.scale.set(1.45, 1.45, 1.45)
  room.add(plant)

  createSceneObjectRecord(leftSofa, 'sofa_01', {}, { select: false })
  createSceneObjectRecord(rightSofa, 'sofa_01', {}, { select: false })
  createSceneObjectRecord(desk, 'desk_01', {}, { select: false })
  createSceneObjectRecord(shelf, 'bookshelf_01', {}, { select: false })
  createSceneObjectRecord(chair, 'desk_chair_01', {}, { select: false })
  createSceneObjectRecord(plant, 'trash_can_01', {}, { select: false })

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

  applyRoomTheme(roomTheme.value, false)

  // If this room was created as an "empty" room, keep only the room shell
  // and remove all dynamic content/furniture from the scene.
  if (roomEmpty.value) {
    try {
      clearRoomContent()
    } catch (e) {}
  }

  // Load a per-room saved scene if present (created by room creation flow).
  ;(async () => {
    try {
      const id = props.roomId || 'default'
      const perRoomKey = `audreyRoomScene_${id}`
      const stored = localStorage.getItem(perRoomKey)
      if (stored) {
        if (stored.trim()) {
          const success = await deserializeSceneState(stored)
          if (!success) console.warn('Failed to deserialize per-room scene for', id)
        } else {
          // empty storage — ensure nothing dynamic remains
          clearRoomContent()
        }
      }
    } catch (e) {
      // ignore per-room load errors
    }
  })()

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
    if (roomDeskChair) {
      roomDeskChair.rotation.y = roomDeskChairBaseRotationY + Math.sin(time * 0.42) * 0.06
    }
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
  clearActiveSound()
  if (soundAudioContext) {
    try {
      soundAudioContext.close()
    } catch (error) {}
    soundAudioContext = null
  }
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
        <img class="brand-mark-image" :src="noekLogoTextUrl" alt="Noek" />
      </div>

      <!-- Admin delete confirmation modal (required reason) -->
      <div v-if="showAdminDeleteModal" class="modal-backdrop" role="dialog" aria-modal="true" @click.self="showAdminDeleteModal = false">
        <div class="modal-card room-settings-modal-card">
          <div class="modal-card-header">
            <h3>Bevestig verwijdering</h3>
            <button type="button" class="modal-close-button" @click="showAdminDeleteModal = false">×</button>
          </div>

          <p>Je staat op het punt een andermans kaars te verwijderen. Geef kort de reden op (verplicht):</p>

          <textarea v-model="adminDeleteReason" rows="4" style="width:100%; padding:8px; border-radius:8px; border:1px solid rgba(0,0,0,0.08); margin-top:8px"></textarea>

          <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
            <button type="button" class="room-settings-secondary-button" @click="showAdminDeleteModal = false">Annuleren</button>
            <button type="button" class="reset-room-primary-button" @click="adminConfirmDelete">Bevestig verwijdering</button>
          </div>
        </div>
      </div>

      <div class="top-bar-controls">
        <button
          type="button"
          class="floor-toggle topnav-accent-button"
          :class="{ active: showFloor }"
          :aria-pressed="showFloor"
          :title="showFloor ? 'Verberg vloer' : 'Toon vloer'"
          @click="toggleFloorVisibility"
        >
          {{ showFloor ? 'Vloer aan' : 'Vloer uit' }}
        </button>

        <div
          v-if="props.currentUser && props.currentUser.role === 'admin'"
            @click="openResetRoomConfirm"
          class="mode-menu-wrap"
        >
          <button
            type="button"
            class="floor-toggle mode-menu-trigger"
            :title="adminViewLabel"
            :aria-expanded="showAdminViewMenu"
            aria-haspopup="menu"
            @click.stop="toggleAdminViewMenu"
          >
            {{ adminViewLabel }}
            <span class="mode-menu-caret" aria-hidden="true">▾</span>
          </button>

          <transition name="profile-fade">
            <div v-if="showAdminViewMenu" class="mode-menu" role="menu" aria-label="Bekijk als modus" @click.stop>
              <button
                type="button"
                class="profile-menu-item mode-menu-item"
                :class="{ active: adminViewMode === 'edit' }"
                role="menuitemradio"
                :aria-checked="adminViewMode === 'edit'"
                @click="setAdminViewMode('edit')"
              >
                <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'edit' ? '✓' : '' }}</span>
                <span>Admin</span>
              </button>
              <button
                type="button"
                class="profile-menu-item mode-menu-item"
                :class="{ active: adminViewMode === 'moderator' }"
                role="menuitemradio"
                :aria-checked="adminViewMode === 'moderator'"
                @click="setAdminViewMode('moderator')"
              >
                <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'moderator' ? '✓' : '' }}</span>
                <span>Moderator</span>
              </button>
              <button
                type="button"
                class="profile-menu-item mode-menu-item"
                :class="{ active: adminViewMode === 'visitor' }"
                role="menuitemradio"
                :aria-checked="adminViewMode === 'visitor'"
                @click="setAdminViewMode('visitor')"
              >
                <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'visitor' ? '✓' : '' }}</span>
                <span>Bezoeker</span>
              </button>
            </div>
          </transition>
        </div>

        <button
          v-else-if="props.currentUser && props.currentUser.role === 'editor'"
          type="button"
          class="floor-toggle"
          :title="visitorPreviewMode ? 'Terug naar bewerkmodus' : 'Voorvertoning bezoeker'"
          @click="setVisitorPreviewMode(!visitorPreviewMode)"
        >
          {{ visitorButtonLabel }}
        </button>

      </div>

      <div class="room-title">
        <span
          class="room-privacy-indicator"
          tabindex="0"
          role="img"
          :aria-label="roomPrivacyLabel"
        >
          <span class="room-privacy-icon" aria-hidden="true">
            {{ roomPrivacy === 'private' ? '🔒' : '🔓' }}
          </span>
          <span class="room-privacy-tooltip" aria-hidden="true">{{ roomPrivacyLabel }}</span>
        </span>
        <span class="room-title-text">{{ roomName || 'Onbekende kamer' }}</span>
      </div>

      <div class="top-bar-actions">
        <div ref="topNavMenuElement" class="top-nav-menu-wrap">
          <button
            type="button"
            class="top-nav-menu-button"
            :aria-expanded="showTopNavMenu"
            aria-label="Open topnavigatie"
            title="Open topnavigatie"
            @click="toggleTopNavMenu"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <transition name="profile-fade">
            <div v-if="showTopNavMenu" class="top-nav-menu" role="menu" aria-label="Topnavigatie">
              <button
                type="button"
                class="floor-toggle topnav-accent-button"
                :class="{ active: showFloor }"
                :aria-pressed="showFloor"
                :title="showFloor ? 'Verberg vloer' : 'Toon vloer'"
                @click="toggleFloorVisibility"
              >
                {{ showFloor ? 'Vloer aan' : 'Vloer uit' }}
              </button>

              <div
                v-if="props.currentUser && props.currentUser.role === 'admin'"
                ref="adminViewMenuTopElement"
                class="mode-menu-wrap mode-menu-wrap--topnav"
              >
                <button
                  type="button"
                  class="floor-toggle mode-menu-trigger"
                  :title="adminViewLabel"
                  :aria-expanded="showAdminViewMenu"
                  aria-haspopup="menu"
                  @click.stop="toggleAdminViewMenu"
                >
                  {{ adminViewLabel }}
                  <span class="mode-menu-caret" aria-hidden="true">▾</span>
                </button>

                <transition name="profile-fade">
                  <div v-if="showAdminViewMenu" class="mode-menu mode-menu--inline" role="menu" aria-label="Bekijk als modus" @click.stop>
                    <button
                      type="button"
                      class="profile-menu-item mode-menu-item"
                      :class="{ active: adminViewMode === 'edit' }"
                      role="menuitemradio"
                      :aria-checked="adminViewMode === 'edit'"
                      @click="setAdminViewMode('edit')"
                    >
                      <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'edit' ? '✓' : '' }}</span>
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      class="profile-menu-item mode-menu-item"
                      :class="{ active: adminViewMode === 'moderator' }"
                      role="menuitemradio"
                      :aria-checked="adminViewMode === 'moderator'"
                      @click="setAdminViewMode('moderator')"
                    >
                      <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'moderator' ? '✓' : '' }}</span>
                      <span>Moderator</span>
                    </button>
                    <button
                      type="button"
                      class="profile-menu-item mode-menu-item"
                      :class="{ active: adminViewMode === 'visitor' }"
                      role="menuitemradio"
                      :aria-checked="adminViewMode === 'visitor'"
                      @click="setAdminViewMode('visitor')"
                    >
                      <span class="mode-menu-check" aria-hidden="true">{{ adminViewMode === 'visitor' ? '✓' : '' }}</span>
                      <span>Bezoeker</span>
                    </button>
                  </div>
                </transition>
              </div>

              <button
                v-else-if="props.currentUser && props.currentUser.role === 'editor'"
                type="button"
                class="floor-toggle"
                :title="visitorPreviewMode ? 'Terug naar bewerkmodus' : 'Voorvertoning bezoeker'"
                @click="setVisitorPreviewMode(!visitorPreviewMode)"
              >
                {{ visitorButtonLabel }}
              </button>
            </div>
          </transition>
        </div>

        <div class="profile-area">
          <span class="profile-name">{{ username }}</span>
          <div ref="profileMenuElement" class="profile-menu-wrap">
            <button
              type="button"
              class="notification-bell"
              :class="{ active: showUserNotificationPanel }"
              aria-haspopup="dialog"
              :aria-expanded="showUserNotificationPanel"
              aria-label="Open meldingen"
              title="Open meldingen"
              @click="toggleUserNotificationPanel"
            >
              <span class="notification-bell-icon">🔔</span>
              <span v-if="unreadUserNotificationCount > 0" class="notification-bell-badge">{{ unreadUserNotificationCount }}</span>
            </button>
            <button
              type="button"
              class="avatar"
              :style="{ backgroundImage: props.currentUser && props.currentUser.avatar ? `url(${props.currentUser.avatar})` : undefined, backgroundSize: 'cover' }"
              aria-haspopup="menu"
              :aria-expanded="showProfileMenu"
              aria-label="Open profielmenu"
              title="Open profielmenu"
              @click="toggleProfileMenu"
              @keydown.enter.prevent="openProfileMenu"
              @keydown.space.prevent="openProfileMenu"
            ></button>
            <span v-if="isAdmin && totalUnreadModeratorNotifications > 0" class="avatar-badge" aria-label="Ongelezen moderatiemeldingen">{{ totalUnreadModeratorNotifications }}</span>

            <transition name="profile-fade">
              <div v-if="showProfileMenu" class="profile-menu" role="menu">
                <div class="profile-menu-username">{{ username }}</div>
                <template v-if="props.currentUser && props.currentUser.role === 'admin'">
                  <button id="profile-menu-admin-settings" type="button" class="profile-menu-item" role="menuitem" @click="openAdminSettings">
                    {{ accountSettingsLabel }}
                  </button>
                  <button id="profile-menu-room-settings" type="button" class="profile-menu-item" role="menuitem" @click="openRoomSettings">
                    Kamerinstellingen
                  </button>
                  <button id="profile-menu-tutorial" type="button" class="profile-menu-item" role="menuitem" @click="openTutorial">
                    Bekijk tutorial
                  </button>
                </template>
                <template v-else>
                  <button id="profile-menu-account-settings" type="button" class="profile-menu-item" role="menuitem" @click="openAdminSettings">
                    {{ accountSettingsLabel }}
                  </button>
                  <button id="profile-menu-tutorial" type="button" class="profile-menu-item" role="menuitem" @click="openTutorial">
                    Bekijk tutorial
                  </button>
                </template>
                <button type="button" class="profile-menu-item" role="menuitem" @click="handleLogout($event)" @mousedown.stop.prevent="handleLogout($event)" tabindex="0">
                  Uitloggen
                </button>
              </div>
            </transition>

            <transition name="profile-fade">
              <div v-if="showUserNotificationPanel" class="notification-panel" role="dialog" aria-label="Meldingen">
                <div class="notification-panel-header">
                  <div>
                    <div class="notification-panel-title">Meldingen</div>
                    <div class="notification-panel-subtitle">Berichten, uitnodigingen en objectreacties</div>
                  </div>
                  <button
                    type="button"
                    class="notification-panel-close"
                    aria-label="Sluit meldingen"
                    @click="closeUserNotificationPanel"
                  >
                    ×
                  </button>
                </div>

                <div v-if="!userNotifications.length" class="notification-panel-empty">
                  Geen nieuwe meldingen.
                </div>

                <ul v-else class="notification-list">
                  <li
                    v-for="entry in userNotifications"
                    :key="entry.id"
                    class="notification-item"
                    :class="{ unread: !entry.read }"
                  >
                    <div class="notification-item-head">
                      <span class="notification-kind">{{ notificationKindLabel(entry.kind) }}</span>
                      <span class="notification-time">{{ notificationShortTime(entry.timestamp) }}</span>
                    </div>
                    <div class="notification-item-title">{{ entry.title }}</div>
                    <div v-if="entry.message" class="notification-item-message">{{ entry.message }}</div>
                    <div v-if="entry.roomName" class="notification-item-room">Kamer: {{ entry.roomName }}</div>
                    <button
                      v-if="entry.actionRoomId"
                      type="button"
                      class="notification-item-action"
                      @click="handleNotificationAction(entry)"
                    >
                      {{ entry.actionLabel || 'Open ruimte' }}
                    </button>
                  </li>
                </ul>
              </div>
            </transition>
          </div>
        </div>

          <!-- Moderator panel (admin-only) -->
          <ModeratorPanel
            v-if="isModeratorMode"
            :objects="sceneObjects"
            :notifications="moderatorNotifications"
            @hide="hideSceneObject"
            @restore="restoreSceneObject"
            @close="setAdminViewMode('edit')"
          />
      </div>
    </header>

    

    <!-- Toast notification (top-right) -->
    <transition name="toast-fade">
      <div v-if="notificationVisible" class="notification-toast" :class="notificationType" :style="toastStyle">
        <div class="toast-main">{{ notificationMessageTitle }}</div>
        <div v-if="notificationMessageSub" class="toast-sub">{{ notificationMessageSub }}</div>
      </div>
    </transition>

    <section class="scene-stage">
      <canvas ref="canvasRef" class="scene-canvas" aria-label="3D herdenkingsruimte"></canvas>

      <aside v-if="effectiveRole !== 'viewer'" class="left-toolbar vertical-center" aria-label="Acties en scènebeheer">
        <div id="asset-panel" class="left-toolbar-card" v-if="effectiveRole === 'admin'">
          <h3 class="left-toolbar-title">{{ leftToolbarTitle }}</h3>

          <nav class="action-dock column" aria-label="Snelle acties">
            <button v-if="effectiveRole === 'admin'" type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'room' }" @click="openQuickPanel('room')">
              <span class="dock-icon">🏠</span>
              <span class="dock-label">Ruimte</span>
            </button>
            <button v-if="effectiveRole === 'admin'" type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'models' }" @click="openQuickPanel('models')">
              <span class="dock-icon">🧩</span>
              <span class="dock-label">Modellen</span>
            </button>
            <button v-if="effectiveRole === 'admin'" type="button" class="dock-button" :class="{ active: showQuickPanel && activePanel === 'sound' }" @click="openQuickPanel('sound')">
              <span class="dock-icon">🔊</span>
              <span class="dock-label">Geluid</span>
            </button>
          </nav>

          <button
            v-if="effectiveRole === 'admin'"
            type="button"
            class="asset-reset-button"
            title="Reset deze kamer"
            @click="openResetRoomConfirm"
          >
            Kamer resetten
          </button>

        </div>
      </aside>

      <div id="quick-asset-panel" v-if="showQuickPanel && effectiveRole !== 'viewer'">
        <AssetPanel
          :show-floor="showFloor"
          :panel-type="activePanel"
          :current-room-theme="roomTheme"
          :room-themes="roomThemePresets"
          :initial-model-category="quickPanelModelCategory"
          :initial-media-mode="quickPanelMediaMode"
          :current-sound-settings="soundSettings"
          :is-admin="effectiveRole === 'admin'"
          @add-asset="handleAddAsset"
          @apply-room-theme="handleApplyRoomTheme"
          @apply-sound="handleApplySound"
          @toggle-floor="toggleFloorVisibility"
          @close-panel="closeQuickPanel"
          @update-media-mode="quickPanelMediaMode = $event"
          @place-photo="handlePlacePhoto"
          @place-audio="handlePlaceAudio"
          @place-video="handlePlaceVideo"
          @place-message="handlePlaceMessage"
          @place-candle="handlePlaceCandle"
        />
      </div>

      <div v-if="showResetRoomModal" class="modal-backdrop reset-room-backdrop" role="dialog" aria-modal="true" @click.self="cancelResetRoom">
        <div class="modal-card reset-room-modal-card">
          <div class="modal-card-header">
            <h3>Kamer resetten</h3>
            <button type="button" class="modal-close-button reset-room-close-button" @click="cancelResetRoom">×</button>
          </div>

          <p class="reset-room-warning">
            Dit zal alle voortgang ongedaan maken
          </p>

          <div class="reset-room-preview">
            Alle geplaatste objecten worden verwijderd en de ruimte keert terug naar een lege, neutrale basis.
          </div>

          <div class="room-settings-actions reset-room-actions">
            <button type="button" class="room-settings-secondary-button" @click="cancelResetRoom">Annuleren</button>
            <button type="button" class="reset-room-primary-button" @click="confirmResetRoom">Reset</button>
          </div>
        </div>
      </div>

      <nav id="scene-storage-dock" v-if="effectiveRole !== 'viewer'" class="scene-storage-dock" aria-label="Scène opslag acties">
        <button
          type="button"
          class="storage-dock-button"
          title="Eén stap terug"
          :disabled="!canUndo"
          @click="undoSceneChange"
        >
          <span class="dock-icon">↶</span>
          <span class="dock-label">Terug</span>
        </button>
        <button
          type="button"
          class="storage-dock-button"
          title="Eén stap vooruit"
          :disabled="!canRedo"
          @click="redoSceneChange"
        >
          <span class="dock-icon">↷</span>
          <span class="dock-label">Vooruit</span>
        </button>
        <button
          type="button"
          class="storage-dock-button"
          title="Sla scène op in lokale opslag"
          @click="saveSceneToStorage"
        >
          <span class="dock-icon">💾</span>
          <span class="dock-label">Opslaan</span>
        </button>
        <!-- Removed direct Load button: use Versions to restore saved scenes -->
        <button
          v-if="props.currentUser && props.currentUser.role !== 'visitor'"
          type="button"
          class="storage-dock-button"
          title="Bekijk opgeslagen versies"
          @click="showVersionsPanel = !showVersionsPanel"
        >
          <span class="dock-icon">🕘</span>
          <span class="dock-label">Versies</span>
        </button>

  <div v-if="showVersionsPanel && props.currentUser && props.currentUser.role !== 'visitor'" class="versions-panel">
          <div v-if="!savedScenes.length" class="versions-empty">Geen versies opgeslagen</div>
          <ul v-else class="versions-list">
            <li v-for="entry in savedScenes" :key="entry.id" class="version-item">
              <div class="version-meta">
                <div class="version-label">{{ entry.label }}</div>
                <div class="version-date">{{ new Date(entry.savedAt).toLocaleString() }}</div>
              </div>
              <div class="version-actions">
                <button type="button" class="version-restore" @click="loadSceneFromHistory(entry.id)">Herstel</button>
                <button type="button" class="version-delete" @click="deleteSavedScene(entry.id)">Verwijder</button>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      <div
        v-if="hoveredPhoto"
        :class="['photo-tooltip', hoveredPhoto.kind === 'candle' ? 'photo-tooltip--candle' : '']"
        :style="{
          left: `${hoveredPhotoPosition.x}px`,
          top: `${hoveredPhotoPosition.y}px`,
        }"
      >
        <strong>{{ hoveredPhoto.title }}</strong>
        <p class="hover-message">{{ hoveredPhoto.text || 'Geen extra tekst toegevoegd.' }}</p>
        <div class="hover-meta" v-if="hoveredPhoto.kind === 'candle'">
          <div class="hover-size"><strong>{{ hoveredPhoto.sizeLabelTitle }}</strong> <span class="hover-meta-value">{{ hoveredPhoto.sizeLabelValue }}</span></div>
          <div class="hover-date" v-if="hoveredPhoto.placedDateLabelValue"><strong>{{ hoveredPhoto.placedDateLabelTitle }}</strong> <span class="hover-meta-value">{{ hoveredPhoto.placedDateLabelValue }}</span></div>
        </div>
      </div>

      <aside v-if="selectedSceneObject && canEditSceneObjects" class="selection-panel">
        <div class="selection-panel-header">
          <h3>Geselecteerd object</h3>
          <button type="button" class="selection-close-button" @click="clearSceneSelection">×</button>
        </div>

        <div v-if="!hideDeleteHint" class="selection-hint">
          <span>Tip: druk op de Delete-toets om het geselecteerde object te verwijderen</span>
          <button type="button" class="selection-hint-close" @click="dismissDeleteHint" aria-label="Sluit hint">×</button>
        </div>

        <div v-if="canEditSelectedObjectColor" class="control-group color-group">
          <div class="control-label">Kleur</div>
          <div class="color-row">
            <div class="color-swatch-grid" role="group" aria-label="Kleuropties">
              <button
                v-for="color in objectColorPalette"
                :key="color"
                type="button"
                class="color-swatch"
                :class="{ active: selectedSceneObjectColor === color }"
                :style="{ backgroundColor: color }"
                :title="color"
                @click="applyColorToSelectedObject(color)"
              />
            </div>

            <div class="color-picker-field">
              <span @click="openColorPicker">Eigen kleur</span>
              <input
                ref="colorInputRef"
                aria-label="Eigen kleur"
                :value="selectedSceneObjectColor"
                type="color"
                class="color-picker-input"
                @input="applyColorToSelectedObject(($event.target).value)"
              />
            </div>
          </div>
        </div>

        <div class="selection-controls">
          <div class="control-group">
            <div class="control-label">Verplaatsen</div>
            <div class="control-grid move-grid">
              <button type="button" class="selection-icon-button" title="Vooruit" @click="applyTransformToSelectedObject({ moveZ: -transformStep })">
                <span class="icon">↑</span>
                <span class="label">Vooruit</span>
              </button>
              <button type="button" class="selection-icon-button" title="Achteruit" @click="applyTransformToSelectedObject({ moveZ: transformStep })">
                <span class="icon">↓</span>
                <span class="label">Achteruit</span>
              </button>
              <button type="button" class="selection-icon-button" title="Links" @click="applyTransformToSelectedObject({ moveX: -transformStep })">
                <span class="icon">←</span>
                <span class="label">Links</span>
              </button>
              <button type="button" class="selection-icon-button" title="Rechts" @click="applyTransformToSelectedObject({ moveX: transformStep })">
                <span class="icon">→</span>
                <span class="label">Rechts</span>
              </button>
              <button type="button" class="selection-icon-button" title="Omhoog" @click="applyTransformToSelectedObject({ moveY: transformStep })">
                <span class="icon">⬆</span>
                <span class="label">Omhoog</span>
              </button>
              <button type="button" class="selection-icon-button" title="Omlaag" @click="applyTransformToSelectedObject({ moveY: -transformStep })">
                <span class="icon">⬇</span>
                <span class="label">Omlaag</span>
              </button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Rotatie</div>
            <div class="control-grid rotate-grid">
              <button type="button" class="selection-icon-button" title="Draai links" @click="applyTransformToSelectedObject({ rotateY: -rotateStep })">
                <span class="icon">↶</span>
                <span class="label">Links</span>
              </button>
              <button type="button" class="selection-icon-button" title="Draai rechts" @click="applyTransformToSelectedObject({ rotateY: rotateStep })">
                <span class="icon">↷</span>
                <span class="label">Rechts</span>
              </button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Schaal</div>
            <div class="control-grid scale-grid">
              <button type="button" class="selection-icon-button" title="Verklein" @click="applyTransformToSelectedObject({ scaleAdjust: -scaleStep })">
                <span class="icon">⊖</span>
                <span class="label">Kleiner</span>
              </button>
              <button type="button" class="selection-icon-button" title="Vergroot" @click="applyTransformToSelectedObject({ scaleAdjust: scaleStep })">
                <span class="icon">⊕</span>
                <span class="label">Groter</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Candle-specific editor (only visible for candles selected by their creator) -->
        <div v-if="selectedSceneObject && selectedSceneObject.assetId === 'candle'" class="candle-editor">
          <div class="control-group">
            <div class="control-label">Boodschap</div>
            <textarea v-model="editCandleMessage" rows="3" class="candle-message-input" placeholder="Boodschap voor de kaars"></textarea>
          </div>

          <div class="control-group">
            <div class="control-label">Grootte</div>
            <select v-model="editCandleSize" class="candle-size-select">
              <option value="small">Klein</option>
              <option value="medium">Gemiddeld</option>
              <option value="large">Groot</option>
            </select>
          </div>

          <div class="selection-actions">
            <button type="button" class="selection-save-button" @click="applyCandleEdits">Opslaan</button>
            <button type="button" class="selection-delete-button" @click="requestDeleteSelectedSceneObject">Verwijderen</button>
          </div>
        </div>

        <!-- Fallback delete action for non-candle or general selection -->
        <div v-else class="selection-actions">
          <button type="button" class="selection-delete-button" @click="requestDeleteSelectedSceneObject">
            Verwijderen
          </button>
        </div>

        <div class="selection-messages">
          <h4>Berichten</h4>
          <div v-if="selectedSceneObject.messages && selectedSceneObject.messages.length" class="messages-list">
            <div v-for="m in selectedSceneObject.messages" :key="m.id" class="message-item">
              <div class="message-meta"><strong>{{ m.author }}</strong> · <small>{{ new Date(m.created_at).toLocaleString() }}</small></div>
              <div class="message-text">{{ m.text }}</div>
            </div>
          </div>

          <div class="message-input">
            <textarea v-model="newObjectMessage" placeholder="Voeg een bericht toe..." rows="3"></textarea>
            <div class="message-actions">
              <button type="button" class="message-add-button" @click="addMessageToSelectedObject(newObjectMessage)">Plaats bericht</button>
            </div>
          </div>
        </div>

      </aside>

      <!-- Room Settings Modal -->
      <div v-if="showRoomSettingsModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div id="room-settings-modal-card" class="modal-card room-settings-modal-card">
          <div class="modal-card-header">
            <h3>Kamerinstellingen</h3>
            <button type="button" class="modal-close-button" @click="showRoomSettingsModal = false">×</button>
          </div>

          <p class="room-settings-help">
            Houd de kamer privé als je een invite-code wilt genereren. De code blijft bestaan als je de kamer later openbaar maakt.
          </p>

          <div class="room-settings-row room-settings-grid">
            <div class="room-settings-field">
              <label class="room-settings-label" for="room-name-input">Kamer naam</label>
              <input id="room-name-input" v-model="roomName" class="room-settings-input" />
            </div>

            <div class="room-settings-field">
              <label class="room-settings-label" for="room-privacy-select">Privacy</label>
              <select id="room-privacy-select" v-model="roomPrivacy" class="room-settings-select">
                <option value="private">Privé</option>
                <option value="public">Openbaar</option>
              </select>
            </div>

            <div class="room-settings-field room-settings-code-field">
              <label class="room-settings-label">Invite-code</label>
              <button
                id="room-code-button"
                type="button"
                class="room-invite-button room-code-button"
                :disabled="roomPrivacy !== 'private'"
                @click="generateInviteCode"
              >
                Code genereren
              </button>
              <div v-if="roomPrivacy !== 'private'" class="room-settings-help">
                Je kunt alleen een code genereren als de kamer privé is.
              </div>
              <div v-if="roomInviteCode" class="room-invite-code">
                Huidige code: <strong>{{ roomInviteCode }}</strong>
              </div>
              <div v-else class="room-settings-help">
                Nog geen code gegenereerd voor deze kamer.
              </div>
            </div>
          </div>

          <div class="room-settings-section">
            <div class="room-settings-label">Co-editors uitnodigen</div>
            <p class="room-settings-help">
              Voeg mensen toe en kies hun rol.
            </p>

            <div id="room-invite-row" class="room-settings-row room-invite-form">
              <input
                id="room-invite-email-input"
                v-model="inviteEmail"
                class="room-settings-input room-invite-email-input"
                type="email"
                placeholder="E-mailadres"
              />

              <select id="room-invite-role-select" v-model="inviteRole" class="room-settings-select room-invite-role-select">
                <option v-for="option in inviteRoleOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>

              <button type="button" class="room-invite-button" @click="inviteMember">Uitnodigen</button>
            </div>

            <!-- co-admin removed; no special limit message -->
            <div v-if="roomPrivacy !== 'private' && inviteRole === 'viewer'" class="room-settings-help">
              Viewer-uitnodigingen zijn alleen beschikbaar als de kamer privé is.
            </div>

            <div class="room-members-list">
              <div v-if="!roomMembers.length" class="room-members-empty">Nog geen leden toegevoegd.</div>
              <div v-for="member in roomMembers" :key="member.id" class="room-member-row">
                <div class="room-member-meta">
                  <div class="room-member-email">{{ member.email }}</div>
                  <div class="room-member-role">{{ getMemberRoleLabel(member.role) }} · {{ member.status }}</div>
                </div>
                <button type="button" class="room-member-remove-button" @click="removeMember(member.id)">Verwijderen</button>
              </div>
            </div>
          </div>

          <div v-if="roomSettingsError" class="room-settings-error">{{ roomSettingsError }}</div>
          <div v-if="roomSettingsSuccess" class="room-settings-success">{{ roomSettingsSuccess }}</div>

          <div class="room-settings-actions">
            <button type="button" @click="showRoomSettingsModal = false" class="room-settings-secondary-button">Annuleren</button>
            <button id="room-settings-save" type="button" @click="saveRoomSettings" class="room-settings-primary-button">Opslaan</button>
          </div>
        </div>
      </div>

      <!-- Admin Settings Modal (placeholder) -->
      <div v-if="showAdminSettingsModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div id="admin-settings-modal-card" class="modal-card">
          <h3 id="admin-settings-modal-title">Accountinstellingen</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
            <div style="width:56px;height:56px;border-radius:28px;overflow:hidden;background:#ddd">
              <img v-if="props.currentUser && props.currentUser.avatar" :src="props.currentUser.avatar" style="width:100%;height:100%;object-fit:cover" />
            </div>
            <div>
              <div style="font-weight:700">{{ props.currentUser ? props.currentUser.email : username }}</div>
              <div style="font-size:13px;color:#666">Rol: {{ props.currentUser ? props.currentUser.role : 'viewer' }}</div>
            </div>
          </div>

          <div style="margin-top:12px">
            <label style="display:block;font-size:13px;color:#333">Display name</label>
            <input v-model="editDisplayName" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e6e6ee;margin-top:6px" />
          </div>

          <div v-if="props.currentUser && (props.currentUser.role === 'admin' || props.currentUser.role === 'editor')" id="admin-settings-my-rooms-section" class="room-settings-section">
            <div class="room-settings-label">Mijn ruimtes</div>
            <p class="room-settings-help">Hier zie je de ruimtes waartoe je toegang hebt.</p>

              <div id="room-switcher-list" v-if="roomSwitcherRooms.length" class="room-switcher-list">
        <div
        v-for="room in roomSwitcherRooms"
        :key="room.id"
        class="room-switcher-row"
        :class="{ active: room.id === props.roomId }"
      >
        <div class="room-switcher-meta">
          <div class="room-switcher-name">{{ room.name }}</div>
          <div class="room-switcher-subtitle">
            <span>{{ room.role === 'admin' ? 'Admin' : room.role === 'viewer' ? 'Viewer' : 'Co-editor' }}</span>
            <span>·</span>
            <span>{{ room.privacy === 'private' ? 'Privé' : 'Openbaar' }}</span>
            <span v-if="room.id === props.roomId">· Huidige ruimte</span>
          </div>
        </div>

        <span
          v-if="room.unreadModeratorNotifications > 0"
          class="room-switcher-badge"
        >
          {{ room.unreadModeratorNotifications }}
        </span>

        <button
          type="button"
          class="room-switcher-button"
          :disabled="room.id === props.roomId"
          @click="selectRoom(room.id)"
        >
          {{ room.id === props.roomId ? 'Geopend' : 'Openen' }}
        </button>
      </div>
    </div>

    <div v-else class="room-members-empty">
      <div>Nog geen andere ruimtes gevonden.</div>
    </div>

    <div
      v-if="props.currentUser && props.currentUser.role === 'admin'"
      style="margin-top:12px;display:flex;justify-content:flex-end"
    >
      <button
        type="button"
        class="room-switcher-button"
        @click="openCreateRoom"
      >
        Nieuwe kamer maken
      </button>
    </div>
        </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
            <button @click="showAdminSettingsModal = false" style="padding:8px 12px;border-radius:8px">Annuleren</button>
            <button @click="saveAdminSettings" style="padding:8px 12px;border-radius:8px;background:#6c5ce7;color:#fff;border:none">Opslaan</button>
          </div>
        </div>
      </div>
      <TutorialOverlay
        ref="tutorialRef"
        :steps="adminTutorialSteps"
        :first-run="tutorialFirstRun"
        @step-change="handleTutorialStepChange"
        @control-action="handleTutorialControlAction"
        @finish="handleTutorialFinish"
      />
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
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #d8d8d8;
  border-radius: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.2);
  padding: 14px 32px;
  margin: 18px 228px 12px;
  position: relative;
  z-index: 10010;
  transition:
    margin 0.28s ease,
    padding 0.28s ease,
    border-radius 0.28s ease,
    box-shadow 0.28s ease;
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
}

.brand-mark-image {
  height: 38px;
  width: auto;
  display: block;
}

.brand-mark::before,
.brand-mark::after {
  display: none;
}

.top-bar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 18px;
  max-width: 520px;
  opacity: 1;
  transform: translateX(0);
  overflow: visible;
  transition:
    max-width 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s ease,
    margin-left 0.28s ease;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
  flex: 0 0 auto;
}

.top-nav-menu-wrap {
  position: relative;
  display: block;
  margin-left: 18px;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-8px);
  z-index: 10040;
  transition:
    max-width 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s ease,
    margin-left 0.28s ease;
}

.top-nav-menu-button {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(198, 180, 208, 0.72);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(252, 248, 244, 0.96), rgba(242, 236, 245, 0.96));
  color: #4a3f67;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  position: relative;
  z-index: 10041;
}

.top-nav-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 4px;
  left: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
  width: min(220px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid rgba(198, 180, 208, 0.56);
  border-radius: 18px;
  background: rgba(255, 252, 255, 0.98);
  box-shadow: 0 14px 28px rgba(43, 23, 66, 0.12);
  z-index: 10030;
}

.top-nav-menu .floor-toggle {
  width: 100%;
  margin: 0;
  justify-content: center;
}

.room-title {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  overflow: visible;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0 2px 0 12px;
  max-width: 420px;
  opacity: 1;
  transform: translateY(0);
  transition:
    max-width 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s ease,
    margin 0.28s ease;
}

.room-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-privacy-indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  cursor: default;
  outline: none;
}

.room-privacy-indicator:focus-visible .room-privacy-icon,
.room-privacy-indicator:hover .room-privacy-icon {
  background: rgba(108, 92, 231, 0.12);
  box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.08);
}

.room-privacy-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 16px;
  line-height: 1;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.room-privacy-tooltip {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(20, 20, 24, 0.96);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform-origin: top center;
  z-index: 2;
}

.room-privacy-indicator:hover .room-privacy-tooltip,
.room-privacy-indicator:focus-visible .room-privacy-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.profile-area {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 28px;
  color: #1a1a1a;
  max-width: 240px;
  opacity: 1;
  transform: translateX(0);
  transition:
    max-width 0.28s ease,
    opacity 0.2s ease,
    transform 0.28s ease,
    margin 0.28s ease,
    gap 0.28s ease;
}

.profile-name {
  font-size: inherit;
  font-weight: 700;
}

.profile-menu-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-bell {
  position: absolute;
  top: -8px;
  right: -10px;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(175, 153, 193, 0.7);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.98), rgba(243, 235, 246, 0.96));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(35, 19, 48, 0.12);
  z-index: 2;
}

.notification-bell.active {
  border-color: rgba(177, 131, 168, 0.95);
  box-shadow: 0 10px 20px rgba(119, 80, 128, 0.18);
}

.notification-bell-icon {
  font-size: 14px;
  line-height: 1;
}

.notification-bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #c23a3a;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(0,0,0,0.18);
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

.avatar-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #c23a3a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.18);
  pointer-events: none;
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
  z-index: 10020;
  pointer-events: auto;
}

.notification-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: min(360px, calc(100vw - 24px));
  max-height: 420px;
  padding: 12px;
  border: 1px solid #e0d6ea;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  z-index: 10022;
  overflow: hidden;
}

.notification-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.notification-panel-title {
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: #1b1630;
}

.notification-panel-subtitle {
  margin-top: 2px;
  color: #6a6180;
  font-size: 12px;
}

.notification-panel-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f2edf7;
  color: #4b3f66;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.notification-panel-empty {
  padding: 18px 12px;
  color: #6a6180;
  font-size: 14px;
  text-align: center;
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  max-height: 350px;
}

.notification-item {
  padding: 12px;
  border: 1px solid #ece5f3;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 244, 251, 0.98));
}

.notification-item.unread {
  border-color: rgba(177, 131, 168, 0.55);
  box-shadow: inset 0 0 0 1px rgba(177, 131, 168, 0.12);
}

.notification-item-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  margin-bottom: 6px;
}

.notification-kind {
  padding: 3px 8px;
  border-radius: 999px;
  background: #f4edf8;
  color: #6c4f82;
  font-weight: 700;
}

.notification-time {
  color: #8c819e;
}

.notification-item-title {
  color: #1b1630;
  font-size: 14px;
  font-weight: 800;
}

.notification-item-message,
.notification-item-room {
  margin-top: 4px;
  color: #4e4563;
  font-size: 13px;
  line-height: 1.35;
}

.notification-item-action {
  margin-top: 10px;
  border: 1px solid rgba(177, 131, 168, 0.42);
  border-radius: 999px;
  background: #fff;
  color: #6d4c86;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 11px;
  cursor: pointer;
}

.profile-menu-username {
  display: none;
  padding: 4px 12px 10px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}


.profile-fade-enter-active, .profile-fade-leave-active {
  transition: opacity .18s ease, transform .18s cubic-bezier(.2,.9,.2,1);
}
.profile-fade-enter-from, .profile-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.profile-fade-enter-to, .profile-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
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
  width: min(760px, calc(100vw - 48px));
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
  position: relative;
}

.reset-room-backdrop {
  background: rgba(72, 20, 20, 0.42);
}

.reset-room-modal-card {
  width: min(520px, calc(100vw - 48px));
  background: linear-gradient(180deg, #fff6f6 0%, #fff1f1 100%);
  border: 1px solid rgba(208, 116, 116, 0.28);
}

.reset-room-modal-card .modal-card-header h3 {
  color: #8b2d2d;
}

.reset-room-close-button {
  background: rgba(255, 224, 224, 0.95);
  color: #8b2d2d;
}

.reset-room-warning {
  margin: 16px 0 10px;
  padding-left: 0;
  color: #6e1f1f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
}

.reset-room-preview {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(208, 116, 116, 0.18);
  color: #6f4a4a;
  font-size: 14px;
  line-height: 1.45;
}

.reset-room-actions {
  margin-top: 18px;
}

.reset-room-primary-button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(181, 72, 72, 0.42);
  background: linear-gradient(180deg, #ffd9d9 0%, #ffbcbc 100%);
  color: #7f2222;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 800;
}

.reset-room-primary-button:hover {
  background: linear-gradient(180deg, #ffe2e2 0%, #ffb2b2 100%);
}

.room-settings-modal-card {
  max-height: min(90vh, 860px);
  overflow: auto;
}

.modal-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-card-header h3 {
  margin: 0;
}

.modal-close-button {
  border: none;
  border-radius: 999px;
  background: rgba(242, 175, 199, 0.18);
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 12px;
}

.room-settings-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0 8px;
}

.room-settings-grid {
  align-items: flex-start;
  gap: 16px;
}

.room-settings-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 180px;
  min-width: 180px;
}

.room-settings-code-field {
  flex-basis: 240px;
}

.room-settings-input,
.room-settings-select {
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid #dcdde4;
  background: #fff;
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
}

.room-settings-select:focus,
.room-settings-input:focus {
  outline: 2px solid rgba(108, 92, 231, 0.18);
  outline-offset: 1px;
}

.room-settings-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #ececf2;
}

.room-switcher-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.room-switcher-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid #e9e9f2;
  border-radius: 12px;
  background: #fafafe;
}

.room-switcher-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #c23a3a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.room-switcher-row.active {
  border-color: rgba(108, 92, 231, 0.26);
  background: rgba(108, 92, 231, 0.06);
}

.room-switcher-meta {
  min-width: 0;
}

.room-switcher-name {
  font-weight: 700;
  color: #1a1a1a;
  word-break: break-word;
}

.room-switcher-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  font-size: 13px;
  color: #666;
}

.room-switcher-button {
  flex: 0 0 auto;
  border: none;
  border-radius: 10px;
  background: #6c5ce7;
  color: #fff;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 9px 12px;
}

.room-switcher-button:disabled {
  background: #d9d9ea;
  color: #666;
  cursor: default;
}

.room-invite-form {
  align-items: flex-start;
}

.room-invite-email-input {
  flex: 1 1 260px;
}

.room-invite-role-select {
  flex: 0 0 180px;
}

.room-code-button[disabled] {
  opacity: 0.48;
  cursor: not-allowed;
}

.room-members-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-members-empty {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f7fb;
  color: #666;
  font-size: 14px;
}

.room-switcher-empty-button {
  margin-top: 10px;
  background: #6c5ce7;
}

.room-member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #ececf2;
  background: #fff;
}

.room-member-meta {
  min-width: 0;
}

.room-member-email {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
}

.room-member-role {
  margin-top: 4px;
  font-size: 13px;
  color: #666;
}

.room-member-remove-button {
  flex: 0 0 auto;
  border: 1px solid #dfdfea;
  border-radius: 10px;
  background: #fff;
  color: #333;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 9px 12px;
}

.room-member-remove-button:hover {
  background: #f8f8fc;
}

.room-settings-warning {
  color: #a86500;
}

.room-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.room-settings-secondary-button,
.room-settings-primary-button {
  padding: 10px 14px;
  border-radius: 10px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 700;
}

.room-settings-secondary-button {
  border: 1px solid #cfcfe0;
  background: #fff;
  color: #222;
}

.room-settings-primary-button {
  border: none;
  background: #6c5ce7;
  color: #fff;
}

.room-settings-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.room-settings-error {
  color: #d9534f;
  font-size: 13px;
  margin-top: 6px;
}

.room-settings-success {
  color: #28a745;
  font-size: 13px;
  margin-top: 6px;
}

.room-setting-pill,
.room-invite-button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 600;
}

.room-settings-help {
  margin: 0 0 10px;
  font-size: 13px;
  color: #666;
}

.room-invite-code {
  margin: 6px 0 12px;
  font-size: 13px;
  color: #333;
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
  background: var(--page-bg-gradient);
  overflow: hidden;
}

.scene-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.action-dock {
  position: static;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dock-button {
  width: 162px;
  height: 48px;
  border: 1px solid rgba(198, 180, 208, 0.72);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(252, 248, 244, 0.96), rgba(242, 236, 245, 0.96));
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 14px;
}

.dock-button.active {
  border-color: rgba(177, 131, 168, 0.92);
  background: linear-gradient(180deg, rgba(241, 221, 231, 0.95), rgba(228, 214, 236, 0.95));
  box-shadow: 0 8px 16px rgba(43, 23, 66, 0.1);
}

.asset-reset-button {
  margin-top: 12px;
  width: 162px;
  border: 1px solid rgba(208, 116, 116, 0.52);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 235, 235, 0.98), rgba(255, 218, 218, 0.96));
  color: #8b2d2d;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  padding: 12px 10px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.asset-reset-button:hover {
  background: linear-gradient(180deg, rgba(255, 226, 226, 0.99), rgba(255, 206, 206, 0.98));
  transform: translateY(-1px);
}

.dock-icon {
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 1;
  color: #4a3f67;
}

.dock-label {
  font-size: 13px;
  font-weight: 700;
  color: #5b4c77;
}

.left-toolbar {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 26;
}

/* Accent style reused from asset dock buttons for top-nav */
.topnav-accent-button {
  border: 1px solid rgba(198, 180, 208, 0.72);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(252, 248, 244, 0.96), rgba(242, 236, 245, 0.96));
  color: #4a3f67;
  padding: 10px 14px;
  margin-left: 12px;
}

.mode-menu-wrap {
  position: relative;
}

.mode-menu-wrap--topnav {
  width: 100%;
}

.mode-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mode-menu-caret {
  font-size: 12px;
  line-height: 1;
}

.mode-menu {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  min-width: 220px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(12px);
  z-index: 10030;
}

.mode-menu--inline {
  position: static;
  margin-top: 8px;
  min-width: 100%;
}

.mode-menu-item {
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mode-menu-check {
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #6c5ce7;
}

.mode-menu-item.active {
  background: rgba(242, 175, 199, 0.26);
  color: #1f1a3b;
  font-weight: 700;
}

.topnav-accent-button.active {
  border-color: rgba(177, 131, 168, 0.92);
  background: linear-gradient(180deg, rgba(241, 221, 231, 0.95), rgba(228, 214, 236, 0.95));
  box-shadow: 0 8px 16px rgba(43, 23, 66, 0.08);
}

.left-toolbar-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(188, 152, 188, 0.25);
  box-shadow: 0 10px 22px rgba(48, 38, 78, 0.12);
  backdrop-filter: blur(6px);
}

.left-toolbar-title {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  color: #111111;
}

.scene-storage-dock {
  position: absolute;
  right: 18px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 27;
}

.storage-dock-button {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(137, 118, 175, 0.4);
  border-radius: 16px;
  background: rgba(241, 236, 249, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.storage-dock-button .dock-icon {
  font-size: 22px;
}

.storage-dock-button .dock-label {
  display: none;
}

.storage-dock-button:hover {
  background: rgba(233, 224, 248, 0.98);
}

.storage-dock-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}


.notification-toast {
  position: fixed;
  z-index: 10100;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(18,16,36,0.14);
  color: #fff;
  font-weight: 700;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
}

.notification-toast.info { background: linear-gradient(180deg,#6c757d,#5a6268); }
.notification-toast.success { background: linear-gradient(180deg,#4caf50,#3a9b3a); }
.notification-toast.error { background: linear-gradient(180deg,#e04b4b,#c23a3a); }

.notification-toast .toast-main { font-size: 15px; line-height: 1.2; }
.notification-toast .toast-sub { font-size: 12px; opacity: 0.95; margin-top: 4px; font-weight: 600 }

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .22s ease, transform .22s cubic-bezier(.2,.9,.2,1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-6px); }
.toast-fade-enter-to, .toast-fade-leave-from { opacity: 1; transform: translateY(0); }

.versions-panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  width: 320px;
  max-height: 56vh;
  overflow: auto;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(96,76,150,0.12);
  box-shadow: 0 14px 30px rgba(0,0,0,0.12);
  z-index: 28;
}

.versions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #faf9ff;
  border: 1px solid rgba(200,190,230,0.24);
}

.version-meta { flex: 1 1 auto; min-width: 0; }
.version-label { font-weight: 700; color: #1a1a1a; font-size: 14px; }
.version-date { font-size: 12px; color: #6b6b7b; margin-top: 4px; }

.version-actions { display: flex; gap: 8px; flex: 0 0 auto; }
.version-restore, .version-delete { border: none; padding: 8px 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.version-restore { background: #6c5ce7; color: #fff; }
.version-delete { background: #fff; border: 1px solid rgba(200,50,50,0.12); color: #c23a3a; }


.photo-tooltip {
  position: absolute;
  z-index: 25;
  min-width: 180px;
  max-width: 240px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 252, 248, 0.97);
  border: 1px solid rgba(120, 98, 74, 0.18);
  box-shadow: 0 8px 20px rgba(60, 44, 30, 0.12);
  color: #1d1a16;
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.photo-tooltip strong {
  display: block;
  margin-bottom: 4px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 700;
}

.photo-tooltip p {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: #5f564d;
  white-space: pre-line;
}

.photo-tooltip--candle {
  background: rgba(255, 248, 238, 0.98);
  border-color: rgba(184, 128, 66, 0.28);
  box-shadow: 0 10px 22px rgba(108, 72, 32, 0.14);
}

.photo-tooltip--candle strong {
  color: #6b3f16;
}

.photo-tooltip--candle p {
  color: #6a5340;
}

.photo-tooltip .hover-meta {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photo-tooltip .hover-size {
  font-weight: 400;
  color: #5f564d;
  font-size: 12px;
}

.photo-tooltip .hover-date {
  font-size: 12px;
  color: #5f564d;
  font-weight: 400;
}

.photo-tooltip .hover-meta strong {
  display: inline;
  margin-bottom: 0;
  font-weight: 700;
}

.photo-tooltip .hover-meta-value {
  color: #5f564d;
  font-weight: 400;
}

.photo-tooltip--candle .hover-meta strong {
  color: #6b3f16;
}

.selection-panel {
  position: absolute;
  right: 20px;
  bottom: 92px;
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

.candle-editor .candle-message-input {
  width: 100%;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(90,80,70,0.12);
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  resize: vertical;
}

.candle-editor .candle-size-select {
  width: 100%;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(90,80,70,0.12);
  font-family: 'Outfit', 'Segoe UI', sans-serif;
}

.selection-save-button {
  background: #6c5ce7;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  margin-right: 8px;
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

.color-group {
  margin-top: 8px;
  padding: 12px;
  border-radius: 12px;
  /* Subtle, neutral styling to match other controls */
  background: transparent;
  border: 1px solid rgba(31, 26, 59, 0.06);
}

.color-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-swatch-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px solid rgba(31, 26, 59, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.color-swatch.active {
  border-color: #1f1a3b;
  box-shadow: 0 0 0 2px rgba(31, 26, 59, 0.14);
}

.color-picker-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #666666;
}

.color-picker-input {
  width: 44px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
}

.color-picker-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-input::-webkit-color-swatch {
  border: 1px solid rgba(31, 26, 59, 0.18);
  border-radius: 10px;
}

.color-picker-field > span {
  cursor: pointer;
}

.color-picker-input:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(31, 26, 59, 0.10);
  border: 1px solid rgba(31, 26, 59, 0.28);
}

.color-picker-field > span:hover {
  color: #1f1a3b;
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
  grid-template-columns: repeat(3, 1fr);
}

.scale-grid {
  grid-template-columns: repeat(3, 1fr);
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
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: 12px;
    padding: 12px 16px;
    margin: 12px 18px 10px;
  }

  .top-bar-controls {
    max-width: 0;
    opacity: 0;
    transform: translateX(-10px);
    margin-left: 0;
    pointer-events: none;
  }

  .room-title {
    display: none;
  }

  .brand-lockup {
    grid-column: 1;
    font-size: 22px;
  }

  .top-bar-actions {
    grid-column: 3;
    justify-self: end;
    margin-left: 0;
    flex: 0 0 auto;
  }

  .top-nav-menu-wrap {
    width: 48px;
    max-width: 48px;
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
    margin-left: 0;
    overflow: visible;
  }

  .top-bar-controls,
  .room-title {
    display: none;
  }

  .profile-area {
    margin-left: 0;
    gap: 6px;
    font-size: 20px;
    max-width: 120px;
  }

  .profile-name {
    display: none;
  }

  .profile-menu-username {
    display: block;
  }

  .action-dock {
    gap: 8px;
  }

  .left-toolbar {
    left: 10px;
    top: 50%;
  }

  .left-toolbar-card {
    padding: 12px;
    gap: 10px;
  }

  .left-toolbar-title {
    font-size: 30px;
  }

  .dock-button {
    width: 148px;
    height: 40px;
  }

  .scene-storage-dock {
    right: 10px;
    bottom: 10px;
    gap: 8px;
  }

  .storage-dock-button {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .dock-icon {
    font-size: 18px;
  }

  .selection-panel {
    top: 136px;
    right: 10px;
    width: min(310px, calc(100% - 20px));
    max-height: 58vh;
  }
}

</style>