<script setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue'

const props = defineProps({
  showFloor: {
    type: Boolean,
    required: true,
  },
  panelType: {
    type: String,
    required: true,
  },
  currentRoomTheme: {
    type: Object,
    default: () => ({
      presetId: 'soft-pink',
      wallShadeIndex: 2,
      floorShadeIndex: 2,
      wallMaterialIndex: 0,
      floorMaterialIndex: 0,
    }),
  },
  roomThemes: {
    type: Array,
    default: () => [],
  },
  initialModelCategory: {
    type: String,
    default: '',
  },
  currentSoundSettings: {
    type: Object,
    default: () => ({
      enabled: false,
      presetId: 'room-tone',
      volume: 0.45,
    }),
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-asset', 'toggle-floor', 'close-panel', 'apply-room-theme', 'apply-sound', 'place-photo', 'place-message', 'place-candle', 'place-audio', 'place-video'])

const mediaMode = ref('chooser')
const photoSourceMode = ref('gallery')
const selectedPhoto = ref(null)
const uploadedPhotos = ref([])
const selectedGalleryPhotoId = ref('sunset-memory')
const photoTitle = ref('')
const photoText = ref('')
const photoFileInput = ref(null)

// Audio flow state
const audioSourceMode = ref('upload')
const audioFileInput = ref(null)
const uploadedAudios = ref([])
const selectedAudio = ref(null)
const audioUrlInput = ref('')
const audioTitle = ref('')
const audioText = ref('')
const isRecording = ref(false)
let mediaRecorder = null
let audioChunks = []

// Video flow state
const videoSourceMode = ref('upload')
const videoFileInput = ref(null)
const uploadedVideos = ref([])
const selectedVideo = ref(null)
const videoUrlInput = ref('')
const videoTitle = ref('')
const videoText = ref('')
const isVideoRecording = ref(false)
let videoRecorder = null
let videoChunks = []

// Message flow state
const messageText = ref('')

// Candle flow state
const familyMode = ref('chooser')
const selectedCandleSize = ref(null)
const candleName = ref('')
const candleMessage = ref('')

const candleSizes = [
  { id: 'small', label: 'Klein', size: 'S' },
  { id: 'medium', label: 'Gemiddeld', size: 'M' },
  { id: 'large', label: 'Groot', size: 'L' },
]

const mediaActionButtons = [
  { id: 'photo', label: 'Foto', icon: '🖼️' },
  { id: 'audio', label: 'Audio', icon: '🎧' },
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'candle', label: 'Kaars', icon: '🕯️' },
]

const panelTitle = {
  room: 'Ruimte',
  sound: 'Geluid',
  media: 'Media',
  messages: 'Berichten',
  family: 'Kaarsje',
  models: 'Modellen',
}

const panelSubtitle = {
  room: 'Kies een thema voor muren en vloer.',
  sound: 'Kies een rustige geluidslaag die past bij de ruimte.',
  media: 'Voeg foto, audio of video toe aan de ruimte.',
  messages: 'Bekijk en verzamel herinneringen.',
  family: 'Laat een lichtje of familiebericht achter.',
  models: 'Kies een categorie en plaats objecten in de ruimte.',
}

const selectedRoomThemeId = ref('')

const soundPresets = [
  { id: 'room-tone', label: 'Rustige sfeer', detail: 'Zachte kamerklank met een warme basis.', icon: '🌫️' },
  { id: 'breeze', label: 'Bries', detail: 'Lichte ruis alsof er zacht wind door de ruimte gaat.', icon: '🍃' },
  { id: 'rain', label: 'Regen', detail: 'Zachte regenachtige achtergrond voor een rustige sfeer.', icon: '🌧️' },
  { id: 'crackle', label: 'Kaarsgeknetter', detail: 'Heel subtiel, warm geknetter als bij een kaars of haard.', icon: '🕯️' },
]

const selectedSoundState = computed(() => props.currentSoundSettings || {
  enabled: false,
  presetId: 'room-tone',
  volume: 0.45,
})

const fallbackRoomThemes = [
  {
    id: 'soft-pink',
    name: 'Zacht roze',
    wallShades: ['#fde8ef', '#f8bfd0', '#f2afc7', '#e78ead', '#c66f8f'],
    floorShades: ['#eceff2', '#d8dde3', '#c5ccd4', '#adb7c1', '#8e9aa7'],
  },
  {
    id: 'warm-sand',
    name: 'Warm zand',
    wallShades: ['#f9efe1', '#f3e0c6', '#ebceaa', '#dcb886', '#c99b5f'],
    floorShades: ['#f0e7db', '#ddd1c0', '#c8b39a', '#b09375', '#927458'],
  },
  {
    id: 'cool-pearl',
    name: 'Koel parel',
    wallShades: ['#fbfcfe', '#f5f7fb', '#e7ecf2', '#d8e0e9', '#c2cfdb'],
    floorShades: ['#eff3f6', '#dde3e9', '#c9d2db', '#b1bcc7', '#95a3b1'],
  },
  {
    id: 'sage-mist',
    name: 'Saliegroen',
    wallShades: ['#eef3ee', '#dce8db', '#c5d4c6', '#aebcae', '#8f9e90'],
    floorShades: ['#edf0ea', '#d8dfd4', '#c2cbbe', '#aab6a6', '#8f9b8d'],
  },
  {
    id: 'dusty-rose',
    name: 'Stofroze',
    wallShades: ['#f9ebef', '#efc7d2', '#e4a7b8', '#cd8399', '#b25f76'],
    floorShades: ['#ede7e6', '#d8cecb', '#c0b2ae', '#a58f8b', '#8b716f'],
  },
  {
    id: 'linen-cloud',
    name: 'Linnen',
    wallShades: ['#fcf7ef', '#f4ead8', '#e7d9c3', '#d4c1a6', '#bea384'],
    floorShades: ['#f1ece4', '#ddd6ca', '#c6b8a4', '#aa9780', '#8d7b68'],
  },
  {
    id: 'mist-blue',
    name: 'Mistblauw',
    wallShades: ['#f4f8fb', '#dfeaf2', '#c8dae7', '#a9c1d4', '#879fb9'],
    floorShades: ['#edf2f6', '#d8e1e8', '#c0cdd8', '#a6b5c5', '#8796a8'],
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    wallShades: ['#f9ece5', '#e9c4b3', '#d79e85', '#bf7a61', '#9f5b45'],
    floorShades: ['#efe1d7', '#dbc4b3', '#c4a08d', '#a97c67', '#88614f'],
  },
  {
    id: 'charcoal-silk',
    name: 'Zijdegrijs',
    wallShades: ['#f4f4f5', '#e2e4e8', '#c9cdd4', '#a6adb8', '#7f8894'],
    floorShades: ['#ececef', '#d8dbe0', '#c0c5cf', '#a2a9b5', '#808998'],
  },
]

const roomThemes = computed(() => props.roomThemes.length ? props.roomThemes : fallbackRoomThemes)

const roomThemeRows = computed(() => {
  const rows = []

  for (let index = 0; index < roomThemes.value.length; index += 3) {
    rows.push(roomThemes.value.slice(index, index + 3))
  }

  return rows
})

const selectedRoomTheme = computed(() => roomThemes.value.find(theme => theme.id === selectedRoomThemeId.value) || roomThemes.value[0])

const getRoomThemeRowSelection = (row) => row.find(theme => theme.id === selectedRoomThemeId.value) || null

const selectedRoomThemeState = computed(() => props.currentRoomTheme || { presetId: 'soft-pink', wallShadeIndex: 2, floorShadeIndex: 2, wallMaterialIndex: 0, floorMaterialIndex: 0 })

const applyUseTextures = (enabled) => {
  const basePreset = selectedRoomThemeId.value || selectedRoomThemeState.value?.presetId || 'soft-pink'
  const payload = { presetId: basePreset, useTextures: enabled }
  // When textures are turned off, ensure color mode is enabled so the
  // room shows the selected shade instead of a neutral white/grey surface.
  if (enabled === false) payload.useColor = true

  emit('apply-room-theme', payload)
}

const applyUseColor = (enabled) => {
  if (!selectedRoomThemeId.value) {
    emit('apply-room-theme', { presetId: selectedRoomThemeState.value?.presetId || 'soft-pink', useColor: enabled })
    return
  }

  emit('apply-room-theme', { presetId: selectedRoomThemeId.value, useColor: enabled })
}

const toggleUseColor = () => {
  const current = typeof selectedRoomThemeState.value?.useColor === 'boolean' ? selectedRoomThemeState.value.useColor : true
  applyUseColor(!current)
}

const applyRoomMaterial = (target, materialIndex) => {
  if (!selectedRoomThemeId.value) return
  emit('apply-room-theme', {
    presetId: selectedRoomThemeId.value,
    [target === 'floor' ? 'floorMaterialIndex' : 'wallMaterialIndex']: materialIndex,
  })
}
// UI-side defaults (match SceneCanvas defaults) — used when theme presets don't include material descriptors
const uiWallMaterials = [
  { id: 'whitepaper', label: 'White', map: '/textures/walls/wallpaper_whitepaper.jpg' },
  { id: 'pinkbrick', label: 'Pink brick', map: '/textures/walls/wallpaper_pinkbrick.jpg' },
  { id: 'greybrick', label: 'Grey brick', map: '/textures/walls/wallpaper_greybrick.jpg' },
]

const uiFloorMaterials = [
  { id: 'wood_white', label: 'White beach', map: '/textures/floors/wood_whitebeach.jpg' },
  { id: 'wood_dark', label: 'Dark brown', map: '/textures/floors/wood_darkbrown.jpg' },
  { id: 'wood_bw', label: 'Black/white', map: '/textures/floors/wood_blackwhites.jpg' },
]

watch(() => props.currentRoomTheme?.presetId, (presetId) => {
  if (!presetId) return
  if (selectedRoomThemeId.value === '') {
    selectedRoomThemeId.value = presetId
  }
})

const selectRoomTheme = (themeId) => {
  if (selectedRoomThemeId.value === themeId) {
    selectedRoomThemeId.value = ''
    return
  }

  selectedRoomThemeId.value = themeId
  emit('apply-room-theme', { presetId: themeId })
}

const applyRoomShade = (target, shadeIndex) => {
  if (!selectedRoomThemeId.value) return
  emit('apply-room-theme', {
    presetId: selectedRoomThemeId.value,
    [target === 'floor' ? 'floorShadeIndex' : 'wallShadeIndex']: shadeIndex,
  })
}

const isActiveTheme = (themeId) => selectedRoomThemeState.value?.presetId === themeId || selectedRoomThemeId.value === themeId

// Models panel data (scaffold)
const modelCategories = [
  { id: 'meubels', label: 'Meubels' },
  { id: 'apparaten', label: 'Apparaten' },
  { id: 'licht', label: 'Licht' },
  { id: 'planten', label: 'Planten' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'voertuigen', label: 'Voertuigen' },
]

const selectedModelCategory = ref('meubels')

const selectedModelCategoryLabel = computed(() => {
  return modelCategories.find(category => category.id === selectedModelCategory.value)?.label || 'Items'
})

const selectedModelItems = computed(() => {
  return modelBank[selectedModelCategory.value] || []
})

// simple scaffold of models per category (placeholders)
const modelBank = {
  licht: [
    { id: 'lamp_floor_01', name: 'Staande lamp', detail: 'Hoge vloerlamp voor zachte sfeer in de hoek.', icon: '🛋️' },
    { id: 'lamp_table_01', name: 'Tafellamp', detail: 'Kleine lamp voor een kast of bijzettafel.', icon: '💡' },
    { id: 'lamp_hanging_01', name: 'Hanglamp', detail: 'Sfeervolle hanglamp voor boven een tafel.', icon: '🏮' },
  ],
  meubels: [
    { id: 'chair_01', name: 'Stoel', detail: 'Lichte houten stoel voor in een kamerhoek.', icon: '💺' },
    { id: 'table_01', name: 'Bijzettafel', detail: 'Klein tafeltje voor een plant of kaars.', icon: '🪑' },
    { id: 'sofa_01', name: 'Bank', detail: 'Compacte bank als extra meubelstuk.', icon: '🛋️' },
    { id: 'bookshelf_01', name: 'Boekenkast', detail: 'Hoge kast voor boeken en rustige decoratie.', icon: '📚' },
    { id: 'desk_01', name: 'Bureau', detail: 'Werkplek met ruimte voor een scherm en lamp.', icon: '🧑‍💻' },
    { id: 'desk_chair_01', name: 'Bureaustoel', detail: 'Comfortabele stoel voor achter het bureau.', icon: '💺' },
    { id: 'carpet_01', name: 'Tapijt', detail: 'Zacht vloerkleed dat de zithoek afbakent.', icon: '🟪' },
    { id: 'side_chair_01', name: 'Bijzetstoel', detail: 'Kleine stoel voor naast de bank of tafel.', icon: '🪑' },
  ],
  planten: [
    { id: 'plant_01', name: 'Monstera', detail: 'Grote bladplant met rustige uitstraling.', icon: '🪴' },
    { id: 'plant_02', name: 'Vetplant', detail: 'Klein en onderhoudsvriendelijk object.', icon: '🌵' },
  ],
  apparaten: [
    { id: 'speaker_01', name: 'Luidspreker', detail: 'Decoratief audio-object voor de ruimte.', icon: '🔊' },
    { id: 'tv_01', name: 'Televisie', detail: 'Modern scherm voor een rustige leefruimte.', icon: '📺' },
    { id: 'laptop_01', name: 'Laptop', detail: 'Compact werk- of studieapparaat.', icon: '💻' },
  ],
  hobby: [
    { id: 'guitar_01', name: 'Gitaar', detail: 'Persoonlijk object voor een hobbyhoek.', icon: '🎸' },
    { id: 'easel_01', name: 'Schildersezel', detail: 'Rustig creatief object voor teken- of schilderhoek.', icon: '🖼️' },
    { id: 'ball_01', name: 'Voetbal', detail: 'Eenvoudig sportobject voor een actieve hobbyhoek.', icon: '⚽' },
  ],
  voertuigen: [
    { id: 'bike_01', name: 'Fiets', detail: 'Vervoersmiddel met een speels en herkenbaar silhouet.', icon: '🚲' },
    { id: 'car_01', name: 'Auto', detail: 'Klein voertuig voor een speels accent.', icon: '🚗' },
  ],
}

const showModelSubmenu = ref(false)

watch(() => [props.panelType, props.initialModelCategory], ([panelType, initialModelCategory]) => {
  if (panelType !== 'models') {
    return
  }

  if (initialModelCategory) {
    selectedModelCategory.value = initialModelCategory
    showModelSubmenu.value = true
    return
  }

  showModelSubmenu.value = false
})

const selectModelCategory = (catId) => {
  selectedModelCategory.value = catId
  // open the separate submenu panel
  showModelSubmenu.value = true
}

const closeModelSubmenu = () => {
  showModelSubmenu.value = false
}

const placeModel = (model) => {
  // emit generic add-asset with model id — SceneCanvas can interpret this
  emit('add-asset', { id: model.id, name: model.name, category: selectedModelCategory.value })
  handleClosePanel()
}

const sampleGalleryPhotos = [
  {
    id: 'sunset-memory',
    name: 'Sunset.jpg',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#ffd9a8"/>
            <stop offset="55%" stop-color="#f2a36f"/>
            <stop offset="100%" stop-color="#b65c73"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <circle cx="560" cy="170" r="70" fill="#fff3cc" opacity="0.95"/>
        <rect x="0" y="430" width="800" height="170" fill="#4d3f5f" opacity="0.55"/>
        <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="42" fill="#ffffff" text-anchor="middle">Herinnering</text>
      </svg>
    `),
  },
  {
    id: 'soft-flowers',
    name: 'Bloemen.png',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#f4e7ef"/>
        <circle cx="180" cy="190" r="70" fill="#f09ab6"/>
        <circle cx="620" cy="170" r="90" fill="#cba7f3"/>
        <circle cx="500" cy="360" r="130" fill="#8ee0d2" opacity="0.9"/>
        <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="40" fill="#5f4d6f" text-anchor="middle">Stock image</text>
      </svg>
    `),
  },
  {
    id: 'family-table',
    name: 'Familie.jpeg',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#dbe8f6"/>
        <rect x="0" y="360" width="800" height="240" fill="#f3d5c4"/>
        <circle cx="180" cy="250" r="85" fill="#8e6d4f"/>
        <circle cx="420" cy="220" r="60" fill="#f5b36b"/>
        <circle cx="610" cy="255" r="92" fill="#e48db0"/>
        <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="40" fill="#2f3a52" text-anchor="middle">Gallery</text>
      </svg>
    `),
  },
]

const currentPhotoPreview = computed(() => {
  return selectedPhoto.value || sampleGalleryPhotos.find(photo => photo.id === selectedGalleryPhotoId.value) || sampleGalleryPhotos[0]
})

const panelHeading = computed(() => {
  if (props.panelType !== 'media') return panelTitle[props.panelType]

  if (mediaMode.value === 'photo-source' || mediaMode.value === 'photo-details') return 'Media - Foto'
  if (mediaMode.value === 'audio-source' || mediaMode.value === 'audio-details') return 'Media - Audio'
  if (mediaMode.value === 'video-source' || mediaMode.value === 'video-details') return 'Media - Video'
  if (mediaMode.value === 'candle-source' || mediaMode.value === 'candle-details') return 'Media - Kaars'
  if (mediaMode.value === 'coming-soon') return 'Binnenkort'

  return panelTitle.media
})

const panelCopy = computed(() => {
  if (props.panelType !== 'media') {
    return panelSubtitle[props.panelType]
  }

  if (mediaMode.value === 'photo-source') {
    return 'Upload één of meerdere foto’s van je eigen apparaat of kies uit onze galerie.'
  }

  if (mediaMode.value === 'audio-source') {
    return 'Upload een audiobestand, plak een URL of neem een kort bericht op.'
  }

  if (mediaMode.value === 'video-source') {
    return 'Upload een videobestand, plak een URL of neem een korte opname met je camera.'
  }

  if (mediaMode.value === 'candle-source') {
    return 'Kies een kaars, vul daarna je naam en boodschap in, en plaats deze in de ruimte.'
  }

  if (mediaMode.value === 'photo-details') {
    return 'Geef je foto een titel en een korte geschreven tekst.'
  }

  if (mediaMode.value === 'coming-soon') {
    return 'Audio en video krijgen binnenkort hun eigen workflow.'
  }

  return panelSubtitle.media
})

const familyItems = [
  { title: 'Kaarsje aan', detail: 'Zacht licht voor de ruimte' },
  { title: 'Familiebericht', detail: 'Korte tekst van een bezoeker' },
  { title: 'Herdenkingskaart', detail: 'Naam en datum kunnen later volgen' },
]

const messageItems = [
  { name: 'Annelies', message: 'Veel sterkte en warme herinneringen.' },
  { name: 'Tom', message: 'Een mooi plekje om even stil te staan.' },
]

const handleToggleFloor = () => {
  emit('toggle-floor')
}

const handleCanvasClick = () => {
  // Close panel when clicking on canvas
  if (props.showFloor !== undefined) {
    // Used to trigger other logic if needed
  }
}

const handleClosePanel = () => {
  emit('close-panel')
}

const openMediaOption = (optionId) => {
  if (optionId === 'photo') {
    mediaMode.value = 'photo-source'
    return
  }

  if (optionId === 'audio') {
    mediaMode.value = 'audio-source'
    return
  }

  if (optionId === 'video') {
    mediaMode.value = 'video-source'
    return
  }

  if (optionId === 'candle') {
    mediaMode.value = 'candle-source'
    return
  }

  mediaMode.value = 'coming-soon'
}

const toggleSoundEnabled = () => {
  emit('apply-sound', {
    ...selectedSoundState.value,
    enabled: !selectedSoundState.value.enabled,
  })
}

const selectSoundPreset = (presetId) => {
  emit('apply-sound', {
    ...selectedSoundState.value,
    presetId,
    enabled: true,
  })
}

const updateSoundVolume = (event) => {
  const nextVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100 || 0))
  emit('apply-sound', {
    ...selectedSoundState.value,
    volume: nextVolume,
  })
}

const backToMediaChooser = () => {
  mediaMode.value = 'chooser'
}

const triggerFilePicker = () => {
  photoFileInput.value?.click()
}

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const handlePhotoFileChange = async (event) => {
  const files = Array.from(event.target.files || [])

  if (files.length === 0) {
    return
  }

  const loadedPhotos = await Promise.all(
    files.map(async (file) => ({
      id: `upload-${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      url: await readFileAsDataUrl(file),
    })),
  )

  uploadedPhotos.value = loadedPhotos
  selectedPhoto.value = loadedPhotos[0]
  mediaMode.value = 'photo-details'
}

// Audio helpers
const readAudioFileAsUrl = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    resolve(url)
  })
}

const handleAudioFileChange = async (event) => {
  const files = Array.from(event.target.files || [])

  if (files.length === 0) return

  const loaded = await Promise.all(files.map(async (file) => ({
    id: `audio-${file.name}-${file.size}-${Date.now()}`,
    name: file.name,
    url: await readAudioFileAsUrl(file),
  })))

  uploadedAudios.value = loaded
  selectedAudio.value = loaded[0]
  mediaMode.value = 'audio-details'
}

const continueToAudioDetails = () => {
  if (audioUrlInput.value && !selectedAudio.value) {
    selectedAudio.value = { id: `url-${Date.now()}`, name: 'Link audio', url: audioUrlInput.value }
  }

  if (!selectedAudio.value && uploadedAudios.value.length) {
    selectedAudio.value = uploadedAudios.value[0]
  }

  if (!selectedAudio.value) return
  mediaMode.value = 'audio-details'
}

const startRecording = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    mediaRecorder.ondataavailable = (ev) => audioChunks.push(ev.data)
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      selectedAudio.value = { id: `rec-${Date.now()}`, name: 'Recording.webm', url }
      isRecording.value = false
      mediaMode.value = 'audio-details'
    }
    mediaRecorder.start()
    isRecording.value = true
  } catch (err) {
    console.warn('Recording failed', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
}

// Video helpers
const readVideoFileAsUrl = (file) => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    resolve(url)
  })
}

const handleVideoFileChange = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  const loaded = await Promise.all(files.map(async (file) => ({
    id: `video-${file.name}-${file.size}-${Date.now()}`,
    name: file.name,
    url: await readVideoFileAsUrl(file),
  })))

  uploadedVideos.value = loaded
  selectedVideo.value = loaded[0]
  mediaMode.value = 'video-details'
}

const continueToVideoDetails = () => {
  if (videoUrlInput.value && !selectedVideo.value) {
    selectedVideo.value = { id: `url-${Date.now()}`, name: 'Link video', url: videoUrlInput.value }
  }

  if (!selectedVideo.value && uploadedVideos.value.length) {
    selectedVideo.value = uploadedVideos.value[0]
  }

  if (!selectedVideo.value) return
  mediaMode.value = 'video-details'
}

const startVideoRecording = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    videoRecorder = new MediaRecorder(stream)
    videoChunks = []
    videoRecorder.ondataavailable = (ev) => videoChunks.push(ev.data)
    videoRecorder.onstop = () => {
      const blob = new Blob(videoChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      selectedVideo.value = { id: `rec-${Date.now()}`, name: 'Recording.webm', url }
      isVideoRecording.value = false
      mediaMode.value = 'video-details'
    }
    videoRecorder.start()
    isVideoRecording.value = true
  } catch (err) {
    console.warn('Video recording failed', err)
  }
}

const stopVideoRecording = () => {
  if (videoRecorder && videoRecorder.state === 'recording') {
    videoRecorder.stop()
  }
}

const placeVideo = () => {
  const selected = selectedVideo.value
  if (!selected) return

  emit('place-video', {
    sourceUrl: selected.url,
    sourceName: selected.name,
    title: videoTitle.value.trim() || 'Nieuwe video',
    text: videoText.value.trim(),
  })

  // reset
  videoTitle.value = ''
  videoText.value = ''
  selectedVideo.value = null
  uploadedVideos.value = []
  videoUrlInput.value = ''
  mediaMode.value = 'chooser'
  handleClosePanel()
}

const selectGalleryPhoto = (photo) => {
  selectedGalleryPhotoId.value = photo.id
  selectedPhoto.value = photo
}

const continueToPhotoDetails = () => {
  selectedPhoto.value = selectedPhoto.value || sampleGalleryPhotos.find(photo => photo.id === selectedGalleryPhotoId.value) || sampleGalleryPhotos[0]
  mediaMode.value = 'photo-details'
}

const placeAudio = () => {
  const selected = selectedAudio.value
  if (!selected) return

  emit('place-audio', {
    sourceUrl: selected.url,
    sourceName: selected.name,
    title: audioTitle.value.trim() || 'Nieuwe audio',
    text: audioText.value.trim(),
  })

  // reset
  audioTitle.value = ''
  audioText.value = ''
  selectedAudio.value = null
  uploadedAudios.value = []
  audioUrlInput.value = ''
  mediaMode.value = 'chooser'
  handleClosePanel()
}

const placePhoto = () => {
  const selected = selectedPhoto.value || sampleGalleryPhotos.find(photo => photo.id === selectedGalleryPhotoId.value) || sampleGalleryPhotos[0]

  emit('place-photo', {
    sourceUrl: selected.url,
    sourceName: selected.name,
    title: photoTitle.value.trim() || 'Nieuwe foto',
    text: photoText.value.trim(),
  })

  photoTitle.value = ''
  photoText.value = ''
  selectedPhoto.value = null
  uploadedPhotos.value = []
  selectedGalleryPhotoId.value = 'sunset-memory'
  mediaMode.value = 'chooser'
  handleClosePanel()
}

const placeMessage = () => {
  if (!messageText.value.trim()) return

  emit('place-message', {
    message: messageText.value.trim(),
  })

  messageText.value = ''
  handleClosePanel()
}

const selectCandleSize = (size) => {
  selectedCandleSize.value = size
}

const continueToCandleDetails = () => {
  if (!selectedCandleSize.value) return
  familyMode.value = 'details'
}

const backToCandleChooser = () => {
  familyMode.value = 'chooser'
  selectedCandleSize.value = null
}

const placeCandle = () => {
  if (!selectedCandleSize.value || !candleName.value.trim()) return

  emit('place-candle', {
    size: selectedCandleSize.value,
    name: candleName.value.trim(),
    message: candleMessage.value.trim(),
  })

  selectedCandleSize.value = null
  candleName.value = ''
  candleMessage.value = ''
  familyMode.value = 'chooser'
  handleClosePanel()
}
</script>

<template>
  <div class="asset-panel-root" :class="{ 'models-root': props.panelType === 'models' && showModelSubmenu }">
    <aside class="asset-panel" :class="{ 'models-mode': props.panelType === 'models' }">
    <div class="panel-header">
      <div class="panel-heading">
        <h2>{{ panelHeading }}</h2>
        <p>{{ panelCopy }}</p>
      </div>

      <div class="panel-actions">
        <button type="button" class="close-panel-button" aria-label="Sluit paneel" @click="handleClosePanel">
          ×
        </button>
      </div>
    </div>

    <div v-if="panelType === 'room'" class="room-theme-panel">
      <div class="room-theme-grid">
        <div v-for="row in roomThemeRows" :key="row[0].id" class="room-theme-row">
          <div class="room-theme-grid-row">
            <div v-for="theme in row" :key="theme.id" class="room-theme-cell">
              <button
                type="button"
                class="room-theme-card"
                :class="{ active: isActiveTheme(theme.id) }"
                :aria-expanded="selectedRoomThemeId === theme.id"
                @click="selectRoomTheme(theme.id)"
              >
                <span class="room-theme-label">{{ theme.name }}</span>
                <span class="room-theme-preview">
                  <span class="room-theme-wall" :style="{ backgroundColor: theme.wallShades[2] || theme.wallShades[0] }"></span>
                  <span class="room-theme-floor" :style="{ backgroundColor: theme.floorShades[2] || theme.floorShades[0] }"></span>
                </span>
              </button>
            </div>
          </div>

          <div v-if="getRoomThemeRowSelection(row)" class="room-shade-submenu">
            <template v-for="theme in [getRoomThemeRowSelection(row)]" :key="theme.id">
              <div class="room-submenu-controls">
                <div class="use-texture-toggle">
                  <button type="button" :class="{ active: selectedRoomThemeState.useTextures === false }" @click="applyUseTextures(false)">Kleur</button>
                  <button type="button" :class="{ active: selectedRoomThemeState.useTextures === true }" @click="applyUseTextures(true)">Textuur</button>
                </div>
                <div v-if="isAdmin && selectedRoomThemeState.useTextures" class="use-color-toggle">
                  <button
                    type="button"
                    :class="{ active: selectedRoomThemeState.useColor !== false }"
                    @click="toggleUseColor"
                    :title="selectedRoomThemeState.useColor ? 'Kleur tonen (klik om uit te schakelen)' : 'Kleur verbergen (klik om aan te zetten)'"
                    aria-pressed="selectedRoomThemeState.useColor !== false"
                  >
                    <span class="color-label">{{ selectedRoomThemeState.useColor ? 'Kleur aan' : 'Kleur uit' }}</span>
                  </button>
                </div>

                <div class="preview-info" title="Miniatuurvoorbeelden (preview) zijn onbelicht; de scène gebruikt verlichting. Gebruik 'Kleur uit' om de kleurverf te verbergen zodat het materiaal puur zichtbaar is.">
                  <span class="info-icon" aria-hidden="true">i</span>
                  <span class="sr-only">Miniatuurvoorbeelden zijn onbelicht; de scène gebruikt verlichting. Gebruik 'Kleur uit' om de kleurverf te verbergen.</span>
                </div>
              </div>
              <div class="room-shade-group">
                <span class="room-shade-group-label">Muren</span>
                <div v-if="!selectedRoomThemeState.useTextures" class="room-shade-controls">
                  <div class="room-shade-row">
                    <button
                      v-for="(shade, index) in theme.wallShades"
                      :key="`${theme.id}-wall-${index}`"
                      type="button"
                      class="room-shade-swatch"
                      :class="{ active: selectedRoomThemeState.presetId === theme.id && selectedRoomThemeState.wallShadeIndex === index }"
                      :title="`Muur ${index + 1}`"
                      @click="applyRoomShade('walls', index)"
                    >
                      <span class="room-shade-swatch-color" :style="{ backgroundColor: shade }"></span>
                    </button>
                  </div>
                </div>

                <div v-else class="room-materials-row-horizontal">
                  <button
                    v-for="(mat, mIndex) in (theme.wallMaterials || uiWallMaterials)"
                    :key="`${theme.id}-wall-mat-${mIndex}`"
                    type="button"
                    class="room-material-chip room-material-thumb"
                    :class="{ active: selectedRoomThemeState.presetId === theme.id && selectedRoomThemeState.wallMaterialIndex === mIndex }"
                    @click="applyRoomMaterial('walls', mIndex)"
                    :style="{ backgroundImage: mat.map ? 'url('+mat.map+')' : '' }"
                  >
                    <span class="sr-only">{{ mat.label }}</span>
                  </button>
                </div>
              </div>

              <div class="room-shade-group">
                <span class="room-shade-group-label">Vloer</span>
                <div v-if="!selectedRoomThemeState.useTextures" class="room-shade-controls">
                  <div class="room-shade-row">
                    <button
                      v-for="(shade, index) in theme.floorShades"
                      :key="`${theme.id}-floor-${index}`"
                      type="button"
                      class="room-shade-swatch"
                      :class="{ active: selectedRoomThemeState.presetId === theme.id && selectedRoomThemeState.floorShadeIndex === index }"
                      :title="`Vloer ${index + 1}`"
                      @click="applyRoomShade('floor', index)"
                    >
                      <span class="room-shade-swatch-color" :style="{ backgroundColor: shade }"></span>
                    </button>
                  </div>
                </div>

                <div v-else class="room-materials-row-horizontal">
                  <button
                    v-for="(mat, mIndex) in (theme.floorMaterials || uiFloorMaterials)"
                    :key="`${theme.id}-floor-mat-${mIndex}`"
                    type="button"
                    class="room-material-chip room-material-thumb"
                    :class="{ active: selectedRoomThemeState.presetId === theme.id && selectedRoomThemeState.floorMaterialIndex === mIndex }"
                    @click="applyRoomMaterial('floor', mIndex)"
                    :style="{ backgroundImage: mat.map ? 'url('+mat.map+')' : '' }"
                  >
                    <span class="sr-only">{{ mat.label }}</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

    </div>

    <div v-else-if="panelType === 'sound'" class="sound-panel">
      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Geluid</h3>
          <p>Kies een eenvoudige geluidslaag voor de ruimte. Eén geluid tegelijk.</p>
        </div>

        <div class="sound-status-row">
          <span class="sound-status-pill" :class="{ active: selectedSoundState.enabled }">
            {{ selectedSoundState.enabled ? 'Aan' : 'Uit' }}
          </span>

          <button type="button" class="family-action sound-toggle-button" @click="toggleSoundEnabled">
            {{ selectedSoundState.enabled ? 'Geluid uit' : 'Geluid aan' }}
          </button>
        </div>

        <label class="sound-volume-control">
          <span>Volume</span>
          <input type="range" min="0" max="100" :value="Math.round((selectedSoundState.volume ?? 0.45) * 100)" @input="updateSoundVolume" />
        </label>

        <p class="photo-flow-copy">Selecteer een sfeer die past bij de kamer.</p>

        <div class="sound-preset-grid">
          <button
            v-for="preset in soundPresets"
            :key="preset.id"
            type="button"
            class="sound-preset-card"
            :class="{ active: selectedSoundState.presetId === preset.id }"
            @click="selectSoundPreset(preset.id)"
          >
            <span class="sound-preset-icon">{{ preset.icon }}</span>
            <span class="sound-preset-name">{{ preset.label }}</span>
            <p class="sound-preset-detail">{{ preset.detail }}</p>
          </button>
        </div>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'chooser'" class="media-panel-stack">
      <button type="button" class="asset-item media-main-button" @click="mediaMode = 'chooser'">
        <span class="asset-icon">🖼️</span>
        <span class="asset-name">Media</span>
      </button>

      <div class="asset-grid media-chooser-grid media-secondary-list">
        <button
          v-for="option in mediaActionButtons"
          :key="option.id"
          type="button"
          class="asset-item media-option-item"
          @click="openMediaOption(option.id)"
        >
          <span class="asset-icon">{{ option.icon }}</span>
          <span class="asset-name">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <div v-else-if="panelType === 'models'" class="models-panel models-left-only">
      <div class="models-category-list simple-list">
        <button
          v-for="cat in modelCategories"
          :key="cat.id"
          type="button"
          class="models-category-button"
          :class="{ active: selectedModelCategory === cat.id }"
          @click="selectModelCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'coming-soon'" class="media-placeholder">
      <article class="message-card">
        <span class="message-author">Binnenkort beschikbaar</span>
        <p>Deze knop krijgt later een eigen workflow.</p>
      </article>

      <button type="button" class="family-action" @click="backToMediaChooser">
        Terug
      </button>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'photo-source'" class="photo-flow">
      <button type="button" class="back-link" @click="backToMediaChooser">← terug</button>

      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Media - Foto</h3>
          <p>Upload één of meerdere foto’s of kies uit de galerie.</p>
        </div>

        <div class="photo-source-switcher">
          <button
            type="button"
            class="photo-source-button"
            :class="{ active: photoSourceMode === 'gallery' }"
            @click="photoSourceMode = 'gallery'"
          >
            Galerie
          </button>
          <button
            type="button"
            class="photo-source-button"
            :class="{ active: photoSourceMode === 'upload' }"
            @click="photoSourceMode = 'upload'"
          >
            Apparaat
          </button>
        </div>

        <p class="photo-flow-copy">
          Upload één of meerdere foto's van je eigen apparaat of kies een stockfoto uit de galerie.
        </p>

        <div v-if="photoSourceMode === 'upload'" class="photo-upload-box">
          <input ref="photoFileInput" type="file" accept="image/*" multiple @change="handlePhotoFileChange" />
          <button type="button" class="family-action" @click="triggerFilePicker">
            Kies foto('s) van je apparaat
          </button>

          <div v-if="uploadedPhotos.length" class="gallery-grid upload-grid">
            <button
              v-for="photo in uploadedPhotos"
              :key="photo.id"
              type="button"
              class="gallery-photo-button"
              :class="{ selected: selectedPhoto?.id === photo.id }"
              @click="selectedPhoto = photo"
            >
              <img :src="photo.url" :alt="photo.name" />
              <span>{{ photo.name }}</span>
            </button>
          </div>
        </div>

        <div v-else class="gallery-grid">
          <button
            v-for="photo in sampleGalleryPhotos"
            :key="photo.id"
            type="button"
            class="gallery-photo-button"
            :class="{ selected: selectedGalleryPhotoId === photo.id }"
            @click="selectGalleryPhoto(photo)"
          >
            <img :src="photo.url" :alt="photo.name" />
            <span>{{ photo.name }}</span>
          </button>
        </div>

        <button type="button" class="family-action" @click="continueToPhotoDetails">
          Volgende
        </button>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'photo-details'" class="photo-flow">
      <button type="button" class="back-link" @click="mediaMode = 'photo-source'">← terug</button>

      <section class="photo-card-shell photo-details-shell">
        <div class="photo-flow-title">
          <h3>Media - Foto</h3>
          <p>Geef je foto een titel en een korte geschreven tekst.</p>
        </div>

        <div class="photo-preview-line">
          <span class="preview-file-name">{{ currentPhotoPreview.name }}</span>
        </div>

        <div class="photo-preview-image">
          <img :src="currentPhotoPreview.url" :alt="currentPhotoPreview.name" />
        </div>

        <label class="photo-field">
          <span>Geef je foto een titel</span>
          <input v-model="photoTitle" type="text" placeholder="Schrijf hier je titel" />
        </label>

        <label class="photo-field">
          <span>Voeg een korte tekst toe</span>
          <textarea v-model="photoText" rows="4" placeholder="Schrijf hier je bericht"></textarea>
        </label>

        <button type="button" class="family-action" @click="placePhoto">
          Plaatsen
        </button>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'audio-source'" class="audio-flow">
      <button type="button" class="back-link" @click="backToMediaChooser">← terug</button>

      <!-- Section 1: Upload from Device -->
      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Media - Audio</h3>
          <p>Upload een audiobestand of kies een optie hieronder.</p>
        </div>
        <div class="audio-drop-area">
          <svg class="audio-waveform" viewBox="0 0 150 40" preserveAspectRatio="xMidYMid meet">
            <line x1="10" y1="20" x2="10" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="20" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="30" y1="20" x2="30" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="20" x2="40" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="50" y1="20" x2="50" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="60" y1="20" x2="60" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="70" y1="20" x2="70" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="80" y1="20" x2="80" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="90" y1="20" x2="90" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="100" y1="20" x2="100" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="110" y1="20" x2="110" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="120" y1="20" x2="120" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="130" y1="20" x2="130" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="140" y1="20" x2="140" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="audio-formats">Ondersteunde bestanden: MP3, WAV, MP4 (max. 50mb)</p>
        </div>

        <input ref="audioFileInput" type="file" accept="audio/*" @change="handleAudioFileChange" />
        <button type="button" class="family-action" @click="audioFileInput?.click()">Upload een audiobestand</button>

        <div v-if="uploadedAudios.length" class="audio-selection-list">
          <div v-for="audio in uploadedAudios" :key="audio.id" class="audio-list-item" :class="{ selected: selectedAudio?.id === audio.id }" @click="selectedAudio = audio">
            <span class="audio-icon">🎧</span>
            <span class="audio-name">{{ audio.name }}</span>
            <span v-if="selectedAudio?.id === audio.id" class="checkmark">✓</span>
          </div>
        </div>
      </section>

      <!-- Section 2: URL Input -->
      <section class="photo-card-shell">
        <div class="photo-flow-title" style="margin-bottom: 10px;">
          <h3 style="font-size: 20px; margin: 0; color: #1a1a1a;">Upload vanuit je playlist</h3>
        </div>
        <input v-model="audioUrlInput" type="text" placeholder="https://..." class="audio-url-input" />
        <button type="button" class="family-action" @click="continueToAudioDetails">Volgende</button>
      </section>

      <!-- Section 3: Recording -->
      <section class="photo-card-shell recording-shell">
        <div class="photo-flow-title" style="margin-bottom: 14px;">
          <h3 style="font-size: 20px; margin: 0; color: #1a1a1a;">Neem een kort berichtje op</h3>
        </div>
        <div class="recording-area">
          <div class="microphone-icon">🎤</div>
          <button 
            type="button" 
            class="recording-button" 
            :class="{ recording: isRecording }"
            @click="isRecording ? stopRecording() : startRecording()"
          >
            {{ isRecording ? 'Stop opnemen' : 'Start opname' }}
          </button>
          <p v-if="isRecording" class="recording-status">Opnemen...</p>
        </div>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'video-source'" class="audio-flow">
      <button type="button" class="back-link" @click="backToMediaChooser">← terug</button>

      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Media - Video</h3>
          <p>Upload een videobestand of kies een optie hieronder.</p>
        </div>

        <div class="audio-drop-area video-drop-area">
          <svg class="audio-waveform" viewBox="0 0 150 40" preserveAspectRatio="xMidYMid meet">
            <rect x="10" y="6" width="130" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          <p class="audio-formats">Ondersteunde bestanden: MP4, MOV, WEBM (max. 200mb)</p>
        </div>

        <input ref="videoFileInput" type="file" accept="video/*" @change="handleVideoFileChange" />
        <button type="button" class="family-action" @click="videoFileInput?.click()">Upload een videobestand</button>

        <div v-if="uploadedVideos.length" class="audio-selection-list">
          <div v-for="video in uploadedVideos" :key="video.id" class="audio-list-item" :class="{ selected: selectedVideo?.id === video.id }" @click="selectedVideo = video">
            <span class="audio-icon">🎥</span>
            <span class="audio-name">{{ video.name }}</span>
            <span v-if="selectedVideo?.id === video.id" class="checkmark">✓</span>
          </div>
        </div>
      </section>

      <section class="photo-card-shell">
        <div class="photo-flow-title" style="margin-bottom: 10px;">
          <h3 style="font-size: 20px; margin: 0; color: #1a1a1a;">Upload vanuit je playlist</h3>
        </div>
        <input v-model="videoUrlInput" type="text" placeholder="https://..." class="audio-url-input" />
        <button type="button" class="family-action" @click="continueToVideoDetails">Volgende</button>
      </section>

      <section class="photo-card-shell recording-shell">
        <div class="photo-flow-title" style="margin-bottom: 14px;">
          <h3 style="font-size: 20px; margin: 0; color: #1a1a1a;">Neem een korte opname</h3>
        </div>
        <div class="recording-area">
          <div class="microphone-icon">📹</div>
          <button
            type="button"
            class="recording-button"
            :class="{ recording: isVideoRecording }"
            @click="isVideoRecording ? stopVideoRecording() : startVideoRecording()"
          >
            {{ isVideoRecording ? 'Stop opname' : 'Start opname' }}
          </button>
          <p v-if="isVideoRecording" class="recording-status">Opnemen...</p>
        </div>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'video-details'" class="audio-flow">
      <button type="button" class="back-link" @click="mediaMode = 'video-source'">← terug</button>

      <section class="photo-card-shell photo-details-shell">
        <div class="photo-flow-title">
          <h3>Media - Video</h3>
          <p>Bekijk je selectie en voeg een begeleidend bericht toe.</p>
        </div>

        <div class="photo-preview-line">
          <span class="preview-file-name">{{ selectedVideo?.name || 'Video' }}</span>
        </div>

        <div class="photo-preview-image" style="padding:12px;">
          <video v-if="selectedVideo" :src="selectedVideo.url" controls style="width:100%"></video>
        </div>

        <label class="photo-field">
          <span>Geef je video een titel</span>
          <input v-model="videoTitle" type="text" placeholder="Schrijf hier je titel" />
        </label>

        <label class="photo-field">
          <span>Voeg een korte tekst toe</span>
          <textarea v-model="videoText" rows="4" placeholder="Schrijf hier je bericht"></textarea>
        </label>

        <button type="button" class="family-action" @click="placeVideo">Plaatsen</button>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && mediaMode === 'audio-details'" class="audio-flow">
      <button type="button" class="back-link" @click="mediaMode = 'audio-source'">← terug</button>

      <section class="photo-card-shell photo-details-shell">
        <div class="photo-flow-title">
          <h3>Media - Audio</h3>
          <p>Luister naar je selectie en voeg een begeleidend bericht toe.</p>
        </div>

        <div class="photo-preview-line">
          <span class="preview-file-name">{{ selectedAudio?.name || 'Audio' }}</span>
        </div>

        <div class="photo-preview-image" style="padding:12px;">
          <audio v-if="selectedAudio" :src="selectedAudio.url" controls style="width:100%"></audio>
        </div>

        <label class="photo-field">
          <span>Geef je audio een titel</span>
          <input v-model="audioTitle" type="text" placeholder="Schrijf hier je titel" />
        </label>

        <label class="photo-field">
          <span>Voeg een korte tekst toe</span>
          <textarea v-model="audioText" rows="4" placeholder="Schrijf hier je bericht"></textarea>
        </label>

        <button type="button" class="family-action" @click="placeAudio">Plaatsen</button>
      </section>
    </div>

    <div v-else-if="panelType === 'messages'" class="message-compose-panel">
      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Schrijf je bericht</h3>
          <p>Laat hieronder een mooie boodschap achter.</p>
        </div>

        <label class="photo-field">
          <span>Je bericht</span>
          <textarea v-model="messageText" rows="6" placeholder="Schrijf hier je bericht..."></textarea>
        </label>

        <button type="button" class="family-action" @click="placeMessage">
          Plaatsen
        </button>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && familyMode === 'chooser'" class="candle-flow">
      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Kaars met boodschap</h3>
          <p>Kies een kaars, vul daarna je naam en boodschap in en plaats deze in de ruimte.</p>
        </div>

        <p class="photo-flow-copy">Selecteer een kaars om te plaatsen:</p>

        <div class="candle-size-grid">
          <button
            v-for="candle in candleSizes"
            :key="candle.id"
            type="button"
            class="candle-size-button"
            :class="{ selected: selectedCandleSize?.id === candle.id }"
            @click="selectCandleSize(candle)"
          >
            <div class="candle-visual">🕯️</div>
            <span>{{ candle.label }}</span>
          </button>
        </div>

        <button type="button" class="family-action" @click="continueToCandleDetails">
          Volgende
        </button>
      </section>
    </div>

    <div v-else-if="panelType === 'media' && familyMode === 'details'" class="candle-flow">
      <button type="button" class="back-link" @click="backToCandleChooser">← terug</button>

      <section class="photo-card-shell photo-details-shell">
        <div class="photo-flow-title">
          <h3>Deze kaars is van:</h3>
          <p>Schrijf je naam en een kort berichtje.</p>
        </div>

        <label class="photo-field">
          <span>Je naam</span>
          <input v-model="candleName" type="text" placeholder="Vul hier je naam in" />
        </label>

        <label class="photo-field">
          <span>Voeg een kort berichtje toe</span>
          <textarea v-model="candleMessage" rows="4" placeholder="Schrijf hier je bericht"></textarea>
        </label>

        <button type="button" class="family-action" @click="placeCandle">
          Plaatsen
        </button>
      </section>
    </div>
    </aside>

    <!-- Separate submenu panel that opens next to the main Modellen panel -->
    <div v-if="panelType === 'models' && showModelSubmenu" class="models-submenu-panel">
      <div class="submenu-header">
        <button type="button" class="back-link" @click="closeModelSubmenu">← Terug</button>
        <h3>{{ selectedModelCategoryLabel }}</h3>
      </div>

      <div class="models-submenu-scroll">
        <p class="models-submenu-copy">
          Kies een object om direct in de ruimte te plaatsen.
        </p>

        <div class="models-list-grid">
          <div
            v-for="model in selectedModelItems"
            :key="model.id"
            class="model-item"
          >
            <div class="model-thumb">{{ model.icon || '🔹' }}</div>
            <div class="model-copy">
              <div class="model-name">{{ model.name }}</div>
              <p class="model-detail">{{ model.detail }}</p>
            </div>
            <div class="model-actions">
              <button type="button" class="family-action" @click="placeModel(model)">Plaatsen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-panel {
  width: 340px;
  max-height: 78vh;
  background: #b8a4cb;
  border: 1px solid rgba(54, 42, 92, 0.2);
  border-radius: 28px;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.asset-panel-root {
  position: absolute;
  left: 232px;
  top: 50%;
  bottom: auto;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1000;
}

.panel-header {
  padding: 16px 18px 12px;
  border-bottom: 4px solid rgba(28, 24, 58, 0.95);
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-header h2 {
  font-family: 'Alpino', 'Segoe UI', sans-serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 0.9;
  color: #f7f4ff;
  margin: 0;
}

.panel-heading p {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(22, 18, 43, 0.94);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-panel-button {
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f1a3b;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-weight: 700;
}

.close-panel-button {
  width: 32px;
  height: 32px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* hide floor toggle when in models panel */
.asset-panel.models-mode .panel-actions .floor-panel-toggle {
  display: none;
}

/* remove header border for models mode */
.asset-panel.models-mode .panel-header {
  border-bottom: none;
}

.asset-grid,
.message-list,
.family-list,
.photo-flow,
.audio-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px; /* add horizontal padding for inner content */
  overflow-y: auto;
  flex: 1;
}

.models-mode {
  width: 260px; /* match Assets container width */
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* center category buttons and make them uniform width */
.models-category-list.simple-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0 16px;
}

.models-category-button {
  width: 220px;
  text-align: center; /* center the label text */
  padding: 14px 18px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.models-category-button.active {
  background: linear-gradient(180deg, rgba(242,175,199,0.18), rgba(244,210,225,0.12));
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.25);
}

.models-columns {
  display: grid;
  grid-template-columns: 140px 140px 1fr;
  gap: 12px;
  padding: 12px 18px;
  align-items: start;
}

.models-simple .models-title {
  font-size: 28px;
  margin-top: 8px;
}

.models-copy {
  color: rgba(22,18,43,0.85);
  margin: 8px 0 12px;
}

.models-category-list.simple-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
  padding: 0 0 16px; /* add bottom padding matching panel header top */
}

.models-sample-row {
  margin-top: 18px;
  display: flex;
  gap: 12px;
}

.models-sample {
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  display:flex;
  flex-direction:column;
  gap:8px;
  align-items:center;
  width:120px;
  cursor:pointer;
}

.models-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.models-title {
  color: #f8f6ff;
  font-family: 'Alpino', 'Segoe UI', sans-serif;
  margin: 6px 0 4px;
}

.models-category-button {
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(54,42,92,0.06);
  background: #fff;
  text-align: center;
  font-weight: 800;
  color: #1f1330;
  box-shadow: 0 6px 18px rgba(48,38,78,0.06);
  width: 220px;
  margin: 0 auto; /* center the button element itself */
}

.models-category-button.active {
  background: linear-gradient(180deg,#fdeff6,#f6e6f0);
  border-color: rgba(195,121,166,0.24);
}

.models-center {
  display:flex;
  flex-direction:column;
  gap:8px;
}

.models-right {
  display:flex;
  flex-direction:column;
}

.models-grid {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.model-card {
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(54,42,92,0.06);
  padding: 12px;
  display:flex;
  flex-direction:column;
  gap:8px;
  align-items:center;
}

.model-thumb {
  width:100%;
  height:84px;
  border-radius:8px;
  background: linear-gradient(180deg,#f3f3f6,#e9e7ef);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
}

.model-name {
  font-weight:700;
  color:#1a1a1a;
}

.audio-flow {
  gap: 18px; /* a bit more space between stacked audio sections */
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  color: #1a1a1a;
  text-align: left;
}

.asset-item:hover {
  background: #f9f9f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.asset-item:active {
  transform: translateY(0);
}

.asset-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #ffffff;
  background: #7d5fa1;
  border-radius: 12px;
  flex-shrink: 0;
}

.asset-name {
  font-weight: 600;
}

.media-chooser-grid {
  padding-top: 16px;
}

.media-panel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px 18px;
  flex: 1;
  overflow-y: auto;
}

.media-main-button {
  width: 100%;
  min-height: 64px;
}

.media-secondary-list {
  padding: 0;
  gap: 8px;
}

.media-secondary-list .media-option-item {
  width: 100%;
  padding: 12px 14px;
  min-height: 54px;
}

.media-secondary-list .media-option-item .asset-icon {
  width: 34px;
  height: 34px;
  font-size: 20px;
}

.room-theme-panel {
  padding: 14px 16px 10px 12px;
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.room-theme-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.room-theme-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.room-theme-grid-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.room-theme-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.room-theme-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 96px;
  padding: 10px 8px;
  border: 1px solid rgba(54, 42, 92, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  align-items: center;
  justify-content: center;
}

.room-theme-card.active {
  border-color: rgba(125, 95, 161, 0.92);
  box-shadow: 0 0 0 3px rgba(125, 95, 161, 0.18), 0 10px 24px rgba(125, 95, 161, 0.14);
  transform: translateY(-1px);
}

.room-theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(18, 18, 18, 0.08);
  display: grid;
  grid-template-rows: 1fr 0.45fr;
  flex-shrink: 0;
}

.room-theme-wall,
.room-theme-floor,
.room-shade-swatch-color {
  display: block;
}

.room-theme-floor {
  border-top: 1px solid rgba(18, 18, 18, 0.08);
}

.room-theme-label {
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.1;
}

.room-shade-submenu {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(54, 42, 92, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  grid-column: 1 / -1;
  width: 100%;
  box-sizing: border-box;
  align-self: stretch;
}

.room-submenu-controls {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 6px;
}

.use-texture-toggle {
  display: inline-flex;
  gap: 6px;
  background: rgba(18,18,18,0.03);
  padding: 4px;
  border-radius: 10px;
}

.use-texture-toggle button {
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.use-texture-toggle button.active {
  background: rgba(125,95,161,0.12);
  border: 1px solid rgba(125,95,161,0.92);
}

.use-color-toggle button {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(54,42,92,0.06);
  background: rgba(255,255,255,0.96);
  cursor: pointer;
  font-weight: 700;
}

.use-color-toggle button.active {
  box-shadow: 0 0 0 3px rgba(125,95,161,0.16);
  border-color: rgba(125,95,161,0.92);
}

.preview-info {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.preview-info .info-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  background: rgba(18,18,18,0.04);
  color: rgba(26,26,26,0.8);
  font-size: 12px;
  border: 1px solid rgba(54,42,92,0.06);
  padding: 2px;
}

.room-shade-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-self: stretch;
}

.room-shade-controls {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.room-materials-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 86px;
  align-items: flex-end;
}

.room-shade-group-label {
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: rgba(26, 26, 26, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.room-shade-row {
  display: grid;
  grid-template-columns: repeat(5, 22px);
  gap: 8px;
  justify-content: flex-start;
  width: 100%;
}

.room-materials-row-horizontal {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  overflow-x: auto;
  padding-top: 6px;
}

.room-shade-swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(54, 42, 92, 0.12);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.9);
  justify-self: center;
  transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
  cursor: pointer;
}

.room-shade-swatch:hover,
.room-shade-swatch.active {
  border-color: rgba(125, 95, 161, 0.92);
  box-shadow: 0 0 0 3px rgba(125, 95, 161, 0.16);
  transform: translateY(-1px);
}

.room-shade-swatch-color {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.room-materials-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.room-material-chip {
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(18,18,18,0.03);
  border: 1px solid rgba(54,42,92,0.06);
  font-size: 12px;
  cursor: pointer;
}

.room-material-chip {
  transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.room-material-chip.active {
  box-shadow: 0 0 0 3px rgba(125,95,161,0.16);
  border-color: rgba(125,95,161,0.92);
  background-color: transparent;
}

.room-material-thumb {
  width: 80px;
  height: 80px;
  padding: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 10px;
  border: 1px solid rgba(54,42,92,0.08);
  overflow: hidden;
}

.sr-only { position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

.media-option-item {
  justify-content: flex-start;
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  flex: 1;
}

.back-link {
  border: none;
  background: transparent;
  color: #f8f6ff;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  padding: 4px 0;
}

.photo-card-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px; /* increased padding for more breathing room */
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.28);
  color: #111111;
}

.photo-flow-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.photo-flow-title h3 {
  margin: 0;
  font-family: 'Alpino', 'Segoe UI', sans-serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 0.9;
  color: #f8f6ff;
}

.photo-flow-title p,
.photo-flow-copy {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(22, 18, 43, 0.96);
}

.photo-source-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.photo-source-button {
  border: 1px solid rgba(18, 18, 18, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.photo-source-button.active {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.photo-upload-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-upload-box input[type='file'] {
  width: 100%;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.upload-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gallery-photo-button {
  border: 1px solid rgba(18, 18, 18, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  color: #1a1a1a;
}

.gallery-photo-button.selected {
  border-color: #5f4abf;
  box-shadow: 0 0 0 2px rgba(95, 74, 191, 0.18);
}

.gallery-photo-button img,
.photo-preview-image img {
  width: 100%;
  display: block;
  border-radius: 10px;
  object-fit: cover;
}

.gallery-photo-button img {
  height: 78px;
}

.photo-preview-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  color: rgba(22, 18, 43, 0.98);
}

.preview-file-name {
  font-weight: 700;
}

.photo-preview-image {
  border: 1px solid rgba(18, 18, 18, 0.18);
  border-radius: 16px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.86);
}

.photo-preview-image img {
  height: 170px;
}

.photo-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.photo-field input,
.photo-field textarea {
  border: 1px solid rgba(18, 18, 18, 0.14);
  border-radius: 12px;
  padding: 12px;
  font: inherit;
  background: rgba(255, 255, 255, 0.96);
}

.photo-field textarea {
  resize: vertical;
  min-height: 110px;
}

.message-card,
.family-card {
  border: 1px solid rgba(18, 18, 18, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  padding: 12px;
}

.message-author,
.family-card-title {
  display: block;
  margin-bottom: 6px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-weight: 700;
  color: #1a1a1a;
}

.message-card p,
.family-card p {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #4c4c4c;
  line-height: 1.45;
}

.message-compose {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #1a1a1a;
}

.message-compose textarea {
  resize: vertical;
  min-height: 110px;
  border: 1px solid #dcdcdc;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
}

.family-action {
  border: 1px solid #d7d7d7;
  border-radius: 12px;
  background: rgba(242, 175, 199, 0.22);
  color: #1a1a1a;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
}

.candle-size-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.candle-size-button {
  border: 2px solid rgba(18, 18, 18, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  color: #1a1a1a;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.candle-size-button:hover {
  border-color: #7d5fa1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.candle-size-button.selected {
  border-color: #7d5fa1;
  background: rgba(125, 95, 161, 0.12);
  box-shadow: 0 0 0 2px rgba(125, 95, 161, 0.2);
}

.candle-visual {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-compose-panel,
.candle-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

/* Audio Styles */
.audio-drop-area {
  border: 2px dashed rgba(18, 18, 18, 0.2);
  border-radius: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.audio-waveform {
  width: 100%;
  height: 50px;
  color: rgba(125, 95, 161, 0.6);
}

.audio-formats {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  color: rgba(22, 18, 43, 0.7);
  text-align: center;
  line-height: 1.3;
}

.audio-url-input {
  border: 1px solid rgba(18, 18, 18, 0.14);
  border-radius: 12px;
  padding: 12px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.96);
  margin-bottom: 12px;
}

.audio-url-input::placeholder {
  color: rgba(22, 18, 43, 0.5);
}

.audio-upload-section,
.audio-url-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-selection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.audio-list-item {
  border: 1px solid rgba(18, 18, 18, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #1a1a1a;
}

.audio-list-item:hover {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.audio-list-item.selected {
  border-color: #5f4abf;
  background: rgba(125, 95, 161, 0.08);
  box-shadow: 0 0 0 2px rgba(95, 74, 191, 0.18);
}

.audio-icon {
  font-size: 18px;
}

.audio-name {
  flex: 1;
  font-weight: 600;
}

.checkmark {
  color: #7d5fa1;
  font-weight: 700;
}

.recording-shell {
  margin-top: 0;
}

.recording-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 18px 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
}

.microphone-icon {
  font-size: 48px;
}

.recording-button {
  border: none;
  border-radius: 12px;
  background: #5f5f5f;
  color: #ffffff;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.recording-button:hover {
  background: #4a4a4a;
  transform: scale(1.02);
}

.recording-button.recording {
  background: rgba(255, 100, 100, 0.2);
  color: #d32f2f;
  animation: pulse 1.5s infinite;
}

.recording-status {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  color: rgba(22, 18, 43, 0.7);
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Hide native audio file input UI (we use the button) */
input[type="file"][accept*="audio"] {
  display: none;
}

/* Add spacing between stacked photo-card-shell sections */
.photo-card-shell + .photo-card-shell {
  margin-top: 12px;
}

@media (max-width: 960px) {
  .asset-panel {
    width: 240px;
    right: 12px;
  }

  .panel-header h2 {
    font-size: 34px;
  }

  .panel-heading p {
    display: none;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }

  .photo-flow-title h3 {
    font-size: 34px;
  }
}

/* Separate submenu panel that appears to the right of the Modellen container */
.models-submenu-panel {
  position: relative;
  width: 320px;
  max-height: 78vh;
  background: #f6f1fa;
  border: 1px solid rgba(54, 42, 92, 0.08);
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(20, 12, 40, 0.18);
  overflow: hidden;
  z-index: 1200;
}

.models-submenu-panel .submenu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(18,18,18,0.05);
  background: linear-gradient(180deg, rgba(125,95,161,0.06), rgba(255,255,255,0.02));
}

.models-submenu-panel .back-link {
  color: rgba(42, 29, 59, 0.78);
  font-weight: 700;
}

.models-submenu-panel .back-link:hover {
  color: #2a1d3b;
}

.models-submenu-panel .submenu-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #2a1d3b;
}

.models-submenu-panel .models-submenu-scroll {
  padding: 12px;
  overflow-y: auto;
  max-height: calc(78vh - 64px);
}

.sound-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
  overflow-y: auto;
  flex: 1;
}

.sound-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.sound-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(54,42,92,0.12);
  color: #2a1d3b;
  font-weight: 800;
}

.sound-status-pill.active {
  background: linear-gradient(180deg,#fdeff6,#f6e6f0);
  border-color: rgba(195,121,166,0.26);
}

.sound-toggle-button {
  margin-left: auto;
}

.sound-volume-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: rgba(42, 29, 59, 0.86);
}

.sound-volume-control input[type="range"] {
  width: 100%;
  accent-color: #c379a6;
}

.sound-preset-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.sound-preset-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(18,18,18,0.06);
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(48,38,78,0.06);
  text-align: left;
  cursor: pointer;
}

.sound-preset-card.active {
  background: linear-gradient(180deg,#fdeff6,#f6e6f0);
  border-color: rgba(195,121,166,0.24);
}

.sound-preset-icon {
  font-size: 20px;
}

.sound-preset-name {
  font-weight: 800;
  color: #1f1330;
}

.sound-preset-detail {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(26, 26, 26, 0.72);
}

.models-submenu-copy {
  margin: 0 0 12px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(42, 29, 59, 0.76);
}

.models-list-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.model-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(18,18,18,0.06);
}

.model-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: linear-gradient(180deg,#f3f3f6,#e9e7ef);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:20px;
}

.model-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.model-name {
  font-weight:700;
  color:#1a1a1a;
}

.model-detail {
  margin: 0;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(26, 26, 26, 0.72);
}

.model-actions {
  margin-left: auto;
  padding-top: 2px;
}

.model-actions .family-action {
  border-radius: 18px;
  padding: 8px 14px;
  background: linear-gradient(180deg,#fdeff6,#f6e6f0);
  border: 1px solid rgba(195,121,166,0.18);
}

@media (max-width: 1100px) {
  .asset-panel-root {
    left: 12px;
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
  }

  .models-submenu-panel { display: none; }
}
</style>
