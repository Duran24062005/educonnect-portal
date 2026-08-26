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
    series,
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

let resizeCallback: ResizeObserverCallback | undefined;
let resizeObserverDisconnect: ReturnType<typeof vi.fn> | undefined;
let crosshairMoveHandler: ((param: unknown) => void) | undefined;

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
    resizeObserverDisconnect = this.disconnect;
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

describe('LightweightCategoryChart', () => {
  beforeEach(() => {
    resizeCallback = undefined;
    resizeObserverDisconnect = undefined;
    crosshairMoveHandler = undefined;
    vi.clearAllMocks();
    chartMocks.chart.subscribeCrosshairMove.mockImplementation((handler) => {
      crosshairMoveHandler = handler;
    });
    chartMocks.createChart.mockClear();
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
      expect.objectContaining({
        autoSize: false,
        handleScale: false,
        handleScroll: false,
        height: 280,
        width: 1,
      })
    );
  });

  it('creates each supported series and aligns missing values with zeroes', () => {
    render(
      <LightweightCategoryChart
        categories={['Periodo 1', 'Periodo 2', 'Periodo 3']}
        series={[
          { id: 'line', label: 'Línea', type: 'line', color: '#dc2626', values: [1, 2] },
          { id: 'area', label: 'Área', type: 'area', color: '#0f766e', values: [3, 4, 5] },
          { id: 'histogram', label: 'Barras', type: 'histogram', color: '#2563eb', values: [6] },
        ]}
      />
    );

    expect(chartMocks.chart.addSeries).toHaveBeenCalledWith('LineSeries', expect.objectContaining({ color: '#dc2626' }));
    expect(chartMocks.chart.addSeries).toHaveBeenCalledWith('AreaSeries', expect.objectContaining({ lineColor: '#0f766e' }));
    expect(chartMocks.chart.addSeries).toHaveBeenCalledWith('HistogramSeries', expect.objectContaining({ color: '#2563eb' }));
    expect(chartMocks.series.setData).toHaveBeenCalledWith([
      { time: 1735689600, value: 1 },
      { time: 1735776000, value: 2 },
      { time: 1735862400, value: 0 },
    ]);
    expect(chartMocks.series.setData).toHaveBeenCalledWith([
      { time: 1735689600, value: 6, color: '#2563eb' },
      { time: 1735776000, value: 0, color: '#2563eb' },
      { time: 1735862400, value: 0, color: '#2563eb' },
    ]);
  });

  it('does not initialize a chart when categories or series are empty', () => {
    const { rerender } = render(
      <LightweightCategoryChart categories={[]} series={[{ id: 'line', label: 'Línea', color: '#dc2626', values: [] }]} />
    );

    expect(chartMocks.createChart).not.toHaveBeenCalled();

    rerender(
      <LightweightCategoryChart categories={['Periodo 1']} series={[]} />
    );

    expect(chartMocks.createChart).not.toHaveBeenCalled();
  });

  it('resizes the chart to the current plot width without using an intrinsic width', () => {
    render(
      <LightweightCategoryChart
        categories={['Periodo 1', 'Periodo 2']}
        series={[{ id: 'average', label: 'Promedio', color: '#0f766e', values: [8, 9] }]}
        height={280}
      />
    );

    const plot = screen.getByTestId('lightweight-category-chart-plot');
    Object.defineProperty(plot, 'clientWidth', { configurable: true, value: 420 });

    resizeCallback?.([] as ResizeObserverEntry[], {} as ResizeObserver);

    expect(chartMocks.chart.applyOptions).toHaveBeenCalledWith({ width: 420, height: 280 });
    expect(chartMocks.chart.applyOptions.mock.calls.every(([options]) => options.width <= plot.clientWidth)).toBe(true);
  });

  it('shows the hovered category and values in the tooltip', () => {
    render(
      <LightweightCategoryChart
        categories={['Periodo 1']}
        series={[{ id: 'average', label: 'Promedio', color: '#0f766e', values: [8] }]}
      />
    );

    const tooltip = screen.getByTestId('lightweight-category-chart-tooltip');
    crosshairMoveHandler?.({
      point: { x: 40, y: 20 },
      time: 1735689600,
      seriesData: new Map([[chartMocks.series, { value: 8 }]]),
    });

    expect(tooltip).toHaveTextContent('Periodo 1');
    expect(tooltip).toHaveTextContent('8.00');
    expect(tooltip).toHaveStyle({ opacity: '1' });
  });

  it('cleans up the chart and resize subscriptions on unmount', () => {
    const { unmount } = render(
      <LightweightCategoryChart
        categories={['Periodo 1']}
        series={[{ id: 'average', label: 'Promedio', color: '#0f766e', values: [8] }]}
      />
    );

    unmount();

    expect(resizeObserverDisconnect).toHaveBeenCalled();
    expect(chartMocks.chart.unsubscribeCrosshairMove).toHaveBeenCalledWith(crosshairMoveHandler);
    expect(chartMocks.chart.remove).toHaveBeenCalled();
  });
});
