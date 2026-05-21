<script setup>
import { computed, onMounted } from 'vue'
const props = defineProps({ roomName: String })
const emit = defineEmits(['finished'])

const displayRoomName = computed(() => props.roomName || 'Lisa Pepper')

onMounted(() => {
  setTimeout(() => emit('finished'), 1800)
})
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
      <div class="icon">🕯️</div>
      <div class="text">Even geduld... de ruimte van <strong>{{ displayRoomName }}</strong> is bijna klaar</div>
      <div class="spinner-wrap" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:36px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.96);max-width:720px;padding:28px;border-radius:14px;box-shadow:0 14px 30px rgba(20,20,40,0.06);border:2px solid rgba(111,66,193,0.06);text-align:center}
.invite-card .icon{width:72px;height:72px;margin:0 auto;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;color:#f39c12}
.invite-card .text{margin-top:12px;color:#333}
.spinner-wrap{margin-top:18px;display:flex;justify-content:center;gap:8px;align-items:center;min-height:20px}
.dot{width:9px;height:9px;border-radius:999px;background:#6f42c1;opacity:0.35;animation:dotPulse 1s ease-in-out infinite}
.dot:nth-child(2){animation-delay:0.15s}
.dot:nth-child(3){animation-delay:0.3s}
@keyframes dotPulse{
  0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
  40% { transform: translateY(-4px); opacity: 1; }
}
</style>
