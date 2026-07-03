<template>
  <div class="sim-viewer active">
    <div class="back-bar">
      <button
        class="back-btn"
        @click="router.push('/')"
      >
        ← 返回
      </button>
      <span class="data-source">战斗模拟器</span>
    </div>
    <div class="sim-board">
      <h3>战斗模拟器</h3>
      <p style="color:var(--text2);font-size:14px;">
        此功能正在开发中...
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
