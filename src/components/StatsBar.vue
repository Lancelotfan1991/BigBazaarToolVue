<template>
  <div
    class="stats"
    v-html="statsHtml"
  />
</template>

<script setup>
import { computed } from 'vue'
import { TIER_ZH, SIZE_ZH } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'

const props = defineProps({ cards: { type: Array, default: () => [] }, total: { type: Number, default: 0 } })
const filterStore = useFilterStore()

const statsHtml = computed(() => {
  const tierS = {}, sizeS = {}
  props.cards.forEach(c => {
    const t = c['基础品质'] || ''; if (t) tierS[t] = (tierS[t] || 0) + 1
    const s = c['大小'] || ''; if (s) sizeS[s] = (sizeS[s] || 0) + 1
  })
  const label = filterStore.currentTab === 'items' ? '物品' : '技能'
  const tStr = Object.entries(tierS).map(([k, v]) => `${TIER_ZH[k] || k}:${v}`).join('  ')
  const sStr = Object.entries(sizeS).map(([k, v]) => `${SIZE_ZH[k] || k}:${v}`).join('  ')
  return `显示 ${props.cards.length}/${props.total} 个${label}${tStr ? ' · ' + tStr : ''}${sStr ? ' · ' + sStr : ''}`
})
</script>
