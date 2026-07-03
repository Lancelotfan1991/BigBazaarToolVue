
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterView: { template: '<div />' }
}))

import BoardView from '@/views/BoardView.vue'

describe('T0 - BoardView 布阵区核心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': '抓钩', '英文名': 'GrapplingHook', '图片链接': '/img/hook.webp', '大小': '小型' },
          { '名称': '大剑', '英文名': 'GreatSword', '图片链接': '/img/sword.webp', '大小': '大型' },
          { '名称': '护盾', '英文名': 'Shield', '图片链接': '/img/shield.webp', '大小': '中型' }
        ],
        '技能': []
      })
    }))
    global.alert = vi.fn()
    // Stub clipboard via defineProperty
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true, writable: true
      })
    } catch (_e) { /* ignore */ }
  })

  it('当页面加载时，显示"已用 0/10 格"', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.text()).toContain('0/10 格')
  })

  it('当搜索物品名称时，会显示匹配结果列表', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('抓钩')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.findAll('.board-search-item').length).toBeGreaterThan(0)
  })

  it('当点击搜索结果中的物品时，会将物品放入布阵区', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('护盾')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    expect(results.length).toBeGreaterThan(0)
    await results[0].trigger('click')
    // 中型物品占 2 格
    expect(wrapper.text()).toContain('2/10 格')
  })

  it('当添加多个小型物品时，格子数会增加', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    // Add first small item
    await input.setValue('抓钩')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 30))
    let results = wrapper.findAll('.board-search-item')
    if (results.length > 0) await results[0].trigger('click')
    expect(wrapper.text()).toContain('1/10 格')
    // Add second small item
    await input.setValue('抓钩')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 30))
    results = wrapper.findAll('.board-search-item')
    if (results.length > 0) await results[0].trigger('click')
    expect(wrapper.text()).toContain('2/10 格')
  })
})
