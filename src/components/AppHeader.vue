<template>
  <div class="header">
    <h1>大巴扎数据查询工具</h1>
    <div class="season-selector">
      <label>赛季</label>
      <select
        v-model="dataStore.season"
        @change="dataStore.switchSeason(dataStore.season)"
      >
        <option value="">
          S16.1（最新）
        </option>
        <option value="s16">
          S16
        </option>
        <option value="s15">
          S15
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { useDataStore } from '@/stores/dataStore'
const dataStore = useDataStore()
</script>