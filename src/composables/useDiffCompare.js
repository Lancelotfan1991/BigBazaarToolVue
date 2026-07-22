import { ref } from 'vue'
import { useDataStore, TIME_KEYS } from '@/stores/dataStore'

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

function fmtTime(k, v) {
  if (TIME_KEYS.has(k) && typeof v === 'number' && v > 0) {
    const s = v / 1000; return (s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)) + 's'
  }
  return v
}

const PRICE_KEYS = new Set(['购买价格', '出售价格'])

function canonAttrKey(k) {
  if (k === '冷却时间(ms)' || k === '冷却时间(秒)') return '冷却时间(秒)'
  if (k === '多重施法' || k === '多重释放') return '多重释放'
  return k
}

function parseLeadingNumber(v) {
  if (typeof v === 'number') return v
  const m = /^\s*[-+]?[0-9]*\.?[0-9]+/.exec(String(v))
  return m ? parseFloat(m[0]) : null
}

function canonAttrValue(k, v) {
  const ck = canonAttrKey(k)
  if (ck === '冷却时间(秒)') {
    const num = parseLeadingNumber(v)
    if (num === null) return v
    const sec = k === '冷却时间(ms)' ? num / 1000 : num
    return Math.round(sec * 10) / 10
  }
  if (ck === '多重释放') {
    const num = parseLeadingNumber(v)
    return num === null ? v : num
  }
  return v
}

function canonAttrs(attrs) {
  const out = {}
  for (const k of Object.keys(attrs || {})) {
    if (PRICE_KEYS.has(k)) continue
    out[canonAttrKey(k)] = canonAttrValue(k, attrs[k])
  }
  return out
}

function collectCanonAttrKeys(items) {
  const s = new Set()
  for (const it of items || []) {
    const a = canonAttrs(it['基础属性'] || {})
    for (const k of Object.keys(a)) s.add(k)
  }
  return s
}

function normTip(s) { return String(s || '').replace(/[\s+%]+/g, '') }
function hasPlaceholder(s) { return /\{[^}]*\}/.test(String(s || '')) }

function buildDiffMap(newItem, oldItem, opts = {}) {
  const cross = !!opts.crossPipeline
  const sharedAttrKeys = opts.sharedAttrKeys || null
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
  let na = newItem['基础属性'] || {}, oa = oldItem['基础属性'] || {}
  if (cross) { na = canonAttrs(na); oa = canonAttrs(oa) }
  let akeys = new Set([...Object.keys(na), ...Object.keys(oa)])
  if (cross) {
    akeys = new Set([...akeys].filter(k =>
      (k in na) && (k in oa) && (!sharedAttrKeys || sharedAttrKeys.has(k))
    ))
  }
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
    const nStr = ttext(nt[i]), oStr = ttext(ot[i])
    if (cross) {
      if (hasPlaceholder(nStr) || hasPlaceholder(oStr)) continue
      if (normTip(nStr) === normTip(oStr)) continue
    } else {
      if (nStr === oStr) continue
    }
    if (!d.tooltips) d.tooltips = {}
    const ntType = typeof nt[i] === 'object' ? (nt[i].type || '') : ''
    const otType = typeof ot[i] === 'object' ? (ot[i].type || '') : ''
    d.tooltips[i] = { old: oStr, new: nStr, type: otType || ntType }
  }
  // Tier levels
  const ntl = newItem['品质层级'] || {}, otl = oldItem['品质层级'] || {}
  const tierKeys = cross
    ? Object.keys(ntl).filter(t => t in otl)
    : [...new Set([...Object.keys(ntl), ...Object.keys(otl)])]
  for (const tier of tierKeys) {
    let nc = ntl[tier]?.['属性变更'] || {}, oc = otl[tier]?.['属性变更'] || {}
    if (cross) { nc = canonAttrs(nc); oc = canonAttrs(oc) }
    let ckeys = new Set([...Object.keys(nc), ...Object.keys(oc)])
    if (cross) {
      ckeys = new Set([...ckeys].filter(k =>
        (k in nc) && (k in oc) && (!sharedAttrKeys || sharedAttrKeys.has(k))
      ))
    }
    for (const k of ckeys) {
      if (!deepEqual(nc[k], oc[k])) {
        if (!d.tiers) d.tiers = {}
        if (!d.tiers[tier]) d.tiers[tier] = {}
        d.tiers[tier][k] = oc[k] ?? null
      }
    }
  }
  // Other fields (cross-pipeline: 所属职业 in s16.2 is unreliable, exclude)
  const otherKeys = cross
    ? ['描述', '事件描述', '事件选项', '怪物信息', '战斗奖励']
    : ['所属职业', '描述', '事件描述', '事件选项', '怪物信息', '战斗奖励']
  for (const k of otherKeys) {
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
  const prevEventsData = ref(null)
  const prevEventKeys = ref(null)
  const changedEventKeys = ref(null)
  const eventDiffMap = ref(null)
  const prevMonstersData = ref(null)
  const prevMonsterKeys = ref(null)
  const changedMonsterKeys = ref(null)
  const monsterDiffMap = ref(null)
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

    // Cross-pipeline normalization: s16.2 (RSC) vs s15 (旧 API) schema drift.
    // 仅对比两个管道都存在的规范属性键（交集），排除价格，统一冷却单位。
    const prevAttrKeys = collectCanonAttrKeys([...(prevSeasonData.value['物品'] || []), ...(prevSeasonData.value['技能'] || [])])
    const curAttrKeys = collectCanonAttrKeys([...s16Items, ...s16Skills])
    const sharedAttrKeys = new Set([...curAttrKeys].filter(k => prevAttrKeys.has(k)))
    const diffOpts = { crossPipeline: true, sharedAttrKeys }

    for (const item of s16Items) {
      const key = item['英文名']
      if (!key) continue
      if (!prevItems[key]) { changedItemKeys.value.add(key); itemDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(item, prevItems[key], diffOpts)
      if (Object.keys(dm).length) { changedItemKeys.value.add(key); itemDiffMap.value.set(key, dm) }
    }
    for (const skill of s16Skills) {
      const key = skill['英文名']
      if (!key) continue
      if (!prevSkills[key]) { changedSkillKeys.value.add(key); skillDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(skill, prevSkills[key], diffOpts)
      if (Object.keys(dm).length) { changedSkillKeys.value.add(key); skillDiffMap.value.set(key, dm) }
    }
    console.log('[Diff] S16 vs S15:', changedItemKeys.value.size, '物品变更,', changedSkillKeys.value.size, '技能变更')
  }


  async function loadPrevEvents() {
    if (prevEventsData.value) return
    const resp = await fetch('/data-s15/events.json')
    if (!resp.ok) return
    prevEventsData.value = await resp.json()
    prevEventKeys.value = new Set((prevEventsData.value['物品'] || []).map(i => i['英文名']))
    changedEventKeys.value = new Set()
    eventDiffMap.value = new Map()

    const prevEvents = Object.fromEntries((prevEventsData.value['物品'] || []).map(i => [i['英文名'], i]))
    const currentEvents = dataStore.currentData?.['物品'] || []

    for (const ev of currentEvents) {
      const key = ev['英文名']
      if (!key) continue
      if (!prevEvents[key]) { changedEventKeys.value.add(key); eventDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(ev, prevEvents[key])
      if (Object.keys(dm).length) { changedEventKeys.value.add(key); eventDiffMap.value.set(key, dm) }
    }
    console.log('[Diff] Events:', changedEventKeys.value.size, 'changes')
  }


  async function loadPrevMonsters() {
    if (prevMonstersData.value) return
    const resp = await fetch('/data-s15/monsters.json')
    if (!resp.ok) return
    prevMonstersData.value = await resp.json()
    prevMonsterKeys.value = new Set((prevMonstersData.value['物品'] || []).map(i => i['英文名']))
    changedMonsterKeys.value = new Set()
    monsterDiffMap.value = new Map()

    const prevMonsters = Object.fromEntries((prevMonstersData.value['物品'] || []).map(i => [i['英文名'], i]))
    const currentMonsters = dataStore.currentData?.['物品'] || []

    for (const m of currentMonsters) {
      const key = m['英文名']
      if (!key) continue
      if (!prevMonsters[key]) { changedMonsterKeys.value.add(key); monsterDiffMap.value.set(key, { isNew: true }); continue }
      const dm = buildDiffMap(m, prevMonsters[key])
      if (Object.keys(dm).length) { changedMonsterKeys.value.add(key); monsterDiffMap.value.set(key, dm) }
    }
    console.log('[Diff] Monsters:', changedMonsterKeys.value.size, 'changes')
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


  function isEventUpdated(card) {
    if (!prevEventsData.value) return false
    const key = card['英文名']
    if (!key) return false
    if (!prevEventKeys.value.has(key)) return true
    return changedEventKeys.value.has(key)
  }

  function getEventUpdateStatus(card) {
    const key = card['英文名']
    if (!key) return ''
    if (!prevEventKeys.value?.has(key)) return 'new'
    return changedEventKeys.value?.has(key) ? 'updated' : ''
  }

  function getEventDiffDetails(card) {
    const key = card['英文名']
    if (!key) return {}
    return eventDiffMap.value?.get(key) || {}
  }


  function isMonsterUpdated(card) {
    if (!prevMonstersData.value) return false
    const key = card['英文名']
    if (!key) return false
    if (!prevMonsterKeys.value.has(key)) return true
    return changedMonsterKeys.value.has(key)
  }

  function getMonsterUpdateStatus(card) {
    const key = card['英文名']
    if (!key) return ''
    if (!prevMonsterKeys.value?.has(key)) return 'new'
    return changedMonsterKeys.value?.has(key) ? 'updated' : ''
  }

  function getMonsterDiffDetails(card) {
    const key = card['英文名']
    if (!key) return {}
    return monsterDiffMap.value?.get(key) || {}
  }

  function reset() {
    prevSeasonData.value = null
    prevItemKeys.value = null
    prevSkillKeys.value = null
    prevEventsData.value = null
    prevEventKeys.value = null
    changedEventKeys.value = null
    eventDiffMap.value = null
    prevMonstersData.value = null
    prevMonsterKeys.value = null
    changedMonsterKeys.value = null
    monsterDiffMap.value = null
    changedItemKeys.value = null
    changedSkillKeys.value = null
    itemDiffMap.value = null
    skillDiffMap.value = null
  }

  return {
    prevSeasonData, changedItemKeys, changedSkillKeys,
    loadPrevSeason, loadPrevEvents, isCardUpdated, getCardUpdateStatus, getCardDiffDetails,
    isEventUpdated, getEventUpdateStatus, getEventDiffDetails,
    loadPrevMonsters, isMonsterUpdated, getMonsterUpdateStatus, getMonsterDiffDetails,
    buildDiffMap, reset
  }
}
