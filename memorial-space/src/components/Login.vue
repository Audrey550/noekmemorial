<script setup>
import { ref } from 'vue'
const emit = defineEmits(['login'])

const email = ref('')
const role = ref('viewer')
const remember = ref(true)
const password = ref('')
const inviteCode = ref('')

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

const submit = () => {
  const safeEmail = email.value || 'guest@example.com'
  const localName = safeEmail.split('@')[0]
  const user = {
    email: safeEmail,
    role: role.value,
    displayName: localName,
    avatar: createAvatarDataUrl(localName),
  }

  if (remember.value) {
    try { localStorage.setItem('audreyUser', JSON.stringify(user)) } catch (e) {}
  }

  // For demo: basic validation per role
  if (role.value === 'admin') {
    if (!password.value) {
      alert('Enter a password for admin (demo)')
      return
    }
  }

  if (role.value === 'editor') {
    if (!inviteCode.value) {
      alert('Enter an invite code for invited/editor user (demo)')
      return
    }
  }

  emit('login', user)
}
</script>

<template>
  <div class="login-screen" style="display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(180deg,#f5f3fb,#fff)">
    <div style="width:360px;padding:22px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(13,12,34,0.08)">
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

      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button @click="submit" style="padding:8px 14px;border-radius:8px;border:none;background:#6c5ce7;color:#fff">Continue</button>
      </div>
    </div>
  </div>
</template>
