<script setup>
import { ref } from 'vue'

const brand = ref('Noek')
</script>

<template>
  <header class="navbar">
    <div class="navbar-brand">
      {{ brand }}
    </div>
  </header>
  <div class="app-shell">
    <slot />
  </div>
</template>

<style scoped>
.navbar {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  flex-shrink: 0;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d1b4e;
  font-family: 'Alpino', sans-serif;
}

.app-shell {
  flex: 1;
  overflow: hidden;
}
</style>
