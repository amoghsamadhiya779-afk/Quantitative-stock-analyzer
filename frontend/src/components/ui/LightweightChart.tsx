"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries, HistogramSeries, LineSeries } from "lightweight-charts";

interface SeriesData {
  time: Time;
  value: number;
}

interface LightweightChartProps {
  data: SeriesData[];
  type?: "line" | "area" | "histogram";
  color?: string;
  height?: number;
}

export default function LightweightChart({ data, type = "area", color = "#ff682c", height = 300 }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#828282", // var(--color-slate)
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(232, 232, 232, 0.4)" }, // var(--color-chalk)
        horzLines: { color: "rgba(232, 232, 232, 0.4)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });
    chartRef.current = chart;

    if (type === "area") {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: color,
        topColor: `${color}4D`, // 30% opacity
        bottomColor: `${color}00`, // 0% opacity
        lineWidth: 2,
      }) as any;
    } else if (type === "histogram") {
      seriesRef.current = chart.addSeries(HistogramSeries, {
        color: color,
      }) as any;
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: color,
        lineWidth: 2,
      }) as any;
    }

    seriesRef.current?.setData(data);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, type, color, height]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
