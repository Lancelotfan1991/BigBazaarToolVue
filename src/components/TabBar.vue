<template>
  <div
    v-show="visible"
    class="tabs"
  >
    <div
      class="tab"
      :class="{ active: filterStore.currentTab === 'items' }"
      @click="filterStore.setTab('items')"
    >
      物品 <span class="count">{{ itemCount }}</span>
    </div>
    <div
      class="tab"
      :class="{ active: filterStore.currentTab === 'skills' }"
      @click="filterStore.setTab('skills')"
    >
      技能 <span class="count">{{ skillCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { useFilterStore } from '@/stores/filterStore'
defineProps({ visible: { type: Boolean, default: true }, itemCount: { type: Number, default: 0 }, skillCount: { type: Number, default: 0 } })
const filterStore = useFilterStore()
</script>
