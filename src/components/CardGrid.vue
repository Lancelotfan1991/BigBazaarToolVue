<template>
  <div
    ref="gridRef"
    class="cards-grid"
  >
    <template v-if="filteredCards.length">
      <ItemCard
        v-for="(card, idx) in visibleCards"
        :key="(card['英文名'] || card['name']) + '_' + (card['基础品质'] || '') + '_' + (card['怪物信息']?.['出现天数'] ?? '') + '_' + idx"
        :card="card"
        :is-game-data="isGameData"
        :update-badge="getBadge(card)"
        :diff-details="getDiffDetails(card)"
        @click="$emit('card-click', card)"
      />
    </template>
    <div
      v-else
      class="empty"
    >
      <div class="icon">
        🔍
      </div>
      <h3>没有匹配的结果</h3>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ItemCard from './ItemCard.vue'

const props = defineProps({
  filteredCards: { type: Array, default: () => [] },
  renderLimit: { type: Number, default: 40 },
  isGameData: Boolean,
  getBadge: { type: Function, default: () => '' },
  getDiffDetails: { type: Function, default: () => ({}) }
})
defineEmits(['card-click'])

const visibleCards = computed(() => props.filteredCards.slice(0, props.renderLimit))
</script>
