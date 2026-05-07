<script setup>
import { computed, defineEmits, defineProps, ref } from 'vue'

const props = defineProps({
  showFloor: {
    type: Boolean,
    required: true,
  },
  panelType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['add-asset', 'toggle-floor', 'close-panel', 'place-photo', 'place-message', 'place-candle', 'place-audio', 'place-video'])

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

const panelTitle = {
  media: 'Media',
  messages: 'Berichten',
  family: 'Kaarsje',
}

const panelSubtitle = {
  media: 'Voeg foto, audio of video toe aan de ruimte.',
  messages: 'Bekijk en verzamel herinneringen.',
  family: 'Laat een lichtje of familiebericht achter.',
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

  mediaMode.value = 'coming-soon'
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
  <aside class="asset-panel">
    <div class="panel-header">
      <div class="panel-heading">
        <h2>{{ panelHeading }}</h2>
        <p>{{ panelCopy }}</p>
      </div>

      <div class="panel-actions">
        <button
          type="button"
          class="floor-panel-toggle"
          :aria-pressed="showFloor"
          :title="showFloor ? 'Hide floor' : 'Show floor'"
          @click="handleToggleFloor"
        >
          {{ showFloor ? 'Vloer aan' : 'Vloer uit' }}
        </button>

        <button type="button" class="close-panel-button" aria-label="Close panel" @click="handleClosePanel">
          ×
        </button>
      </div>
    </div>

    <div v-if="panelType === 'media' && mediaMode === 'chooser'" class="asset-grid media-chooser-grid">
      <button
        v-for="option in [{ id: 'photo', label: 'Foto', icon: '🖼️' }, { id: 'audio', label: 'Audio', icon: '🎧' }, { id: 'video', label: 'Video', icon: '🎥' }]"
        :key="option.id"
        type="button"
        class="asset-item media-option-item"
        @click="openMediaOption(option.id)"
      >
        <span class="asset-icon">{{ option.icon }}</span>
        <span class="asset-name">{{ option.label }}</span>
      </button>
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
      <button type="button" class="back-link" @click="backToMediaChooser">← back</button>

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
      <button type="button" class="back-link" @click="mediaMode = 'photo-source'">← back</button>

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
      <button type="button" class="back-link" @click="backToMediaChooser">← back</button>

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
      <button type="button" class="back-link" @click="backToMediaChooser">← back</button>

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
      <button type="button" class="back-link" @click="mediaMode = 'video-source'">← back</button>

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
      <button type="button" class="back-link" @click="mediaMode = 'audio-source'">← back</button>

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
          <p>Laai hieronder een mooie boodschap achter.</p>
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

    <div v-else-if="panelType === 'family' && familyMode === 'chooser'" class="candle-flow">
      <section class="photo-card-shell">
        <div class="photo-flow-title">
          <h3>Brand een kaars</h3>
          <p>Kies een kaars, vul daarna je naam in en plaats deze waar je maar wilt in de herdenkingsruimte.</p>
        </div>

        <p class="photo-flow-copy">Selecteer een kaars om te branden:</p>

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

    <div v-else-if="panelType === 'family' && familyMode === 'details'" class="candle-flow">
      <button type="button" class="back-link" @click="backToCandleChooser">← back</button>

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
</template>

<style scoped>
.asset-panel {
  position: absolute;
  right: 20px;
  bottom: 16px;
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

.floor-panel-toggle,
.close-panel-button {
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f1a3b;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  font-weight: 700;
}

.floor-panel-toggle {
  font-size: 13px;
  padding: 9px 12px;
}

.close-panel-button {
  width: 32px;
  height: 32px;
  font-size: 20px;
  line-height: 1;
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
</style>
