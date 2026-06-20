<template>
  <div class="radar-chart-container">
    <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size">
      <!-- 背景网格 -->
      <g v-for="(level, li) in levels" :key="'level-' + li">
        <polygon
          :points="getGridPoints(level)"
          :fill="li === levels.length - 1 ? 'rgba(74,111,165,0.08)' : 'none'"
          :stroke="li === levels.length - 1 ? '#4a6fa5' : 'rgba(74,111,165,0.2)'"
          :stroke-width="li === levels.length - 1 ? 1.5 : 0.8"
        />
      </g>

      <!-- 轴线 -->
      <line
        v-for="(item, i) in data"
        :key="'axis-' + i"
        :x1="cx"
        :y1="cy"
        :x2="getPoint(i, maxVal).x"
        :y2="getPoint(i, maxVal).y"
        stroke="rgba(74,111,165,0.15)"
        stroke-width="0.8"
      />

      <!-- 数据区域 -->
      <polygon
        :points="dataPoints"
        fill="rgba(74,111,165,0.25)"
        stroke="#4a6fa5"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- 数据点 -->
      <circle
        v-for="(item, i) in data"
        :key="'dot-' + i"
        :cx="getPoint(i, item.score).x"
        :cy="getPoint(i, item.score).y"
        r="5"
        fill="#fff"
        stroke="#4a6fa5"
        stroke-width="2"
      />

      <!-- 标签 -->
      <text
        v-for="(item, i) in data"
        :key="'label-' + i"
        :x="getLabelPos(i).x"
        :y="getLabelPos(i).y"
        :text-anchor="getLabelAnchor(i)"
        :dominant-baseline="getLabelBaseline(i)"
        class="dim-label"
      >
        <tspan :x="getLabelPos(i).x" dy="-0.2em" class="dim-name">{{ item.name }}</tspan>
        <tspan :x="getLabelPos(i).x" dy="1.4em" class="dim-score">{{ item.score }}分</tspan>
      </text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    // [{ key, name, score }] score: 0-100
  },
  maxVal: { type: Number, default: 100 },
  size: { type: Number, default: 340 },
});

const cx = computed(() => props.size / 2);
const cy = computed(() => props.size / 2);
const radius = computed(() => props.size * 0.36);
const levels = computed(() => [0.2, 0.4, 0.6, 0.8, 1.0]);
const n = computed(() => props.data.length);

function angle(i) {
  // 从顶部开始（-90°），顺时针
  return (2 * Math.PI * i) / n.value - Math.PI / 2;
}

function getPoint(i, val) {
  const r = radius.value * (val / props.maxVal);
  return {
    x: cx.value + r * Math.cos(angle(i)),
    y: cy.value + r * Math.sin(angle(i)),
  };
}

function getGridPoints(level) {
  return Array.from({ length: n.value }, (_, i) => {
    const r = radius.value * level;
    const pt = {
      x: cx.value + r * Math.cos(angle(i)),
      y: cy.value + r * Math.sin(angle(i)),
    };
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

const dataPoints = computed(() => {
  return props.data
    .map((item, i) => {
      const pt = getPoint(i, item.score);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
});

function getLabelPos(i) {
  const r = radius.value + 40;
  return {
    x: cx.value + r * Math.cos(angle(i)),
    y: cy.value + r * Math.sin(angle(i)),
  };
}

function getLabelAnchor(i) {
  const a = angle(i);
  const deg = ((a * 180) / Math.PI + 360) % 360;
  if (deg > 80 && deg < 100) return 'middle';
  if (deg > 260 && deg < 280) return 'middle';
  return deg < 180 ? 'start' : 'end';
}

function getLabelBaseline(i) {
  const a = angle(i);
  const deg = ((a * 180) / Math.PI + 360) % 360;
  if (deg > 80 && deg < 100) return 'hanging';
  if (deg > 260 && deg < 280) return 'auto';
  return 'middle';
}
</script>

<style scoped>
.radar-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
}

svg {
  max-width: 100%;
  height: auto;
}

.dim-label {
  font-size: 12px;
  fill: #555;
}

.dim-name {
  font-weight: 600;
  fill: #333;
}

.dim-score {
  font-size: 11px;
  fill: #4a6fa5;
  font-weight: 500;
}
</style>
