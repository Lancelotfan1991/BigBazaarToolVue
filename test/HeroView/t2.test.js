
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/dataStore'

const pushMock = vi.fn()
let currentRoute = { params: { name: 'All' } }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => currentRoute,
  RouterView: { template: '<div />' }
}))

vi.mock('@/composables/useDiffCompare', () => ({
  useDiffCompare: () => ({
    loadPrevSeason: vi.fn(),
    isCardUpdated: vi.fn(() => false),
    getCardUpdateStatus: vi.fn(() => ''),
    reset: vi.fn()
  })
}))

vi.mock('@/components/FilterBar.vue', () => ({
  default: { name: 'FilterBar', props: ['tags','showTags','showUpdateToggle','tagZh'], emits: ['toggle-updated'],
    template: '<div class="filters" />' }
}))
vi.mock('@/components/TabBar.vue', () => ({
  default: { name: 'TabBar', props: ['itemCount','skillCount'],
    template: '<div class="tabs" />' }
}))
vi.mock('@/components/StatsBar.vue', () => ({
  default: { name: 'StatsBar', props: ['cards','total'],
    template: '<div class="stats" />' }
}))
vi.mock('@/components/CardGrid.vue', () => ({
  default: { name: 'CardGrid', props: ['filteredCards','renderLimit','isGameData','getBadge'], emits: ['card-click'],
    template: '<div class="cards-grid">{{ filteredCards.length }} items</div>' }
}))

import HeroView from '@/views/HeroView.vue'

describe('T2 - HeroView 补充场景', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
  })

  it('当访问 /hero/All 时，会加载全部物品数据', async () => {
    currentRoute = { params: { name: 'All' } }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [{ '名称': '物品A' }, { '名称': '物品B' }],
        '技能': [{ '名称': '技能A' }]
      })
    }))
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    const store = useDataStore()
    expect(store.currentData).not.toBeNull()
    expect(store.currentData['物品']).toHaveLength(2)
  })

  it('当访问 /hero/events 时，会加载游戏数据', async () => {
    currentRoute = { params: { name: 'events' } }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [{ '名称': '事件A' }], '技能': []
      })
    }))
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    const store = useDataStore()
    expect(store.currentData).not.toBeNull()
    expect(store.currentHero.name_en).toBe('events')
  })
})
