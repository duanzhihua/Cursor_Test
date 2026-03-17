import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSessionContext } from "../../context/SessionContext";
import type { ChartType } from "../../mocks/data";

interface ChartToggleProps {
  activeType: ChartType;
  onChange: (type: ChartType) => void;
}

const ChartTypeToggle: React.FC<ChartToggleProps> = ({ activeType, onChange }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 999,
        border: "1px solid rgba(55,65,81,0.95)",
        padding: 2,
        backgroundColor: "rgba(15,23,42,0.9)",
      }}
    >
      {(["bar", "line"] as ChartType[]).map((type) => {
        const isActive = type === activeType;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "0.2rem 0.55rem",
              fontSize: "0.7rem",
              cursor: "pointer",
              background: isActive
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "transparent",
              color: isActive ? "#022c22" : "#9ca3af",
            }}
          >
            {type === "bar" ? "柱状图" : "折线图"}
          </button>
        );
      })}
    </div>
  );
};

type PivotedRow = Record<string, string | number>;

interface PivotResult {
  data: PivotedRow[];
  seriesNames: string[];
}

export const ChartPane: React.FC = () => {
  const { lastChartData } = useSessionContext();
  const [overrideType, setOverrideType] = useState<ChartType | null>(null);

  const hasData = lastChartData.chartSpec && lastChartData.data.length > 0;
  const activeType: ChartType = overrideType ?? (lastChartData.chartSpec?.type === "bar" ? "bar" : "line");

  const {
    xFieldDisplay,
    yFieldDisplay,
    seriesFieldDisplay,
    pivoted,
  }: {
    xFieldDisplay: string;
    yFieldDisplay: string;
    seriesFieldDisplay: string;
    pivoted: PivotResult;
  } = useMemo(() => {
    if (!lastChartData.chartSpec || lastChartData.data.length === 0) {
      return {
        xFieldDisplay: "-",
        yFieldDisplay: "-",
        seriesFieldDisplay: "",
        pivoted: { data: [], seriesNames: [] },
      };
    }

    const { chartSpec, data } = lastChartData;

    const sample = data[0] ?? {};
    const fieldNames = Object.keys(sample);

    let xField = chartSpec.x_field ?? undefined;
    let yField = chartSpec.y_field ?? undefined;
    let seriesField = chartSpec.series_field ?? undefined;

    if (!xField || !yField) {
      let inferredX: string | undefined;
      let inferredY: string | undefined;

      for (const key of fieldNames) {
        const value = sample[key];
        if (inferredX == null && typeof value === "string") {
          inferredX = key;
        }
      }

      for (const key of fieldNames) {
        if (key === inferredX) continue;
        const value = sample[key];
        if (typeof value === "number") {
          inferredY = key;
          break;
        }
      }

      // 特殊情况：只有数值列（如总额、平均值等聚合结果）
      if (!inferredX && !inferredY) {
        const numericKeys = fieldNames.filter((key) => typeof sample[key] === "number");
        if (numericKeys.length > 0) {
          const rows: PivotedRow[] = numericKeys.map((key) => ({
            metric: key,
            value: sample[key] as number,
          }));
          return {
            xFieldDisplay: "metric",
            yFieldDisplay: "value",
            seriesFieldDisplay: "",
            pivoted: { data: rows, seriesNames: ["value"] },
          };
        }
      }

      xField = xField ?? inferredX;
      yField = yField ?? inferredY;
    }

    if (!xField || !yField) {
      return {
        xFieldDisplay: chartSpec.x_field ?? "-",
        yFieldDisplay: chartSpec.y_field ?? "-",
        seriesFieldDisplay: chartSpec.series_field ?? "",
        pivoted: { data: [], seriesNames: [] },
      };
    }

    if (!seriesField) {
      const rows: PivotedRow[] = data.map((row) => ({
        [xField!]: row[xField!] as string | number,
        [yField!]: row[yField!] as string | number,
      }));
      return {
        xFieldDisplay: xField,
        yFieldDisplay: yField,
        seriesFieldDisplay: "",
        pivoted: { data: rows, seriesNames: [yField] },
      };
    }

    const xSet = new Set<string | number>();
    const seriesSet = new Set<string>();
    data.forEach((row) => {
      xSet.add(row[xField!] as string | number);
      seriesSet.add(String(row[seriesField!]));
    });

    const seriesNames = Array.from(seriesSet);
    const rows: PivotedRow[] = Array.from(xSet).map((x) => {
      const row: PivotedRow = { [xField!]: x };
      seriesNames.forEach((name) => {
        const found = data.find((r) => r[xField!] === x && String(r[seriesField!]) === name);
        row[name] = (found?.[yField!] as number | undefined) ?? 0;
      });
      return row;
    });

    return {
      xFieldDisplay: xField,
      yFieldDisplay: yField,
      seriesFieldDisplay: seriesField,
      pivoted: { data: rows, seriesNames },
    };
  }, [lastChartData]);


  return (
    <section
      style={{
        borderRadius: "1rem",
        background:
          "radial-gradient(circle at top right, rgba(56,189,248,0.22), transparent 60%), rgba(15,23,42,0.96)",
        border: "1px solid rgba(31,41,55,0.9)",
        padding: "0.85rem 0.9rem",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#e5e7eb" }}>
            图表展示（实时）
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            {lastChartData.chartSpec?.title ?? "暂无图表数据，请先发起一次查询"}
          </div>
        </div>
        <ChartTypeToggle activeType={activeType} onChange={setOverrideType} />
      </div>

        <div
          style={{
            flex: 1,
            borderRadius: "0.9rem",
            background:
              "radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(15,23,42,1))",
            border: "1px solid rgba(55,65,81,0.95)",
            padding: "0.4rem 0.5rem 0.5rem",
            minHeight: 0,
          }}
        >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
            {lastChartData.chartSpec ? (
              <>
                X 轴：{xFieldDisplay} · Y 轴：{yFieldDisplay}
                {seriesFieldDisplay ? ` · 分组：${seriesFieldDisplay}` : ""}
              </>
            ) : (
              "当前暂无图表配置"
            )}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280", maxWidth: "55%" }}>
            {lastChartData.nl2sql_analysis
              ? lastChartData.nl2sql_analysis
              : "当你发起 NL→SQL 查询后，这里会展示模型的图表建议与分析说明。"}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          {!hasData ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                color: "#6b7280",
              }}
            >
              暂无数据，请先在中间输入框发起一次查询。
            </div>
          ) : activeType === "bar" ? (
            <BarChart data={pivoted.data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey={lastChartData.chartSpec?.x_field ?? ""}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #4b5563",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#e5e7eb",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              {pivoted.seriesNames.map((name, idx) => (
                <Bar
                  key={name}
                  dataKey={name}
                  name={name}
                  fill={["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#facc15"][idx % 5]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={pivoted.data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey={lastChartData.chartSpec?.x_field ?? ""}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={{ stroke: "#4b5563" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #4b5563",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#e5e7eb",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              {pivoted.seriesNames.map((name, idx) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#facc15"][idx % 5]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
};

