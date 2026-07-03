import { ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'

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

const TIME_ATTRS = new Set([
  '冷却时间(ms)', 'HasteAmount', 'SlowAmount', 'FreezeAmount'
])

function fmtTime(k, v) {
  if (TIME_ATTRS.has(k) && typeof v === 'number' && v > 0) {
    const s = v / 1000; return (s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)) + 's'
  }
  return v
}

function buildDiffMap(newItem, oldItem) {
  const d = {}
  // Basic fields
  for (const k of ['基础品质', '大小', '类型', '显示标签']) {
    if (!deepEqual(newItem[k], oldItem[k])) {
      if (!d.basic) d.basic = {}
      const o = oldItem[k], n = newItem[k]
      d.basic[k] = { old: Array.isArray(o) ? o.join(',') : (o || '无'), new: Array.isArray(n) ? n.join(',') : (n || '无') }
    }
  }
  // Attributes
  const na = newItem['基础属性'] || {}, oa = oldItem['基础属性'] || {}
  const akeys = new Set([...Object.keys(na), ...Object.keys(oa)])
  for (const k of akeys) {
    if (!deepEqual(na[k], oa[k])) {
      if (!d.attrs) d.attrs = {}
      d.attrs[k] = { old: fmtTime(k, oa[k] ?? null), new: fmtTime(k, na[k] ?? null) }
    }
  }
  // Tooltips
  const nt = newItem['效果说明'] || [], ot = oldItem['效果说明'] || []
  const ttext = t => typeof t === 'object' ? (t.text || '') : String(t || '')
  const maxT = Math.max(nt.length, ot.length)
  for (let i = 0; i < maxT; i++) {
    if (ttext(nt[i]) !== ttext(ot[i])) {
      if (!d.tooltips) d.tooltips = {}
      d.tooltips[i] = { old: ttext(ot[i]), new: ttext(nt[i]) }
    }
  }
  // Tier levels
  const ntl = newItem['品质层级'] || {}, otl = oldItem['品质层级'] || {}
  for (const tier of new Set([...Object.keys(ntl), ...Object.keys(otl)])) {
    const nc = ntl[tier]?.['属性变更'] || {}, oc = otl[tier]?.['属性变更'] || {}
    for (const k of new Set([...Object.keys(nc), ...Object.keys(oc)])) {
      if (!deepEqual(nc[k], oc[k])) {
        if (!d.tiers) d.tiers = {}
        if (!d.tiers[tier]) d.tiers[tier] = {}
        d.tiers[tier][k] = oc[k] ?? null
      }
    }
  }
  // Other fields
  for (const k of ['所属职业', '描述', '事件描述', '事件选项', '怪物信息', '战斗奖励']) {
    if (!deepEqual(newItem[k], oldItem[k])) {
      if (!d.other) d.other = []
      d.other.push(k)
    }
  }
  return d
}

export function useDiffCompare() {
  const dataStore = useDataStore()
  const prevSeasonData = ref(null)
  const prevItemKeys = ref(null)
  const prevSkillKeys = ref(null)
  const changedItemKeys = ref(null)
  const changedSkillKeys = ref(null)
  const itemDiffMap = ref(null)
  const skillDiffMap = ref(null)

  async function loadPrevSeason() {
    if (prevSeasonData.value) return
    const resp = await fetch('/data-s15/All.json')
    if (!resp.ok) return
    prevSeasonData.value = await resp.json()
    prevItemKeys.value = new Set((prevSeasonData.value['物品'] || []).map(i => i['英文名']))
    prevSkillKeys.value = new Set((prevSeasonData.value['技能'] || []).map(i => i['英文名']))
    changedItemKeys.value = new Set()
    changedSkillKeys.value = new Set()
    itemDiffMap.value = new Map()
    skillDiffMap.value = new Map()

    const prevItems = Object.fromEntries((prevSeasonData.value['物品'] || []).map(i => [i['英文名'], i]))
    const prevSkills = Object.fromEntries((prevSeasonData.value['技能'] || []).map(i => [i['英文名'], i]))

    const allCache = await dataStore.ensureAllItemsCache()
    const s16Items = allCache?.['物品'] || []
    const s16Skills = allCache?.['技能'] || []

    for (const item of s16Items) {
      const key = item['英文名']
      if (!key) continue
      if (!prevItems[key]) { changedItemKeys.value.add(key); itemDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(item, prevItems[key])
      if (Object.keys(dm).length) { changedItemKeys.value.add(key); itemDiffMap.value.set(key, dm) }
    }
    for (const skill of s16Skills) {
      const key = skill['英文名']
      if (!key) continue
      if (!prevSkills[key]) { changedSkillKeys.value.add(key); skillDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(skill, prevSkills[key])
      if (Object.keys(dm).length) { changedSkillKeys.value.add(key); skillDiffMap.value.set(key, dm) }
    }
    console.log('[Diff] S16 vs S15:', changedItemKeys.value.size, '物品变更,', changedSkillKeys.value.size, '技能变更')
  }

  function isCardUpdated(card, tab) {
    if (!prevSeasonData.value) return false
    const key = card['英文名']
    if (!key) return false
    if (tab === 'items') {
      if (!prevItemKeys.value.has(key)) return true
      return changedItemKeys.value.has(key)
    } else {
      if (!prevSkillKeys.value.has(key)) return true
      return changedSkillKeys.value.has(key)
    }
  }

  function getCardUpdateStatus(card, tab) {
    const key = card['英文名']
    if (!key) return ''
    if (tab === 'items') {
      if (!prevItemKeys.value?.has(key)) return 'new'
      return changedItemKeys.value?.has(key) ? 'updated' : ''
    } else {
      if (!prevSkillKeys.value?.has(key)) return 'new'
      return changedSkillKeys.value?.has(key) ? 'updated' : ''
    }
  }

  function getCardDiffDetails(card, tab) {
    const key = card['英文名']
    if (!key) return {}
    const map = tab === 'items' ? itemDiffMap.value : skillDiffMap.value
    return map?.get(key) || {}
  }

  function reset() {
    prevSeasonData.value = null
    prevItemKeys.value = null
    prevSkillKeys.value = null
    changedItemKeys.value = null
    changedSkillKeys.value = null
    itemDiffMap.value = null
    skillDiffMap.value = null
  }

  return {
    prevSeasonData, changedItemKeys, changedSkillKeys,
    loadPrevSeason, isCardUpdated, getCardUpdateStatus, getCardDiffDetails, buildDiffMap, reset
  }
}
