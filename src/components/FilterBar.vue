<template>
  <div class="filters">
    <div class="filter-row">
      <div class="search-box">
        <input
          v-model="filterStore.searchQuery"
          type="text"
          placeholder="搜索名称、标签、效果..."
        >
      </div>
      <span class="filter-label">排序:</span>
      <select
        v-model="filterStore.sortBy"
        class="sort-select"
      >
        <option value="name">
          按名称
        </option>
        <option value="tier">
          按品质
        </option>
        <option value="size">
          按大小
        </option>
        <option
          v-if="showDaySort"
          value="day"
        >
          按天数
        </option>
        <option
          v-if="showDaySort"
          value="tier"
        >
          按品质
        </option>
      </select>
    </div>
    <div
      v-if="showTags && tags.length"
      id="tagFilters"
      class="filter-row"
    >
      <span class="filter-label">标签:</span>
      <div class="tag-filter-scroll">
        <button
          v-for="t in tags"
          :key="t"
          class="filter-btn"
          :class="{ active: filterStore.activeFilters.tag.has(t) }"
          @click="filterStore.toggleFilter('tag', t)"
        >
          {{ tagZh[t] || t }}
        </button>
      </div>
    </div>
    <div class="filter-row">
      <template v-if="!hideScopeFilter">
        <span class="filter-label">范围:</span>
        <div class="filter-group">
          <button
            class="filter-btn"
            :class="{ active: filterStore.currentScope === 'all' }"
            @click="filterStore.setScope('all')"
          >
            全部
          </button>
          <button
            class="filter-btn"
            :class="{ active: filterStore.currentScope === 'exclusive' }"
            @click="filterStore.setScope('exclusive')"
          >
            仅专属
          </button>
        </div>
      </template>
      <button
        v-if="showUpdateToggle"
        class="filter-btn updated-toggle"
        :class="{ active: filterStore.showUpdatedOnly }"
        @click="$emit('toggle-updated')"
      >
        {{ filterStore.showUpdatedOnly ? '✅ 仅查看更新物品' : '🆕 仅查看更新物品' }}
      </button>
    </div>
    <div class="filter-row">
      <span class="filter-label">品质:</span>
      <div class="filter-group">
        <button
          v-for="t in ['铜','银','金','钻石','传说']"
          :key="t"
          class="filter-btn"
          :class="{ active: filterStore.activeFilters.tier.has(t) }"
          @click="filterStore.toggleFilter('tier', t)"
        >
          {{ t }}
        </button>
      </div>
    </div>
    <div
      v-if="!hideSizeFilter"
      class="filter-row"
    >
      <span class="filter-label">大小:</span>
      <div class="filter-group">
        <button
          v-for="s in ['小型','中型','大型']"
          :key="s"
          class="filter-btn"
          :class="{ active: filterStore.activeFilters.size.has(s) }"
          @click="filterStore.toggleFilter('size', s)"
        >
          {{ s[0] }}
        </button>
      </div>
    </div>
    <div
      v-if="showHeroFilter && heroList.length"
      class="filter-row"
    >
      <span class="filter-label">职业:</span>
      <div class="filter-group">
        <button
          v-for="h in heroList"
          :key="h"
          class="filter-btn"
          :class="{ active: filterStore.activeFilters.hero.has(h) }"
          @click="filterStore.toggleFilter('hero', h)"
        >
          {{ h }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFilterStore } from '@/stores/filterStore'
defineProps({ tags: { type: Array, default: () => [] }, showTags: Boolean, showUpdateToggle: Boolean, tagZh: { type: Object, default: () => ({}) }, showHeroFilter: Boolean, heroList: { type: Array, default: () => [] }, showDaySort: Boolean, hideSizeFilter: Boolean, hideScopeFilter: Boolean })
defineEmits(['toggle-updated'])
const filterStore = useFilterStore()
</script>
