<script setup>
import { ref, computed } from 'vue'
const emit = defineEmits(['next'])
const displayName = ref('')

const submit = () => {
  if (!displayName.value) return alert('Vul een weergavenaam in')
  // split into first/last for compatibility with existing handler
  const parts = displayName.value.trim().split(' ')
  const firstName = parts.shift() || ''
  const lastName = parts.join(' ') || ''
  emit('next', { firstName, lastName })
}
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
      <div class="profile-top">
        <div class="avatar-preview">DA</div>
        <div class="display-preview"><strong>{{ displayName || 'Gast' }}</strong></div>
      </div>
      <div class="title">Stel je profiel in</div>
      <div class="form-row">
        <label class="field-label">Weergavenaam</label>
        <input v-model="displayName" placeholder="Weergavenaam" aria-label="Weergavenaam" />
      </div>
      <div class="actions"><button class="invite-btn" @click="submit">Volgende</button></div>
    </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:36px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.98);max-width:720px;padding:28px;border-radius:14px;box-shadow:0 18px 40px rgba(20,20,40,0.07);border:1px solid rgba(200,190,230,0.14)}
.profile-top{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.avatar-preview{width:72px;height:72px;border-radius:999px;background:#f6c86a;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:22px;overflow:hidden}
.display-preview{font-size:20px;color:#333}
.title{color:#333;margin:6px 0 12px;font-size:20px;text-align:left}
.form-row{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.form-row .field-label{font-size:13px;color:#555;text-align:left}
.form-row input{padding:12px;border-radius:10px;border:1px solid #ececec;width:100%}
.invite-btn{background:linear-gradient(180deg,#7b5fb8,#6f42c1);color:#fff;border:none;padding:10px 20px;border-radius:14px;font-weight:600;box-shadow:0 6px 18px rgba(111,66,193,0.12);cursor:pointer;float:right}
</style>

