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

<style scoped>
/* Simulator */
  .sim-viewer {
    display: none;
  }

  .sim-viewer.active {
    display: block;
  }

  .sim-board {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .sim-board h3 {
    font-size: 15px;
    margin-bottom: 12px;
  }

  .sim-items {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .sim-item-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px;
    min-width: 120px;
    position: relative;
  }

  .sim-item-name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .sim-item-info {
    font-size: 11px;
    color: var(--text2);
  }

  .sim-item-quality {
    display: flex;
    gap: 3px;
    margin-top: 6px;
  }

  .sim-q-btn {
    padding: 2px 6px;
    font-size: 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text2);
    cursor: pointer;
  }

  .sim-q-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .sim-item-remove {
    position: absolute;
    top: 4px;
    right: 6px;
    font-size: 14px;
    color: var(--text2);
    cursor: pointer;
    opacity: 0.5;
  }

  .sim-item-remove:hover {
    opacity: 1;
    color: #ff6b6b;
  }

  .sim-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .sim-btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
  }

  .sim-btn:active {
    background: var(--accent);
    border-color: var(--accent);
  }

  .sim-btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .sim-btn.primary:active {
    background: var(--accent2);
  }

  .sim-add-select {
    padding: 6px 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    font-size: 12px;
    outline: none;
  }

  .sim-duration {
    padding: 6px 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    font-size: 12px;
    outline: none;
    width: 60px;
  }

  .sim-results {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-top: 12px;
  }

  .sim-results h3 {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .sim-stat {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .sim-stat:last-child {
    border-bottom: none;
  }

  .sim-stat-label {
    color: var(--text2);
  }

  .sim-stat-value {
    font-weight: 600;
    color: var(--accent2);
  }

  .sim-timeline {
    margin-top: 12px;
  }

  .sim-timeline h4 {
    font-size: 13px;
    margin-bottom: 6px;
    color: var(--text);
  }

  .sim-bar-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
    font-size: 11px;
  }

  .sim-bar-time {
    width: 32px;
    text-align: right;
    color: var(--text2);
    flex-shrink: 0;
  }

  .sim-bar {
    height: 14px;
    border-radius: 3px;
    background: var(--accent);
    min-width: 1px;
    transition: width 0.3s;
  }

  .sim-bar.burn {
    background: #e67e22;
  }

  .sim-bar.dmg {
    background: #e74c3c;
  }

  .sim-bar-label {
    font-size: 10px;
    color: var(--text2);
    margin-left: 4px;
    white-space: nowrap;
  }

.sim-scenario {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .sim-scenario-btn {
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid var(--accent);
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-size: 12px;
  }

  .sim-scenario-btn:active,
  .sim-scenario-btn.active {
    background: var(--accent);
    color: #fff;
  }
</style>

