import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    result[key] = value;
    i += 1;
  }

  return result;
}

async function main() {
  const args = parseArgs();
  const packageSpec = args.package ?? 'file:/tmp/mcp-server.tgz';

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', packageSpec],
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  const client = new Client({ name: 'mcp-npx-tools-list', version: '1.0.0' });
  await client.connect(transport);

  try {
    const { tools } = await client.listTools();
    if (!Array.isArray(tools) || tools.length === 0) {
      throw new Error('No tools returned by npx MCP server');
    }
    if (!tools.some((tool) => tool.name === 'letsrunit_session_start')) {
      throw new Error('npx MCP server missing letsrunit_session_start tool');
    }
  } finally {
    await client.close();
  }
}

await main();
