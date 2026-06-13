import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Candle, TargetLevel } from '../types';
import { useContractStore } from '../lib/store';

interface InteractiveChartProps {
  candles: Candle[];
  fvgs?: any[];
  liquidityEvents?: any[];
  targets?: TargetLevel[];
  priceDecimals?: number;
  timeframe: string;
  selectedTicker: string;
  showFVGs?: boolean;
  showLiquiditySweeps?: boolean;
  showDisplacementEvents?: boolean;
  onPlaceAuditTrade?: (direction: 'BULLISH' | 'BEARISH', entry: number, target: number, stop: number) => void;
  triggerInvalidation?: boolean;
}

export function InteractiveChart({
  candles,
  fvgs = [],
  liquidityEvents = [],
  targets = [],
  priceDecimals = 2,
  timeframe,
  selectedTicker,
  showFVGs = true,
  showLiquiditySweeps = true,
  showDisplacementEvents = true,
  onPlaceAuditTrade,
  triggerInvalidation
}: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const fvgSeriesRefs = useRef<any[]>([]);

  const themeMode = useContractStore(s => s.themeMode);
  const isLight = themeMode === 'light';

  // Format candles for lightweight-charts: must contain time (seconds), open, high, low, close
  const chartData = useMemo(() => {
    return candles.map((c) => {
      // Use standard c.timestamp as defined in types.ts (milliseconds)
      const timeSecs = Math.floor(c.timestamp / 1000);
      return {
        time: timeSecs,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      };
    }).sort((a, b) => (a.time as number) - (b.time as number));
  }, [candles]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create Chart once, using deep configuration
    const chart: any = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 200,
      layout: {
        background: { color: isLight ? '#ffffff' : '#000000' },
        textColor: isLight ? '#1f2937' : '#a1a1aa',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: isLight ? '#f3f4f6' : '#09090b' },
        horzLines: { color: isLight ? '#f3f4f6' : '#09090b' },
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: isLight ? '#4b5563' : '#ffffff',
          width: 1, // LineWidth must be integer e.g., 1
          style: 1 // Dashed line style
        },
        horzLine: {
          color: isLight ? '#4b5563' : '#ffffff',
          width: 1,
          style: 1
        }
      },
      timeScale: {
        borderColor: isLight ? '#e5e7eb' : '#18181b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 2. Add Candlestick Series once with high contrast neon branding
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff4545',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff4545',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff4545',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Initialize series markers plugin once
    const seriesMarkers = createSeriesMarkers(candlestickSeries, []);
    markersRef.current = seriesMarkers;

    // 3. Setup fluid Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.resize(width, height || 200);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        if (markersRef.current) {
          try {
            markersRef.current.detach();
          } catch (e) {}
        }
        if (chartRef.current) {
          chartRef.current.remove();
        }
      } catch (e) {
        console.error('Clearing chart error', e);
      }
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update options dynamically when theme changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { color: isLight ? '#ffffff' : '#000000' },
          textColor: isLight ? '#1f2937' : '#a1a1aa',
        },
        grid: {
          vertLines: { color: isLight ? '#f3f4f6' : '#09090b' },
          horzLines: { color: isLight ? '#f3f4f6' : '#09090b' },
        },
        crosshair: {
          vertLine: {
            color: isLight ? '#4b5563' : '#ffffff',
          },
          horzLine: {
            color: isLight ? '#4b5563' : '#ffffff',
          }
        },
        timeScale: {
          borderColor: isLight ? '#e5e7eb' : '#18181b',
        }
      });
    }
  }, [isLight]);

  // Update Candlestick Series data smoothly instead of deleting
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData);
    }
  }, [chartData]);

  // Handle markers and overlay updates smoothly
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    const markers: any[] = [];

    // 1. Draw Liquidity Sweeps
    if (showLiquiditySweeps && liquidityEvents.length > 0) {
      liquidityEvents.forEach((evt) => {
        const timeSecs = Math.floor(evt.timestamp / 1000);
        const matchesCandle = chartData.some(d => d.time === timeSecs);
        if (matchesCandle) {
          markers.push({
            time: timeSecs,
            position: evt.type === 'sweep_high' ? 'aboveBar' : 'belowBar',
            color: evt.type === 'sweep_high' ? '#ff4545' : '#00ff88',
            shape: 'arrowDown',
            text: `SWEEP`
          });
        }
      });
    }

    // 2. Draw Targets (T1/T2 as markers at the last known candle)
    if (targets && targets.length > 0 && chartData.length > 0) {
      const lastCandle = chartData[chartData.length - 1];
      targets.forEach((tgt) => {
        markers.push({
          time: lastCandle.time,
          position: 'aboveBar',
          color: '#4f8cff',
          shape: 'pin',
          text: `${tgt.label}: ${(tgt.price ?? 0).toFixed(1)}`
        });
      });
    }

    // Set interactive markers on the series
    if (markersRef.current) {
      markersRef.current.setMarkers(markers);
    }

    // Clean up old FVG overlays
    fvgSeriesRefs.current.forEach(s => {
      try {
        if (chartRef.current) chartRef.current.removeSeries(s);
      } catch (e) {}
    });
    fvgSeriesRefs.current = [];

    // 3. Draw FVG Zones as solid lines in the margin area
    if (showFVGs && fvgs.length > 0) {
      fvgs.slice(0, 3).forEach((fvg) => {
        if (!chartRef.current) return;
        const fvgLine = chartRef.current.addSeries(LineSeries, {
          color: fvg.type === 'bullish' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 69, 69, 0.4)',
          lineWidth: 1,
          lineStyle: 1, // Dotted style
          title: 'FVG'
        });

        // Set line points from start to now
        const points = chartData
          .filter(d => d.time >= Math.floor(fvg.startTime / 1000))
          .map(d => ({
            time: d.time,
            value: fvg.midPrice
          }));

        if (points.length > 0) {
          fvgLine.setData(points);
          fvgSeriesRefs.current.push(fvgLine);
        }
      });
    }

  }, [chartData, showLiquiditySweeps, liquidityEvents, targets, showFVGs, fvgs]);

  return (
    <div className="w-full h-full relative bg-black flex flex-col border border-zinc-900 rounded-sm">
      {/* Chart canvas DOM */}
      <div 
        ref={containerRef} 
        className="w-full flex-1 min-h-[140px]" 
        style={{ minHeight: '140px' }}
      />
    </div>
  );
}
