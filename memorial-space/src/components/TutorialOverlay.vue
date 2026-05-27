<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({ steps: { type: Array, default: () => [] }, firstRun: { type: Boolean, default: false } })
const emit = defineEmits(['finish', 'step-change', 'control-action'])

const visible = ref(false)
const showingSpotlight = ref(false)
const current = ref(0)
const targetRect = ref({ x: 0, y: 0, r: 150 })
const panelStyle = ref({ left: '36px', top: '80px', width: '340px' })
const panelKey = ref(0)
const panelScrollRef = ref(null)
const panelControlsRef = ref(null)

const resolveStepTargetRect = (step) => {
  if (!step) return null

  const selectors = Array.isArray(step.selectors) ? step.selectors : (step.selector ? [step.selector] : [])
  if (!selectors.length) return null

  const rects = selectors
    .map(selector => document.querySelector(selector))
    .filter(Boolean)
    .map(el => el.getBoundingClientRect())

  if (!rects.length) return null

  const left = Math.min(...rects.map(rect => rect.left))
  const top = Math.min(...rects.map(rect => rect.top))
  const right = Math.max(...rects.map(rect => rect.right))
  const bottom = Math.max(...rects.map(rect => rect.bottom))

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  }
}

const updatePanelPosition = () => {
  if (typeof window === 'undefined') return

  const panelWidth = 340
  const margin = 24
  const topEdgeMargin = 10
  const panelPadding = 36
  const measuredScrollHeight = panelScrollRef.value?.scrollHeight || 0
  const measuredControlsHeight = panelControlsRef.value?.offsetHeight || 0
  const measuredPanelHeight = measuredScrollHeight + measuredControlsHeight + panelPadding
  const panelMinHeight = Number(props.steps[current.value]?.panelMinHeight || (props.steps[current.value]?.compactPanel ? 220 : 260))
  const maxPanelHeight = Math.max(220, window.innerHeight - 32)
  const navbarHeight = 70
  const navbarGap = 12
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const target = targetRect.value
  const step = props.steps[current.value]

  if (step && step.panelPlacement === 'center') {
    const width = Math.min(420, viewportWidth - 32)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))
    panelStyle.value = {
      left: `${Math.max(16, Math.round((viewportWidth - width) / 2) + Number(step.panelOffsetX || 0))}px`,
      top: `${Math.max(16, Math.round((viewportHeight - height) / 2) + Number(step.panelOffsetY || 0))}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.panelPlacement === 'top-left') {
    const inset = 16
    const width = Math.min(420, viewportWidth - inset * 2)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))

    panelStyle.value = {
      left: `${inset + Number(step.panelOffsetX || 0)}px`,
      top: `${inset + Number(step.panelOffsetY || 0)}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.panelPlacement === 'top-right') {
    const inset = 16
    const width = Math.min(420, viewportWidth - inset * 2)
    const naturalHeight = Math.max(220, measuredPanelHeight || 0)
    const maxCompactHeight = Math.min(step.compactPanelMaxHeight || 460, viewportHeight - inset * 2)
    const height = step.compactPanel
      ? Math.min(maxCompactHeight, naturalHeight)
      : Math.min(maxPanelHeight, Math.max(panelMinHeight, naturalHeight))

    panelStyle.value = {
      left: `${Math.max(inset, viewportWidth - width - inset) + Number(step.panelOffsetX || 0)}px`,
      top: `${inset + Number(step.panelOffsetY || 0)}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.panelPlacement === 'right-of-target') {
    const width = Math.min(420, viewportWidth - 32)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))
    const unclampedLeft = target.x + target.r + margin
    const unclampedTop = target.y - (height / 2)
    const left = Math.max(16, Math.min(viewportWidth - width - 16, unclampedLeft + Number(step.panelOffsetX || 0)))
    const top = Math.max(16, Math.min(viewportHeight - height - 16, unclampedTop + Number(step.panelOffsetY || 0)))

    panelStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.panelPlacement === 'top-of-target') {
    const width = Math.min(420, viewportWidth - 32)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))
    const unclampedLeft = target.x - (width / 2)
    const unclampedTop = target.y - target.r - margin - height
    const left = Math.max(16, Math.min(viewportWidth - width - 16, unclampedLeft + Number(step.panelOffsetX || 0)))
    const top = Math.max(16, Math.min(viewportHeight - height - 16, unclampedTop + Number(step.panelOffsetY || 0)))

    panelStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.panelPlacement === 'left-of-target') {
    const width = Math.min(420, viewportWidth - 32)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))
    const unclampedLeft = target.x - target.r - margin - width
    const unclampedTop = target.y - (height / 2)
    const left = Math.max(16, Math.min(viewportWidth - width - 16, unclampedLeft + Number(step.panelOffsetX || 0)))
    const top = Math.max(16, Math.min(viewportHeight - height - 16, unclampedTop + Number(step.panelOffsetY || 0)))

    panelStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  if (step && step.bullets) {
    const inset = 16
    const width = Math.min(420, viewportWidth - inset * 2)
    const height = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 0))
    panelStyle.value = {
      left: `${inset + Number(step.panelOffsetX || 0)}px`,
      top: `${inset + Number(step.panelOffsetY || 0)}px`,
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: `${height}px`,
    }

    return
  }

  const panelHeight = Math.min(maxPanelHeight, Math.max(panelMinHeight, measuredPanelHeight || 280))
  const hasSpaceRight = target.x + target.r + margin + panelWidth <= viewportWidth
  const hasSpaceLeft = target.x - target.r - margin - panelWidth >= 0
  const hasSpaceTop = target.y - target.r - margin - panelHeight >= 0

  let left = target.x + target.r + margin
  let top = target.y - target.r - margin - panelHeight - 36

  if (!hasSpaceRight && hasSpaceLeft) {
    left = target.x - target.r - margin - panelWidth
  }

  if (!hasSpaceRight && !hasSpaceLeft) {
    left = Math.max(margin, Math.min(viewportWidth - panelWidth - margin, target.x - panelWidth / 2))
  }

  if (!hasSpaceTop) {
    top = Math.max(topEdgeMargin, target.y - panelHeight / 2 - 92)
  }

  if (top + panelHeight > viewportHeight - topEdgeMargin) {
    top = Math.max(topEdgeMargin, viewportHeight - panelHeight - topEdgeMargin)
  }

  left = Math.max(margin, Math.min(viewportWidth - panelWidth - margin, left))
  top = Math.max(topEdgeMargin, Math.min(viewportHeight - panelHeight - topEdgeMargin, top))

  panelStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${panelWidth}px`,
    height: `${panelHeight}px`,
    maxHeight: `${panelHeight}px`,
  }
}

const start = async () => {
  visible.value = true
  await nextTick()
  showStep(0)
}

defineExpose({ start })

const skip = () => {
  try {
    emit('control-action', {
      action: 'skip',
      index: current.value,
      step: props.steps[current.value],
    })
  } catch (e) {}
  finish()
}

const finish = () => {
  visible.value = false
  showingSpotlight.value = false
  try { emit('finish') } catch (e) {}
}

const showStep = (index) => {
  const step = props.steps[index]
  current.value = index
  panelKey.value += 1

  try { emit('step-change', { index, step }) } catch (e) {}

  const applyStepPosition = () => {
    if (step && step.showSpotlight === false) {
      showingSpotlight.value = false
      nextTick(updatePanelPosition)
      return
    }

    const resolvedRect = resolveStepTargetRect(step)
    if (!resolvedRect) {
      const c = document.querySelector('.scene-canvas')
      const rect = c ? c.getBoundingClientRect() : { left: window.innerWidth/2 - 150, top: window.innerHeight/2 - 150, width: 300, height: 300 }
      const fallbackRadius = Math.max(140, Math.min(360, rect.width, rect.height))
      const fallbackOffset = (step && step.spotlightOffset) ? step.spotlightOffset : { x: 0, y: 0 }
      const fx = Number(fallbackOffset.x || 0)
      const fy = Number(fallbackOffset.y || 0)
      targetRect.value = { x: rect.left + rect.width / 2 + fx, y: rect.top + rect.height / 2 + fy, r: fallbackRadius }
      showingSpotlight.value = true
      nextTick(updatePanelPosition)
      return
    }

    const spotlightScale = Number(step.spotlightScale || 0.9)
    const radius = Math.max(120, Math.min(420, Math.max(resolvedRect.width, resolvedRect.height) * spotlightScale))
    const offset = (step && step.spotlightOffset) ? step.spotlightOffset : { x: 0, y: 0 }
    const ox = Number(offset.x || 0)
    const oy = Number(offset.y || 0)
    targetRect.value = {
      x: resolvedRect.left + resolvedRect.width / 2 + ox,
      y: resolvedRect.top + resolvedRect.height / 2 + oy,
      r: radius,
    }
    showingSpotlight.value = true
    nextTick(updatePanelPosition)
  }

  nextTick(applyStepPosition)
}

const next = () => {
  try {
    emit('control-action', {
      action: 'next',
      index: current.value,
      step: props.steps[current.value],
    })
  } catch (e) {}

  if (current.value < props.steps.length - 1) {
    showStep(current.value + 1)
  } else {
    finish()
  }
}

const prev = () => {
  try {
    emit('control-action', {
      action: 'prev',
      index: current.value,
      step: props.steps[current.value],
    })
  } catch (e) {}

  if (current.value > 0) showStep(current.value - 1)
}

onMounted(() => {
  // component shown by parent via v-if and start()
})
</script>

<template>
  <div v-if="visible" class="tutorial-overlay-root">
    <div
      class="tutorial-backdrop"
      :style="showingSpotlight ? { '--tx': targetRect.x + 'px', '--ty': targetRect.y + 'px', '--tr': targetRect.r + 'px' } : { background: 'rgba(0,0,0,0.6)' }"
    ></div>

    <div v-if="showingSpotlight" class="tutorial-spotlight" :style="{ left: (targetRect.x - targetRect.r) + 'px', top: (targetRect.y - targetRect.r) + 'px', width: (targetRect.r * 2) + 'px', height: (targetRect.r * 2) + 'px' }">
      <div class="spot-inner"></div>
    </div>

    

    <div :key="panelKey" class="tutorial-panel" :style="panelStyle">
      <div ref="panelScrollRef" class="tutorial-panel-scroll">
        <h3 v-if="props.steps && props.steps[current]">{{ props.steps[current].title || `Stap ${current+1}` }}</h3>
        <div v-if="props.steps && props.steps[current]">
          <p v-if="props.steps[current].text">{{ props.steps[current].text }}</p>
          <p v-if="props.steps[current].subtext" class="tutorial-subtext">{{ props.steps[current].subtext }}</p>
          <div v-if="props.steps[current].bullets" class="tutorial-bullets">
            <div v-for="group in props.steps[current].bullets" :key="group.title" class="tutorial-bullet-group">
              <div class="tutorial-bullet-title">{{ group.title }}</div>
              <ul>
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div ref="panelControlsRef" class="tutorial-controls">
        <button v-if="current > 0" @click="prev">Vorige</button>
        <button @click="next">{{ current < props.steps.length - 1 ? 'Volgende' : 'Klaar' }}</button>
        <button class="skip" @click="skip">Overslaan</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-overlay-root { position: fixed; inset: 0; z-index: 100000; pointer-events: none; }
.tutorial-backdrop {
  position: absolute; inset: 0; pointer-events: auto;
  background: rgba(0,0,0,0.5);
  background-image: radial-gradient(circle at var(--tx,50%) var(--ty,50%), rgba(0,0,0,0) 0px, rgba(0,0,0,0) calc(var(--tr,150px) - 1px), rgba(0,0,0,0.5) calc(var(--tr,150px)));
}
.tutorial-spotlight { position: absolute; border-radius: 50%; overflow: visible; pointer-events: none; display:flex; align-items:center; justify-content:center }
.tutorial-spotlight .spot-inner { width: 100%; height: 100%; border-radius: 50%; background: transparent; pointer-events:none }


.tutorial-panel { position: fixed; display:flex; flex-direction:column; background: linear-gradient(180deg,#fff,#f3eef6); border-radius: 12px; padding:18px; box-shadow: 0 18px 40px rgba(0,0,0,0.25); pointer-events: auto; z-index: 100001; box-sizing: border-box; overflow: hidden; max-height: calc(100vh - 24px) }
.tutorial-panel { animation: tutorialPanelFadeIn 220ms ease-out; }
.tutorial-panel-scroll { overflow-y: auto; flex: 1 1 auto; min-height: 0; padding-right: 4px }
.tutorial-panel-scroll::-webkit-scrollbar { width: 10px; }
.tutorial-panel-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.22); border-radius: 999px; }
.tutorial-panel-scroll::-webkit-scrollbar-track { background: transparent; }
.tutorial-panel h3 { margin:0 0 8px 0; font-size:18px }
.tutorial-panel p { margin:0 0 12px 0; color:#333 }
.tutorial-subtext { margin-top: -2px; color:#4b4b4b }
.tutorial-bullets { margin: 0 0 12px 0; color:#333 }
.tutorial-bullet-group + .tutorial-bullet-group { margin-top: 10px }
.tutorial-bullet-title { font-weight: 700; margin-bottom: 4px }
.tutorial-bullets ul { margin: 0; padding-left: 18px }
.tutorial-bullets li { margin-bottom: 4px }
.tutorial-controls { display:flex; gap:8px; justify-content:flex-end; margin-top: 12px; flex: 0 0 auto }
.tutorial-controls button { pointer-events: auto; padding:8px 12px; border-radius:8px; border:none; background:#6c5ce7; color:#fff }
.tutorial-controls .skip { background:transparent; color:#6c5ce7; border:1px solid rgba(108,92,231,0.14) }

@media (max-width: 640px) {
  .tutorial-controls { flex-wrap: wrap; }
}

@keyframes tutorialPanelFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
