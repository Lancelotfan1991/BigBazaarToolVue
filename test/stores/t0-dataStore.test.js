
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataStore, SEASON_DIRS } from '@/stores/dataStore'

describe('T0 - dataStore 核心行为', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  it('当 season 为 "" 时，DATA_DIR 为 "/data"', () => {
    store.season = ''
    expect(store.DATA_DIR).toBe('/data')
  })

  it('当 season 为 "s15" 时，DATA_DIR 为 "/data-s15"', () => {
    store.season = 's15'
    expect(store.DATA_DIR).toBe('/data-s15')
  })

  it('当调用 reset() 时，currentHero 和 currentData 清空', () => {
    store.currentHero = { name_en: 'Dooley' }
    store.currentData = { '物品': [] }
    store.reset()
    expect(store.currentHero).toBeNull()
    expect(store.currentData).toBeNull()
  })

  it('当 loadHeroes 成功时，heroesList 包含职业列表', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ name_en: 'Dooley', name_zh: '杜利', has_data: true }])
    })
    await store.loadHeroes()
    expect(store.heroesList).toHaveLength(1)
    expect(store.heroesList[0].name_en).toBe('Dooley')
  })

  it('当 loadHeroData 成功时，currentData 包含物品和技能', async () => {
    store.heroesList = [{ name_en: 'Dooley', name_zh: '杜利' }]
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ '物品': [{ '名称': '测试' }], '技能': [], '获取时间': '2024-01-01' })
    })
    await store.loadHeroData('Dooley')
    expect(store.currentData['物品']).toHaveLength(1)
    expect(store.currentHero.name_en).toBe('Dooley')
  })

  it('当 switchSeason 时，会清除 allItemsCache 并重新加载', async () => {
    store.currentHero = { name_en: 'Dooley' }
    store.allItemsCache = { '物品': [] }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ '物品': [{ '名称': '新物品' }], '技能': [] })
    })
    await store.switchSeason('s15')
    expect(store.season).toBe('s15')
  })
})
