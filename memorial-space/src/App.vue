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
  return room.privacy === 'private' ? 'Invite' : 'Invite (only for private rooms)'
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
      const room = { id, name: 'My Room', privacy: 'private' }
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
}

const logout = () => {
  authUser.value = null
  try { localStorage.removeItem('audreyUser') } catch (e) {}
}

const createRoom = () => {
  if (!authUser.value) return
  const email = authUser.value.email
  const key = `audreyRooms_${email}`
  const id = `room_${Date.now()}`
  const room = { id, name: `Room ${adminRooms.value.length + 1}`, privacy: 'private' }
  adminRooms.value.push(room)
  try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
  selectedRoomId.value = id
  showRoomList.value = false
}

const removeRoom = (id) => {
  if (!authUser.value) return
  const email = authUser.value.email
  const key = `audreyRooms_${email}`
  adminRooms.value = adminRooms.value.filter(r => r.id !== id)
  try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
}

const openRoom = (id) => {
  selectedRoomId.value = id
  showRoomList.value = false
}

const openFirst = () => {
  if (adminRooms.value.length > 0) {
    // open the most recently added/edited room (last in array)
    selectedRoomId.value = adminRooms.value[adminRooms.value.length - 1].id
    showRoomList.value = false
  }
}

const updateUser = (u) => {
  authUser.value = u
  try { localStorage.setItem('audreyUser', JSON.stringify(u)) } catch (e) {}
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
.room-preview{width:88px;height:64px;flex:0 0 88px}
.preview-box{width:88px;height:64px;background:linear-gradient(135deg,#faf3f2,#f7f9fb);display:flex;align-items:center;justify-content:center;border-radius:6px;color:#777;font-size:12px}
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
            <button class="btn" @click="logout">Logout</button>
          </div>
          <h3>{{ (authUser.displayName ? authUser.displayName : (authUser.email ? authUser.email.split('@')[0] : 'Your')) + "'s Rooms" }}</h3>

          <div class="room-grid">
            <div v-for="r in adminRooms" :key="r.id" class="room-card">
              <div class="card-instruction">Open to edit a room, delete it, or create a new one to start fresh.</div>
              <div class="room-name">{{ r.name }}</div>
              <div class="room-main">
                <div class="room-preview" aria-hidden>
                  <!-- placeholder preview; replace with thumbnail if available -->
                  <div class="preview-box">Preview</div>
                </div>
                <div class="room-body">
                  <div class="room-meta">Privacy: <strong>{{ r.privacy }}</strong></div>
                  <div class="room-invite">
                    {{ getInviteLabel(r) }}:
                    <button v-if="r.privacy === 'private' && getInviteCode(r.id)" class="invite-toggle" @click="toggleReveal(r.id)">
                      <span v-if="!revealed[r.id]">******</span>
                      <span v-else>{{ getInviteCode(r.id) }}</span>
                    </button>
                    <span v-else-if="r.privacy === 'private'" class="invite-status">No active invite</span>
                  </div>
                </div>
              </div>
              <div class="room-actions">
                <button class="btn" @click="openRoom(r.id)">Open</button>
                <button class="btn" @click="removeRoom(r.id)">Delete</button>
              </div>
            </div>
          </div>

          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn" @click="createRoom">Create new room</button>
            <button class="btn" @click="openFirst">Last opened</button>
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

        <SceneCanvas v-else :currentUser="authUser" :roomId="selectedRoomId" @logout="logout" @update-user="updateUser" @room-deleted="removeRoom" />
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
