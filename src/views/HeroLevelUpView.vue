<template>
  <div class="levelup-view active">
    <div class="back-bar">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <span class="data-source">英雄升级选项</span>
    </div>

    <div v-if="loading" class="loading"><div class="spinner" /></div>

    <template v-else>
      <div class="hero-tabs">
        <button
          v-for="h in heroTabs" :key="h"
          class="hero-tab"
          :class="{ active: selectedHero === h }"
          @click="selectedHero = h"
        >
          {{ heroName(h) }}
        </button>
      </div>

      <div class="filter-bar">
        <label class="filter-toggle">
          <input type="checkbox" v-model="showInspired">
          <span>显示"受X启发"事件</span>
        </label>
        <span class="filter-hint">（非本英雄专属的通用插槽解锁事件，如"受卡诺克启发"等）</span>
      </div>

      <div class="levelup-body">
        <div v-for="section in filteredSections" :key="section.level" class="level-section">
          <div class="level-header" @click="toggleLevel(section.level)">
            <span class="level-num">Level {{ section.level }}</span>
            <span class="level-count">{{ section.cards.length }} 个选项</span>
            <span class="level-arrow">{{ openLevels.has(section.level) ? '▼' : '▶' }}</span>
          </div>
          <div v-if="openLevels.has(section.level)" class="level-cards">
            <div v-for="card in section.cards" :key="card.Id + card.Title.Text" class="lu-card">
              <div class="lu-card-art-wrap">
                <img v-if="card.Art" :src="card.Art" class="lu-card-art-bg" :alt="card.Title.Text" loading="lazy">
                <img v-if="card.ArtFg" :src="card.ArtFg" class="lu-card-art-fg" :alt="card.Title.Text" loading="lazy">
              </div>
              <div class="lu-card-body">
                <div class="lu-card-top">
                  <span class="lu-card-title">{{ cardTitle(card) }}</span>
                  <span class="lu-card-tier" :class="'tier-' + (card.BaseTier || '').toLowerCase()">{{ tierZh(card.BaseTier) }}</span>
                </div>
                <div class="lu-card-type">{{ typeZh(card.Type) }}</div>
                <div class="lu-card-desc">{{ resolveDesc(card) }}</div>
                                <div v-if="card.EventOptionPoolTemplates && card.EventOptionPoolTemplates.length" class="lu-card-options">
                  <div class="options-label">选项：</div>
                  <div v-for="(opt, oi) in card.EventOptionPoolTemplates" :key="oi" class="option-chip">
                    <img v-if="opt.art" :src="opt.art" class="option-art" loading="lazy">
                    <span>{{ opt.title || '选项' }}</span>
                    <span v-if="opt.tierOverride" class="opt-tier" :class="'tier-' + opt.tierOverride.toLowerCase()">{{ tierZh(opt.tierOverride) }}</span>
                  </div>
                </div>
                <div class="lu-card-heroes">
                  <span v-for="hero in card.Heroes" :key="hero" class="hero-tag">{{ heroName(hero) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore, HERO_DISPLAY, TIER_ZH } from '@/stores/dataStore'
import { resolvePlaceholders } from '@/composables/usePlaceholder'

const router = useRouter()
const dataStore = useDataStore()
const loading = ref(true)
const selectedHero = ref('全部')
const showInspired = ref(false)
const openLevels = reactive(new Set())
const rawData = ref(null)

const heroTabs = computed(() => {
  if (!rawData.value) return ['全部']
  return ['全部', ...(rawData.value.heroes || [])]
})

function heroName(name) {
  return HERO_DISPLAY[name] || name
}

function tierZh(tier) {
  const display = { 'Bronze': '青铜', 'Silver': '白银', 'Gold': '黄金', 'Diamond': '钻石', 'Legendary': '传奇' }
  return display[tier] || TIER_ZH[tier] || tier || ''
}

const TYPE_ZH = {
  'EventEncounter': '事件遭遇',
  'EncounterStep': '遭遇步骤',
  'PedestalEncounter': '基座遭遇'
}
function typeZh(t) { return TYPE_ZH[t] || t }

const TITLE_ZH = {
  'Pip': '皮普', 'Shiny!': '闪闪发光！', 'Inspired by Karnok': '受卡诺克启发',
  'Inspired by Jules: Stove': '受朱尔斯启发：炉子', 'Inspired by Jules: Cooler': '受朱尔斯启发：冷却器',
  'Adira': '阿迪拉', 'Ammo Cache': '弹药库', 'Appraisal': '鉴定',
  'Arcane Abyss': '奥术深渊', 'Argenta': '阿尔根塔', 'Arms Locker': '武器柜',
  'B1&B2': 'B1&B2', 'BeFriend': '结交伙伴', 'Bjorn': '比约恩',
  'Bladeborn Badlands': '刃生荒地', 'Burning Caldera': '燃烧火山口',
  'C4': 'C4', 'Candy Collector': '糖果收集者', 'Capital Gains': '资本收益',
  'Catalyst': '催化剂', 'Celestial Conduit': '天界通道', 'Chef Brolin': '厨师布洛林',
  'Coin Collector': '硬币收集者', 'Core Initialization': '核心初始化',
  'Core Upgrade': '核心升级', 'Cymon': '西蒙',
  'Forged Fortune': '锻造财富', 'Forja': '弗尔贾', 'Fortis': '福尔蒂斯',
  'Get Bronze Loot': '获得青铜战利品', 'Get Bronze item': '获得青铜物品',
  'Get Diamond Loot': '获得钻石战利品', 'Get Diamond item': '获得钻石物品',
  'Get Gold Loot': '获得黄金战利品', 'Get Gold item': '获得黄金物品',
  'Get Silver Loot': '获得白银战利品', 'Get Silver item': '获得白银物品',
  'Go Fishing': '去钓鱼', 'Golden Harvest': '黄金丰收',
  'Gourmet Kitchen': '美食厨房', "Guardian's Gorge": '守护者峡谷',
  'Hearty Breakfast': '丰盛早餐', 'Just Keep Moving': '继续前进',
  'Kelsa': '凯尔萨', 'Languid Dunes': '慵懒沙丘', 'Load Up': '装弹',
  'Malafang': '玛拉方', 'Meal Prep': '备餐', 'Mossy Ridge': '苔藓山脊',
  'Mr. Tuskari': '塔斯卡里先生', 'Murkwood Bayou': '暗木沼泽',
  'Nonna': '诺娜', 'Old Memories': '旧回忆', 'Old Zane': '老赞恩',
  'Orlin': '奥林', 'Potion Rack': '药水架', 'Power Up': '充能',
  'Prepared for Anything': '万全准备', 'Professor Riggle': '里格尔教授',
  'Prosperous Estates': '繁荣地产', 'Rageforge': '怒锻',
  'Reagent Shelf': '原料架', 'Regenald': '雷格纳尔德',
  'Ryukon': '柳空', 'Sanguine Valley': '血色山谷',
  'Side Hustle': '副业', 'Sirocco Steppe': '西洛科草原',
  'Slohmor Lumbra': '斯洛摩·伦布拉', 'Take Flight': '起飞',
  'Tool Up': '工具升级', 'Tranquil Spring': '宁静之泉',
  'Uncle Odi': '奥迪叔叔', 'Vermir': '弗米尔',
  'Yetarian Tomb': '耶塔里安之墓', 'Zara': '扎拉', 'Zosima': '佐西马'
}

const DESC_ZH = {
  'Gives you {ability.0} Gold and teaches Bronze-tier Skills': '给予你 {ability.0} 金币并教授青铜级技能',
  'Choose an enchanted small Bronze-tier item': '选择一件附魔的小型青铜物品',
  "Gain Karnok's Rage skill to generate Rage on item use": '获得卡诺克的狂暴技能，使用物品时产生狂暴',
  'One of your slots becomes a Stove (The item here is Heated)': '你的一个插槽变为炉子（此处的物品被加热）',
  'One of your slots becomes a Cooler (The item here is Chilled)': '你的一个插槽变为冷却器（此处的物品被冷却）',
  'Teaches Diamond-tier Skills': '教授钻石级技能',
  'Get a Silver-tier Gunpowder (+Ammo)': '获得一件白银级火药（+弹药）',
  'Your leftmost item gains {ability.0} Value': '你最左侧的物品获得 {ability.0} 价值',
  'Enchant an item with Shiny (doubling or multicast effects)': '为物品附魔"闪闪发光"（翻倍或多重施法效果）',
  'Teaches Silver-tier Skills': '教授白银级技能',
  'Get a Bronze-tier Weapon': '获得一件青铜级武器',
  'Upgrade a Bronze-tier item': '升级一件青铜级物品',
  'Get a Bronze-tier Friend': '获得一件青铜级伙伴',
  'Teaches Freeze skills': '教授冻结技能',
  'Enchant an item with Deadly (Crit Chance effects)': '为物品附魔"致命"（暴击率效果）',
  'Enchant an item with Fiery (Burn effects)': '为物品附魔"烈焰"（燃烧效果）',
  'Teaches Ammo skills': '教授弹药技能',
  'Get {ability.0} Bronze-tier Chocolate Bar or Gumball': '获得 {ability.0} 件青铜级巧克力棒或口香糖',
  'Gain {ability.0} Income. If you have at least 25 Gold, gain an additional {ability.1}': '获得 {ability.0} 收入。如果你至少有25金币，额外获得 {ability.1}',
  'Get {ability.0} Gold and a Catalyst': '获得 {ability.0} 金币和一个催化剂',
  'Enchant an item with Radiant (Freeze, Slow and Destroy reduction effects)': '为物品附魔"光辉"（冻结、减速和摧毁减少效果）',
  'Get a consultation to improve your kitchen': '获得咨询来改进你的厨房',
  'Get {ability.0} Bronze-tier Spare Change': '获得 {ability.0} 件青铜级零钱',
  'Choose a Core': '选择一个核心',
  'Upgrade your Bronze and Silver-tier Cores': '升级你的青铜和白银级核心',
  'Teaches skills unique to Dooley': '教授杜利专属技能',
  'Gain {ability.0.mod} Gold for each Weapon or Tool you have (including Stash)': '每件你拥有的武器或工具获得 {ability.0.mod} 金币（含背包）',
  'Upgrade an item': '升级一件物品',
  'Teaches Shield skills': '教授护盾技能',
  'Get {ability.0} Gold and a Bronze-tier Loot item': '获得 {ability.0} 金币和一件青铜级战利品',
  'Get a Bronze-tier item': '获得一件青铜级物品',
  'Get {ability.0} Gold and a Diamond-tier Loot item': '获得 {ability.0} 金币和一件钻石级战利品',
  'Get a Diamond-tier item': '获得一件钻石级物品',
  'Get {ability.0} Gold and a Gold-tier Loot item': '获得 {ability.0} 金币和一件黄金级战利品',
  'Get a Gold-tier item': '获得一件黄金级物品',
  'Get {ability.0} Gold and a Silver-tier Loot item': '获得 {ability.0} 金币和一件白银级战利品',
  'Get a Silver-tier item': '获得一件白银级物品',
  'Get a Bronze-tier Aquatic item': '获得一件青铜级水系物品',
  'Gain {ability.0.mod} Gold for each Food or Tool you have (including Stash)': '每件你拥有的食物或工具获得 {ability.0.mod} 金币（含背包）',
  'Enchant an item with Shielded (Shield effects)': '为物品附魔"护盾"（护盾效果）',
  'Gain 10% Max Health': '获得10%最大生命值',
  'Gain {ability.0.mod} Gold for each Vehicle or Drone you have (including Stash)': '每件你拥有的载具或无人机获得 {ability.0.mod} 金币（含背包）',
  'Teaches skills unique to Karnok': '教授卡诺克专属技能',
  'Enchant an item with Heavy (Slow effects)': '为物品附魔"沉重"（减速效果）',
  'Get a Bronze-tier Ammo item': '获得一件青铜级弹药物品',
  'Teaches Burn skills': '教授燃烧技能',
  'Get a Silver-tier Food': '获得一件白银级食物',
  'Enchant an item with Mossy (Regen effect)': '为物品附魔"苔藓"（再生效果）',
  'Teaches skills unique to Pygmalien': '教授皮格马利安专属技能',
  'Enchant an item with Toxic (Poison effect)': '为物品附魔"剧毒"（中毒效果）',
  'Teaches Jules Skills': '教授朱尔斯技能',
  'Gain {ability.0.mod} Gold for each Friend or Relic you have (including Stash)': '每件你拥有的伙伴或遗物获得 {ability.0.mod} 金币（含背包）',
  'Teaches skills unique to Vanessa': '教授瓦妮莎专属技能',
  'Teaches Gold-tier Skills': '教授黄金级技能',
  'Get a Bronze-tier Potion': '获得一件青铜级药水',
  'Get a Bronze-tier Tech item': '获得一件青铜级科技物品',
  'Gain {ability.0.mod} Gold for each Tool or Apparel you have (including Stash)': '每件你拥有的工具或服饰获得 {ability.0.mod} 金币（含背包）',
  'Teaches Poison skills': '教授毒素技能',
  'Gain {ability.0.mod} Gold for each Property you have (including Stash)': '每件你拥有的地产获得 {ability.0.mod} 金币（含背包）',
  'Get a Bronze-tier Rage item': '获得一件青铜级狂暴物品',
  'Get a Bronze-tier Reagent': '获得一件青铜级原料',
  'Teaches Health, Heal and Regen skills': '教授生命、治疗和再生技能',
  'Teaches Weapon Skills': '教授武器技能',
  'Enchant an item with Obsidian (damage effects)': '为物品附魔"黑曜石"（伤害效果）',
  'Gain {ability.0.mod} Gold for each Tool or Tech you have (including Stash)': '每件你拥有的工具或科技获得 {ability.0.mod} 金币（含背包）',
  'Enchant an item with Turbo (Haste effects)': '为物品附魔"涡轮"（急速效果）',
  'Teaches Slow skills': '教授减速技能',
  'Get a Bronze-tier Flying item': '获得一件青铜级飞行物品',
  'Get a Bronze-tier Tool': '获得一件青铜级工具',
  'Enchant an item with Restorative (Heal effects)': '为物品附魔"恢复"（治疗效果）',
  'Teaches skills unique to Stelle': '教授史黛拉专属技能',
  'Teaches Crit skills': '教授暴击技能',
  'Enchant an item with Icy (Freeze effects)': '为物品附魔"冰冷"（冻结效果）',
  'Teaches Haste and Charge skills': '教授急速和充能技能',
  'Teaches skills unique to Mak': '教授马克专属技能'
}

function cardTitle(card) { return TITLE_ZH[card.Title.Text] || card.Title.Text }
function resolveDesc(card) {
  const raw = card.Description?.Text || ''
  const text = DESC_ZH[raw] || raw
  return resolvePlaceholders(text, card.TooltipReplacements || {})
}

function toggleLevel(level) {
  openLevels.has(level) ? openLevels.delete(level) : openLevels.add(level)
}

function isInspiredCard(card) {
  return (card.Title.Text || '').startsWith('Inspired by')
}

const filteredSections = computed(() => {
  if (!rawData.value) return []
  const hero = selectedHero.value
  const inspired = showInspired.value
  return rawData.value.sections
    .map(section => {
      const cards = section.cards.filter(c => {
        if (!inspired && isInspiredCard(c)) return false
        if (hero === '全部') return true
        const heroes = c.Heroes || []
        return heroes.includes(hero) || heroes.includes('Common')
      })
      return cards.length ? { ...section, cards } : null
    })
    .filter(Boolean)
})

onMounted(async () => {
  await dataStore.loadHeroes()
  rawData.value = await dataStore.loadLevelUpOptions()
  loading.value = false
  if (rawData.value?.sections?.length) {
    rawData.value.sections.slice(0, 3).forEach(s => openLevels.add(s.level))
  }
})
</script>

<style scoped>
.hero-tabs {
  display: flex; gap: 6px; padding: 12px 16px;
  overflow-x: auto; flex-wrap: wrap;
}
.hero-tab {
  padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
  background: var(--surface2); color: var(--text2); cursor: pointer;
  font-size: 13px; white-space: nowrap; transition: all .2s;
}
.hero-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }

.filter-bar {
  display: flex; align-items: center; gap: 8px; padding: 0 16px 8px;
  font-size: 12px; color: var(--text2); flex-wrap: wrap;
}
.filter-toggle {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  color: var(--text); font-weight: 500;
}
.filter-toggle input { width: 16px; height: 16px; accent-color: var(--primary); }
.filter-hint { font-size: 11px; color: var(--text2); opacity: .7; }

.levelup-body { padding: 0 16px 80px; }

.level-section { margin-bottom: 8px; }
.level-header {
  display: flex; align-items: center; gap: 8px; padding: 12px 14px;
  background: var(--surface2); border-radius: 10px; cursor: pointer;
  user-select: none; transition: background .2s;
}
.level-header:hover { background: var(--surface3); }
.level-num { font-weight: 700; font-size: 15px; color: var(--text); }
.level-count { font-size: 12px; color: var(--text2); flex: 1; }
.level-arrow { font-size: 12px; color: var(--text2); }

.level-cards { display: grid; gap: 10px; padding: 10px 0; grid-template-columns: 1fr; }
@media (min-width: 600px) { .level-cards { grid-template-columns: 1fr 1fr; } }

.lu-card {
  display: flex; gap: 12px; padding: 12px; border-radius: 10px;
  background: var(--surface); border: 1px solid var(--border);
  transition: box-shadow .2s;
}
.lu-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.12); }

.lu-card-art-wrap {
  position: relative; width: 64px; height: 64px;
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
}
.lu-card-art-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover;
}
.lu-card-art-fg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: contain; z-index: 1;
}

.lu-card-body { flex: 1; min-width: 0; }
.lu-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.lu-card-title { font-weight: 700; font-size: 14px; color: var(--text); }
.lu-card-tier {
  font-size: 11px; padding: 1px 8px; border-radius: 10px;
  font-weight: 600; white-space: nowrap;
}
.tier-bronze { background: #cd7f3233; color: #cd7f32; }
.tier-silver { background: #c0c0c033; color: #888; }
.tier-gold { background: #ffd70033; color: #b8860b; }
.tier-diamond { background: #b9f2ff33; color: #0891b2; }
.tier-legendary { background: #ff69b433; color: #c71585; }

.lu-card-type { font-size: 11px; color: var(--text2); margin-bottom: 6px; }
.lu-card-desc { font-size: 12px; color: var(--text); line-height: 1.5; }

.lu-card-tooltip {
  display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;
}
.tooltip-item {
  font-size: 11px; padding: 2px 6px; border-radius: 4px;
  background: var(--surface3); color: var(--text2);
}

.lu-card-options { margin-top: 8px; }
.options-label { font-size: 11px; color: var(--text2); margin-bottom: 4px; }
.option-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px; background: var(--surface2);
  font-size: 11px; margin: 2px; color: var(--text);
}
.option-art { width: 20px; height: 20px; border-radius: 4px; object-fit: cover; }
.opt-tier {
  font-size: 10px; padding: 0 4px; border-radius: 4px; font-weight: 600;
}

.lu-card-heroes { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
.hero-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 8px;
  background: var(--surface3); color: var(--text2);
}
</style>
