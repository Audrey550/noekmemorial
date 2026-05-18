<script setup>
import { ref } from 'vue'
import { logEvent } from '../lib/analytics'
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

const proceedFromForm = () => {
  // basic validation
  if (!email.value) email.value = 'guest@example.com'

  if (role.value === 'admin' && !password.value) {
    alert('Enter a password for admin (demo)')
    return
  }

  if (role.value === 'editor') {
    if (!inviteCode.value) {
      alert('Enter an invite code for invited/editor user (demo)')
      return
    }
    try { logEvent('invite.validated', { role: 'editor' }) } catch (e) {}
    // go to profile selection for invited users
    displayName.value = email.value.split('@')[0]
    chosenAvatar.value = createAvatarDataUrl(displayName.value)
    step.value = 'profile'
    return
  }

  // Non-invited: quick loading then emit
  startLoadingAndEmit()
}

const startLoadingAndEmit = () => {
  step.value = 'loading'
  const user = buildUserObject()
  if (remember.value) {
    try { localStorage.setItem('audreyUser', JSON.stringify(user)) } catch (e) {}
  }
  try { logEvent('login.success', { role: role.value, method: 'mock', invited: role.value === 'editor' }) } catch (e) {}
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
  startLoadingAndEmit()
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
        <h2 style="margin:0 0 12px 0">Sign in — Mock</h2>
        <label style="font-size:13px;color:#333">Email</label>
        <input v-model="email" placeholder="you@example.com" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />

        <label style="font-size:13px;color:#333;margin-top:8px;display:block">Role</label>
        <select v-model="role" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px">
          <option value="admin">Admin (room owner)</option>
          <option value="editor">Co-editor (invited)</option>
          <option value="viewer">Viewer (public link)</option>
        </select>

        <div v-if="role === 'admin'" style="margin-top:8px">
          <label style="font-size:13px;color:#333">Password (demo)</label>
          <input type="password" v-model="password" placeholder="password" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />
        </div>

        <div v-if="role === 'editor'" style="margin-top:8px">
          <label style="font-size:13px;color:#333">Invite code (demo)</label>
          <input v-model="inviteCode" placeholder="ABCD-1234" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin:8px 0">
          <input type="checkbox" v-model="remember" id="remember" />
          <label for="remember" style="font-size:13px">Remember me</label>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <div></div>
          <div>
            <button @click="proceedFromForm" style="padding:8px 14px;border-radius:8px;border:none;background:#6c5ce7;color:#fff">Continue</button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 'profile'">
        <h2 style="margin:0 0 12px 0">Set up your profile</h2>
        <label style="font-size:13px;color:#333">Display name</label>
        <input v-model="displayName" placeholder="Display name" style="width:100%;padding:8px;margin:6px 0;border:1px solid #e6e6ee;border-radius:6px" />

        <div style="margin-top:10px">
          <label style="font-size:13px;color:#333;display:block;margin-bottom:8px">Choose an avatar</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div v-for="i in 6" :key="i" @click="pickAvatar(createAvatarDataUrl(displayName || email.split('@')[0] + i))" :style="{width:'64px',height:'64px',borderRadius:'8px',cursor:'pointer',backgroundImage:`url(${createAvatarDataUrl(displayName || email.split('@')[0] + i)})`,backgroundSize:'cover',border: chosenAvatar === createAvatarDataUrl(displayName || email.split('@')[0] + i) ? '2px solid #6c5ce7' : '1px solid #e6e6ee'}"></div>
          </div>

          <div style="margin-top:12px">
            <label style="font-size:13px;color:#333;display:block">Or upload a photo</label>
            <input type="file" accept="image/*" @change="onUpload" />
            <div v-if="chosenAvatar" style="margin-top:8px">
              <img :src="chosenAvatar" style="width:72px;height:72px;border-radius:12px;object-fit:cover" />
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:18px">
          <button @click="step = 'form'" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff">Back</button>
          <button @click="submitProfile" style="padding:8px 14px;border-radius:8px;border:none;background:#6c5ce7;color:#fff">Continue</button>
        </div>
      </template>

      <template v-else-if="step === 'loading'">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 10px">
          <div style="width:72px;height:72px;border-radius:36px;background:#f0f0f8;display:flex;align-items:center;justify-content:center">⏳</div>
          <div style="font-size:16px;font-weight:700">Loading room…</div>
          <div style="color:#666">Preparing your space. This is a demo.</div>
        </div>
      </template>
    </div>
  </div>
</template>
