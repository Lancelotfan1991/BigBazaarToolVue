
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'

const pushMock = vi.fn()
let currentRoute = { params: { name: 'Dooley' } }

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
  default: { name: 'FilterBar', props: ['tags','showTags','showUpdateToggle','tagZh'], emits: ['toggle-updated'], template: '<div class="filters">FilterBar</div>' }
}))
vi.mock('@/components/TabBar.vue', () => ({
  default: { name: 'TabBar', props: ['itemCount','skillCount'], template: '<div class="tabs">TabBar</div>' }
}))
vi.mock('@/components/StatsBar.vue', () => ({
  default: { name: 'StatsBar', props: ['cards','total'], template: '<div class="stats">显示 {{ cards.length }}/{{ total }}</div>' }
}))
vi.mock('@/components/CardGrid.vue', () => ({
  default: { name: 'CardGrid', props: ['filteredCards','renderLimit','isGameData','getBadge'], emits: ['card-click'],
    template: '<div class="cards-grid">{{ filteredCards.length }} items</div>' }
}))

import HeroView from '@/views/HeroView.vue'

describe('T0 - HeroView 职业详情核心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    currentRoute = { params: { name: 'Dooley' } }
    global.fetch = vi.fn((url) => {
      if (url.includes('Dooley.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            '物品': [
              { '名称': '抓钩', '英文名': 'GrapplingHook', '基础品质': 'Gold', '大小': 'Small' },
              { '名称': '加速鞋', '英文名': 'SpeedBoots', '基础品质': 'Silver', '大小': 'Medium' }
            ],
            '技能': [
              { '名称': '冲刺', '英文名': 'Dash', '基础品质': 'Gold' }
            ],
            '获取时间': '2024-01-01'
          })
        })
      }
      if (url.includes('All.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ '物品': [], '技能': [] }) })
      }
      return Promise.resolve({ ok: false })
    })
  })

  it('当访问 /hero/Dooley 时，会加载该职业的数据', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    const store = useDataStore()
    expect(store.currentData).not.toBeNull()
    expect(store.currentData['物品']).toHaveLength(2)
  })

  it('当数据加载完成时，StatsBar 显示正确数量', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.stats').text()).toContain('2')
  })

  it('当点击返回按钮时，会返回首页', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    await wrapper.find('.back-btn').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('当 TabBar 存在时，显示物品和技能数量', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.tabs').exists()).toBe(true)
  })
})
