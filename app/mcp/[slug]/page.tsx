'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Settings2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getMcpConfig, saveMcpConfig, type McpConfigRecord } from '@/lib/db';
import { getMcpServerDefinition, MCP_SERVER_DEFINITIONS } from '@/lib/mcp';

const DEFAULT_CONFIG: McpConfigRecord = {
  enabled: false,
  apiKey: '',
  params: '',
};

export default function McpConfigPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const server = getMcpServerDefinition(params?.slug);

  const [config, setConfig] = useState<McpConfigRecord>(DEFAULT_CONFIG);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!server) return;
    getMcpConfig(server.key).then(setConfig).catch(console.error);
  }, [server]);

  useEffect(() => {
    if (!server) return;
    const timer = window.setTimeout(() => {
      saveMcpConfig(server.key, config)
        .then(() => setStatusNote('已自动保存到 IndexedDB'))
        .catch(console.error);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [config, server]);

  const configured = useMemo(
    () => Boolean(config.enabled || config.apiKey.trim() || config.params.trim()),
    [config]
  );

  if (!server) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F3] px-6 text-black">
        <div className="max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <div className="mb-3 inline-flex rounded-full bg-black/[0.04] p-3 text-black/70">
            <Settings2 className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-2xl">找不到这个 MCP</h1>
          <p className="mt-2 text-sm text-black/45">请从主页面的 MCP 模块进入有效配置页。</p>
          <button onClick={() => router.push('/')} className="mt-5 rounded-xl bg-black px-4 py-2 text-sm text-white">
            返回首页
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-4">
          <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-black/75">
            <ArrowLeft className="h-4 w-4" /> 返回聊天
          </button>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.25em] text-black/35">MCP 设置页</div>
            <div className="text-sm text-black/55">单独配置当前模块</div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <aside className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${configured ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-black/25'}`} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-black/45">{configured ? '已配置' : '未配置'}</span>
            </div>
            <h1 className="mt-4 font-serif text-4xl tracking-tight">{server.title}</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-black/50">{server.description}</p>

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60">
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/35">配置提示</div>
              <p>在这里单独配置这个 MCP 的启用状态、API Key 与额外参数。修改会自动保存到浏览器 IndexedDB，并在聊天时同步给后端上下文。</p>
            </div>

            <div className="mt-6 space-y-2">
              {MCP_SERVER_DEFINITIONS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => router.push(`/mcp/${item.key}`)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${item.key === server.key ? 'border-black/10 bg-black text-white' : 'border-black/10 bg-white text-black/70 hover:bg-black/[0.03]'}`}
                >
                  <span>{item.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${item.key === server.key ? 'bg-white/10 text-white/75' : 'bg-black/[0.04] text-black/35'}`}>
                    {item.key === server.key ? '当前' : '切换'}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-black/35">Current MCP</div>
                <h2 className="mt-1 font-serif text-2xl">{server.title}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">
                <ShieldCheck className="h-4 w-4" /> 自动保存
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">启用 MCP</div>
                  <div className="text-xs text-black/40">开启后会在聊天上下文中读取该 MCP 配置</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="h-5 w-5"
                />
              </label>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/25"
                  placeholder={`配置 ${server.title} 的密钥`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">参数</label>
                <textarea
                  rows={6}
                  value={config.params}
                  onChange={(e) => setConfig((prev) => ({ ...prev, params: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/25"
                  placeholder='例如: {"timeout": 3000, "mode": "safe"}'
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-xs text-black/45">
              <span>{statusNote || '修改后会自动保存'}</span>
              <button
                type="button"
                onClick={async () => {
                  await saveMcpConfig(server.key, config);
                  setStatusNote('已手动保存');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white"
              >
                <Check className="h-4 w-4" /> 保存配置
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}