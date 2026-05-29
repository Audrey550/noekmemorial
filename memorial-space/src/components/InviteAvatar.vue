<script setup>
import { ref, onMounted } from 'vue'
import avatar01 from '../assets/invite/avatars/avatar_01.jpg'
import avatar02 from '../assets/invite/avatars/avatar_02.jpg'
import avatar03 from '../assets/invite/avatars/avatar_03.jpg'
import avatar04 from '../assets/invite/avatars/avatar_04.jpg'
import avatar05 from '../assets/invite/avatars/avatar_05.jpg'
import avatar06 from '../assets/invite/avatars/avatar_06.jpg'
import avatar07 from '../assets/invite/avatars/avatar_07.jpg'
import avatar08 from '../assets/invite/avatars/avatar_08.jpg'
import avatar09 from '../assets/invite/avatars/avatar_09.jpg'

const emit = defineEmits(['next'])
const selected = ref(null)
const displayName = ref('')
const maxSize = 200 * 1024 // 200 KB recommended

const stock = [
  { src: avatar01, label: 'Avatar 1' },
  { src: avatar02, label: 'Avatar 2' },
  { src: avatar03, label: 'Avatar 3' },
  { src: avatar04, label: 'Avatar 4' },
  { src: avatar05, label: 'Avatar 5' },
  { src: avatar06, label: 'Avatar 6' },
  { src: avatar07, label: 'Avatar 7' },
  { src: avatar08, label: 'Avatar 8' },
  { src: avatar09, label: 'Avatar 9' },
]

const pick = (src) => { selected.value = src }

const onFile = async (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  if (f.size > maxSize) return alert('Bestand te groot, max 200KB')
  const reader = new FileReader()
  reader.onload = () => { selected.value = reader.result }
  reader.readAsDataURL(f)
}

const submit = () => {
  if (!selected.value) return alert('Kies een profielfoto of upload er een')
  // persist displayName locally for immediate UI reflection
  try {
    const raw = localStorage.getItem('audreyUser')
    const obj = raw ? JSON.parse(raw) : {}
    if (displayName.value) obj.displayName = displayName.value
    localStorage.setItem('audreyUser', JSON.stringify(obj))
  } catch (e) {}
  emit('next', selected.value)
}

onMounted(() => {
  try {
    const raw = localStorage.getItem('audreyUser')
    if (raw) {
      const u = JSON.parse(raw)
      if (u.displayName) displayName.value = u.displayName
      if (u.avatar) selected.value = u.avatar
    }
  } catch (e) {}
})
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
          <div class="title">Kies je profielfoto</div>

          <div class="profile-top">
            <div class="avatar-preview"> <img v-if="selected" :src="selected" alt="avatar" /> <span v-else>DA</span> </div>
            <div class="display-name-preview"><strong>{{ displayName || 'Gast' }}</strong></div>
          </div>

          <div class="form-row">
            <label class="field-label">Weergavenaam</label>
            <input v-model="displayName" placeholder="Weergavenaam" aria-label="Weergavenaam" />
          </div>

          <div class="invite-body">
            <div class="stock-column" role="list" aria-label="Vooraf ingestelde profielfoto's">
              <div class="stock-title">Kies een avatar</div>
              <div class="stock-grid">
                <div v-for="(c,i) in stock" :key="i" role="listitem">
                  <button type="button" @click="pick(c.src)" :class="['stock-item', selected === c.src ? 'selected' : '']" :aria-pressed="selected===c.src" :aria-label="c.label">
                    <img :src="c.src" :alt="c.label" />
                  </button>
                </div>
              </div>
            </div>

            <div class="upload-column">
              <label class="upload-panel" for="avatar-upload">
                <input id="avatar-upload" type="file" accept="image/*" @change="onFile" aria-label="Upload profielfoto" />
                <div class="upload-graphic">📱</div>
                <div class="upload-cta">Upload vanaf je apparaat</div>
              </label>
                   <div class="upload-note">Upload een foto van je smartphone of ander apparaat. Max. bestandsgrootte: 200KB.</div>
            </div>
          </div>


          <div class="actions"><button class="invite-btn" @click="submit">Volgende</button></div>
        </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:36px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.98);max-width:760px;padding:28px;border-radius:14px;box-shadow:0 18px 40px rgba(20,20,40,0.07);border:1px solid rgba(200,190,230,0.14)}
.title{margin-bottom:10px;color:#2e2e2e;font-size:20px;text-align:left}
.profile-top{display:flex;align-items:center;gap:16px;margin:6px 0 14px}
.avatar-preview{width:72px;height:72px;border-radius:999px;background:#f6c86a;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:22px;overflow:hidden}
.avatar-preview img{width:100%;height:100%;object-fit:cover;display:block}
.display-name-preview{font-size:18px;color:#333}
.form-row{display:flex;flex-direction:column;gap:8px;margin:8px 0 12px}
.form-row .field-label{font-size:13px;color:#555;text-align:left}
.form-row input{padding:12px;border-radius:10px;border:1px solid #ececec;width:100%}
.invite-body{display:flex;gap:20px;align-items:flex-start;justify-content:space-between;margin-top:10px}
.stock-column{flex:1}
.stock-title{font-size:13px;color:#444;margin-bottom:10px;text-align:left}
.stock-grid{display:grid;grid-template-columns:repeat(3,72px);grid-auto-rows:72px;gap:14px}
.stock-item{width:72px;height:72px;border-radius:12px;cursor:pointer;box-shadow:0 6px 12px rgba(0,0,0,0.04);border:2px solid rgba(0,0,0,0.02);overflow:hidden;background:#fff}
.stock-item img{width:100%;height:100%;object-fit:cover;display:block}
.stock-item:hover{box-shadow:0 12px 22px rgba(111,66,193,0.12);transform:translateY(-2px)}
.stock-item.selected{box-shadow:0 14px 26px rgba(111,66,193,0.22);outline:3px solid rgba(123,95,184,0.22);transform:translateY(-2px)}
.upload-column{width:260px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
.upload-panel{width:220px;height:140px;border-radius:12px;border:2px dashed #e6e0f6;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;background:#fff}
.upload-panel input{position:absolute;left:0;top:0;right:0;bottom:0;opacity:0;cursor:pointer}
.upload-graphic{font-size:28px;margin-bottom:8px}
.upload-cta{font-weight:600;color:#333}
.upload-note{font-size:13px;color:#666;margin-top:10px;text-align:center;max-width:260px}
.actions{display:flex;justify-content:flex-end;margin-top:18px}
.invite-btn{background:linear-gradient(180deg,#7b5fb8,#6f42c1);color:#fff;border:none;padding:10px 20px;border-radius:14px;font-weight:600;box-shadow:0 6px 18px rgba(111,66,193,0.12);cursor:pointer}
</style>
