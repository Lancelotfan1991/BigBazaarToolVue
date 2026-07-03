<template>
  <div class="content-area active">
    <div class="back-bar">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <span class="data-source">{{ dataStore.currentData?.['获取时间'] || '' }}</span>
    </div>
    <FilterBar
      :tags="[]"
      :show-tags="false"
      :show-update-toggle="['events', 'monsters'].includes(gameType)"
      :show-hero-filter="showHeroFilter"
      :hero-list="heroFilterList"
      :show-day-sort="showDaySort"
      :hide-size-filter="hideSizeFilter"
      :hide-scope-filter="hideScopeFilter"
      @toggle-updated="toggleUpdated"
    />
    <StatsBar
      :cards="filteredCards"
      :total="totalCards"
    />
    <div v-if="isUpdating" class="updating-overlay">
      <div class="spinner" />
      <p>正在加载对比数据...</p>
    </div>
    <CardGrid
      :filtered-cards="filteredCards"
      :render-limit="filterStore.renderLimit"
      :is-game-data="true"
      :get-badge="getBadge"
      :get-diff-details="getDiffDetails"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'
import { useCardFilter } from '@/composables/useCardFilter'
import { useDiffCompare } from '@/composables/useDiffCompare'
import FilterBar from '@/components/FilterBar.vue'
import StatsBar from '@/components/StatsBar.vue'
import CardGrid from '@/components/CardGrid.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const filterStore = useFilterStore()
const { matchFilters, sortCards } = useCardFilter()
const { loadPrevEvents, isEventUpdated, getEventUpdateStatus, getEventDiffDetails, loadPrevMonsters, isMonsterUpdated, getMonsterUpdateStatus, getMonsterDiffDetails, reset: resetDiff } = useDiffCompare()

const gameType = computed(() => route.params.type)
const items = computed(() => dataStore.currentData?.['物品'] || [])
const totalCards = computed(() => items.value.length)

const isUpdating = ref(false)

const filteredCards = computed(() => {
  const isUpdatedFn = filterStore.showUpdatedOnly
      ? (gameType.value === 'events' ? (card) => isEventUpdated(card)
        : gameType.value === 'monsters' ? (card) => isMonsterUpdated(card)
        : null)
      : null
  return sortCards(items.value.filter(c => matchFilters(c, isUpdatedFn)))
})

function getBadge(card) {
  if (gameType.value === 'events' && filterStore.showUpdatedOnly) return getEventUpdateStatus(card)
  if (gameType.value === 'monsters' && filterStore.showUpdatedOnly) return getMonsterUpdateStatus(card)
  return ''
}

function getDiffDetails(card) {
  if (gameType.value === 'events' && filterStore.showUpdatedOnly) return getEventDiffDetails(card)
  if (gameType.value === 'monsters' && filterStore.showUpdatedOnly) return getMonsterDiffDetails(card)
  return {}
}

async function toggleUpdated() {
  filterStore.showUpdatedOnly = !filterStore.showUpdatedOnly
  if (filterStore.showUpdatedOnly) {
    isUpdating.value = true
    resetDiff()
    if (gameType.value === 'events') await loadPrevEvents()
    else if (gameType.value === 'monsters') await loadPrevMonsters()
    isUpdating.value = false
  }
}

const showHeroFilter = computed(() => ['merchants', 'events'].includes(gameType.value))
const showDaySort = computed(() => gameType.value === 'monsters')
const hideSizeFilter = computed(() => ['monsters', 'events'].includes(gameType.value))
const hideScopeFilter = computed(() => ['monsters', 'events'].includes(gameType.value))

const heroFilterList = computed(() => {
  if (!['merchants', 'events'].includes(gameType.value)) return []
  const heroes = new Set()
  items.value.forEach(c => (c['所属职业'] || []).forEach(h => heroes.add(h)))
  return [...heroes]
})

onMounted(async () => {
  filterStore.resetFilters()
  if (route.params.type === 'monsters') filterStore.sortBy = 'day'
  await dataStore.loadGameData(route.params.type)
})
watch(() => route.params.type, async (t) => {
  if (t) { filterStore.resetFilters(); if (t === 'monsters') filterStore.sortBy = 'day'; await dataStore.loadGameData(t) }
})
</script>
