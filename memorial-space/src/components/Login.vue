<script setup>
import { ref } from 'vue'
import { logEvent } from '../lib/analytics'
import { getSupabase } from '../lib/supabase'
const emit = defineEmits(['login'])

const email = ref('')
const role = ref('viewer')
const remember = ref(true)
const password = ref('')
const inviteCode = ref('')
const step = ref('form') // form | profile | loading
const displayName = ref('')
const chosenAvatar = ref('')
const uploadedAvatar = ref('')

const pickColor = (seed) => {
  const colors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e', '#e17055']
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return colors[sum % colors.length]
}

const createAvatarDataUrl = (name) => {
  const initials = (name || 'U').slice(0,2).toUpperCase()
  const color = pickColor(name || initials)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' rx='60' fill='${color}' /><text x='50%' y='54%' font-size='54' font-family='sans-serif' fill='white' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const proceedFromForm = async () => {
  // basic validation
  if (!email.value) email.value = 'guest@example.com'

  if (role.value === 'admin' && !password.value) {
    alert('Voer een wachtwoord in voor admin (demo)')
    return
  }

  const supabase = getSupabase()

  if (role.value === 'editor') {
    if (!inviteCode.value) {
      alert('Voer een uitnodigingscode in voor co-editor (demo)')
      return
    }
    try { logEvent('invite.validated', { role: 'editor' }) } catch (e) {}
    // go to profile selection for invited users
    displayName.value = email.value.split('@')[0]
    chosenAvatar.value = createAvatarDataUrl(displayName.value)
    step.value = 'profile'
    return
  }

  // If Supabase is configured, try to sign in/up; otherwise fallback to local mock
  if (supabase) {
    startLoadingAndEmit(true)
  } else {
    startLoadingAndEmit(false)
  }
}

const startLoadingAndEmit = async (useSupabase = false) => {
  step.value = 'loading'
  const supabase = getSupabase()

  if (useSupabase && supabase) {
    try {
      // Try sign in with password if provided
      let session = null
     if (password.value) {
  const cleanEmail = email.value.trim()

  const res = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password.value
  })

  console.log('LOGIN RES:', res)

  if (res.error) {
    console.error('LOGIN ERROR:', res.error.message)

    const signupRes = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.value
    })

    console.log('SIGNUP RES:', signupRes)

    if (signupRes.error) {
      console.error('SIGNUP ERROR:', signupRes.error.message)
      alert('Supabase signup failed: ' + signupRes.error.message)
      step.value = 'form'
      return
    }

    const r2 = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password.value
    })

    console.log('SECOND LOGIN RES:', r2)

    if (r2.error) {
      console.error('SECOND LOGIN ERROR:', r2.error.message)
      alert('Supabase login failed: ' + r2.error.message)
      step.value = 'form'
      return
    }

    session = r2.data?.session
  } else {
    session = res.data?.session
  }
} else {
        // create a temporary account for non-password roles (demo)
        const demoPassword = Math.random().toString(36).slice(2, 10) + 'A!'
        await supabase.auth.signUp({ email: email.value, password: demoPassword })
        const r3 = await supabase.auth.signInWithPassword({ email: email.value, password: demoPassword })
        session = r3.data?.session
      }

      // If session exists, use supabase user as source of truth
if (session && session.user) {
  const u = session.user

  const cleanEmail = u.email || email.value.trim()
  const cleanDisplayName =
    displayName.value || (cleanEmail && cleanEmail.split('@')[0]) || 'Guest'

  const profilePayload = {
    id: u.id,
    email: cleanEmail,
    role: role.value,
    display_name: cleanDisplayName,
    avatar: chosenAvatar.value || '',
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePayload)
    .select()

  console.log('PROFILE UPSERT DATA:', profileData)
  console.log('PROFILE UPSERT ERROR:', profileError)

  const userObj = {
    email: cleanEmail,
    role: role.value,
    displayName: cleanDisplayName,
    avatar: chosenAvatar.value || '',
    supabaseId: u.id,
  }

  if (remember.value) {
    try {
      localStorage.setItem('audreyUser', JSON.stringify(userObj))
    } catch (e) {}
  }

  try {
    logEvent('login.success', {
      role: role.value,
      method: 'supabase',
      invited: role.value === 'editor',
    })
  } catch (e) {}

  setTimeout(() => emit('login', userObj), 400)
  return
}
    } catch (e) {
      console.error('Supabase login failed', e)
      step.value = 'form'
      return
    }
  }

  // Local fallback
  const user = buildUserObject()
  if (remember.value) {
    try { localStorage.setItem('audreyUser', JSON.stringify(user)) } catch (e) {}
  }
  try { logEvent('login.success', { role: role.value, method: useSupabase ? 'supabase_fallback' : 'mock', invited: role.value === 'editor' }) } catch (e) {}
  setTimeout(() => emit('login', user), 700)
}

const buildUserObject = () => {
  const safeEmail = email.value || 'guest@example.com'
  const name = displayName.value || safeEmail.split('@')[0]
  const avatar = uploadedAvatar.value || chosenAvatar.value || createAvatarDataUrl(name)
  return { email: safeEmail, role: role.value, displayName: name, avatar }
}

const submitProfile = () => {
  // save and emit after short loading
  if (remember.value) {
    try { localStorage.setItem('audreyUser', JSON.stringify(buildUserObject())) } catch (e) {}
  }
  startLoadingAndEmit(true)
}

const pickAvatar = (dataUrl) => {
  chosenAvatar.value = dataUrl
  uploadedAvatar.value = ''
}

const onUpload = (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    uploadedAvatar.value = reader.result
    chosenAvatar.value = uploadedAvatar.value
  }
  reader.readAsDataURL(f)
}
</script>

<template>
  <div class="login-screen" style="display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(180deg,#f5f3fb,#fff)">
    <div style="width:420px;padding:22px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(13,12,34,0.08)">
      <template v-if="step === 'form'">
        <h2 style="margin:0 0 12px 0">Inloggen — Demo</h2>
        <label style="font-size:13px;color:#333">E-mail</label>
        <input v-model="email" placeholder="you@example.com" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />

        <label style="font-size:13px;color:#333;margin-top:8px;display:block">Rol</label>
        <select v-model="role" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px">
          <option value="admin">Admin (eigenaar)</option>
          <option value="editor">Co-editor (uitgenodigd)</option>
          <option value="viewer">Kijker (publieke link)</option>
        </select>

        <div v-if="role === 'admin'" style="margin-top:8px">
          <label style="font-size:13px;color:#333">Wachtwoord (demo)</label>
          <input type="password" v-model="password" placeholder="wachtwoord" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />
        </div>

        <div v-if="role === 'editor'" style="margin-top:8px">
          <label style="font-size:13px;color:#333">Uitnodigingscode (demo)</label>
          <input v-model="inviteCode" placeholder="ABCD-1234" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin:8px 0">
          <input type="checkbox" v-model="remember" id="remember" />
          <label for="remember" style="font-size:13px">Onthoud mij</label>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <div></div>
          <div>
            <button @click="proceedFromForm" style="padding:8px 14px;border-radius:8px;border:none;background:#6c5ce7;color:#fff">Doorgaan</button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 'profile'">
        <h2 style="margin:0 0 12px 0">Stel je profiel in</h2>
        <label style="font-size:13px;color:#333">Weergavenaam</label>
        <input v-model="displayName" placeholder="Weergavenaam" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />

        <div style="margin-top:10px">
          <label style="font-size:13px;color:#333;display:block;margin-bottom:8px">Kies een avatar</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div v-for="i in 6" :key="i" @click="pickAvatar(createAvatarDataUrl(displayName || email.split('@')[0] + i))" :style="{width:'64px',height:'64px',borderRadius:'8px',cursor:'pointer',backgroundImage:`url(${createAvatarDataUrl(displayName || email.split('@')[0] + i)})`,backgroundSize:'cover',border: chosenAvatar === createAvatarDataUrl(displayName || email.split('@')[0] + i) ? '2px solid #6c5ce7' : '1px solid #e6e6ee'}"></div>
          </div>

          <div style="margin-top:12px">
            <label style="font-size:13px;color:#333;display:block">Of upload een foto</label>
            <input type="file" accept="image/*" @change="onUpload" />
            <div v-if="chosenAvatar" style="margin-top:8px">
              <img :src="chosenAvatar" style="width:72px;height:72px;border-radius:12px;object-fit:cover" />
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:18px">
          <button @click="step = 'form'" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff">Terug</button>
          <button @click="submitProfile" style="padding:8px 14px;border-radius:8px;border:none;background:#6c5ce7;color:#fff">Doorgaan</button>
        </div>
      </template>

      <template v-else-if="step === 'loading'">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 10px">
          <div style="width:72px;height:72px;border-radius:36px;background:#f0f0f8;display:flex;align-items:center;justify-content:center">⏳</div>
          <div style="font-size:16px;font-weight:700">Ruimte laden…</div>
          <div style="color:#666">Je ruimte wordt klaargemaakt. Dit is een demo.</div>
        </div>
      </template>
    </div>
  </div>
</template>
