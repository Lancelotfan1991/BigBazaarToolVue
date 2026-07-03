<template>
  <div class="hero-selector">
    <h2>📚 选择职业</h2>
    <div class="hero-grid">
      <div
        v-if="loading"
        class="loading"
      >
        <div class="spinner" />
      </div>
      <HeroCard
        v-for="h in dataStore.heroesList"
        :key="h.name_en"
        :hero="h"
        @click="goToHero"
      />
    </div>
    <div class="game-data-section">
      <h2>🎮 游戏数据</h2>
      <div class="game-data-grid">
        <div
          v-for="g in gameDataTypes"
          :key="g.type"
          class="game-data-card"
          @click="router.push({ name: 'game', params: { type: g.type } })"
        >
          <div class="gd-icon">
            {{ g.icon }}
          </div>
          <div class="gd-info">
            <div class="gd-name">
              {{ g.name }}
            </div><div class="gd-count">
              {{ g.count }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="game-data-card tool-card"
        @click="router.push('/board')"
      >
        <div class="gd-icon">
          🎲
        </div>
        <div class="gd-info">
          <div class="gd-name">
            布阵区模拟
          </div><div class="gd-desc">
            10 格 · 物品摆放 · 拖拽排序
          </div>
        </div>
      </div>
    </div>
    <div class="game-data-section">
      <h2>🌐 常用网站</h2>
      <div class="useful-links">
        <a
          v-for="link in usefulLinks"
          :key="link.url"
          class="useful-link"
          :href="link.url"
          target="_blank"
          rel="noopener"
        >
          <div class="ul-icon">{{ link.icon }}</div>
          <div class="ul-info"><div class="ul-name">{{ link.name }}</div><div class="ul-desc">{{ link.desc }}</div></div>
          <span class="ul-arrow">↗</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import HeroCard from '@/components/HeroCard.vue'

const router = useRouter()
const dataStore = useDataStore()
const loading = ref(true)
const gameDataTypes = ref([
  { type: 'events', icon: '⚔️', name: '事件', count: '加载中...' },
  { type: 'monsters', icon: '👾', name: '怪物', count: '加载中...' },
  { type: 'trainers', icon: '🏋️', name: '训练师', count: '加载中...' },
  { type: 'merchants', icon: '🏪', name: '商人', count: '加载中...' }
])
const usefulLinks = [
  { url: 'https://bazaardb.gg', icon: '📦', name: 'BazaarDB', desc: 'bazaardb.gg · 物品与卡牌数据库' },
  { url: 'https://playthebazaar.com/patch-notes', icon: '📜', name: 'Patch Notes（更新日志）', desc: '巴扎官网 · 版本更新公告' },
  { url: 'https://bazaar.mrmao.life', icon: '📊', name: '巴扎查分工具', desc: 'bazaar.mrmao.life · 战绩查询' },
  { url: 'https://www.bazaarghost.stream/', icon: '👻', name: '我的巴扎幽灵', desc: 'bazaarghost.stream · 幽灵数据追踪' },
  { url: 'https://bazaarplusplus.com/heroes?lang=en', icon: '📈', name: 'Bazaar++ 英雄数据', desc: 'bazaarplusplus.com · 英雄胜率与统计' },
  { url: 'https://bazaarplanner.com', icon: '🧩', name: 'Bazaar Planner（构筑模拟器）', desc: 'bazaarplanner.com · 创建、模拟、分享构筑' }
]

function goToHero(nameEn) { router.push({ name: 'hero', params: { name: nameEn } }) }

onMounted(async () => {
  dataStore.reset()
  await dataStore.loadHeroes()
  loading.value = false
  // Load game data counts
  for (const g of gameDataTypes.value) {
    try {
      const resp = await fetch(dataStore.DATA_DIR + '/' + g.type + '.json')
      if (resp.ok) {
        const data = await resp.json()
        g.count = ((data['物品'] || []).length + (data['技能'] || []).length) + ' 条'
      } else { g.count = '暂无数据' }
    } catch { g.count = '暂无数据' }
  }
})
</script>
