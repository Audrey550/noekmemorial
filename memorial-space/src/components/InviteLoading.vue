<script setup>
import { onMounted } from 'vue'
const props = defineProps({ roomName: String })
const emit = defineEmits(['finished'])

onMounted(() => {
  setTimeout(() => emit('finished'), 900)
})
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
      <div class="icon">🕯️</div>
      <div class="text">Even geduld... de ruimte van <strong>{{ props.roomName }}</strong> is bijna klaar</div>
      <div class="spinner-wrap"><div class="spinner" aria-hidden></div></div>
    </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:36px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.96);max-width:720px;padding:28px;border-radius:14px;box-shadow:0 14px 30px rgba(20,20,40,0.06);border:2px solid rgba(111,66,193,0.06);text-align:center}
.invite-card .icon{width:72px;height:72px;margin:0 auto;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;color:#f39c12}
.invite-card .text{margin-top:12px;color:#333}
.spinner-wrap{margin-top:18px}
.spinner{width:36px;height:36px;border-radius:50%;border:5px solid #f0eef6;border-top-color:#6f42c1;margin:10px auto;animation:spin 0.9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
