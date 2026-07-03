
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/dataStore'

// Mock router
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: {} }),
  RouterView: { template: '<div />' }
}))

// Mock HeroCard to simplify
vi.mock('@/components/HeroCard.vue', () => ({
  default: {
    name: 'HeroCard',
    props: ['hero'],
    emits: ['click'],
    template: '<div class="hero-card" @click="$emit(\'click\', hero.name_en)">{{ hero.name_en }}</div>'
  }
}))

import HomeView from '@/views/HomeView.vue'

describe('T0 - HomeView 职业选择核心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    global.fetch = vi.fn((url) => {
      if (url.includes('heroes.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { name_en: 'Dooley', name_zh: '杜利', has_data: true, data_time: '2024-01' },
          { name_en: 'Vanessa', name_zh: '瓦妮莎', has_data: true, data_time: '2024-01' }
        ])})
      }
      if (url.includes('.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ '物品': [{ '名称': 'a' }], '技能': [] }) })
      }
      return Promise.resolve({ ok: false })
    })
  })

  it('当页面加载时，会显示"选择职业"标题', async () => {
    const wrapper = mount(HomeView)
    await vi.dynamicImportSettled()
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('选择职业')
  })

  it('当页面加载后，职业列表包含职业卡片', async () => {
    const wrapper = mount(HomeView)
    await vi.dynamicImportSettled()
    await new Promise(r => setTimeout(r, 100))
    const cards = wrapper.findAll('.hero-card')
    expect(cards.length).toBe(2)
    expect(cards[0].text()).toContain('Dooley')
  })

  it('当点击职业卡片时，会跳转到 /hero/:name', async () => {
    const wrapper = mount(HomeView)
    await vi.dynamicImportSettled()
    await new Promise(r => setTimeout(r, 100))
    await wrapper.findAll('.hero-card')[0].trigger('click')
    expect(pushMock).toHaveBeenCalledWith({ name: 'hero', params: { name: 'Dooley' } })
  })
})
