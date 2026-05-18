<script setup>
import { ref, onMounted } from 'vue'
import SceneCanvas from './components/SceneCanvas.vue'
import Login from './components/Login.vue'
import { getSupabase } from './lib/supabase'

const authUser = ref(null)
const adminRooms = ref([])
const selectedRoomId = ref(null)
const showRoomList = ref(false)

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

    if (adminRooms.value.length === 0) {
      // create a default room for admin
      const id = `room_${Date.now()}`
      const room = { id, name: 'My Room', privacy: 'private' }
      adminRooms.value.push(room)
      try { localStorage.setItem(key, JSON.stringify(adminRooms.value)) } catch (e) {}
      selectedRoomId.value = id
      showRoomList.value = false
    } else if (adminRooms.value.length === 1) {
      selectedRoomId.value = adminRooms.value[0].id
      showRoomList.value = false
    } else {
      showRoomList.value = true
    }
  } else {
    // non-admins open editor directly
    showRoomList.value = false
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
    selectedRoomId.value = adminRooms.value[0].id
    showRoomList.value = false
  }
}

const updateUser = (u) => {
  authUser.value = u
  try { localStorage.setItem('audreyUser', JSON.stringify(u)) } catch (e) {}
}
</script>

<template>
  <div>
    <div v-if="!authUser">
      <Login @login="handleLogin" />
    </div>

    <div v-else>
      <!-- top-right controls (avatar menu moved into SceneCanvas) -->

      <div v-if="authUser.role === 'admin' && showRoomList">
        <div style="padding:28px;max-width:760px;margin:60px auto;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.06)">
          <h3>Your rooms</h3>
          <ul>
            <li v-for="r in adminRooms" :key="r.id" style="margin:8px 0;display:flex;justify-content:space-between;align-items:center">
              <div>{{ r.name }} — <small>{{ r.privacy }}</small></div>
              <div style="display:flex;gap:8px">
                <button @click="openRoom(r.id)">Open</button>
                <button @click="removeRoom(r.id)">Delete</button>
              </div>
            </li>
          </ul>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button @click="createRoom">Create new room</button>
            <button @click="openFirst">Open first</button>
          </div>
        </div>
      </div>

      <div v-else>
        <SceneCanvas :currentUser="authUser" :roomId="selectedRoomId" @logout="logout" @update-user="updateUser" @room-deleted="removeRoom" />
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
