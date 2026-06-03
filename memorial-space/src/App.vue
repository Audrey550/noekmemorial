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
const joinInviteCode = ref('')
const joinInviteError = ref('')
const joinInviteSuccess = ref('')
const showRoomList = ref(false)
const revealed = ref({})

// invite flow state
const inviteFlowActive = ref(false)
const inviteStep = ref(1)

const inviteData = ref({ firstName: '', lastName: '', avatar: null })
const roomMembersCache = ref({})

const getCurrentSupabaseUserId = (user = authUser.value) => user?.supabaseId || user?.id || user?.uid || null

const normalizeRoomRow = (room) => ({
  id: room.id,
  name: room.name || `Kamer ${String(room.id).slice(0, 8)}`,
  privacy: room.privacy || 'private',
  inviteCode: room.invite_code || room.inviteCode || null,
  theme: room.theme || null,
  emptyRoom: !!(room.empty_room ?? room.emptyRoom),
  ownerId: room.owner_id || room.ownerId || null,
})

const normalizeRoomMemberRow = (row) => ({
  id: row.id,
  room_id: row.room_id || row.roomId,
  user_id: row.user_id || row.userId || null,
  email: row.email || '',
  role: row.role || 'editor',
  displayName: row.display_name || row.displayName || '',
  avatar: row.avatar || '',
  onboarded: row.onboarded !== false,
  status: row.status || 'active',
})

const loadRoomMetaFromStorage = (roomId) => {
  try {
    const raw = localStorage.getItem(`audreyRoom_${roomId}`)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

const setRoomMembersCache = (roomId, members) => {
  roomMembersCache.value = {
    ...roomMembersCache.value,
    [roomId]: Array.isArray(members) ? members.map(normalizeRoomMemberRow) : [],
  }
}

const loadRoomsFromSupabase = async (user = authUser.value) => {
  const supabase = getSupabase()
  const supabaseUserId = getCurrentSupabaseUserId(user)

  if (!supabase || !supabaseUserId) {
    return null
  }

  try {
    const [ownedRoomsResult, membershipsResult] = await Promise.all([
      supabase
        .from('rooms')
        .select('id,name,privacy,invite_code,theme,empty_room,owner_id,created_at')
        .eq('owner_id', supabaseUserId),
      supabase
        .from('room_members')
        .select('id,room_id,user_id,email,role,display_name,avatar,onboarded,status,created_at')
        .or(`user_id.eq.${supabaseUserId},email.eq.${user.email}`),
    ])

    const ownedRooms = Array.isArray(ownedRoomsResult.data)
      ? ownedRoomsResult.data.map(normalizeRoomRow)
      : []
    const members = Array.isArray(membershipsResult.data)
      ? membershipsResult.data.map(normalizeRoomMemberRow)
      : []

    const roomIds = [...new Set(members.map((member) => member.room_id).filter(Boolean))]
    const sharedRoomsResult = roomIds.length
      ? await supabase
        .from('rooms')
        .select('id,name,privacy,invite_code,theme,empty_room,owner_id,created_at')
        .in('id', roomIds)
      : { data: [] }

    const sharedRooms = Array.isArray(sharedRoomsResult.data)
      ? sharedRoomsResult.data.map(normalizeRoomRow)
      : []

    for (const roomId of roomIds) {
      setRoomMembersCache(roomId, members.filter((member) => member.room_id === roomId))
    }

    return { ownedRooms, sharedRooms, members }
  } catch (error) {
    return null
  }
}

const loadAdminRoomsFromSupabase = async (user = authUser.value) => {
  const supabase = getSupabase()
  const supabaseUserId = getCurrentSupabaseUserId(user)
  if (!supabase || !supabaseUserId) {
    return false
  }

  try {
    const { data } = await supabase
      .from('rooms')
      .select('id,name,privacy,invite_code,theme,empty_room,owner_id,created_at')
      .eq('owner_id', supabaseUserId)

    adminRooms.value = Array.isArray(data) ? data.map(normalizeRoomRow) : []
    return true
  } catch (error) {
    return false
  }
}

const isMemberOnboarded = (email, roomId) => {
  if (!email || !roomId) return false
  const cached = roomMembersCache.value?.[roomId]
  if (Array.isArray(cached)) {
    const found = cached.find((member) => member.email === email)
    if (found) {
      return !!found.onboarded
    }
  }
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

const saveMemberAndProfile = async (roomId, profile) => {
  const supabase = getSupabase()
  if (!supabase) return

  const { data: userData } = await supabase.auth.getUser()
  const supabaseUserId = userData?.user?.id

  const email = userData?.user?.email || ''

  const nextMember = {
    id: `m_${Date.now()}`,
    room_id: roomId,
    user_id: supabaseUserId,   // IMPORTANT (add this if missing)
    email,
    role: 'editor',
    displayName: profile.displayName || '',
    avatar: profile.avatar || '',
    onboarded: true,
    status: 'active',
  }

  await supabase.from('room_members').insert(nextMember)

  try {
    const key = `audreyRoomMembers_${roomId}`
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(nextMember)
    localStorage.setItem(key, JSON.stringify(arr))
    setRoomMembersCache(roomId, arr)
  } catch (e) {}

  if (supabase && roomId && email) {
    void supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('email', email)
      .maybeSingle()
      .then(async (result) => {
        const payload = {
          room_id: roomId,
          user_id: supabaseUserId,
          email,
          role: 'editor',
          display_name: profile.displayName || '',
          avatar: profile.avatar || '',
          onboarded: true,
          status: 'active',
        }

        if (result?.data?.id) {
          await supabase.from('room_members').update(payload).eq('id', result.data.id)
          return
        }

        await supabase.from('room_members').insert(payload)
      })
      .catch((e) => console.error(e))
  }
  // update local user profile too
  if (authUser.value) {
    authUser.value.displayName = profile.displayName || authUser.value.displayName
    authUser.value.avatar = profile.avatar || authUser.value.avatar
    try { localStorage.setItem('audreyUser', JSON.stringify(authUser.value)) } catch (e) {}
  }
}

const getRoomMeta = (roomId) => {
  return loadRoomMetaFromStorage(roomId)
}

const refreshAccessibleRooms = async (user = authUser.value) => {
  if (!user || !user.email) {
    accessibleRooms.value = []
    roomMembersCache.value = {}
    return
  }

  const roomsById = new Map()
  const remoteRooms = await loadRoomsFromSupabase(user)

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

  if (remoteRooms) {
    if (user.role === 'admin' && remoteRooms.ownedRooms.length > 0) {
      adminRooms.value = remoteRooms.ownedRooms.map((room) => ({
        id: room.id,
        name: room.name,
        privacy: room.privacy || 'private',
        inviteCode: room.inviteCode || null,
      }))
    }

    remoteRooms.ownedRooms.forEach((room) => {
      roomsById.set(room.id, {
        id: room.id,
        name: room.name,
        privacy: room.privacy || 'private',
        inviteCode: room.inviteCode || null,
        role: user.role === 'admin' ? 'admin' : 'editor',
        createdByMe: true,
      })
    })

    remoteRooms.sharedRooms.forEach((room) => {
      const member = remoteRooms.members.find((entry) => entry.room_id === room.id)
      if (!member) return
      roomsById.set(room.id, {
        id: room.id,
        name: room.name,
        privacy: room.privacy || 'private',
        inviteCode: room.inviteCode || null,
        role: member.role || 'editor',
        createdByMe: false,
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

        const normalizedMembers = members.map(normalizeRoomMemberRow)
        setRoomMembersCache(roomId, normalizedMembers)

        const member = normalizedMembers.find((entry) => entry.email === user.email)
        if (!member) return

        const meta = getRoomMeta(roomId)
        roomsById.set(roomId, {
          id: roomId,
          name: meta.name || `Kamer ${roomId}`,
          privacy: meta.privacy || 'private',
          inviteCode: meta.inviteCode || null,
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

  try {
    localStorage.setItem('audreySelectedRoomId', roomId)
  } catch (e) {}

  refreshAccessibleRooms()
}

// invite handlers
const handleLandingNext = () => {
  inviteStep.value = 2
}
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
  const room = adminRooms.value.find((entry) => entry.id === id) || accessibleRooms.value.find((entry) => entry.id === id)
  if (room?.inviteCode) return room.inviteCode
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
  supabase.auth.getUser().then(({ data, error }) => {
    console.log('SUPABASE AUTH USER:', data?.user)
    console.log('SUPABASE AUTH ERROR:', error)
  })
    // initialize from supabase current user if available
supabase.auth.getUser().then(async res => {
  const u = res.data?.user

  if (u) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, display_name, avatar')
      .eq('id', u.id)
      .maybeSingle()

    console.log('PROFILE LOAD DATA:', profile)
    console.log('PROFILE LOAD ERROR:', error)

    const userObj = {
      email: u.email,
      role: profile?.role || 'viewer',
      displayName:
        profile?.display_name ||
        (u.email && u.email.split('@')[0]) ||
        'User',
      avatar: profile?.avatar || '',
      supabaseId: u.id,
    }

    authUser.value = userObj

try {
  localStorage.setItem('audreyUser', JSON.stringify(userObj))
} catch (e) {}

await loadAdminRoomsFromSupabase(userObj)
await refreshAccessibleRooms(userObj)

const savedRoomId = localStorage.getItem('audreySelectedRoomId')
const canOpenSavedRoom =
  savedRoomId &&
  accessibleRooms.value.some((room) => room.id === savedRoomId)

if (canOpenSavedRoom) {
  selectedRoomId.value = savedRoomId
  showRoomList.value = false
}
  }
})

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        authUser.value = null
        accessibleRooms.value = []
        roomMembersCache.value = {}
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

  void loadAdminRoomsFromSupabase(authUser.value)
  void refreshAccessibleRooms(authUser.value)
})

const handleLogin = async (user) => {
  console.log('HANDLE LOGIN USER:', user)
  console.log('INVITED ROOM ID:', user.invitedRoomId)

  authUser.value = user

  try {
    localStorage.setItem('audreyUser', JSON.stringify(user))
  } catch (e) {}

  if (user.role === 'admin') {
    await loadAdminRoomsFromSupabase(user)
    await refreshAccessibleRooms(user)

    const savedRoomId = localStorage.getItem('audreySelectedRoomId')
    const canOpenSavedRoom =
      savedRoomId &&
      accessibleRooms.value.some((room) => room.id === savedRoomId)

    if (canOpenSavedRoom) {
      selectedRoomId.value = savedRoomId
      showRoomList.value = false
      return
    }

    selectedRoomId.value = null
    showRoomList.value = true
    return
  }

  if (user.role === 'editor') {
    await refreshAccessibleRooms(user)

    const roomToOpen =
      user.invitedRoomId ||
      accessibleRooms.value?.[0]?.id ||
      null

    console.log('EDITOR ROOM TO OPEN:', roomToOpen)

    selectedRoomId.value = roomToOpen
    showRoomList.value = false
    return
  }

  await refreshAccessibleRooms(user)

  selectedRoomId.value = null
  showRoomList.value = true

  try {
    localStorage.removeItem('audreySelectedRoomId')
  } catch (e) {}
}

const logout = () => {
  authUser.value = null
  try { localStorage.removeItem('audreyUser') } catch (e) {}
  accessibleRooms.value = []
  roomMembersCache.value = {}
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

const createRoomConfirmed = async () => {
  if (!authUser.value) return

  const email = authUser.value.email
  const key = `audreyRooms_${email}`

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `room_${Date.now()}`

  const roomName =
    newRoomName.value && newRoomName.value.trim().length
      ? newRoomName.value.trim()
      : `Kamer ${adminRooms.value.length + 1}`

  console.log('CREATE ROOM CALLED', {
    id,
    roomName,
    user: authUser.value?.email
  })

  const supabase = getSupabase()
const { data: userData } = await supabase.auth.getUser()
const supabaseUserId = userData?.user?.id

console.log('ROOM INSERT USER ID:', supabaseUserId)

if (supabase && supabaseUserId) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      id,
      owner_id: supabaseUserId,
      name: roomName,
      privacy: newRoomPrivacy.value,
      invite_code: newRoomInviteCode.value || null,
      theme: { presetId: 'soft-pink', useTextures: false, useColor: false },
      empty_room: true,
    })
    .select()

  console.log('ROOM INSERT DATA:', data)
  console.log('ROOM INSERT ERROR:', error)

  if (!error) {
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: id,
        user_id: supabaseUserId,
        email: userData?.user?.email || authUser.value.email,
        role: 'admin',
        display_name: authUser.value.displayName || '',
        avatar: authUser.value.avatar || '',
        onboarded: true,
        status: 'active',
      })
      .select()

    console.log('ROOM MEMBER INSERT DATA:', memberData)
    console.log('ROOM MEMBER INSERT ERROR:', memberError)
  }
}

await loadAdminRoomsFromSupabase(authUser.value)
await refreshAccessibleRooms(authUser.value)

selectedRoomId.value = id
showRoomList.value = false
showCreateRoomModal.value = false

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

  if (selectedRoomId.value === id) {
    selectedRoomId.value = null
    showRoomList.value = true

    try {
      localStorage.removeItem('audreySelectedRoomId')
    } catch (e) {}
  }

  try {
    localStorage.setItem(key, JSON.stringify(adminRooms.value))
  } catch (e) {}

  const supabase = getSupabase()

  if (supabase) {
    void (async () => {
      try {
        await supabase.from('room_scene_versions').delete().eq('room_id', id)
        await supabase.from('room_scenes').delete().eq('room_id', id)
        await supabase.from('room_members').delete().eq('room_id', id)
        await supabase.from('rooms').delete().eq('id', id)
      } catch (e) {
        console.error('REMOVE ROOM ERROR:', e)
      }
    })()
  }

  void refreshAccessibleRooms()
}

const openRoom = (id) => {
  selectedRoomId.value = id
  showRoomList.value = false

  try {
    localStorage.setItem('audreySelectedRoomId', id)
  } catch (e) {}

  void refreshAccessibleRooms()
}

const joinRoomByInviteCode = async () => {
  joinInviteError.value = ''
  joinInviteSuccess.value = ''

  const code = joinInviteCode.value.trim().toUpperCase()

  if (!code) {
    joinInviteError.value = 'Vul een uitnodigingscode in.'
    return
  }

  if (!authUser.value?.email) {
    joinInviteError.value = 'Je moet ingelogd zijn om een kamer te openen.'
    return
  }

  const supabase = getSupabase()

  if (!supabase) {
    joinInviteError.value = 'Kan geen verbinding maken met Supabase.'
    return
  }

  try {
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id,name,privacy,invite_code')
      .eq('invite_code', code)
      .maybeSingle()

    if (roomError) {
      console.error(roomError)
      joinInviteError.value = 'Kamer niet gevonden.'
      return
    }

    if (!room) {
      joinInviteError.value = 'Geen kamer gevonden met deze code.'
      return
    }

    const userId =
      authUser.value.supabaseId ||
      authUser.value.id ||
      null

    const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: room.id,
      user_id: userId,
      email: authUser.value.email,
      role: 'viewer',
      display_name:
        authUser.value.displayName ||
        authUser.value.display_name ||
        authUser.value.email,
      avatar: authUser.value.avatar || '',
      onboarded: true,
      status: 'active'
    })

    if (memberError && memberError.code !== '23505') {
      console.error(memberError)
      joinInviteError.value = 'Toegang geven mislukt.'
      return
    }

    joinInviteSuccess.value = `Toegevoegd aan "${room.name}"`

    await refreshAccessibleRooms()

    selectedRoomId.value = room.id
    showRoomList.value = false

    try {
      localStorage.setItem('audreySelectedRoomId', room.id)
    } catch (e) {}
  } catch (e) {
    console.error(e)
    joinInviteError.value = 'Er ging iets mis.'
  }
}

const openFirst = () => {
  if (adminRooms.value.length > 0) {
    const id = adminRooms.value[adminRooms.value.length - 1].id

    selectedRoomId.value = id
    showRoomList.value = false

    try {
      localStorage.setItem('audreySelectedRoomId', id)
    } catch (e) {}

    void refreshAccessibleRooms()
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
  const supabase = getSupabase()
  if (supabase) {
    void supabase.from('rooms').update({ name }).eq('id', id).catch((e) => console.error(e))
  }
  void refreshAccessibleRooms()
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

      <div v-if="showRoomList">
            <div class="panel">
              <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
                <button class="btn" @click="logout">Uitloggen</button>
              </div>
              <h3 v-if="authUser.displayName">{{ 'Kamers van ' + authUser.displayName }}</h3>
              <h3 v-else-if="authUser.email">{{ 'Kamers van ' + authUser.email.split('@')[0] }}</h3>
              <h3 v-else>Uw kamers</h3>

              <div class="card-instruction">Open een kamer om te bewerken, verwijder deze of maak een nieuwe om opnieuw te beginnen.</div>

              <div class="room-grid">
                <div v-for="r in (authUser.role === 'admin' ? adminRooms : accessibleRooms)" :key="r.id" class="room-card">
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

          <div v-if="authUser.role === 'admin'" style="margin-top:12px;display:flex;gap:8px">
          <button class="btn" @click="createRoom">Nieuwe kamer</button>
          <button class="btn" @click="openFirst">Laatst geopend</button>
        </div>

          <div class="join-room-card">
            <h3>Uitnodigingscode</h3>
            <p>Heb je een uitnodigingscode ontvangen? Vul deze in om toegang te krijgen tot de kamer.</p>

            <div class="join-room-form">
              <input
                v-model="joinInviteCode"
                type="text"
                placeholder="Bijv. INV-IPENZ1"
              />

              <button class="btn" type="button" @click="joinRoomByInviteCode">
                Toegang krijgen
              </button>
            </div>

            <p v-if="joinInviteError" class="join-room-error">{{ joinInviteError }}</p>
            <p v-if="joinInviteSuccess" class="join-room-success">{{ joinInviteSuccess }}</p>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- Invite flow for first-time editors (when they open a specific room) -->
        <div v-if="authUser.role === 'editor' && selectedRoomId && !isMemberOnboarded(authUser.email, selectedRoomId)">
          <InviteLanding v-if="inviteStep === 1" :adminName="getRoomMeta(selectedRoomId).adminName || 'Admin'" :roomName="getRoomMeta(selectedRoomId).name || 'Room'" @next="handleLandingNext" />
          <InviteAvatar v-else-if="inviteStep === 2" @next="handleAvatarNext" />
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
</template>

