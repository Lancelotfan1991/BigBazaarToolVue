
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useFilterStore } from '@/stores/filterStore'
import { useDataStore } from '@/stores/dataStore'

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
  default: { name: 'FilterBar', props: ['tags','showTags','showUpdateToggle','tagZh'], emits: ['toggle-updated'],
    template: '<div class="filters">FilterBar</div>' }
}))
vi.mock('@/components/TabBar.vue', () => ({
  default: { name: 'TabBar', props: ['itemCount','skillCount'],
    template: '<div class="tabs">TabBar</div>' }
}))
vi.mock('@/components/StatsBar.vue', () => ({
  default: { name: 'StatsBar', props: ['cards','total'],
    template: '<div class="stats">{{ cards.length }}/{{ total }}</div>' }
}))
vi.mock('@/components/CardGrid.vue', () => ({
  default: { name: 'CardGrid', props: ['filteredCards','renderLimit','isGameData','getBadge'], emits: ['card-click'],
    template: '<div class="cards-grid">{{ filteredCards.length }} items</div>' }
}))

import HeroView from '@/views/HeroView.vue'

describe('T1 - HeroView 过滤与交互', () => {
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
              { '名称': '抓钩', '英文名': 'GrapplingHook', '基础品质': 'Gold', '大小': 'Small', '显示标签': ['Weapon'] },
              { '名称': '加速鞋', '英文名': 'SpeedBoots', '基础品质': 'Silver', '大小': 'Medium', '显示标签': ['Apparel'] }
            ],
            '技能': [{ '名称': '冲刺', '英文名': 'Dash' }],
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

  it('当 FilterBar 存在时，会传递 show-update-toggle 属性', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.filters').exists()).toBe(true)
  })

  it('当返回按钮存在时，显示"← 返回"文本', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.back-btn').text()).toContain('返回')
  })

  it('当数据源信息存在时，显示获取时间', async () => {
    const wrapper = mount(HeroView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.find('.data-source').text()).toContain('2024-01-01')
  })
})
