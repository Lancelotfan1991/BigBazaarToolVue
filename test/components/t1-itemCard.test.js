import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemCard from '@/components/ItemCard.vue'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useDataStore, TIER_ATTR_ZH } from '@/stores/dataStore'

const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })

function makeCard(overrides = {}) {
  return {
    '名称': '测试物品', '英文名': 'TestItem', '基础品质': 'Gold',
    '大小': 'Medium', '类型': 'Weapon', '基础属性': { '冷却时间(ms)': 5000 },
    '效果说明': [], '所属职业': ['Vanessa'], '显示标签': [], '品质层级': {},
    ...overrides
  }
}

describe('T0: ItemCard 时间属性格式化', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('冷却时间(ms)应转为秒显示', () => {
    const card = makeCard({ '基础属性': { '冷却时间(ms)': 5000 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('5s')
  })

  it('HasteAmount应转为秒显示', () => {
    const card = makeCard({ '基础属性': { 'HasteAmount': 1500 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('1.5s')
  })

  it('非时间属性BurnApplyAmount不应转为秒', () => {
    const card = makeCard({ '基础属性': { 'BurnApplyAmount': 5000 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('5000')
    expect(w.find('.card-attrs').text()).not.toContain('5s')
  })

  it('非时间属性ShieldApplyAmount不应转为秒', () => {
    const card = makeCard({ '基础属性': { 'ShieldApplyAmount': 3000 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('3000')
  })

  it('非时间属性ReloadAmount不应转为秒', () => {
    const card = makeCard({ '基础属性': { 'ReloadAmount': 10 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('10')
  })

  it('整数秒不显示小数点', () => {
    const card = makeCard({ '基础属性': { '冷却时间(ms)': 3000 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('3s')
    expect(w.find('.card-attrs').text()).not.toContain('3.0s')
  })
})

describe('T0: ItemCard 多重施法显示名', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('多重施法属性应显示为多重释放', () => {
    expect(TIER_ATTR_ZH['多重施法']).toBe('多重释放')
  })

  it('卡片中多重施法值正确显示', () => {
    const card = makeCard({ '基础属性': { '多重施法': 2 } })
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero' },
      global: { plugins: [router] }
    })
    expect(w.find('.card-attrs').text()).toContain('多重释放')
    expect(w.find('.card-attrs').text()).toContain('2')
  })
})

describe('T1: ItemCard 内联差异标记', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('有diffDetails.attrs时显示旧值→新值', () => {
    const card = makeCard({ '基础属性': { '冷却时间(ms)': 4000 } })
    const diffDetails = { attrs: { '冷却时间(ms)': { old: 3000, new: 4000 } } }
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero', diffDetails },
      global: { plugins: [router] }
    })
    const attrs = w.find('.card-attrs')
    expect(attrs.html()).toContain('diff-old')
    expect(attrs.html()).toContain('diff-new')
    expect(attrs.text()).toContain('3s')
    expect(attrs.text()).toContain('4s')
    expect(attrs.text()).toContain('→')
  })

  it('有diffDetails.tooltips时显示效果说明差异', () => {
    const card = makeCard({ '效果说明': ['新效果文本'] })
    const diffDetails = { tooltips: { '0': { old: '旧效果文本', new: '新效果文本' } } }
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero', diffDetails },
      global: { plugins: [router] }
    })
    expect(w.find('.card-tooltip').html()).toContain('diff-old')
    expect(w.find('.card-tooltip').text()).toContain('旧效果文本')
  })

  it('有diffDetails.basic时显示基础字段差异', () => {
    const card = makeCard({ '基础品质': 'Silver' })
    const diffDetails = { basic: { '基础品质': { old: 'Gold', new: 'Silver' } } }
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero', diffDetails },
      global: { plugins: [router] }
    })
    expect(w.find('.card-basic-diff').exists()).toBe(true)
    expect(w.find('.card-basic-diff').text()).toContain('Gold')
    expect(w.find('.card-basic-diff').text()).toContain('Silver')
  })

  it('无diffDetails时不显示差异标记', () => {
    const card = makeCard()
    const w = mount(ItemCard, {
      props: { card, currentTab: 'items', currentScope: 'hero', diffDetails: {} },
      global: { plugins: [router] }
    })
    expect(w.find('.card-basic-diff').exists()).toBe(false)
    expect(w.find('.diff-old').exists()).toBe(false)
  })
})
