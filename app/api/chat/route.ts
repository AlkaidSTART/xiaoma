import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cookies } from 'next/headers';

export const maxDuration = 30;

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token !== 'admin') {
    return new Response(
      JSON.stringify({ error: '401 Unauthorized. API access requires admin credentials.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
