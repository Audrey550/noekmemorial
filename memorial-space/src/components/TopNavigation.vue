<script setup>
import { ref } from 'vue'
import noekLogoTextUrl from '../assets/Noek_LogoText.svg'

const navItems = [
  { label: 'Home', href: '#' },
  { label: 'Over ons', href: '#' },
  { label: 'Mogelijkheden', href: '#' },
  { label: 'F.A.Q', href: '#' },
  { label: 'Contact', href: '#' }
]

const activeItem = ref('Home')
</script>

<template>
  <nav class="top-navigation">
    <div class="nav-container">
      <!-- Logo Section -->
      <div class="nav-logo">
        <img class="logo-mark" :src="noekLogoTextUrl" alt="Noek" />
      </div>

      <!-- Menu Items -->
      <ul class="nav-menu">
        <li v-for="item in navItems" :key="item.label">
          <a
            :href="item.href"
            class="nav-link"
            :class="{ active: activeItem === item.label }"
            @click.prevent="activeItem = item.label"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>

      <!-- CTA Button -->
      <button class="nav-cta-button">Toon mijn interesse</button>
    </div>
  </nav>
</template>

<style scoped>
.top-navigation {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Logo Section */
.nav-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-mark {
  display: block;
  height: 34px;
  width: auto;
}

/* Menu Items */
.nav-menu {
  list-style: none;
  display: flex;
  gap: 2.5rem;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: center;
}

.nav-link {
  text-decoration: none;
  color: #5a4a6b;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Ambella', sans-serif;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.nav-link:hover {
  color: #2d1b4e;
  border-bottom-color: #e8a2d4;
}

.nav-link.active {
  color: #2d1b4e;
  border-bottom-color: #8b5a9f;
}

/* CTA Button */
.nav-cta-button {
  flex-shrink: 0;
  background: linear-gradient(135deg, #8b5a9f 0%, #6b4782 100%);
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Ambella', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 90, 159, 0.25);
}

.nav-cta-button:hover {
  background: linear-gradient(135deg, #6b4782 0%, #5a3a70 100%);
  box-shadow: 0 6px 16px rgba(139, 90, 159, 0.35);
  transform: translateY(-2px);
}

.nav-cta-button:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    gap: 1rem;
  }

  .nav-menu {
    gap: 1.5rem;
    font-size: 0.9rem;
  }

  .nav-cta-button {
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 640px) {
  .nav-menu {
    display: none;
  }

  .nav-cta-button {
    display: none;
  }

  .nav-container {
    justify-content: flex-start;
  }
}
</style>
