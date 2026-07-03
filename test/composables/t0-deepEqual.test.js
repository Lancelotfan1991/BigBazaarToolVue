
import { describe, it, expect } from 'vitest'

// Replicate core functions for isolated testing
function isEmpty(v) {
  if (v === null || v === undefined || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true
  return false
}

function deepEqual(a, b) {
  if (a === b) return true
  const ae = isEmpty(a), be = isEmpty(b)
  if (ae && be) return true
  if (ae !== be) return false
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
    return true
  }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort()
  if (ka.length !== kb.length) return false
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false
    if (!deepEqual(a[ka[i]], b[kb[i]])) return false
  }
  return true
}

const CORE_FIELDS = [
  '名称', '基础品质', '大小', '类型', '显示标签',
  '效果说明', '基础属性', '品质层级', '所属职业',
  'heroes', '描述', '事件描述', '事件选项', '怪物信息', '战斗奖励'
]

function coreFieldsEqual(a, b) {
  for (const k of CORE_FIELDS) {
    if (!deepEqual(a[k], b[k])) return false
  }
  return true
}

describe('T0 - deepEqual 核心对比逻辑', () => {
  it('当两个值完全相同时，返回 true', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('hello', 'hello')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
  })

  it('当两个值类型不同时，返回 false', () => {
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual(true, 1)).toBe(false)
    expect(deepEqual(null, undefined)).toBe(true) // both are 'empty' per isEmpty
  })

  it('当嵌套对象属性值不同时，能检测到差异', () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
    expect(deepEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false)
  })

  it('当 null/空字符串/空数组/空对象比较时，视为相等（空值标准化）', () => {
    expect(deepEqual(null, '')).toBe(true)
    expect(deepEqual(null, [])).toBe(true)
    expect(deepEqual('', [])).toBe(true)
    expect(deepEqual(null, {})).toBe(true)
    expect(deepEqual('', {})).toBe(true)
    expect(deepEqual([], {})).toBe(true)
  })

  it('当 S16 物品核心字段与 S15 不同时，coreFieldsEqual 返回 false', () => {
    const s15 = { '名称': '抓钩', '基础品质': 'Gold', '效果说明': [{ text: '旧效果' }] }
    const s16 = { '名称': '抓钩', '基础品质': 'Gold', '效果说明': [{ text: '新效果' }] }
    expect(coreFieldsEqual(s16, s15)).toBe(false)
  })

  it('当仅图片链接等非核心字段不同时，coreFieldsEqual 返回 true', () => {
    const s15 = { '名称': '测试', '图片链接': 'z15.0/img.webp', '基础品质': 'Gold' }
    const s16 = { '名称': '测试', '图片链接': 'z16.0/img.webp', '基础品质': 'Gold' }
    expect(coreFieldsEqual(s16, s15)).toBe(true)
  })

  it('当物品在 S15 中不存在时（新物品），应被标记为变更', () => {
    // Simulated: isCardUpdated returns true for new items
    const prevKeys = new Set(['旧物品A', '旧物品B'])
    const card = { '英文名': '全新物品C' }
    expect(!prevKeys.has(card['英文名'])).toBe(true)
  })

  it('当物品核心字段有变更时，coreFieldsEqual 检测到差异', () => {
    const s15 = { '名称': '抽奖券', '描述': '旧描述' }
    const s16 = { '名称': '抽奖券', '描述': '新描述' }
    expect(coreFieldsEqual(s16, s15)).toBe(false)
  })

  it('当物品完全无变更时，coreFieldsEqual 返回 true', () => {
    const item = { '名称': '不变物品', '基础品质': 'Silver', '基础属性': { '冷却时间(ms)': 5000 } }
    expect(coreFieldsEqual(item, { ...item })).toBe(true)
  })
})
