import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDiffCompare } from '@/composables/useDiffCompare'

function makeItem(overrides = {}) {
  return {
    '名称': '测试', '英文名': 'TestItem', '基础品质': 'Gold',
    '大小': 'Medium', '类型': 'Weapon', '基础属性': { '冷却时间(ms)': 5000 },
    '效果说明': [], '所属职业': [], '显示标签': [], '品质层级': {},
    ...overrides
  }
}

describe('T0: buildDiffMap 差异详情构建', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('基础属性变更应返回old/new值', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(ms)': 4000 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000 } })
    )
    expect(dm.attrs).toBeDefined()
    expect(dm.attrs['冷却时间(ms)']).toEqual({ old: '3s', new: '4s' })
  })

  it('时间属性应转为秒', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(ms)': 4500 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000 } })
    )
    expect(dm.attrs['冷却时间(ms)']).toEqual({ old: '3s', new: '4.5s' })
  })

  it('非时间属性不应转为秒', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { 'BurnApplyAmount': 5000 } }),
      makeItem({ '基础属性': { 'BurnApplyAmount': 3000 } })
    )
    expect(dm.attrs['BurnApplyAmount']).toEqual({ old: 3000, new: 5000 })
  })

  it('基础字段变更应记录在basic', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础品质': 'Silver' }),
      makeItem({ '基础品质': 'Gold' })
    )
    expect(dm.basic).toBeDefined()
    expect(dm.basic['基础品质']).toEqual({ old: 'Gold', new: 'Silver' })
  })

  it('效果说明变更应记录在tooltips', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '效果说明': ['新效果'] }),
      makeItem({ '效果说明': ['旧效果'] })
    )
    expect(dm.tooltips).toBeDefined()
    expect(dm.tooltips['0']).toEqual({ old: '旧效果', new: '新效果', type: '' })
  })

  it('无变更时返回空对象', () => {
    const { buildDiffMap } = useDiffCompare()
    const item = makeItem()
    const dm = buildDiffMap(item, makeItem())
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('新增属性应有old=null', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(ms)': 5000, 'ReloadAmount': 10 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 5000 } })
    )
    expect(dm.attrs['ReloadAmount']).toEqual({ old: null, new: 10 })
  })
})

describe('T1: getCardDiffDetails 数据流', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('对未变更物品返回空对象', () => {
    const { getCardDiffDetails } = useDiffCompare()
    const card = { '英文名': 'NonExistent' }
    expect(getCardDiffDetails(card, 'items')).toEqual({})
  })

  it('对无英文名卡片返回空对象', () => {
    const { getCardDiffDetails } = useDiffCompare()
    expect(getCardDiffDetails({}, 'items')).toEqual({})
  })

  it('changedItemKeys初始为null', () => {
    const { changedItemKeys } = useDiffCompare()
    expect(changedItemKeys.value).toBeNull()
  })

describe('T2: 事件/怪物对比函数', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isEventUpdated 未加载数据时返回 false', () => {
    const { isEventUpdated } = useDiffCompare()
    expect(isEventUpdated({ '英文名': 'Test' })).toBe(false)
  })

  it('isMonsterUpdated 未加载数据时返回 false', () => {
    const { isMonsterUpdated } = useDiffCompare()
    expect(isMonsterUpdated({ '英文名': 'Test' })).toBe(false)
  })

  it('getEventUpdateStatus 无英文名返回空字符串', () => {
    const { getEventUpdateStatus } = useDiffCompare()
    expect(getEventUpdateStatus({})).toBe('')
  })

  it('getMonsterUpdateStatus 无英文名返回空字符串', () => {
    const { getMonsterUpdateStatus } = useDiffCompare()
    expect(getMonsterUpdateStatus({})).toBe('')
  })

  it('getEventDiffDetails 无英文名返回空对象', () => {
    const { getEventDiffDetails } = useDiffCompare()
    expect(getEventDiffDetails({})).toEqual({})
  })

  it('getMonsterDiffDetails 无英文名返回空对象', () => {
    const { getMonsterDiffDetails } = useDiffCompare()
    expect(getMonsterDiffDetails({})).toEqual({})
  })

  it('reset 应清空事件和怪物相关状态', () => {
    const { reset } = useDiffCompare()
    reset()
    // After reset, functions should still work (not throw)
    const { isEventUpdated, isMonsterUpdated } = useDiffCompare()
    expect(isEventUpdated({ '英文名': 'Test' })).toBe(false)
    expect(isMonsterUpdated({ '英文名': 'Test' })).toBe(false)
  })
})
})
