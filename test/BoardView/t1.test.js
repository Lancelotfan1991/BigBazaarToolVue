
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

describe('T1 - BoardView 移除与分享', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': '小刀', '英文名': 'Knife', '图片链接': '', '大小': '小型' },
          { '名称': '大炮', '英文名': 'Cannon', '图片链接': '', '大小': '大型' }
        ],
        '技能': []
      })
    }))
    global.alert = vi.fn()
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true, writable: true
      })
    } catch (_e) { /* ignore */ }
  })

  it('当点击布阵区中的物品时，会移除该物品', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('小刀')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    let results = wrapper.findAll('.board-search-item')
    if (results.length > 0) await results[0].trigger('click')
    expect(wrapper.text()).toContain('1/10 格')
    // Remove it
    const removeBtns = wrapper.findAll('.chip-remove')
    expect(removeBtns.length).toBeGreaterThan(0)
    await removeBtns[0].trigger('click')
    expect(wrapper.text()).toContain('0/10 格')
  })

  it('当放置大型物品（3格）时，会占用连续 3 个格子', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('大炮')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    expect(results.length).toBeGreaterThan(0)
    await results[0].trigger('click')
    expect(wrapper.text()).toContain('3/10 格')
  })

  it('当点击"分享阵容"按钮时，会调用 clipboard API', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('小刀')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    if (results.length > 0) await results[0].trigger('click')
    await wrapper.find('.board-share-btn').trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('当点击返回按钮时，会返回首页', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    await wrapper.find('.back-btn').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})
