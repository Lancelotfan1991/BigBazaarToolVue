import { describe, it, expect } from 'vitest'
import { resolvePlaceholders } from '@/composables/usePlaceholder'

describe('T2: resolvePlaceholders 占位符替换', () => {
  it('{ability.0} 替换为 Fixed 值', () => {
    const result = resolvePlaceholders('给你 {ability.0} 金币', {
      '{ability.0}': { Fixed: '5' }
    })
    expect(result).toBe('给你 5 金币')
  })

  it('{ability.0.mod} 替换为 mod 值', () => {
    const result = resolvePlaceholders('每件武器获得 {ability.0.mod} 金币', {
      '{ability.0.mod}': { mod: '3' }
    })
    expect(result).toBe('每件武器获得 3 金币')
  })

  it('无替换字段时原样输出文本', () => {
    const result = resolvePlaceholders('升级一件物品', {})
    expect(result).toBe('升级一件物品')
  })

  it('空 replacements 为 null 时保持文本不变', () => {
    const result = resolvePlaceholders('获得 {ability.0} 金币', null)
    expect(result).toBe('获得 {ability.0} 金币')
  })

  it('混合多个占位符同时替换', () => {
    const result = resolvePlaceholders('获得 {ability.0} 金币和 {ability.1} 经验', {
      '{ability.0}': { Fixed: '5' },
      '{ability.1}': '10'
    })
    expect(result).toBe('获得 5 金币和 10 经验')
  })

  it('替换值为空字符串时移除占位符', () => {
    const result = resolvePlaceholders('获得 {ability.0} 金币', {
      '{ability.0}': { Fixed: '' }
    })
    expect(result).toBe('获得  金币')
  })

  it('空文本输入返回空字符串', () => {
    const result = resolvePlaceholders('', { '{ability.0}': { Fixed: '5' } })
    expect(result).toBe('')
  })

  it('replacements 中多出无关 key 不影响结果', () => {
    const result = resolvePlaceholders('给你 {ability.0} 金币', {
      '{ability.0}': { Fixed: '5' },
      '{ability.1}': { Fixed: '999' }
    })
    expect(result).toBe('给你 5 金币')
  })
})