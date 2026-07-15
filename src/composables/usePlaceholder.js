/**
 * 占位符替换工具
 * 将文本中的 {ability.0}、{ability.0.mod} 等占位符替换为 TooltipReplacements 中的实际数值
 */
export function resolvePlaceholders(text, replacements) {
  if (!text) return ''
  if (!replacements) return text
  let result = text
  for (const [key, val] of Object.entries(replacements)) {
    const v = (val && typeof val === 'object') ? (val.Fixed || val.mod || '') : (val || '')
    result = result.split(key).join(String(v))
  }
  return result
}