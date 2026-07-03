
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'
import { useCardFilter } from '@/composables/useCardFilter'

function isEmpty(v) {
  if (v === null || v === undefined || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true
  return false
}

function deepEqual(a, b) {
  if (a === b) return true
  const ae = isEmpty(a), be = isEmpty(b)
  if (ae && be) return true
  if (ae !== be) return false
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
    return true
  }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort()
  if (ka.length !== kb.length) return false
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false
    if (!deepEqual(a[ka[i]], b[kb[i]])) return false
  }
  return true
}

describe('T2 - 边界情况', () => {
  let filterStore, cardFilter

  beforeEach(() => {
    setActivePinia(createPinia())
    filterStore = useFilterStore()
    cardFilter = useCardFilter()
  })

  const mockCard = (overrides = {}) => ({
    '名称': '测试物品', '英文名': 'Test', '基础品质': 'Gold',
    '大小': 'Small', '显示标签': ['Weapon'], '所属职业': ['Dooley'],
    '_heroEn': 'Dooley', '_heroZh': '杜利', ...overrides
  })

  it('当数组长度不同时，deepEqual 返回 false', () => {
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(deepEqual([1], [])).toBe(false)
  })

  it('当键序不同但值相同时，deepEqual 返回 true', () => {
    expect(deepEqual({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true)
  })

  it('当搜索关键词为空时，matchFilters 不做搜索过滤', () => {
    filterStore.searchQuery = ''
    expect(cardFilter.matchFilters(mockCard())).toBe(true)
  })

  it('当多个过滤器同时激活时，物品需满足所有条件', () => {
    filterStore.toggleFilter('tier', 'Gold')
    filterStore.toggleFilter('size', 'Small')
    expect(cardFilter.matchFilters(mockCard({ '基础品质': 'Gold', '大小': 'Small' }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '基础品质': 'Gold', '大小': 'Large' }))).toBe(false)
    expect(cardFilter.matchFilters(mockCard({ '基础品质': 'Silver', '大小': 'Small' }))).toBe(false)
  })

  it('当 normTier 传入中文"金"时，返回 "Gold"', () => {
    expect(cardFilter.normTier('金')).toBe('Gold')
  })

  it('当 normSize 传入中文"小型"时，返回 "Small"', () => {
    expect(cardFilter.normSize('小型')).toBe('Small')
  })
})
