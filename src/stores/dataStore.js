import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const SEASON_DIRS = { '': '/data-s16.1', 's15': '/data-s15', 's16': '/data-s16', 's16.1': '/data-s16.1' }

export const HERO_DISPLAY = {
  'Vanessa': '瓦妮莎', 'Karnok': '卡诺克', 'Dooley': '杜利',
  'Pygmalien': '皮格马利安', 'Mak': '马克', 'Stelle': '史黛拉',
  'Jules': '朱尔斯', 'All': '全部', 'Common': '通用'
}

export const TIER_ORDER = { Bronze: 0, Silver: 1, Gold: 2, Diamond: 3, Legendary: 4 }
export const TIER_ZH = { Bronze: '铜', Silver: '银', Gold: '金', Diamond: '钻石', Legendary: '传说' }
export const TIER_ZH_REV = Object.fromEntries(Object.entries(TIER_ZH).map(([k, v]) => [v, k]))
export const SIZE_ZH = { Small: '小型', Medium: '中型', Large: '大型' }
export const SIZE_ORDER = { Small: 0, Medium: 1, Large: 2 }

export const TIER_ATTR_ZH = {
  'AmmoMax': '弹药', 'BurnApplyAmount': '燃烧', 'ChargeTargets': '充能目标',
  'CritChance': '暴击率', 'Custom_3': '属性3', 'Custom_4': '属性4',
  'EnchantTargets': '附魔目标', 'FlyingTargets': '飞行目标',
  'FreezeAmount': '冻结', 'FreezeTargets': '冻结目标',
  'HasteAmount': '急速', 'HasteTargets': '急速目标',
  'PoisonApplyAmount': '中毒', 'RageApplyAmount': '激怒',
  'RegenApplyAmount': '再生', 'ReloadAmount': '装弹',
  'ReloadTargets': '装弹目标', 'ShieldApplyAmount': '护盾',
  'SlowAmount': '减速', 'SlowTargets': '减速目标',
  'UpgradeTargets': '升级目标',
  '自定义属性0': '属性A', '自定义属性1': '属性B', '自定义属性2': '属性C',
  '冷却时间(ms)': '冷却', '伤害值': '伤害', '治疗值': '治疗',
  '多重施法': '多重释放', '充能次数': '充能'
}

export const TAG_ZH = {
  'Aquatic': '水系', 'Core': '核心', 'Dinosaur': '恐龙', 'Dragon': '巨龙',
  'Property': '地产', 'Reagent': '原料', 'Relic': '遗物', 'Friend': '伙伴',
  'Tech': '科技', 'Loot': '战利品', 'Vehicle': '载具', 'Ray': '射线',
  'Potion': '药水', 'Food': '食物', 'Drone': '无人机', 'Apparel': '服饰',
  'Toy': '玩具', 'Trap': '陷阱', 'Weapon': '武器', 'Tool': '工具'
}

export const HERO_COLORS = {
  '海盗': '#48c6a9', '卡诺克': '#cb6c72', '杜利': '#6c72cb',
  '皮格马利安': '#cb9b6c', '马克': '#6ccbc0', '斯特尔': '#c06ccb',
  '朱尔斯': '#6c8fcb', 'Common': '#888', '通用': '#888'
}

export const TIER_CLASS = {
  Bronze: 'bronze', Silver: 'silver', Gold: 'gold',
  Diamond: 'diamond', Legendary: 'legendary'
}

export const useDataStore = defineStore('data', () => {
  const heroesList = ref([])
  const currentHero = ref(null)
  const currentData = ref(null)
  const season = ref('')
  const allItemsCache = ref(null)

  const DATA_DIR = computed(() => SEASON_DIRS[season.value] || '/data-s16.1')

  async function loadHeroes() {
    const resp = await fetch(`${DATA_DIR.value}/heroes.json`)
    heroesList.value = await resp.json()
  }

  async function loadHeroData(heroName) {
    const resp = await fetch(`${DATA_DIR.value}/${heroName}.json`)
    currentData.value = await resp.json()
    currentHero.value = heroesList.value.find(h => h.name_en === heroName) || { name_en: heroName }
  }

  async function loadGameData(type) {
    const resp = await fetch(`${DATA_DIR.value}/${type}.json`)
    currentData.value = await resp.json()
    const names = { events: '事件', monsters: '怪物', trainers: '训练师', merchants: '商人' }
    currentHero.value = { name_en: type, name_zh: names[type] || type }
  }

  async function ensureAllItemsCache() {
    if (!allItemsCache.value) {
      const resp = await fetch(`${DATA_DIR.value}/All.json`)
      allItemsCache.value = await resp.json()
    }
    return allItemsCache.value
  }

  async function switchSeason(val) {
    season.value = val
    allItemsCache.value = null
    if (currentHero.value?.name_en) {
      const name = currentHero.value.name_en
      if (['events', 'monsters', 'trainers', 'merchants'].includes(name)) {
        await loadGameData(name)
      } else if (name !== 'All') {
        await loadHeroData(name)
      } else {
        await ensureAllItemsCache()
        currentData.value = allItemsCache.value
      }
    }
  }

  function reset() {
    currentHero.value = null
    currentData.value = null
  }

  return {
    heroesList, currentHero, currentData, season, allItemsCache,
    DATA_DIR, HERO_DISPLAY, TIER_ORDER, TIER_ZH, TIER_ZH_REV, SIZE_ZH, SIZE_ORDER,
    loadHeroes, loadHeroData, loadGameData, ensureAllItemsCache, switchSeason, reset
  }
})

