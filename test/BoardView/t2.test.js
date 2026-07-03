
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterView: { template: '<div />' }
}))

import BoardView from '@/views/BoardView.vue'

describe('T2 - BoardView 边界情况', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          { '名称': '大炮', '英文名': 'Cannon', '图片链接': '', '大小': 'Large' }
        ],
        '技能': []
      })
    }))
  })

  it('当搜索关键词为空时，不显示搜索结果', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.findAll('.board-search-item').length).toBe(0)
  })

  it('当搜索无匹配结果时，搜索列表为空', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 100))
    const input = wrapper.find('.board-search-input')
    await input.setValue('不存在的物品XYZABC')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.findAll('.board-search-item').length).toBe(0)
  })

  it('当页面显示"布阵区模拟器"标题', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('布阵区模拟器')
  })
})
