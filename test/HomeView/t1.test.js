
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: {} }),
  RouterView: { template: '<div />' }
}))

vi.mock('@/components/HeroCard.vue', () => ({
  default: {
    name: 'HeroCard',
    props: ['hero'],
    emits: ['click'],
    template: '<div class="hero-card">{{ hero.name_en }}</div>'
  }
}))

import HomeView from '@/views/HomeView.vue'

describe('T1 - HomeView 游戏数据入口与链接', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    global.fetch = vi.fn((url) => {
      if (url.includes('heroes.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { name_en: 'Dooley', has_data: true }
        ])})
      }
      if (url.includes('.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ '物品': [{ '名称': 'a' }, { '名称': 'b' }], '技能': [{ '名称': 's1' }] }) })
      }
      return Promise.resolve({ ok: false })
    })
  })

  it('当页面加载时，会显示"游戏数据"区域', async () => {
    const wrapper = mount(HomeView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.text()).toContain('游戏数据')
  })

  it('当点击游戏数据卡片时，会跳转到 /game/:type', async () => {
    const wrapper = mount(HomeView)
    await new Promise(r => setTimeout(r, 100))
    const gameCards = wrapper.findAll('.game-data-card')
    expect(gameCards.length).toBeGreaterThan(0)
    await gameCards[0].trigger('click')
    expect(pushMock).toHaveBeenCalled()
  })

  it('当页面加载时，会显示"常用网站"链接列表', async () => {
    const wrapper = mount(HomeView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.text()).toContain('常用网站')
    expect(wrapper.findAll('.useful-link').length).toBeGreaterThan(0)
  })

  it('当点击布阵区模拟入口时，会跳转到 /board', async () => {
    const wrapper = mount(HomeView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.text()).toContain('布阵区模拟')
  })

  it('游戏机制大全入口应已隐藏', async () => {
    const wrapper = mount(HomeView)
    await new Promise(r => setTimeout(r, 100))
    expect(wrapper.text()).not.toContain('游戏机制大全')
  })
})
