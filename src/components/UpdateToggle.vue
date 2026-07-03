<template>
  <button
    class="filter-btn updated-toggle"
    :class="{ active: filterStore.showUpdatedOnly }"
    @click="toggle"
  >
    {{ filterStore.showUpdatedOnly ? '✅ 仅查看更新物品' : '🆕 仅查看更新物品' }}
  </button>
</template>

<script setup>
import { useFilterStore } from '@/stores/filterStore'
const filterStore = useFilterStore()
const emit = defineEmits(['toggle'])
function toggle() { emit('toggle') }
</script>
