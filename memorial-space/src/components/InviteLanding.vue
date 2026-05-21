<script setup>
const props = defineProps({ adminName: String, roomName: String })
const emit = defineEmits(['next'])
</script>

<template>
  <div class="invite-wrap">
    <div class="invite-card">
      <div class="icon"><span aria-hidden>✉️</span></div>
      <div class="text">{{ props.adminName }} heeft je uitgenodigd om lid te worden van <strong>{{ props.roomName }}</strong> ruimte</div>
      <div class="actions">
        <button class="invite-btn" @click="$emit('next')">Aanvaard de uitnodiging</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-wrap{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:40px;background:linear-gradient(90deg,#fbf8fe 0%, #fff6f3 100%)}
.invite-card{background:rgba(255,255,255,0.96);max-width:920px;padding:36px;border-radius:14px;box-shadow:0 14px 30px rgba(20,20,40,0.06);border:2px solid rgba(111,66,193,0.08);text-align:center}
.invite-card .icon{width:88px;height:88px;margin:0 auto;border-radius:16px;background:#f1e8fb;display:flex;align-items:center;justify-content:center;font-size:32px;color:#6f42c1}
.invite-card .text{color:#333;margin:18px 24px;font-size:16px}
.invite-btn{background:linear-gradient(180deg,#7b5fb8,#6f42c1);color:#fff;border:none;padding:12px 26px;border-radius:22px;font-weight:600;box-shadow:0 6px 18px rgba(111,66,193,0.12);cursor:pointer}
</style>
