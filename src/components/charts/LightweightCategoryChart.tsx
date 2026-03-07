import { useEffect, useMemo, useRef } from 'react';
import {
  AreaSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';

type SupportedSeries = 'line' | 'area' | 'histogram';

export interface LightweightCategoryChartSeries {
  id: string;
  label: string;
  type?: SupportedSeries;
  color: string;
  values: number[];
}

interface LightweightCategoryChartProps {
  categories: string[];
  series: LightweightCategoryChartSeries[];
  height?: number;
}

const DAY_IN_SECONDS = 24 * 60 * 60;
const BASE_TIMESTAMP = 1735689600 as UTCTimestamp;

const timeForIndex = (index: number) => (BASE_TIMESTAMP + index * DAY_IN_SECONDS) as UTCTimestamp;

const timeToKey = (time: Time) => {
  if (typeof time === 'number') return String(time);
  if (typeof time === 'string') return time;
  return `${time.year}-${time.month}-${time.day}`;
};

export const LightweightCategoryChart = ({
  categories,
  series,
  height = 320,
}: LightweightCategoryChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const timeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category, index) => {
      map.set(String(timeForIndex(index)), category);
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (!chartContainerRef.current || categories.length === 0 || series.length === 0) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#52606d',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(82, 96, 109, 0.08)' },
        horzLines: { color: 'rgba(82, 96, 109, 0.08)' },
      },
      crosshair: {
        vertLine: {
          color: 'rgba(14, 116, 144, 0.25)',
          width: 1,
          labelBackgroundColor: '#0f766e',
        },
        horzLine: {
          color: 'rgba(15, 118, 110, 0.2)',
          labelBackgroundColor: '#115e59',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(82, 96, 109, 0.12)',
      },
      timeScale: {
        borderColor: 'rgba(82, 96, 109, 0.12)',
        ticksVisible: true,
        timeVisible: false,
        tickMarkFormatter: (time) => timeLabelMap.get(timeToKey(time)) ?? '',
      },
      handleScroll: false,
      handleScale: false,
    });

    const chartSeries: Array<{
      definition: LightweightCategoryChartSeries;
      api: ISeriesApi<'Line' | 'Area' | 'Histogram'>;
    }> = [];

    series.forEach((item) => {
      const type = item.type ?? 'line';
      let createdSeries: ISeriesApi<'Line' | 'Area' | 'Histogram'>;

      if (type === 'area') {
        createdSeries = chart.addSeries(AreaSeries, {
          lineColor: item.color,
          topColor: `${item.color}55`,
          bottomColor: `${item.color}08`,
          lineWidth: 3,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      } else if (type === 'histogram') {
        createdSeries = chart.addSeries(HistogramSeries, {
          color: item.color,
          priceLineVisible: false,
          lastValueVisible: false,
          priceFormat: { type: 'volume' },
        });
      } else {
        createdSeries = chart.addSeries(LineSeries, {
          color: item.color,
          lineWidth: 3,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }

      createdSeries.setData(
        categories.map((_, index) => ({
          time: timeForIndex(index),
          value: Number(item.values[index] ?? 0),
          ...(type === 'histogram' ? { color: item.color } : {}),
        }))
      );

      chartSeries.push({ definition: item, api: createdSeries });
    });

    chart.timeScale().fitContent();

    const tooltip = tooltipRef.current;
    const updateTooltip = (param: Parameters<IChartApi['subscribeCrosshairMove']>[0] extends (arg: infer P) => void ? P : never) => {
      if (!tooltip || !param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        if (tooltip) tooltip.style.opacity = '0';
        return;
      }

      const lines = chartSeries
        .map(({ definition, api }) => {
          const value = param.seriesData.get(api as never);
          if (!value || !('value' in value)) return null;
          return `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${definition.color}">${definition.label}</span><strong>${Number(value.value).toFixed(2)}</strong></div>`;
        })
        .filter(Boolean)
        .join('');

      tooltip.innerHTML = `
        <div style="font-size:12px;color:#52606d;margin-bottom:6px;">${timeLabelMap.get(timeToKey(param.time)) ?? ''}</div>
        ${lines}
      `;
      tooltip.style.opacity = '1';
      tooltip.style.left = `${Math.min(param.point.x + 16, container.clientWidth - 160)}px`;
      tooltip.style.top = `${Math.max(param.point.y - 24, 12)}px`;
    };

    chart.subscribeCrosshairMove(updateTooltip);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(updateTooltip);
      chart.remove();
    };
  }, [categories, height, series, timeLabelMap]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/30 p-2" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 min-w-36 rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur transition-opacity"
        style={{ opacity: 0 }}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        {series.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LightweightCategoryChart;
