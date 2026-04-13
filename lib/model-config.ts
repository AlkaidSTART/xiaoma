export interface ModelConfig {
  name: string;
  displayName: string;
  type: 'general' | 'code' | 'vl' | 'embedding' | 'reranker' | 'distill';
  date: string;
}

export const availableModels: ModelConfig[] = [
  { name: 'Qwen3-30B-A3B-FP8', displayName: 'Qwen3-30B', type: 'general', date: '2025/7/3' },
  { name: 'DeepSeek-R1-0528-Qwen3-8B', displayName: 'DeepSeek-R1-8B', type: 'distill', date: '2025/7/3' },
  { name: 'DeepSeek-R1-0528', displayName: 'DeepSeek-R1', type: 'general', date: '2025/7/3' },
  { name: 'BAAI/bge-m3', displayName: 'bge-m3', type: 'embedding', date: '2025/7/3' },
  { name: 'bge-reranker-v2-m3', displayName: 'bge-reranker-v2', type: 'reranker', date: '2025/7/3' },
  { name: 'Qwen3-Reranker-8B', displayName: 'Qwen3-Reranker-8B', type: 'reranker', date: '2025/7/3' },
  { name: 'Qwen3-Reranker-4B', displayName: 'Qwen3-Reranker-4B', type: 'reranker', date: '2025/7/3' },
  { name: 'Qwen3-Reranker-0.6B', displayName: 'Qwen3-Reranker-0.6B', type: 'reranker', date: '2025/7/3' },
  { name: 'DeepSeek-V3', displayName: 'DeepSeek-V3', type: 'general', date: '2025/7/4' },
  { name: 'Qwen3-235B-A22B', displayName: 'Qwen3-235B', type: 'general', date: '2025/7/4' },
  { name: 'DeepSeek-R1-Distill-Qwen-14B', displayName: 'DeepSeek-R1-Distill-14B', type: 'distill', date: '2025/7/4' },
  { name: 'DeepSeek-R1-Distill-Qwen-32B', displayName: 'DeepSeek-R1-Distill-32B', type: 'distill', date: '2025/7/4' },
  { name: 'Qwen2.5-72B-Instruct', displayName: 'Qwen2.5-72B', type: 'general', date: '2025/7/4' },
  { name: 'Qwen2.5-72B-Instruct-128K', displayName: 'Qwen2.5-72B-128K', type: 'general', date: '2025/7/4' },
  { name: 'Qwen2.5-VL-7B-Instruct', displayName: 'Qwen2.5-VL-7B', type: 'vl', date: '2025/7/4' },
  { name: 'Kimi-K2-Instruct', displayName: 'Kimi-K2', type: 'general', date: '2025/7/16' },
  { name: 'Qwen3-235B-A22B-2507', displayName: 'Qwen3-235B-2507', type: 'general', date: '2025/7/22' },
  { name: 'Qwen3-Coder-480B-A35B-Instruct', displayName: 'Qwen3-Coder-480B', type: 'code', date: '2025/7/23' },
  { name: 'GLM-4.5', displayName: 'GLM-4.5', type: 'general', date: '2025/7/23' },
];
