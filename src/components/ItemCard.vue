<template>
  <div
    class="card"
    :class="[cardClass, { 'has-link': !!fullLink }]"
    @click="handleClick"
  >
    <span
      v-if="updateBadge === 'new'"
      class="card-new-badge"
    >NEW</span>
    <span
      v-else-if="updateBadge === 'updated'"
      class="card-updated-badge"
    >UPD</span>
    <span
      v-if="fullLink"
      class="card-ext-link"
    >↗</span>

    <div class="card-header">
      <div
        v-if="isGameData && imgSrc"
        class="card-icon-wrap"
      >
        <img
          class="card-icon-bg"
          :src="imgSrc"
          alt=""
          loading="lazy"
        >
        <img
          class="card-icon-fg"
          :src="fgSrc"
          alt=""
          loading="lazy"
          @error="$event.target.style.display='none'"
        >
      </div>
      <img
        v-else-if="imgSrc"
        class="card-icon"
        :src="imgSrc"
        alt=""
        loading="lazy"
        @error="fallback"
      >
      <div
        v-else
        class="card-icon-fallback"
      >
        {{ fallbackChar }}
      </div>

      <div
        class="card-name"
        style="flex:1"
      >
        {{ name }}
        <small v-if="nameEn && nameEn !== name">{{ nameEn }}</small>
      </div>

      <div class="card-badges">
        <span
          v-if="tier"
          class="badge badge-tier"
          :class="tierCls"
        >{{ tierZh }}</span>
        <span
          v-if="sizeZh && currentTab === 'items'"
          class="badge badge-size"
        >{{ sizeZh }}</span>
        <span
          v-if="type"
          class="badge badge-type"
        >{{ typeZh }}</span>
      </div>
    </div>
    <div
      v-if="diffDetails.basic"
      class="card-basic-diff"
    >
      <span
        v-for="(info, field) in diffDetails.basic"
        :key="field"
        class="basic-diff-item"
      ><span class="diff-old">{{ field }}: {{ info.old }}</span> → <span class="diff-new">{{ info.new }}</span></span>
    </div>

    <div
      v-if="heroesArr.length"
      class="card-heroes"
    >
      <span
        v-for="h in heroesArr"
        :key="h"
        class="hero-tag"
        :style="heroTagStyle(h)"
      >{{ h }}</span>
    </div>

    <div
      v-if="merchDesc"
      class="card-merch-desc"
    >
      🛒 {{ merchDesc }}
    </div>

    <div
      v-if="tooltipLines.length"
      class="card-tooltip"
    >
      <div
        v-for="(tip, i) in tooltipLines"
        :key="i"
      >
        <span
          v-if="tip.type"
          class="tip-type"
        >{{ tip.type }}</span><template v-if="tip.diffOld">
          <span class="diff-old">{{ tip.diffOld }}</span> →
        </template>{{ tip.text }}
      </div>
    </div>

    <div
      v-if="tierLevelRows.length"
      class="card-tier-levels"
    >
      <div
        v-for="row in tierLevelRows"
        :key="row.name"
        class="tl-row"
      >
        <span
          class="tl-tier"
          :class="row.cls"
        >{{ row.name }}</span>
        <span
          class="tl-attrs"
          v-html="row.html"
        />
      </div>
    </div>

    <div
      v-if="evtDesc"
      class="card-event-desc"
    >
      {{ evtDesc }}
    </div>

    <div
      v-if="evtOpts.length"
      class="card-event-opts"
    >
      <div
        v-for="(opt, i) in evtOpts"
        :key="i"
        class="opt-item"
      >
        <img
          v-if="opt['\u56fe\u7247']"
          class="opt-img"
          :src="opt['\u56fe\u7247']"
          loading="lazy"
        >
        <span
          v-else
          class="opt-icon"
        >▸</span>
        <a
          v-if="optLink(opt)"
          class="opt-name"
          :href="optLink(opt)"
          target="_blank"
          rel="noopener"
          @click.stop
        >{{ opt['\u540d\u79f0'] }}</a>
        <span
          v-else
          class="opt-name"
        >{{ opt['\u540d\u79f0'] }}</span>
      </div>
    </div>

    <div
      v-if="monStats.length || monBoard.length"
      class="card-monster-info"
    >
      <div
        v-if="monStats.length"
        class="card-monster-stats"
      >
        <span
          v-for="(s, i) in monStats"
          :key="i"
          class="ms-item"
        >{{ s.icon }} <span class="ms-val">{{ s.val }}</span></span>
      </div>
      <div
        v-if="monBoard.length"
        class="mon-board"
      >
        <div class="mon-board-row">
          <div
            v-for="(b, i) in monBoard"
            :key="i"
            class="mon-board-slot"
            :class="['size-' + (b.sizeShort || 'S'), 'tier-' + (b.tier || 'Bronze')]"
            @click.stop="searchItem(b.name)"
          >
            <div
              class="slot-img-wrap"
              :style="b.img ? { backgroundImage: 'url(' + b.img + ')' } : {}"
            />
            <div class="slot-name">
              {{ b.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="attrEntries.length"
      class="card-attrs"
    >
      <span
        v-for="a in attrEntries"
        :key="a.k"
      ><template v-if="a.oldV !== null"><span class="diff-old">{{ a.label }}: {{ a.oldV }}</span> → </template>{{ a.label }}: <b :class="{ 'diff-new': a.oldV !== null }">{{ a.v }}</b></span>
    </div>

    <div
      v-if="cardTags.length"
      class="card-tags"
    >
      <span
        v-for="t in cardTags"
        :key="t"
        class="card-tag"
      >{{ t }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  TIER_ZH, SIZE_ZH, TIER_ATTR_ZH, TAG_ZH,
  HERO_COLORS, TIER_CLASS
} from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'

const props = defineProps({
  card: { type: Object, default: () => ({}) },
  isGameData: Boolean,
  updateBadge: { type: String, default: '' },
  diffDetails: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['click'])

const filterStore = useFilterStore()
const currentTab = computed(() => filterStore.currentTab)

// Basic fields
const name = computed(() => props.card['\u540d\u79f0'] || props.card['name'] || '')
const nameEn = computed(() => props.card['\u82f1\u6587\u540d'] || props.card['name_en'] || '')
const tier = computed(() => props.card['\u57fa\u7840\u54c1\u8d28'] || '')
const tierZh = computed(() => TIER_ZH[tier.value] || tier.value)
const tierCls = computed(() => TIER_CLASS[normTier(tier.value)] || '')
const sizeZh = computed(() => SIZE_ZH[props.card['\u5927\u5c0f']] || props.card['\u5927\u5c0f'] || '')
const type = computed(() => props.card['\u7c7b\u578b'] || props.card['type'] || '')
const typeZh = computed(() => {
  const t = type.value
  return t === 'Item' ? '\u7269\u54c1' : t === 'Skill' ? '\u6280\u80fd' : t
})
const imgSrc = computed(() => props.card['\u56fe\u7247\u94fe\u63a5'] || props.card['art_large'] || props.card['art'] || '')
const fgSrc = computed(() => imgSrc.value ? imgSrc.value.replace(/(@\d+)/, '_p$1') : '')
const fallbackChar = computed(() => (name.value || '?')[0])
const cardClass = computed(() => 'tier-' + (tier.value || 'bronze').toLowerCase())

// External link
const link = computed(() => props.card['\u8be6\u60c5\u94fe\u63a5'] || props.card['uri'] || '')
const fullLink = computed(() => {
  const l = link.value
  return l && !l.startsWith('http') ? 'https://bazaardb.gg' + l : l
})

// Heroes
const heroes = computed(() => props.card['\u6240\u5c5e\u804c\u4e1a'] || props.card['heroes_zh'] || props.card['heroes'] || [])
const heroesArr = computed(() => {
  const h = heroes.value
  return Array.isArray(h) ? h : h ? [h] : []
})

function heroTagStyle(h) {
  const c = HERO_COLORS[h] || '#555'
  return { background: c + '33', color: c, border: '1px solid ' + c + '55' }
}

// Tags
const rawTags = computed(() => props.card['\u663e\u793a\u6807\u7b7e'] || props.card['tags'] || [])
const cardTags = computed(() => rawTags.value.map(t => TAG_ZH[t] || t))

// Merchant desc
const merchDesc = computed(() => {
  const tags = rawTags.value
  if (!tags.includes('Merchant')) return ''
  return props.card['\u63cf\u8ff0'] || ''
})

// Attributes
const attrs = computed(() => props.card['\u57fa\u7840\u5c5e\u6027'] || {})
const isMerchant = computed(() => rawTags.value.includes('Merchant'))
const filteredAttrs = computed(() => {
  if (isMerchant.value) return {}
  const base = Object.fromEntries(Object.entries(attrs.value).filter(([k]) => !k.startsWith('自定义属性') && k !== '出售价格' && k !== '购买价格'))
  const ad = props.diffDetails?.attrs
  if (ad) {
    for (const [k, info] of Object.entries(ad)) {
      base[k + '_old'] = info.old
    }
  }
  return base
})
const TIME_KEYS = new Set([
  '冷却时间(ms)', 'HasteAmount', 'SlowAmount', 'FreezeAmount'
])

function formatAttrValue(k, v) {
  if (TIME_KEYS.has(k) && typeof v === 'number' && v > 0) {
    const sec = v / 1000
    return (sec % 1 === 0 ? sec.toFixed(0) : sec.toFixed(1)) + 's'
  }
  return v
}

const attrEntries = computed(() =>
  Object.entries(filteredAttrs.value)
    .filter(([k]) => !k.endsWith('_old'))
    .slice(0, 6)
    .map(([k, v]) => {
      const oldVal = filteredAttrs.value[k + '_old']
      return {
        k, label: TIER_ATTR_ZH[k] || k,
        v: formatAttrValue(k, v),
        oldV: oldVal !== undefined ? formatAttrValue(k, oldVal) : null
      }
    })
)

// Tooltips
const rawTooltips = computed(() => props.card['\u6548\u679c\u8bf4\u660e'] || props.card['tooltips'] || [])
const tooltipLines = computed(() => {
  return rawTooltips.value.map((t, i) => {
    const text = typeof t === 'object' ? (t.text || '') : t
    const tipType = typeof t === 'object' ? (t.type || '') : ''
    const resolved = text.replace(/\{(ability|aura)\.(\d+)(?:\.\w+)?\}/g, (m, _type, idx) => {
      const key = '\u81ea\u5b9a\u4e49\u5c5e\u6027' + idx
      return attrs.value[key] != null ? attrs.value[key] : m
    })
    const diffEntry = props.diffDetails?.tooltips?.[i]
    return resolved ? { type: tipType, text: resolved, diffOld: diffEntry?.old || '' } : null
  }).filter(Boolean)
})

// Tier levels
const tierLevels = computed(() => props.card['\u54c1\u8d28\u5c42\u7ea7'] || {})
const tierLevelRows = computed(() => {
  const tierClassMap = {
    '\u94f6': 'tier-silver', '\u91d1': 'tier-gold',
    '\u94bb\u77f3': 'tier-diamond', '\u4f20\u8bf4': 'tier-legendary',
    Bronze: 'tier-bronze', Silver: 'tier-silver', Gold: 'tier-gold',
    Diamond: 'tier-diamond', Legendary: 'tier-legendary'
  }
  return Object.entries(tierLevels.value)
    .filter(([_, v]) => {
      const c = v['\u5c5e\u6027\u53d8\u66f4']
      return c && c !== '\u65e0\u53d8\u66f4' && typeof c === 'object'
    })
    .map(([tName, tData]) => {
      const changes = tData['\u5c5e\u6027\u53d8\u66f4']
      const cls = tierClassMap[tName] || ''
      const td = props.diffDetails?.tiers?.[tName]
      const html = Object.entries(changes)
        .map(([k, v]) => {
          const oldV = td?.[k]
          const prefix = oldV != null ? '<span class="diff-old">' + (TIER_ATTR_ZH[k] || k) + ': ' + formatAttrValue(k, oldV) + '</span> → ' : ''
          return prefix + (TIER_ATTR_ZH[k] || k) + ': <b class="' + (oldV != null ? 'diff-new' : '') + '">' + formatAttrValue(k, v) + '</b>'
        })
        .join(', ')
      return { name: tName, cls, html }
    })
})

// Event data
const evtDesc = computed(() => props.card['\u4e8b\u4ef6\u63cf\u8ff0'] || '')
const evtOpts = computed(() => {
  const opts = props.card['\u4e8b\u4ef6\u9009\u9879'] || []
  return Array.isArray(opts) ? opts : []
})
function optLink(opt) {
  const l = opt['\u94fe\u63a5'] || ''
  return l && !l.startsWith('http') ? 'https://bazaardb.gg' + l : l
}

// Monster data
const monInfo = computed(() => props.card['\u602a\u7269\u4fe1\u606f'] || null)
const monReward = computed(() => props.card['\u6218\u6597\u5956\u52b1'] || null)
const monStats = computed(() => {
  const stats = []
  const info = monInfo.value
  if (info) {
    if (info['\u51fa\u73b0\u5929\u6570']) stats.push({ icon: '\ud83d\udcc5 Day', val: info['\u51fa\u73b0\u5929\u6570'] })
    if (info['\u8840\u91cf']) stats.push({ icon: '\u2764\ufe0f', val: info['\u8840\u91cf'] })
  }
  const reward = monReward.value
  if (reward) {
    if (reward['\u91d1\u5e01']) stats.push({ icon: '\ud83d\udcb0', val: reward['\u91d1\u5e01'] })
    if (reward['\u7ecf\u9a8c']) stats.push({ icon: '\u2b50', val: reward['\u7ecf\u9a8c'] })
  }
  return stats
})
const monBoard = computed(() => {
  const board = monInfo.value?.['\u7269\u54c1\u680f'] || []
  const sizeMap = { Small: 'S', Medium: 'M', Large: 'L' }
  return board.map(b => ({
    name: b['\u540d\u79f0'] || '',
    img: b['\u56fe\u7247'] || '',
    sizeShort: sizeMap[b['\u5927\u5c0f']] || 'S',
    tier: b['\u54c1\u8d28'] || 'Bronze'
  }))
})

function handleClick() {
  if (fullLink.value) {
    window.open(fullLink.value, '_blank')
  }
  emit('click', props.card)
}

function searchItem(itemName) {
  if (itemName) filterStore.searchQuery = itemName
}

function fallback(e) {
  e.target.outerHTML = '<div class="card-icon-fallback">' + fallbackChar.value + '</div>'
}

function normTier(t) {
  if (!t) return ''
  const tl = t.toLowerCase()
  if (tl.includes('legend')) return 'Legendary'
  if (tl.includes('diam')) return 'Diamond'
  if (tl.includes('gold')) return 'Gold'
  if (tl.includes('silv')) return 'Silver'
  if (tl.includes('bron')) return 'Bronze'
  return t
}
</script>
