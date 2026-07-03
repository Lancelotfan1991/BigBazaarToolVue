
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/dataStore'

const pushMock = vi.fn()
let currentRoute = { params: { type: 'events' } }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => currentRoute,
  RouterView: { template: '<div />' }
}))

vi.mock('@/components/FilterBar.vue', () => ({
  default: { name: 'FilterBar', props: ['tags','showTags','showUpdateToggle'],
    template: '<div class="filters">FilterBar</div>' }
}))
vi.mock('@/components/StatsBar.vue', () => ({
  default: { name: 'StatsBar', props: ['cards','total'],
    template: '<div class="stats">{{ cards.length }}/{{ total }}</div>' }
}))
vi.mock('@/components/CardGrid.vue', () => ({
  default: { name: 'CardGrid', props: ['filteredCards','renderLimit','isGameData'],
    template: '<div class="cards-grid">{{ filteredCards.length }} items</div>' }
}))

import GameDataView from '@/views/GameDataView.vue'

describe('T0 - GameDataView 游戏数据核心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    currentRoute = { params: { type: 'events' } }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': '神秘旅人', '英文名': 'MysteriousTraveler', '基础品质': 'Gold' },
          { '名称': '宝藏猎人', '英文名': 'TreasureHunter', '基础品质': 'Silver' }
        ],
        '技能': [],
        '获取时间': '2024-01-01'
      })
    }))
  })

  it('当访问 /game/events 时，会加载事件数据', async () => {
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const store = useDataStore()
    expect(store.currentData).not.toBeNull()
    expect(store.currentData['物品']).toHaveLength(2)
  })

  it('当数据加载完成时，显示统计信息', async () => {
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.stats').text()).toContain('2')
  })
})
