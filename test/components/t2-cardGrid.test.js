import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CardGrid from '@/components/CardGrid.vue'
import { setActivePinia, createPinia } from 'pinia'

function makeCard(overrides = {}) {
  return {
    '名称': '测试怪物', '英文名': 'TestMonster', '基础品质': 'Bronze',
    '大小': 'Small', '类型': 'Monster', '基础属性': {},
    '效果说明': [], '所属职业': [], '显示标签': [], '怪物信息': { '出现天数': 1 },
    ...overrides
  }
}

describe('T2: CardGrid v-for key 唯一性', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('同名不同基础品质的怪物应分别渲染', () => {
    const cards = [
      makeCard({ '名称': '快乐杰克南瓜', '英文名': 'Joyful Jack', '基础品质': 'Silver', '怪物信息': { '出现天数': 7 } }),
      makeCard({ '名称': '快乐杰克南瓜', '英文名': 'Joyful Jack', '基础品质': 'Bronze', '怪物信息': { '出现天数': 8 } })
    ]
    const wrapper = mount(CardGrid, {
      props: { filteredCards: cards, renderLimit: 40 },
      global: { stubs: { ItemCard: true } }
    })
    const items = wrapper.findAllComponents({ name: 'ItemCard' })
    expect(items).toHaveLength(2)
  })

  it('同名同品质但不同出现天数的怪物应分别渲染', () => {
    const cards = [
      makeCard({ '名称': '拟形怪', '英文名': 'Mimic', '基础品质': 'Gold', '怪物信息': { '出现天数': 3 } }),
      makeCard({ '名称': '拟形怪', '英文名': 'Mimic', '基础品质': 'Gold', '怪物信息': { '出现天数': 5 } })
    ]
    const wrapper = mount(CardGrid, {
      props: { filteredCards: cards, renderLimit: 40 },
      global: { stubs: { ItemCard: true } }
    })
    const items = wrapper.findAllComponents({ name: 'ItemCard' })
    expect(items).toHaveLength(2)
  })

  it('普通不同名卡片应各自渲染', () => {
    const cards = [
      makeCard({ '名称': '怪物A', '英文名': 'MonsterA' }),
      makeCard({ '名称': '怪物B', '英文名': 'MonsterB' })
    ]
    const wrapper = mount(CardGrid, {
      props: { filteredCards: cards, renderLimit: 40 },
      global: { stubs: { ItemCard: true } }
    })
    const items = wrapper.findAllComponents({ name: 'ItemCard' })
    expect(items).toHaveLength(2)
  })
})