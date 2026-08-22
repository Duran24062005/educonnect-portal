import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LightweightCategoryChart from '@/components/charts/LightweightCategoryChart';

const chartMocks = vi.hoisted(() => {
  const series = { setData: vi.fn() };
  const timeScale = { fitContent: vi.fn() };
  const chart = {
    addSeries: vi.fn(() => series),
    timeScale: vi.fn(() => timeScale),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
  };

  return {
    chart,
    createChart: vi.fn(() => chart),
  };
});

vi.mock('lightweight-charts', () => ({
  AreaSeries: 'AreaSeries',
  ColorType: { Solid: 'solid' },
  HistogramSeries: 'HistogramSeries',
  LineSeries: 'LineSeries',
  createChart: chartMocks.createChart,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe('LightweightCategoryChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  it('keeps the plot inside a fixed-height, shrinkable container', () => {
    render(
      <LightweightCategoryChart
        categories={['Matemáticas', 'Lenguaje']}
        series={[{ id: 'average', label: 'Promedio', color: '#0f766e', values: [8, 9] }]}
        height={280}
      />
    );

    const plot = screen.getByTestId('lightweight-category-chart-plot');

    expect(plot).toHaveStyle({ height: '280px', minHeight: '280px', maxHeight: '280px' });
    expect(plot.className).toContain('min-w-0');
    expect(chartMocks.createChart).toHaveBeenCalledWith(
      plot,
      expect.objectContaining({ autoSize: false, height: 280, width: 1 })
    );
  });
});
