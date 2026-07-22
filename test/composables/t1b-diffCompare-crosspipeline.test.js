import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDiffCompare } from '@/composables/useDiffCompare'

// 跨管线（s16.2 RSC vs s15 旧 API）对比回归测试
// 背景：s16.2 数据无价格、冷却时间用"秒"、多重用"多重释放"、tooltip 已解析占位符；
// s15 数据有价格、冷却时间用"毫秒(ms)"、多重用"多重施法"、tooltip 含 {ability.x} 占位符。
// 若直接逐字段对比会导致"仅查看更新物品"时所有物品都被标记为已更新。
// crossPipeline 模式必须消除这些管线格式伪变更，这些用例是防止该问题复发的护栏。

function makeItem(overrides = {}) {
  return {
    '名称': '测试', '英文名': 'TestItem', '基础品质': 'Gold',
    '大小': 'Medium', '类型': 'Item', '基础属性': {},
    '效果说明': [], '所属职业': [], '显示标签': [], '品质层级': {},
    ...overrides
  }
}

const CROSS = { crossPipeline: true }

describe('跨管线对比：消除 s16.2/s15 schema 伪变更', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('价格差异在 crossPipeline 下被完全忽略', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': {} }),
      makeItem({ '基础属性': { '购买价格': 100, '出售价格': 50 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('冷却时间 ms 与 秒 统一后相等则不标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': 3 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('多重施法/多重释放 键名统一后相等则不标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '多重释放': 2 } }),
      makeItem({ '基础属性': { '多重施法': 2 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('tooltip 仅空白差异被忽略', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '效果说明': ['造成 50 点伤害'] }),
      makeItem({ '效果说明': ['造成50点伤害'] }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('tooltip 含未解析占位符的条目被跳过', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '效果说明': ['造成50点伤害'] }),
      makeItem({ '效果说明': ['造成{ability.0}点伤害'] }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('品质层级仅单侧存在时不标记（交集为空）', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '品质层级': {} }),
      makeItem({ '品质层级': { 'Gold': { '属性变更': { '购买价格': 100 } } } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('综合伪变更场景：价格+冷却单位+多重键+占位符+空白 全部消除', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({
        '基础属性': { '冷却时间(秒)': 3, '多重释放': 1 },
        '效果说明': ['造成 50 点伤害']
      }),
      makeItem({
        '基础属性': { '冷却时间(ms)': 3000, '多重施法': 1, '购买价格': 100, '出售价格': 50 },
        '效果说明': ['造成{ability.0}点伤害']
      }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('sharedAttrKeys 限制仅对比双方管线共有的属性键', () => {
    const { buildDiffMap } = useDiffCompare()
    // 伤害值 只在旧管线存在，不在 sharedAttrKeys → 不应标记
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': 3 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000, '伤害值': 326 } }),
      { crossPipeline: true, sharedAttrKeys: new Set(['冷却时间(秒)', '多重释放']) }
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('真实冷却变更仍会被标记（避免过度隐藏真实更新）', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': 4 } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000 } }),
      CROSS
    )
    expect(dm.attrs).toBeDefined()
    expect(dm.attrs['冷却时间(秒)']).toBeDefined()
  })

  it('真实 tooltip 文本变更仍会被标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '效果说明': ['造成80点伤害'] }),
      makeItem({ '效果说明': ['造成50点伤害'] }),
      CROSS
    )
    expect(dm.tooltips).toBeDefined()
    expect(dm.tooltips['0']).toBeDefined()
  })

  it('默认模式（无 opts）保持原逐字段行为：价格差异仍标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '购买价格': 200 } }),
      makeItem({ '基础属性': { '购买价格': 100 } })
    )
    expect(dm.attrs).toBeDefined()
    expect(dm.attrs['购买价格']).toEqual({ old: 100, new: 200 })
  })

  // === 以下用例专门锁定 live 87% 全部误标记的根因：16.2 冷却时间存为字符串 ===

  it('16.2 字符串冷却 "3.0" 与 s15 毫秒 3000 统一后不标记（live 主因）', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': '3.0' } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 3000 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('16.2 多档冷却字符串 "8.0 » 6.0 » 5.0" 取首档与 s15 基础冷却相等则不标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': '8.0 » 6.0 » 5.0' } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 8000 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('多档冷却字符串首档真实变化仍会被标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '冷却时间(秒)': '5.0 » 4.0' } }),
      makeItem({ '基础属性': { '冷却时间(ms)': 8000 } }),
      CROSS
    )
    expect(dm.attrs).toBeDefined()
    expect(dm.attrs['冷却时间(秒)']).toBeDefined()
  })

  it('多重释放字符串数值与 s15 数字统一后不标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '基础属性': { '多重释放': '2' } }),
      makeItem({ '基础属性': { '多重施法': 2 } }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('tooltip 加号/百分号格式差异被忽略', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '效果说明': ['+50% 伤害'] }),
      makeItem({ '效果说明': ['50 伤害'] }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('crossPipeline 下 所属职业 不可靠不参与对比', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '所属职业': ['海盗'] }),
      makeItem({ '所属职业': ['战士', '法师'] }),
      CROSS
    )
    expect(Object.keys(dm)).toHaveLength(0)
  })

  it('默认模式 所属职业 变更仍标记', () => {
    const { buildDiffMap } = useDiffCompare()
    const dm = buildDiffMap(
      makeItem({ '所属职业': ['战士'] }),
      makeItem({ '所属职业': ['法师'] })
    )
    expect(dm.other).toContain('所属职业')
  })
})
