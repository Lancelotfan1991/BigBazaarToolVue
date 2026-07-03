import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const currentTab = ref('items')
  const currentScope = ref('all')
  const searchQuery = ref('')
  const sortBy = ref('name')
  const renderLimit = ref(200)
  const activeFilters = reactive({
    tier: new Set(),
    size: new Set(),
    tag: new Set(),
    hero: new Set()
  })
  const showUpdatedOnly = ref(false)

  function toggleFilter(type, value) {
    const set = activeFilters[type]
    if (set.has(value)) set.delete(value)
    else set.add(value)
  }

  function setScope(scope) {
    currentScope.value = scope
  }

  function setTab(tab) {
    currentTab.value = tab
  }

  function resetFilters() {
    activeFilters.tier.clear()
    activeFilters.size.clear()
    activeFilters.tag.clear()
    activeFilters.hero.clear()
    searchQuery.value = ''
    currentScope.value = 'all'
    showUpdatedOnly.value = false
  }

  return {
    currentTab, currentScope, searchQuery, sortBy, renderLimit,
    activeFilters, showUpdatedOnly,
    toggleFilter, setScope, setTab, resetFilters
  }
})
