import type { Session, Message } from "../types";

export const mockSessions: Session[] = [
  {
    id: "session-1",
    title: "Python 快速排序实现",
    created_at: "2026-03-04T08:00:00Z",
    updated_at: "2026-03-04T08:05:00Z",
  },
  {
    id: "session-2",
    title: "React Hooks 最佳实践",
    created_at: "2026-03-03T14:00:00Z",
    updated_at: "2026-03-03T14:30:00Z",
  },
  {
    id: "session-3",
    title: "数学证明：质数无穷",
    created_at: "2026-03-02T10:00:00Z",
    updated_at: "2026-03-02T10:20:00Z",
  },
];

export const mockMessages: Record<string, Message[]> = {
  "session-1": [
    {
      id: "msg-1-1",
      role: "user",
      content: "请用 Python 实现快速排序算法，并解释时间复杂度。",
      created_at: "2026-03-04T08:00:00Z",
    },
    {
      id: "msg-1-2",
      role: "assistant",
      content: `## 快速排序 (Quick Sort)

快速排序是一种基于**分治策略**的排序算法。

### Python 实现

\`\`\`python
def quick_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quick_sort(numbers))  # [1, 1, 2, 3, 6, 8, 10]
\`\`\`

### 时间复杂度

| 情况 | 时间复杂度 | 说明 |
|------|-----------|------|
| 最好 | O(n log n) | 每次划分均匀 |
| 平均 | O(n log n) | 随机数据 |
| 最坏 | O(n²) | 已排序数据 |

> **提示**: 实际应用中可通过随机选择 pivot 来避免最坏情况。`,
      model: "deepseek-chat",
      created_at: "2026-03-04T08:00:30Z",
    },
    {
      id: "msg-1-3",
      role: "user",
      content: "能否用原地排序的方式重新实现？",
      created_at: "2026-03-04T08:03:00Z",
    },
    {
      id: "msg-1-4",
      role: "assistant",
      content: `当然！下面是**原地排序**版本，不使用额外数组空间：

\`\`\`python
def quick_sort_inplace(arr: list[int], low: int = 0, high: int | None = None) -> None:
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quick_sort_inplace(arr, low, pi - 1)
        quick_sort_inplace(arr, pi + 1, high)

def partition(arr: list[int], low: int, high: int) -> int:
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
\`\`\`

空间复杂度从 O(n) 降低到 O(log n)（递归栈空间）。`,
      model: "deepseek-chat",
      created_at: "2026-03-04T08:03:30Z",
    },
  ],

  "session-2": [
    {
      id: "msg-2-1",
      role: "user",
      content: "React 中 useEffect 和 useLayoutEffect 有什么区别？",
      created_at: "2026-03-03T14:00:00Z",
    },
    {
      id: "msg-2-2",
      role: "assistant",
      content: `两者的核心区别在于**执行时机**：

- \`useEffect\` 在浏览器**绑制完成后**异步执行
- \`useLayoutEffect\` 在 DOM 更新后、浏览器**绘制之前**同步执行

### 何时使用 useLayoutEffect？

当你需要在绘制前**读取或修改 DOM 布局**时：

\`\`\`tsx
function Tooltip({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const rect = targetRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [targetRef]);

  return <div style={{ position: 'fixed', ...pos }}>Tooltip content</div>;
}
\`\`\`

### 总结

| 特性 | useEffect | useLayoutEffect |
|------|-----------|-----------------|
| 执行时机 | 绘制后（异步） | 绘制前（同步） |
| 是否阻塞渲染 | 否 | 是 |
| 常见用途 | 数据请求、订阅 | DOM 测量、动画 |`,
      model: "deepseek-chat",
      created_at: "2026-03-03T14:01:00Z",
    },
  ],

  "session-3": [
    {
      id: "msg-3-1",
      role: "user",
      content: "请证明质数有无穷多个。",
      created_at: "2026-03-02T10:00:00Z",
    },
    {
      id: "msg-3-2",
      role: "assistant",
      reasoning_content: `用户要求证明质数有无穷多个，这是一个经典的数论问题。

最经典的证明来自欧几里得，使用反证法。

思路：
1. 假设质数的数量是有限的，设为 p₁, p₂, ..., pₙ
2. 构造数 N = p₁ × p₂ × ... × pₙ + 1
3. N 除以任何已知质数 pᵢ 都余 1，所以 N 不能被任何 pᵢ 整除
4. 因此 N 要么自身是质数，要么有一个不在列表中的质因子
5. 这与假设矛盾

这个证明简洁而优美，让我整理一下格式化的证明过程。`,
      content: `## 欧几里得定理：质数有无穷多个

### 证明（反证法）

**假设**：质数的数量是有限的，全部质数为 $p_1, p_2, \\ldots, p_n$。

**构造**：令

$$N = p_1 \\times p_2 \\times \\cdots \\times p_n + 1$$

**推导**：

1. 对于任意 $p_i$（$1 \\leq i \\leq n$），$N$ 除以 $p_i$ 余数为 **1**
2. 因此 $N$ 不能被任何已知质数整除
3. 由算术基本定理，$N > 1$ 必有质因子
4. 该质因子不在 $\\{p_1, p_2, \\ldots, p_n\\}$ 中

**结论**：这与"全部质数已列出"的假设矛盾。因此质数有无穷多个。$\\blacksquare$`,
      model: "deepseek-reasoner",
      created_at: "2026-03-02T10:01:00Z",
    },
  ],
};
