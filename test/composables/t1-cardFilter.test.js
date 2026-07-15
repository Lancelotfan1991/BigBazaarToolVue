
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'
import { useCardFilter } from '@/composables/useCardFilter'

describe('T1 - 过滤排序逻辑', () => {
  let filterStore, cardFilter

  beforeEach(() => {
    setActivePinia(createPinia())
    filterStore = useFilterStore()
    cardFilter = useCardFilter()
  })

  const mockCard = (overrides = {}) => ({
    '名称': '测试物品',
    '英文名': 'TestItem',
    '基础品质': 'Gold',
    '大小': 'Small',
    '显示标签': ['Weapon', 'Tech'],
    '所属职业': ['Dooley'],
    '效果说明': [{ text: '造成 10 伤害' }],
    '_heroEn': 'Dooley',
    '_heroZh': '杜利',
    ...overrides
  })

  it('当搜索关键词匹配物品名称时，matchFilters 返回 true', () => {
    filterStore.searchQuery = '测试'
    expect(cardFilter.matchFilters(mockCard())).toBe(true)
  })

  it('文本搜索应能通过标签英文名匹配物品', () => {
    filterStore.searchQuery = 'Weapon'
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Weapon'] }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Food'] }))).toBe(false)
  })

  it('当搜索关键词不匹配任何字段时，matchFilters 返回 false', () => {
    filterStore.searchQuery = '不存在的物品XYZ'
    expect(cardFilter.matchFilters(mockCard())).toBe(false)
  })

  it('当品质过滤器激活时，只匹配对应品质', () => {
    filterStore.toggleFilter('tier', 'Gold')
    expect(cardFilter.matchFilters(mockCard({ '基础品质': 'Gold' }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '基础品质': 'Silver' }))).toBe(false)
  })

  it('当大小过滤器激活时，只匹配对应大小', () => {
    filterStore.toggleFilter('size', 'Small')
    expect(cardFilter.matchFilters(mockCard({ '大小': 'Small' }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '大小': 'Large' }))).toBe(false)
  })

  it('当标签过滤器激活时，只匹配含该标签的物品', () => {
    filterStore.toggleFilter('tag', 'Weapon')
    expect(cardFilter.matchFilters(mockCard())).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Potion'] }))).toBe(false)
  })

  it('当 scope 设为 exclusive 时，只显示当前职业专属物品', () => {
    filterStore.setScope('exclusive')
    expect(cardFilter.matchFilters(mockCard({ '_heroEn': 'Dooley', '所属职业': ['Dooley'] }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '_heroEn': 'Dooley', '所属职业': ['Vanessa'] }))).toBe(false)
  })

  it('当 hero 过滤器激活时，只匹配包含该职业的物品', () => {
    filterStore.toggleFilter('hero', '海盗')
    expect(cardFilter.matchFilters(mockCard({ '所属职业': ['海盗', '杜利'] }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '所属职业': ['杜利'] }))).toBe(false)
  })

  it('当 hero 过滤器未激活时，不影响匹配', () => {
    expect(cardFilter.matchFilters(mockCard())).toBe(true)
  })


  it('当 resetFilters 后 currentTab 重置为 items，标签过滤应正常工作', () => {
    filterStore.setTab('skills')
    filterStore.toggleFilter('tag', 'Weapon')
    filterStore.resetFilters()
    expect(filterStore.currentTab).toBe('items')
    expect(filterStore.activeFilters.tag.size).toBe(0)
    filterStore.toggleFilter('tag', 'Weapon')
    expect(cardFilter.matchFilters(mockCard())).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Potion'] }))).toBe(false)
  })

  it('标签过滤器同时匹配多个标签时，任一匹配即通过', () => {
    filterStore.toggleFilter('tag', 'Weapon')
    filterStore.toggleFilter('tag', 'Tech')
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Weapon'] }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Tech'] }))).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '显示标签': ['Food'] }))).toBe(false)
  })
  it('当 sortBy 为 day 时，按出现天数升序排序', () => {
    filterStore.sortBy = 'day'
    const cards = [
      { '名称': 'D', '怪物信息': { '出现天数': 10 } },
      { '名称': 'B', '怪物信息': { '出现天数': 3 } },
      { '名称': 'A', '怪物信息': { '出现天数': 1 } },
      { '名称': 'C' }
    ]
    const sorted = cardFilter.sortCards(cards)
    expect(sorted.map(c => c['名称'])).toEqual(['A', 'B', 'D', 'C'])
  })

  it('当 showUpdatedOnly 激活时，通过 isCardUpdated 函数过滤', () => {
    filterStore.showUpdatedOnly = true
    const isUpdated = (card) => card['英文名'] === 'UpdatedItem'
    expect(cardFilter.matchFilters(mockCard({ '英文名': 'UpdatedItem' }), isUpdated)).toBe(true)
    expect(cardFilter.matchFilters(mockCard({ '英文名': 'NormalItem' }), isUpdated)).toBe(false)
  })

  it('当 sortBy 为 tier 时，按铜→银→金→钻石→传说排序', () => {
    filterStore.sortBy = 'tier'
    const cards = [
      mockCard({ '名称': 'C', '基础品质': 'Gold' }),
      mockCard({ '名称': 'A', '基础品质': 'Bronze' }),
      mockCard({ '名称': 'B', '基础品质': 'Diamond' })
    ]
    const sorted = cardFilter.sortCards(cards)
    expect(sorted.map(c => c['名称'])).toEqual(['A', 'C', 'B'])
  })

  it('当 sortBy 为 size 时，按小→中→大排序', () => {
    filterStore.sortBy = 'size'
    const cards = [
      mockCard({ '名称': 'L', '大小': 'Large' }),
      mockCard({ '名称': 'S', '大小': 'Small' }),
      mockCard({ '名称': 'M', '大小': 'Medium' })
    ]
    const sorted = cardFilter.sortCards(cards)
    expect(sorted.map(c => c['名称'])).toEqual(['S', 'M', 'L'])
  })

  it('当 sortBy 为 name 时，按名称字典序排序', () => {
    filterStore.sortBy = 'name'
    const cards = [
      mockCard({ '名称': 'Charlie' }),
      mockCard({ '名称': 'Alpha' }),
      mockCard({ '名称': 'Bravo' })
    ]
    const sorted = cardFilter.sortCards(cards)
    expect(sorted.map(c => c['名称'])).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })
})
