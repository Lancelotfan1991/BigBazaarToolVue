<template>
  <div class="board-viewer active" :class="{ 'screenshot-mode': screenshotMode }">
    <div class="back-bar">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <span class="data-source">布阵区模拟器</span>
    </div>
    <!-- Item Search -->
    <div class="board-search-area">
      <input v-model="searchQuery" type="text" class="board-search-input" placeholder="搜索物品名称..." @input="onItemSearch">
      <div v-if="itemSearchResults.length" class="board-search-results show">
        <div v-for="item in itemSearchResults" :key="item.nameEn" class="board-search-item" @click="addItem(item.nameEn)">
          <template v-if="item.img">
            <img class="bsi-img" :src="item.img" loading="lazy" @error="$event.target.style.display='none'">
          </template>
          <template v-else>
            <div class="bsi-img" style="display:flex;align-items:center;justify-content:center;font-size:18px;background:var(--surface2)">📦</div>
          </template>
          <div class="bsi-info">
            <div class="bsi-row1">
              <span v-if="item.tier" class="bsi-tier" :style="tierStyle(item.tier)">{{ item.tier }}</span>
              <span class="bsi-name">{{ item.name }}</span>
            </div>
            <div class="bsi-row2">
              <span class="bsi-en">{{ item.nameEn }}</span>
              <span v-for="t in item.tags" :key="t" class="bsi-tag">{{ tagZh(t) }}</span>
            </div>
          </div>
          <span class="bsi-size" :style="{ background: sizeColor(item.size) }">{{ sizeLabel(item.size) }}</span>
        </div>
      </div>
    </div>
    <!-- Board -->
    <div class="board-container" id="boardCaptureArea">
      <div class="board-slots" id="boardSlots" ref="slotsEl" @contextmenu.prevent>
        <div v-for="i in 10" :key="i" class="board-slot" :class="slotClass(i-1)">
          <span v-if="!slots[i-1]" class="slot-num">{{ i }}</span>
        </div>
      </div>
      <div class="board-item-chips">
        <span v-for="chip in itemChips" :key="chip.uid" class="board-chip">
          <img v-if="chip.img" class="chip-img" :src="chip.img">
          {{ chip.name }}
          <span class="chip-remove" @click="removeItem(chip.uid)">✕</span>
        </span>
      </div>
      <div class="board-info-row">
        <div class="board-info">已用 {{ usedSlots }}/10 格</div>
      </div>
    </div>
    <!-- Removed Items -->
    <div v-if="removedItems.length" class="board-removed">
      <h4>已移除物品 <span style="font-size:11px;color:var(--text2)">(点击重新添加)</span></h4>
      <div>
        <div v-for="item in removedItems" :key="item.uid" class="board-removed-item" :style="{ borderColor: sizeColor(item.size) }" @click="reAddItem(item.uid)">
          {{ item.name }} ({{ sizeLabel(item.size) }})
        </div>
      </div>
    </div>
    <!-- Skill Section -->
    <div class="skill-section">
      <h3 class="skill-section-title">⚡ 技能栏</h3>
      <div class="board-search-area">
        <input v-model="skillQuery" type="text" class="board-search-input" placeholder="搜索技能名称..." @input="onSkillSearch">
        <div v-if="skillSearchResults.length" class="board-search-results show">
          <div v-for="item in skillSearchResults" :key="item.nameEn" class="board-search-item" :class="{ added: isSkillAdded(item.nameEn) }" @click="toggleSkill(item.nameEn)">
            <template v-if="item.img">
              <div class="bsi-img" style="border-radius:50%;overflow:hidden;width:40px;height:40px;flex-shrink:0;">
                <img :src="item.img" loading="lazy" style="width:100%;height:100%;object-fit:cover;" @error="$event.target.parentElement.style.display='none'">
              </div>
            </template>
            <template v-else>
              <div class="bsi-img" style="display:flex;align-items:center;justify-content:center;font-size:18px;background:var(--surface2);border-radius:50%;width:40px;height:40px;">⚡</div>
            </template>
            <div class="bsi-info">
              <div class="bsi-row1">
                <span v-if="item.tier" class="bsi-tier" :style="tierStyle(item.tier)">{{ item.tier }}</span>
                <span class="bsi-name">{{ item.name }}</span>
              </div>
              <div class="bsi-row2">
                <span class="bsi-en">{{ item.nameEn }}</span>
                <span v-for="t in item.tags" :key="t" class="bsi-tag">{{ tagZh(t) }}</span>
              </div>
            </div>
            <span v-if="isSkillAdded(item.nameEn)" class="bsi-size" style="background:#27ae60">✓</span>
          </div>
        </div>
      </div>
      <div class="skill-list" ref="skillListEl">
        <div v-for="s in addedSkills" :key="s.nameEn" class="skill-icon-item" @click="showBubble(s, true)">
          <div class="skill-circle" :class="skillTierClass(s.currentTier || s.tier)" :style="skillTierBorderStyle(s.currentTier || s.tier)">
            <img v-if="s.img" :src="s.img" :alt="s.name">
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;background:var(--surface2)"></div>
          </div>
          <span class="skill-name-label">{{ s.name }}</span>
          <span class="skill-remove" @click.stop="removeSkill(s.nameEn)">✕</span>
        </div>
      </div>
    </div>
    <!-- Bottom Actions -->
    <div class="board-bottom-actions">
      <button class="board-share-btn" @click="shareLineup">🔗 分享阵容</button>
      <button class="board-save-btn" @click="toggleScreenshot">{{ screenshotMode ? '✏️ 退出截图' : '📷 截图模式' }}</button>
    </div>
    <!-- Info Bubble -->
    <template v-if="bubbleData">
      <div class="board-info-bubble-backdrop" @click="closeBubble" />
      <div class="board-info-bubble" :style="{ borderColor: tierBorder(bubbleData.currentTier || bubbleData.tier) }" @click.stop>
        <button class="bubble-close" @click="closeBubble">✕</button>
        <div class="bubble-header">
          <img v-if="bubbleData.img" :class="bubbleData._isSkill ? 'bubble-img skill-img' : 'bubble-img'" :src="bubbleData.img" :style="{ borderColor: tierBorder(bubbleData.currentTier || bubbleData.tier) }">
          <div v-else :class="bubbleData._isSkill ? 'bubble-img skill-img' : 'bubble-img'" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--surface2);" :style="{ borderColor: tierBorder(bubbleData.currentTier || bubbleData.tier) }">{{ bubbleData._isSkill ? '⚡' : '' }}</div>
          <div class="bubble-title">
            <div class="bubble-name">{{ bubbleData.name }}</div>
            <div class="bubble-badges">
              <span v-if="bubbleData.size" class="bubble-size" :style="{ background: sizeColor(bubbleData.size) }">{{ bubbleData.size }}</span>
              <span v-if="bubbleData.currentTier || bubbleData.tier" class="bubble-tier" :style="tierBadgeStyle(bubbleData.currentTier || bubbleData.tier)">{{ tierDisplay(bubbleData.currentTier || bubbleData.tier) }}</span>
            </div>
            <div v-if="bubbleData.tags && bubbleData.tags.length" class="bubble-tags">
              <span v-for="t in bubbleData.tags" :key="t" class="bubble-tag">{{ tagZh(t) }}</span>
            </div>
          </div>
        </div>
        <div v-if="bubbleData.desc && bubbleData.desc.length" class="bubble-divider" />
        <div v-if="bubbleData.desc && bubbleData.desc.length" class="bubble-desc">
          <div v-for="(d, i) in bubbleData.desc" :key="i" class="bubble-desc-line">
            <span v-if="typeof d === 'object' && d.type" class="bubble-type">{{ d.type }}</span>
            {{ typeof d === 'object' ? (d.text || '') : d }}
          </div>
        </div>
        <div v-if="bubbleAttrs.length" class="bubble-divider" />
        <div v-if="bubbleAttrs.length" class="bubble-attrs">
          <div v-for="attr in bubbleAttrs" :key="attr.label" class="bubble-attr-item">
            <span class="bubble-attr-label">{{ attr.label }}</span>
            <span class="bubble-attr-value">{{ attr.value }}<span v-if="attr.nextVal" class="bubble-attr-next"> → {{ attr.nextVal }}</span></span>
          </div>
        </div>
        <div class="bubble-level-bar">
          <span class="bubble-level-label" :style="{ color: tierBorder(bubbleData.currentTier || bubbleData.tier) }">{{ tierDisplay(bubbleData.currentTier || bubbleData.tier) }}</span>
          <div class="bubble-level-dots">
            <div v-for="(t, i) in bubbleAllTiers" :key="t" class="bubble-level-dot" :class="{ active: i <= bubbleCurIdx, current: i === bubbleCurIdx }" :style="{ borderColor: tierBorder(t), background: i <= bubbleCurIdx ? tierBorder(t) : 'transparent', color: tierBorder(t) }" :title="t" />
          </div>
        </div>
        <div :class="bubbleIsMax ? 'bubble-upgrade max-tier' : 'bubble-upgrade'" @click="doUpgrade">
          {{ bubbleIsMax ? ' 重置为 ' + tierDisplay(bubbleAllTiers[0]) : '⬆ 升级至' }}
          <span v-if="!bubbleIsMax" :style="{ color: tierBorder(bubbleNextTier), fontWeight: 700 }">{{ tierDisplay(bubbleNextTier) }}</span>
        </div>
      </div>
    </template>
    <!-- Drag Ghost -->
    <div v-if="dragGhostVisible" class="board-drag-ghost" :style="dragGhostStyle" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fmtTimeVal } from '@/composables/useFormat'
import { useDataStore, TAG_ZH, TIER_ATTR_ZH, TIME_KEYS } from '@/stores/dataStore'

const router = useRouter()
const route = useRoute()
const dataStore = useDataStore()

const BOARD_SIZE_MAP = { '小型': 1, '中型': 2, '大型': 3 }
const BOARD_SIZE_CLASS = { '小型': 'size-small', '中型': 'size-medium', '大型': 'size-large' }
const BOARD_SIZE_COLOR = { '小型': '#2ecc71', '中型': '#3498db', '大型': '#9b59b6' }
const BOARD_SIZE_LABEL = { '小型': 'S', '中型': 'M', '大型': 'L' }
const BOARD_TIER_COLOR = {
  '铜': { bg: 'rgba(180,140,100,0.2)', fg: '#b48c64' },
  '银': { bg: '#b0b8c833', fg: '#b0b8c8' },
  '金': { bg: '#d4a84433', fg: '#d4a844' },
  '钻石': { bg: '#6ec6e633', fg: '#6ec6e6' },
  '传说': { bg: '#c850f033', fg: '#c850f0' },
}
const TIER_BORDER = { '铜': 'rgb(180,98,65)', '银': 'rgb(192,192,192)', '金': 'rgb(255,215,0)', '钻石': 'rgb(0,255,255)', '传说': '#c850f0' }
const BOARD_TIER_ORDER = ['铜', '银', '金', '钻石', '传说']
const TIER_CLASS_MAP = { '铜': 'tier-border-bronze', '银': 'tier-border-silver', '金': 'tier-border-gold', '钻石': 'tier-border-diamond', '传说': 'tier-border-legendary' }

// State
const searchQuery = ref('')
const skillQuery = ref('')
const itemSearchResults = ref([])
const skillSearchResults = ref([])
const slots = reactive(new Array(10).fill(null))
const removedItems = ref([])
const addedSkills = ref([])
const screenshotMode = ref(false)
const uidCounter = ref(0)
const bubbleData = ref(null)
const dragGhostVisible = ref(false)
const dragGhostStyle = ref({})

const boardItems = ref([])
const boardSkillsList = ref([])

const slotsEl = ref(null)

// Computed
const usedSlots = computed(() => slots.filter(s => s !== null).length)

const itemChips = computed(() => {
  const seen = new Set()
  const chips = []
  for (let i = 0; i < 10; i++) {
    const s = slots[i]
    if (s && !seen.has(s.uid)) {
      seen.add(s.uid)
      chips.push({ uid: s.uid, name: s.name, img: s.img })
    }
  }
  return chips
})

const bubbleAllTiers = computed(() => {
  if (!bubbleData.value) return []
  const d = bubbleData.value
  const levels = Object.keys(d.tierLevels || {})
  return levels.length ? BOARD_TIER_ORDER.filter(t => levels.includes(t) || t === d.tier) : BOARD_TIER_ORDER
})
const bubbleCurIdx = computed(() => {
  if (!bubbleData.value) return 0
  const cur = bubbleData.value.currentTier || bubbleData.value.tier
  return bubbleAllTiers.value.indexOf(cur)
})
const bubbleIsMax = computed(() => bubbleCurIdx.value >= bubbleAllTiers.value.length - 1)
const bubbleNextTier = computed(() => {
  const all = bubbleAllTiers.value
  return bubbleIsMax.value ? all[0] : all[bubbleCurIdx.value + 1]
})
const bubbleAttrs = computed(() => bubbleAttrEntries())

// Helpers
function tagZh(t) { return TAG_ZH[t] || t }
const TIER_DISPLAY_ZH = { '铜': '青铜', '银': '白银', '金': '黄金', '钻石': '钻石', '传说': '传奇' }
function tierDisplay(t) { return TIER_DISPLAY_ZH[t] || t }
function sizeColor(s) { return BOARD_SIZE_COLOR[s] || '#888' }
function sizeLabel(s) { return BOARD_SIZE_LABEL[s] || 'S' }
function tierStyle(tier) {
  const c = BOARD_TIER_COLOR[tier] || {}
  return { background: c.bg || 'transparent', color: c.fg || 'var(--text2)' }
}
function tierBorder(tier) { return TIER_BORDER[tier] || 'var(--border)' }
function tierBadgeStyle(tier) {
  const c = BOARD_TIER_COLOR[tier] || {}
  return { background: c.bg, color: c.fg, border: '1px solid ' + tierBorder(tier) }
}
function skillTierClass(tier) { return TIER_CLASS_MAP[tier] || '' }
function skillTierBorderStyle(tier) {
  const b = tierBorder(tier)
  return b ? 'border-color:' + b + ';border-width:3px' : ''
}


function getEffectiveAttrs(baseAttrs, tierLevels, currentTier) {
  const result = Object.assign({}, baseAttrs)
  const allTiers = Object.keys(tierLevels || {})
  const curIdx = allTiers.indexOf(currentTier)
  const applyUpTo = curIdx >= 0 ? curIdx : allTiers.length - 1
  for (let i = 0; i <= applyUpTo && i < allTiers.length; i++) {
    const td = tierLevels[allTiers[i]]
    if (!td) continue
    const changes = td['属性变更']
    if (changes && changes !== '无变更' && typeof changes === 'object') {
      Object.entries(changes).forEach(function([k, v]) { result[k] = v })
    }
  }
  return result
}
function bubbleAttrEntries() {
  if (!bubbleData.value) return []
  var d = bubbleData.value
  var baseAttrs = d.baseAttrs || {}
  var tierLevels = d.tierLevels || {}
  var currentTier = d.currentTier || d.tier
  var eff = getEffectiveAttrs(baseAttrs, tierLevels, currentTier)
  var allTiers = Object.keys(tierLevels)
  var curIdx = allTiers.indexOf(currentTier)
  var nextEff = null
  if (curIdx >= 0 && curIdx < allTiers.length - 1) {
    var nextTier = allTiers[curIdx + 1]
    var nextTd = tierLevels[nextTier]
    var nextChanges = nextTd ? nextTd['属性变更'] : null
    if (nextChanges && nextChanges !== '无变更' && typeof nextChanges === 'object') {
      nextEff = Object.assign({}, eff)
      Object.entries(nextChanges).forEach(function([k, v]) { nextEff[k] = v })
    }
  }
  return Object.entries(eff)
    .filter(function([k]) { return !k.startsWith('自定义属性') && k !== '出售价格' && k !== '购买价格' })
    .slice(0, 8)
    .map(function([k, v]) {
      var nextVal = null
      if (nextEff && nextEff[k] !== undefined && nextEff[k] !== v) {
        nextVal = fmtTimeVal(k, nextEff[k])
      }
      return {
        label: TIER_ATTR_ZH[k] || k,
        value: fmtTimeVal(k, v),
        nextVal: nextVal
      }
    })
}

// Load items
onMounted(async () => {
  const cache = await dataStore.ensureAllItemsCache()
  boardItems.value = (cache?.['物品'] || []).map(item => ({
    name: item['名称'], nameEn: item['英文名'],
    size: item['大小'], tier: item['基础品质'] || '',
    img: item['图片链接'] || '',
    tags: item['显示标签'] || [],
    desc: item['效果说明'] || [],
    tierLevels: item['品质层级'] || {},
    baseAttrs: item['基础属性'] || {},
  }))
  boardSkillsList.value = (cache?.['技能'] || []).map(item => ({
    name: item['名称'], nameEn: item['英文名'],
    size: item['大小'], tier: item['基础品质'] || '',
    img: item['图片链接'] || '',
    tags: item['显示标签'] || [],
    desc: item['效果说明'] || [],
    tierLevels: item['品质层级'] || {},
    baseAttrs: item['基础属性'] || {},
  }))
  if (route.hash && route.hash.startsWith('#board=')) {
    restoreFromHash(route.hash.substring(7))
  }
  await nextTick()
  renderOverlays()
})

// Search
function onItemSearch() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) { itemSearchResults.value = []; return }
  itemSearchResults.value = boardItems.value.filter(item =>
    item.name.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q)
  ).slice(0, 20)
}
function onSkillSearch() {
  const q = skillQuery.value.trim().toLowerCase()
  if (!q) { skillSearchResults.value = []; return }
  skillSearchResults.value = boardSkillsList.value.filter(item =>
    item.name.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q)
  ).slice(0, 20)
}
function isSkillAdded(nameEn) { return addedSkills.value.some(s => s.nameEn === nameEn) }

// Add / Remove Items
function addItem(nameEn) { addItemAt(nameEn, -1, '') }
function addItemAt(nameEn, targetPos, tierOverride) {
  const item = boardItems.value.find(it => it.nameEn === nameEn)
  if (!item) return
  const slotSize = BOARD_SIZE_MAP[item.size] || 1
  let startIdx = targetPos >= 0 ? targetPos : -1
  if (startIdx < 0 || startIdx + slotSize > 10) {
    startIdx = -1
    for (let i = 0; i <= 10 - slotSize; i++) {
      let free = true
      for (let j = 0; j < slotSize; j++) { if (slots[i + j] !== null) { free = false; break } }
      if (free) { startIdx = i; break }
    }
  } else {
    for (let j = 0; j < slotSize; j++) { if (slots[startIdx + j] !== null) { startIdx = -1; break } }
  }
  if (startIdx === -1) return
  const uid = ++uidCounter.value
  const curTier = tierOverride || item.tier
  const entry = { name: item.name, nameEn: item.nameEn, size: item.size, uid, spanStart: startIdx, spanSize: slotSize, img: item.img, tier: item.tier, currentTier: curTier, desc: item.desc, tierLevels: item.tierLevels, tags: item.tags, baseAttrs: item.baseAttrs }
  for (let j = 0; j < slotSize; j++) { slots[startIdx + j] = { ...entry } }
  removedItems.value = removedItems.value.filter(r => r.uid !== uid)
  searchQuery.value = ''
  itemSearchResults.value = []
  nextTick(() => renderOverlays())
}
function removeItem(uid) {
  const slotEntry = slots.find(s => s && s.uid === uid)
  if (!slotEntry) return
  removedItems.value.push({ name: slotEntry.name, nameEn: slotEntry.nameEn, size: slotEntry.size, uid })
  for (let i = 0; i < 10; i++) { if (slots[i] && slots[i].uid === uid) slots[i] = null }
  nextTick(() => renderOverlays())
}
function reAddItem(uid) {
  const item = removedItems.value.find(r => r.uid === uid)
  if (item) addItem(item.nameEn)
}

// Skills
function toggleSkill(nameEn) {
  if (isSkillAdded(nameEn)) {
    addedSkills.value = addedSkills.value.filter(s => s.nameEn !== nameEn)
  } else {
    const skill = boardSkillsList.value.find(s => s.nameEn === nameEn)
    if (!skill) return
    addedSkills.value.push({ name: skill.name, nameEn: skill.nameEn, img: skill.img, tier: skill.tier, currentTier: skill.tier, desc: skill.desc, tierLevels: skill.tierLevels, size: skill.size, tags: skill.tags, baseAttrs: skill.baseAttrs })
  }
  skillQuery.value = ''
  skillSearchResults.value = []
}
function removeSkill(nameEn) { addedSkills.value = addedSkills.value.filter(s => s.nameEn !== nameEn) }

// Slot class
function slotClass(idx) {
  if (!slots[idx]) return ''
  const s = slots[idx]
  const cls = []
  if (idx === s.spanStart) {
    cls.push('occupied')
    cls.push(BOARD_SIZE_CLASS[s.size] || '')
  } else {
    cls.push('span-cont')
  }
  return cls
}

// Render overlays using getBoundingClientRect
function renderOverlays() {
  if (!slotsEl.value) return
  const slotsContainer = slotsEl.value
  slotsContainer.querySelectorAll('.board-item-overlay').forEach(el => el.remove())
  const slotEls = slotsContainer.querySelectorAll('.board-slot')
  const containerRect = slotsContainer.getBoundingClientRect()
  const rendered = new Set()
  for (let i = 0; i < 10; i++) {
    const slot = slots[i]
    if (slot && slot.spanStart === i && !rendered.has(slot.uid)) {
      rendered.add(slot.uid)
      const startRect = slotEls[i].getBoundingClientRect()
      const endIdx = i + slot.spanSize - 1
      const endRect = slotEls[endIdx].getBoundingClientRect()
      const left = startRect.left - containerRect.left
      const width = endRect.right - startRect.left
      const ov = document.createElement('div')
      ov.className = 'board-item-overlay'
      ov.style.left = left + 'px'
      ov.style.width = width + 'px'
      ov.style.top = '2px'
      ov.style.bottom = '2px'
      ov.setAttribute('data-uid', slot.uid)
      const tierB = tierBorder(slot.currentTier)
      const imgHtml = slot.img
        ? '<div class="bio-img" style="background-image:url(\'' + slot.img + '\')"></div>'
        : '<div class="bio-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>'
      ov.innerHTML = imgHtml + '<div class="bio-tier-border" style="border-color:' + tierB + '"></div><span class="bio-name">' + slot.name + '</span>'
      ov.addEventListener('pointerdown', function(e) { dragStart(e, slot.uid) })
      ov.addEventListener('click', function(e) {
        if (dragState.moved) return
        e.stopPropagation()
        showBubble({ ...slot, _uid: slot.uid, _isSkill: false }, false)
      })
      slotsContainer.appendChild(ov)
    }
  }
}

// Info Bubble
function showBubble(data, isSkill) {
  bubbleData.value = { ...data, _isSkill: isSkill }
}
function closeBubble() { bubbleData.value = null }
function doUpgrade() {
  if (!bubbleData.value) return
  const d = bubbleData.value
  if (d._isSkill) {
    const skill = addedSkills.value.find(s => s.nameEn === d.nameEn)
    if (!skill) return
    const all = bubbleAllTiers.value
    const curIdx = all.indexOf(skill.currentTier || skill.tier)
    skill.currentTier = curIdx < all.length - 1 ? all[curIdx + 1] : all[0]
  } else {
    const uid = d._uid
    const all = bubbleAllTiers.value
    const slotEntry = slots.find(s => s && s.uid === uid)
    if (!slotEntry) return
    const curIdx = all.indexOf(slotEntry.currentTier || slotEntry.tier)
    const nextTier = curIdx < all.length - 1 ? all[curIdx + 1] : all[0]
    for (let i = 0; i < 10; i++) { if (slots[i] && slots[i].uid === uid) slots[i].currentTier = nextTier }
  }
  closeBubble()
  nextTick(function() {
    renderOverlays()
    if (d._isSkill) {
      const s = addedSkills.value.find(function(sk) { return sk.nameEn === d.nameEn })
      if (s) showBubble({ ...s, _isSkill: true }, true)
    } else {
      const slot = slots.find(function(s) { return s && s.uid === d._uid })
      if (slot) showBubble({ ...slot, _uid: slot.uid, _isSkill: false }, false)
    }
  })
}

// Screenshot
function toggleScreenshot() { screenshotMode.value = !screenshotMode.value }

// Share
function shareLineup() {
  const items = []
  const seen = new Set()
  for (let i = 0; i < 10; i++) {
    const slot = slots[i]
    if (slot && !seen.has(slot.uid)) {
      seen.add(slot.uid)
      let code = slot.nameEn + '@' + slot.spanStart
      if (slot.currentTier && slot.currentTier !== slot.tier) code += ':' + slot.currentTier
      items.push(code)
    }
  }
  const skills = addedSkills.value.map(function(s) {
    let code = 's:' + s.nameEn
    if (s.currentTier && s.currentTier !== s.tier) code += ':' + s.currentTier
    return code
  })
  const all = items.concat(skills)
  if (!all.length) { alert('当前布阵区为空，请先添加物品或技能'); return }
  const code = btoa(unescape(encodeURIComponent(all.join('|'))))
  const url = window.location.origin + '/board#board=' + code
  navigator.clipboard.writeText(url).then(function() { alert('已复制分享链接') }).catch(function() { prompt('复制以下链接：', url) })
}

// Restore from hash
function restoreFromHash(code) {
  if (!code) return
  var parts
  try { parts = decodeURIComponent(escape(atob(code))).split('|') } catch(e) { return }
  for (var i = 0; i < 10; i++) slots[i] = null
  removedItems.value = []
  uidCounter.value = 0
  addedSkills.value = []
  if (!boardItems.value.length) return
  for (var p = 0; p < parts.length; p++) {
    var part = parts[p]
    if (part.indexOf('s:') === 0) {
      var rest = part.substring(2)
      var colonIdx = rest.lastIndexOf(':')
      var nameEn = colonIdx >= 0 ? rest.substring(0, colonIdx) : rest
      var tierOverride = colonIdx >= 0 ? rest.substring(colonIdx + 1) : ''
      var skill = boardSkillsList.value.find(function(s) { return s.nameEn === nameEn })
      if (skill) {
        addedSkills.value.push({ name: skill.name, nameEn: skill.nameEn, img: skill.img, tier: skill.tier, currentTier: tierOverride || skill.tier, desc: skill.desc, tierLevels: skill.tierLevels, tags: skill.tags })
      }
    } else {
      var atIdx = part.indexOf('@')
      var cIdx = atIdx >= 0 ? part.indexOf(':', atIdx + 1) : part.indexOf(':')
      var nEn = atIdx >= 0 ? part.substring(0, atIdx) : (cIdx >= 0 ? part.substring(0, cIdx) : part)
      var pos = atIdx >= 0 ? parseInt(part.substring(atIdx + 1, cIdx >= 0 ? cIdx : undefined)) : -1
      var tOvr = cIdx >= 0 ? part.substring(cIdx + 1) : ''
      addItemAt(nEn, isNaN(pos) ? -1 : pos, tOvr)
    }
  }
  nextTick(function() { renderOverlays() })
}

// Drag & Drop
var dragState = { uid: null, moved: false, startX: 0, startY: 0, spanStart: 0, spanSize: 0, img: '', name: '', nameEn: '', pointerId: null }

function dragStart(e, uid) {
  var slotData = slots.find(function(s) { return s && s.uid === uid })
  if (!slotData) return
  e.preventDefault()
  dragState.uid = uid
  dragState.moved = false
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.spanStart = slotData.spanStart
  dragState.spanSize = slotData.spanSize
  dragState.img = slotData.img
  dragState.name = slotData.name
  dragState.nameEn = slotData.nameEn
  dragState.pointerId = e.pointerId
  e.currentTarget.setPointerCapture(e.pointerId)
  document.addEventListener('pointermove', dragMove, { passive: false })
  document.addEventListener('pointerup', dragEnd)
  document.addEventListener('pointercancel', dragEnd)
}
function dragMove(e) {
  if (!dragState.uid) return
  e.preventDefault()
  var dx = e.clientX - dragState.startX
  var dy = e.clientY - dragState.startY
  if (!dragState.moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return
  if (!dragState.moved) {
    dragState.moved = true
    if (!slotsEl.value) return
    var slotEls = slotsEl.value.querySelectorAll('.board-slot')
    var startRect = slotEls[dragState.spanStart].getBoundingClientRect()
    var endIdx = dragState.spanStart + dragState.spanSize - 1
    var endRect = slotEls[endIdx].getBoundingClientRect()
    var gw = endRect.right - startRect.left
    var gh = startRect.height
    dragGhostVisible.value = true
    dragGhostStyle.value = {
      width: gw + 'px',
      height: gh + 'px',
      left: (e.clientX - gw / 2) + 'px',
      top: (e.clientY - gh / 2) + 'px',
      backgroundImage: dragState.img ? 'url("' + dragState.img + '")' : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    var ov = slotsEl.value.querySelector('.board-item-overlay[data-uid="' + dragState.uid + '"]')
    if (ov) ov.classList.add('is-dragging')
  }
  var gw2 = parseInt(dragGhostStyle.value.width) || 44
  var gh2 = parseInt(dragGhostStyle.value.height) || 44
  dragGhostStyle.value.left = (e.clientX - gw2 / 2) + 'px'
  dragGhostStyle.value.top = (e.clientY - gh2 / 2) + 'px'
  if (slotsEl.value) {
    slotsEl.value.querySelectorAll('.drop-target').forEach(function(el) { el.classList.remove('drop-target') })
    var targetIdx = getSlotAt(e.clientX, e.clientY)
    if (targetIdx >= 0 && canPlace(targetIdx, dragState.spanSize, dragState.uid)) {
      var slotEls2 = slotsEl.value.querySelectorAll('.board-slot')
      for (var j = 0; j < dragState.spanSize && (targetIdx + j) < 10; j++) {
        slotEls2[targetIdx + j].classList.add('drop-target')
      }
    }
  }
}
function dragEnd(e) {
  document.removeEventListener('pointermove', dragMove)
  document.removeEventListener('pointerup', dragEnd)
  document.removeEventListener('pointercancel', dragEnd)
  dragGhostVisible.value = false
  if (slotsEl.value) slotsEl.value.querySelectorAll('.drop-target').forEach(function(el) { el.classList.remove('drop-target') })
  if (dragState.moved) {
    var targetIdx = getSlotAt(e.clientX, e.clientY)
    if (targetIdx >= 0) reposition(dragState.uid, targetIdx)
    else renderOverlays()
  }
  dragState.uid = null
  dragState.moved = false
}
function getSlotAt(x, y) {
  if (!slotsEl.value) return -1
  var slotEls = slotsEl.value.querySelectorAll('.board-slot')
  for (var i = 0; i < slotEls.length; i++) {
    var r = slotEls[i].getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i
  }
  return -1
}
function canPlace(startIdx, size, ignoreUid) {
  if (startIdx < 0 || startIdx + size > 10) return false
  for (var j = 0; j < size; j++) {
    var s = slots[startIdx + j]
    if (s !== null && s.uid !== ignoreUid) return false
  }
  return true
}
function reposition(uid, newStart) {
  var item = slots.find(function(s) { return s && s.uid === uid })
  if (!item) return
  if (newStart === item.spanStart) return
  if (!canPlace(newStart, item.spanSize, uid)) { renderOverlays(); return }
  for (var i = 0; i < 10; i++) { if (slots[i] && slots[i].uid === uid) slots[i] = null }
  var entry = Object.assign({}, item, { spanStart: newStart })
  for (var j = 0; j < item.spanSize; j++) { slots[newStart + j] = Object.assign({}, entry) }
  nextTick(function() { renderOverlays() })
}

// Re-render overlays on window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', function() { nextTick(function() { renderOverlays() }) })
}
</script>

<style scoped>
.board-viewer {
    display: none;
    padding: 16px;
  }
  .board-viewer.active { display: block; }
  .board-search-area { position: relative; margin-bottom: 16px; }
  .board-search-input {
    width: 100%; padding: 10px 14px; border: 2px solid var(--border);
    border-radius: 8px; background: var(--surface2); color: var(--text);
    font-size: 14px; box-sizing: border-box;
  }
  .board-search-input:focus { outline: none; border-color: var(--accent); }
  .board-search-results {
    position: absolute; top: 100%; left: 0; right: 0;
    max-height: 240px; overflow-y: auto; background: var(--surface2);
    border: 2px solid var(--border); border-top: none;
    border-radius: 0 0 8px 8px; z-index: 100; display: none;
  }
  .board-search-results.show { display: block; }
  .board-search-item {
    padding: 6px 10px; cursor: pointer; display: flex;
    align-items: center; gap: 8px; border-bottom: 1px solid var(--border);
  }
  .board-search-item:hover { background: var(--surface); }
  .board-search-item .bsi-img {
    width: 40px; height: 40px; border-radius: 7px; object-fit: cover;
    flex-shrink: 0; background: var(--surface);
  }
  .board-search-item .bsi-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .board-search-item .bsi-row1 { display: flex; align-items: center; gap: 6px; }
  .board-search-item .bsi-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .board-search-item .bsi-tier {
    font-size: 9px; padding: 1px 5px; border-radius: 3px;
    font-weight: bold; flex-shrink: 0;
  }
  .board-search-item .bsi-row2 { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .board-search-item .bsi-en { color: var(--text2); font-size: 11px; }
  .board-search-item .bsi-tag {
    font-size: 9px; padding: 0 4px; border-radius: 3px;
    background: var(--surface); color: var(--text2); border: 1px solid var(--border);
  }
  .board-search-item .bsi-size {
    font-size: 10px; padding: 1px 6px; border-radius: 4px;
    font-weight: bold; color: #fff; flex-shrink: 0;
  }
  .board-container { margin-bottom: 16px; }
  .board-slots {
    display: flex; gap: 2px; background: var(--surface);
    padding: 4px; border-radius: 8px;
    position: relative; aspect-ratio: 5 / 1;
    touch-action: none;
  }
  .board-slot {
    flex: 1; background: var(--surface2);
    border: 1px dashed var(--border); border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--text2); position: relative;
    flex-direction: column;
  }
  .board-slot.occupied { border-style: solid; cursor: pointer; }
  :deep(.board-item-overlay) {
    position: absolute; top: 2px; bottom: 2px;
    pointer-events: auto; z-index: 2;
    overflow: hidden; border-radius: 4px; cursor: grab;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
  }
  :deep(.board-item-overlay .bio-img) {
    width: 100%; height: 100%;
    position: absolute; top: 0; left: 0; z-index: 0;
    pointer-events: none;
    background-size: cover; background-position: center;
    background-repeat: no-repeat;
    border-radius: 4px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
  :deep(.board-item-overlay .bio-name) {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
    font-size: 9px; font-weight: bold; color: #fff;
    text-align: center; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    background: rgba(0,0,0,0.6); padding: 2px 2px;
    pointer-events: none;
  }
  .board-item-chips {
    display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;
    justify-content: center;
  }
  .board-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 12px;
    font-size: 11px; font-weight: 500;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); cursor: default;
  }
  .board-chip .chip-img {
    width: 18px; height: 18px; border-radius: 3px;
    object-fit: cover;
  }
  .board-chip .chip-remove {
    width: 16px; height: 16px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; cursor: pointer;
    color: var(--text2); background: rgba(255,255,255,0.08);
    transition: all 0.15s;
  }
  .board-chip .chip-remove:hover { color: #e74c3c; background: rgba(231,76,60,0.15); }
  .board-info-row {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; margin-top: 8px;
  }
  .board-save-btn {
    padding: 4px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 500;
    background: var(--accent); color: #fff;
    border: none; cursor: pointer;
    transition: opacity 0.15s;
  }
  .board-save-btn:hover { opacity: 0.85; }
  .board-save-btn:active { transform: scale(0.97); }
  .board-share-btn {
    padding: 4px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 500;
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); cursor: pointer;
  }
  .board-share-btn:hover { opacity: 0.85; }
  .board-share-btn:active { transform: scale(0.97); }

  /* Skill section */
  .skill-section {
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .skill-section-title {
    font-size: 14px; font-weight: 600;
    color: var(--text); margin-bottom: 8px;
  }
  .skill-list {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: flex-start; min-height: 44px;
    padding: 4px 0;
  }
  .skill-icon-item {
    position: relative; width: 44px;
    display: flex; flex-direction: column;
    align-items: center; flex-shrink: 0;
    cursor: pointer;
  }
  .skill-icon-item .skill-circle {
    width: 44px; height: 44px;
    border-radius: 50%; overflow: hidden;
    border: 2px solid var(--accent);
  }
  .skill-icon-item img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .skill-icon-item .skill-name-label {
    font-size: 9px; color: var(--text2);
    margin-top: 2px; text-align: center;
    max-width: 52px; line-height: 1.1;
    overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap;
  }
  .skill-icon-item .skill-remove {
    position: absolute; top: -2px; right: -2px;
    width: 16px; height: 16px; border-radius: 50%;
    font-size: 9px; cursor: pointer; z-index: 2;
    color: #fff; background: rgba(231,76,60,0.9);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
  }
  .skill-icon-item:hover .skill-remove { opacity: 1; }

  /* Bottom actions */
  .board-bottom-actions {
    display: flex; gap: 10px; justify-content: center;
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  /* Info bubble */
  .board-info-bubble-backdrop {
    position: fixed; inset: 0; z-index: 199;
    background: rgba(0,0,0,0.5);
    animation: backdropIn 0.15s ease-out;
  }
  @keyframes backdropIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  .board-info-bubble {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg); border: 2px solid var(--border);
    border-radius: 14px; padding: 18px; z-index: 200;
    max-width: 340px; width: 92vw;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    animation: bubbleIn 0.18s ease-out;
  }
  @keyframes bubbleIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .bubble-close {
    position: absolute; top: 8px; right: 10px;
    font-size: 18px; cursor: pointer; color: var(--text2);
    width: 24px; height: 24px; display: flex;
    align-items: center; justify-content: center;
    border-radius: 50%; transition: all 0.15s;
    background: transparent; border: none; z-index: 5;
  }
  .bubble-close:hover { color: #e74c3c; background: rgba(231,76,60,0.1); }
  .bubble-header { display: flex; gap: 12px; align-items: center; }
  .bubble-img {
    width: 56px; height: 56px; border-radius: 12px;
    object-fit: cover; flex-shrink: 0;
    border: 2px solid var(--border);
  }
  .bubble-img.skill-img { border-radius: 50%; }
  .bubble-title { flex: 1; min-width: 0; }
  .bubble-name { font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .bubble-badges { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; align-items: center; }
  .bubble-badges span {
    font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 600;
  }
  .bubble-size { color: #fff; }
  .bubble-tier { font-weight: 700; }
  .bubble-tags { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
  .bubble-tag {
    font-size: 9px; padding: 1px 5px; border-radius: 3px;
    background: var(--surface); color: var(--text2); border: 1px solid var(--border);
  }
  .bubble-divider {
    height: 1px; background: var(--border); margin: 12px 0;
  }
  .bubble-desc {
    font-size: 12px; color: var(--text2); line-height: 1.6;
    max-height: 200px; overflow-y: auto;
  }
  .bubble-desc-line { margin-bottom: 3px; }
  .bubble-type {
    font-size: 10px; font-weight: 600; color: var(--accent);
    margin-right: 4px;
  }
  /* Bubble attributes */
  .bubble-attrs {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  }
  .bubble-attr-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 8px; border-radius: 7px;
    background: var(--surface2); font-size: 12px;
  }
  .bubble-attr-label {
    color: var(--text2); font-weight: 500;
  }
  .bubble-attr-value {
    color: var(--text); font-weight: 700;
  }
  .bubble-attr-next {
    font-size: 10px; color: #2ecc71; margin-left: 4px; font-weight: 600;
  }
  .bubble-level-bar {
    display: flex; align-items: center; gap: 4px;
    margin-top: 12px; padding: 8px 10px;
    background: var(--surface2); border-radius: 8px;
  }
  .bubble-level-label {
    font-size: 11px; font-weight: 600; color: var(--text);
    white-space: nowrap;
  }
  .bubble-level-dots {
    display: flex; gap: 4px; flex: 1; justify-content: center;
  }
  .bubble-level-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid var(--border); transition: all 0.2s;
  }
  .bubble-level-dot.active { border-width: 2px; }
  .bubble-level-dot.current { transform: scale(1.3); box-shadow: 0 0 6px currentColor; }
  .bubble-upgrade {
    margin-top: 10px; text-align: center;
    padding: 8px 14px; border-radius: 12px;
    background: linear-gradient(135deg, var(--accent), #2ecc71);
    border: none; font-size: 13px; font-weight: 600;
    color: #fff; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(46,204,113,0.3);
  }
  .bubble-upgrade:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(46,204,113,0.4); }
  .bubble-upgrade:active { transform: scale(0.97); }
  .bubble-upgrade.max-tier {
    background: linear-gradient(135deg, #c850f0, #9b59b6);
    box-shadow: 0 2px 8px rgba(200,80,240,0.3);
  }

  /* Tier border on board overlay */
  :deep(.bio-tier-border) {
    position: absolute; inset: 0; z-index: 3;
    border-radius: 4px; pointer-events: none;
    border: 3px solid transparent;
    box-sizing: border-box;
  }
  /* Skill tier border */
  .skill-circle.tier-border-bronze { border-color: rgb(180,98,65); }
  .skill-circle.tier-border-silver { border-color: rgb(192,192,192); }
  .skill-circle.tier-border-gold { border-color: rgb(255,215,0); }
  .skill-circle.tier-border-diamond { border-color: rgb(0,255,255); }
  .skill-circle.tier-border-legendary { border-color: #c850f0; }

  /* Screenshot mode: hide UI chrome */
  .board-viewer.screenshot-mode .back-bar,
  .board-viewer.screenshot-mode .board-search-area,
  .board-viewer.screenshot-mode .board-item-chips .chip-remove,
  .board-viewer.screenshot-mode .board-info,
  .board-viewer.screenshot-mode .board-removed,
  .board-viewer.screenshot-mode .skill-section,
  .board-viewer.screenshot-mode .board-bottom-actions,
  .board-viewer.screenshot-mode ~ .app-footer { display: none !important; }
  .board-viewer.screenshot-mode .board-save-btn {
    position: fixed; bottom: 20px; right: 20px; z-index: 100;
    padding: 8px 16px; font-size: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    border-radius: 20px;
  }
  :deep(.board-item-overlay .bio-remove) {
    position: absolute; top: 2px; right: 2px; z-index: 5;
    font-size: 14px; cursor: pointer; pointer-events: auto;
    color: #fff; line-height: 1;
    background: rgba(0,0,0,0.6); border-radius: 50%;
    width: 20px; height: 20px; display: flex;
    align-items: center; justify-content: center;
  }
  :deep(.board-item-overlay .bio-remove:hover) { color: #e74c3c; background: rgba(0,0,0,0.8); }
  :deep(.board-item-overlay.is-dragging) { opacity: 0.25; }
  .board-drag-ghost {
    position: fixed; pointer-events: none; z-index: 10000;
    opacity: 0.85; border-radius: 4px; overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    transform: rotate(1deg); transition: none;
  }
  .board-drag-ghost img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .board-slot.drop-target { outline: 2px dashed #2ecc71; outline-offset: -2px; }
  .board-slot .slot-item-name {
    font-size: 10px; font-weight: bold;
    color: var(--text); text-align: center;
    overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap; max-width: 100%;
    padding: 0 2px; line-height: 1.2;
  }
  .board-slot .slot-remove-btn {
    position: absolute; top: 2px; right: 2px; font-size: 10px;
    color: var(--text2); cursor: pointer; line-height: 1;
  }
  .board-slot .slot-remove-btn:hover { color: #e74c3c; }
  .board-slot.size-small { background: rgba(46,204,113,0.15); border-color: #2ecc71; }
  .board-slot.size-medium { background: rgba(52,152,219,0.15); border-color: #3498db; }
  .board-slot.size-large { background: rgba(155,89,182,0.15); border-color: #9b59b6; }
  .board-slot.span-cont { border-left: none; border-radius: 0 4px 4px 0; }
  .board-slot.span-cont .slot-num { display: none; }
  .board-info {
    text-align: center; margin-top: 8px; font-size: 12px; color: var(--text2);
  }
  .board-removed { margin-top: 12px; }
  .board-removed h4 { color: var(--text2); font-size: 13px; margin-bottom: 6px; }
  .board-removed-item {
    display: inline-block; padding: 4px 10px; margin: 3px;
    border-radius: 7px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--border); background: var(--surface2);
  }
  .board-removed-item:hover { background: var(--surface); }
</style>

