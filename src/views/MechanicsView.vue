<template>
  <div class="mechanics-viewer active">
    <div class="back-bar">
      <button
        class="back-btn"
        @click="router.push('/')"
      >
        ← 返回
      </button>
      <span class="data-source">游戏机制参考手册</span>
    </div>
    <div>
      <div
        v-for="(cat, ci) in MECHANICS_DATA"
        :key="ci"
        class="mech-category"
        :class="{ open: openCats.has(ci) }"
      >
        <div
          class="mech-cat-header"
          @click="toggleCat(ci)"
        >
          <span class="mech-cat-icon">{{ cat.icon }}</span>
          <span class="mech-cat-title">{{ cat.title }}</span>
          <span class="mech-cat-count">{{ cat.topics.length }} 个主题</span>
          <span class="mech-cat-arrow">▶</span>
        </div>
        <div class="mech-cat-body">
          <div
            v-for="tp in cat.topics"
            :key="tp.t"
            class="mech-topic"
          >
            <div class="mech-topic-title">
              {{ tp.t }}
            </div>
            <div
              class="mech-topic-content"
              v-html="tp.c"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const openCats = reactive(new Set())
function toggleCat(ci) { openCats.has(ci) ? openCats.delete(ci) : openCats.add(ci) }

const MECHANICS_DATA = [
  { icon: '📚', title: '游戏基础', topics: [
    { t: '游戏概述', c: '<ul><li>PvP 卡牌自动战斗游戏</li><li>白天购买物品，夜晚自动战斗</li></ul>' },
    { t: '天结构', c: '<ul><li>Day 1-3: 普通难度</li><li>Day 4-5: 中等难度</li><li>Day 6+: 困难阶段</li></ul>' },
    { t: '声望系统', c: '<ul><li>初始 20 点声望</li><li>输掉 PvP 战斗扣声望</li><li>声望降到 0 触发最后机会</li></ul>' }
  ]},
  { icon: '⚙️', title: '核心机制', topics: [
    { t: '冷却时间 (Cooldown)', c: '<ul><li>每个物品有独立冷却时间</li><li>CDR 减少冷却</li></ul>' },
    { t: '充能 (Charge)', c: '<ul><li>部分物品需要充能才能施放</li><li>充能通过其他物品获得</li></ul>' },
    { t: '物品升级', c: '<ul><li>铜→银→金→钻石→传说</li><li>两个相同品质相同名称合并</li></ul>' }
  ]},
  { icon: '🛡️', title: '战斗机制', topics: [
    { t: '伤害类型', c: '<ul><li>直接伤害</li><li>灼烧 (Burn)</li><li>毒素 (Poison)</li></ul>' },
    { t: '防御机制', c: '<ul><li>护盾 (Shield)</li><li>生命再生 (Regen)</li></ul>' }
  ]},
  { icon: '💡', title: '触发与协同', topics: [
    { t: '触发优先级', c: '<ul><li>物品从左到右依次触发</li><li>相邻效果优先</li></ul>' },
    { t: 'ICD (内部冷却)', c: '<ul><li>部分触发效果有内部冷却</li><li>防止无限触发</li></ul>' }
  ]},
  { icon: '🎯', title: '特殊机制', topics: [
    { t: '沙暴 (Sandstorm)', c: '<ul><li>战斗后期递增伤害</li><li>防止战斗无限拖延</li></ul>' },
    { t: '附魔 (Enchant)', c: '<ul><li>物品可以附魔增强</li><li>不同附魔改变物品玩法</li></ul>' }
  ]},
  { icon: '🔧', title: '工具与策略', topics: [
    { t: '物品效率公式', c: '<code>效率 = 效果值 × (60 ÷ CD) ÷ 尺寸</code>' },
    { t: '策略要点', c: '<ul><li>专注核心物品</li><li>空间效率优先</li><li>冷却管理</li></ul>' }
  ]}
]
</script>
