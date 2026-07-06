import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: {}, query: {}, hash: '' }),
  RouterView: { template: '<div />' }
}))

import BoardView from '@/views/BoardView.vue'

describe('T3 - BoardView 物品气泡基础属性展示', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        '物品': [
          {
            '名称': '测试武器', '英文名': 'TestWeapon', '图片链接': '',
            '大小': '小型', '基础品质': '金', '显示标签': ['Weapon'],
            '效果说明': ['造成100点伤害'],
            '品质层级': { '金': {}, '钻石': {} },
            '基础属性': { '冷却时间(ms)': 5000, '伤害值': 100, 'HasteTargets': 2 }
          },
          {
            '名称': '无属性物品', '英文名': 'NoAttrs', '图片链接': '',
            '大小': '小型', '基础品质': '银', '显示标签': [],
            '效果说明': ['无效果'],
            '品质层级': {},
            '基础属性': {}
          }
        ],
        '技能': [
          {
            '名称': '测试技能', '英文名': 'TestSkill', '图片链接': '',
            '大小': '小型', '基础品质': '金', '显示标签': [],
            '效果说明': ['技能效果'],
            '品质层级': {},
            '基础属性': { '冷却时间(ms)': 3000, 'HasteAmount': 1500 }
          }
        ]
      })
    }))
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true, writable: true
      })
    } catch (_e) { /* ignore */ }
  })

  it('添加有基础属性的物品后，气泡应展示冷却时间等属性', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 150))

    // Search and add the test weapon
    const input = wrapper.find('.board-search-input')
    await input.setValue('测试武器')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    expect(results.length).toBeGreaterThan(0)
    await results[0].trigger('click')
    expect(wrapper.text()).toContain('1/10 格')

    // Directly call showBubble via the component vm (simulates clicking the overlay)
    const vm = wrapper.vm
    const slot = vm.slots.find(s => s && s.nameEn === 'TestWeapon')
    expect(slot).toBeTruthy()
    vm.showBubble({ ...slot, _uid: slot.uid, _isSkill: false }, false)
    await wrapper.vm.$nextTick()

    // Bubble should show base attributes
    expect(wrapper.find('.bubble-attrs').exists()).toBe(true)
    const attrItems = wrapper.findAll('.bubble-attr-item')
    expect(attrItems.length).toBeGreaterThan(0)

    // Check specific attributes
    const labels = wrapper.findAll('.bubble-attr-label').map(el => el.text())
    const values = wrapper.findAll('.bubble-attr-value').map(el => el.text())
    expect(labels).toContain('冷却')
    expect(values).toContain('5s')
    expect(labels).toContain('伤害')
    expect(values).toContain('100')
    expect(labels).toContain('急速目标')
    expect(values).toContain('2')
  })

  it('冷却时间应转换为秒显示', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 150))

    const input = wrapper.find('.board-search-input')
    await input.setValue('测试武器')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    await results[0].trigger('click')

    // Show bubble directly
    const vm = wrapper.vm
    const slot = vm.slots.find(s => s && s.nameEn === 'TestWeapon')
    vm.showBubble({ ...slot, _uid: slot.uid, _isSkill: false }, false)
    await wrapper.vm.$nextTick()

    const values = wrapper.findAll('.bubble-attr-value').map(el => el.text())
    // 5000ms -> 5s
    expect(values).toContain('5s')
  })

  it('无基础属性的物品不应展示属性区域', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 150))

    const input = wrapper.find('.board-search-input')
    await input.setValue('无属性')
    await input.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    if (results.length > 0) {
      await results[0].trigger('click')
      const vm = wrapper.vm
      const slot = vm.slots.find(s => s && s.nameEn === 'NoAttrs')
      if (slot) {
        vm.showBubble({ ...slot, _uid: slot.uid, _isSkill: false }, false)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.bubble-attrs').exists()).toBe(false)
      }
    }
  })

  it('技能也应展示基础属性（冷却转为秒）', async () => {
    const wrapper = mount(BoardView)
    await new Promise(r => setTimeout(r, 150))

    // Search skill
    const inputs = wrapper.findAll('.board-search-input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    const skillInput = inputs[1]
    await skillInput.setValue('测试技能')
    await skillInput.trigger('input')
    await new Promise(r => setTimeout(r, 50))
    const results = wrapper.findAll('.board-search-item')
    if (results.length > 0) {
      await results[0].trigger('click')
      // Show skill bubble directly
      const vm = wrapper.vm
      const skill = vm.addedSkills.find(s => s.nameEn === 'TestSkill')
      if (skill) {
        vm.showBubble({ ...skill, _isSkill: true }, true)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.bubble-attrs').exists()).toBe(true)
        const labels = wrapper.findAll('.bubble-attr-label').map(el => el.text())
        const values = wrapper.findAll('.bubble-attr-value').map(el => el.text())
        expect(labels).toContain('冷却')
        expect(values).toContain('3s')
        expect(labels).toContain('急速')
        expect(values).toContain('1.5s')
      }
    }
  })
})
