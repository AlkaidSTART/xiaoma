import type { UIMessage } from 'ai';

export interface ThirdPartyChatResponse {
  text: string;
  raw: unknown;
}

function readMessageText(message: UIMessage): string {
  const unknownMessage = message as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof unknownMessage.content === 'string') return unknownMessage.content;

  if (Array.isArray(unknownMessage.parts)) {
    return unknownMessage.parts
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim();
  }

  return '';
}

function extractTextFromResponse(data: any): string {
  if (typeof data?.output_text === 'string') return data.output_text;
  if (typeof data?.text === 'string') return data.text;

  const choiceText = data?.choices?.[0]?.message?.content;
  if (typeof choiceText === 'string') return choiceText;

  if (Array.isArray(choiceText)) {
    return choiceText
      .map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
      .join('')
      .trim();
  }

  return '';
}

export async function requestThirdPartyChat(messages: UIMessage[]): Promise<ThirdPartyChatResponse> {
  const endpoint = process.env.THIRD_PARTY_API_URL;
  const apiKey = process.env.THIRD_PARTY_API_KEY;
  const model = process.env.THIRD_PARTY_MODEL || 'default-model';
  const timeoutMs = Number(process.env.THIRD_PARTY_TIMEOUT_MS || 20000);

  if (!endpoint) {
    throw new Error('Missing THIRD_PARTY_API_URL.');
  }

  const payload = {
    model,
    messages: messages.map((message) => ({
      role: message.role,
      content: readMessageText(message),
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Third-party API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      text: extractTextFromResponse(data),
      raw: data,
    };
  } finally {
    clearTimeout(timeout);
  }
}