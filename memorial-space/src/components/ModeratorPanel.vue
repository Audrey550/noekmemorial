<script setup>
import { computed } from 'vue'
const props = defineProps({
  objects: { type: Array, default: () => [] },
})
const emit = defineEmits(['hide','restore','close'])

const moderationTypes = ['photo','audio','video','message','candle']

const entries = computed(() => {
  return (props.objects || []).filter(o => moderationTypes.includes(o.assetId))
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
  </aside>
</template>

<style scoped>
.moderator-panel{position:fixed;right:16px;top:86px;width:320px;height:72vh;background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.12);padding:12px;z-index:20050;overflow:auto}
.moderator-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.moderator-list{display:flex;flex-direction:column;gap:8px}
.moderator-item{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:#fbfbfb;border:1px solid rgba(0,0,0,0.04)}
.moderator-item .meta .title{font-weight:600;font-size:13px}
.moderator-item .meta .sub{font-size:12px;color:#666}
.moderator-item .actions button{background:#f3f3f5;border:1px solid #e0e0e0;padding:6px 8px;border-radius:6px;cursor:pointer}
.empty{color:#666;padding:20px;text-align:center}
.close{background:transparent;border:0;font-size:18px;cursor:pointer}
</style>
