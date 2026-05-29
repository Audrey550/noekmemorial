<script setup>
import { ref, onMounted } from 'vue'
import SceneCanvas from './components/SceneCanvas.vue'
import Login from './components/Login.vue'
import InviteLanding from './components/InviteLanding.vue'
import InviteProfile from './components/InviteProfile.vue'
import InviteAvatar from './components/InviteAvatar.vue'
import InviteLoading from './components/InviteLoading.vue'
import { getSupabase } from './lib/supabase'

const authUser = ref(null)
const adminRooms = ref([])
const accessibleRooms = ref([])
const selectedRoomId = ref(null)
const showRoomList = ref(false)
const revealed = ref({})

// invite flow state
const inviteFlowActive = ref(false)
const inviteStep = ref(1)

const inviteData = ref({ firstName: '', lastName: '', avatar: null })

const isMemberOnboarded = (email, roomId) => {
  if (!email || !roomId) return false
  try {
    const raw = localStorage.getItem(`audreyRoomMembers_${roomId}`)
    if (!raw) return false
    const arr = JSON.parse(raw)
    const found = arr.find(m => m.email === email)
    return !!(found && found.onboarded)
  } catch (e) {
    return false
  }
}

const saveMemberAndProfile = (roomId, profile) => {
  try {
    const key = `audreyRoomMembers_${roomId}`
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    const id = `m_${Date.now()}`
    const member = { id, email: authUser.value?.email || '', role: 'editor', displayName: profile.displayName || '', avatar: profile.avatar || '', onboarded: true }
    arr.push(member)
    localStorage.setItem(key, JSON.stringify(arr))
  } catch (e) {}
  // update local user profile too
  if (authUser.value) {
    authUser.value.displayName = profile.displayName || authUser.value.displayName
    authUser.value.avatar = profile.avatar || authUser.value.avatar
    try { localStorage.setItem('audreyUser', JSON.stringify(authUser.value)) } catch (e) {}
  }
}

const getRoomMeta = (roomId) => {
  try {
    const raw = localStorage.getItem(`audreyRoom_${roomId}`)
    return raw ? JSON.parse(raw) : {}
  } catch (e) { return {} }
}

const refreshAccessibleRooms = (user = authUser.value) => {
  if (!user || !user.email) {
    accessibleRooms.value = []
    return
  }

  const roomsById = new Map()

  if (user.role === 'admin') {
    adminRooms.value.forEach((room) => {
      roomsById.set(room.id, {
        id: room.id,
        name: room.name,
        privacy: room.privacy || 'private',
        role: 'admin',
        createdByMe: true,
      })
    })
  }

  try {
    const keys = Object.keys(localStorage)
    keys
      .filter((key) => key.startsWith('audreyRoomMembers_'))
      .forEach((key) => {
        const roomId = key.replace('audreyRoomMembers_', '')
        const raw = localStorage.getItem(key)
        if (!raw) return

        let members = []
        try {
          members = JSON.parse(raw)
        } catch (e) {
          members = []
        }

        const member = members.find((entry) => entry.email === user.email)
        if (!member) return

        const meta = getRoomMeta(roomId)
        roomsById.set(roomId, {
          id: roomId,
          name: meta.name || `Kamer ${roomId}`,
          privacy: meta.privacy || 'private',
          role: member.role || 'editor',
          createdByMe: !!member.createdByMe,
        })
      })
  } catch (e) {}

  accessibleRooms.value = Array.from(roomsById.values())
}

const handleRoomSelected = (roomId) => {
  selectedRoomId.value = roomId
  showRoomList.value = false
  refreshAccessibleRooms()
}

// invite handlers
const handleLandingNext = () => { inviteStep.value = 2 }
const handleProfileNext = (payload) => {
  const name = `${payload.firstName} ${payload.lastName}`.trim()
  if (authUser.value) {
    authUser.value.displayName = name
    try { localStorage.setItem('audreyUser', JSON.stringify(authUser.value)) } catch (e) {}
  }
  inviteStep.value = 3
}
const handleAvatarNext = (avatar) => {
  inviteData.value.avatar = avatar
  // persist member and profile
  saveMemberAndProfile(selectedRoomId.value, { displayName: authUser.value?.displayName || '', avatar })
  inviteStep.value = 4
}
const handleFinished = () => {
  // after loading, the member should be present and onboarded
  inviteStep.value = 1
}

const toggleReveal = (id) => {
  revealed.value[id] = !revealed.value[id]
}

const getInviteCode = (id) => {
  try {
    const raw = localStorage.getItem(`audreyRoom_${id}`)
    if (!raw) return null
    const meta = JSON.parse(raw)
    return meta.inviteCode || null
  } catch (e) {
    return null
  }
}

const getInviteLabel = (room) => {
  return room.privacy === 'private' ? 'Uitnodiging' : 'Uitnodiging (alleen voor privékamers)'
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('audreyUser')
    if (saved) authUser.value = JSON.parse(saved)
  } catch (e) {
    // ignore
  }
  // If Supabase is configured, subscribe to auth state changes
  const supabase = getSupabase()
  if (supabase) {
    // initialize from supabase current user if available
    supabase.auth.getUser().then(res => {
      const u = res.data?.user
      if (u) {
        const stored = localStorage.getItem('audreyUser')
        if (!stored) {
          const userObj = { email: u.email, role: 'viewer', displayName: (u.email && u.email.split('@')[0]) || 'User', avatar: '', supabaseId: u.id }
          authUser.value = userObj
          try { localStorage.setItem('audreyUser', JSON.stringify(userObj)) } catch (e) {}
        }
      }
    })

    supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        const u = session.user
        const userObj = { email: u.email, role: authUser.value?.role || 'viewer', displayName: (u.email && u.email.split('@')[0]) || 'User', avatar: authUser.value?.avatar || '', supabaseId: u.id }
        authUser.value = userObj
        try { localStorage.setItem('audreyUser', JSON.stringify(userObj)) } catch (e) {}
      } else {
        // signed out
        // keep local mock behavior
      }
    })
  }

  // debug helper: open the invite flow by visiting ?forceInvite=<roomId>
  try {
    const params = new URLSearchParams(window.location.search)
    const forceInvite = params.get('forceInvite')
    if (forceInvite) {
      const stepParam = params.get('inviteStep')
      if (stepParam) {
        inviteStep.value = parseInt(stepParam) || 1
      }
      selectedRoomId.value = forceInvite
      try {
        const roomKey = `audreyRoom_${forceInvite}`
        const rawRoom = localStorage.getItem(roomKey)
        const roomMeta = rawRoom ? JSON.parse(rawRoom) : {}
        if (!roomMeta.name) {
          roomMeta.name = 'Lisa Pepper'
          localStorage.setItem(roomKey, JSON.stringify(roomMeta))
        }
      } catch (e) {}
      if (authUser.value) {
        authUser.value.role = 'editor'
        try { localStorage.setItem('audreyUser', JSON.stringify(authUser.value)) } catch (e) {}
      } else {
        authUser.value = { email: 'preview@example.com', role: 'editor', displayName: 'Preview', avatar: '' }
        try { localStorage.setItem('audreyUser', JSON.stringify(authUser.value)) } catch (e) {}
      }
      // remove any existing member entry for this email so onboarding triggers
      try {
        const key = `audreyRoomMembers_${forceInvite}`
        const raw = localStorage.getItem(key)
        if (raw) {
          let arr = JSON.parse(raw)
          arr = arr.filter(m => m.email !== authUser.value.email)
          localStorage.setItem(key, JSON.stringify(arr))
        }
      } catch (e) {}
    }
  } catch (e) {}

  refreshAccessibleRooms(authUser.value)
})

const handleLogin = (user) => {
  authUser.value = user
  try { localStorage.setItem('audreyUser', JSON.stringify(user)) } catch (e) {}
  // Load or initialize rooms for admin users
  if (user.role === 'admin') {
    const key = `audreyRooms_${user.email}`
    try {
      const stored = localStorage.getItem(key)
      adminRooms.value = stored ? JSON.parse(stored) : []
    } catch (e) {
      adminRooms.value = []
    }
    // Always show the admin room list so admins can choose which room to manage
    if (adminRooms.value.length === 0) {
      // create a default room for admin but keep the list visible
      const id = `room_${Date.now()}`
      const room = { id, name: 'Mijn Kamer', privacy: 'private' }
      adminRooms.value.push(room)
      try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
    }
    selectedRoomId.value = null
    showRoomList.value = true
  } else {
    // non-admins: only editors should open the editor UI; viewers remain in view-only mode
    if (user.role === 'editor') {
      showRoomList.value = false
    } else {
      showRoomList.value = false
    }
  }

  refreshAccessibleRooms(user)
}

const logout = () => {
  authUser.value = null
  try { localStorage.removeItem('audreyUser') } catch (e) {}
  accessibleRooms.value = []
}

const createRoom = () => {
  // open create-room modal instead of immediate creation
  if (!authUser.value) return
  showCreateRoomModal.value = true
}

const showCreateRoomModal = ref(false)
const newRoomName = ref('')
const newRoomPrivacy = ref('private')
const newRoomInviteCode = ref(null)

const generateInviteCodeForNewRoom = () => {
  const code = `INV-${Math.random().toString(36).substring(2,8).toUpperCase()}`
  newRoomInviteCode.value = code
}

const createRoomConfirmed = () => {
  if (!authUser.value) return
  const email = authUser.value.email
  const key = `audreyRooms_${email}`
  const id = `room_${Date.now()}`
  const roomName = newRoomName.value && newRoomName.value.trim().length ? newRoomName.value.trim() : `Kamer ${adminRooms.value.length + 1}`
  // Create room meta with an explicit empty-room flag so the editor can
  // initialize an empty scene (no wallpaper, default grey floor, no objects).
  const room = { id, name: roomName, privacy: newRoomPrivacy.value }
  adminRooms.value.push(room)
  try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
  // persist room meta (privacy, inviteCode, name)
  try {
    const meta = { privacy: newRoomPrivacy.value, inviteCode: newRoomInviteCode.value || null, name: roomName }
    // Mark this new room as intentionally empty by default so admins get
    // an empty canvas when they create it.
    meta.emptyRoom = true
    // Provide a default theme that disables textures/colors (results in
    // neutral grey surfaces) so there is no wallpaper or floor texture.
    meta.theme = { presetId: 'soft-pink', useTextures: false, useColor: false }
    localStorage.setItem(`audreyRoom_${id}`, JSON.stringify(meta))
    // Also initialize an explicit per-room scene entry (empty objects array)
    const emptyScene = { version: 1, timestamp: new Date().toISOString(), objects: [] }
    try { localStorage.setItem(`audreyRoomScene_${id}`, JSON.stringify(emptyScene)) } catch (e) {}
  } catch (e) {}
  selectedRoomId.value = id
  showRoomList.value = false
  showCreateRoomModal.value = false
  refreshAccessibleRooms()
  // reset modal state
  newRoomName.value = ''
  newRoomPrivacy.value = 'private'
  newRoomInviteCode.value = null
}

const cancelCreateRoom = () => {
  showCreateRoomModal.value = false
  newRoomName.value = ''
  newRoomPrivacy.value = 'private'
  newRoomInviteCode.value = null
}

const removeRoom = (id) => {
  if (!authUser.value) return
  const email = authUser.value.email
  const key = `audreyRooms_${email}`
  adminRooms.value = adminRooms.value.filter(r => r.id !== id)
  try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
  refreshAccessibleRooms()
}

const openRoom = (id) => {
  selectedRoomId.value = id
  showRoomList.value = false
  refreshAccessibleRooms()
}

const openFirst = () => {
  if (adminRooms.value.length > 0) {
    // open the most recently added/edited room (last in array)
    selectedRoomId.value = adminRooms.value[adminRooms.value.length - 1].id
    showRoomList.value = false
    refreshAccessibleRooms()
  }
}

const updateUser = (u) => {
  authUser.value = u
  try { localStorage.setItem('audreyUser', JSON.stringify(u)) } catch (e) {}
}

const handleRoomUpdated = ({ id, name }) => {
  if (!authUser.value) return
  const email = authUser.value.email
  const key = `audreyRooms_${email}`
  let changed = false
  adminRooms.value = adminRooms.value.map(r => {
    if (r.id === id) {
      changed = true
      return { ...r, name }
    }
    return r
  })
  if (changed) {
    try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
  }
  refreshAccessibleRooms()
}
</script>

<style scoped>
.panel{
  padding:28px;max-width:880px;margin:60px auto;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.06);
}
.btn{
  background:#f3f3f5;border:1px solid #ddd;padding:8px 12px;border-radius:8px;cursor:pointer;
}
.btn:active{transform:translateY(1px)}
.room-grid{
  display:flex;flex-direction:column;gap:14px;margin-top:12px
}
.room-card{
  width:100%;margin:0;background:#fbfbfb;border-radius:10px;padding:14px;border:1px solid rgba(0,0,0,0.04)
}
.room-main{
  display:flex;align-items:flex-start;gap:16px;margin-top:10px
}
.room-preview{width:104px;height:78px;flex:0 0 104px}
.preview-scene{
  position:relative;width:100%;height:100%;border-radius:10px;
  background:linear-gradient(180deg,#fef9fd 0%,#f8fbff 100%);
  border:1px solid rgba(111,66,193,0.08);
  overflow:hidden;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,0.6)
}
.preview-floor{
  position:absolute;left:20%;right:16%;bottom:10%;height:34%;
  transform:skewX(28deg) rotate(-28deg);
  background:linear-gradient(180deg,#8d95a6,#717a8d);
  border-radius:3px
}
.preview-wall{
  position:absolute;background:#f4d7e4;border:1px solid rgba(160,120,170,0.2)
}
.preview-wall-left{left:16%;bottom:27%;width:30%;height:43%;transform:skewY(34deg)}
.preview-wall-right{right:18%;bottom:27%;width:30%;height:43%;transform:skewY(-34deg)}
.preview-rug{
  position:absolute;left:41%;bottom:19%;width:20%;height:14%;transform:rotate(-24deg);
  background:linear-gradient(180deg,#ff6ca6,#f03d8d);border-radius:4px
}
.preview-sofa{
  position:absolute;width:18%;height:18%;bottom:22%;border-radius:4px 4px 3px 3px;
  background:linear-gradient(180deg,#75d7df,#57c7cf);box-shadow:inset 0 -4px 0 rgba(0,0,0,0.08)
}
.preview-sofa::after{
  content:'';position:absolute;left:18%;right:18%;top:18%;height:22%;border-radius:999px;background:#f7b7d8
}
.preview-sofa-left{left:17%}
.preview-sofa-right{right:17%}
.preview-desk{
  position:absolute;right:24%;top:30%;width:22%;height:13%;border-radius:3px;
  background:linear-gradient(180deg,#f4e5d3,#ecd9c2);transform:rotate(-12deg)
}
.preview-desk::after{
  content:'';position:absolute;right:10%;top:-6px;width:26px;height:16px;border-radius:2px;background:#6fd9df;box-shadow:0 0 0 1px rgba(0,0,0,0.05)
}
.preview-window{
  position:absolute;right:25%;top:9%;width:18%;height:28%;
  background:linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.4));
  border:1px solid rgba(244,180,203,0.35);border-top:0;border-bottom:0
}
.preview-pendant{
  position:absolute;left:48%;top:8%;width:8px;height:22px;background:#d9b3c6;border-radius:999px
}
.room-body{flex:1;min-width:0;padding-top:2px}
.room-name{font-weight:600;font-size:18px;line-height:1.2;margin-top:8px}
.card-instruction{font-size:14px;color:#5b5b5b}
.room-meta{font-size:13px;color:#666;margin-bottom:6px}
.room-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.room-actions .btn{min-width:78px}
.invite-toggle{background:transparent;border:none;color:#333;padding:0;font-weight:600;cursor:pointer}
.invite-status{font-size:13px;color:#666;font-weight:600}
</style>

<template>
  <div>
    <div v-if="!authUser">
      <Login @login="handleLogin" />
    </div>

    <div v-else>
      <!-- top-right controls (avatar menu moved into SceneCanvas) -->

      <div v-if="authUser.role === 'admin' && showRoomList">
            <div class="panel">
              <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
                <button class="btn" @click="logout">Uitloggen</button>
              </div>
              <h3 v-if="authUser.displayName">{{ 'Kamers van ' + authUser.displayName }}</h3>
              <h3 v-else-if="authUser.email">{{ 'Kamers van ' + authUser.email.split('@')[0] }}</h3>
              <h3 v-else>Uw kamers</h3>

              <div class="card-instruction">Open een kamer om te bewerken, verwijder deze of maak een nieuwe om opnieuw te beginnen.</div>

              <div class="room-grid">
                <div v-for="r in adminRooms" :key="r.id" class="room-card">
                  <div class="room-name">{{ r.name }}</div>
              <div class="room-main">
                <div class="room-preview" aria-hidden>
                  <div class="preview-scene">
                    <span class="preview-wall preview-wall-left"></span>
                    <span class="preview-wall preview-wall-right"></span>
                    <span class="preview-floor"></span>
                    <span class="preview-rug"></span>
                    <span class="preview-sofa preview-sofa-left"></span>
                    <span class="preview-sofa preview-sofa-right"></span>
                    <span class="preview-desk"></span>
                    <span class="preview-window"></span>
                    <span class="preview-pendant"></span>
                  </div>
                </div>
                <div class="room-body">
                  <div class="room-meta">Privacy: <strong>{{ r.privacy === 'private' ? 'Privé' : 'Openbaar' }}</strong></div>
                  <div class="room-invite">
                    {{ getInviteLabel(r) }}:
                    <button v-if="r.privacy === 'private' && getInviteCode(r.id)" class="invite-toggle" @click="toggleReveal(r.id)">
                      <span v-if="!revealed[r.id]">******</span>
                      <span v-else>{{ getInviteCode(r.id) }}</span>
                    </button>
                    <span v-else-if="r.privacy === 'private'" class="invite-status">Geen actieve uitnodiging</span>
                  </div>
                </div>
              </div>
              <div class="room-actions">
                <button class="btn" @click="openRoom(r.id)">Openen</button>
                <button class="btn" @click="removeRoom(r.id)">Verwijderen</button>
              </div>
            </div>
          </div>

          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn" @click="createRoom">Nieuwe kamer</button>
            <button class="btn" @click="openFirst">Laatst geopend</button>
          </div>
          
          <div v-if="showCreateRoomModal" class="modal-backdrop" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);z-index:10050;">
            <div class="modal-card" style="width:520px;max-width:92%;padding:18px;z-index:10051;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,0.3);background:#ffffff;color:#1a1a1a;">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3>Nieuwe kamer maken</h3>
              </div>

              <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                <label>Naam van kamer</label>
                <input v-model="newRoomName" placeholder="Bijv. Herinneringen aan Oma" style="padding:8px;border-radius:8px;border:1px solid #e6e6ee" />

                <div style="display:flex;gap:8px;align-items:center">
                  <div style="font-weight:600">Privacy:</div>
                  <label style="display:flex;align-items:center;gap:8px"><input type="radio" v-model="newRoomPrivacy" value="private" /> Privé</label>
                  <label style="display:flex;align-items:center;gap:8px"><input type="radio" v-model="newRoomPrivacy" value="public" /> Openbaar</label>
                </div>

                <div v-if="newRoomPrivacy === 'private'" style="display:flex;gap:8px;align-items:center">
                  <button class="btn" @click="generateInviteCodeForNewRoom">Genereer uitnodigingscode</button>
                  <div style="font-size:13px;color:#333">{{ newRoomInviteCode ? ('Code: ' + newRoomInviteCode) : 'Nog geen code' }}</div>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
                <button class="btn" @click="cancelCreateRoom">Annuleren</button>
                <button class="btn" @click="createRoomConfirmed">Maak aan</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- Invite flow for first-time editors (when they open a specific room) -->
        <div v-if="authUser.role === 'editor' && selectedRoomId && !isMemberOnboarded(authUser.email, selectedRoomId)">
          <InviteLanding v-if="inviteStep === 1" :adminName="getRoomMeta(selectedRoomId).adminName || 'Admin'" :roomName="getRoomMeta(selectedRoomId).name || 'Room'" @next="handleLandingNext" />
          <InviteProfile v-else-if="inviteStep === 2" @next="handleProfileNext" />
          <InviteAvatar v-else-if="inviteStep === 3" @next="handleAvatarNext" />
          <InviteLoading v-else-if="inviteStep === 4" :roomName="getRoomMeta(selectedRoomId).name || ''" @finished="handleFinished" />
        </div>

        <SceneCanvas
          v-else
          :currentUser="authUser"
          :roomId="selectedRoomId"
          :accessibleRooms="accessibleRooms"
          @logout="logout"
          @update-user="updateUser"
          @room-deleted="removeRoom"
          @room-updated="handleRoomUpdated"
          @room-selected="handleRoomSelected"
          @create-room="createRoom"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    createRoom() {
      const email = authUser.value.email
      const key = `audreyRooms_${email}`
      const id = `room_${Date.now()}`
      const room = { id, name: `Room ${adminRooms.value.length + 1}`, privacy: 'private' }
      adminRooms.value.push(room)
      try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
      selectedRoomId.value = id
      showRoomList.value = false
    },
    removeRoom(id) {
      const email = authUser.value.email
      const key = `audreyRooms_${email}`
      adminRooms.value = adminRooms.value.filter(r => r.id !== id)
      try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
    }
  }
}
</script>
