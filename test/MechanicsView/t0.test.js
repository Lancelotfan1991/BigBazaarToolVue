
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: {} }),
  RouterView: { template: '<div />' }
}))

import MechanicsView from '@/views/MechanicsView.vue'

describe('T0 - MechanicsView 游戏机制核心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
  })

  it('当页面加载时，会显示 6 个分类', () => {
    const wrapper = mount(MechanicsView)
    const categories = wrapper.findAll('.mech-category')
    expect(categories.length).toBe(6)
  })

  it('当点击某个分类标题时，会展开显示该分类的主题列表', async () => {
    const wrapper = mount(MechanicsView)
    const headers = wrapper.findAll('.mech-cat-header')
    expect(headers.length).toBeGreaterThan(0)
    // Initially closed - topics not visible
    const firstCat = headers[0]
    await firstCat.trigger('click')
    // After click, the category should have "open" class
    const firstCategory = wrapper.findAll('.mech-category')[0]
    expect(firstCategory.classes()).toContain('open')
  })

  it('当再次点击已展开的分类标题时，会折叠该分类', async () => {
    const wrapper = mount(MechanicsView)
    const headers = wrapper.findAll('.mech-cat-header')
    // Open
    await headers[0].trigger('click')
    let firstCategory = wrapper.findAll('.mech-category')[0]
    expect(firstCategory.classes()).toContain('open')
    // Close
    await headers[0].trigger('click')
    firstCategory = wrapper.findAll('.mech-category')[0]
    expect(firstCategory.classes()).not.toContain('open')
  })

  it('当点击返回按钮时，会返回首页', async () => {
    const wrapper = mount(MechanicsView)
    await wrapper.find('.back-btn').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('当展开分类时，会显示主题内容', async () => {
    const wrapper = mount(MechanicsView)
    const headers = wrapper.findAll('.mech-cat-header')
    await headers[0].trigger('click')
    const topics = wrapper.findAll('.mech-topic')
    expect(topics.length).toBeGreaterThan(0)
  })

  it('当页面加载时，显示"游戏机制参考手册"标题', () => {
    const wrapper = mount(MechanicsView)
    expect(wrapper.find('.data-source').text()).toContain('游戏机制参考手册')
  })
})
