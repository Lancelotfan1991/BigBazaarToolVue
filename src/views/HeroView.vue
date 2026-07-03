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
      :tags="tags"
      :show-tags="filterStore.currentTab === 'items'"
      show-update-toggle
      :tag-zh="TAG_ZH"
      @toggle-updated="toggleUpdated"
    />
    <TabBar
      :item-count="items.length"
      :skill-count="skills.length"
    />
    <StatsBar
      :cards="filteredCards"
      :total="totalCards"
    />
    <div
      v-if="isUpdating"
      class="updating-overlay"
    >
      <div class="spinner" />
      <p>正在加载对比数据...</p>
    </div>
    <CardGrid
      :filtered-cards="filteredCards"
      :render-limit="filterStore.renderLimit"
      :is-game-data="isGameData"
      :get-badge="getBadge"
      :get-diff-details="getDiffDetails"
      @card-click="onCardClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'
import { useCardFilter } from '@/composables/useCardFilter'
import { useDiffCompare } from '@/composables/useDiffCompare'
import FilterBar from '@/components/FilterBar.vue'
import TabBar from '@/components/TabBar.vue'
import StatsBar from '@/components/StatsBar.vue'
import CardGrid from '@/components/CardGrid.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const filterStore = useFilterStore()
const { matchFilters, sortCards } = useCardFilter()
const { loadPrevSeason, isCardUpdated, getCardUpdateStatus, getCardDiffDetails, reset: resetDiff } = useDiffCompare()

const TAG_ZH = {}
const isUpdating = ref(false)
const tags = ref([])
const isGameData = computed(() => ['events','monsters','trainers','merchants'].includes(route.params.name))

const items = computed(() => dataStore.currentData?.['物品'] || [])
const skills = computed(() => dataStore.currentData?.['技能'] || [])
const totalCards = computed(() => filterStore.currentTab === 'items' ? items.value.length : skills.value.length)

const currentCards = computed(() => filterStore.currentTab === 'items' ? items.value : skills.value)
const filteredCards = computed(() => {
  const isUpdatedFn = filterStore.showUpdatedOnly ? (card) => isCardUpdated(card, filterStore.currentTab) : null
  return sortCards(currentCards.value.filter(c => matchFilters(c, isUpdatedFn)))
})

function getBadge(card) {
  return filterStore.showUpdatedOnly ? getCardUpdateStatus(card, filterStore.currentTab) : ''
}

function getDiffDetails(card) {
  return filterStore.showUpdatedOnly ? getCardDiffDetails(card, filterStore.currentTab) : {}
}

async function toggleUpdated() {
  filterStore.showUpdatedOnly = !filterStore.showUpdatedOnly
  if (filterStore.showUpdatedOnly) {
    isUpdating.value = true
    await dataStore.ensureAllItemsCache()
    resetDiff()
    await loadPrevSeason()
    isUpdating.value = false
  }
}

function onCardClick(card) {
  const name = card['名称']
  if (name) {
    filterStore.searchQuery = name
    router.push({ name: 'hero', params: { name: 'All' } })
  }
}

function updateTags() {
  if (filterStore.currentTab !== 'items') { tags.value = []; return }
  const tagSet = new Set()
  items.value.forEach(item => (item['显示标签'] || []).forEach(t => tagSet.add(t)))
  tags.value = [...tagSet].sort()
}

watch(() => filterStore.currentTab, updateTags)

onMounted(async () => {
  filterStore.resetFilters()
  const name = route.params.name
  if (name === 'All') {
    await dataStore.ensureAllItemsCache()
    dataStore.currentData = dataStore.allItemsCache
    dataStore.currentHero = { name_en: 'All', name_zh: '全部' }
  } else if (['events','monsters','trainers','merchants'].includes(name)) {
    await dataStore.loadGameData(name)
  } else {
    await dataStore.loadHeroData(name)
  }
  updateTags()
})

watch(() => route.params.name, async (newName) => {
  if (!newName) return
  filterStore.resetFilters()
  if (newName === 'All') {
    await dataStore.ensureAllItemsCache()
    dataStore.currentData = dataStore.allItemsCache
    dataStore.currentHero = { name_en: 'All', name_zh: '全部' }
  } else if (['events','monsters','trainers','merchants'].includes(newName)) {
    await dataStore.loadGameData(newName)
  } else {
    await dataStore.loadHeroData(newName)
  }
  updateTags()
})
</script>
