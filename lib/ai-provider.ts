import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.THIRD_PARTY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.THIRD_PARTY_BASE_URL || process.env.BASE_URL || '';

if (!apiKey) {
  throw new Error('Missing THIRD_PARTY_API_KEY (or OPENAI_API_KEY).');
}

const provider = createOpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
  name: 'baishan',
});

export function getThirdPartyModel(modelName?: string) {
  const model = modelName || process.env.THIRD_PARTY_MODEL || 'deepseek-chat';
  // Baishan OpenAI-compatible API does not support /responses; force /chat/completions.
  return provider.chat(model as Parameters<typeof provider.chat>[0]);
}
