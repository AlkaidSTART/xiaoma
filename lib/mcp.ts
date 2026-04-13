export type McpServerKey = 'context7' | 'github' | 'playwright' | 'filesystem' | 'chrome' | 'macos';

export interface McpServerDefinition {
  key: McpServerKey;
  title: string;
  description: string;
}

export const MCP_SERVER_DEFINITIONS: McpServerDefinition[] = [
  { key: 'context7', title: 'Context7 MCP', description: '文档与知识上下文检索' },
  { key: 'github', title: 'GitHub MCP Server', description: '仓库、Issue 与 PR 自动化' },
  { key: 'playwright', title: 'Playwright MCP', description: '浏览器自动化与页面验证' },
  { key: 'filesystem', title: 'Filesystem MCP', description: '本地文件读取与写入' },
  { key: 'chrome', title: 'Chrome MCP', description: '浏览器调试与页面控制' },
  { key: 'macos', title: 'macOS MCP', description: '系统级快捷操作与自动化' },
];

export const MCP_SERVER_KEYS = MCP_SERVER_DEFINITIONS.map((server) => server.key);

export function getMcpServerDefinition(key: string | undefined) {
  return MCP_SERVER_DEFINITIONS.find((server) => server.key === key);
}