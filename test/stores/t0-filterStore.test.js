
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'

describe('T0 - filterStore 核心行为', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFilterStore()
  })

  it('当调用 toggleFilter("tier", "金") 时，activeFilters.tier 包含 "金"', () => {
    store.toggleFilter('tier', '金')
    expect(store.activeFilters.tier.has('金')).toBe(true)
  })

  it('当再次 toggleFilter("tier", "金") 时，activeFilters.tier 移除 "金"', () => {
    store.toggleFilter('tier', '金')
    store.toggleFilter('tier', '金')
    expect(store.activeFilters.tier.has('金')).toBe(false)
  })

  it('当调用 resetFilters() 时，所有过滤器恢复默认值', () => {
    store.toggleFilter('tier', '金')
    store.toggleFilter('size', '小型')
    store.toggleFilter('tag', 'Weapon')
    store.searchQuery = 'test'
    store.currentScope = 'exclusive'
    store.showUpdatedOnly = true
    store.resetFilters()
    expect(store.activeFilters.tier.size).toBe(0)
    expect(store.activeFilters.size.size).toBe(0)
    expect(store.activeFilters.tag.size).toBe(0)
    expect(store.searchQuery).toBe('')
    expect(store.currentScope).toBe('all')
    expect(store.showUpdatedOnly).toBe(false)
  })

  it('当调用 toggleFilter("hero", "海盗") 时，activeFilters.hero 包含 "海盗"', () => {
    store.toggleFilter('hero', '海盗')
    expect(store.activeFilters.hero.has('海盗')).toBe(true)
  })

  it('当再次 toggleFilter("hero", "海盗") 时，activeFilters.hero 移除 "海盗"', () => {
    store.toggleFilter('hero', '海盗')
    store.toggleFilter('hero', '海盗')
    expect(store.activeFilters.hero.has('海盗')).toBe(false)
  })

  it('当 resetFilters() 时，hero 筛选器也被清空', () => {
    store.toggleFilter('hero', '海盗')
    store.toggleFilter('hero', '杜利')
    store.resetFilters()
    expect(store.activeFilters.hero.size).toBe(0)
  })

  it('当调用 setTab("skills") 时，currentTab 变为 "skills"', () => {
    store.setTab('skills')
    expect(store.currentTab).toBe('skills')
  })
})
