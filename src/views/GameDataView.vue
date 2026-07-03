<template>
  <div class="content-area active">
    <div class="back-bar">
      <button
        class="back-btn"
        @click="router.push('/')"
      >
        ← 返回
      </button>
      <span class="data-source">{{ dataStore.currentData?.['获取时间'] || '' }}</span>
    </div>
    <FilterBar
      :tags="[]"
      :show-tags="false"
      :show-update-toggle="false"
      :show-hero-filter="showHeroFilter"
      :hero-list="merchantHeroes"
      :show-day-sort="showDaySort"
      :hide-size-filter="hideSizeFilter"
      :hide-scope-filter="hideScopeFilter"
    />
    <StatsBar
      :cards="filteredCards"
      :total="totalCards"
    />
    <CardGrid
      :filtered-cards="filteredCards"
      :render-limit="filterStore.renderLimit"
      :is-game-data="true"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'
import { useCardFilter } from '@/composables/useCardFilter'
import FilterBar from '@/components/FilterBar.vue'
import StatsBar from '@/components/StatsBar.vue'
import CardGrid from '@/components/CardGrid.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const filterStore = useFilterStore()
const { matchFilters, sortCards } = useCardFilter()

const gameType = computed(() => route.params.type)
const items = computed(() => dataStore.currentData?.['物品'] || [])
const totalCards = computed(() => items.value.length)
const filteredCards = computed(() => sortCards(items.value.filter(c => matchFilters(c))))

const merchantHeroes = computed(() => {
  if (gameType.value !== 'merchants') return []
  const heroes = new Set()
  items.value.forEach(c => (c['所属职业'] || []).forEach(h => heroes.add(h)))
  return [...heroes]
})
const showHeroFilter = computed(() => gameType.value === 'merchants')
const showDaySort = computed(() => gameType.value === 'monsters')
const hideSizeFilter = computed(() => gameType.value === 'monsters')
const hideScopeFilter = computed(() => gameType.value === 'monsters')

onMounted(async () => {
  filterStore.resetFilters()
  if (route.params.type === 'monsters') filterStore.sortBy = 'day'
  await dataStore.loadGameData(route.params.type)
})
watch(() => route.params.type, async (t) => {
  if (t) { filterStore.resetFilters(); if (t === 'monsters') filterStore.sortBy = 'day'; await dataStore.loadGameData(t) }
})
</script>
