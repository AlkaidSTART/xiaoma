export interface ModelConfig {
  name: string;
  displayName: string;
  type: 'general' | 'code' | 'distill';
  provider: 'qwen' | 'deepseek' | 'kimi' | 'glm';
  mode: 'fast' | 'balanced' | 'reasoning' | 'coder';
  date: string;
}

export const availableModels: ModelConfig[] = [
  { name: 'Qwen3-30B-A3B-FP8', displayName: 'Qwen3-30B', type: 'general', provider: 'qwen', mode: 'fast', date: '2025/7/3' },
  { name: 'DeepSeek-R1-0528-Qwen3-8B', displayName: 'DeepSeek-R1-8B', type: 'distill', provider: 'deepseek', mode: 'reasoning', date: '2025/7/3' },
  { name: 'DeepSeek-R1-0528', displayName: 'DeepSeek-R1', type: 'general', provider: 'deepseek', mode: 'reasoning', date: '2025/7/3' },
  { name: 'DeepSeek-V3', displayName: 'DeepSeek-V3', type: 'general', provider: 'deepseek', mode: 'balanced', date: '2025/7/4' },
  { name: 'Qwen3-235B-A22B', displayName: 'Qwen3-235B', type: 'general', provider: 'qwen', mode: 'balanced', date: '2025/7/4' },
  { name: 'DeepSeek-R1-Distill-Qwen-14B', displayName: 'DeepSeek-R1-Distill-14B', type: 'distill', provider: 'deepseek', mode: 'reasoning', date: '2025/7/4' },
  { name: 'DeepSeek-R1-Distill-Qwen-32B', displayName: 'DeepSeek-R1-Distill-32B', type: 'distill', provider: 'deepseek', mode: 'reasoning', date: '2025/7/4' },
  { name: 'Qwen2.5-72B-Instruct', displayName: 'Qwen2.5-72B', type: 'general', provider: 'qwen', mode: 'balanced', date: '2025/7/4' },
  { name: 'Qwen2.5-72B-Instruct-128K', displayName: 'Qwen2.5-72B-128K', type: 'general', provider: 'qwen', mode: 'balanced', date: '2025/7/4' },
  { name: 'Kimi-K2-Instruct', displayName: 'Kimi-K2', type: 'general', provider: 'kimi', mode: 'fast', date: '2025/7/16' },
  { name: 'Qwen3-235B-A22B-2507', displayName: 'Qwen3-235B-2507', type: 'general', provider: 'qwen', mode: 'balanced', date: '2025/7/22' },
  { name: 'Qwen3-Coder-480B-A35B-Instruct', displayName: 'Qwen3-Coder-480B', type: 'code', provider: 'qwen', mode: 'coder', date: '2025/7/23' },
  { name: 'GLM-4.5', displayName: 'GLM-4.5', type: 'general', provider: 'glm', mode: 'balanced', date: '2025/7/23' },
];
