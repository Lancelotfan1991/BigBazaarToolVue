
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'

const pushMock = vi.fn()
let currentRoute = { params: { type: 'events' } }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => currentRoute,
  RouterView: { template: '<div />' }
}))

vi.mock('@/components/FilterBar.vue', () => ({
  default: { name: 'FilterBar', props: ['tags','showTags','showUpdateToggle','showHeroFilter','heroList','showDaySort','hideSizeFilter','hideScopeFilter'],
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

describe('T1 - GameDataView 商人/怪物集成', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    currentRoute = { params: { type: 'events' } }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': '神秘旅人', '英文名': 'MysteriousTraveler', '基础品质': 'Gold' }
        ],
        '技能': [],
        '获取时间': '2024-01-01'
      })
    }))
  })

  it('当访问 /game/merchants 时，FilterBar 收到 showHeroFilter=true', async () => {
    currentRoute = { params: { type: 'merchants' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    expect(fb.props('showHeroFilter')).toBe(true)
  })

  it('当访问 /game/merchants 时，FilterBar 收到职业列表', async () => {
    currentRoute = { params: { type: 'merchants' } }
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': 'A', '所属职业': ['海盗', '杜利'] },
          { '名称': 'B', '所属职业': ['海盗'] }
        ],
        '技能': []
      })
    }))
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    const heroes = fb.props('heroList')
    expect(heroes).toContain('海盗')
    expect(heroes).toContain('杜利')
  })

  it('当访问 /game/monsters 时，FilterBar 收到 showDaySort=true', async () => {
    currentRoute = { params: { type: 'monsters' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    expect(fb.props('showDaySort')).toBe(true)
  })

  it('当访问 /game/events 时，FilterBar 不显示职业筛选', async () => {
    currentRoute = { params: { type: 'events' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    expect(fb.props('showHeroFilter')).toBe(false)
    expect(fb.props('showDaySort')).toBe(false)
  })

  it('当访问 /game/monsters 时，默认按天数排序', async () => {
    currentRoute = { params: { type: 'monsters' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    expect(useFilterStore().sortBy).toBe('day')
  })

  it('当访问 /game/monsters 时，隐藏大小和范围筛选', async () => {
    currentRoute = { params: { type: 'monsters' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    expect(fb.props('hideSizeFilter')).toBe(true)
    expect(fb.props('hideScopeFilter')).toBe(true)
  })

  it('当访问 /game/merchants 时，不隐藏大小和范围筛选', async () => {
    currentRoute = { params: { type: 'merchants' } }
    const wrapper = mount(GameDataView)
    await new Promise(r => setTimeout(r, 100))
    const fb = wrapper.findComponent({ name: 'FilterBar' })
    expect(fb.props('hideSizeFilter')).toBe(false)
    expect(fb.props('hideScopeFilter')).toBe(false)
  })
})
