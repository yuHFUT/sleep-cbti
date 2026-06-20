import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RadarChart from '../src/components/RadarChart.vue';

const mockData = [
  { key: 'a', name: '维度A', score: 80 },
  { key: 'b', name: '维度B', score: 60 },
  { key: 'c', name: '维度C', score: 90 },
  { key: 'd', name: '维度D', score: 50 },
  { key: 'e', name: '维度E', score: 70 },
  { key: 'f', name: '维度F', score: 85 },
];

describe('RadarChart 组件', () => {
  it('应该渲染 SVG 元素', () => {
    const wrapper = mount(RadarChart, { props: { data: mockData } });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('应该渲染 6 个维度标签', () => {
    const wrapper = mount(RadarChart, { props: { data: mockData } });
    const labels = wrapper.findAll('.dim-label');
    expect(labels.length).toBe(6);
  });

  it('应该渲染数据多边形', () => {
    const wrapper = mount(RadarChart, { props: { data: mockData } });
    // polygon for data area + 5 grid polygons
    const polygons = wrapper.findAll('polygon');
    expect(polygons.length).toBe(6); // 5 grid + 1 data
  });
});
