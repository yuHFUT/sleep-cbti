<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup>
// 睡益良方 - 主应用入口
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #f5f7fa;
  color: #333;
  height: 100%;
  -webkit-font-smoothing: antialiased;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
}

#app-container {
  min-height: 100vh;
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  position: relative;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
