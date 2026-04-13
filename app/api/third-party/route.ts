import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { getThirdPartyModel } from '@/lib/ai-provider';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = (body?.messages ?? []) as UIMessage[];
        const modelName = body?.model;
        const systemPrompt = process.env.THIRD_PARTY_SYSTEM_PROMPT || '你是一个高级程序员，请根据用户的问题给出回答。';
        const mcpConfigs = Array.isArray(body?.mcpConfigs)
            ? (body.mcpConfigs as Array<{
                key: string;
                title?: string;
                enabled?: boolean;
                configured?: boolean;
                apiKeyConfigured?: boolean;
                params?: string;
            }>)
            : [];

        if (!Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid request body: messages must be an array.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const mcpPrompt = mcpConfigs.length > 0
            ? `\n\n当前用户 MCP 配置：\n${mcpConfigs
                .map((config) => {
                    const enabledText = config.enabled ? '启用' : '未启用';
                    const configuredText = config.configured ? '已配置' : '未配置';
                    const paramsText = config.params?.trim() || '无';
                    return `- ${config.title || config.key}: ${enabledText} / ${configuredText} / 参数: ${paramsText}`;
                })
                .join('\n')}`
            : '\n\n当前用户 MCP 配置：未启用';

        const result = streamText({
            model: getThirdPartyModel(modelName),
            messages: await convertToModelMessages(messages),
            system: `${systemPrompt}${mcpPrompt}`,
            temperature: typeof body?.temperature === 'number' ? body.temperature : undefined,
            maxOutputTokens: typeof body?.max_tokens === 'number' ? body.max_tokens : undefined,
            topP: typeof body?.top_p === 'number' ? body.top_p : undefined,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Third-party API request failed.';
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}