"use client";

import { useState, useRef, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
} from "recharts";
import {
  Download, Share2, Maximize2, Minimize2, BarChart3, TrendingUp,
  PieChart as PieIcon, Activity, X, Copy, Check,
} from "lucide-react";

type ChartType = "bar" | "line" | "area" | "pie";

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface InteractiveChartProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  dataKeys?: string[];
  colors?: string[];
  defaultType?: ChartType;
  allowedTypes?: ChartType[];
  height?: number;
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
}

const CHART_COLORS = [
  "#2a7c7c", "#3b9e9e", "#d4840a", "#6366f1", "#c53838",
  "#1a7a3a", "#8b5cf6", "#ea580c", "#2563eb", "#db2777",
];

const TYPE_ICONS: Record<ChartType, typeof BarChart3> = {
  bar: BarChart3,
  line: TrendingUp,
  area: Activity,
  pie: PieIcon,
};

const CustomTooltip = ({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl text-xs"
      style={{ background: "rgba(255,255,255,0.97)", border: "1px solid #e2e6ec", backdropFilter: "blur(12px)" }}>
      {label && <div className="text-secondary mb-1.5 font-medium">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-secondary">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function InteractiveChart({
  title,
  subtitle,
  data,
  dataKeys = ["value"],
  colors = CHART_COLORS,
  defaultType = "bar",
  allowedTypes = ["bar", "line", "area", "pie"],
  height = 300,
  valueFormatter,
  showLegend = false,
}: InteractiveChartProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultType);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.scale(2, 2);
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `staffradar-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [title]);

  const handleShare = useCallback(async () => {
    const text = `${title}\n${data.map((d) => `${d.name}: ${valueFormatter ? valueFormatter(d.value) : d.value}`).join("\n")}`;
    if (navigator.share) {
      await navigator.share({ title, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [title, data, valueFormatter]);

  const chartHeight = expanded ? 500 : height;

  const renderChart = () => {
    const fmt = valueFormatter || ((v: number) => v.toLocaleString());

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={chartHeight * 0.2}
              outerRadius={chartHeight * 0.35}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={fmt} />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "var(--text-secondary)" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = chartType === "line" ? LineChart : chartType === "area" ? AreaChart : BarChart;

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ChartComponent data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#8896a6", fontSize: 11 }}
            axisLine={{ stroke: "#e2e6ec" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#8896a6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmt(v)}
          />
          <Tooltip content={<CustomTooltip formatter={fmt} />} cursor={{ fill: "rgba(42, 124, 124, 0.04)" }} />
          {showLegend && (
            <Legend wrapperStyle={{ fontSize: "11px", color: "var(--text-secondary)" }} iconType="circle" iconSize={8} />
          )}
          {dataKeys.map((key, i) => {
            if (chartType === "area") {
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: colors[i % colors.length], stroke: "var(--bg-deep)", strokeWidth: 2 }}
                />
              );
            }
            if (chartType === "line") {
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: colors[i % colors.length], stroke: "var(--bg-deep)", strokeWidth: 2 }}
                />
              );
            }
            return (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[i % colors.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const Wrapper = expanded ? "div" : "div";
  const wrapperClass = expanded
    ? "fixed inset-0 z-50 flex items-center justify-center p-8"
    : "";
  const panelClass = expanded
    ? "w-full max-w-5xl max-h-full overflow-auto glass rounded-2xl p-6"
    : "glass rounded-2xl p-5";

  return (
    <>
      {expanded && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setExpanded(false)} />}
      <div className={wrapperClass}>
        <div className={panelClass} ref={chartRef}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
              {/* Chart type switcher */}
              {allowedTypes.length > 1 && (
                <div className="flex items-center rounded-lg p-0.5 mr-1" style={{ background: "var(--bg-surface)" }}>
                  {allowedTypes.map((type) => {
                    const Icon = TYPE_ICONS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`p-1.5 rounded-md transition ${
                          chartType === type
                            ? "bg-cyan-500/15 text-cyan-400"
                            : "text-muted hover:text-secondary"
                        }`}
                        title={type}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <button onClick={handleDownload} className="p-1.5 rounded-lg text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition" title="Download PNG">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleShare} className="p-1.5 rounded-lg text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition" title="Copy data">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition" title={expanded ? "Minimize" : "Expand"}>
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              {expanded && (
                <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition ml-1" title="Close">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Chart */}
          {data.length === 0 ? (
            <div className="flex items-center justify-center text-muted text-sm" style={{ height: chartHeight }}>
              No data available
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </>
  );
}
