<script setup>
import { computed } from 'vue'
const props = defineProps({
  objects: { type: Array, default: () => [] },
  notifications: { type: Array, default: () => [] },
})
const emit = defineEmits(['hide','restore','close'])

const moderationTypes = ['photo','audio','video','message','candle']

const entries = computed(() => {
  return (props.objects || []).filter(o => moderationTypes.includes(o.assetId))
})

const notifications = computed(() => {
  return (props.notifications || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const hide = (id) => emit('hide', id)
const restore = (id) => emit('restore', id)
</script>

<template>
  <aside class="moderator-panel">
    <div class="moderator-header">
      <h3>Moderator</h3>
      <button class="close" @click="$emit('close')">✕</button>
    </div>
    <div class="moderator-section">
      <div class="moderator-section-title">Nieuwe meldingen</div>
      <div class="moderator-list">
        <div v-if="notifications.length === 0" class="empty">Geen nieuwe meldingen</div>
        <div v-for="item in notifications" :key="item.id" class="moderator-item moderator-item--notification">
          <div class="meta">
            <div class="title">{{ item.title }}</div>
            <div class="sub">{{ item.actor }} • {{ new Date(item.timestamp).toLocaleString() }}</div>
            <div v-if="item.subtitle" class="sub">{{ item.subtitle }}</div>
          </div>
          <div class="actions">
            <span v-if="!item.read" class="new-pill">Nieuw</span>
          </div>
        </div>
      </div>
    </div>
    <div class="moderator-section">
      <div class="moderator-section-title">Bijdragen</div>
      <div class="moderator-list">
        <div v-if="entries.length === 0" class="empty">Geen bijdragen gevonden</div>
        <div v-for="item in entries" :key="item.id" class="moderator-item">
          <div class="meta">
            <div class="title">{{ item.photoData?.title || item.videoData?.title || item.audioData?.title || (item.messageData?.message ? item.messageData.message.slice(0,60) : '') || item.candleData?.name || item.assetId }}</div>
            <div class="sub">Type: {{ item.assetId }} • id {{ item.id }}</div>
          </div>
          <div class="actions">
            <button v-if="!item.hidden" @click="hide(item.id)">Verberg</button>
            <button v-else @click="restore(item.id)">Herstel</button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.moderator-panel{position:fixed;right:16px;top:86px;width:320px;height:72vh;background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.12);padding:12px;z-index:20050;overflow:auto}
.moderator-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.moderator-section{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.moderator-section-title{font-size:12px;font-weight:700;color:#6a4e2f;text-transform:uppercase;letter-spacing:.04em}
.moderator-list{display:flex;flex-direction:column;gap:8px}
.moderator-item{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:#fbfbfb;border:1px solid rgba(0,0,0,0.04)}
.moderator-item--notification{background:#fff8ef;border-color:rgba(184,128,66,0.18)}
.moderator-item .meta .title{font-weight:600;font-size:13px}
.moderator-item .meta .sub{font-size:12px;color:#666}
.moderator-item .actions button{background:#f3f3f5;border:1px solid #e0e0e0;padding:6px 8px;border-radius:6px;cursor:pointer}
.new-pill{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#6c5ce7;color:#fff;font-size:11px;font-weight:700}
.empty{color:#666;padding:20px;text-align:center}
.close{background:transparent;border:0;font-size:18px;cursor:pointer}
</style>
