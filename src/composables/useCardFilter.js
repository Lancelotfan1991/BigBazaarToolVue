import { useFilterStore } from '@/stores/filterStore'
import { TIER_ZH_REV, SIZE_ZH, SIZE_ORDER, TIER_ORDER } from '@/stores/dataStore'

export function useCardFilter() {
  const filterStore = useFilterStore()

  function f(card, ...keys) {
    for (const k of keys) if (card[k] != null && card[k] !== '') return card[k]
    return ''
  }

  function normTier(v) { return TIER_ZH_REV[v] || v }
  function normSize(v) { return Object.entries(SIZE_ZH).find(([, zh]) => zh === v)?.[0] || v }

  function matchFilters(card, isCardUpdatedFn) {
    const { searchQuery, currentScope, activeFilters, currentTab, showUpdatedOnly } = filterStore
    const search = searchQuery.toLowerCase()

    if (currentScope === 'exclusive') {
      const heroes = f(card, '所属职业', 'heroes') || []
      const heroEn = card['_heroEn'] || ''
      const heroZh = card['_heroZh'] || ''
      if (!Array.isArray(heroes) || !heroes.some(h => h === heroEn || h === heroZh)) return false
    }

    if (search) {
      const hay = [
        f(card, '名称', 'name'), f(card, '英文名', 'name_en'),
        (f(card, '显示标签', 'tags') || []).join(' '),
        (f(card, '效果说明', 'tooltips') || []).map(t => typeof t === 'object' ? (t.text || '') : t).join(' '),
        f(card, '事件描述') || '',
        (f(card, '事件选项') || []).map(o => o['名称'] || '').join(' '),
        ((f(card, '怪物信息') || {})['物品栏'] || []).map(b => b['名称'] || '').join(' ')
      ].join(' ').toLowerCase()
      if (!hay.includes(search)) return false
    }

    if (activeFilters.tier.size) {
      const raw = f(card, '基础品质', 'base_tier')
      if (!activeFilters.tier.has(raw) && !activeFilters.tier.has(normTier(raw))) return false
    }
    if (activeFilters.size.size) {
      const raw = f(card, '大小', 'size')
      if (!activeFilters.size.has(raw) && !activeFilters.size.has(normSize(raw))) return false
    }
    if (activeFilters.tag.size && currentTab === 'items') {
      const tags = f(card, '显示标签', 'tags') || []
      if (!Array.isArray(tags) || !tags.some(t => activeFilters.tag.has(t))) return false
    }
    if (activeFilters.hero.size) {
      const heroes = f(card, '所属职业', 'heroes') || []
      if (!Array.isArray(heroes) || !heroes.some(h => activeFilters.hero.has(h))) return false
    }

    if (showUpdatedOnly && isCardUpdatedFn && !isCardUpdatedFn(card)) return false
    return true
  }

  function sortCards(cards) {
    const sortBy = filterStore.sortBy
    return [...cards].sort((a, b) => {
      if (sortBy === 'name') return f(a, '名称', 'name').localeCompare(f(b, '名称', 'name'))
      if (sortBy === 'tier') return (TIER_ORDER[normTier(f(a, '基础品质'))] ?? 99) - (TIER_ORDER[normTier(f(b, '基础品质'))] ?? 99)
      if (sortBy === 'size') return (SIZE_ORDER[normSize(f(a, '大小'))] ?? 99) - (SIZE_ORDER[normSize(f(b, '大小'))] ?? 99)
      if (sortBy === 'day') {
        const da = a['怪物信息']?.['出现天数'] ?? 99
        const db = b['怪物信息']?.['出现天数'] ?? 99
        return da - db
      }
      return 0
    })
  }

  return { f, matchFilters, sortCards, normTier, normSize }
}
