<script setup>
import { ref } from 'vue'
const emit = defineEmits(['next'])
const firstName = ref('')
const lastName = ref('')

const submit = () => {
  if (!firstName.value || !lastName.value) return alert('Vul voornaam en naam in')
  emit('next', { firstName: firstName.value.trim(), lastName: lastName.value.trim() })
}
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
      <div class="small-icon"></div>
      <div class="title">Vul je naam in zodat we weten wie je bent</div>
      <div class="form-row">
        <input v-model="firstName" placeholder="Voornaam" aria-label="Voornaam" />
        <input v-model="lastName" placeholder="Naam" aria-label="Naam" />
      </div>
      <div class="actions"><button class="invite-btn" @click="submit">Volgende</button></div>
    </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:36px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.96);max-width:720px;padding:28px;border-radius:14px;box-shadow:0 14px 30px rgba(20,20,40,0.06);border:2px solid rgba(111,66,193,0.06);text-align:center}
.small-icon{width:56px;height:56px;margin:0 auto;border-radius:999px;background:#f1e8fb}
.title{color:#333;margin:16px 8px;font-size:15px}
.form-row{display:flex;gap:12px;justify-content:center;margin-top:12px}
.form-row input{padding:12px;border-radius:10px;border:1px solid #ececec;min-width:220px}
.invite-btn{background:linear-gradient(180deg,#7b5fb8,#6f42c1);color:#fff;border:none;padding:12px 26px;border-radius:22px;font-weight:600;box-shadow:0 6px 18px rgba(111,66,193,0.12);cursor:pointer;margin-top:16px}
</style>
