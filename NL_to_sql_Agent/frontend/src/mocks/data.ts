export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ChartType = "bar" | "line";

export interface ChartSpec {
  type: ChartType;
  title: string;
  xField: string;
  yField: string;
  seriesField?: string;
}

export interface SessionMockData {
  session: Session;
  messages: Message[];
  chartSpec: ChartSpec;
  chartData: Array<Record<string, number | string>>;
}

export const mockSessions: SessionMockData[] = [
  {
    session: {
      id: "s1",
      name: "最近 7 天销售趋势",
      createdAt: "2026-03-10T09:00:00Z",
      updatedAt: "2026-03-16T08:10:00Z",
    },
    messages: [
      {
        id: "m1",
        role: "user",
        content: "最近 7 天各渠道的销售额趋势如何？",
        createdAt: "2026-03-16T08:00:00Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "过去 7 天整体销售额稳步上升，线上渠道增速略快于线下，周末两个峰值较为明显。",
        createdAt: "2026-03-16T08:00:05Z",
      },
    ],
    chartSpec: {
      type: "line",
      title: "最近 7 天销售趋势",
      xField: "date",
      yField: "amount",
      seriesField: "channel",
    },
    chartData: [
      { date: "03-10", channel: "线上", amount: 120 },
      { date: "03-10", channel: "线下", amount: 80 },
      { date: "03-11", channel: "线上", amount: 130 },
      { date: "03-11", channel: "线下", amount: 90 },
      { date: "03-12", channel: "线上", amount: 150 },
      { date: "03-12", channel: "线下", amount: 95 },
      { date: "03-13", channel: "线上", amount: 160 },
      { date: "03-13", channel: "线下", amount: 110 },
      { date: "03-14", channel: "线上", amount: 190 },
      { date: "03-14", channel: "线下", amount: 130 },
      { date: "03-15", channel: "线上", amount: 210 },
      { date: "03-15", channel: "线下", amount: 140 },
      { date: "03-16", channel: "线上", amount: 230 },
      { date: "03-16", channel: "线下", amount: 155 },
    ],
  },
  {
    session: {
      id: "s2",
      name: "本月产品销售排行",
      createdAt: "2026-03-01T09:00:00Z",
      updatedAt: "2026-03-15T12:30:00Z",
    },
    messages: [
      {
        id: "m3",
        role: "user",
        content: "本月销量靠前的产品有哪些？",
        createdAt: "2026-03-15T12:20:00Z",
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "本月 Top 5 产品中，A 系列和 B 系列贡献了超过 60% 的销售额，其中 A-Plus 单品表现最佳。",
        createdAt: "2026-03-15T12:20:06Z",
      },
    ],
    chartSpec: {
      type: "bar",
      title: "本月产品销售 Top 5",
      xField: "product",
      yField: "amount",
    },
    chartData: [
      { product: "A-Plus", amount: 520 },
      { product: "A-Standard", amount: 410 },
      { product: "B-Max", amount: 360 },
      { product: "C-Lite", amount: 280 },
      { product: "D-Pro", amount: 240 },
    ],
  },
  {
    session: {
      id: "s3",
      name: "地区销售对比",
      createdAt: "2026-02-20T10:00:00Z",
      updatedAt: "2026-03-14T16:45:00Z",
    },
    messages: [
      {
        id: "m5",
        role: "user",
        content: "东部和西部大区最近 30 天的销售额对比？",
        createdAt: "2026-03-14T16:30:00Z",
      },
      {
        id: "m6",
        role: "assistant",
        content:
          "东部大区整体销售额高于西部，但西部在近一周增长更快，建议关注西部的拉新活动转化情况。",
        createdAt: "2026-03-14T16:30:07Z",
      },
    ],
    chartSpec: {
      type: "line",
      title: "最近 30 天大区销售额",
      xField: "date",
      yField: "amount",
      seriesField: "region",
    },
    chartData: [
      { date: "第 1 周", region: "东部", amount: 800 },
      { date: "第 1 周", region: "西部", amount: 520 },
      { date: "第 2 周", region: "东部", amount: 860 },
      { date: "第 2 周", region: "西部", amount: 600 },
      { date: "第 3 周", region: "东部", amount: 910 },
      { date: "第 3 周", region: "西部", amount: 720 },
      { date: "第 4 周", region: "东部", amount: 950 },
      { date: "第 4 周", region: "西部", amount: 810 },
    ],
  },
];

