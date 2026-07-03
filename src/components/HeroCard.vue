<template>
  <div
    class="hero-card"
    @click="$emit('click', hero.name_en)"
  >
    <img
      v-if="hasAvatar"
      class="hero-avatar"
      :src="avatarSrc"
      :alt="hero.name_en"
      @error="avatarError"
    >
    <div
      v-else
      class="hero-avatar-placeholder"
    >
      {{ hero.name_en === 'All' ? '📚' : '🌐' }}
    </div>
    <div class="name-zh">
      {{ displayName }}
    </div>
    <div class="name-en">
      {{ hero.name_en }}
    </div>
    <div
      class="data-info"
      :class="{ 'no-data': !hero.has_data }"
    >
      {{ hero.has_data ? '✓ ' + (hero.data_time || '已就绪') : '⚠ 无数据' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { HERO_DISPLAY } from '@/stores/dataStore'

const props = defineProps({ hero: { type: Object, default: () => ({}) } })
defineEmits(['click'])
const hasAvatar = computed(() => !['All', 'Common'].includes(props.hero.name_en))
const avatarSrc = computed(() => `/avatars/${props.hero.name_en}.webp`)
const displayName = computed(() => HERO_DISPLAY[props.hero.name_en] || props.hero.name_zh)
function avatarError(e) { e.target.outerHTML = '<div class="hero-avatar-placeholder">👤</div>' }
</script>
